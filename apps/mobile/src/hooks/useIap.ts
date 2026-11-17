/**
 * useIap — Google Play Billing hook wrapper for Trophy Games.
 *
 * Wraps react-native-iap's built-in useIAP hook (v15+) to integrate
 * with Convex purchase recording.
 *
 * IMPORTANT: Requires a dev client or production build (native code).
 * Expo Go will gracefully show a notice.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { ALL_PRODUCT_IDS } from '@trophy-games/shared/subscriptions';
import { useQuery } from 'convex/react';
import { api } from '@trophy-games/backend';

// ══════════════════════════════════════════════════════════════════
// Lazy-load react-native-iap (may fail in Expo Go / non-native)
// ══════════════════════════════════════════════════════════════════

interface PurchaseLike {
  productId?: string;
  purchaseToken?: string;
}

interface IapErrorLike {
  message?: string;
}

interface UseIapResult {
  connected?: boolean;
  products?: ProductSubscription[];
  subscriptions?: ProductSubscription[];
  fetchProducts?: (params: { skus: string[]; type: string }) => Promise<unknown>;
  getAvailablePurchases?: () => Promise<unknown>;
  requestPurchase?: (params: {
    request: { google: { skus: string[] } };
    type: string;
  }) => Promise<unknown>;
}

interface IapModule {
  useIAP?: (options: {
    onPurchaseSuccess?: (purchase: PurchaseLike) => void;
    onPurchaseError?: (error: IapErrorLike) => void;
  }) => UseIapResult | null;
  finishTransaction?: (params: {
    purchase: PurchaseLike;
    isConsumable: boolean;
  }) => Promise<unknown>;
}

let iapModule: IapModule | null = null;
let iapLoadError: string | null = null;

function getIapModule(): IapModule | null {
  if (iapModule !== null) return iapModule;
  try {
    iapModule = require('react-native-iap') as IapModule;
  } catch (error: unknown) {
    iapLoadError = error instanceof Error ? error.message : String(error);
    console.warn('[useIap] react-native-iap not available:', iapLoadError);
    iapModule = null;
  }
  return iapModule;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

export type ActiveSubscription = {
  tier: 'vip' | 'paid';
  productId: string;
  expiresAt: string | undefined;
};

/** Minimal shape matching v15 ProductSubscription.id and displayPrice */
export interface ProductSubscription {
  id: string;
  displayPrice?: string;
  price?: string;
  title?: string;
  description?: string;
  type?: string;
}

interface UseIapOptions {
  deviceId: string;
  onPurchaseSuccess?: (
    tier: 'vip' | 'paid',
    purchaseToken: string,
    productId: string,
  ) => void;
  onPurchaseError?: (error: string) => void;
}

interface UseIapReturn {
  products: ProductSubscription[];
  activeSubscription: ActiveSubscription | null;
  loading: boolean;
  error: string | null;
  purchase: (productId: string) => Promise<{ success: boolean; reason?: string }>;
  refresh: () => Promise<void>;
}

// ══════════════════════════════════════════════════════════════════
// Hook
// ══════════════════════════════════════════════════════════════════

export function useIap({
  deviceId,
  onPurchaseSuccess,
  onPurchaseError,
}: UseIapOptions): UseIapReturn {
  // ── Lazy-load the IAP module ──
  const mod = getIapModule();
  const useIAP = mod?.useIAP ?? null;
  const iapAvailable = mod !== null && useIAP !== null;

  // Refs for callbacks
  const onPurchaseSuccessRef = useRef(onPurchaseSuccess);
  onPurchaseSuccessRef.current = onPurchaseSuccess;
  const onPurchaseErrorRef = useRef(onPurchaseError);
  onPurchaseErrorRef.current = onPurchaseError;

  // State for no-op fallback
  const [fallbackLoading, setFallbackLoading] = useState(true);

  // ── Call the real useIAP if available ──
  const iapResult = useIAP
    ? useIAP({
        onPurchaseSuccess: async (purchase: PurchaseLike) => {
          const tier = purchase.productId?.includes('.vip.')
            ? ('vip' as const)
            : ('paid' as const);

          try {
            onPurchaseSuccessRef.current?.(
              tier,
              purchase.purchaseToken || '',
              purchase.productId || '',
            );
          } catch (error) {
            console.error('[useIap] Success handler error:', error);
          }

          try {
            const ft = getIapModule()?.finishTransaction;
            if (ft) {
              await ft({ purchase, isConsumable: false });
            }
          } catch (error: unknown) {
            console.warn('[useIap] finishTransaction:', messageOf(error, 'unknown error'));
          }
        },
        onPurchaseError: (error: IapErrorLike) => {
          onPurchaseErrorRef.current?.(error?.message || String(error));
        },
      })
    : null;

  const connected = iapResult?.connected ?? false;
  const products = iapResult?.products ?? [];
  const subscriptions = iapResult?.subscriptions ?? [];
  const fetchProductsFn = iapResult?.fetchProducts;
  const getAvailablePurchasesFn = iapResult?.getAvailablePurchases;
  const requestPurchaseFn = iapResult?.requestPurchase;

  // Convex query for active subscription (works regardless of IAP)
  const activeSub = useQuery(
    api.purchases.getActiveSubscription,
    deviceId ? { deviceId } : 'skip',
  );

  // ── Simulate loading complete for no-op path ──
  useEffect(() => {
    if (!iapAvailable) {
      const timer = setTimeout(() => setFallbackLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [iapAvailable]);

  // ── Fetch subscription products on connect ──
  const [connectTimedOut, setConnectTimedOut] = useState(false);
  useEffect(() => {
    if (connected) {
      setConnectTimedOut(false);
      if (Platform.OS === 'android' && fetchProductsFn) {
        fetchProductsFn({ skus: ALL_PRODUCT_IDS, type: 'subs' }).catch((error: unknown) => {
          console.warn('[useIap] fetchProducts failed (SKUs not in Play Console yet?):', messageOf(error, 'unknown error'));
        });
      }
    }
  }, [connected, fetchProductsFn]);

  // Timeout: if IAP says it's available but never connects, give up after 8s
  useEffect(() => {
    if (!iapAvailable || connected) return;
    const timer = setTimeout(() => {
      if (!connected) setConnectTimedOut(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [iapAvailable, connected]);

  // ── Purchase function ──
  const purchase = useCallback(
    async (productId: string): Promise<{ success: boolean; reason?: string }> => {
      if (!iapAvailable) {
        return {
          success: false,
          reason: 'IAP unavailable. Use a dev build (not Expo Go) for Google Play billing.',
        };
      }

      if (!connected) {
        return {
          success: false,
          reason: 'Google Play not connected. Try again in a moment.',
        };
      }

      try {
        await requestPurchaseFn?.({
          request: { google: { skus: [productId] } },
          type: 'subs',
        });
        return { success: true };
      } catch (error: unknown) {
        const msg = messageOf(error, String(error));
        if (msg.includes('cancel')) {
          return { success: false, reason: 'Purchase cancelled' };
        }
        return { success: false, reason: msg };
      }
    },
    [iapAvailable, connected, requestPurchaseFn],
  );

  // ── Refresh ──
  const refresh = useCallback(async (): Promise<void> => {
    if (!iapAvailable || !fetchProductsFn) return;
    try {
      await fetchProductsFn({ skus: ALL_PRODUCT_IDS, type: 'subs' });
      if (getAvailablePurchasesFn) await getAvailablePurchasesFn();
    } catch (error: unknown) {
      console.warn('[useIap] Refresh error:', messageOf(error, 'unknown error'));
    }
  }, [iapAvailable, fetchProductsFn, getAvailablePurchasesFn]);

  // ── Computed state ──
  const effectiveAvailable = iapAvailable && !connectTimedOut;
  const loading = effectiveAvailable ? !connected : fallbackLoading;
  const error: string | null = effectiveAvailable
    ? null
    : connectTimedOut
      ? 'Google Play took too long to connect. Falling back to manual access.'
      : `IAP not available. ${iapLoadError || 'Run a dev build for Google Play billing.'}`;

  const activeSubscription: ActiveSubscription | null = activeSub
    ? {
        tier: activeSub.tier,
        productId: activeSub.productId,
        expiresAt: activeSub.expiresAt,
      }
    : null;

  const iapProducts: ProductSubscription[] = subscriptions.length > 0 ? subscriptions : products;

  return {
    products: iapProducts,
    activeSubscription,
    loading,
    error,
    purchase,
    refresh,
  };
}

export default useIap;

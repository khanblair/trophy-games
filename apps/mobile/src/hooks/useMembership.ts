import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@trophy-games/backend';
import * as Application from 'expo-application';
import { SUBSCRIPTION_PRODUCTS } from '@trophy-games/shared/subscriptions';
import { useUser } from '../context/UserContext';
import { useIap, type ProductSubscription } from './useIap';

export type MemberStatus = 'none' | 'pending' | 'approved' | 'active' | 'loading';
export type MembershipTier = 'vip' | 'paid';

export interface MembershipActionResult {
  success: boolean;
  reason?: string;
}

function toMemberStatus(data: unknown): MemberStatus {
  if (!data || typeof data !== 'object') return 'loading';
  const status = (data as { status?: unknown }).status;
  if (status === 'active' || status === 'pending' || status === 'approved') return status;
  return 'none';
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * One place for membership/IAP state. Used by the Store, Premium and VIP tabs
 * so the shared plan cards behave identically wherever they appear.
 */
export function useMembership() {
  const { username } = useUser();
  const [deviceId, setDeviceId] = useState('');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<MembershipTier | null>(null);
  const [verifying, setVerifying] = useState(false);

  const requestMembership = useMutation(api.tokens.requestMembership);
  const claimToken = useMutation(api.tokens.claimToken);
  const recordPurchase = useMutation(api.purchases.recordPurchase);

  useEffect(() => {
    const id = Application.applicationId + '_' + (Application.nativeApplicationVersion || 'v1');
    setDeviceId(id);
  }, []);

  const {
    products,
    activeSubscription,
    loading: iapLoading,
    error: iapError,
    purchase: iapPurchase,
    refresh: iapRefresh,
  } = useIap({
    deviceId,
    onPurchaseSuccess: async (tier, purchaseToken, productId) => {
      try {
        const result = await recordPurchase({ deviceId, productId, purchaseToken });
        if (!result.success) {
          console.warn('[Membership] purchase recording failed:', result.reason);
        }
      } catch (error) {
        console.error('[Membership] recordPurchase error:', error);
      }
      console.info(`[Membership] ${tier} purchase recorded for ${productId}`);
    },
  });

  const vipStatusData = useQuery(
    api.tokens.getMembershipStatus,
    deviceId ? { deviceId, username: username || undefined, type: 'vip' } : 'skip',
  );
  const paidStatusData = useQuery(
    api.tokens.getMembershipStatus,
    deviceId ? { deviceId, username: username || undefined, type: 'paid' } : 'skip',
  );

  const vipTokenStatus = toMemberStatus(vipStatusData);
  const paidTokenStatus = toMemberStatus(paidStatusData);
  const vipStatus: MemberStatus = activeSubscription?.tier === 'vip' ? 'active' : vipTokenStatus;
  const paidStatus: MemberStatus = activeSubscription?.tier === 'paid' ? 'active' : paidTokenStatus;

  const subscribe = useCallback(
    async (productId: string, _tier: MembershipTier): Promise<MembershipActionResult> => {
      if (!deviceId) return { success: false, reason: 'Device is not ready yet.' };
      setPurchasing(productId);
      try {
        const result = await iapPurchase(productId);
        if (!result.success && result.reason?.toLowerCase().includes('cancel')) {
          return { success: false, reason: 'Purchase cancelled' };
        }
        return result;
      } catch (error) {
        return { success: false, reason: messageOf(error, 'Subscription purchase failed.') };
      } finally {
        setPurchasing(null);
      }
    },
    [deviceId, iapPurchase],
  );

  const requestAccess = useCallback(
    async (tier: MembershipTier): Promise<MembershipActionResult> => {
      if (!deviceId) return { success: false, reason: 'Device is not ready yet.' };
      setRequesting(tier);
      try {
        const result = await requestMembership({ deviceId, username: username || undefined, type: tier });
        return { success: result.success, reason: result.reason };
      } catch (error) {
        return { success: false, reason: messageOf(error, 'Failed to send request.') };
      } finally {
        setRequesting(null);
      }
    },
    [deviceId, requestMembership, username],
  );

  const claimAccess = useCallback(
    async (token: string): Promise<MembershipActionResult> => {
      if (!deviceId || !token.trim()) return { success: false, reason: 'Enter a valid token.' };
      setVerifying(true);
      try {
        const result = await claimToken({ token: token.trim(), deviceId, username: username || undefined });
        return { success: result.success, reason: result.reason };
      } catch (error) {
        return { success: false, reason: messageOf(error, 'Failed to verify token.') };
      } finally {
        setVerifying(false);
      }
    },
    [deviceId, claimToken, username],
  );

  const refresh = useCallback(async () => {
    await iapRefresh();
  }, [iapRefresh]);

  const formatPrice = useCallback((product?: ProductSubscription): string | null => {
    return product?.displayPrice || product?.price || null;
  }, []);

  const isLoading = vipStatus === 'loading' || paidStatus === 'loading';

  return {
    deviceId,
    plans: {
      vipWeekly: SUBSCRIPTION_PRODUCTS.VIP_WEEKLY,
      vipMonthly: SUBSCRIPTION_PRODUCTS.VIP_MONTHLY,
      paidMonthly: SUBSCRIPTION_PRODUCTS.PAID_MONTHLY,
    },
    products,
    activeProductId: activeSubscription?.productId ?? null,
    activeSubscription,
    vipStatus,
    paidStatus,
    isLoading,
    iapLoading,
    iapError,
    purchasing,
    requesting,
    verifying,
    subscribe,
    requestAccess,
    claimAccess,
    formatPrice,
    refresh,
  };
}

export type MembershipController = ReturnType<typeof useMembership>;

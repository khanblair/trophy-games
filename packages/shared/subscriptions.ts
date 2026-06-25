/**
 * Google Play Billing subscription product IDs and configuration.
 *
 * These product IDs must match EXACTLY what you create in Google Play Console:
 *   Play Console → Monetize → Products → Subscriptions
 *
 * Convention: {package}.{tier}.{duration}
 * Package: com.khanblair.trophygames (from app.json android.package)
 */

export const SUBSCRIPTION_PRODUCTS = {
    /** VIP Weekly — 7 days auto-renewing */
    VIP_WEEKLY: {
        productId: 'com.khanblair.trophygames.vip.weekly',
        tier: 'vip' as const,
        label: 'VIP WEEKLY',
        duration: '7 Days',
        priceLocalized: 'KSh 200/week', // fallback; real price comes from Google Play
    },
    /** VIP Monthly — 30 days auto-renewing */
    VIP_MONTHLY: {
        productId: 'com.khanblair.trophygames.vip.monthly',
        tier: 'vip' as const,
        label: 'VIP MONTHLY',
        duration: '30 Days',
        priceLocalized: 'KSh 500/month',
    },
    /** Paid Tips Monthly — 30 days auto-renewing */
    PAID_MONTHLY: {
        productId: 'com.khanblair.trophygames.paid.monthly',
        tier: 'paid' as const,
        label: 'PAID MONTHLY',
        duration: '30 Days',
        priceLocalized: 'KSh 300/month',
    },
} as const;

export type SubscriptionProductId =
    (typeof SUBSCRIPTION_PRODUCTS)[keyof typeof SUBSCRIPTION_PRODUCTS]['productId'];

/** Tier the product maps to (used to create the correct access token type) */
export type SubscriptionTier = 'vip' | 'paid';

/** Quick lookup: productId → tier */
export function getTierForProduct(productId: string): SubscriptionTier | null {
    for (const product of Object.values(SUBSCRIPTION_PRODUCTS)) {
        if (product.productId === productId) return product.tier;
    }
    return null;
}

/** All product IDs as a flat array (used by IAP initialization) */
export const ALL_PRODUCT_IDS: string[] = Object.values(SUBSCRIPTION_PRODUCTS).map(
    (p) => p.productId,
);

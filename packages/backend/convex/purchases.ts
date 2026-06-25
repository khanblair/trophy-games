/**
 * Google Play Billing — purchase recording and verification.
 *
 * Flow:
 *   1. Mobile calls purchaseSubscription() via react-native-iap.
 *   2. On success, mobile sends receipt + deviceId to recordPurchase.
 *   3. Convex stores the purchase as "verified" (trust-on-first-use).
 *   4. Convex auto-creates an accessToken so the user gets instant access.
 *   5. A scheduled job (verifyPendingPurchases) can batch-verify against
 *      the Google Play Developer API for refund/expiry detection.
 *
 * For production, add Google Play Developer API verification to
 * recordPurchase by checking the purchaseToken against Google's servers.
 */

import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api, internal } from "./_generated/api";

// ─── Mutations ────────────────────────────────────────────────────

/** Record a new purchase and grant access. Called from mobile after a
 *  successful Google Play subscription purchase. */
export const recordPurchase = mutation({
    args: {
        deviceId: v.string(),
        productId: v.string(),
        purchaseToken: v.string(),
        transactionId: v.optional(v.string()),
        receiptData: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // ── Map productId → tier ──
        const tier = getTierForProduct(args.productId);
        if (!tier) {
            return { success: false, reason: `Unknown product: ${args.productId}` };
        }

        // ── Check for duplicate ──
        const existing = await ctx.db
            .query("purchases")
            .withIndex("by_purchase_token", (q) =>
                q.eq("purchaseToken", args.purchaseToken),
            )
            .first();

        if (existing) {
            // Already recorded — just re-grant the access token if needed
            const existingToken = await ctx.db
                .query("accessTokens")
                .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("type"), tier),
                        q.eq(q.field("isActive"), true),
                    ),
                )
                .first();

            if (existingToken) {
                return { success: true, alreadyRecorded: true, token: existingToken.token };
            }

            // Purchase exists but no token — create one
            const token = genToken(tier);
            await ctx.db.insert("accessTokens", {
                token,
                deviceId: args.deviceId,
                type: tier,
                createdAt: new Date().toISOString(),
                isActive: true,
                isClaimed: true,
            });

            return { success: true, alreadyRecorded: true, token };
        }

        // ── Calculate expiry ──
        const expiresAt = getExpiryForProduct(args.productId);

        // ── Insert purchase record ──
        await ctx.db.insert("purchases", {
            deviceId: args.deviceId,
            productId: args.productId,
            tier,
            purchaseToken: args.purchaseToken,
            transactionId: args.transactionId,
            status: "verified", // trust-on-first-use; verify via cron
            receiptData: args.receiptData,
            verifiedAt: new Date().toISOString(),
            expiresAt,
            createdAt: new Date().toISOString(),
        });

        // ── Create access token ──
        const token = genToken(tier);
        await ctx.db.insert("accessTokens", {
            token,
            deviceId: args.deviceId,
            type: tier,
            createdAt: new Date().toISOString(),
            expiresAt,
            isActive: true,
            isClaimed: true,
        });

        return { success: true, alreadyRecorded: false, token, tier, expiresAt };
    },
});

/** Get all purchases for a device (for the mobile app to display status) */
export const getPurchasesForDevice = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("purchases")
            .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
            .order("desc")
            .take(50);
    },
});

/** Check if a device has an active subscription (used by gate screens).
 *  Returns active tier or null. */
export const getActiveSubscription = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        const now = new Date().toISOString();
        const purchases = await ctx.db
            .query("purchases")
            .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "verified"),
                    q.or(
                        q.eq(q.field("expiresAt"), undefined),
                        q.gt(q.field("expiresAt"), now),
                    ),
                ),
            )
            .order("desc")
            .take(1);

        if (purchases.length === 0) return null;

        const purchase = purchases[0];
        return {
            tier: purchase.tier,
            productId: purchase.productId,
            expiresAt: purchase.expiresAt,
            purchaseToken: purchase.purchaseToken,
            transactionId: purchase.transactionId,
        };
    },
});

/** ✅ Get all purchases (admin dashboard) */
export const getAllPurchases = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("purchases").order("desc").take(200);
    },
});

/** ❌ Expire a purchase (e.g., subscription cancelled or refunded) */
export const expirePurchase = mutation({
    args: {
        purchaseToken: v.string(),
    },
    handler: async (ctx, args) => {
        const purchase = await ctx.db
            .query("purchases")
            .withIndex("by_purchase_token", (q) =>
                q.eq("purchaseToken", args.purchaseToken),
            )
            .first();

        if (!purchase) return { success: false, reason: "Purchase not found" };

        await ctx.db.patch(purchase._id, {
            status: "expired",
            updatedAt: new Date().toISOString(),
        });

        // Deactivate associated access tokens for this device+tier
        const tokens = await ctx.db
            .query("accessTokens")
            .withIndex("by_device_id", (q) => q.eq("deviceId", purchase.deviceId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("type"), purchase.tier),
                    q.eq(q.field("isActive"), true),
                ),
            )
            .collect();

        for (const t of tokens) {
            await ctx.db.patch(t._id, { isActive: false });
        }

        return { success: true };
    },
});

// ─── Helpers ──────────────────────────────────────────────────────

/** Map Google Play product ID → access tier */
function getTierForProduct(
    productId: string,
): "vip" | "paid" | null {
    if (productId.includes(".vip.")) return "vip";
    if (productId.includes(".paid.")) return "paid";
    return null;
}

/** Calculate expiry date from product ID */
function getExpiryForProduct(productId: string): string {
    const now = new Date();
    if (productId.includes(".weekly")) {
        now.setDate(now.getDate() + 7);
    } else if (productId.includes(".monthly")) {
        now.setMonth(now.getMonth() + 1);
    } else {
        // Default: 7 days
        now.setDate(now.getDate() + 7);
    }
    return now.toISOString();
}

/** Generate a short readable access token */
function genToken(tier: "vip" | "paid"): string {
    const prefix = tier === "vip" ? "VIP" : "PAD";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = prefix + "-";
    for (let i = 0; i < 12; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
        if ((i + 1) % 4 === 0 && i < 11) token += "-";
    }
    return token;
}

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// --- Access Tokens ---

export const createToken = mutation({
    args: {
        token: v.string(),
        deviceId: v.string(),
        username: v.optional(v.string()),
        type: v.union(v.literal('vip'), v.literal('paid')),
        matchId: v.optional(v.string()),
        expiresAt: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("accessTokens", {
            token: args.token,
            deviceId: args.deviceId,
            username: args.username,
            type: args.type,
            matchId: args.matchId,
            createdAt: new Date().toISOString(),
            expiresAt: args.expiresAt,
            isActive: true,
            isClaimed: false,
            failedAttempts: 0,
        });
        return { token: args.token };
    },
});

export const verifyToken = mutation({
    args: {
        token: v.string(),
        deviceId: v.string(),
        username: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Find user
        let user;
        if (args.username) {
            user = await ctx.db
                .query("users")
                .withIndex("by_username", (q) => q.eq("username", args.username!))
                .first();
        } else {
            user = await ctx.db
                .query("users")
                .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
                .first();
        }

        if (user?.isBlocked) {
            return { valid: false, reason: "Account is blocked. Contact support." };
        }

        if (user && (user.failedAttempts ?? 0) >= 5) {
            return { valid: false, reason: "Too many failed attempts. Account locked." };
        }

        const tokenDoc = await ctx.db
            .query("accessTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (!tokenDoc) {
            if (user) {
                await ctx.db.patch(user._id, {
                    failedAttempts: (user.failedAttempts ?? 0) + 1,
                    lastFailedAt: new Date().toISOString()
                });
            }
            return { valid: false, reason: "Token not found" };
        }
        
        if (!tokenDoc.isActive) return { valid: false, reason: "Token is inactive" };
        
        // Strict username binding check (if provided during token creation)
        if (tokenDoc.username && tokenDoc.username !== args.username) {
             if (user) {
                await ctx.db.patch(user._id, {
                    failedAttempts: (user.failedAttempts ?? 0) + 1,
                    lastFailedAt: new Date().toISOString()
                });
            }
            return { valid: false, reason: "Token bound to different username" };
        }

        if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt) < new Date()) {
            return { valid: false, reason: "Token expired" };
        }

        // Success! Reset failed attempts and mark claimed
        if (user) {
            await ctx.db.patch(user._id, { failedAttempts: 0, lastActiveAt: new Date().toISOString() });
        }

        if (!tokenDoc.isClaimed) {
            // Also bind the token to this username if it wasn't already
            await ctx.db.patch(tokenDoc._id, { isClaimed: true, username: args.username, claimedAt: new Date().toISOString() });
        }

        return { valid: true, type: tokenDoc.type, matchId: tokenDoc.matchId };
    },
});

export const getTokensByDevice = query({
    args: {
        deviceId: v.string(),
        username: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.username) {
            return await ctx.db
                .query("accessTokens")
                .withIndex("by_username", (q) => q.eq("username", args.username!))
                .filter((q) => q.eq(q.field("isActive"), true))
                .collect();
        }
        return await ctx.db
            .query("accessTokens")
            .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

export const getTokensForDevice = getTokensByDevice;

export const revokeToken = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const tokenDoc = await ctx.db
            .query("accessTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (tokenDoc) {
            await ctx.db.patch(tokenDoc._id, { isActive: false });
            await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                title: "Token Deactivated",
                body: "Your access token has been deactivated by an admin.",
                deviceId: tokenDoc.deviceId,
            });
        }
    },
});

export const revokeAllForUser = mutation({
    args: {
        username: v.string(),
    },
    handler: async (ctx, args) => {
        const tokens = await ctx.db
            .query("accessTokens")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .collect();

        for (const t of tokens) {
            await ctx.db.patch(t._id, { isActive: false });
        }
        
        // Notify user if they have a device
        const user = await ctx.db.query("users").withIndex("by_username", (q) => q.eq("username", args.username)).first();
        if (user) {
             await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                title: "Access Revoked",
                body: "All your access tokens have been deactivated.",
                deviceId: user.deviceId,
            });
        }
    },
});

export const getAllTokens = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("accessTokens").order("desc").take(200);
    },
});

// --- Membership Requests ---

export const requestMembership = mutation({
    args: {
        deviceId: v.string(),
        username: v.optional(v.string()),
        type: v.union(v.literal('vip'), v.literal('paid')),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("membershipRequests")
            .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("type"), args.type),
                    q.eq(q.field("status"), "pending"),
                )
            )
            .first();

        if (existing) {
            return { success: false, reason: "Request already pending", requestId: existing._id };
        }

        const id = await ctx.db.insert("membershipRequests", {
            deviceId: args.deviceId,
            username: args.username,
            type: args.type,
            status: "pending",
            requestedAt: new Date().toISOString(),
        });

        return { success: true, requestId: id };
    },
});

export const getMembershipStatus = query({
    args: {
        deviceId: v.string(),
        username: v.optional(v.string()),
        type: v.union(v.literal('vip'), v.literal('paid')),
    },
    handler: async (ctx, args) => {
        let tokens = [];
        if (args.username) {
             tokens = await ctx.db
                .query("accessTokens")
                .withIndex("by_username", (q) => q.eq("username", args.username!))
                .filter((q) => q.and(q.eq(q.field("type"), args.type), q.eq(q.field("isActive"), true)))
                .collect();
        } else {
            tokens = await ctx.db
                .query("accessTokens")
                .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
                .filter((q) => q.and(q.eq(q.field("type"), args.type), q.eq(q.field("isActive"), true)))
                .collect();
        }

        const validToken = tokens.find(t =>
            (!t.expiresAt || new Date(t.expiresAt) > new Date()) &&
            t.isClaimed !== false
        );
        if (validToken) {
            return { status: 'active', token: validToken.token, matchId: validToken.matchId };
        }

        const request = await ctx.db
            .query("membershipRequests")
            .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
            .filter((q) => q.eq(q.field("type"), args.type))
            .order("desc")
            .first();

        if (!request) return { status: 'none' };
        return { status: request.status, requestId: request._id };
    },
});

export const getPendingRequests = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("membershipRequests")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .order("desc")
            .take(100);
    },
});

export const getAllRequests = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("membershipRequests").order("desc").take(200);
    },
});

export const approveMembershipRequest = mutation({
    args: {
        requestId: v.id("membershipRequests"),
        token: v.string(),
        matchId: v.optional(v.string()),
        expiresAt: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.requestId);
        if (!request) return { success: false };

        await ctx.db.patch(args.requestId, {
            status: "approved",
            resolvedAt: new Date().toISOString(),
            issuedToken: args.token,
        });

        await ctx.db.insert("accessTokens", {
            token: args.token,
            deviceId: request.deviceId,
            username: request.username,
            type: request.type,
            matchId: args.matchId,
            createdAt: new Date().toISOString(),
            expiresAt: args.expiresAt,
            isActive: true,
            isClaimed: false,
        });

        await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
            title: "Request Approved",
            body: `Your ${request.type === 'vip' ? 'VIP' : 'Paid'} access request has been approved! Open the app to enter your token.`,
            deviceId: request.deviceId,
        });

        return { success: true };
    },
});

export const rejectMembershipRequest = mutation({
    args: {
        requestId: v.id("membershipRequests"),
    },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.requestId);
        await ctx.db.patch(args.requestId, {
            status: "rejected",
            resolvedAt: new Date().toISOString(),
        });

        if (request) {
            await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                title: "Request Rejected",
                body: "Your membership access request was not approved.",
                deviceId: request.deviceId,
            });
        }

        return { success: true };
    },
});

export const reactivateToken = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const tokenDoc = await ctx.db
            .query("accessTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (tokenDoc) {
            await ctx.db.patch(tokenDoc._id, {
                isActive: true,
                failedAttempts: 0
            });
        }
    },
});

// Alias for mobile compatibility
export const claimToken = mutation({
    args: {
        token: v.string(),
        deviceId: v.string(),
        username: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const result = await verifyToken(ctx, args);
        if (!result.valid) return { success: false, reason: result.reason };
        return { success: true, type: result.type, matchId: result.matchId };
    },
});

export const createMembershipRequest = requestMembership;

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// --- Access Tokens ---

export const createToken = mutation({
    args: {
        token: v.string(),
        deviceId: v.string(),
        type: v.union(v.literal('vip'), v.literal('paid')),
        matchId: v.optional(v.string()),
        expiresAt: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("accessTokens", {
            token: args.token,
            deviceId: args.deviceId,
            type: args.type,
            matchId: args.matchId,
            createdAt: new Date().toISOString(),
            expiresAt: args.expiresAt,
            isActive: true,
            isClaimed: false,
        });
        return { token: args.token };
    },
});

export const verifyToken = mutation({
    args: {
        token: v.string(),
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        const tokenDoc = await ctx.db
            .query("accessTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (!tokenDoc) return { valid: false, reason: "Token not found" };
        if (!tokenDoc.isActive) return { valid: false, reason: "Token is inactive" };
        if (tokenDoc.deviceId !== args.deviceId) return { valid: false, reason: "Token bound to different device" };
        if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt) < new Date()) {
            return { valid: false, reason: "Token expired" };
        }

        // Mark it as claimed upon successful verification
        if (!tokenDoc.isClaimed) {
            await ctx.db.patch(tokenDoc._id, { isClaimed: true });
        }

        return { valid: true, type: tokenDoc.type, matchId: tokenDoc.matchId };
    },
});

export const getTokensByDevice = query({
    args: {
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("accessTokens")
            .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

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
        type: v.union(v.literal('vip'), v.literal('paid')),
    },
    handler: async (ctx, args) => {
        // Check for existing pending request
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
        type: v.union(v.literal('vip'), v.literal('paid')),
    },
    handler: async (ctx, args) => {
        // Check if they have an active token
        const tokens = await ctx.db
            .query("accessTokens")
            .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("type"), args.type),
                    q.eq(q.field("isActive"), true),
                )
            )
            .collect();

        const validToken = tokens.find(t =>
            (!t.expiresAt || new Date(t.expiresAt) > new Date()) &&
            t.isClaimed !== false
        );
        if (validToken) {
            return { status: 'active', token: validToken.token, matchId: validToken.matchId };
        }

        // Check for pending/approved request
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

        // Update request
        await ctx.db.patch(args.requestId, {
            status: "approved",
            approvedAt: new Date().toISOString(),
            token: args.token,
        });

        // Create access token
        await ctx.db.insert("accessTokens", {
            token: args.token,
            deviceId: request.deviceId,
            type: request.type,
            matchId: args.matchId,
            createdAt: new Date().toISOString(),
            expiresAt: args.expiresAt,
            isActive: true,
            isClaimed: false,
        });

        return { success: true };
    },
});

export const rejectMembershipRequest = mutation({
    args: {
        requestId: v.id("membershipRequests"),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.requestId, {
            status: "rejected",
            notes: args.notes,
        });
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
            });
        }
    },
});

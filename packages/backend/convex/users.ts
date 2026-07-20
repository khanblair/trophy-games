import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const registerUser = mutation({
    args: {
        username: v.string(),
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if username already exists
        const existingUsername = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();

        if (existingUsername) {
            return { success: false, reason: "Username already taken" };
        }

        // Check if device already registered
        const existingDevice = await ctx.db
            .query("users")
            .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (existingDevice) {
            // Update the existing device record with new username
            await ctx.db.patch(existingDevice._id, {
                username: args.username,
                lastActiveAt: new Date().toISOString(),
            });
            return { success: true };
        }

        await ctx.db.insert("users", {
            username: args.username,
            deviceId: args.deviceId,
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            failedAttempts: 0,
            isBlocked: false,
        });

        return { success: true };
    },
});

export const checkUsername = query({
    args: {
        username: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();

        return { available: !existing };
    },
});

export const getUserByDevice = query({
    args: {
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
            .first();
    },
});

export const blockUser = mutation({
    args: {
        username: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();
            
        if (user) {
            await ctx.db.patch(user._id, { isBlocked: true });
        }
    },
});

export const unblockUser = mutation({
    args: {
        username: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();
            
        if (user) {
            await ctx.db.patch(user._id, { isBlocked: false, failedAttempts: 0 });
        }
    },
});

export const getAllUsers = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("users").order("desc").take(500);
    },
});

export const clearFailedAttempts = mutation({
    args: {
        username: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();
            
        if (user) {
            await ctx.db.patch(user._id, { failedAttempts: 0, isBlocked: false });
        }
    },
});

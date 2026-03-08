import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const registerPushToken = mutation({
    args: {
        deviceId: v.string(),
        pushToken: v.string(),
    },
    handler: async (ctx, args) => {
        const existingDevice = await ctx.db
            .query("devices")
            .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (existingDevice) {
            await ctx.db.patch(existingDevice._id, {
                pushToken: args.pushToken,
                lastActiveAt: new Date().toISOString(),
            });
        } else {
            await ctx.db.insert("devices", {
                deviceId: args.deviceId,
                pushToken: args.pushToken,
                lastActiveAt: new Date().toISOString(),
            });
        }
    },
});

export const internalGetDevices = internalQuery({
    args: { deviceId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (args.deviceId) {
            const device = await ctx.db
                .query("devices")
                .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId as string))
                .first();
            return device ? [device] : [];
        }
        return await ctx.db.query("devices").collect();
    },
});

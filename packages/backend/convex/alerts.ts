import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getAlerts = query({
    args: { deviceId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const allAlerts = await ctx.db.query("alerts").order("desc").take(50);

        // Filter alerts that are either global (no deviceId) or targeted to this device
        return allAlerts.filter(alert => !alert.deviceId || alert.deviceId === args.deviceId);
    },
});

export const createAlert = mutation({
    args: {
        title: v.string(),
        body: v.string(),
        deviceId: v.optional(v.string()), // null for global
        data: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const alertId = await ctx.db.insert("alerts", {
            title: args.title,
            body: args.body,
            deviceId: args.deviceId,
            data: args.data,
            readBy: [],
            createdAt: new Date().toISOString(),
        });

        // Schedule push notification
        await ctx.scheduler.runAfter(0, internal.alerts.sendPushNotification, {
            title: args.title,
            body: args.body,
            deviceId: args.deviceId,
            data: args.data,
        });

        return alertId;
    },
});

export const markRead = mutation({
    args: { alertId: v.id("alerts"), deviceId: v.string() },
    handler: async (ctx, args) => {
        const alert = await ctx.db.get(args.alertId);
        if (alert) {
            const readBy = alert.readBy ?? [];
            if (!readBy.includes(args.deviceId)) {
                await ctx.db.patch(args.alertId, { readBy: [...readBy, args.deviceId] });
            }
        }
    }
});

export const markAllRead = mutation({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        const alerts = await ctx.db.query("alerts").collect();
        for (const alert of alerts) {
            if (!alert.deviceId || alert.deviceId === args.deviceId) {
                const readBy = alert.readBy ?? [];
                if (!readBy.includes(args.deviceId)) {
                    await ctx.db.patch(alert._id, { readBy: [...readBy, args.deviceId] });
                }
            }
        }
    }
});

export const sendPushNotification = internalAction({
    args: {
        title: v.string(),
        body: v.string(),
        deviceId: v.optional(v.string()),
        data: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        // Find devices to send to
        let tokens: string[] = [];

        // Here we'd normally do `await ctx.runQuery(api.devices.getTokens...)` 
        // For simplicity, we can fetch all or specific target
        const devicesQuery = await ctx.runQuery(internal.devices.internalGetDevices, {
            deviceId: args.deviceId
        });

        tokens = devicesQuery
            .filter(d => d.pushToken)
            .map(d => d.pushToken as string);

        if (tokens.length === 0) return;

        // Send to Expo Push API
        const messages = tokens.map(token => ({
            to: token,
            sound: 'default',
            title: args.title,
            body: args.body,
            data: args.data || {},
        }));

        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            });

            if (!response.ok) {
                console.error("Failed to send push notification", await response.text());
            }
        } catch (error) {
            console.error("Error sending push notifications", error);
        }
    },
});

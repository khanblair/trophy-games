import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 100;
        return await ctx.db.query("matches").order("desc").take(limit);
    },
});

export const getAllLeagues = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("leagues").order("desc").take(100);
    },
});

export const get = query({
    args: {
        matchType: v.optional(v.union(v.literal('free'), v.literal('paid'), v.literal('vip'))),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let q = ctx.db.query("matches").order("desc");
        
        if (args.matchType) {
            q = ctx.db.query("matches")
                .withIndex("by_match_type", (q) => q.eq("matchType", args.matchType))
                .order("desc");
        }
        
        const limit = args.limit || 100;
        return await q.take(limit);
    },
});

export const getTrending = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("matches")
            .withIndex("by_trending", (q) => q.eq("isTrending", true))
            .order("desc")
            .take(50);
    },
});

export const getByDate = query({
    args: {
        date: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("matches")
            .filter((q) => q.eq(q.field("timestamp"), args.date))
            .order("desc")
            .take(100);
    },
});

export const getHistory = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("matches")
            .filter((q) => q.eq(q.field("status"), "Finished"))
            .order("desc")
            .take(args.limit || 50);
    },
});

export const updateMatchType = mutation({
    args: {
        matchId: v.string(),
        matchType: v.union(v.literal('free'), v.literal('paid'), v.literal('vip')),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { matchType: args.matchType });
        }
    },
});

export const saveAIPrediction = mutation({
    args: {
        matchId: v.string(),
        aiPrediction: v.object({
            prediction: v.string(),
            confidence: v.number(),
            reasoning: v.array(v.string()),
            suggestedBet: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { 
                aiPrediction: {
                    ...args.aiPrediction,
                    generatedAt: new Date().toISOString()
                }
            });
        }
    },
});

export const toggleTrending = mutation({
    args: {
        matchId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { isTrending: !existing.isTrending });
        }
    },
});

export const saveAll = mutation({
    args: {
        matches: v.array(v.any()),
        leagues: v.array(v.any()),
    },
    handler: async (ctx, args) => {
        // Basic implementation: clear and replace 
        // In production we'd do UPSERT logic
        for (const match of args.matches) {
            const existing = await ctx.db
                .query("matches")
                .withIndex("by_match_id", (q) => q.eq("id", match.id))
                .unique();

            if (existing) {
                await ctx.db.patch(existing._id, match);
            } else {
                await ctx.db.insert("matches", match);
            }
        }

        for (const league of args.leagues) {
            const existing = await ctx.db
                .query("leagues")
                .withIndex("by_league_id", (q) => q.eq("id", league.id))
                .unique();

            if (existing) {
                await ctx.db.patch(existing._id, league);
            } else {
                await ctx.db.insert("leagues", league);
            }
        }
    },
});

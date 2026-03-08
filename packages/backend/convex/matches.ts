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
        matchType: v.optional(v.union(v.literal('free'), v.literal('paid'), v.literal('vip'), v.literal('unassigned'))),
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
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "Finished"),
                    q.eq(q.field("status"), "FT"),
                    q.eq(q.field("isHistory"), true),
                )
            )
            .order("desc")
            .take(args.limit || 100);
    },
});

export const getHistoryByDateRange = query({
    args: {
        startDate: v.string(),
        endDate: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("matches")
            .withIndex("by_match_date", (q) =>
                q.gte("matchDate", args.startDate).lte("matchDate", args.endDate)
            )
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "Finished"),
                    q.eq(q.field("status"), "FT"),
                    q.eq(q.field("isHistory"), true),
                )
            )
            .order("desc")
            .take(args.limit || 100);
    },
});

export const updateMatchType = mutation({
    args: {
        matchId: v.string(),
        matchType: v.union(v.literal('free'), v.literal('paid'), v.literal('vip'), v.literal('unassigned')),
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

export const updateMatchResult = mutation({
    args: {
        matchId: v.string(),
        result: v.union(v.literal('win'), v.literal('lose'), v.literal('draw')),
        isHistory: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                result: args.result,
                isHistory: args.isHistory ?? true,
            });
        }
    },
});

export const markAsHistory = mutation({
    args: {
        matchId: v.string(),
        isHistory: v.boolean(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { isHistory: args.isHistory });
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
        for (const match of args.matches) {
            // Derive matchDate from timestamp if not set
            const matchDate = match.matchDate || (match.timestamp ? match.timestamp.split('T')[0] : undefined);
            const matchWithDate = matchDate ? { ...match, matchDate } : match;

            const existing = await ctx.db
                .query("matches")
                .withIndex("by_match_id", (q) => q.eq("id", match.id))
                .unique();

            if (existing) {
                // Preserve existing result/isHistory when updating
                const updated = { ...existing, ...matchWithDate };
                if (existing.result && !matchWithDate.result) updated.result = existing.result;
                if (existing.isHistory && !matchWithDate.isHistory) updated.isHistory = existing.isHistory;
                await ctx.db.patch(existing._id, updated);
            } else {
                await ctx.db.insert("matches", matchWithDate);
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

export const getBySource = query({
    args: {
        source: v.union(v.literal('odds-api'), v.literal('goaloo-live')),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("matches")
            .withIndex("by_source", (q) => q.eq("source", args.source))
            .order("desc")
            .take(100);
    },
});

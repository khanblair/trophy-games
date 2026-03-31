import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ========== QUERIES ==========

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

export const getById = query({
    args: {
        matchId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();
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
            .filter((q) => q.eq(q.field("matchDate"), args.date))
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

// ========== MUTATIONS ==========

// CREATE - Add a new match manually
export const create = mutation({
    args: {
        match: v.object({
            id: v.string(),
            league: v.string(),
            leagueId: v.optional(v.number()),
            leagueLogo: v.optional(v.string()),
            homeTeam: v.string(),
            homeTeamId: v.optional(v.number()),
            homeTeamLogo: v.optional(v.string()),
            awayTeam: v.string(),
            awayTeamId: v.optional(v.number()),
            awayTeamLogo: v.optional(v.string()),
            country: v.optional(v.string()),
            countryFlag: v.optional(v.string()),
            timestamp: v.string(),
            status: v.string(),
            score: v.optional(v.string()),
            homeScore: v.optional(v.number()),
            awayScore: v.optional(v.number()),
            matchType: v.optional(v.union(v.literal('free'), v.literal('paid'), v.literal('vip'), v.literal('unassigned'))),
            isTrending: v.optional(v.boolean()),
            odds: v.optional(v.object({
                home: v.string(),
                away: v.string(),
                draw: v.optional(v.string()),
            })),
        }),
    },
    handler: async (ctx, args) => {
        const matchDate = args.match.timestamp ? args.match.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        const newMatch = {
            ...args.match,
            score: args.match.score || '0-0',
            matchDate,
            isHistory: false,
            createdAt: now,
            updatedAt: now,
        };

        const matchId = await ctx.db.insert("matches", newMatch);

        // Send notification for new match
        if (args.match.matchType === 'free') {
            await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                title: "New Free Tip Added!",
                body: `Check out the new match: ${args.match.homeTeam} vs ${args.match.awayTeam}`,
            });
        } else if (args.match.matchType === 'vip') {
            await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                title: "New VIP Prediction",
                body: `Premium VIP tip available: ${args.match.homeTeam} vs ${args.match.awayTeam}`,
            });
        } else if (args.match.matchType === 'paid') {
            await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                title: "New Paid Prediction",
                body: `A new Paid tip is now available: ${args.match.homeTeam} vs ${args.match.awayTeam}`,
            });
        }

        return matchId;
    },
});

// UPDATE - Update match details
export const update = mutation({
    args: {
        matchId: v.string(),
        updates: v.object({
            league: v.optional(v.string()),
            leagueLogo: v.optional(v.string()),
            homeTeam: v.optional(v.string()),
            homeTeamLogo: v.optional(v.string()),
            awayTeam: v.optional(v.string()),
            awayTeamLogo: v.optional(v.string()),
            country: v.optional(v.string()),
            countryFlag: v.optional(v.string()),
            timestamp: v.optional(v.string()),
            status: v.optional(v.string()),
            score: v.optional(v.string()),
            homeScore: v.optional(v.number()),
            awayScore: v.optional(v.number()),
            matchType: v.optional(v.union(v.literal('free'), v.literal('paid'), v.literal('vip'), v.literal('unassigned'))),
            isTrending: v.optional(v.boolean()),
            odds: v.optional(v.object({
                home: v.string(),
                away: v.string(),
                draw: v.optional(v.string()),
            })),
        }),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (!existing) {
            throw new Error(`Match with id ${args.matchId} not found`);
        }

        const updates: any = {
            ...args.updates,
            updatedAt: new Date().toISOString(),
        };

        // Update matchDate if timestamp changed
        if (args.updates.timestamp) {
            updates.matchDate = args.updates.timestamp.split('T')[0];
        }

        await ctx.db.patch(existing._id, updates);
        return existing._id;
    },
});

// DELETE - Delete a match
export const deleteMatch = mutation({
    args: {
        matchId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_match_id", (q) => q.eq("id", args.matchId))
            .unique();

        if (!existing) {
            throw new Error(`Match with id ${args.matchId} not found`);
        }

        await ctx.db.delete(existing._id);
        return { success: true };
    },
});

// Update match type only
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
            await ctx.db.patch(existing._id, { 
                matchType: args.matchType,
                updatedAt: new Date().toISOString(),
            });

            if (args.matchType !== existing.matchType) {
                if (args.matchType === 'free') {
                    await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                        title: "Free Tip Added!",
                        body: `A new high-confidence free tip has been added: ${existing.homeTeam} vs ${existing.awayTeam}. Check it out now!`,
                    });
                } else if (args.matchType === 'vip') {
                    await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                        title: "New VIP Prediction",
                        body: `Premium VIP tip available: ${existing.homeTeam} vs ${existing.awayTeam}. Unlock with your token!`,
                    });
                } else if (args.matchType === 'paid') {
                    await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
                        title: "New Paid Prediction",
                        body: `A new Paid tip is now available: ${existing.homeTeam} vs ${existing.awayTeam}.`,
                    });
                }
            }
        }
    },
});

// Update match result
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
                updatedAt: new Date().toISOString(),
            });
        }
    },
});

// Mark as history
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
            await ctx.db.patch(existing._id, { 
                isHistory: args.isHistory,
                updatedAt: new Date().toISOString(),
            });
        }
    },
});

// Save AI prediction
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
                },
                updatedAt: new Date().toISOString(),
            });
        }
    },
});

// Toggle trending status
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
            await ctx.db.patch(existing._id, { 
                isTrending: !existing.isTrending,
                updatedAt: new Date().toISOString(),
            });
        }
    },
});

// Delete a league
export const deleteLeague = mutation({
    args: {
        leagueId: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("leagues")
            .withIndex("by_league_id", (q) => q.eq("id", args.leagueId))
            .unique();

        if (!existing) {
            throw new Error(`League with id ${args.leagueId} not found`);
        }

        await ctx.db.delete(existing._id);
        return { success: true };
    },
});

// Bulk save matches (for admin import)
export const saveAll = mutation({
    args: {
        matches: v.array(v.any()),
        leagues: v.optional(v.array(v.any())),
    },
    handler: async (ctx, args) => {
        const now = new Date().toISOString();

        for (const match of args.matches) {
            // Derive matchDate from timestamp if not set
            const matchDate = match.matchDate || (match.timestamp ? match.timestamp.split('T')[0] : now.split('T')[0]);
            const matchWithDate = {
                ...match,
                matchDate,
                createdAt: match.createdAt || now,
                updatedAt: now,
            };

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

        if (args.leagues) {
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
        }
    },
});

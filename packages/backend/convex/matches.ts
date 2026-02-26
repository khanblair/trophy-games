import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("matches").order("desc").take(100);
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

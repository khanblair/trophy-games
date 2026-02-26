import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    matches: defineTable({
        id: v.string(),
        league: v.string(),
        homeTeam: v.string(),
        awayTeam: v.string(),
        timestamp: v.string(),
        status: v.string(),
        score: v.string(),
        homeScore: v.optional(v.number()),
        awayScore: v.optional(v.number()),
        odds: v.optional(v.object({
            home: v.string(),
            away: v.string(),
            draw: v.optional(v.string()),
        })),
        detailedOdds: v.optional(v.any()),
        h2h: v.optional(v.any()),
    }).index("by_match_id", ["id"]),

    leagues: defineTable({
        id: v.number(),
        name: v.string(),
        url: v.string(),
        type: v.string(),
        matchCount: v.optional(v.number()),
        country: v.optional(v.string()),
        countryId: v.optional(v.number()),
    }).index("by_league_id", ["id"]),
});

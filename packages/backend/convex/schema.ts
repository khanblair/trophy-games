import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    matches: defineTable({
        id: v.string(),
        league: v.string(),
        leagueId: v.optional(v.number()),
        homeTeam: v.string(),
        awayTeam: v.string(),
        timestamp: v.string(),
        status: v.string(),
        score: v.string(),
        homeScore: v.optional(v.number()),
        awayScore: v.optional(v.number()),
        matchType: v.optional(v.union(v.literal('free'), v.literal('paid'), v.literal('vip'))),
        isTrending: v.optional(v.boolean()),
        aiPrediction: v.optional(v.object({
            prediction: v.string(),
            confidence: v.number(),
            reasoning: v.array(v.string()),
            suggestedBet: v.optional(v.string()),
        })),
        odds: v.optional(v.object({
            home: v.string(),
            away: v.string(),
            draw: v.optional(v.string()),
        })),
        detailedOdds: v.optional(v.any()),
        h2h: v.optional(v.any()),
    })
    .index("by_match_id", ["id"])
    .index("by_match_type", ["matchType"])
    .index("by_trending", ["isTrending"]),

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

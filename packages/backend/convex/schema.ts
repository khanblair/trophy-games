import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    matches: defineTable({
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
            generatedAt: v.optional(v.string()),
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
        logo: v.optional(v.string()),
        type: v.string(),
        matchCount: v.optional(v.number()),
        country: v.optional(v.string()),
        countryId: v.optional(v.number()),
        countryFlag: v.optional(v.string()),
    }).index("by_league_id", ["id"]),
});

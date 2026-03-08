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
        homeStanding: v.optional(v.number()),
        awayStanding: v.optional(v.number()),
        referee: v.optional(v.string()),
        weather: v.optional(v.string()),
        matchType: v.optional(v.union(v.literal('free'), v.literal('paid'), v.literal('vip'), v.literal('unassigned'))),
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
        source: v.optional(v.union(v.literal('odds-api'), v.literal('goaloo-live'))),
        // History / result tracking
        result: v.optional(v.union(v.literal('win'), v.literal('lose'), v.literal('draw'))),
        matchDate: v.optional(v.string()), // YYYY-MM-DD
        isHistory: v.optional(v.boolean()), // manually marked as history by admin
    })
        .index("by_match_id", ["id"])
        .index("by_match_type", ["matchType"])
        .index("by_trending", ["isTrending"])
        .index("by_source", ["source"])
        .index("by_match_date", ["matchDate"])
        .index("by_history", ["isHistory"]),

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

    // Access tokens for VIP / Paid match gating
    accessTokens: defineTable({
        token: v.string(),         // unique token string shown to user
        matchId: v.optional(v.string()), // null = access all matches of that type
        deviceId: v.string(),      // device or user identifier
        type: v.union(v.literal('vip'), v.literal('paid')),
        createdAt: v.string(),
        expiresAt: v.optional(v.string()),
        isActive: v.boolean(),
        isClaimed: v.optional(v.boolean()),
    })
        .index("by_token", ["token"])
        .index("by_device_id", ["deviceId"]),

    // Membership requests from mobile users
    membershipRequests: defineTable({
        deviceId: v.string(),
        type: v.union(v.literal('vip'), v.literal('paid')),
        status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
        requestedAt: v.string(),
        approvedAt: v.optional(v.string()),
        token: v.optional(v.string()), // set after approval
        notes: v.optional(v.string()),
    })
        .index("by_device_id", ["deviceId"])
        .index("by_status", ["status"]),

    // Devices for push notifications
    devices: defineTable({
        deviceId: v.string(),
        pushToken: v.optional(v.string()),
        lastActiveAt: v.string(),
    }).index("by_device_id", ["deviceId"]),

    // Alerts (In-app notifications)
    alerts: defineTable({
        deviceId: v.optional(v.string()), // target specific device, or global if undefined
        title: v.string(),
        body: v.string(),
        data: v.optional(v.any()), // extra context
        createdAt: v.string(),
        readBy: v.optional(v.array(v.string())), // array of deviceIds that have read it (if global) or boolean if targeted
    }).index("by_device_id", ["deviceId"]),
});

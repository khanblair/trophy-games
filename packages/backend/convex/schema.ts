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
        timestamp: v.string(), // ISO date string
        status: v.string(), // 'Scheduled', 'Live', 'Finished', 'Postponed', etc.
        score: v.string(), // e.g., "0-0", "2-1"
        homeScore: v.optional(v.number()),
        awayScore: v.optional(v.number()),
        homeStanding: v.optional(v.number()),
        awayStanding: v.optional(v.number()),
        referee: v.optional(v.string()),
        weather: v.optional(v.string()),
        homeForm: v.optional(v.string()),
        awayForm: v.optional(v.string()),
        homeCorners: v.optional(v.number()),
        awayCorners: v.optional(v.number()),
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
        // Rich detail fields from FootyStats /matches and /match-stats
        htHomeScore: v.optional(v.number()),
        htAwayScore: v.optional(v.number()),
        homeXg: v.optional(v.number()),
        awayXg: v.optional(v.number()),
        stadium: v.optional(v.string()),
        attendance: v.optional(v.number()),
        tvStations: v.optional(v.array(v.string())),
        preview: v.optional(v.string()),
        potentials: v.optional(v.any()),
        stats: v.optional(v.any()),
        goals: v.optional(v.any()),
        homeLineup: v.optional(v.any()),
        awayLineup: v.optional(v.any()),
        oddsComparison: v.optional(v.any()),
        // History / result tracking
        result: v.optional(v.union(v.literal('win'), v.literal('lose'), v.literal('draw'))),
        matchDate: v.optional(v.string()), // YYYY-MM-DD
        isHistory: v.optional(v.boolean()), // manually marked as history by admin
        // Metadata
        createdAt: v.string(),
        updatedAt: v.optional(v.string()),
        createdBy: v.optional(v.string()), // admin identifier
    })
        .index("by_match_id", ["id"])
        .index("by_match_type", ["matchType"])
        .index("by_trending", ["isTrending"])
        .index("by_match_date", ["matchDate"])
        .index("by_history", ["isHistory"]),

    leagues: defineTable({
        id: v.number(),
        name: v.string(),
        url: v.optional(v.string()),
        logo: v.optional(v.string()),
        type: v.optional(v.string()),
        matchCount: v.optional(v.number()),
        country: v.optional(v.string()),
        countryId: v.optional(v.number()),
        countryFlag: v.optional(v.string()),
    }).index("by_league_id", ["id"]),

    // Access tokens for VIP/Paid content
    accessTokens: defineTable({
        token: v.string(), // e.g., 'VIP-1234-5678-ABCD'
        type: v.union(v.literal("vip"), v.literal("paid")),
        deviceId: v.string(),
        username: v.optional(v.string()), // Added for the new security system
        matchId: v.optional(v.string()), // if token is restricted to a specific match
        expiresAt: v.optional(v.string()), // ISO string
        isActive: v.boolean(),
        isClaimed: v.boolean(),
        claimedAt: v.optional(v.string()), // ISO string
        createdAt: v.string(), // ISO string
        failedAttempts: v.optional(v.number()), // Security feature
    })
        .index("by_token", ["token"])
        .index("by_device_id", ["deviceId"])
        .index("by_username", ["username"]),

    // Membership requests
    membershipRequests: defineTable({
        deviceId: v.string(),
        username: v.optional(v.string()), // Added for the new security system
        type: v.union(v.literal("vip"), v.literal("paid")),
        status: v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected")
        ),
        requestedAt: v.string(), // ISO string
        resolvedAt: v.optional(v.string()), // ISO string
        issuedToken: v.optional(v.string()),
    })
        .index("by_device_id", ["deviceId"])
        .index("by_username", ["username"])
        .index("by_status", ["status"]),

    // Registered Users (New Security System)
    users: defineTable({
        username: v.string(),
        deviceId: v.string(),
        createdAt: v.string(), // ISO string
        lastActiveAt: v.optional(v.string()),
        isBlocked: v.optional(v.boolean()),
        failedAttempts: v.optional(v.number()),
        lastFailedAt: v.optional(v.string()),
    })
        .index("by_username", ["username"])
        .index("by_device_id", ["deviceId"]),

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

    // Google Play / In-App Purchases
    purchases: defineTable({
        deviceId: v.string(),
        productId: v.string(), // e.g., com.khanblair.trophygames.vip.weekly
        tier: v.union(v.literal('vip'), v.literal('paid')),
        purchaseToken: v.string(), // Google Play purchase token
        transactionId: v.optional(v.string()), // Google order ID
        status: v.union(v.literal('pending'), v.literal('verified'), v.literal('expired'), v.literal('refunded')),
        receiptData: v.optional(v.string()), // raw receipt for audit
        verifiedAt: v.optional(v.string()),
        expiresAt: v.optional(v.string()),
        createdAt: v.string(),
        updatedAt: v.optional(v.string()),
    })
        .index("by_device_id", ["deviceId"])
        .index("by_purchase_token", ["purchaseToken"])
        .index("by_status", ["status"]),

    // AI Analysis Results from DeepSeek
    analysisResults: defineTable({
        date: v.string(), // YYYY-MM-DD
        analysisType: v.union(v.literal("daily"), v.literal("weekly")),
        status: v.union(v.literal("pending"), v.literal("verified"), v.literal("approved"), v.literal("rejected")),
        freeRecommendations: v.array(v.any()),
        paidRecommendations: v.array(v.any()),
        vipRecommendations: v.array(v.any()),
        verificationNotes: v.optional(v.array(v.string())),
        removedMatches: v.optional(v.array(v.any())),
        confidenceAdjustment: v.optional(v.number()),
        generatedAt: v.string(),
        verifiedAt: v.optional(v.string()),
        approvedAt: v.optional(v.string()),
        approvedBy: v.optional(v.string()),
        model: v.string(),
        createdAt: v.string(),
        updatedAt: v.optional(v.string()),
    })
        .index("by_date", ["date"])
        .index("by_status", ["status"])
        .index("by_analysis_type", ["analysisType"]),
});

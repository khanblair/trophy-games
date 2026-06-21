import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

const TRENDING_LEAGUES = [
  "English Premier League",
  "German Bundesliga",
  "Spanish La Liga",
  "Italian Serie A",
  "French Ligue 1",
  "Champions League",
  "Europa League",
  "English Championship",
  "Portugal Primeira Liga",
  "Dutch Eredivisie",
  "Belgian Pro League",
  "Turkish Super Lig",
  "Brazil Serie A",
  "Argentina Primera Division",
  "MLS",
  "FIFA Club World Cup",
  "World Cup",
  "Africa Cup of Nations",
  "Copa America",
  "Euro Championship",
];

const SYSTEM_PROMPT_ANALYST = `You are an elite football betting analyst with 15+ years of experience. Your expertise covers statistical modeling, team form analysis, head-to-head data, tactical matchups, and value betting principles.

Analyze matches objectively using data. For each recommended match provide:
1. matchId (exact string from input)
2. homeTeam, awayTeam, league, timestamp
3. recommendedType: "free", "paid", or "vip"
4. confidence: 0-100 (data-driven, not arbitrary)
5. reasoning: 2-4 specific analytical points as array of strings
6. suggestedBet: specific bet suggestion (e.g., "Home Win", "Over 2.5 Goals", "BTTS Yes")
7. keyStats: 2-3 supporting statistics as array of strings
8. riskLevel: "low", "medium", or "high"

TIER GUIDELINES:
- FREE (20 matches): Confidence 75-100%, low-medium risk, clear statistical edge. Focus on favorites with strong form.
- PAID (20 matches): Confidence 60-85%, medium risk, value odds 2.0+. Strong indicators but not obvious.
- VIP (20 matches): Confidence 50-75%, medium-high risk, high odds 2.5+. Contrarian picks with data backing.

Each of the 3 categories MUST have exactly 20 distinct matches. No overlap between categories.
Return ONLY valid JSON.`;

const SYSTEM_PROMPT_VERIFIER = `You are a senior betting verification analyst. Your job is to double-check recommendations and remove any that lack sufficient evidence or have inflated confidence scores.

Be conservative. Remove matches where:
- Confidence score doesn't match the reasoning quality
- Risk level contradicts the tier assignment
- Key stats don't actually support the recommendation
- The match has insufficient data for analysis

Return ONLY valid JSON with verified recommendations and removal reasons.`;

function formatMatchesForPrompt(matches: any[]): string {
  return matches
    .map(
      (m, i) =>
        `Match ${i + 1}: ID=${m.id} | ${m.homeTeam} vs ${m.awayTeam} | ${m.league} | ${m.timestamp} | Odds: H=${m.odds?.home || "N/A"} D=${m.odds?.draw || "N/A"} A=${m.odds?.away || "N/A"} | Score: ${m.homeScore ?? "-"}-${m.awayScore ?? "-"} | Form: H=${m.homeForm || "N/A"} A=${m.awayForm || "N/A"} | Potentials: ${m.potentials ? m.potentials.map((p: any) => `${p.label}=${p.percent ?? p.value}`).join(", ") : "N/A"}`
    )
    .join("\n");
}

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<any> {
  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 12000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek API ${res.status}: ${text}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty DeepSeek response");

  return JSON.parse(content);
}

// Run DeepSeek analysis on matches for a given date
export const runAnalysis = action({
  args: {
    date: v.string(),
    analysisType: v.union(v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

    // 1. Fetch matches for the date from Convex
    const matches = await ctx.runQuery(api.matches.getByDate, { date: args.date });
    if (!matches || matches.length === 0) {
      throw new Error(`No matches found for ${args.date}`);
    }

    // 2. Filter to trending leagues and scheduled/incomplete matches
    const eligible = matches.filter((m: any) => {
      const isTrendingLeague = TRENDING_LEAGUES.some(
        (tl) => m.league?.toLowerCase().includes(tl.toLowerCase()) || tl.toLowerCase().includes(m.league?.toLowerCase())
      );
      const isUpcoming = m.status === "Scheduled" || m.status === "incomplete" || m.status === "NS";
      return isTrendingLeague && isUpcoming;
    });

    if (eligible.length < 60) {
      console.warn(`[Analysis] Only ${eligible.length} eligible matches found (need 60). Using all available.`);
    }

    const pool = eligible.length > 0 ? eligible : matches;

    // 3. Call DeepSeek Analyst
    const analysisPrompt = `Analyze ${pool.length} football matches for ${args.date}. Select TOP 20 for each tier (FREE, PAID, VIP). Each tier gets 20 distinct matches.

${formatMatchesForPrompt(pool)}

Return JSON:
{
  "freeRecommendations": [{matchId, homeTeam, awayTeam, league, timestamp, recommendedType:"free", confidence, reasoning:[], suggestedBet, keyStats:[], riskLevel}],
  "paidRecommendations": [...],
  "vipRecommendations": [...]
}`;

    const analysisResult = await callDeepSeek(SYSTEM_PROMPT_ANALYST, analysisPrompt, apiKey);

    // 4. Call DeepSeek Verifier
    const allRecs = [
      ...(analysisResult.freeRecommendations || []),
      ...(analysisResult.paidRecommendations || []),
      ...(analysisResult.vipRecommendations || []),
    ];

    const verifyPrompt = `Verify these ${allRecs.length} betting recommendations:

${allRecs.map((r: any, i: number) => `${i + 1}. ${r.homeTeam} vs ${r.awayTeam} | ${r.recommendedType} | ${r.confidence}% | ${r.suggestedBet} | ${r.riskLevel} | Reasoning: ${(r.reasoning || []).join("; ")}`).join("\n")}

Return JSON:
{
  "verified": true/false,
  "removedMatches": [{matchId, reason}],
  "adjustedRecommendations": [{matchId, homeTeam, awayTeam, league, timestamp, recommendedType, confidence, reasoning, suggestedBet, keyStats, riskLevel}],
  "verificationNotes": ["..."],
  "confidenceAdjustment": number
}`;

    const verifyResult = await callDeepSeek(SYSTEM_PROMPT_VERIFIER, verifyPrompt, apiKey);

    // 5. Save results to Convex
    const now = new Date().toISOString();
    const resultId = await ctx.runMutation(api.analysis.saveResult, {
      date: args.date,
      analysisType: args.analysisType,
      freeRecommendations: analysisResult.freeRecommendations || [],
      paidRecommendations: analysisResult.paidRecommendations || [],
      vipRecommendations: analysisResult.vipRecommendations || [],
      verificationNotes: verifyResult.verificationNotes || [],
      removedMatches: verifyResult.removedMatches || [],
      confidenceAdjustment: verifyResult.confidenceAdjustment || 0,
      model: DEEPSEEK_MODEL,
      generatedAt: now,
    });

    return {
      resultId,
      freeCount: (analysisResult.freeRecommendations || []).length,
      paidCount: (analysisResult.paidRecommendations || []).length,
      vipCount: (analysisResult.vipRecommendations || []).length,
      removedCount: (verifyResult.removedMatches || []).length,
      verified: verifyResult.verified,
    };
  },
});

// Save analysis result
export const saveResult = mutation({
  args: {
    date: v.string(),
    analysisType: v.union(v.literal("daily"), v.literal("weekly")),
    freeRecommendations: v.array(v.any()),
    paidRecommendations: v.array(v.any()),
    vipRecommendations: v.array(v.any()),
    verificationNotes: v.optional(v.array(v.string())),
    removedMatches: v.optional(v.array(v.any())),
    confidenceAdjustment: v.optional(v.number()),
    model: v.string(),
    generatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if there's an existing pending result for this date
    const existing = await ctx.db
      .query("analysisResults")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "verified",
        freeRecommendations: args.freeRecommendations,
        paidRecommendations: args.paidRecommendations,
        vipRecommendations: args.vipRecommendations,
        verificationNotes: args.verificationNotes,
        removedMatches: args.removedMatches,
        confidenceAdjustment: args.confidenceAdjustment,
        model: args.model,
        generatedAt: args.generatedAt,
        updatedAt: new Date().toISOString(),
      });
      return existing._id;
    }

    return await ctx.db.insert("analysisResults", {
      ...args,
      status: "verified",
      createdAt: args.generatedAt,
      updatedAt: args.generatedAt,
    });
  },
});

// Approve analysis and apply match types
// Supports two modes:
// 1. selectedMatchIds provided → only tag those specific matches
// 2. No selectedMatchIds → tag all matches in the approved categories (legacy behavior)
export const approveAnalysis = mutation({
  args: {
    resultId: v.id("analysisResults"),
    approvedBy: v.string(),
    // Optional: specific match IDs to approve (individual selection mode)
    selectedMatchIds: v.optional(v.array(v.string())),
    // Optional: filter which types to approve when NOT using individual selection
    approveFree: v.optional(v.boolean()),
    approvePaid: v.optional(v.boolean()),
    approveVip: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.get(args.resultId);
    if (!result) throw new Error("Analysis result not found");

    const now = new Date().toISOString();
    const selectedSet = args.selectedMatchIds ? new Set(args.selectedMatchIds) : null;
    let appliedCount = 0;

    // Apply match types AND AI predictions based on recommendations
    const applyType = async (recommendations: any[], type: "free" | "paid" | "vip") => {
      for (const rec of recommendations) {
        // If individual selection mode, skip unselected matches
        if (selectedSet && !selectedSet.has(rec.matchId)) continue;

        const existing = await ctx.db
          .query("matches")
          .withIndex("by_match_id", (q) => q.eq("id", rec.matchId))
          .first();

        if (existing) {
          // Build AI prediction from DeepSeek recommendation
          const aiPrediction = {
            prediction: `${rec.homeTeam} vs ${rec.awayTeam} — ${rec.suggestedBet}`,
            confidence: rec.confidence,
            reasoning: rec.reasoning || [],
            suggestedBet: rec.suggestedBet,
            generatedAt: now,
          };

          await ctx.db.patch(existing._id, {
            matchType: type,
            aiPrediction,
            updatedAt: now,
          });
          appliedCount++;
        } else {
          console.warn(`[ApproveAnalysis] Match ${rec.matchId} not found in Convex`);
        }
      }
    };

    if (selectedSet) {
      // Individual selection mode: check all categories for selected matches
      await applyType(result.freeRecommendations, "free");
      await applyType(result.paidRecommendations, "paid");
      await applyType(result.vipRecommendations, "vip");
    } else {
      // Legacy category mode
      if (args.approveFree !== false) {
        await applyType(result.freeRecommendations, "free");
      }
      if (args.approvePaid !== false) {
        await applyType(result.paidRecommendations, "paid");
      }
      if (args.approveVip !== false) {
        await applyType(result.vipRecommendations, "vip");
      }
    }

    await ctx.db.patch(result._id, {
      status: "approved",
      approvedAt: now,
      approvedBy: args.approvedBy,
      updatedAt: now,
    });

    return { success: true, applied: appliedCount };
  },
});

// Reject analysis
export const rejectAnalysis = mutation({
  args: {
    resultId: v.id("analysisResults"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.get(args.resultId);
    if (!result) throw new Error("Analysis result not found");

    await ctx.db.patch(result._id, {
      status: "rejected",
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Get latest analysis for a date
export const getByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analysisResults")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
  },
});

// Get all analysis results
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analysisResults")
      .order("desc")
      .take(args.limit || 50);
  },
});

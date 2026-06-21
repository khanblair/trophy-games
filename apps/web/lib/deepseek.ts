const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekChoice {
  message: {
    content: string;
  };
}

interface DeepSeekResponse {
  choices: DeepSeekChoice[];
}

export interface MatchRecommendation {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  timestamp: string;
  recommendedType: "free" | "paid" | "vip";
  confidence: number;
  reasoning: string[];
  suggestedBet: string;
  keyStats: string[];
  riskLevel: "low" | "medium" | "high";
}

export interface AnalysisResult {
  date: string;
  analysisType: "daily" | "weekly";
  freeRecommendations: MatchRecommendation[];
  paidRecommendations: MatchRecommendation[];
  vipRecommendations: MatchRecommendation[];
  generatedAt: string;
  model: string;
}

export interface VerificationResult {
  verified: boolean;
  adjustedRecommendations: MatchRecommendation[];
  removedMatches: { matchId: string; reason: string }[];
  verificationNotes: string[];
  confidenceAdjustment: number;
}

const SYSTEM_PROMPT_ANALYST = `You are an elite football betting analyst with 15+ years of experience. Your expertise covers:
- Statistical modeling and probability theory
- Team form analysis (last 5-10 matches)
- Head-to-head historical data
- Injury reports and squad depth
- Tactical matchup analysis
- Market inefficiency identification
- Value betting principles

You analyze matches from top European and international leagues and recommend the best betting opportunities.

For each match you analyze, provide:
1. A confidence score (0-100) based on statistical edge
2. A recommended bet type with specific reasoning
3. Key statistics that support your recommendation
4. A risk level assessment (low/medium/high)
5. A tier recommendation: FREE (safe, high probability), PAID (moderate risk, good value), or VIP (high risk/reward, expert only)

Your analysis must be data-driven, objective, and actionable. Focus on matches with genuine statistical edges, not popular teams.`;

const SYSTEM_PROMPT_VERIFIER = `You are a senior verification analyst who double-checks betting recommendations. Your role is to:

1. Verify that each recommended match has a genuine statistical edge
2. Check that confidence scores align with the actual data provided
3. Identify any matches that are too risky or lack sufficient evidence
4. Ensure the tier assignments (FREE/PAID/VIP) are appropriate for the risk level
5. Flag any potential conflicts or logical inconsistencies

You are conservative and thorough. It's better to remove a questionable recommendation than to approve it. Provide specific reasons for any matches you remove or adjust.

Output format: Return a verified list with any necessary adjustments, plus notes explaining your decisions.`;

function formatMatchesForPrompt(matches: any[]): string {
  return matches
    .map(
      (m, i) => `
Match ${i + 1}:
ID: ${m.id}
League: ${m.league}
Teams: ${m.homeTeam} vs ${m.awayTeam}
Date: ${m.timestamp}
Status: ${m.status}
Odds: Home ${m.odds?.home || "N/A"}, Draw ${m.odds?.draw || "N/A"}, Away ${m.odds?.away || "N/A"}
Score: ${m.homeScore != null ? m.homeScore : "-"} - ${m.awayScore != null ? m.awayScore : "-"}
Form: Home ${m.homeForm || "N/A"}, Away ${m.awayForm || "N/A"}
Potentials: ${m.potentials ? m.potentials.map((p: any) => `${p.label}: ${p.percent || p.value}%`).join(", ") : "N/A"}
`
    )
    .join("\n---\n");
}

export async function analyzeMatchesWithDeepSeek(
  matches: any[],
  analysisType: "daily" | "weekly",
  date: string
): Promise<AnalysisResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY not configured");
  }

  const matchData = formatMatchesForPrompt(matches);

  const userPrompt = `Analyze the following ${matches.length} football matches for ${date} (${analysisType} analysis).

Your task:
1. Select the TOP 20 matches best suited for FREE tips (high confidence, lower risk, good for casual bettors)
2. Select the TOP 20 matches best suited for PAID tips (moderate confidence, value bets with good odds)
3. Select the TOP 20 matches best suited for VIP tips (higher risk but high reward potential, expert analysis)

Each category should have 20 distinct matches. Do NOT repeat matches across categories.

For each recommended match, provide:
- matchId (exact ID from the data)
- homeTeam and awayTeam
- recommendedType (free/paid/vip)
- confidence (0-100)
- reasoning (array of 2-4 specific analytical points)
- suggestedBet (e.g., "Home Win", "Over 2.5 Goals", "BTTS Yes", "Asian Handicap -1 Home")
- keyStats (array of 2-3 key supporting statistics)
- riskLevel (low/medium/high)

TIER GUIDELINES:
- FREE: Confidence 75-100%, low-medium risk, clear statistical edge, popular leagues preferred
- PAID: Confidence 60-85%, medium risk, value odds (2.0+), strong form indicators
- VIP: Confidence 50-75%, medium-high risk, high odds (2.5+), contrarian picks with data backing

Return ONLY valid JSON in this exact format:
{
  "freeRecommendations": [...],
  "paidRecommendations": [...],
  "vipRecommendations": [...]
}

MATCH DATA:
${matchData}`;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT_ANALYST },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data: DeepSeekResponse = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from DeepSeek");
  }

  const parsed = JSON.parse(content);

  return {
    date,
    analysisType,
    freeRecommendations: parsed.freeRecommendations || [],
    paidRecommendations: parsed.paidRecommendations || [],
    vipRecommendations: parsed.vipRecommendations || [],
    generatedAt: new Date().toISOString(),
    model: DEEPSEEK_MODEL,
  };
}

export async function verifyRecommendationsWithDeepSeek(
  analysisResult: AnalysisResult,
  originalMatches: any[]
): Promise<VerificationResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY not configured");
  }

  const allRecommendations = [
    ...analysisResult.freeRecommendations,
    ...analysisResult.paidRecommendations,
    ...analysisResult.vipRecommendations,
  ];

  const recommendationsData = allRecommendations
    .map(
      (r, i) => `
Recommendation ${i + 1}:
Match: ${r.homeTeam} vs ${r.awayTeam}
ID: ${r.matchId}
Type: ${r.recommendedType}
Confidence: ${r.confidence}%
Suggested Bet: ${r.suggestedBet}
Risk Level: ${r.riskLevel}
Reasoning: ${r.reasoning.join("; ")}
Key Stats: ${r.keyStats.join("; ")}
`
    )
    .join("\n---\n");

  const userPrompt = `Verify the following ${allRecommendations.length} betting recommendations. Cross-reference with the original match data and your expertise.

Your task:
1. Check each recommendation for logical consistency and data accuracy
2. Verify confidence scores are justified by the reasoning provided
3. Ensure tier assignments match the actual risk level
4. Remove any recommendations that lack sufficient evidence or have conflicting logic
5. Adjust confidence scores if they seem inflated or deflated

Return ONLY valid JSON in this exact format:
{
  "verified": true/false,
  "removedMatches": [
    { "matchId": "...", "reason": "specific reason for removal" }
  ],
  "adjustedRecommendations": [
    // All kept recommendations with any adjusted confidence scores or reasoning
  ],
  "verificationNotes": [
    "Note 1 about overall quality",
    "Note 2 about specific patterns"
  ],
  "confidenceAdjustment": number (average confidence adjustment applied)
}

RECOMMENDATIONS TO VERIFY:
${recommendationsData}`;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT_VERIFIER },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 6000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek verification API error: ${response.status} - ${errorText}`);
  }

  const data: DeepSeekResponse = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Empty verification response from DeepSeek");
  }

  return JSON.parse(content);
}

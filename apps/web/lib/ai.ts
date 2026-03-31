'use server';

import { AI_MODELS, DEFAULT_MODEL } from '@/app/constants/models';

// --- Web Search Integration (Tavily) ---

interface TavilySearchResult {
    title: string;
    url: string;
    content: string;
}

interface TavilyResponse {
    answer?: string;
    results: TavilySearchResult[];
}

async function performWebSearch(query: string): Promise<TavilyResponse | null> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        console.warn('[AI] TAVILY_API_KEY not set, skipping web search');
        return null;
    }

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                search_depth: 'basic',
                include_answer: true,
                max_results: 3,
            }),
        });

        if (!response.ok) {
            console.error('[AI] Tavily search failed:', await response.text());
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('[AI] Web search error:', error);
        return null;
    }
}

// --- League Suggestions with Web Search ---

export interface AIAnalysis {
    prediction: string;
    confidence: number;
    reasoning: string[];
    suggestedBet?: string;
}

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

function getOpenRouterClient() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not defined in environment variables');
    }
    return { apiKey };
}

async function callOpenRouter(prompt: string, systemPrompt?: string): Promise<string> {
    const { apiKey } = getOpenRouterClient();
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Trophy Games',
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL.id,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt || 'You are an expert sports analyst specializing in football predictions.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${error}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || '{}';
}

export async function analyzeMatch(matchData: unknown): Promise<AIAnalysis> {
    try {
        const prompt = `
Analyze the following sports match data and provide a professional betting prediction.
DO NOT only provide "Home Win" or "Away Win" predictions. 
Consider all primary markets including:
- Full Time Result (1X2): Home, Away, or DRAW
- Over/Under Goals (e.g., Over 2.5, Under 1.5)
- Both Teams to Score (BTTS)
- Double Chance (e.g., 1X, X2)

Choose the prediction with the highest statistical probability based on the provided match data, including any available historical stats, odds, and team info.

Include confidence level (0-100), detailed reasoning, and a suggested bet if applicable.
Return the result ONLY as a JSON object with this structure:
{
  "prediction": "string (e.g., 'Over 2.5 Goals', 'Home Win', 'Draw', 'BTTS - Yes')",
  "confidence": number,
  "reasoning": ["string"],
  "suggestedBet": "string"
}

Match Data:
${JSON.stringify(matchData, null, 2)}
`;

        const content = await callOpenRouter(prompt);
        const result = JSON.parse(content);
        
        return {
            prediction: result.prediction || 'No prediction available',
            confidence: result.confidence || 0,
            reasoning: result.reasoning || [],
            suggestedBet: result.suggestedBet,
        };
    } catch (error) {
        console.error('[AI] Analysis failed:', error);
        return {
            prediction: 'Analysis failed',
            confidence: 0,
            reasoning: ['Error communicating with AI service'],
        };
    }
}

// New function: Get AI suggestions for match form
export interface MatchFormSuggestion {
    homeTeam: string;
    awayTeam: string;
    league: string;
    country: string;
    suggestedOdds: {
        home: string;
        draw: string;
        away: string;
    };
    prediction: string;
    confidence: number;
}

export async function getMatchSuggestions(context: string): Promise<Partial<MatchFormSuggestion>> {
    try {
        const prompt = `
Based on the following context about a football match, extract or suggest match details.
Context: "${context}"

Return ONLY a JSON object with this structure (omit fields you can't determine):
{
  "homeTeam": "Home team name",
  "awayTeam": "Away team name", 
  "league": "League name",
  "country": "Country",
  "suggestedOdds": {
    "home": "1.85",
    "draw": "3.40",
    "away": "2.10"
  },
  "prediction": "e.g., Home Win, Over 2.5, BTTS Yes",
  "confidence": 75
}

If the context mentions specific teams (like "Manchester United vs Liverpool"), extract them.
If the context mentions a league (like "Premier League" or "La Liga"), extract it.
Suggest realistic odds based on team strengths if mentioned.
`;

        const content = await callOpenRouter(prompt, 'You are a helpful assistant that extracts football match information from text.');
        return JSON.parse(content);
    } catch (error) {
        console.error('[AI] Match suggestion failed:', error);
        return {};
    }
}

// New function: Enhance match data with AI analysis
export interface MatchEnhancement {
    keyStats: string[];
    headToHead: string;
    formAnalysis: string;
    bettingTips: string[];
}

export async function enhanceMatchData(matchData: {
    homeTeam: string;
    awayTeam: string;
    league: string;
}): Promise<MatchEnhancement> {
    try {
        const prompt = `
Provide detailed analysis for a football match between ${matchData.homeTeam} and ${matchData.awayTeam} in ${matchData.league}.

Return ONLY a JSON object with this structure:
{
  "keyStats": ["Stat 1", "Stat 2", "Stat 3"],
  "headToHead": "Brief H2H summary",
  "formAnalysis": "Recent form analysis",
  "bettingTips": ["Tip 1", "Tip 2"]
}

Focus on general football knowledge about these teams if they're well-known.
`;

        const content = await callOpenRouter(prompt);
        return JSON.parse(content);
    } catch (error) {
        console.error('[AI] Match enhancement failed:', error);
        return {
            keyStats: [],
            headToHead: '',
            formAnalysis: '',
            bettingTips: [],
        };
    }
}

export interface LeagueFormSuggestion {
    name: string;
    country: string;
    type: 'league' | 'cup';
    logo?: string;
    description?: string;
}

export async function getLeagueSuggestions(context: string): Promise<Partial<LeagueFormSuggestion>> {
    // First, try web search for better accuracy
    const searchQuery = `football league "${context}" country logo official`;
    const searchResults = await performWebSearch(searchQuery);

    const searchContext = searchResults?.answer 
        ? `\n\nWeb Search Results:\n${searchResults.answer}\n\nSources:\n${searchResults.results.map(r => `- ${r.title}: ${r.content.substring(0, 200)}`).join('\n')}`
        : '';

    try {
        const prompt = `
Based on the following context about a football/soccer league, extract or suggest accurate league details.
User Input: "${context}"
${searchContext}

Return ONLY a JSON object with this structure:
{
  "name": "Official full league name",
  "country": "Country name",
  "type": "league" or "cup",
  "logo": "URL to official logo if found, or leave empty",
  "description": "Brief description of the league"
}

Examples:
- Input: "EPL" → Output: {"name": "English Premier League", "country": "England", "type": "league"}
- Input: "Champions League" → Output: {"name": "UEFA Champions League", "country": "Europe", "type": "cup"}
- Input: "Spanish league" → Output: {"name": "La Liga", "country": "Spain", "type": "league"}
- Input: "Bundesliga" → Output: {"name": "Bundesliga", "country": "Germany", "type": "league"}

Provide the most accurate official name based on web search results if available.
`;

        const content = await callOpenRouter(prompt, 'You are an expert on football leagues worldwide. Use web search results to provide accurate information.');
        return JSON.parse(content);
    } catch (error) {
        console.error('[AI] League suggestion failed:', error);
        return {};
    }
}

// Enhanced match suggestions with web search
export async function getMatchSuggestionsWithSearch(context: string): Promise<Partial<MatchFormSuggestion>> {
    // Extract teams from context for better search
    const searchQuery = `football match "${context}" odds teams lineup 2024 2025`;
    const searchResults = await performWebSearch(searchQuery);

    const searchContext = searchResults?.answer 
        ? `\n\nWeb Search Results:\n${searchResults.answer}\n\nSources:\n${searchResults.results.map(r => `- ${r.title}: ${r.content.substring(0, 300)}`).join('\n')}`
        : '';

    try {
        const prompt = `
Based on the following context about a football match, extract or suggest match details.
User Input: "${context}"
${searchContext}

Return ONLY a JSON object with this structure (omit fields you can't determine):
{
  "homeTeam": "Home team full official name",
  "awayTeam": "Away team full official name", 
  "league": "League/competition name",
  "country": "Country of the league",
  "suggestedOdds": {
    "home": "decimal odds like 1.85",
    "draw": "decimal odds like 3.40", 
    "away": "decimal odds like 2.10"
  },
  "prediction": "e.g., Home Win, Over 2.5, BTTS Yes",
  "confidence": 75
}

Use web search results to find accurate team names, league info, and realistic odds. If odds aren't found in search, suggest realistic odds based on team strengths.
`;

        const content = await callOpenRouter(prompt, 'You are a helpful assistant that extracts football match information from text and web search results.');
        return JSON.parse(content);
    } catch (error) {
        console.error('[AI] Match suggestion with search failed:', error);
        // Fallback to basic suggestions without search
        return getMatchSuggestions(context);
    }
}

// Get available AI models
export async function getAvailableModels() {
    return AI_MODELS;
}

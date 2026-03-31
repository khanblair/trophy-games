'use server';

import { AI_MODELS, DEFAULT_MODEL, AIModel } from '@/app/constants/models';

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

// --- AI Model Management ---

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
    error?: {
        message: string;
        code: number;
    };
}

interface ModelCallResult {
    content: string;
    usedModel: AIModel;
    attempts: number;
    errors: string[];
}

function getOpenRouterClient() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not defined in environment variables');
    }
    return { apiKey };
}

async function callOpenRouterWithFailover(
    prompt: string, 
    preferredModel: AIModel,
    systemPrompt?: string
): Promise<ModelCallResult> {
    const { apiKey } = getOpenRouterClient();
    const errors: string[] = [];
    
    // Get all models, starting with preferred one
    const modelQueue = [
        preferredModel,
        ...AI_MODELS.filter(m => m.id !== preferredModel.id)
    ];

    for (let i = 0; i < modelQueue.length; i++) {
        const model = modelQueue[i];
        
        try {
            console.log(`[AI] Trying model ${i + 1}/${modelQueue.length}: ${model.name}`);
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                    'X-Title': 'Trophy Games',
                },
                body: JSON.stringify({
                    model: model.id,
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

            // Check for rate limiting or other errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
                
                // Check if it's a rate limit error
                if (response.status === 429 || 
                    errorMessage.toLowerCase().includes('rate limit') ||
                    errorMessage.toLowerCase().includes('quota') ||
                    errorMessage.toLowerCase().includes('too many requests')) {
                    console.warn(`[AI] Rate limited on ${model.name}: ${errorMessage}`);
                    errors.push(`${model.name}: Rate limited`);
                    continue; // Try next model
                }
                
                // Check if model is overloaded
                if (response.status === 503 || 
                    errorMessage.toLowerCase().includes('overloaded') ||
                    errorMessage.toLowerCase().includes('busy')) {
                    console.warn(`[AI] Model ${model.name} overloaded: ${errorMessage}`);
                    errors.push(`${model.name}: Overloaded`);
                    continue; // Try next model
                }
                
                throw new Error(`OpenRouter API error: ${errorMessage}`);
            }

            const data: OpenRouterResponse = await response.json();
            
            // Check for error in response body
            if (data.error) {
                const errorMessage = data.error.message || 'Unknown error';
                if (errorMessage.toLowerCase().includes('rate limit') ||
                    errorMessage.toLowerCase().includes('quota')) {
                    console.warn(`[AI] Rate limited on ${model.name}: ${errorMessage}`);
                    errors.push(`${model.name}: Rate limited`);
                    continue; // Try next model
                }
                throw new Error(errorMessage);
            }

            const content = data.choices[0]?.message?.content || '{}';
            
            console.log(`[AI] Successfully used model: ${model.name}`);
            
            return {
                content,
                usedModel: model,
                attempts: i + 1,
                errors
            };
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[AI] Error with ${model.name}:`, errorMessage);
            errors.push(`${model.name}: ${errorMessage}`);
            
            // If this is the last model, throw the error
            if (i === modelQueue.length - 1) {
                throw new Error(`All models failed: ${errors.join('; ')}`);
            }
            
            // Otherwise continue to next model
            continue;
        }
    }
    
    throw new Error(`All models failed: ${errors.join('; ')}`);
}

// --- AI Analysis Functions ---

export interface AIAnalysis {
    prediction: string;
    confidence: number;
    reasoning: string[];
    suggestedBet?: string;
}

export interface AICallMetadata {
    usedModel: AIModel;
    attempts: number;
    errors: string[];
}

export async function analyzeMatch(
    matchData: unknown, 
    preferredModel?: AIModel
): Promise<AIAnalysis & { metadata?: AICallMetadata }> {
    const model = preferredModel || DEFAULT_MODEL;
    
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

        const result = await callOpenRouterWithFailover(prompt, model);
        const parsed = JSON.parse(result.content);
        
        return {
            prediction: parsed.prediction || 'No prediction available',
            confidence: parsed.confidence || 0,
            reasoning: parsed.reasoning || [],
            suggestedBet: parsed.suggestedBet,
            metadata: {
                usedModel: result.usedModel,
                attempts: result.attempts,
                errors: result.errors
            }
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

export async function getMatchSuggestions(
    context: string, 
    preferredModel?: AIModel
): Promise<Partial<MatchFormSuggestion> & { metadata?: AICallMetadata }> {
    const model = preferredModel || DEFAULT_MODEL;
    
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

        const result = await callOpenRouterWithFailover(
            prompt, 
            model,
            'You are a helpful assistant that extracts football match information from text.'
        );
        
        return {
            ...JSON.parse(result.content),
            metadata: {
                usedModel: result.usedModel,
                attempts: result.attempts,
                errors: result.errors
            }
        };
    } catch (error) {
        console.error('[AI] Match suggestion failed:', error);
        return {};
    }
}

// Enhanced match suggestions with web search
export async function getMatchSuggestionsWithSearch(
    context: string, 
    preferredModel?: AIModel
): Promise<Partial<MatchFormSuggestion> & { metadata?: AICallMetadata }> {
    const model = preferredModel || DEFAULT_MODEL;
    
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

        const result = await callOpenRouterWithFailover(
            prompt,
            model,
            'You are a helpful assistant that extracts football match information from text and web search results.'
        );
        
        return {
            ...JSON.parse(result.content),
            metadata: {
                usedModel: result.usedModel,
                attempts: result.attempts,
                errors: result.errors
            }
        };
    } catch (error) {
        console.error('[AI] Match suggestion with search failed:', error);
        // Fallback to basic suggestions without search
        return getMatchSuggestions(context, model);
    }
}

// New function: Enhance match data with AI analysis
export interface MatchEnhancement {
    keyStats: string[];
    headToHead: string;
    formAnalysis: string;
    bettingTips: string[];
}

export async function enhanceMatchData(
    matchData: { homeTeam: string; awayTeam: string; league: string },
    preferredModel?: AIModel
): Promise<MatchEnhancement & { metadata?: AICallMetadata }> {
    const model = preferredModel || DEFAULT_MODEL;
    
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

        const result = await callOpenRouterWithFailover(prompt, model);
        
        return {
            ...JSON.parse(result.content),
            metadata: {
                usedModel: result.usedModel,
                attempts: result.attempts,
                errors: result.errors
            }
        };
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

export async function getLeagueSuggestions(
    context: string,
    preferredModel?: AIModel
): Promise<Partial<LeagueFormSuggestion> & { metadata?: AICallMetadata }> {
    const model = preferredModel || DEFAULT_MODEL;
    
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

        const result = await callOpenRouterWithFailover(
            prompt,
            model,
            'You are an expert on football leagues worldwide. Use web search results to provide accurate information.'
        );
        
        return {
            ...JSON.parse(result.content),
            metadata: {
                usedModel: result.usedModel,
                attempts: result.attempts,
                errors: result.errors
            }
        };
    } catch (error) {
        console.error('[AI] League suggestion failed:', error);
        return {};
    }
}

// Get available AI models
export async function getAvailableModels() {
    return AI_MODELS;
}

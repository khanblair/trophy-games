'use server';

import Groq from 'groq-sdk';

let groq: Groq | null = null;

function getGroqClient() {
    if (groq) return groq;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not defined in environment variables');
    }
    groq = new Groq({ apiKey });
    return groq;
}

export interface AIAnalysis {
    prediction: string;
    confidence: number;
    reasoning: string[];
    suggestedBet?: string;
}

export async function analyzeMatch(matchData: unknown): Promise<AIAnalysis> {
    try {
        const client = getGroqClient();
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

        const completion = await client.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert sports analyst and data scientist specializing in football (soccer) predictions.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'groq/compound',
            response_format: { type: 'json_object' },
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
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

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
      Include confidence level (0-100), reasoning, and a suggested bet if applicable.
      Return the result ONLY as a JSON object with this structure:
      {
        "prediction": "string",
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

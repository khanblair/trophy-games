import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const fetchMatchInsights = async (homeTeam: string, awayTeam: string, leagueName: string) => {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
        console.error('Groq API Key is missing (EXPO_PUBLIC_GROQ_API_KEY)');
        return 'AI Insights are currently unavailable. (Please restart your dev server if you just added the key)';
    }

    const groqClient = axios.create({
        baseURL: GROQ_API_URL,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
    });

    try {
        const response = await groqClient.post('', {
            model: 'groq/compound',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional football analyst. Provide a very concise (max 3 sentences) betting-focused insight for the given match. Focus on current form and key trends. IMPORTANT: Provide PLAIN TEXT ONLY. Do not use markdown, bolding, italics, or tables.',
                },
                {
                    role: 'user',
                    content: `Analyze the match: ${homeTeam} vs ${awayTeam} in ${leagueName}. Provide plain text only.`,
                },
            ],
            max_tokens: 150,
            temperature: 0.7,
        });

        return response.data.choices[0].message.content;
    } catch (error: any) {
        console.error('Groq API Error:', error.response?.data || error.message);
        return 'Failed to fetch AI insights. Please try again later.';
    }
};

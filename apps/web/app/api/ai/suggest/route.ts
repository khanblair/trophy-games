import { NextResponse } from 'next/server';
import { 
    getMatchSuggestions, 
    enhanceMatchData, 
    getLeagueSuggestions,
    getMatchSuggestionsWithSearch 
} from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { type, context, matchData, useWebSearch = false } = await req.json();

        if (type === 'suggest') {
            // Use web search if requested and available
            const suggestions = useWebSearch 
                ? await getMatchSuggestionsWithSearch(context)
                : await getMatchSuggestions(context);
            return NextResponse.json({ success: true, suggestions });
        }

        if (type === 'suggest-league') {
            const suggestions = await getLeagueSuggestions(context);
            return NextResponse.json({ success: true, suggestions });
        }

        if (type === 'enhance') {
            const enhancement = await enhanceMatchData(matchData);
            return NextResponse.json({ success: true, enhancement });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        console.error('[AI API] Error:', error);
        return NextResponse.json({ 
            error: 'AI processing failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

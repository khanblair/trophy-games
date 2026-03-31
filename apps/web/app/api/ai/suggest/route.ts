import { NextResponse } from 'next/server';
import { 
    getMatchSuggestions, 
    enhanceMatchData, 
    getLeagueSuggestions,
    getMatchSuggestionsWithSearch 
} from '@/lib/ai';
import { AI_MODELS, DEFAULT_MODEL } from '@/app/constants/models';

export async function POST(req: Request) {
    try {
        const { type, context, matchData, useWebSearch = false, modelId } = await req.json();

        // Find the selected model or use default
        const selectedModel = modelId 
            ? AI_MODELS.find(m => m.id === modelId) || DEFAULT_MODEL
            : DEFAULT_MODEL;

        if (type === 'suggest') {
            // Use web search if requested and available
            const suggestions = useWebSearch 
                ? await getMatchSuggestionsWithSearch(context, selectedModel)
                : await getMatchSuggestions(context, selectedModel);
            return NextResponse.json({ 
                success: true, 
                suggestions,
                metadata: suggestions.metadata
            });
        }

        if (type === 'suggest-league') {
            const suggestions = await getLeagueSuggestions(context, selectedModel);
            return NextResponse.json({ 
                success: true, 
                suggestions,
                metadata: suggestions.metadata
            });
        }

        if (type === 'enhance') {
            const enhancement = await enhanceMatchData(matchData, selectedModel);
            return NextResponse.json({ 
                success: true, 
                enhancement,
                metadata: enhancement.metadata
            });
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

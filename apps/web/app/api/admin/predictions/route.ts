import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

export const dynamic = 'force-dynamic';

function getConvex() {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    return url ? new ConvexHttpClient(url) : null;
}

// GET /api/admin/predictions — List matches with their current predictions
export async function GET() {
    const convex = getConvex();
    if (!convex) return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });

    try {
        const matches = await convex.query(api.matches.getAll, { limit: 1000 });
        return NextResponse.json(matches);
    } catch (error) {
        console.error('[Admin Predictions API] GET failed:', error);
        return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
}

// POST /api/admin/predictions — Save a manual prediction for a match
export async function POST(req: Request) {
    const convex = getConvex();
    if (!convex) return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });

    try {
        const body = await req.json();
        const { matchId, aiPrediction } = body;

        if (!matchId || !aiPrediction?.prediction) {
            return NextResponse.json({ error: 'matchId and aiPrediction.prediction are required' }, { status: 400 });
        }

        const confidence = Number(aiPrediction.confidence);
        if (isNaN(confidence) || confidence < 1 || confidence > 100) {
            return NextResponse.json({ error: 'confidence must be a number between 1 and 100' }, { status: 400 });
        }

        await convex.mutation(api.matches.saveAIPrediction, {
            matchId: String(matchId),
            aiPrediction: {
                prediction: String(aiPrediction.prediction).trim(),
                confidence,
                reasoning: Array.isArray(aiPrediction.reasoning) ? aiPrediction.reasoning : [],
                suggestedBet: aiPrediction.suggestedBet ? String(aiPrediction.suggestedBet).trim() : undefined,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Admin Predictions API] POST failed:', error);
        return NextResponse.json({
            error: 'Failed to save prediction',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

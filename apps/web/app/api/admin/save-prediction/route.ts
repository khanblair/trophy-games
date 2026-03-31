import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export async function POST(req: Request) {
    try {
        if (!convex) {
            return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
        }

        const { matchId, aiPrediction } = await req.json();

        if (!matchId || !aiPrediction) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Call Convex mutation
        await convex.mutation(api.matches.saveAIPrediction, {
            matchId,
            aiPrediction: {
                prediction: aiPrediction.prediction,
                confidence: aiPrediction.confidence,
                reasoning: aiPrediction.reasoning,
                suggestedBet: aiPrediction.suggestedBet,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Save Prediction API] Error:', error);
        return NextResponse.json({ 
            error: 'Failed to save prediction',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export async function POST(request: Request) {
    try {
        if (!convexUrl) {
            return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
        }

        const convex = new ConvexHttpClient(convexUrl);
        const body = await request.json();
        const { matchId, aiPrediction } = body;

        if (!matchId || !aiPrediction) {
            return NextResponse.json({ error: 'Missing matchId or aiPrediction' }, { status: 400 });
        }

        await convex.mutation(api.matches.saveAIPrediction, {
            matchId,
            aiPrediction
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Save AI prediction failed:', error);
        return NextResponse.json({ error: 'Failed to save AI prediction' }, { status: 500 });
    }
}

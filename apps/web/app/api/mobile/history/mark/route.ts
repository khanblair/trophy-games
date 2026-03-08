import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
    try {
        const { matchId, isHistory } = await request.json();

        if (!matchId) {
            return NextResponse.json({ error: 'matchId required' }, { status: 400 });
        }

        await convex.mutation(api.matches.markAsHistory, {
            matchId,
            isHistory: isHistory ?? true,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Mark as history failed:', error);
        return NextResponse.json({ error: 'Failed to mark as history' }, { status: 500 });
    }
}

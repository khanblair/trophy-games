import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
    try {
        const { matchId, result, isHistory } = await request.json();

        if (!matchId || !result) {
            return NextResponse.json({ error: 'matchId and result required' }, { status: 400 });
        }

        if (!['win', 'lose', 'draw'].includes(result)) {
            return NextResponse.json({ error: 'result must be win, lose, or draw' }, { status: 400 });
        }

        await convex.mutation(api.matches.updateMatchResult, {
            matchId,
            result,
            isHistory: isHistory ?? true,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Update match result failed:', error);
        return NextResponse.json({ error: 'Failed to update result' }, { status: 500 });
    }
}

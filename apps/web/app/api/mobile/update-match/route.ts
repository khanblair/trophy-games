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
        const { matchId, matchType, isTrending } = body;

        if (matchType) {
            await convex.mutation(api.matches.updateMatchType, { matchId, matchType });
        }

        if (isTrending !== undefined) {
            await convex.mutation(api.matches.toggleTrending, { matchId });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Update match failed:', error);
        return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
    }
}

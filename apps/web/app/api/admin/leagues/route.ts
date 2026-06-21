import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";
import { MatchData } from '@trophy-games/shared';
import { deriveLeaguesFromMatches } from '@/lib/footystats';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// GET - Leagues are derived from the Convex matches (kept in sync with the
// proxy), so web and mobile always show the same competitions.
export async function GET() {
    if (!convex) {
        return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
    }

    try {
        const matches = await convex.query(api.matches.getAll, { limit: 1000 });
        const leagues = deriveLeaguesFromMatches(matches as MatchData[]);
        return NextResponse.json(leagues);
    } catch (error) {
        console.error('[Admin Leagues API] Failed to fetch leagues:', error);
        return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 });
    }
}

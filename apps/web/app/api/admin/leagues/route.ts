import { NextResponse } from 'next/server';
import { fetchFootyStatsMatches, deriveLeaguesFromMatches } from '@/lib/footystats';

// GET - Leagues are derived from the FootyStats proxy matches (same source as
// the mobile app), so web and mobile always show the same leagues.
export async function GET() {
    try {
        const matches = await fetchFootyStatsMatches();
        const leagues = deriveLeaguesFromMatches(matches);
        return NextResponse.json(leagues);
    } catch (error) {
        console.error('[Admin Leagues API] Failed to fetch leagues:', error);
        return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 });
    }
}

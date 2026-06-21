import { NextResponse } from 'next/server';
import { fetchFootyStatsMatchStats } from '@/lib/footystats';

// Rich per-match details (form, H2H, corners, detailed odds, standings, logos)
// come from the proxy /match-stats endpoint on demand. Runs server-side, so the
// HTTP (cleartext) call is fine.
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    try {
        const stats = await fetchFootyStatsMatchStats(id);
        return NextResponse.json(stats);
    } catch (error) {
        console.error('[Match Stats API] Failed:', error);
        return NextResponse.json({ error: 'Failed to fetch match stats' }, { status: 500 });
    }
}

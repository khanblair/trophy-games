import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const source = searchParams.get('source') as 'odds-api' | 'goaloo-live' | null;
        
        const data = await loadData();
        let leagues = data.leagues || [];

        // If source specified, filter leagues that have matches from that source
        if (source) {
            const matchesWithSource = (data.matches || []).filter((m: any) => m.source === source);
            const leagueIds = new Set(matchesWithSource.map((m: any) => m.leagueId));
            leagues = leagues.filter((l: any) => leagueIds.has(l.id));
        }

        console.log(`[API /mobile/leagues] Returning ${leagues.length} leagues`);
        return NextResponse.json(leagues);
    } catch (error) {
        console.error('[API] Fetch leagues failed:', error);
        return NextResponse.json({ error: 'Failed to load leagues' }, { status: 500 });
    }
}

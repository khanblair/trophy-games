import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as 'free' | 'paid' | 'vip' | null;
        const source = (searchParams.get('source') as 'odds-api' | 'goaloo-live' | null) || 'odds-api';
        const status = searchParams.get('status') as 'live' | 'scheduled' | 'finished' | null;
        const limit = parseInt(searchParams.get('limit') || '50');

        let data;
        try {
            data = await loadData();
        } catch (loadError) {
            console.error('[API] Load data failed:', loadError);
            return NextResponse.json({ error: 'Data service unavailable', matches: [] }, { status: 503 });
        }

        console.log(`[API /mobile/matches] Loaded ${data.matches?.length || 0} matches from storage`);

        let matches = data.matches || [];

        // Filter by source (odds-api or goaloo-live)
        if (source) {
            console.log(`[API /mobile/matches] Filtering by source: ${source}`);
            matches = matches.filter((m: any) => m.source === source);
            console.log(`[API /mobile/matches] After source filter: ${matches.length} matches`);
        }

        // Filter by match type
        if (type) {
            console.log(`[API /mobile/matches] Filtering by type: ${type}`);
            matches = matches.filter((m: any) => m.matchType === type);
            console.log(`[API /mobile/matches] After type filter: ${matches.length} matches`);
        }

        // Filter by status
        if (status) {
            console.log(`[API /mobile/matches] Filtering by status: ${status}`);
            matches = matches.filter((m: any) => {
                if (status === 'live') {
                    return m.source === 'goaloo-live' || m.status.includes('Live') || m.status === 'Halftime';
                } else if (status === 'scheduled') {
                    return m.status === 'Scheduled';
                } else if (status === 'finished') {
                    return m.status === 'FT' || m.status === 'Finished';
                }
                return true;
            });
            console.log(`[API /mobile/matches] After status filter: ${matches.length} matches`);
        }

        return NextResponse.json(matches.slice(0, limit));
    } catch (error) {
        console.error('[API] Fetch matches failed:', error);
        return NextResponse.json({ error: 'Failed to load matches', matches: [] }, { status: 500 });
    }
}

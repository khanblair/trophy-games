import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as 'free' | 'paid' | 'vip' | null;
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const data = await loadData();
        
        console.log(`[API /mobile/matches] Loaded ${data.matches.length} matches from storage`);
        
        let matches = data.matches;

        if (type) {
            console.log(`[API /mobile/matches] Filtering by type: ${type}`);
            matches = matches.filter((m: any) => {
                console.log(`[API /mobile/matches] Match ${m.id}: matchType=${m.matchType}`);
                return m.matchType === type;
            });
            console.log(`[API /mobile/matches] After filter: ${matches.length} matches`);
        }

        return NextResponse.json(matches.slice(0, limit));
    } catch (error) {
        console.error('[API] Fetch matches failed:', error);
        return NextResponse.json({ error: 'Failed to load matches' }, { status: 500 });
    }
}

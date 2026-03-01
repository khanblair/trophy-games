import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const source = searchParams.get('source') as 'odds-api' | 'goaloo-live' | null;
        
        const data = await loadData();
        let matches = (data.matches || []).filter((m: any) => m.isTrending === true);

        // Filter by source if specified
        if (source) {
            matches = matches.filter((m: any) => m.source === source);
        }

        console.log(`[API /mobile/trending] Returning ${matches.length} trending matches`);
        return NextResponse.json(matches);
    } catch (error) {
        console.error('[API] Fetch trending matches failed:', error);
        return NextResponse.json({ error: 'Failed to load trending matches' }, { status: 500 });
    }
}

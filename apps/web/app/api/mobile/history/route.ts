import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const source = (searchParams.get('source') as 'odds-api' | 'goaloo-live' | null) || 'odds-api';

        const data = await loadData();
        let matches = (data.matches || []).filter((m: any) => m.status === 'Finished');

        if (source) {
            matches = matches.filter((m: any) => m.source === source);
        }

        return NextResponse.json(matches.slice(0, 50));
    } catch (error) {
        console.error('[API] Fetch history failed:', error);
        return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
    }
}

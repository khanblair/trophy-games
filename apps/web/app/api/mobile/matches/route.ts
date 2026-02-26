import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as 'free' | 'paid' | 'vip' | null;
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const data = await loadData();
        let matches = data.matches;

        if (type && ['free', 'paid', 'vip'].includes(type)) {
            matches = matches.filter((m: any) => m.matchType === type);
        }

        return NextResponse.json(matches.slice(0, limit));
    } catch (error) {
        console.error('[API] Fetch matches failed:', error);
        return NextResponse.json({ error: 'Failed to load matches' }, { status: 500 });
    }
}

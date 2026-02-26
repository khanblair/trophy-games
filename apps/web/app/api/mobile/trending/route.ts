import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET() {
    try {
        const data = await loadData();
        const matches = (data.matches || []).filter((m: any) => m.isTrending === true);
        return NextResponse.json(matches);
    } catch (error) {
        console.error('[API] Fetch trending matches failed:', error);
        return NextResponse.json({ error: 'Failed to load trending matches' }, { status: 500 });
    }
}

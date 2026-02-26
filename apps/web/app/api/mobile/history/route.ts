import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET() {
    try {
        const data = await loadData();
        const matches = (data.matches || []).filter((m: any) => m.status === 'Finished');
        return NextResponse.json(matches.slice(0, 50));
    } catch (error) {
        console.error('[API] Fetch history failed:', error);
        return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
    }
}

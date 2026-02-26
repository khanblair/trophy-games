import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET() {
    try {
        const data = await loadData();
        return NextResponse.json(data.leagues);
    } catch (error) {
        console.error('[API] Leagues fetch failed:', error);
        return NextResponse.json({ error: 'Failed to load leagues' }, { status: 500 });
    }
}

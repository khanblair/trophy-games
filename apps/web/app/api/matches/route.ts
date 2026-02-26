import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET() {
    try {
        const data = await loadData();
        return NextResponse.json(data.matches);
    } catch (error) {
        console.error('[API] Matches fetch failed:', error);
        return NextResponse.json({ error: 'Failed to load matches' }, { status: 500 });
    }
}

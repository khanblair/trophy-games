import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '100');

        let matches: any[];

        if (startDate && endDate) {
            // Date-range query directly from Convex
            matches = await convex.query(api.matches.getHistoryByDateRange, {
                startDate,
                endDate,
                limit,
            });
        } else {
            // All history
            matches = await convex.query(api.matches.getHistory, { limit });
        }

        return NextResponse.json(matches);
    } catch (error) {
        console.error('[API] Fetch history failed:', error);
        return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
    }
}

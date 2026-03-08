import { NextResponse } from 'next/server';
import { fetchAllOdds } from '@/lib/odds-api';
import { fetchLiveMatches } from '@/lib/goaloo-live';
import { saveOddsData, saveLiveData } from '@/lib/storage';

// Vercel Cron: runs daily via vercel.json schedule
// Protected by CRON_SECRET
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    const results: Record<string, any> = {};

    try {
        // Sync odds API
        try {
            const { matches, leagues } = await fetchAllOdds();
            await saveOddsData(matches, leagues);
            results.odds = { success: true, count: matches.length };
        } catch (e: any) {
            results.odds = { success: false, error: e.message };
        }

        // Sync live matches
        try {
            const liveMatches = await fetchLiveMatches();
            await saveLiveData(liveMatches);
            results.live = { success: true, count: liveMatches.length };
        } catch (e: any) {
            results.live = { success: false, error: e.message };
        }

        return NextResponse.json({
            ok: true,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            ...results,
        });
    } catch (error: any) {
        console.error('[CRON] Sync failed:', error);
        return NextResponse.json({
            ok: false,
            error: error.message,
            duration: Date.now() - startTime,
        }, { status: 500 });
    }
}

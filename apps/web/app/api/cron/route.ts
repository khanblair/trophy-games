import { NextResponse } from 'next/server';
import { GoalooScraper } from '@/lib/scraper/scraper';
import { parseGoalooJS } from '@/lib/scraper/parsers';
import { saveData } from '@/lib/storage';

export const dynamic = 'force-dynamic'; // Ensure this route is never cached

export async function GET(req: Request) {
    try {
        // Secure the cron job with a secret (configure this in .env.local)
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Cron] 🔄 Starting scheduled live sync...');
        const scraper = new GoalooScraper();

        // Fetch live data (low bandwidth, high value)
        const jsContent = await scraper.fetchLiveScan();
        const { matches, leagues } = parseGoalooJS(jsContent);

        saveData({ leagues, matches });

        console.log(`[Cron] ✅ Sync complete. updated ${matches.length} matches.`);

        return NextResponse.json({
            success: true,
            message: `Synced ${matches.length} matches and ${leagues.length} leagues`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Cron] ❌ Sync failed:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}

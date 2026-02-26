import { NextResponse } from 'next/server';
import { GoalooScraper } from '@/lib/scraper/scraper';
import { parseLeaguePage, parseMatchData, parseGoalooJS } from '@/lib/scraper/parsers';
import { MatchData, LeagueInfo } from '@trophy-games/shared';
import { saveData } from '@/lib/storage';

// In-memory state for UI monitoring
interface ScrapeTask {
    status: 'idle' | 'running' | 'completed' | 'failed';
    processedCount: number;
    totalCount: number;
    results: { url: string; data: LeagueInfo | MatchData }[];
}

const currentTask: ScrapeTask = {
    status: 'idle',
    processedCount: 0,
    totalCount: 0,
    results: [],
};

const scraper = new GoalooScraper();

export async function POST(req: Request) {
    const { action, sitemapUrl, limit = 5 } = await req.json();

    if (action === 'live_scrape') {
        if (currentTask.status === 'running') {
            return NextResponse.json({ error: 'Task already running' }, { status: 400 });
        }

        console.log(`[API] 🚀 Starting LIVE scrape job...`);

        (async () => {
            try {
                currentTask.status = 'running';
                currentTask.results = [];
                currentTask.processedCount = 0;
                currentTask.totalCount = 1; // 1 big file

                const jsContent = await scraper.fetchLiveScan();
                currentTask.processedCount = 0.5; // Fetched

                const { matches, leagues } = parseGoalooJS(jsContent);
                console.log(`[API] ✅ Parsed ${matches.length} matches and ${leagues.length} leagues.`);

                // Save to storage
                await saveData({
                    leagues,
                    matches
                });

                currentTask.results = matches.map(m => ({ url: 'live-data', data: m }));
                currentTask.processedCount = 1;
                currentTask.status = 'completed';
                console.log(`[API] ✅ Live scrape completed.`);

            } catch (error) {
                console.error(`[API] ❌ Live scrape failed:`, error);
                currentTask.status = 'failed';
            }
        })();

        return NextResponse.json({ message: 'Live scraping started' });
    }

    if (action === 'start') {
        if (currentTask.status === 'running') {
            return NextResponse.json({ error: 'Task already running' }, { status: 400 });
        }

        console.log(`[API] 🚀 Starting scrape job for: ${sitemapUrl} (Limit: ${limit})`);

        (async () => {
            try {
                currentTask.status = 'running';
                currentTask.results = [];
                currentTask.processedCount = 0;

                const urls = await scraper.fetchSitemap(sitemapUrl);
                currentTask.totalCount = Math.min(urls.length, limit);

                scraper.reset();

                const newLeagues: LeagueInfo[] = [];
                const newMatches: MatchData[] = [];

                for (let i = 0; i < currentTask.totalCount; i++) {
                    const url = urls[i];

                    // Simple heuristic: if it contains 'standing' or 'league' it's a league, else trial as match
                    const isLeague = url.includes('standing') || url.includes('league');
                    const parser = isLeague ? parseLeaguePage : parseMatchData;

                    const data = await scraper.scrapePage(url, (html) => parser(html, url));

                    if (data) {
                        currentTask.results.push({ url, data });
                        if (isLeague) {
                            newLeagues.push(data as LeagueInfo);
                        } else {
                            newMatches.push(data as MatchData);
                        }
                    }

                    currentTask.processedCount++;

                    // Periodically save to storage
                    if (newLeagues.length > 0 || newMatches.length > 0) {
                        await saveData({
                            leagues: newLeagues.length > 0 ? newLeagues : undefined,
                            matches: newMatches.length > 0 ? newMatches : undefined
                        });
                    }

                    currentTask.processedCount++;
                    console.log(`[API] 🔄 Processed ${currentTask.processedCount}/${currentTask.totalCount} for ${sitemapUrl}`);

                    // Small safety for demo
                    if (currentTask.status !== 'running') break;
                }

                if (currentTask.status === 'running') {
                    console.log(`[API] ✅ Scrape job completed successfully.`);
                    currentTask.status = 'completed';
                } else {
                    console.log(`[API] 🛑 Scrape job stopped externally.`);
                }
            } catch (error) {
                console.error(`[API] ❌ Scrape job failed:`, error);
                currentTask.status = 'failed';
            }
        })();

        return NextResponse.json({ message: 'Scraping started' });
    }

    if (action === 'stop') {
        console.log(`[API] 🛑 Stopping scrape job.`);
        currentTask.status = 'idle';
        return NextResponse.json({ message: 'Scraping stopped' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function GET() {
    return NextResponse.json(currentTask);
}

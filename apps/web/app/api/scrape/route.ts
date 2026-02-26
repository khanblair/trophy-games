import { NextResponse } from 'next/server';
import { GoalooScraper } from '@/lib/scraper/scraper';
import { parseLeaguePage, parseMatchData, parseGoalooJS } from '@/lib/scraper/parsers';
import { MatchData, LeagueInfo } from '@trophy-games/shared';
import { saveData, loadData } from '@/lib/storage';

// Trending league URLs to scrape
const TRENDING_LEAGUES = [
    { url: 'https://football.goaloo.com/league/36', name: 'English Premier League', country: 'England' },
    { url: 'https://football.goaloo.com/league/8', name: 'German Bundesliga', country: 'Germany' },
    { url: 'https://football.goaloo.com/league/11', name: 'Spanish La Liga', country: 'Spain' },
    { url: 'https://football.goaloo.com/league/12', name: 'Italian Serie A', country: 'Italy' },
    { url: 'https://football.goaloo.com/league/13', name: 'French Ligue 1', country: 'France' },
    { url: 'https://football.goaloo.com/league/107', name: 'UEFA Champions League', country: 'Europe' },
    { url: 'https://football.goaloo.com/league/23', name: 'UEFA Europa League', country: 'Europe' },
];

// In-memory state for UI monitoring
interface ScrapeTask {
    status: 'idle' | 'running' | 'completed' | 'failed';
    processedCount: number;
    totalCount: number;
    results: { url: string; data: LeagueInfo | MatchData }[];
    currentLeague?: string;
}

const currentTask: ScrapeTask = {
    status: 'idle',
    processedCount: 0,
    totalCount: 0,
    results: [],
};

const scraper = new GoalooScraper();

export async function POST(req: Request) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Disable scraping in production - it won't work on Vercel
    if (isProduction) {
        return NextResponse.json({ 
            error: 'Scraping is disabled in production. Run scraping locally and the data will be available in production.',
            isProduction: true 
        }, { status: 403 });
    }

    const { action, sitemapUrl, limit = 5, leagueUrl } = await req.json();

    if (action === 'scrape_league') {
        if (currentTask.status === 'running') {
            return NextResponse.json({ error: 'Task already running' }, { status: 400 });
        }

        console.log(`[API] 🚀 Starting league scrape for: ${leagueUrl}`);

        (async () => {
            try {
                currentTask.status = 'running';
                currentTask.results = [];
                currentTask.processedCount = 0;
                currentTask.totalCount = 1;
                currentTask.currentLeague = leagueUrl;

                const jsContent = await scraper.fetchLiveScan();
                const { matches, leagues } = parseGoalooJS(jsContent);

                // Filter matches for this league
                const leagueId = parseInt(leagueUrl.match(/league\/(\d+)/)?.[1] || '0');
                const filteredMatches = matches.filter((m: any) => m.leagueId === leagueId);

                // Mark as trending
                const trendingMatches = filteredMatches.map((m: any) => ({
                    ...m,
                    isTrending: true,
                    matchType: 'free'
                }));

                await saveData({
                    leagues,
                    matches: trendingMatches
                });

                currentTask.results = trendingMatches.map((m: any) => ({ url: leagueUrl, data: m }));
                currentTask.processedCount = 1;
                currentTask.status = 'completed';
                console.log(`[API] ✅ League scrape completed. Found ${trendingMatches.length} matches.`);

            } catch (error) {
                console.error(`[API] ❌ League scrape failed:`, error);
                currentTask.status = 'failed';
            }
        })();

        return NextResponse.json({ message: 'League scraping started' });
    }

    if (action === 'scrape_trending') {
        if (currentTask.status === 'running') {
            return NextResponse.json({ error: 'Task already running' }, { status: 400 });
        }

        console.log(`[API] 🚀 Starting trending leagues scrape...`);

        (async () => {
            try {
                currentTask.status = 'running';
                currentTask.results = [];
                currentTask.processedCount = 0;
                currentTask.totalCount = TRENDING_LEAGUES.length;

                const jsContent = await scraper.fetchLiveScan();
                const { matches, leagues } = parseGoalooJS(jsContent);

                console.log(`[API] ✅ Parsed ${matches.length} matches, ${leagues.length} leagues`);

                // Get existing matches from storage to preserve matchType
                const existingData = await loadData();
                const existingMatchTypes = new Map(existingData.matches.map((m: any) => [m.id, m.matchType]));

                // Get trending league names
                const trendingLeagueNames = TRENDING_LEAGUES.map(l => l.name.toLowerCase());
                console.log(`[API] Looking for leagues:`, trendingLeagueNames);

                // Filter by league name (case insensitive) and preserve existing types
                const trendingMatches = matches
                    .filter((m: any) => {
                        const leagueName = m.league?.toLowerCase() || '';
                        return trendingLeagueNames.some(name => leagueName.includes(name));
                    })
                    .map((m: any) => ({
                        ...m,
                        isTrending: true,
                        matchType: existingMatchTypes.get(m.id) || 'free'
                    }));

                console.log(`[API] Found ${trendingMatches.length} trending matches`);

                await saveData({
                    leagues,
                    matches: trendingMatches
                });

                currentTask.results = trendingMatches.map((m: any) => ({ url: 'trending', data: m }));
                currentTask.processedCount = TRENDING_LEAGUES.length;
                currentTask.status = 'completed';
                console.log(`[API] ✅ Trending scrape completed. Found ${trendingMatches.length} matches.`);

            } catch (error) {
                console.error(`[API] ❌ Trending scrape failed:`, error);
                currentTask.status = 'failed';
            }
        })();

        return NextResponse.json({ message: 'Trending leagues scraping started' });
    }

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

                // Get existing matches from storage to preserve matchType
                const existingData = await loadData();
                const existingMatchTypes = new Map(existingData.matches.map((m: any) => [m.id, m.matchType]));

                // Merge with existing types (preserve paid/vip, default to free only for new matches)
                const matchesWithType = matches.map((m: any) => ({
                    ...m,
                    matchType: existingMatchTypes.get(m.id) || 'free',
                    isTrending: m.isTrending || false
                }));

                // Save to storage
                await saveData({
                    leagues,
                    matches: matchesWithType
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
    const isProduction = process.env.NODE_ENV === 'production';
    return NextResponse.json({
        ...currentTask,
        trendingLeagues: TRENDING_LEAGUES,
        isProduction,
        scrapingDisabled: isProduction,
        message: isProduction ? 'Scraping is disabled in production. Run scraping locally.' : undefined
    });
}

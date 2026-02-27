import { NextResponse } from 'next/server';
import { GoalooScraper } from '@/lib/scraper/scraper';
import { parseLeaguePage, parseMatchData, parseGoalooJS, parseOddsJS, parseH2HJS } from '@/lib/scraper/parsers';
import { MatchData, LeagueInfo, TRENDING_LEAGUES, TRENDING_LEAGUE_IDS } from '@trophy-games/shared';
import { saveData, loadData } from '@/lib/storage';

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
    const cronSecret = process.env.CRON_SECRET;

    // In production, only allow requests with a valid CRON_SECRET header.
    // This lets Vercel Cron or GitHub Actions trigger scrapes automatically.
    if (isProduction) {
        const providedSecret = req.headers.get('x-cron-secret');
        if (!cronSecret || providedSecret !== cronSecret) {
            return NextResponse.json({
                error: 'Scraping requires a valid X-Cron-Secret header in production.',
                isProduction: true
            }, { status: 403 });
        }
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

                let oddsMap = new Map();
                let h2hMap = new Map();

                try {
                    const oddsContent = await scraper.fetchOddsData();
                    if (oddsContent) {
                        oddsMap = parseOddsJS(oddsContent);
                    }
                } catch (oddsError) {
                    console.warn(`[API] ⚠️ Failed to fetch odds:`, oddsError);
                }

                try {
                    const h2hContent = await scraper.fetchH2HData();
                    if (h2hContent) {
                        h2hMap = parseH2HJS(h2hContent);
                    }
                } catch (h2hError) {
                    console.warn(`[API] ⚠️ Failed to fetch H2H:`, h2hError);
                }

                const leagueId = parseInt(leagueUrl.match(/league\/(\d+)/)?.[1] || '0');
                const filteredMatches = matches.filter((m: any) => m.leagueId === leagueId);

                const trendingMatches = filteredMatches.map((m: any) => {
                    const matchOdds = oddsMap.get(m.id);
                    const matchH2h = h2hMap.get(m.id);

                    return {
                        ...m,
                        isTrending: true,
                        matchType: 'free',
                        detailedOdds: matchOdds || m.detailedOdds,
                        h2h: matchH2h || m.h2h
                    };
                });

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

                let oddsMap = new Map();
                let h2hMap = new Map();

                try {
                    const oddsContent = await scraper.fetchOddsData();
                    if (oddsContent) {
                        oddsMap = parseOddsJS(oddsContent);
                        console.log(`[API] ✅ Parsed odds for ${oddsMap.size} matches.`);
                    }
                } catch (oddsError) {
                    console.warn(`[API] ⚠️ Failed to fetch odds:`, oddsError);
                }

                try {
                    const h2hContent = await scraper.fetchH2HData();
                    if (h2hContent) {
                        h2hMap = parseH2HJS(h2hContent);
                        console.log(`[API] ✅ Parsed H2H for ${h2hMap.size} matches.`);
                    }
                } catch (h2hError) {
                    console.warn(`[API] ⚠️ Failed to fetch H2H:`, h2hError);
                }

                const existingData = await loadData();
                const existingMatchTypes = new Map(existingData.matches.map((m: any) => [m.id, m.matchType]));

                // Filter by leagueId (fast, exact, no name-substring fragility)
                console.log(`[API] Filtering for ${TRENDING_LEAGUE_IDS.size} hot league IDs:`, Array.from(TRENDING_LEAGUE_IDS));

                const trendingMatches = matches
                    .filter((m: any) => TRENDING_LEAGUE_IDS.has(m.leagueId))
                    .map((m: any) => {
                        const matchOdds = oddsMap.get(m.id);
                        const matchH2h = h2hMap.get(m.id);

                        return {
                            ...m,
                            isTrending: true,
                            matchType: existingMatchTypes.get(m.id) || 'free',
                            // Use real odds/H2H if available, otherwise keep pre-generated fallback
                            detailedOdds: matchOdds || m.detailedOdds,
                            h2h: matchH2h || m.h2h
                        };
                    });

                console.log(`[API] Found ${trendingMatches.length} hot-league matches out of ${matches.length} total`);

                // Only save hot-league matches to Convex (not ALL matches)
                await saveData({
                    leagues: leagues.filter((l: any) => TRENDING_LEAGUE_IDS.has(l.id)),
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
                currentTask.totalCount = 1;

                const jsContent = await scraper.fetchLiveScan();
                currentTask.processedCount = 0.3;

                const { matches, leagues } = parseGoalooJS(jsContent);
                console.log(`[API] ✅ Parsed ${matches.length} matches and ${leagues.length} leagues.`);

                let oddsMap = new Map();
                let h2hMap = new Map();

                try {
                    const oddsContent = await scraper.fetchOddsData();
                    if (oddsContent) {
                        oddsMap = parseOddsJS(oddsContent);
                        console.log(`[API] ✅ Parsed odds for ${oddsMap.size} matches.`);
                    }
                } catch (oddsError) {
                    console.warn(`[API] ⚠️ Failed to fetch odds:`, oddsError);
                }

                try {
                    const h2hContent = await scraper.fetchH2HData();
                    if (h2hContent) {
                        h2hMap = parseH2HJS(h2hContent);
                        console.log(`[API] ✅ Parsed H2H for ${h2hMap.size} matches.`);
                    }
                } catch (h2hError) {
                    console.warn(`[API] ⚠️ Failed to fetch H2H:`, h2hError);
                }

                currentTask.processedCount = 0.6;

                const existingData = await loadData();
                const existingMatchTypes = new Map(existingData.matches.map((m: any) => [m.id, m.matchType]));

                // Only keep hot-league matches — no need to store all 550+ matches in Convex
                const hotMatches = matches
                    .filter((m: any) => TRENDING_LEAGUE_IDS.has(m.leagueId))
                    .map((m: any) => {
                        const matchOdds = oddsMap.get(m.id);
                        const matchH2h = h2hMap.get(m.id);

                        return {
                            ...m,
                            matchType: existingMatchTypes.get(m.id) || 'free',
                            isTrending: true,
                            detailedOdds: matchOdds || m.detailedOdds,
                            h2h: matchH2h || m.h2h
                        };
                    });

                console.log(`[API] ✅ Hot-league matches: ${hotMatches.length} / ${matches.length} total`);

                await saveData({
                    leagues: leagues.filter((l: any) => TRENDING_LEAGUE_IDS.has(l.id)),
                    matches: hotMatches
                });

                currentTask.results = hotMatches.map(m => ({ url: 'live-data', data: m }));
                currentTask.processedCount = 1;
                currentTask.status = 'completed';
                console.log(`[API] ✅ Live scrape completed with odds and h2h data.`);

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
        // In production, scraping is gated by X-Cron-Secret header (not fully disabled)
        cronProtected: isProduction,
    });
}

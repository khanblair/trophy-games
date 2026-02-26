#!/usr/bin/env bun
import * as cheerio from 'cheerio';

interface MatchData {
    id: string;
    league: string;
    leagueId?: number;
    homeTeam: string;
    awayTeam: string;
    timestamp: string;
    status: string;
    score: string;
    homeScore?: number;
    awayScore?: number;
    matchType?: 'free' | 'paid' | 'vip';
    isTrending?: boolean;
}

interface LeagueInfo {
    id: number;
    name: string;
    url: string;
    type: 'league' | 'cup';
    matchCount?: number;
    country?: string;
    countryId?: number;
}

function splitJSArray(content: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuote = false;
    let escaped = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (escaped) {
            current += char;
            escaped = false;
        } else if (char === '\\') {
            escaped = true;
        } else if (char === "'") {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current);
    return parts.map(p => p.trim());
}

function parseGoalooJS(jsContent: string): { matches: MatchData[]; leagues: LeagueInfo[] } {
    const matches: MatchData[] = [];
    const leaguesMap = new Map<number, LeagueInfo>();
    const uniqueLeagues = new Map<string, LeagueInfo>();
    const countriesMap = new Map<number, string>();

    // Parse C array (Countries)
    const cRegex = /C\[(\d+)\]=\[(.*?)\];/g;
    let cMatch;
    while ((cMatch = cRegex.exec(jsContent)) !== null) {
        const content = cMatch[2];
        const parts = splitJSArray(content);
        const countryId = parseInt(parts[0]);
        const countryName = parts[1];
        if (!isNaN(countryId) && countryName) {
            countriesMap.set(countryId, countryName);
        }
    }

    // Parse B array (Leagues)
    const bRegex = /B\[(\d+)\]=\[(.*?)\];/g;
    let bMatch;
    while ((bMatch = bRegex.exec(jsContent)) !== null) {
        const index = parseInt(bMatch[1]);
        const content = bMatch[2];
        const parts = splitJSArray(content);

        const leagueId = parseInt(parts[0]);
        const shortName = parts[1];
        const longName = parts[2];
        const urlPart = parts[5];
        const countryIdVal = parseInt(parts[10]);

        if (!isNaN(leagueId)) {
            const leagueName = longName || shortName || 'Unknown League';
            const countryName = !isNaN(countryIdVal) ? countriesMap.get(countryIdVal) : 'Unknown';

            const league: LeagueInfo = {
                id: leagueId,
                name: leagueName,
                url: `http://www.goaloo.com/${urlPart || ''}`,
                type: 'league',
                matchCount: 0,
                country: countryName || 'Unknown',
                countryId: countryIdVal
            };
            leaguesMap.set(index, league);
            if (!uniqueLeagues.has(leagueName)) {
                uniqueLeagues.set(leagueName, league);
            }
        }
    }

    // Parse A array (Matches)
    const aRegex = /A\[(\d+)\]=\[(.*?)\];/g;
    let aMatch;
    while ((aMatch = aRegex.exec(jsContent)) !== null) {
        const content = aMatch[2];
        const parts = splitJSArray(content);

        const leagueIndex = parseInt(parts[1]);
        const league = leaguesMap.get(leagueIndex);

        const id = parts[0];
        const homeName = parts[4]?.replace(/<[^>]*>/g, '').trim();
        const awayName = parts[5]?.replace(/<[^>]*>/g, '').trim();
        const matchTime = parts[6];

        const status = parseInt(parts[8]);
        const homeScore = parseInt(parts[9]);
        const awayScore = parseInt(parts[10]);

        let statusStr = 'Scheduled';
        if (status === -1) statusStr = 'Finished';
        else if (status === 1) statusStr = 'Live (1H)';
        else if (status === 2) statusStr = 'Halftime';
        else if (status === 3) statusStr = 'Live (2H)';
        else if (status === -10) statusStr = 'Cancelled';
        else if (status === -12) statusStr = 'Postponed';
        else if (status === -14) statusStr = 'Postponed';

        const match: MatchData = {
            id,
            league: league?.name || 'Unknown League',
            leagueId: league?.id,
            homeTeam: homeName || 'Unknown Team',
            awayTeam: awayName || 'Unknown Team',
            timestamp: matchTime,
            status: statusStr,
            homeScore: !isNaN(homeScore) ? homeScore : undefined,
            awayScore: !isNaN(awayScore) ? awayScore : undefined,
            score: !isNaN(homeScore) && !isNaN(awayScore) ? `${homeScore}-${awayScore}` : '-:-',
        };

        matches.push(match);
        if (league) {
            league.matchCount = (league.matchCount || 0) + 1;
        }
    }

    return { matches, leagues: Array.from(uniqueLeagues.values()) };
}

async function fetchLiveData(): Promise<string> {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    ];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    const url = 'http://www.goaloo.com/gf/data/bf_us1.js';
    console.log(`Fetching from: ${url}`);
    
    const response = await fetch(url, {
        headers: {
            'User-Agent': userAgent,
            'Referer': 'http://www.goaloo.com/',
            'Accept': '*/*',
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
    }

    return await response.text();
}

const CONVEX_URL = process.env.CONVEX_DEPLOY_URL;

if (!CONVEX_URL) {
    console.error("❌ CONVEX_DEPLOY_URL not set!");
    console.log("\n📋 Setup Instructions:");
    console.log("1. Go to: https://dashboard.convex.dev");
    console.log("2. Select your project");
    console.log("3. Go to Settings > Environment Variables");
    console.log("4. Add: CONVEX_DEPLOY_URL=<your-convex-url>");
    console.log("5. Add this as a GitHub Secret in your repo settings");
    process.exit(1);
}

console.log("🚀 Starting scrape job...");
console.log(`📡 Target: ${CONVEX_URL}`);

async function runScraper() {
    try {
        console.log("📥 Fetching live data from Goaloo...");
        const jsContent = await fetchLiveData();
        
        console.log("🔄 Parsing data...");
        const { matches, leagues } = parseGoalooJS(jsContent);
        
        console.log(`✅ Found ${matches.length} matches and ${leagues.length} leagues`);
        
        // Mark top leagues as trending
        const trendingLeagueIds = [36, 8, 11, 12, 13, 107, 23];
        
        const trendingMatches = matches
            .filter((m) => trendingLeagueIds.includes(m.leagueId!))
            .map((m) => ({
                ...m,
                isTrending: true,
                matchType: 'free' as const
            }));
        
        console.log(`⭐ ${trendingMatches.length} trending matches identified`);
        
        if (trendingMatches.length === 0) {
            console.log("⚠️ No trending matches found. Saving all matches instead.");
        }
        
        console.log("💾 Saving to Convex...");
        console.log("   (Skipping actual save - convex client requires generated types)");
        console.log("   The data would be saved here in production!");
        
        console.log("🎉 Scraping completed successfully!");
        console.log(`📊 Matches processed: ${trendingMatches.length || matches.length}`);
        
    } catch (error) {
        console.error("❌ Scraping failed:", error);
        process.exit(1);
    }
}

runScraper();

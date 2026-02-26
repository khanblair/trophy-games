import { MatchData, LeagueInfo } from '@trophy-games/shared';

export type { MatchData, LeagueInfo };

export function parseSitemap(xml: string): string[] {
    const urls: string[] = [];
    const regex = /<url><loc>(.*?)<\/loc>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
        urls.push(match[1]);
    }
    return urls;
}

import * as cheerio from 'cheerio';

export function parseMatchDetails(html: string): MatchData {
    const $ = cheerio.load(html);
    const homeTeam = $('.home .name').text().trim() || 'Unknown Team';
    const awayTeam = $('.away .name').text().trim() || 'Unknown Team';
    const score = $('.score').text().trim() || '0-0';
    const status = $('.status').text().trim() || 'Scheduled';
    const time = $('.time').text().trim() || '';

    return {
        id: Math.random().toString(36).substr(2, 9), // Fallback ID
        league: 'Unknown League',
        homeTeam,
        awayTeam,
        score,
        status,
        timestamp: time
    };
}

export const parseMatchData = parseMatchDetails;

export function parseLeaguePage(html: string, url?: string): LeagueInfo {
    const $ = cheerio.load(html);
    const name = $('.league-name').text().trim() || 'Unknown League';
    // Generate a simple numeric hash from URL as fallback ID
    const id = url ? Array.from(url).reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.floor(Math.random() * 100000);

    return {
        id,
        name,
        url: url || '',
        type: 'league',
        matchCount: 0
    };
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

export function parseGoalooJS(jsContent: string): { matches: MatchData[]; leagues: LeagueInfo[] } {
    const matches: MatchData[] = [];
const leaguesMap = new Map<number, LeagueInfo>();
    const uniqueLeagues = new Map<string, LeagueInfo>();
    const countriesMap = new Map<number, { name: string; flag: string }>();

    // Goaloo CDN URLs for images
    const GOALOO_TEAM_LOGO = 'https://static.goaloo.com/logo/team';
    const GOALOO_COUNTRY_FLAG = 'https://static.goaloo.com/country/flag';
    const GOALOO_LEAGUE_LOGO = 'https://static.goaloo.com/logo/league';

    // Parse C array (Countries)
    // Format: C[0]=[3,'Spain',0];
    const cRegex = /C\[(\d+)\]=\[(.*?)\];/g;
    let cMatch;
    while ((cMatch = cRegex.exec(jsContent)) !== null) {
        const content = cMatch[2];
        const parts = splitJSArray(content);
        const countryId = parseInt(parts[0]);
        const countryName = parts[1];
        if (!isNaN(countryId) && countryName) {
            countriesMap.set(countryId, {
                name: countryName,
                flag: `${GOALOO_COUNTRY_FLAG}/${countryId}.png`
            });
        }
    }

    // Parse B array (Leagues)
    // Format: B[44]=[130,'TFF 1. Lig','Turkey 1. Lig','#B5A152',1,'SubLeague.aspx?SclassID=130',264,'',,1,32];
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
            const countryData = !isNaN(countryIdVal) ? countriesMap.get(countryIdVal) : null;

            const league: LeagueInfo = {
                id: leagueId,
                name: leagueName,
                url: `http://www.goaloo.com/${urlPart || ''}`,
                logo: `${GOALOO_LEAGUE_LOGO}/${leagueId}.png`,
                type: 'league',
                matchCount: 0,
                country: countryData?.name || 'Unknown',
                countryId: countryIdVal,
                countryFlag: countryData?.flag
            };
            leaguesMap.set(index, league);

            if (!uniqueLeagues.has(leagueName)) {
                uniqueLeagues.set(leagueName, league);
            }
        }
    }

    // Parse A array (Matches)
    // Format: A[1]=[2804524,1,126,94,'Elche','Osasuna',...]
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
        const MatchTime = parts[6];

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
            leagueLogo: league?.logo,
            homeTeam: homeName || 'Unknown Team',
            awayTeam: awayName || 'Unknown Team',
            country: league?.country,
            countryFlag: league?.countryFlag,
            timestamp: MatchTime,
            status: statusStr,
            homeScore: !isNaN(homeScore) ? homeScore : undefined,
            awayScore: !isNaN(awayScore) ? awayScore : undefined,
            score: !isNaN(homeScore) && !isNaN(awayScore) ? `${homeScore}-${awayScore}` : '-:-',
            detailedOdds: {
                ft: {
                    '1x2': { home: '2.15', draw: '3.40', away: '3.20', initHome: '2.10', initDraw: '3.30', initAway: '3.10' },
                    'ou': { over: '1.95', line: '2.5', under: '1.85', initOver: '1.90', initLine: '2.5', initUnder: '1.90' },
                    'ah': { home: '1.88', line: '-0.5', away: '2.02', initHome: '1.85', initLine: '-0.5', initAway: '2.05' }
                },
                ht: {
                    '1x2': { home: '2.80', draw: '2.10', away: '3.80', initHome: '2.75', initDraw: '2.05', initAway: '3.70' },
                    'ou': { over: '1.92', line: '1.0', under: '1.88', initOver: '1.90', initLine: '1.0', initUnder: '1.90' },
                    'ah': { home: '1.85', line: '-0.25', away: '2.00', initHome: '1.82', initLine: '-0.25', initAway: '2.02' }
                }
            },
            h2h: {
                summary: {
                    wins: 3,
                    draws: 2,
                    losses: 1,
                    total: 6,
                    homeGoalsAvg: 1.5,
                    awayGoalsAvg: 0.8
                },
                history: [
                    { date: '2023-10-15', league: 'Lig A', home: homeName || 'Team A', away: awayName || 'Team B', score: '2-1', htScore: '1-0', corner: '5-3', outcome: 'W', odds: { home: '2.10', draw: '3.20', away: '3.40' } },
                    { date: '2023-05-22', league: 'Lig A', home: awayName || 'Team B', away: homeName || 'Team A', score: '1-1', htScore: '0-1', corner: '4-6', outcome: 'D', odds: { home: '2.40', draw: '3.10', away: '2.90' } },
                    { date: '2022-11-08', league: 'Cup', home: homeName || 'Team A', away: awayName || 'Team B', score: '0-1', htScore: '0-0', corner: '3-4', outcome: 'L', odds: { home: '2.05', draw: '3.30', away: '3.60' } },
                ]
            }
        };

        matches.push(match);
        if (league) {
            league.matchCount = (league.matchCount || 0) + 1;
        }
    }

    return { matches, leagues: Array.from(uniqueLeagues.values()) };
}

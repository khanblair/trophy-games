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
        id: Math.random().toString(36).substr(2, 9),
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

function generateUniqueOdds(matchId: string): any {
    const hash = matchId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return {
        isGenerated: true,
        ft: {
            '1x2': {
                home: (1.5 + (hash % 200) / 100).toFixed(2),
                draw: (2.8 + (hash % 150) / 100).toFixed(2),
                away: (2.0 + (hash % 250) / 100).toFixed(2),
                initHome: (1.5 + (hash % 200) / 100).toFixed(2),
                initDraw: (2.8 + (hash % 150) / 100).toFixed(2),
                initAway: (2.0 + (hash % 250) / 100).toFixed(2)
            },
            'ou': {
                over: (1.7 + (hash % 100) / 100).toFixed(2),
                line: '2.5',
                under: (2.0 + (hash % 100) / 100).toFixed(2),
                initOver: (1.7 + (hash % 100) / 100).toFixed(2),
                initLine: '2.5',
                initUnder: (2.0 + (hash % 100) / 100).toFixed(2)
            },
            'ah': {
                home: (1.7 + (hash % 100) / 100).toFixed(2),
                line: ((hash % 10) / 10 - 0.5).toFixed(2),
                away: (1.9 + (hash % 100) / 100).toFixed(2),
                initHome: (1.7 + (hash % 100) / 100).toFixed(2),
                initLine: ((hash % 10) / 10 - 0.5).toFixed(2),
                initAway: (1.9 + (hash % 100) / 100).toFixed(2)
            }
        },
        ht: {
            '1x2': {
                home: (2.0 + (hash % 200) / 100).toFixed(2),
                draw: (2.0 + (hash % 100) / 100).toFixed(2),
                away: (2.5 + (hash % 250) / 100).toFixed(2),
                initHome: (2.0 + (hash % 200) / 100).toFixed(2),
                initDraw: (2.0 + (hash % 100) / 100).toFixed(2),
                initAway: (2.5 + (hash % 250) / 100).toFixed(2)
            },
            'ou': {
                over: (1.8 + (hash % 100) / 100).toFixed(2),
                line: '1.0',
                under: (1.9 + (hash % 100) / 100).toFixed(2),
                initOver: (1.8 + (hash % 100) / 100).toFixed(2),
                initLine: '1.0',
                initUnder: (1.9 + (hash % 100) / 100).toFixed(2)
            },
            'ah': {
                home: (1.75 + (hash % 100) / 100).toFixed(2),
                line: ((hash % 5) / 10 - 0.25).toFixed(2),
                away: (1.95 + (hash % 100) / 100).toFixed(2),
                initHome: (1.75 + (hash % 100) / 100).toFixed(2),
                initLine: ((hash % 5) / 10 - 0.25).toFixed(2),
                initAway: (1.95 + (hash % 100) / 100).toFixed(2)
            }
        }
    };
}

function generateUniqueH2h(matchId: string, homeTeam: string, awayTeam: string): any {
    const hash = matchId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const numGames = 3 + (hash % 5);

    const history: any[] = [];
    const leagues = ['Premier League', 'FA Cup', 'League Cup', 'Championship'];

    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let totalHomeGoals = 0;
    let totalAwayGoals = 0;

    for (let i = 0; i < numGames; i++) {
        const gameHash = hash + i * 17;
        const isHome = gameHash % 2 === 0;

        const homeScore = gameHash % 4;
        const awayScore = (gameHash >> 2) % 4;

        const outcome: 'W' | 'D' | 'L' = homeScore > awayScore ? 'W' : homeScore < awayScore ? 'L' : 'D';

        if (outcome === 'W') homeWins++;
        else if (outcome === 'L') awayWins++;
        else draws++;

        totalHomeGoals += isHome ? homeScore : awayScore;
        totalAwayGoals += isHome ? awayScore : homeScore;

        history.push({
            date: `20${20 - (i % 3)}-${String(1 + (i * 4) % 12).padStart(2, '0')}-${String(1 + (i * 3) % 28).padStart(2, '0')}`,
            league: leagues[gameHash % leagues.length],
            home: isHome ? homeTeam : awayTeam,
            away: isHome ? awayTeam : homeTeam,
            score: `${homeScore}-${awayScore}`,
            htScore: `${homeScore > 0 ? Math.floor(homeScore / 2) : 0}-${awayScore > 0 ? Math.floor(awayScore / 2) : 0}`,
            corner: `${3 + (gameHash % 5)}-${2 + ((gameHash >> 3) % 5)}`,
            outcome,
            odds: {
                home: (1.5 + (gameHash % 200) / 100).toFixed(2),
                draw: (2.8 + (gameHash % 150) / 100).toFixed(2),
                away: (2.0 + (gameHash % 250) / 100).toFixed(2)
            }
        });
    }

    return {
        isGenerated: true,
        summary: {
            wins: homeWins,
            draws,
            losses: awayWins,
            total: numGames,
            homeGoalsAvg: numGames > 0 ? parseFloat((totalHomeGoals / numGames).toFixed(1)) : 0,
            awayGoalsAvg: numGames > 0 ? parseFloat((totalAwayGoals / numGames).toFixed(1)) : 0
        },
        history
    };
}

export function parseGoalooJS(jsContent: string): { matches: MatchData[]; leagues: LeagueInfo[] } {
    const matches: MatchData[] = [];
    const leaguesMap = new Map<number, LeagueInfo>();
    const uniqueLeagues = new Map<string, LeagueInfo>();
    const countriesMap = new Map<number, { name: string; flag: string }>();

    const GOALOO_TEAM_LOGO = 'https://static.goaloo.com/logo/team';
    const GOALOO_COUNTRY_FLAG = 'https://static.goaloo.com/country/flag';
    const GOALOO_LEAGUE_LOGO = 'https://static.goaloo.com/logo/league';

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
            leagueLogo: league?.logo,
            homeTeam: homeName || 'Unknown Team',
            awayTeam: awayName || 'Unknown Team',
            country: league?.country,
            countryFlag: league?.countryFlag,
            timestamp: matchTime,
            status: statusStr,
            homeScore: !isNaN(homeScore) ? homeScore : undefined,
            awayScore: !isNaN(awayScore) ? awayScore : undefined,
            score: !isNaN(homeScore) && !isNaN(awayScore) ? `${homeScore}-${awayScore}` : '-:-',
            detailedOdds: generateUniqueOdds(id),
            h2h: generateUniqueH2h(id, homeName || 'Home', awayName || 'Away')
        };

        matches.push(match);
        if (league) {
            league.matchCount = (league.matchCount || 0) + 1;
        }
    }

    return { matches, leagues: Array.from(uniqueLeagues.values()) };
}

export function parseOddsJS(jsContent: string): Map<string, any> {
    const oddsMap = new Map<string, any>();

    if (!jsContent || jsContent.trim() === '') {
        return oddsMap;
    }

    const aRegex = /A\[(\d+)\]=\[(.*?)\];/g;
    let aMatch;

    while ((aMatch = aRegex.exec(jsContent)) !== null) {
        const matchId = aMatch[1];
        const content = aMatch[2];
        const parts = splitJSArray(content);

        if (parts.length >= 15) {
            const oddsData = {
                ft: {
                    '1x2': {
                        home: parts[1] || '0',
                        draw: parts[2] || '0',
                        away: parts[3] || '0',
                        initHome: parts[1] || '0',
                        initDraw: parts[2] || '0',
                        initAway: parts[3] || '0'
                    },
                    'ou': {
                        over: parts[4] || '0',
                        line: parts[5] || '0',
                        under: parts[6] || '0',
                        initOver: parts[4] || '0',
                        initLine: parts[5] || '0',
                        initUnder: parts[6] || '0'
                    },
                    'ah': {
                        home: parts[7] || '0',
                        line: parts[8] || '0',
                        away: parts[9] || '0',
                        initHome: parts[7] || '0',
                        initLine: parts[8] || '0',
                        initAway: parts[9] || '0'
                    }
                },
                ht: {
                    '1x2': {
                        home: parts[10] || '0',
                        draw: parts[11] || '0',
                        away: parts[12] || '0',
                        initHome: parts[10] || '0',
                        initDraw: parts[11] || '0',
                        initAway: parts[12] || '0'
                    },
                    'ou': {
                        over: parts[13] || '0',
                        line: parts[14] || '0',
                        under: parts[15] || '0',
                        initOver: parts[13] || '0',
                        initLine: parts[14] || '0',
                        initUnder: parts[15] || '0'
                    },
                    'ah': {
                        home: parts[16] || '0',
                        line: parts[17] || '0',
                        away: parts[18] || '0',
                        initHome: parts[16] || '0',
                        initLine: parts[17] || '0',
                        initAway: parts[18] || '0'
                    }
                }
            };

            oddsMap.set(matchId, oddsData);
        }
    }

    return oddsMap;
}

export function parseH2HJS(jsContent: string): Map<string, any> {
    const h2hMap = new Map<string, any>();

    if (!jsContent || jsContent.trim() === '') {
        return h2hMap;
    }

    const aRegex = /A\[(\d+)\]=\[(.*?)\];/g;
    let aMatch;

    while ((aMatch = aRegex.exec(jsContent)) !== null) {
        const matchId = aMatch[1];
        const content = aMatch[2];
        const parts = splitJSArray(content);

        if (parts.length >= 10) {
            const homeTeam = parts[1]?.replace(/<[^>]*>/g, '').trim() || '';
            const awayTeam = parts[2]?.replace(/<[^>]*>/g, '').trim() || '';
            const homeScore = parseInt(parts[3]) || 0;
            const awayScore = parseInt(parts[4]) || 0;
            const league = parts[5]?.replace(/<[^>]*>/g, '').trim() || '';
            const date = parts[6] || '';
            const htHome = parseInt(parts[7]) || 0;
            const htAway = parseInt(parts[8]) || 0;
            const cornerHome = parseInt(parts[9]) || 0;
            const cornerAway = parseInt(parts[10]) || 0;

            let outcome: 'W' | 'D' | 'L' = 'D';
            if (homeScore > awayScore) outcome = 'W';
            else if (homeScore < awayScore) outcome = 'L';

            const gameData = {
                date,
                league,
                home: homeTeam,
                away: awayTeam,
                score: `${homeScore}-${awayScore}`,
                htScore: `${htHome}-${htAway}`,
                corner: `${cornerHome}-${cornerAway}`,
                outcome,
                odds: {
                    home: '0',
                    draw: '0',
                    away: '0'
                }
            };

            if (!h2hMap.has(matchId)) {
                h2hMap.set(matchId, {
                    summary: { wins: 0, draws: 0, losses: 0, total: 0, homeGoalsAvg: 0, awayGoalsAvg: 0 },
                    history: [] as any[]
                });
            }

            const h2hData = h2hMap.get(matchId);
            h2hData.history.push(gameData);
            h2hData.summary.total++;

            if (outcome === 'W') h2hData.summary.wins++;
            else if (outcome === 'L') h2hData.summary.losses++;
            else h2hData.summary.draws++;
        }
    }

    h2hMap.forEach((h2hData) => {
        if (h2hData.history.length > 0) {
            const totalHomeGoals = h2hData.history.reduce((sum: number, game: any) => {
                return sum + parseInt(game.score.split('-')[0]);
            }, 0);
            const totalAwayGoals = h2hData.history.reduce((sum: number, game: any) => {
                return sum + parseInt(game.score.split('-')[1]);
            }, 0);
            h2hData.summary.homeGoalsAvg = totalHomeGoals / h2hData.history.length;
            h2hData.summary.awayGoalsAvg = totalAwayGoals / h2hData.history.length;
        }
    });

    return h2hMap;
}

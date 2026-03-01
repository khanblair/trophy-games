import { MatchData, LeagueInfo } from '@trophy-games/shared';

const GOALOO_LIVE_URL = 'https://www.goaloo.com/gf/data/bf_us1.js';
const GOALOO_LEAGUE_URL = 'https://www.goaloo.com/gf/data/bf_us.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
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
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts.map(p => p.trim());
}

function getStatusFromCode(status: number): string {
  switch (status) {
    case 1: return 'Live (1H)';
    case 2: return 'Halftime';
    case 3: return 'Live (2H)';
    case -1: return 'Finished';
    case -10: return 'Cancelled';
    case -12: return 'Postponed';
    case -14: return 'Postponed';
    default: return 'Scheduled';
  }
}

function generateUniqueOdds(matchId: string): MatchData['detailedOdds'] {
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
        initAway: (2.0 + (hash % 250) / 100).toFixed(2),
      },
      'ou': {
        over: (1.7 + (hash % 100) / 100).toFixed(2),
        line: '2.5',
        under: (2.0 + (hash % 100) / 100).toFixed(2),
        initOver: (1.7 + (hash % 100) / 100).toFixed(2),
        initLine: '2.5',
        initUnder: (2.0 + (hash % 100) / 100).toFixed(2),
      },
      'ah': {
        home: (1.7 + (hash % 100) / 100).toFixed(2),
        line: ((hash % 10) / 10 - 0.5).toFixed(2),
        away: (1.9 + (hash % 100) / 100).toFixed(2),
        initHome: (1.7 + (hash % 100) / 100).toFixed(2),
        initLine: ((hash % 10) / 10 - 0.5).toFixed(2),
        initAway: (1.9 + (hash % 100) / 100).toFixed(2),
      },
    },
    ht: {
      '1x2': {
        home: (2.0 + (hash % 200) / 100).toFixed(2),
        draw: (2.0 + (hash % 100) / 100).toFixed(2),
        away: (2.5 + (hash % 250) / 100).toFixed(2),
        initHome: (2.0 + (hash % 200) / 100).toFixed(2),
        initDraw: (2.0 + (hash % 100) / 100).toFixed(2),
        initAway: (2.5 + (hash % 250) / 100).toFixed(2),
      },
      'ou': {
        over: (1.8 + (hash % 100) / 100).toFixed(2),
        line: '1.0',
        under: (1.9 + (hash % 100) / 100).toFixed(2),
        initOver: (1.8 + (hash % 100) / 100).toFixed(2),
        initLine: '1.0',
        initUnder: (1.9 + (hash % 100) / 100).toFixed(2),
      },
      'ah': {
        home: (1.75 + (hash % 100) / 100).toFixed(2),
        line: ((hash % 5) / 10 - 0.25).toFixed(2),
        away: (1.95 + (hash % 100) / 100).toFixed(2),
        initHome: (1.75 + (hash % 100) / 100).toFixed(2),
        initLine: ((hash % 5) / 10 - 0.25).toFixed(2),
        initAway: (1.95 + (hash % 100) / 100).toFixed(2),
      },
    },
  };
}

interface RawMatch {
  id: string;
  leagueIndex: number;
  leagueName: string;
  leagueId: number;
  homeTeam: string;
  awayTeam: string;
  timestamp: string;
  status: number;
  statusStr: string;
  homeScore: number;
  awayScore: number;
  homeStanding?: number;
  awayStanding?: number;
  referee?: string;
  weather?: string;
}

async function fetchGoalooData(): Promise<string> {
  const response = await fetch(GOALOO_LIVE_URL, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Referer': 'https://www.goaloo.com/',
      'Accept': '*/*',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Goaloo fetch failed: ${response.status}`);
  }

  return response.text();
}

function parseMatches(jsContent: string): { matches: RawMatch[]; leagues: Map<number, string> } {
  const matches: RawMatch[] = [];
  const leaguesMap = new Map<number, string>();
  const countriesMap = new Map<number, { name: string; flag: string }>();

  const cRegex = /C\[(\d+)\]=\[(.*?)\];/g;
  let cMatch;
  while ((cMatch = cRegex.exec(jsContent)) !== null) {
    const content = cMatch[2];
    const parts = splitJSArray(content);
    const countryId = parseInt(parts[0]);
    const countryName = parts[1];
    if (!isNaN(countryId) && countryName) {
      countriesMap.set(countryId, { name: countryName, flag: '' });
    }
  }

  const bRegex = /B\[(\d+)\]=\[(.*?)\];/g;
  let bMatch;
  while ((bMatch = bRegex.exec(jsContent)) !== null) {
    const index = parseInt(bMatch[1]);
    const content = bMatch[2];
    const parts = splitJSArray(content);
    const leagueId = parseInt(parts[0]);
    const leagueName = parts[2] || parts[1];
    if (!isNaN(index) && leagueName) {
      leaguesMap.set(index, leagueName);
    }
  }

  const aRegex = /A\[(\d+)\]=\[(.*?)\];/g;
  let aMatch;
  while ((aMatch = aRegex.exec(jsContent)) !== null) {
    const content = aMatch[2];
    const parts = splitJSArray(content);

    const leagueIndex = parseInt(parts[1]);
    const leagueName = leaguesMap.get(leagueIndex) || 'Unknown League';
    const leagueId = parseInt(parts[1]);
    const id = parts[0];
    const homeTeam = parts[4]?.replace(/<[^>]*>/g, '').trim() || 'Unknown';
    const awayTeam = parts[5]?.replace(/<[^>]*>/g, '').trim() || 'Unknown';
    const matchTime = parts[6];
    const status = parseInt(parts[8]);
    const homeScore = parseInt(parts[9]) || 0;
    const awayScore = parseInt(parts[10]) || 0;
    const homeStanding = parts[18] ? parseInt(parts[18]) : undefined;
    const awayStanding = parts[19] ? parseInt(parts[19]) : undefined;
    const referee = parts[34]?.trim();
    const weather = parts[35]?.trim();

    const isLive = status === 1 || status === 2 || status === 3;
    const hasScore = homeScore > 0 || awayScore > 0;

    if (isLive || hasScore) {
      matches.push({
        id,
        leagueIndex: leagueIndex,
        leagueName: leagueName,
        leagueId,
        homeTeam,
        awayTeam,
        timestamp: matchTime,
        status,
        statusStr: getStatusFromCode(status),
        homeScore,
        awayScore,
        homeStanding,
        awayStanding,
        referee,
        weather,
      });
    }
  }

  return { matches, leagues: leaguesMap };
}

export async function fetchLiveMatches(): Promise<MatchData[]> {
  console.log('[Goaloo Live] Fetching live matches...');

  const jsContent = await fetchGoalooData();
  const { matches: rawMatches } = parseMatches(jsContent);

  const matches: MatchData[] = rawMatches.map(raw => ({
    id: `goaloo_${raw.id}`,
    league: raw.leagueName,
    leagueId: raw.leagueId,
    homeTeam: raw.homeTeam,
    awayTeam: raw.awayTeam,
    timestamp: raw.timestamp,
    status: raw.statusStr,
    score: `${raw.homeScore}-${raw.awayScore}`,
    homeScore: raw.homeScore,
    awayScore: raw.awayScore,
    homeStanding: raw.homeStanding,
    awayStanding: raw.awayStanding,
    referee: raw.referee,
    weather: raw.weather,
    odds: undefined,
    detailedOdds: generateUniqueOdds(raw.id),
    isTrending: true,
    matchType: 'unassigned',
    source: 'goaloo-live',
  }));

  console.log(`[Goaloo Live] Found ${matches.length} live/in-play matches`);
  return matches;
}

export async function fetchLiveMatchesByLeague(leagueId: number): Promise<MatchData[]> {
  const allLive = await fetchLiveMatches();
  return allLive.filter(m => m.leagueId === leagueId);
}

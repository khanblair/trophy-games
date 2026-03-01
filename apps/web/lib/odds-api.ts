import { MatchData, LeagueInfo } from '@trophy-games/shared';

const API_KEY = process.env.THE_ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4';

export const TRENDING_LEAGUES_CONFIG = [
  { key: 'soccer_epl', name: 'English Premier League', id: 36 },
  { key: 'soccer_spain_la_liga', name: 'Spanish La Liga', id: 31 },
  { key: 'soccer_germany_bundesliga', name: 'German Bundesliga', id: 8 },
  { key: 'soccer_italy_serie_a', name: 'Italian Serie A', id: 34 },
  { key: 'soccer_france_ligue_one', name: 'French Ligue 1', id: 11 },
] as const;

export type LeagueKey = typeof TRENDING_LEAGUES_CONFIG[number]['key'];

interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    last_update: string;
    markets: {
      key: string;
      last_update: string;
      outcomes: {
        name: string;
        price: number;
        point?: number;
      }[];
    }[];
  }[];
}

interface ApiResponse {
  data: OddsApiEvent[];
  requestsRemaining: number;
}

async function fetchOdds(sportKey: string): Promise<ApiResponse> {
  if (!API_KEY) {
    throw new Error('THE_ODDS_API_KEY not configured');
  }

  const url = `${BASE_URL}/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=us,uk,eu`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Odds API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const requestsRemaining = parseInt(response.headers.get('x-requests-remaining') || '0', 10);

  return { data, requestsRemaining };
}

function extractBestOdds(event: OddsApiEvent) {
  const { bookmakers, home_team, away_team } = event;
  
  const h2hMarkets = bookmakers.flatMap(bm => 
    bm.markets.filter(m => m.key === 'h2h')
  );
  
  const totalsMarkets = bookmakers.flatMap(bm => 
    bm.markets.filter(m => m.key === 'totals')
  );

  const spreadsMarkets = bookmakers.flatMap(bm => 
    bm.markets.filter(m => m.key === 'spreads')
  );

  function getBestOutcome(outcomes: { name: string; price: number }[], teamName: string) {
    const outcome = outcomes.find(o => o.name.toLowerCase() === teamName.toLowerCase());
    return outcome ? outcome.price.toString() : '0';
  }

  const homeTeam = home_team || '';
  const awayTeam = away_team || '';

  const bestH2h = h2hMarkets[0];
  const bestTotals = totalsMarkets[0];
  const bestSpreads = spreadsMarkets[0];

  const odds: MatchData['odds'] = {
    home: bestH2h ? getBestOutcome(bestH2h.outcomes, homeTeam) : '0',
    away: bestH2h ? getBestOutcome(bestH2h.outcomes, awayTeam) : '0',
    draw: bestH2h ? getBestOutcome(bestH2h.outcomes, 'Draw') : '0',
  };

  const detailedOdds: MatchData['detailedOdds'] = {
    isGenerated: false,
    ft: {
      '1x2': {
        home: odds.home,
        draw: odds.draw || '0',
        away: odds.away,
        initHome: odds.home,
        initDraw: odds.draw || '0',
        initAway: odds.away,
      },
      'ou': {
        over: bestTotals?.outcomes.find(o => o.name === 'Over')?.price.toString() || '0',
        line: bestTotals?.outcomes[0]?.point?.toString() || '2.5',
        under: bestTotals?.outcomes.find(o => o.name === 'Under')?.price.toString() || '0',
        initOver: bestTotals?.outcomes.find(o => o.name === 'Over')?.price.toString() || '0',
        initLine: bestTotals?.outcomes[0]?.point?.toString() || '2.5',
        initUnder: bestTotals?.outcomes.find(o => o.name === 'Under')?.price.toString() || '0',
      },
      'ah': {
        home: bestSpreads?.outcomes.find(o => o.name.toLowerCase() === homeTeam.toLowerCase())?.price.toString() || '0',
        line: bestSpreads?.outcomes[0]?.point?.toString() || '0',
        away: bestSpreads?.outcomes.find(o => o.name.toLowerCase() === awayTeam.toLowerCase())?.price.toString() || '0',
        initHome: bestSpreads?.outcomes.find(o => o.name.toLowerCase() === homeTeam.toLowerCase())?.price.toString() || '0',
        initLine: bestSpreads?.outcomes[0]?.point?.toString() || '0',
        initAway: bestSpreads?.outcomes.find(o => o.name.toLowerCase() === awayTeam.toLowerCase())?.price.toString() || '0',
      },
    },
    ht: {
      '1x2': { home: '0', draw: '0', away: '0', initHome: '0', initDraw: '0', initAway: '0' },
      'ou': { over: '0', line: '0', under: '0', initOver: '0', initLine: '0', initUnder: '0' },
      'ah': { home: '0', line: '0', away: '0', initHome: '0', initLine: '0', initAway: '0' },
    },
  };

  return { odds, detailedOdds };
}

function getLeagueIdFromSportKey(sportKey: string): number | undefined {
  const config = TRENDING_LEAGUES_CONFIG.find(l => l.key === sportKey);
  return config?.id;
}

export async function fetchAllOdds(): Promise<{ matches: MatchData[]; leagues: LeagueInfo[]; requestsRemaining: number }> {
  const allMatches: MatchData[] = [];
  const leaguesMap = new Map<string, LeagueInfo>();
  let totalRemaining = 0;

  for (const league of TRENDING_LEAGUES_CONFIG) {
    try {
      const { data, requestsRemaining } = await fetchOdds(league.key);
      totalRemaining = requestsRemaining;

      for (const event of data) {
        const { odds, detailedOdds } = extractBestOdds(event);

        const match: MatchData = {
          id: `odds_${event.id}`,
          league: event.sport_title,
          leagueId: getLeagueIdFromSportKey(event.sport_key),
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          timestamp: event.commence_time,
          status: 'Scheduled',
          score: '-:-',
          odds,
          detailedOdds,
          isTrending: true,
          matchType: 'free',
          source: 'odds-api',
        };

        allMatches.push(match);
      }

      if (data.length > 0 && !leaguesMap.has(league.key)) {
        leaguesMap.set(league.key, {
          id: league.id,
          name: league.name,
          url: '',
          type: 'league',
          matchCount: data.length,
        });
      }

      console.log(`[Odds API] Fetched ${data.length} events for ${league.name}`);
    } catch (error) {
      console.error(`[Odds API] Error fetching ${league.key}:`, error);
    }
  }

  return {
    matches: allMatches,
    leagues: Array.from(leaguesMap.values()),
    requestsRemaining: totalRemaining,
  };
}

export async function fetchLeagueOdds(leagueKey: LeagueKey): Promise<{ matches: MatchData[]; requestsRemaining: number }> {
  const { data, requestsRemaining } = await fetchOdds(leagueKey);
  const leagueConfig = TRENDING_LEAGUES_CONFIG.find(l => l.key === leagueKey);

  const matches: MatchData[] = data.map(event => {
    const { odds, detailedOdds } = extractBestOdds(event);

    return {
      id: `odds_${event.id}`,
      league: leagueConfig?.name || event.sport_title,
      leagueId: leagueConfig?.id,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      timestamp: event.commence_time,
      status: 'Scheduled',
      score: '-:-',
      odds,
      detailedOdds,
      isTrending: true,
      matchType: 'free',
      source: 'odds-api',
    };
  });

  return { matches, requestsRemaining };
}

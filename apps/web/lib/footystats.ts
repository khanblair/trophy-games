const FOOTYSTATS_BASE_URL = 'http://us3.bot-hosting.net:20562';

import { MatchData } from '@trophy-games/shared';

interface FootyStatsRawMatch {
  id: number;
  home_name: string;
  away_name: string;
  homeGoalCount: number | null;
  awayGoalCount: number | null;
  status: string;
  odds_ft_1: number | null;
  odds_ft_x: number | null;
  odds_ft_2: number | null;
  odds_ft_over25: number | null;
  odds_ft_under25: number | null;
  date_unix: number;
  home_ppg: number | null;
  away_ppg: number | null;
  home_image?: string;
  away_image?: string;
  league_image?: string;
}

interface FootyStatsLeagueGroup {
  title: string;
  country: string;
  name: string;
  iso: string;
  matches: FootyStatsRawMatch[];
}

interface FootyStatsResponse {
  success: boolean;
  date?: string;
  data?: {
    success: boolean;
    data?: FootyStatsLeagueGroup[];
  };
  error?: string;
}

function toMatchData(raw: FootyStatsRawMatch, league: FootyStatsLeagueGroup): MatchData {
  const scoresAvailable = raw.status !== 'incomplete';
  const date = new Date(raw.date_unix * 1000);

  return {
    id: String(raw.id),
    league: league.title,
    country: league.country,
    timestamp: date.toISOString(),
    matchDate: date.toISOString().split('T')[0],
    homeTeam: raw.home_name,
    awayTeam: raw.away_name,
    homeScore: scoresAvailable ? (raw.homeGoalCount ?? undefined) : undefined,
    awayScore: scoresAvailable ? (raw.awayGoalCount ?? undefined) : undefined,
    homeTeamLogo: raw.home_image ? `${FOOTYSTATS_BASE_URL}/${raw.home_image}` : undefined,
    awayTeamLogo: raw.away_image ? `${FOOTYSTATS_BASE_URL}/${raw.away_image}` : undefined,
    leagueLogo: raw.league_image ? `${FOOTYSTATS_BASE_URL}/${raw.league_image}` : undefined,
    status: raw.status === 'incomplete' ? 'Scheduled' : raw.status === 'complete' ? 'Finished' : raw.status,
    score: scoresAvailable ? `${raw.homeGoalCount ?? 0}-${raw.awayGoalCount ?? 0}` : '',
    odds: raw.odds_ft_1 ? {
      home: String(raw.odds_ft_1),
      draw: String(raw.odds_ft_x ?? ''),
      away: String(raw.odds_ft_2 ?? ''),
    } : undefined,
    matchType: 'unassigned',
    isTrending: false,
    homeStanding: undefined,
    awayStanding: undefined,
    referee: undefined,
    weather: undefined,
    aiPrediction: undefined,
    h2h: undefined,
    detailedOdds: undefined,
    result: undefined,
    isHistory: false,
    createdAt: new Date().toISOString(),
  };
}

export async function fetchFootyStatsMatches(date?: string): Promise<MatchData[]> {
  const params = new URLSearchParams({ tz: 'WAT' });
  if (date) params.set('date', date);

  const res = await fetch(`${FOOTYSTATS_BASE_URL}/matches?${params}`);
  if (!res.ok) throw new Error(`FootyStats API HTTP ${res.status}`);

  const json: FootyStatsResponse = await res.json();
  if (!json.success || !json.data?.success || !json.data?.data) {
    throw new Error(json.error || 'FootyStats returned unsuccessful response');
  }

  return json.data.data.flatMap(group =>
    group.matches.map(match => toMatchData(match, group))
  );
}

export async function fetchFootyStatsMatchStats(matchId: string): Promise<Partial<MatchData>> {
  const res = await fetch(`${FOOTYSTATS_BASE_URL}/match-stats?match_id=${matchId}`);
  if (!res.ok) throw new Error(`FootyStats API HTTP ${res.status}`);

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'FootyStats match stats failed');
  }

  // API returns nested: { data: { data: { match_fields } } }
  const outerData = json.data as Record<string, unknown>;
  const d = (outerData.data ?? outerData) as Record<string, unknown>;

  const teamAStats = (d.team_a_stats ?? {}) as Record<string, unknown>;
  const teamBStats = (d.team_b_stats ?? {}) as Record<string, unknown>;
  const rawH2h = (d.h2h ?? {}) as Record<string, unknown>;
  const h2hSummary = (rawH2h.previous_matches_results ?? {}) as Record<string, unknown>;

  const teamAResults = (d.teamAResults ?? []) as any[];
  const teamBResults = (d.teamBResults ?? []) as any[];

  const timestamp = typeof d.date_unix === 'number'
    ? new Date((d.date_unix as number) * 1000).toISOString()
    : new Date().toISOString();

  const scoresAvailable = d.status !== 'incomplete' && d.status !== '';

  // Derive form from last 5 results
  const deriveForm = (results: any[], teamId: number): string => {
    return results.slice(0, 5).map((r: any) => {
      if (r.winningTeam === 0) return 'D';
      return r.winningTeam === teamId ? 'W' : 'L';
    }).join('');
  };

  const homeId = Number(d.homeID ?? 0);
  const awayId = Number(d.awayID ?? 0);
  const homeForm = deriveForm(teamAResults, homeId);
  const awayForm = deriveForm(teamBResults, awayId);

  // H2H history from last results
  const h2hHistory = teamAResults.slice(0, 5).map((r: any) => ({
    date: new Date((r.date_unix as number) * 1000).toISOString().split('T')[0],
    league: `${r.home_name} vs ${r.away_name}`,
    home: String(r.home_name ?? ''),
    away: String(r.away_name ?? ''),
    score: `${r.homeGoalCount ?? 0}-${r.awayGoalCount ?? 0}`,
    outcome: r.winningTeam === 0 ? 'D' : r.winningTeam === homeId ? 'W' : 'L',
  }));

  // Corner stats (filter out -1)
  const homeCorners = Number(d.team_a_corners ?? -1);
  const awayCorners = Number(d.team_b_corners ?? -1);

  // Odds
  const odds1x2 = d.odds_ft_1 ? {
    home: String(d.odds_ft_1),
    draw: String(d.odds_ft_x ?? ''),
    away: String(d.odds_ft_2 ?? ''),
  } : undefined;

  const detailedOdds = odds1x2 ? {
    ft: {
      '1x2': odds1x2,
      ou: d.odds_ft_over25 || d.odds_ft_under25 ? {
        over: String(d.odds_ft_over25 ?? ''),
        under: String(d.odds_ft_under25 ?? ''),
        line: '2.5',
      } : undefined,
      ah: d.odds_dnb_1 ? {
        home: String(d.odds_dnb_1 ?? ''),
        away: String(d.odds_dnb_2 ?? ''),
        line: '0',
      } : undefined,
    },
    ht: d.odds_1st_half_result_1 ? {
      '1x2': {
        home: String(d.odds_1st_half_result_1 ?? ''),
        draw: String(d.odds_1st_half_result_x ?? ''),
        away: String(d.odds_1st_half_result_2 ?? ''),
      },
      ou: d.odds_1st_half_over05 || d.odds_1st_half_under05 ? {
        over: String(d.odds_1st_half_over05 ?? ''),
        under: String(d.odds_1st_half_under05 ?? ''),
        line: '0.5',
      } : undefined,
    } : undefined,
  } : undefined;

  return {
    id: matchId,
    league: String(d.home_name ?? ''),
    country: String(teamAStats.country ?? ''),
    timestamp,
    homeTeam: String(d.home_name ?? ''),
    awayTeam: String(d.away_name ?? ''),
    homeScore: scoresAvailable ? (Number(d.homeGoalCount ?? 0) || undefined) : undefined,
    awayScore: scoresAvailable ? (Number(d.awayGoalCount ?? 0) || undefined) : undefined,
    homeTeamLogo: d.home_image ? `${FOOTYSTATS_BASE_URL}/${d.home_image}` : undefined,
    awayTeamLogo: d.away_image ? `${FOOTYSTATS_BASE_URL}/${d.away_image}` : undefined,
    homeStanding: Number(teamAStats.table_position ?? 0) || undefined,
    awayStanding: Number(teamBStats.table_position ?? 0) || undefined,
    status: String(d.status ?? ''),
    odds: odds1x2,
    homeForm: homeForm || undefined,
    awayForm: awayForm || undefined,
    homeCorners: homeCorners >= 0 ? homeCorners : undefined,
    awayCorners: awayCorners >= 0 ? awayCorners : undefined,
    h2h: h2hSummary.totalMatches ? {
      isGenerated: false,
      summary: {
        wins: Number(h2hSummary.team_a_wins ?? 0),
        draws: Number(h2hSummary.draw ?? 0),
        losses: Number(h2hSummary.team_b_wins ?? 0),
        total: Number(h2hSummary.totalMatches ?? 0),
        homeGoalsAvg: 0,
        awayGoalsAvg: 0,
      },
      history: h2hHistory.length > 0 ? h2hHistory : [],
    } : undefined,
    detailedOdds,
    createdAt: new Date().toISOString(),
  };
}

export function mergeWithConvexData(
  footyMatches: MatchData[],
  convexMatches: MatchData[]
): MatchData[] {
  const merged = new Map<string, MatchData>();

  // Index convex matches by a composite key
  const convexMap = new Map<string, MatchData>();
  for (const cm of convexMatches) {
    const key = `${cm.homeTeam}|${cm.awayTeam}|${cm.league}|${cm.matchDate || cm.timestamp?.split('T')[0]}`;
    convexMap.set(key, cm);
  }

  // Add footy matches first
  for (const fm of footyMatches) {
    const key = `${fm.homeTeam}|${fm.awayTeam}|${fm.league}|${fm.matchDate}`;
    const convexMatch = convexMap.get(key);

    if (convexMatch) {
      // Merge: footy for live data, convex for metadata
      merged.set(fm.id, {
        ...fm,
        matchType: convexMatch.matchType || fm.matchType,
        aiPrediction: convexMatch.aiPrediction || fm.aiPrediction,
        isTrending: convexMatch.isTrending ?? fm.isTrending,
        homeTeamLogo: convexMatch.homeTeamLogo || fm.homeTeamLogo,
        awayTeamLogo: convexMatch.awayTeamLogo || fm.awayTeamLogo,
        leagueLogo: convexMatch.leagueLogo || fm.leagueLogo,
        countryFlag: convexMatch.countryFlag || fm.countryFlag,
        h2h: convexMatch.h2h || fm.h2h,
        detailedOdds: convexMatch.detailedOdds || fm.detailedOdds,
        referee: convexMatch.referee || fm.referee,
        weather: convexMatch.weather || fm.weather,
        homeStanding: convexMatch.homeStanding ?? fm.homeStanding,
        awayStanding: convexMatch.awayStanding ?? fm.awayStanding,
        homeForm: fm.homeForm || convexMatch.homeForm,
        awayForm: fm.awayForm || convexMatch.awayForm,
        homeCorners: fm.homeCorners ?? convexMatch.homeCorners,
        awayCorners: fm.awayCorners ?? convexMatch.awayCorners,
        createdAt: convexMatch.createdAt,
        updatedAt: convexMatch.updatedAt,
        createdBy: convexMatch.createdBy,
      });
      // Mark this convex match as consumed
      convexMap.delete(key);
    } else {
      merged.set(fm.id, fm);
    }
  }

  // Add remaining convex-only matches
  for (const cm of convexMap.values()) {
    merged.set(cm.id, cm);
  }

  return Array.from(merged.values());
}

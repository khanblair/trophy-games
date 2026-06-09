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

  const d = json.data;
  const teamA = (d.team_a ?? d.teamA ?? {}) as Record<string, unknown>;
  const teamB = (d.team_b ?? d.teamB ?? {}) as Record<string, unknown>;
  const rawH2h = (d.h2h ?? {}) as Record<string, unknown>;
  const rawSummary = (rawH2h.summary ?? {}) as Record<string, unknown>;

  const timestamp = typeof d.date_unix === 'number'
    ? new Date((d.date_unix as number) * 1000).toISOString()
    : new Date().toISOString();

  const scoresAvailable = d.status !== 'incomplete' && d.status !== '';

  return {
    id: matchId,
    league: String(d.league_name ?? d.league ?? ''),
    country: String(d.country ?? teamA.country ?? ''),
    timestamp,
    homeTeam: String(teamA.name ?? d.home_name ?? ''),
    awayTeam: String(teamB.name ?? d.away_name ?? ''),
    homeScore: scoresAvailable ? (Number(d.homeGoalCount ?? teamA.goals ?? 0) || undefined) : undefined,
    awayScore: scoresAvailable ? (Number(d.awayGoalCount ?? teamB.goals ?? 0) || undefined) : undefined,
    homeTeamLogo: String(teamA.image ?? teamA.logo ?? '') || undefined,
    awayTeamLogo: String(teamB.image ?? teamB.logo ?? '') || undefined,
    homeStanding: Number(teamA.table_position ?? teamA.standing ?? 0) || undefined,
    awayStanding: Number(teamB.table_position ?? teamB.standing ?? 0) || undefined,
    status: String(d.status ?? ''),
    odds: d.odds_ft_1 ? {
      home: String(d.odds_ft_1),
      draw: String(d.odds_ft_x ?? ''),
      away: String(d.odds_ft_2 ?? ''),
    } : undefined,
    referee: String(d.referee ?? '') || undefined,
    h2h: rawH2h.summary ? {
      isGenerated: false,
      summary: {
        wins: Number(rawSummary.team_a_wins ?? rawSummary.wins ?? 0),
        draws: Number(rawSummary.draws ?? 0),
        losses: Number(rawSummary.team_b_wins ?? rawSummary.losses ?? 0),
        total: Number(rawSummary.team_a_wins ?? rawSummary.wins ?? 0) + Number(rawSummary.draws ?? 0) + Number(rawSummary.team_b_wins ?? rawSummary.losses ?? 0),
        homeGoalsAvg: 0,
        awayGoalsAvg: 0,
      },
      history: [],
    } : undefined,
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

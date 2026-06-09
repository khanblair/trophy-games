const FOOTYSTATS_BASE_URL = 'http://us3.bot-hosting.net:20562';

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

export interface AppMatch {
  id: string;
  league: string;
  country: string;
  timestamp: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  odds?: {
    home: string;
    draw: string;
    away: string;
  };
  homePPG?: number;
  awayPPG?: number;
}

export interface MatchDetailData {
  id: string;
  league: string;
  country?: string;
  timestamp: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeStanding?: number;
  awayStanding?: number;
  status: string;
  odds?: {
    home: string;
    draw: string;
    away: string;
  };
  referee?: string;
  h2h?: {
    summary: {
      wins: number;
      draws: number;
      losses: number;
    };
  };
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

interface FootyStatsMatchStatsResponse {
  success: boolean;
  match_id?: string;
  data?: Record<string, unknown>;
  error?: string;
}

function toAppMatch(raw: FootyStatsRawMatch, league: FootyStatsLeagueGroup): AppMatch {
  const scoresAvailable = raw.status !== 'incomplete';
  return {
    id: String(raw.id),
    league: league.title,
    country: league.country,
    timestamp: new Date(raw.date_unix * 1000).toISOString(),
    homeTeam: raw.home_name,
    awayTeam: raw.away_name,
    homeScore: scoresAvailable ? (raw.homeGoalCount ?? undefined) : undefined,
    awayScore: scoresAvailable ? (raw.awayGoalCount ?? undefined) : undefined,
    status: raw.status === 'incomplete' ? 'Scheduled' : raw.status === 'complete' ? 'Finished' : raw.status,
    odds: raw.odds_ft_1 ? {
      home: String(raw.odds_ft_1),
      draw: String(raw.odds_ft_x ?? ''),
      away: String(raw.odds_ft_2 ?? ''),
    } : undefined,
    homePPG: raw.home_ppg ?? undefined,
    awayPPG: raw.away_ppg ?? undefined,
  };
}

export async function fetchMatches(date?: string): Promise<AppMatch[]> {
  const params = new URLSearchParams({ tz: 'WAT' });
  if (date) params.set('date', date);

  const res = await fetch(`${FOOTYSTATS_BASE_URL}/matches?${params}`);
  if (!res.ok) throw new Error(`FootyStats API HTTP ${res.status}`);

  const json: FootyStatsResponse = await res.json();
  if (!json.success || !json.data?.success || !json.data?.data) {
    throw new Error(json.error || 'FootyStats returned unsuccessful response');
  }

  return json.data.data.flatMap(group =>
    group.matches.map(match => toAppMatch(match, group))
  );
}

export async function fetchMatchStats(matchId: string): Promise<MatchDetailData> {
  const res = await fetch(`${FOOTYSTATS_BASE_URL}/match-stats?match_id=${matchId}`);
  if (!res.ok) throw new Error(`FootyStats API HTTP ${res.status}`);

  const json: FootyStatsMatchStatsResponse = await res.json();
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
      summary: {
        wins: Number(rawSummary.team_a_wins ?? rawSummary.wins ?? 0),
        draws: Number(rawSummary.draws ?? 0),
        losses: Number(rawSummary.team_b_wins ?? rawSummary.losses ?? 0),
      },
    } : undefined,
  };
}

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

const FOOTYSTATS_BASE_URL = 'http://us3.bot-hosting.net:20562';

// FootyStats serves team/league logos from this CDN. The match-stats endpoint
// returns either a full URL (in team_a_stats.image) or a relative path like
// "teams/oman.png" (in home_image) — normalize both to an absolute CDN URL.
const FOOTYSTATS_CDN = 'https://cdn.footystats.org/img';

// Match lists are read from Convex (kept fresh by a server-side sync job), which
// is far faster than hitting the proxy on every screen. Match *details* are
// still fetched on demand from the proxy below.
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null;

function resolveLogo(...candidates: (unknown)[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) {
      return c.startsWith('http') ? c : `${FOOTYSTATS_CDN}/${c.replace(/^\/+/, '')}`;
    }
  }
  return undefined;
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
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  leagueLogo?: string;
  status: string;
  odds?: {
    home: string;
    draw: string;
    away: string;
  };
  homePPG?: number;
  awayPPG?: number;
}

export interface TeamStat {
  label: string;
  home: number;
  away: number;
  /** When true, render as a percentage (e.g. possession). */
  percent?: boolean;
}

export interface GoalEvent {
  time: string;
  team: 'home' | 'away';
  scorer: string;
  assist?: string;
  type?: string;
}

export interface LineupPlayer {
  name: string;
  number?: number;
  events: { type: string; time: string }[];
}

export interface OddsComparisonMarket {
  market: string;
  selections: { name: string; odds: { bookie: string; value: string }[] }[];
}

export interface MatchPotential {
  label: string;
  /** 0–100 probability, or undefined for non-percentage metrics like avg goals. */
  percent?: number;
  value?: string;
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
  htHomeScore?: number;
  htAwayScore?: number;
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
  weather?: string;
  stadium?: string;
  attendance?: number;
  tvStations?: string[];
  preview?: string;
  homeForm?: string;
  awayForm?: string;
  homeCorners?: number;
  awayCorners?: number;
  homeXg?: number;
  awayXg?: number;
  potentials?: MatchPotential[];
  stats?: TeamStat[];
  goals?: GoalEvent[];
  homeLineup?: LineupPlayer[];
  awayLineup?: LineupPlayer[];
  oddsComparison?: OddsComparisonMarket[];
  h2h?: {
    summary: {
      wins: number;
      draws: number;
      losses: number;
    };
    history?: {
      date: string;
      league: string;
      home: string;
      away: string;
      score: string;
      outcome: string;
    }[];
  };
  detailedOdds?: {
    ft?: {
      '1x2': { home: string; draw: string; away: string };
      ou?: { over: string; under: string; line: string };
      ah?: { home: string; away: string; line: string };
    };
    ht?: {
      '1x2': { home: string; draw: string; away: string };
      ou?: { over: string; under: string; line: string };
      ah?: { home: string; away: string; line: string };
    };
  };
}

// Map a Convex match document to the AppMatch shape used across the screens.
function convexToAppMatch(d: any): AppMatch {
  return {
    id: d.id,
    league: d.league,
    country: d.country ?? '',
    timestamp: d.timestamp,
    homeTeam: d.homeTeam,
    awayTeam: d.awayTeam,
    homeScore: d.homeScore,
    awayScore: d.awayScore,
    homeTeamLogo: d.homeTeamLogo,
    awayTeamLogo: d.awayTeamLogo,
    leagueLogo: d.leagueLogo,
    status: d.status,
    odds: d.odds ? {
      home: String(d.odds.home ?? ''),
      draw: String(d.odds.draw ?? ''),
      away: String(d.odds.away ?? ''),
    } : undefined,
    homePPG: undefined,
    awayPPG: undefined,
    // Overlay fields the screens also read (win rate / AI insight / tier).
    ...(d.aiPrediction ? { aiPrediction: d.aiPrediction } : {}),
    ...(d.matchType ? { matchType: d.matchType } : {}),
  } as AppMatch;
}

export async function fetchMatches(date?: string): Promise<AppMatch[]> {
  if (!convexClient) throw new Error('Convex client not initialized');

  const docs = date
    ? await convexClient.query(api.matches.getByDate, { date })
    : await convexClient.query(api.matches.getAll, { limit: 500 });

  return (docs ?? []).map(convexToAppMatch);
}

export async function fetchMatchStats(matchId: string): Promise<MatchDetailData> {
  const res = await fetch(`${FOOTYSTATS_BASE_URL}/match-stats?match_id=${matchId}`);
  if (!res.ok) throw new Error(`FootyStats API HTTP ${res.status}`);

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'FootyStats match stats failed');
  }

  // The API returns nested: { success, data: { success, data: { match_data } } }
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

  // Derive form from last 5 results (W/D/L)
  const deriveForm = (results: any[], teamId: number): string => {
    return results.slice(0, 5).map((r: any) => {
      if (r.winningTeam === 0) return 'D';
      const isHome = r.homeID === teamId;
      const won = r.winningTeam === teamId;
      return won ? 'W' : 'L';
    }).join('');
  };

  const homeId = Number(d.homeID ?? 0);
  const awayId = Number(d.awayID ?? 0);
  const homeForm = deriveForm(teamAResults, homeId);
  const awayForm = deriveForm(teamBResults, awayId);

  // Parse H2H history from team results (last 5 meetings between these teams)
  const h2hHistory = teamAResults.slice(0, 5).map((r: any) => ({
    date: new Date((r.date_unix as number) * 1000).toISOString().split('T')[0],
    league: String(r.home_name ?? '') + ' vs ' + String(r.away_name ?? ''),
    home: String(r.home_name ?? ''),
    away: String(r.away_name ?? ''),
    score: `${r.homeGoalCount ?? 0}-${r.awayGoalCount ?? 0}`,
    outcome: r.winningTeam === 0 ? 'D' : r.winningTeam === homeId ? 'W' : 'L',
  }));

  // Parse odds from flat fields
  const odds1x2 = d.odds_ft_1 ? {
    home: String(d.odds_ft_1),
    draw: String(d.odds_ft_x ?? ''),
    away: String(d.odds_ft_2 ?? ''),
  } : undefined;

  const ftOu = d.odds_ft_over25 || d.odds_ft_under25 ? {
    over: String(d.odds_ft_over25 ?? ''),
    under: String(d.odds_ft_under25 ?? ''),
    line: '2.5',
  } : undefined;

  const ht1x2 = d.odds_1st_half_result_1 ? {
    home: String(d.odds_1st_half_result_1),
    draw: String(d.odds_1st_half_result_x ?? ''),
    away: String(d.odds_1st_half_result_2 ?? ''),
  } : undefined;

  const htOu = d.odds_1st_half_over05 || d.odds_1st_half_under05 ? {
    over: String(d.odds_1st_half_over05 ?? ''),
    under: String(d.odds_1st_half_under05 ?? ''),
    line: '0.5',
  } : undefined;

  const ah = d.odds_dnb_1 ? {
    home: String(d.odds_dnb_1 ?? ''),
    away: String(d.odds_dnb_2 ?? ''),
    line: '0',
  } : undefined;

  const detailedOdds = odds1x2 ? {
    ft: {
      '1x2': odds1x2,
      ou: ftOu,
      ah,
    },
    ht: ht1x2 ? {
      '1x2': ht1x2,
      ou: htOu,
    } : undefined,
  } : undefined;

  // Corner stats (filter out -1 which means no data)
  const homeCorners = Number(d.team_a_corners ?? -1);
  const awayCorners = Number(d.team_b_corners ?? -1);

  // --- Match stats (possession, shots, etc.) — only populated for played matches
  //     on supported leagues. -1 means "not recorded", so we skip those rows. ---
  const num = (v: unknown) => Number(v ?? -1);
  const statDefs: { label: string; a: unknown; b: unknown; percent?: boolean }[] = [
    { label: 'Possession', a: d.team_a_possession, b: d.team_b_possession, percent: true },
    { label: 'Shots', a: d.team_a_shots, b: d.team_b_shots },
    { label: 'Shots on Target', a: d.team_a_shotsOnTarget, b: d.team_b_shotsOnTarget },
    { label: 'Shots off Target', a: d.team_a_shotsOffTarget, b: d.team_b_shotsOffTarget },
    { label: 'Corners', a: d.team_a_corners, b: d.team_b_corners },
    { label: 'Fouls', a: d.team_a_fouls, b: d.team_b_fouls },
    { label: 'Offsides', a: d.team_a_offsides, b: d.team_b_offsides },
    { label: 'Yellow Cards', a: d.team_a_yellow_cards, b: d.team_b_yellow_cards },
    { label: 'Red Cards', a: d.team_a_red_cards, b: d.team_b_red_cards },
    { label: 'Dangerous Attacks', a: d.team_a_dangerous_attacks, b: d.team_b_dangerous_attacks },
    { label: 'Attacks', a: d.team_a_attacks, b: d.team_b_attacks },
  ];
  const stats: TeamStat[] = statDefs
    .filter(s => num(s.a) >= 0 && num(s.b) >= 0 && (num(s.a) > 0 || num(s.b) > 0))
    .map(s => ({ label: s.label, home: num(s.a), away: num(s.b), percent: s.percent }));

  const homeXg = Number(d.team_a_xg ?? 0);
  const awayXg = Number(d.team_b_xg ?? 0);

  // --- Pre-match probability potentials (available even before kickoff) ---
  const pct = (v: unknown) => {
    const n = Number(v ?? -1);
    return n >= 0 && n <= 100 ? n : undefined;
  };
  const potentials: MatchPotential[] = [
    { label: 'BTTS', percent: pct(d.btts_potential) },
    { label: 'Over 1.5', percent: pct(d.o15_potential) },
    { label: 'Over 2.5', percent: pct(d.o25_potential) },
    { label: 'Over 3.5', percent: pct(d.o35_potential) },
    { label: 'Corners o9.5', percent: pct(d.corners_potential) },
    { label: 'Cards', percent: pct(d.cards_potential) },
  ].filter(p => p.percent !== undefined);
  if (Number(d.avg_potential ?? 0) > 0) {
    potentials.push({ label: 'Avg Goals', value: String(d.avg_potential) });
  }

  // --- Goal timeline ---
  const rawGoals = (d.goal_events ?? []) as any[];
  const goals: GoalEvent[] = rawGoals
    .filter(g => g && g.known_as)
    .map(g => ({
      time: String(g.time ?? '') + (g.extra ? `+${g.extra}` : ''),
      team: g.teamIS === 'b' ? 'away' as const : 'home' as const,
      scorer: String(g.known_as),
      assist: (g.assist_known_as && g.assist_known_as !== 'No Assist') ? String(g.assist_known_as) : undefined,
      type: g.type ? String(g.type) : undefined,
    }));

  // --- Lineups ---
  const rawLineups = (d.lineups ?? {}) as Record<string, unknown>;
  const mapLineup = (arr: unknown): LineupPlayer[] =>
    (Array.isArray(arr) ? arr : [])
      .filter((p: any) => p && p.known_as)
      .map((p: any) => ({
        name: String(p.known_as),
        number: Number(p.shirt_number ?? 0) || undefined,
        events: (Array.isArray(p.player_events) ? p.player_events : []).map((e: any) => ({
          type: String(e.event_type ?? ''),
          time: String(e.event_time ?? ''),
        })),
      }));
  const homeLineup = mapLineup(rawLineups.team_a);
  const awayLineup = mapLineup(rawLineups.team_b);

  // --- Bookmaker odds comparison ---
  const rawOC = (d.odds_comparison ?? {}) as Record<string, Record<string, Record<string, string>>>;
  const oddsComparison: OddsComparisonMarket[] = Object.entries(rawOC)
    .map(([market, selections]) => ({
      market,
      selections: Object.entries(selections || {}).map(([name, bookies]) => ({
        name,
        odds: Object.entries(bookies || {}).map(([bookie, value]) => ({ bookie, value: String(value) })),
      })).filter(s => s.odds.length > 0),
    }))
    .filter(m => m.selections.length > 0);

  // --- HT score ---
  const htHome = Number(d.ht_goals_team_a ?? -1);
  const htAway = Number(d.ht_goals_team_b ?? -1);

  // --- Venue / broadcast / preview ---
  const competitionName = String((d.competition_stats as any)?.english_name ?? (d.competition_stats as any)?.name ?? '');
  const stadium = String(d.stadium_name ?? '').trim();
  const stadiumLoc = String(d.stadium_location ?? '').trim();
  const attendance = Number(d.attendance ?? -1);
  const tvStations = (Array.isArray(d.tv_stations) ? d.tv_stations : [])
    .map((t: unknown) => String(t)).filter(Boolean);
  const preview = String(d.gpt_en ?? '').trim();

  return {
    id: matchId,
    // Fall back to the proper competition name from match-stats; the detail
    // screen still prefers the league title it already has from the list data.
    league: competitionName,
    country: String(teamAStats.country ?? ''),
    timestamp,
    homeTeam: String(d.home_name ?? ''),
    awayTeam: String(d.away_name ?? ''),
    homeScore: scoresAvailable ? (Number(d.homeGoalCount ?? 0) || undefined) : undefined,
    awayScore: scoresAvailable ? (Number(d.awayGoalCount ?? 0) || undefined) : undefined,
    htHomeScore: (scoresAvailable && htHome >= 0) ? htHome : undefined,
    htAwayScore: (scoresAvailable && htAway >= 0) ? htAway : undefined,
    homeTeamLogo: resolveLogo(teamAStats.image, d.home_image),
    awayTeamLogo: resolveLogo(teamBStats.image, d.away_image),
    homeStanding: Number(teamAStats.table_position ?? 0) || undefined,
    awayStanding: Number(teamBStats.table_position ?? 0) || undefined,
    status: String(d.status ?? ''),
    odds: odds1x2,
    referee: undefined, // ID only, no name in API
    weather: undefined, // Not available in API
    stadium: stadium ? (stadiumLoc ? `${stadium}, ${stadiumLoc}` : stadium) : undefined,
    attendance: attendance > 0 ? attendance : undefined,
    tvStations: tvStations.length > 0 ? tvStations : undefined,
    preview: preview || undefined,
    homeForm: homeForm || undefined,
    awayForm: awayForm || undefined,
    homeCorners: homeCorners >= 0 ? homeCorners : undefined,
    awayCorners: awayCorners >= 0 ? awayCorners : undefined,
    homeXg: homeXg > 0 ? homeXg : undefined,
    awayXg: awayXg > 0 ? awayXg : undefined,
    potentials: potentials.length > 0 ? potentials : undefined,
    stats: stats.length > 0 ? stats : undefined,
    goals: goals.length > 0 ? goals : undefined,
    homeLineup: homeLineup.length > 0 ? homeLineup : undefined,
    awayLineup: awayLineup.length > 0 ? awayLineup : undefined,
    oddsComparison: oddsComparison.length > 0 ? oddsComparison : undefined,
    h2h: h2hSummary.totalMatches ? {
      summary: {
        wins: Number(h2hSummary.team_a_wins ?? 0),
        draws: Number(h2hSummary.draw ?? 0),
        losses: Number(h2hSummary.team_b_wins ?? 0),
      },
      history: h2hHistory.length > 0 ? h2hHistory : undefined,
    } : undefined,
    detailedOdds,
  };
}

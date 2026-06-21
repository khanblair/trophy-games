const FOOTYSTATS_BASE_URL = 'http://us3.bot-hosting.net:20562';

// Logos are served from this HTTPS CDN. match-stats returns either a full URL
// (team_a_stats.image) or a relative path (home_image) — normalize both.
const FOOTYSTATS_CDN = 'https://cdn.footystats.org/img';

import { MatchData } from '@trophy-games/shared';

function resolveLogo(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) {
      return c.startsWith('http') ? c : `${FOOTYSTATS_CDN}/${c.replace(/^\/+/, '')}`;
    }
  }
  return undefined;
}

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

export interface DerivedLeague {
  id: number;
  name: string;
  country: string;
  type: 'league' | 'cup';
  logo: string;
  matchCount: number;
}

// Derive the league list straight from the proxy matches — same source the
// mobile app uses — so web and mobile always show the same set of leagues.
export function deriveLeaguesFromMatches(matches: MatchData[]): DerivedLeague[] {
  const map = new Map<string, DerivedLeague>();
  let idx = 1;

  for (const m of matches) {
    if (!m.league) continue;
    const existing = map.get(m.league);
    if (existing) {
      existing.matchCount += 1;
      if (!existing.logo && m.leagueLogo) existing.logo = m.leagueLogo;
    } else {
      map.set(m.league, {
        id: idx++,
        name: m.league,
        country: m.country || '',
        type: /cup|copa|trophy|shield|league cup/i.test(m.league) ? 'cup' : 'league',
        logo: m.leagueLogo || '',
        matchCount: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
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

  const ftOu = d.odds_ft_over25 || d.odds_ft_under25 ? {
    over: String(d.odds_ft_over25 ?? ''),
    under: String(d.odds_ft_under25 ?? ''),
    line: '2.5',
  } : undefined;

  const ht1x2 = d.odds_1st_half_result_1 ? {
    home: String(d.odds_1st_half_result_1 ?? ''),
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

  // --- Match stats (possession, shots, etc.) — only for played matches ---
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
  const stats = statDefs
    .filter(s => num(s.a) >= 0 && num(s.b) >= 0 && (num(s.a) > 0 || num(s.b) > 0))
    .map(s => ({ label: s.label, home: num(s.a), away: num(s.b), percent: s.percent }));

  const homeXg = Number(d.team_a_xg ?? 0);
  const awayXg = Number(d.team_b_xg ?? 0);

  // --- Pre-match probability potentials ---
  const pct = (v: unknown) => {
    const n = Number(v ?? -1);
    return n >= 0 && n <= 100 ? n : undefined;
  };
  const potentials: { label: string; percent?: number; value?: string }[] = [
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
  const goals = rawGoals
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
  const mapLineup = (arr: unknown) =>
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
  const oddsComparison = Object.entries(rawOC)
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
    league: competitionName || String(d.home_name ?? ''),
    country: String(teamAStats.country ?? ''),
    timestamp,
    homeTeam: String(d.home_name ?? ''),
    awayTeam: String(d.away_name ?? ''),
    homeScore: scoresAvailable ? (Number(d.homeGoalCount ?? 0) || undefined) : undefined,
    awayScore: scoresAvailable ? (Number(d.awayGoalCount ?? 0) || undefined) : undefined,
    htHomeScore: scoresAvailable && htHome >= 0 ? htHome : undefined,
    htAwayScore: scoresAvailable && htAway >= 0 ? htAway : undefined,
    homeTeamLogo: resolveLogo(teamAStats.image, d.home_image),
    awayTeamLogo: resolveLogo(teamBStats.image, d.away_image),
    homeStanding: Number(teamAStats.table_position ?? 0) || undefined,
    awayStanding: Number(teamBStats.table_position ?? 0) || undefined,
    status: String(d.status ?? ''),
    odds: odds1x2,
    homeForm: homeForm || undefined,
    awayForm: awayForm || undefined,
    homeCorners: homeCorners >= 0 ? homeCorners : undefined,
    awayCorners: awayCorners >= 0 ? awayCorners : undefined,
    homeXg: homeXg > 0 ? homeXg : undefined,
    awayXg: awayXg > 0 ? awayXg : undefined,
    stadium: stadium ? (stadiumLoc ? `${stadium}, ${stadiumLoc}` : stadium) : undefined,
    attendance: attendance > 0 ? attendance : undefined,
    tvStations: tvStations.length > 0 ? tvStations : undefined,
    preview: preview || undefined,
    potentials: potentials.length > 0 ? potentials : undefined,
    stats: stats.length > 0 ? stats : undefined,
    goals: goals.length > 0 ? goals : undefined,
    homeLineup: homeLineup.length > 0 ? homeLineup : undefined,
    awayLineup: awayLineup.length > 0 ? awayLineup : undefined,
    oddsComparison: oddsComparison.length > 0 ? oddsComparison : undefined,
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

  // Add footy matches first, merging with Convex metadata when available
  for (const fm of footyMatches) {
    const key = `${fm.homeTeam}|${fm.awayTeam}|${fm.league}|${fm.matchDate}`;
    const convexMatch = convexMap.get(key);

    if (convexMatch) {
      // Merge: footy for live data, convex for metadata (matchType, AI, etc.)
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

  // Append Convex-only matches (e.g. matches tagged by admin that FootyStats
  // no longer returns — these MUST appear so the dashboard stays in sync
  // with the mobile app, which queries Convex directly by matchType).
  for (const cm of convexMap.values()) {
    merged.set(cm.id, cm);
  }

  return Array.from(merged.values());
}

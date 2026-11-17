import type {
  GoalEvent,
  LineupPlayer,
  MatchPotential,
  OddsComparisonMarket,
  TeamStat,
} from '../api/footystats';

export type MatchTier = 'free' | 'paid' | 'vip' | 'unassigned';

export interface AiPrediction {
  prediction: string;
  confidence: number;
  reasoning: string[];
  suggestedBet?: string;
  generatedAt?: string;
}

export interface H2hHistoryRow {
  date: string;
  league: string;
  home: string;
  away: string;
  score: string;
  outcome: string;
}

/**
 * The read model shared by every match surface (list cards and detail screen).
 * Convex, the proxy and the navigation params all feed into this shape.
 */
export interface FixtureMatch {
  [key: string]: unknown;

  id: string;
  league: string;
  country?: string;
  countryFlag?: string;
  leagueLogo?: string;
  homeTeam: string;
  homeTeamLogo?: string;
  awayTeam: string;
  awayTeamLogo?: string;
  timestamp: string;
  matchDate?: string;
  matchType?: MatchTier;
  status?: string;
  score?: string;
  homeScore?: number;
  awayScore?: number;
  htHomeScore?: number;
  htAwayScore?: number;
  homeStanding?: number;
  awayStanding?: number;
  stadium?: string;
  attendance?: number;
  tvStations?: string[];
  referee?: string;
  weather?: string;
  preview?: string;
  homeForm?: string;
  awayForm?: string;
  homeCorners?: number;
  awayCorners?: number;
  homeXg?: number;
  awayXg?: number;
  isTrending?: boolean;
  isHistory?: boolean;
  result?: 'win' | 'lose' | 'draw';
  odds?: { home?: string; draw?: string; away?: string };
  aiPrediction?: AiPrediction;
  potentials?: MatchPotential[];
  stats?: TeamStat[];
  goals?: GoalEvent[];
  homeLineup?: LineupPlayer[];
  awayLineup?: LineupPlayer[];
  oddsComparison?: OddsComparisonMarket[];
  h2h?: {
    summary: { wins: number; draws: number; losses: number };
    history?: H2hHistoryRow[];
  };
}

/** Narrows an unknown value to a list of match read models without unsafe casts. */
export function asFixtureMatches(value: unknown): FixtureMatch[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is FixtureMatch => {
    if (typeof item !== 'object' || item === null) return false;
    const candidate = item as Record<string, unknown>;
    return typeof candidate.id === 'string' && typeof candidate.league === 'string';
  });
}

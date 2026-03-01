export interface MatchData {
    id: string;
    league: string;
    leagueId?: number;
    leagueLogo?: string;
    homeTeam: string;
    homeTeamId?: number;
    homeTeamLogo?: string;
    awayTeam: string;
    awayTeamId?: number;
    awayTeamLogo?: string;
    country?: string;
    countryFlag?: string;
    timestamp: string;
    status: string;
    score: string;
    homeScore?: number;
    awayScore?: number;
    homeStanding?: number;
    awayStanding?: number;
    referee?: string;
    weather?: string;
    matchType?: 'free' | 'paid' | 'vip';
    isTrending?: boolean;
    aiPrediction?: {
        prediction: string;
        confidence: number;
        reasoning: string[];
        suggestedBet?: string;
        generatedAt?: string;
    };
    odds?: {
        home: string;
        away: string;
        draw?: string;
    };
    detailedOdds?: {
        isGenerated?: boolean;
        ft: {
            '1x2': { home: string; draw: string; away: string; initHome: string; initDraw: string; initAway: string; };
            'ou': { over: string; line: string; under: string; initOver: string; initLine: string; initUnder: string; };
            'ah': { home: string; line: string; away: string; initHome: string; initLine: string; initAway: string; };
        };
        ht: {
            '1x2': { home: string; draw: string; away: string; initHome: string; initDraw: string; initAway: string; };
            'ou': { over: string; line: string; under: string; initOver: string; initLine: string; initUnder: string; };
            'ah': { home: string; line: string; away: string; initHome: string; initLine: string; initAway: string; };
        };
    };
    h2h?: {
        isGenerated?: boolean;
        summary: {
            wins: number;
            draws: number;
            losses: number;
            total: number;
            homeGoalsAvg: number;
            awayGoalsAvg: number;
        };
        history: {
            date: string;
            league: string;
            home: string;
            away: string;
            score: string;
            htScore: string;
            corner: string;
            outcome: 'W' | 'D' | 'L';
            odds: { home: string; draw: string; away: string; };
        }[];
    };
    source?: 'odds-api' | 'goaloo-live';
}

export interface LeagueInfo {
    id: number;
    name: string;
    url: string;
    logo?: string;
    type: 'league' | 'cup';
    matchCount?: number;
    country?: string;
    countryId?: number;
    countryFlag?: string;
}

export const TRENDING_LEAGUES = [
    { id: 36, name: 'English Premier League', country: 'England' },
    { id: 8, name: 'German Bundesliga', country: 'Germany' },
    { id: 31, name: 'Spanish La Liga', country: 'Spain' },
    { id: 34, name: 'Italian Serie A', country: 'Italy' },
    { id: 11, name: 'French Ligue 1', country: 'France' },
    { id: 25, name: 'Japan J1 League', country: 'Japan' },
    { id: 273, name: 'Australian A-League', country: 'Australia' },
    { id: 39, name: 'English Championship', country: 'England' },
    { id: 27, name: 'USA MLS', country: 'USA' },
    { id: 37, name: 'English FA Cup', country: 'England' },
    { id: 10, name: 'Champions League', country: 'Europe' },
    { id: 15, name: 'Europa League', country: 'Europe' },
    { id: 103, name: 'Africa Cup of Nations', country: 'Africa' },
];

export const TRENDING_LEAGUE_IDS = new Set(TRENDING_LEAGUES.map(l => l.id));

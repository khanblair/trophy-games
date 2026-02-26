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

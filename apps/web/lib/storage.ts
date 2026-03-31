import { MatchData, LeagueInfo } from '@trophy-games/shared';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export interface ScrapedData {
    leagues: LeagueInfo[];
    matches: MatchData[];
    lastUpdated: string;
}

export async function saveMatches(matches: MatchData[], leagues: LeagueInfo[] = []) {
    if (!convex || !matches.length) return;

    console.log(`[Storage] Saving ${matches.length} matches to Convex...`);
    try {
        await convex.mutation(api.matches.saveAll, {
            matches: matches,
            leagues: leagues,
        });
    } catch (error) {
        console.error('[Storage] Save matches failed:', error);
    }
}

export async function loadData(): Promise<ScrapedData> {
    if (!convex) {
        console.warn('[Storage] Convex not configured. Using empty data.');
        return { leagues: [], matches: [], lastUpdated: '' };
    }

    try {
        const [rawMatches, rawLeagues] = await Promise.all([
            convex.query(api.matches.getAll, { limit: 500 }),
            convex.query(api.matches.getAllLeagues)
        ]);

        const matches = (rawMatches as MatchData[] || []);
        const leagues = (rawLeagues as LeagueInfo[] || []);

        console.log(`[Storage] Loaded ${matches.length} matches and ${leagues.length} leagues.`);

        return {
            leagues: leagues,
            matches: matches,
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error('[Storage] Load from Convex failed:', error);
        return { leagues: [], matches: [], lastUpdated: '' };
    }
}

export async function getMatchCount(): Promise<{ totalMatches: number }> {
    if (!convex) {
        return { totalMatches: 0 };
    }

    try {
        const allMatches = await convex.query(api.matches.getAll, { limit: 1000 });
        const matches = allMatches as MatchData[] || [];
        
        return {
            totalMatches: matches.length,
        };
    } catch (error) {
        console.error('[Storage] Get match count failed:', error);
        return { totalMatches: 0 };
    }
}

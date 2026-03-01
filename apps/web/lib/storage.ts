import { MatchData, LeagueInfo, TRENDING_LEAGUE_IDS } from '@trophy-games/shared';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export interface ScrapedData {
    leagues: LeagueInfo[];
    matches: MatchData[];
    lastUpdated: string;
}

export async function saveOddsData(matches: MatchData[], leagues: LeagueInfo[]) {
    if (!convex || !matches.length) return;

    console.log(`[Storage] Saving ${matches.length} odds-api matches to Convex...`);
    try {
        await convex.mutation(api.matches.saveAll, {
            matches: matches,
            leagues: leagues,
        });
    } catch (error) {
        console.error('[Storage] Save odds data failed:', error);
    }
}

export async function saveLiveData(matches: MatchData[]) {
    if (!convex || !matches.length) return;

    console.log(`[Storage] Saving ${matches.length} goaloo-live matches to Convex...`);
    try {
        await convex.mutation(api.matches.saveAll, {
            matches: matches,
            leagues: [],
        });
    } catch (error) {
        console.error('[Storage] Save live data failed:', error);
    }
}

export async function saveData(data: Partial<ScrapedData>) {
    if (!convex || !data.matches || !data.leagues) return;

    console.log(`[Storage] Pushing ${data.matches.length} matches to Convex...`);
    try {
        await convex.mutation(api.matches.saveAll, {
            matches: data.matches,
            leagues: data.leagues,
        });
    } catch (error) {
        console.error('[Storage] Save to Convex failed:', error);
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

export async function getSyncStatus(): Promise<{ oddsMatches: number; liveMatches: number; lastOddsSync: string | null; lastLiveSync: string | null }> {
    if (!convex) {
        return { oddsMatches: 0, liveMatches: 0, lastOddsSync: null, lastLiveSync: null };
    }

    try {
        const allMatches = await convex.query(api.matches.getAll, { limit: 1000 });
        const matches = allMatches as MatchData[] || [];
        
        const oddsMatches = matches.filter(m => m.source === 'odds-api').length;
        const liveMatches = matches.filter(m => m.source === 'goaloo-live').length;

        return {
            oddsMatches,
            liveMatches,
            lastOddsSync: null,
            lastLiveSync: null,
        };
    } catch (error) {
        console.error('[Storage] Get sync status failed:', error);
        return { oddsMatches: 0, liveMatches: 0, lastOddsSync: null, lastLiveSync: null };
    }
}

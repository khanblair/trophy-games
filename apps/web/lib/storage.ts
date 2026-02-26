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
        const matches = await convex.query(api.matches.getAll, { limit: 200 });
        return {
            leagues: [], // We'll add a league query later if needed
            matches: matches as any,
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error('[Storage] Load from Convex failed:', error);
        return { leagues: [], matches: [], lastUpdated: '' };
    }
}


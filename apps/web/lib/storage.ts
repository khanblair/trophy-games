import { MatchData, LeagueInfo } from '@trophy-games/shared';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convex = new ConvexHttpClient(convexUrl);

export interface ScrapedData {
    leagues: LeagueInfo[];
    matches: MatchData[];
    lastUpdated: string;
}

export async function saveData(data: Partial<ScrapedData>) {
    if (!data.matches || !data.leagues) return;

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
    try {
        const matches = await convex.query(api.matches.get);
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


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
            convex.query(api.matches.getAll, { limit: 500 }), // Increased limit to ensure we get enough trending matches
            convex.query(api.matches.getAllLeagues)
        ]);

        // Filter and ensure type safety
        const matches = (rawMatches as MatchData[]).filter(m =>
            m.leagueId && TRENDING_LEAGUE_IDS.has(m.leagueId)
        );

        const leagues = (rawLeagues as LeagueInfo[]).filter(l =>
            TRENDING_LEAGUE_IDS.has(l.id)
        );

        console.log(`[Storage] Loaded ${matches.length} trending matches and ${leagues.length} trending leagues.`);

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

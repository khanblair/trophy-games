import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// FootyStats proxy (same source the app used to hit directly).
const BASE_URL = "http://us3.bot-hosting.net:20562";

interface RawMatch {
    id: number;
    home_name: string;
    away_name: string;
    homeGoalCount: number | null;
    awayGoalCount: number | null;
    status: string;
    odds_ft_1: number | null;
    odds_ft_x: number | null;
    odds_ft_2: number | null;
    date_unix: number;
}

interface RawGroup {
    title: string;
    country: string;
    matches: RawMatch[];
}

function toMatchDoc(raw: RawMatch, group: RawGroup) {
    const scoresAvailable = raw.status !== 'incomplete';
    return {
        id: String(raw.id),
        league: group.title,
        country: group.country,
        timestamp: new Date(raw.date_unix * 1000).toISOString(),
        homeTeam: raw.home_name,
        awayTeam: raw.away_name,
        homeScore: (scoresAvailable && raw.homeGoalCount != null) ? raw.homeGoalCount : undefined,
        awayScore: (scoresAvailable && raw.awayGoalCount != null) ? raw.awayGoalCount : undefined,
        status: raw.status === 'incomplete' ? 'Scheduled' : raw.status === 'complete' ? 'Finished' : raw.status,
        odds: raw.odds_ft_1 ? {
            home: String(raw.odds_ft_1),
            away: String(raw.odds_ft_2 ?? ''),
            draw: String(raw.odds_ft_x ?? ''),
        } : undefined,
    };
}

// Scheduled ingest: pull a window of dates from the proxy and upsert into Convex.
// The apps then read from Convex (fast) instead of hitting the slow proxy.
export const syncMatches = internalAction({
    args: {
        daysBack: v.optional(v.number()),
        daysForward: v.optional(v.number()),
    },
    // Explicit return type breaks the circular inference between this action and
    // the generated `internal` api it references (ctx.runMutation below).
    handler: async (ctx, args): Promise<{ inserted: number; updated: number; total: number }> => {
        const back = args.daysBack ?? 7;
        const fwd = args.daysForward ?? 4;

        const dates: string[] = [];
        for (let i = -back; i <= fwd; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }

        const all: ReturnType<typeof toMatchDoc>[] = [];
        for (const date of dates) {
            try {
                const res = await fetch(`${BASE_URL}/matches?tz=WAT&date=${date}`);
                if (!res.ok) {
                    console.warn(`[syncMatches] ${date} HTTP ${res.status}`);
                    continue;
                }
                const json = await res.json();
                const groups: RawGroup[] = json?.data?.data ?? [];
                for (const group of groups) {
                    for (const raw of (group.matches ?? [])) {
                        all.push(toMatchDoc(raw, group));
                    }
                }
            } catch (e) {
                console.error(`[syncMatches] fetch failed for ${date}:`, e);
            }
        }

        if (all.length > 0) {
            const result = await ctx.runMutation(internal.matches.bulkUpsert, { matches: all });
            console.log(`[syncMatches] ${dates.length} dates, ${all.length} matches — inserted ${result.inserted}, updated ${result.updated}`);
            return result;
        }

        console.warn('[syncMatches] No matches fetched from proxy');
        return { inserted: 0, updated: 0, total: 0 };
    },
});

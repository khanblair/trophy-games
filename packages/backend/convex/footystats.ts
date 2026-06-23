import { internalAction } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { isEliteLeague } from "./leagues";

// FootyStats proxy (same source the app used to hit directly).
const BASE_URL = "http://us3.bot-hosting.net:20562";
const FOOTYSTATS_CDN = "https://cdn.footystats.org/img";

interface RawGroup {
    title: string;
    country: string;
    name: string;
    iso: string;
    matches: Record<string, any>[];
}

function resolveLogo(...candidates: unknown[]): string | undefined {
    for (const c of candidates) {
        if (typeof c === "string" && c.length > 0) {
            return c.startsWith("http") ? c : `${FOOTYSTATS_CDN}/${c.replace(/^\/+/, "")}`;
        }
    }
    return undefined;
}

function toMatchDoc(raw: Record<string, any>, group: RawGroup) {
    const scoresAvailable = raw.status !== "incomplete";
    const date = new Date(raw.date_unix * 1000);

    // --- Basic odds (1X2) ---
    const odds = raw.odds_ft_1
        ? {
            home: String(raw.odds_ft_1),
            away: String(raw.odds_ft_2 ?? ""),
            draw: String(raw.odds_ft_x ?? ""),
        }
        : undefined;

    // --- Detailed odds ---
    const odds1x2 = raw.odds_ft_1
        ? {
            home: String(raw.odds_ft_1),
            draw: String(raw.odds_ft_x ?? ""),
            away: String(raw.odds_ft_2 ?? ""),
        }
        : undefined;

    const ftOu = raw.odds_ft_over25 || raw.odds_ft_under25
        ? {
            over: String(raw.odds_ft_over25 ?? ""),
            under: String(raw.odds_ft_under25 ?? ""),
            line: "2.5",
        }
        : undefined;

    const ftOu15 = raw.odds_ft_over15 || raw.odds_ft_under15
        ? {
            over: String(raw.odds_ft_over15 ?? ""),
            under: String(raw.odds_ft_under15 ?? ""),
            line: "1.5",
        }
        : undefined;

    const ht1x2 = raw.odds_1st_half_result_1
        ? {
            home: String(raw.odds_1st_half_result_1 ?? ""),
            draw: String(raw.odds_1st_half_result_x ?? ""),
            away: String(raw.odds_1st_half_result_2 ?? ""),
        }
        : undefined;

    const htOu = raw.odds_1st_half_over05 || raw.odds_1st_half_under05
        ? {
            over: String(raw.odds_1st_half_over05 ?? ""),
            under: String(raw.odds_1st_half_under05 ?? ""),
            line: "0.5",
        }
        : undefined;

    const btts = raw.odds_btts_yes || raw.odds_btts_no
        ? {
            yes: String(raw.odds_btts_yes ?? ""),
            no: String(raw.odds_btts_no ?? ""),
        }
        : undefined;

    const cornersOu = raw.odds_corners_over_95 || raw.odds_corners_under_95
        ? {
            over: String(raw.odds_corners_over_95 ?? ""),
            under: String(raw.odds_corners_under_95 ?? ""),
            line: "9.5",
        }
        : undefined;

    const detailedOdds = odds1x2
        ? {
            ft: {
                "1x2": odds1x2,
                ou: ftOu || ftOu15,
                ah: undefined, // Not directly available in /matches
                btts,
                corners: cornersOu,
            },
            ht: ht1x2
                ? {
                    "1x2": ht1x2,
                    ou: htOu,
                }
                : undefined,
        }
        : undefined;

    // --- Potentials (pre-match probabilities) ---
    const pct = (v: unknown) => {
        const n = Number(v ?? -1);
        return n >= 0 && n <= 100 ? n : undefined;
    };
    const potentials: { label: string; percent?: number; value?: string }[] = [
        { label: "BTTS", percent: pct(raw.btts_potential) },
        { label: "Over 0.5", percent: pct(raw.o05_potential) },
        { label: "Over 1.5", percent: pct(raw.o15_potential) },
        { label: "Over 2.5", percent: pct(raw.o25_potential) },
        { label: "Over 3.5", percent: pct(raw.o35_potential) },
        { label: "HT Over 0.5", percent: pct(raw.o05HT_potential) },
        { label: "Corners o9.5", percent: pct(raw.corners_potential) },
        { label: "Cards", percent: pct(raw.cards_potential) },
    ].filter((p) => p.percent !== undefined);
    if (Number(raw.avg_potential ?? 0) > 0) {
        potentials.push({ label: "Avg Goals", value: String(raw.avg_potential) });
    }

    // --- Form strings (derived from PPG data) ---
    const deriveForm = (ppg: number | null) => {
        if (ppg == null) return undefined;
        // Map PPG to rough form: >2 = W, 1.5-2 = W/D mix, 1-1.5 = D mix, <1 = L mix
        if (ppg >= 2) return "WWWWD";
        if (ppg >= 1.5) return "WWWDW";
        if (ppg >= 1.2) return "WWDLD";
        if (ppg >= 0.8) return "WDLLD";
        return "WLLDL";
    };

    const homeForm = deriveForm(raw.home_ppg ?? raw.pre_match_home_ppg ?? raw.team_a_default_ppg ?? null);
    const awayForm = deriveForm(raw.away_ppg ?? raw.pre_match_away_ppg ?? raw.team_b_default_ppg ?? null);

    // --- Logos ---
    const homeTeamLogo = resolveLogo(raw.home_image);
    const awayTeamLogo = resolveLogo(raw.away_image);
    const leagueLogo = resolveLogo(raw.league_image);
    const countryFlag = group.iso
        ? `https://cdn.footystats.org/img/flags/${group.iso}.png`
        : undefined;

    return {
        id: String(raw.id),
        league: group.title,
        country: group.country,
        timestamp: date.toISOString(),
        matchDate: date.toISOString().split("T")[0],
        homeTeam: raw.home_name,
        awayTeam: raw.away_name,
        homeScore: scoresAvailable && raw.homeGoalCount != null ? raw.homeGoalCount : undefined,
        awayScore: scoresAvailable && raw.awayGoalCount != null ? raw.awayGoalCount : undefined,
        status: raw.status === "incomplete" ? "Scheduled" : raw.status === "complete" ? "Finished" : raw.status,
        odds,
        detailedOdds,
        potentials: potentials.length > 0 ? potentials : undefined,
        homeForm,
        awayForm,
        homeTeamLogo,
        awayTeamLogo,
        leagueLogo,
        countryFlag,
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
            dates.push(d.toISOString().split("T")[0]);
        }

        let inserted = 0;
        let updated = 0;
        let total = 0;

        // Upsert one date at a time so each mutation stays small and bounded.
        for (const date of dates) {
            try {
                const res = await fetch(`${BASE_URL}/matches?tz=WAT&date=${date}`);
                if (!res.ok) {
                    console.warn(`[syncMatches] ${date} HTTP ${res.status}`);
                    continue;
                }
                const json = await res.json();
                const groups: RawGroup[] = json?.data?.data ?? [];
                const docs: ReturnType<typeof toMatchDoc>[] = [];
                for (const group of groups) {
                    // Only ingest the elite competitions — skip the worldwide noise.
                    if (!isEliteLeague(group.title, group.country)) continue;
                    for (const raw of group.matches ?? []) {
                        docs.push(toMatchDoc(raw, group));
                    }
                }
                if (docs.length > 0) {
                    const r = await ctx.runMutation(api.matches.bulkUpsert, { matches: docs });
                    inserted += r.inserted;
                    updated += r.updated;
                    total += r.total;
                }
            } catch (e) {
                console.error(`[syncMatches] sync failed for ${date}:`, e);
            }
        }

        console.log(`[syncMatches] ${dates.length} dates — inserted ${inserted}, updated ${updated}, total ${total}`);
        return { inserted, updated, total };
    },
});

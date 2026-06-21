import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";
import { MatchData } from '@trophy-games/shared';
import { fetchFootyStatsMatches, mergeWithConvexData, deriveLeaguesFromMatches } from '@/lib/footystats';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

const empty = {
    totalLeagues: 0,
    totalMatches: 0,
    freeTips: 0,
    paidTips: 0,
    vipTips: 0,
    winRate: 0,
    lastUpdated: new Date().toISOString(),
};

export async function GET() {
    try {
        // Matches + leagues come from the proxy (same as mobile).
        const footyMatches = await fetchFootyStatsMatches();

        // Overlay Convex metadata (match types, results) when available.
        let matchesList: MatchData[] = footyMatches;
        if (convex) {
            try {
                const convexMatches = await convex.query(api.matches.getAll, { limit: 1000 });
                matchesList = mergeWithConvexData(footyMatches, convexMatches as MatchData[]);
            } catch (e) {
                console.warn('[API Stats] Convex overlay failed, using proxy only:', e);
            }
        }

        const leaguesList = deriveLeaguesFromMatches(footyMatches);

        const totalMatches = matchesList.length;
        const totalLeagues = leaguesList.length;
        const freeTips = matchesList.filter((m) => m.matchType === 'free').length;
        const paidTips = matchesList.filter((m) => m.matchType === 'paid').length;
        const vipTips = matchesList.filter((m) => m.matchType === 'vip').length;

        const historyMatches = matchesList.filter((m) => m.result);
        const wins = historyMatches.filter((m) => m.result === 'win').length;
        const winRate = historyMatches.length > 0 ? Math.round((wins / historyMatches.length) * 100) : 0;

        return NextResponse.json({
            totalLeagues,
            totalMatches,
            freeTips,
            paidTips,
            vipTips,
            winRate,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[API Stats] Error:', error);
        return NextResponse.json(empty);
    }
}

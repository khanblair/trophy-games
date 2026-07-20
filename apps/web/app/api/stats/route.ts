import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";
import { MatchData } from '@trophy-games/shared';
import { deriveLeaguesFromMatches } from '@/lib/footystats';

export const dynamic = 'force-dynamic';

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

// Stats computed from Convex matches (kept in sync with the proxy by the cron).
export async function GET() {
    try {
        if (!convex) {
            return NextResponse.json(empty);
        }

        const matchesList = await convex.query(api.matches.getAll, { limit: 1000 }) as MatchData[];
        const leaguesList = deriveLeaguesFromMatches(matchesList);

        const totalMatches = matchesList.length;
        const totalLeagues = leaguesList.length;
        const freeTips = matchesList.filter((m) => m.matchType === 'free').length;
        const paidTips = matchesList.filter((m) => m.matchType === 'paid').length;
        const vipTips = matchesList.filter((m) => m.matchType === 'vip').length;

        // Win rate = finished matches the home side won (mirrors the mobile Wins screen).
        const finished = matchesList.filter((m) => m.homeScore !== undefined && m.awayScore !== undefined);
        const homeWins = finished.filter((m) => (m.homeScore as number) > (m.awayScore as number)).length;
        const winRate = finished.length > 0 ? Math.round((homeWins / finished.length) * 100) : 0;

        const usersList = await convex.query(api.users.getAllUsers, {});
        const totalUsers = usersList.length;

        return NextResponse.json({
            totalLeagues,
            totalMatches,
            freeTips,
            paidTips,
            vipTips,
            winRate,
            totalUsers,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[API Stats] Error:', error);
        return NextResponse.json(empty);
    }
}

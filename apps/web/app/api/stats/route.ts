import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";
import { fetchFootyStatsMatches, mergeWithConvexData } from '@/lib/footystats';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export async function GET() {
    try {
        if (!convex) {
            return NextResponse.json({
                totalLeagues: 0,
                totalMatches: 0,
                freeTips: 0,
                paidTips: 0,
                vipTips: 0,
                winRate: 0,
                lastUpdated: new Date().toISOString()
            });
        }

        let matchesList: any[] = [];
        let leaguesList: any[] = [];

        try {
            // Try FootyStats first for live data
            const footyMatches = await fetchFootyStatsMatches();
            const convexMatches = await convex.query(api.matches.getAll, { limit: 1000 });
            const merged = mergeWithConvexData(footyMatches, convexMatches as any[]);
            matchesList = merged;
            console.log(`[API Stats] ${matchesList.length} merged matches`);

            // Extract unique leagues from FootyStats data
            const leagues = await convex.query(api.matches.getAllLeagues);
            leaguesList = leagues || [];
        } catch (footyError) {
            console.warn('[API Stats] FootyStats failed, falling back to Convex:', footyError);
            const [matches, leagues] = await Promise.all([
                convex.query(api.matches.getAll, { limit: 1000 }),
                convex.query(api.matches.getAllLeagues)
            ]);
            matchesList = matches || [];
            leaguesList = leagues || [];
        }

        // Calculate stats
        const totalMatches = matchesList.length;
        const totalLeagues = leaguesList.length;

        // Count by match type
        const freeTips = matchesList.filter((m: any) => m.matchType === 'free').length;
        const paidTips = matchesList.filter((m: any) => m.matchType === 'paid').length;
        const vipTips = matchesList.filter((m: any) => m.matchType === 'vip').length;

        // Calculate win rate from history
        const historyMatches = matchesList.filter((m: any) => m.result);
        const wins = historyMatches.filter((m: any) => m.result === 'win').length;
        const winRate = historyMatches.length > 0 ? Math.round((wins / historyMatches.length) * 100) : 0;

        return NextResponse.json({
            totalLeagues,
            totalMatches,
            freeTips,
            paidTips,
            vipTips,
            winRate,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('[API Stats] Error:', error);
        return NextResponse.json({
            totalLeagues: 0,
            totalMatches: 0,
            freeTips: 0,
            paidTips: 0,
            vipTips: 0,
            winRate: 0,
            lastUpdated: new Date().toISOString()
        });
    }
}

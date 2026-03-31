import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

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

        // Fetch matches and leagues from Convex
        const [matches, leagues] = await Promise.all([
            convex.query(api.matches.getAll, { limit: 1000 }),
            convex.query(api.matches.getAllLeagues)
        ]);

        const matchesList = matches || [];
        const leaguesList = leagues || [];

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

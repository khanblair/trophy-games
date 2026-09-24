import { NextResponse } from 'next/server';
import { fetchFootyStatsMatchStats } from '@/lib/footystats';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

export const dynamic = 'force-dynamic';

const FALLBACK_CONVEX_URL = 'https://grateful-eel-253.eu-west-1.convex.cloud';

function getConvex() {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL || FALLBACK_CONVEX_URL;
    return new ConvexHttpClient(url);
}

// Rich per-match details (form, H2H, corners, detailed odds, standings, logos)
// come from the proxy /match-stats endpoint on demand. Runs server-side, so the
// HTTP (cleartext) call is fine.
// After fetching, we write the rich data back to Convex so mobile can read it
// without calling the FootyStats API directly.
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    try {
        const convex = getConvex();

        // For manual matches, return data from Convex directly
        if (id.startsWith('manual-')) {
            const match = await convex.query(api.matches.getById, { matchId: id });
            if (!match) {
                return NextResponse.json({ error: 'Match not found' }, { status: 404 });
            }
            return NextResponse.json({
                id: match.id,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                league: match.league,
                timestamp: match.timestamp,
                status: match.status,
                score: match.score,
                homeScore: match.homeScore,
                awayScore: match.awayScore,
                odds: match.odds,
                aiPrediction: match.aiPrediction,
                homeTeamLogo: match.homeTeamLogo,
                awayTeamLogo: match.awayTeamLogo,
                leagueLogo: match.leagueLogo,
                countryFlag: match.countryFlag,
                matchType: match.matchType,
                isTrending: match.isTrending,
            });
        }

        const stats = await fetchFootyStatsMatchStats(id);

        // Write rich data back to Convex so mobile can access it
        if (convex) {
            try {
                // Extract only the rich fields we want to store
                const enrichData = {
                    homeForm: stats.homeForm,
                    awayForm: stats.awayForm,
                    homeCorners: stats.homeCorners,
                    awayCorners: stats.awayCorners,
                    htHomeScore: stats.htHomeScore,
                    htAwayScore: stats.htAwayScore,
                    homeXg: stats.homeXg,
                    awayXg: stats.awayXg,
                    stadium: stats.stadium,
                    attendance: stats.attendance,
                    tvStations: stats.tvStations,
                    preview: stats.preview,
                    potentials: stats.potentials,
                    stats: stats.stats,
                    goals: stats.goals,
                    homeLineup: stats.homeLineup,
                    awayLineup: stats.awayLineup,
                    oddsComparison: stats.oddsComparison,
                    h2h: stats.h2h,
                    detailedOdds: stats.detailedOdds,
                    homeStanding: stats.homeStanding,
                    awayStanding: stats.awayStanding,
                    homeTeamLogo: stats.homeTeamLogo,
                    awayTeamLogo: stats.awayTeamLogo,
                    leagueLogo: stats.leagueLogo,
                    countryFlag: stats.countryFlag,
                    referee: stats.referee,
                    weather: stats.weather,
                };
                await convex.mutation(api.matches.enrichMatch, { matchId: id, data: enrichData });
                console.log(`[Match Stats API] Enriched match ${id} in Convex`);
            } catch (enrichError) {
                console.warn(`[Match Stats API] Failed to enrich match ${id} in Convex:`, enrichError);
                // Non-fatal: still return the stats to the web client
            }
        }

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[Match Stats API] Failed:', error);
        return NextResponse.json({ error: 'Failed to fetch match stats' }, { status: 500 });
    }
}

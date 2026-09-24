import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

export const dynamic = 'force-dynamic';

const FALLBACK_CONVEX_URL = 'https://grateful-eel-253.eu-west-1.convex.cloud';

function getConvex() {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL || FALLBACK_CONVEX_URL;
    return new ConvexHttpClient(url);
}

// GET — Returns matches from Convex (single source of truth).
export async function GET() {
    const convex = getConvex();

    try {
        const matches = await convex.query(api.matches.getAll, { limit: 1000 });
        return NextResponse.json(matches);
    } catch (error) {
        console.error('[Admin Matches API] Failed to fetch matches:', error);
        return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
}

// POST — Manually create a match from the admin dashboard.
export async function POST(req: Request) {
    const convex = getConvex();

    try {
        const body = await req.json();

        const {
            homeTeam, awayTeam, league, timestamp, status,
            matchType, homeOdds, drawOdds, awayOdds,
            leagueLogo, homeTeamLogo, awayTeamLogo, country, countryFlag,
            isTrending, score, homeScore, awayScore,
            prediction, confidence, suggestedBet, reasoning,
        } = body;

        if (!homeTeam || !awayTeam || !league || !timestamp) {
            return NextResponse.json(
                { error: 'homeTeam, awayTeam, league, and timestamp are required' },
                { status: 400 }
            );
        }

        const matchId = `manual-${Date.now()}`;
        const odds = homeOdds ? {
            home: String(homeOdds),
            away: String(awayOdds || ''),
            draw: drawOdds ? String(drawOdds) : undefined,
        } : undefined;

        // Build AI prediction if any prediction fields provided
        const aiPrediction = prediction ? {
            prediction: String(prediction),
            confidence: Number(confidence) || 70,
            reasoning: reasoning
                ? (Array.isArray(reasoning) ? reasoning : String(reasoning).split('\n').filter(Boolean))
                : [],
            suggestedBet: suggestedBet ? String(suggestedBet) : undefined,
            generatedAt: new Date().toISOString(),
        } : undefined;

        await convex.mutation(api.matches.create, {
            match: {
                id: matchId,
                homeTeam: String(homeTeam),
                awayTeam: String(awayTeam),
                league: String(league),
                timestamp: String(timestamp),
                status: String(status || 'Scheduled'),
                score: score || '0-0',
                homeScore: homeScore != null ? Number(homeScore) : undefined,
                awayScore: awayScore != null ? Number(awayScore) : undefined,
                matchType: matchType || 'unassigned',
                leagueLogo: leagueLogo || undefined,
                homeTeamLogo: homeTeamLogo || undefined,
                awayTeamLogo: awayTeamLogo || undefined,
                country: country || undefined,
                countryFlag: countryFlag || undefined,
                isTrending: isTrending === true,
                odds,
                aiPrediction,
            },
        });

        return NextResponse.json({ success: true, matchId });
    } catch (error) {
        console.error('[Admin Matches API] Failed to create match:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to create match',
        }, { status: 500 });
    }
}

// DELETE — Delete a manual match.
export async function DELETE(req: Request) {
    const convex = getConvex();

    try {
        const { searchParams } = new URL(req.url);
        const matchId = searchParams.get('id');

        if (!matchId) {
            return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        }

        await convex.mutation(api.matches.deleteMatch, { matchId });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Admin Matches API] Failed to delete match:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to delete match',
        }, { status: 500 });
    }
}

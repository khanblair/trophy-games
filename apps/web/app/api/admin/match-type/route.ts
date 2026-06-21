import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// POST - Tag a proxy match as free/paid/vip. The match is upserted into Convex
// (it originates from the FootyStats proxy), so the mobile paid/vip tabs pick it up.
export async function POST(req: Request) {
    if (!convex) {
        return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
    }

    try {
        const { matchId, matchType, match } = await req.json();

        if (!matchId || !matchType) {
            return NextResponse.json({ error: 'Missing required fields: matchId, matchType' }, { status: 400 });
        }

        await convex.mutation(api.matches.updateMatchType, {
            matchId,
            matchType,
            match: match ? sanitizeMatch(match) : undefined,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Match Type API] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to update match type',
        }, { status: 500 });
    }
}

// Keep only the fields the Convex proxyMatchInput validator accepts.
function sanitizeMatch(m: any) {
    return {
        id: String(m.id),
        league: String(m.league ?? ''),
        leagueId: m.leagueId,
        leagueLogo: m.leagueLogo,
        homeTeam: String(m.homeTeam ?? ''),
        homeTeamId: m.homeTeamId,
        homeTeamLogo: m.homeTeamLogo,
        awayTeam: String(m.awayTeam ?? ''),
        awayTeamId: m.awayTeamId,
        awayTeamLogo: m.awayTeamLogo,
        country: m.country,
        countryFlag: m.countryFlag,
        timestamp: String(m.timestamp ?? new Date().toISOString()),
        status: String(m.status ?? 'Scheduled'),
        score: m.score,
        homeScore: typeof m.homeScore === 'number' ? m.homeScore : undefined,
        awayScore: typeof m.awayScore === 'number' ? m.awayScore : undefined,
        matchType: m.matchType,
        isTrending: m.isTrending,
        odds: m.odds && m.odds.home ? {
            home: String(m.odds.home),
            away: String(m.odds.away ?? ''),
            draw: m.odds.draw != null ? String(m.odds.draw) : undefined,
        } : undefined,
    };
}

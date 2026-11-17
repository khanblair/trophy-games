import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

export const dynamic = 'force-dynamic';

const FALLBACK_CONVEX_URL = 'https://grateful-eel-253.eu-west-1.convex.cloud';

const MATCH_TYPES = ['unassigned', 'free', 'paid', 'vip'] as const;
type MatchType = (typeof MATCH_TYPES)[number];

const MATCH_RESULTS = ['pending', 'win', 'lose', 'draw'] as const;
type MatchResult = (typeof MATCH_RESULTS)[number];

function getConvex() {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL || FALLBACK_CONVEX_URL;
    return new ConvexHttpClient(url);
}

function readString(value: unknown): string {
    if (value === null || value === undefined) return '';
    return typeof value === 'string' ? value : String(value);
}

function readOptionalString(value: unknown): string | undefined {
    const text = readString(value).trim();
    return text || undefined;
}

function readReasoning(value: unknown): string[] | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    if (Array.isArray(value)) {
        return value.filter((item: unknown): item is string => typeof item === 'string');
    }
    return readString(value).split('\n').map(line => line.trim()).filter(Boolean);
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

// PUT — Edit an existing match from the admin dashboard. This is the only
// write path the admin match form uses for updates; it forwards to the
// validated Convex `matches.update` mutation.
export async function PUT(req: Request) {
    const convex = getConvex();

    try {
        const body: unknown = await req.json();
        if (typeof body !== 'object' || body === null) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const payload = body as Record<string, unknown>;

        const matchId = readString(payload.matchId).trim();
        const homeTeam = readString(payload.homeTeam).trim();
        const awayTeam = readString(payload.awayTeam).trim();
        const league = readString(payload.league).trim();
        const timestamp = readString(payload.timestamp).trim();

        if (!matchId || !homeTeam || !awayTeam || !league || !timestamp) {
            return NextResponse.json(
                { error: 'matchId, homeTeam, awayTeam, league, and timestamp are required' },
                { status: 400 }
            );
        }

        const matchTypeValue = readString(payload.matchType) || 'unassigned';
        const matchType: MatchType = MATCH_TYPES.find(type => type === matchTypeValue) ?? 'unassigned';

        const resultValue = readString(payload.result) || 'pending';
        const result: MatchResult = MATCH_RESULTS.find(option => option === resultValue) ?? 'pending';

        const confidenceValue = payload.confidence;
        const confidence = confidenceValue === undefined || confidenceValue === null || confidenceValue === ''
            ? undefined
            : Number(confidenceValue);
        if (confidence !== undefined && (!Number.isFinite(confidence) || confidence < 1 || confidence > 100)) {
            return NextResponse.json(
                { error: 'confidence must be between 1 and 100' },
                { status: 400 }
            );
        }

        const homeOdds = readOptionalString(payload.homeOdds);
        const drawOdds = readOptionalString(payload.drawOdds);
        const awayOdds = readOptionalString(payload.awayOdds);
        const odds = homeOdds || drawOdds || awayOdds
            ? { home: homeOdds || '', away: awayOdds || '', draw: drawOdds }
            : undefined;

        const prediction = readOptionalString(payload.prediction);
        const suggestedBet = readOptionalString(payload.suggestedBet);
        const reasoning = readReasoning(payload.reasoning);
        const aiPrediction = prediction || suggestedBet || (reasoning && reasoning.length > 0)
            ? {
                prediction: prediction || '',
                confidence: confidence ?? 70,
                reasoning: reasoning ?? [],
                suggestedBet,
                generatedAt: new Date().toISOString(),
            }
            : undefined;

        await convex.mutation(api.matches.update, {
            matchId,
            updates: {
                homeTeam,
                awayTeam,
                league,
                country: readOptionalString(payload.country),
                timestamp,
                matchType,
                isTrending: payload.isTrending === true,
                odds,
                aiPrediction,
                result,
            },
        });

        return NextResponse.json({ success: true, matchId });
    } catch (error) {
        console.error('[Admin Matches API] Failed to update match:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to update match',
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

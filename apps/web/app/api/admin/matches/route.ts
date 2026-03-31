import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";
import { MatchData } from '@trophy-games/shared';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// GET - Fetch all matches
export async function GET() {
    if (!convex) {
        return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
    }

    try {
        const matches = await convex.query(api.matches.getAll, { limit: 500 });
        return NextResponse.json(matches);
    } catch (error) {
        console.error('[Admin Matches API] Failed to fetch matches:', error);
        return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
}

// POST - Create a new match
export async function POST(req: Request) {
    if (!convex) {
        return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { match } = body;

        if (!match || !match.id || !match.league || !match.homeTeam || !match.awayTeam || !match.timestamp) {
            return NextResponse.json({ 
                error: 'Missing required fields: id, league, homeTeam, awayTeam, timestamp' 
            }, { status: 400 });
        }

        const matchId = await convex.mutation(api.matches.create, { match });
        return NextResponse.json({ success: true, matchId });
    } catch (error) {
        console.error('[Admin Matches API] Failed to create match:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to create match' 
        }, { status: 500 });
    }
}

// PUT - Update an existing match
export async function PUT(req: Request) {
    if (!convex) {
        return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { matchId, updates } = body;

        if (!matchId || !updates) {
            return NextResponse.json({ 
                error: 'Missing required fields: matchId, updates' 
            }, { status: 400 });
        }

        await convex.mutation(api.matches.update, { matchId, updates });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Admin Matches API] Failed to update match:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to update match' 
        }, { status: 500 });
    }
}

// DELETE - Delete a match
export async function DELETE(req: Request) {
    if (!convex) {
        return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const matchId = searchParams.get('matchId');

        if (!matchId) {
            return NextResponse.json({ error: 'Missing matchId parameter' }, { status: 400 });
        }

        await convex.mutation(api.matches.deleteMatch, { matchId });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Admin Matches API] Failed to delete match:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to delete match' 
        }, { status: 500 });
    }
}

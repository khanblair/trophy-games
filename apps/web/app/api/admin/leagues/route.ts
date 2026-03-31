import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// GET - Fetch all leagues
export async function GET() {
    if (!convex) {
        return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
    }

    try {
        const leagues = await convex.query(api.matches.getAllLeagues);
        return NextResponse.json(leagues);
    } catch (error) {
        console.error('[Admin Leagues API] Failed to fetch leagues:', error);
        return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 });
    }
}

// POST - Create a new league
export async function POST(req: Request) {
    if (!convex) {
        return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { league } = body;

        if (!league || !league.name || !league.country) {
            return NextResponse.json({ 
                error: 'Missing required fields: name, country' 
            }, { status: 400 });
        }

        // Generate a unique ID for the league
        const leagueId = Date.now();
        
        const newLeague = {
            id: leagueId,
            name: league.name,
            country: league.country,
            type: league.type || 'league',
            logo: league.logo || '',
            url: '',
            matchCount: 0,
        };

        // Use the saveAll mutation to insert the league
        await convex.mutation(api.matches.saveAll, {
            matches: [],
            leagues: [newLeague]
        });

        return NextResponse.json({ success: true, leagueId });
    } catch (error) {
        console.error('[Admin Leagues API] Failed to create league:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to create league' 
        }, { status: 500 });
    }
}

// DELETE - Delete a league
export async function DELETE(req: Request) {
    if (!convex) {
        return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        }

        // Get all leagues
        const leagues = await convex.query(api.matches.getAllLeagues);
        const league = leagues.find((l: any) => l.id === parseInt(id));

        if (!league) {
            return NextResponse.json({ error: 'League not found' }, { status: 404 });
        }

        // Delete the league using internal Convex ID
        await convex.mutation(api.matches.deleteLeague, { leagueId: parseInt(id) });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Admin Leagues API] Failed to delete league:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to delete league' 
        }, { status: 500 });
    }
}

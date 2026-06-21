import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";
import { MatchData } from '@trophy-games/shared';
import { fetchFootyStatsMatches, mergeWithConvexData } from '@/lib/footystats';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// GET - Matches come from the FootyStats proxy (same source as the mobile app).
// Convex is used only as an overlay for AI predictions and match-type tags.
export async function GET() {
    try {
        const footyMatches = await fetchFootyStatsMatches();
        console.log(`[Admin Matches API] Loaded ${footyMatches.length} matches from FootyStats`);

        if (!convex) {
            return NextResponse.json(footyMatches);
        }

        // Overlay AI predictions / match types stored in Convex.
        const convexMatches = await convex.query(api.matches.getAll, { limit: 1000 });
        const merged = mergeWithConvexData(footyMatches, convexMatches as MatchData[]);
        return NextResponse.json(merged);
    } catch (footyError) {
        console.error('[Admin Matches API] FootyStats failed:', footyError);
        return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// GET — Returns matches from Convex (single source of truth).
// The background sync job (/.github/workflows/sync.yml) fetches FootyStats
// data every 5 minutes and upserts it into Convex. This endpoint reads
// from Convex so web and mobile always see the same data.
export async function GET() {
    if (!convex) {
        return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
    }

    try {
        const matches = await convex.query(api.matches.getAll, { limit: 1000 });
        return NextResponse.json(matches);
    } catch (error) {
        console.error('[Admin Matches API] Failed to fetch matches:', error);
        return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
}

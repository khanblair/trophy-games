import { NextResponse } from 'next/server';
import { getSyncStatus } from '@/lib/storage';

export async function GET() {
    try {
        const status = await getSyncStatus();
        
        return NextResponse.json({
            oddsMatches: status.oddsMatches,
            liveMatches: status.liveMatches,
            lastOddsSync: status.lastOddsSync,
            lastLiveSync: status.lastLiveSync,
            sources: {
                'odds-api': {
                    name: 'The Odds API',
                    description: 'Pre-match odds for European leagues',
                    matches: status.oddsMatches
                },
                'goaloo-live': {
                    name: 'Goaloo Live',
                    description: 'Live scores and in-play matches',
                    matches: status.liveMatches
                }
            }
        });
    } catch (error) {
        console.error('[API] Fetch sync status failed:', error);
        return NextResponse.json({ error: 'Failed to load sync status' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { fetchAllOdds } from '@/lib/odds-api';
import { fetchLiveMatches } from '@/lib/goaloo-live';
import { saveOddsData, saveLiveData, getSyncStatus } from '@/lib/storage';

export const runtime = 'nodejs';
export const maxDuration = 60; // Extend for longer syncs on Vercel

interface SyncTask {
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastOddsSync: string | null;
  lastLiveSync: string | null;
  oddsMatchesCount: number;
  liveMatchesCount: number;
  error: string | null;
}

const currentTask: SyncTask = {
  status: 'idle',
  lastOddsSync: null,
  lastLiveSync: null,
  oddsMatchesCount: 0,
  liveMatchesCount: 0,
  error: null,
};

async function syncOddsData() {
  console.log('[Sync] ⏳ Starting odds sync from The Odds API...');
  try {
    const { matches, leagues, requestsRemaining } = await fetchAllOdds();
    console.log('[Sync] ✅ Fetched', matches.length, 'matches from Odds API');

    await saveOddsData(matches, leagues);
    console.log('[Sync] ✅ Saved', matches.length, 'matches to Convex');

    currentTask.oddsMatchesCount = matches.length;
    currentTask.lastOddsSync = new Date().toISOString();

    console.log(`[Sync] ✅ Odds sync complete. API remaining: ${requestsRemaining}`);
  } catch (error) {
    console.error('[Sync] ❌ Odds sync failed:', error);
    throw error;
  }
}

async function syncLiveData() {
  console.log('[Sync] ⏳ Starting live sync from Goaloo...');
  try {
    const liveMatches = await fetchLiveMatches();
    console.log('[Sync] ✅ Fetched', liveMatches.length, 'live matches from Goaloo');

    await saveLiveData(liveMatches);
    console.log('[Sync] ✅ Saved', liveMatches.length, 'live matches to Convex');

    currentTask.liveMatchesCount = liveMatches.length;
    currentTask.lastLiveSync = new Date().toISOString();

    console.log('[Sync] ✅ Live sync complete');
  } catch (error) {
    console.error('[Sync] ❌ Live sync failed:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cronSecret = process.env.CRON_SECRET;
  const referer = req.headers.get('referer');
  const origin = req.headers.get('origin');

  // Allow if requested from same origin (web app dashboard)
  const isSameOrigin = referer && origin && referer.startsWith(origin);

  if (isProduction && !isSameOrigin) {
    const providedSecret = req.headers.get('x-cron-secret');
    if (!cronSecret || providedSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  const { action } = await req.json();

  if (action === 'sync_odds') {
    if (currentTask.status === 'running') {
      return NextResponse.json({ error: 'Sync already running' }, { status: 400 });
    }

    currentTask.status = 'running';
    currentTask.error = null;

    (async () => {
      try {
        await syncOddsData();
        currentTask.status = 'completed';
      } catch (error) {
        console.error('[Sync] Odds sync failed:', error);
        currentTask.error = error instanceof Error ? error.message : 'Unknown error';
        currentTask.status = 'failed';
      }
    })();

    return NextResponse.json({ message: 'Odds sync started' });
  }

  if (action === 'sync_live') {
    if (currentTask.status === 'running') {
      return NextResponse.json({ error: 'Sync already running' }, { status: 400 });
    }

    currentTask.status = 'running';
    currentTask.error = null;

    (async () => {
      try {
        await syncLiveData();
        currentTask.status = 'completed';
      } catch (error) {
        console.error('[Sync] Live sync failed:', error);
        currentTask.error = error instanceof Error ? error.message : 'Unknown error';
        currentTask.status = 'failed';
      }
    })();

    return NextResponse.json({ message: 'Live sync started' });
  }

  if (action === 'sync_all') {
    if (currentTask.status === 'running') {
      return NextResponse.json({ error: 'Sync already running' }, { status: 400 });
    }

    currentTask.status = 'running';
    currentTask.error = null;

    (async () => {
      try {
        await syncOddsData();
        await syncLiveData();
        currentTask.status = 'completed';
      } catch (error) {
        console.error('[Sync] Full sync failed:', error);
        currentTask.error = error instanceof Error ? error.message : 'Unknown error';
        currentTask.status = 'failed';
      }
    })();

    return NextResponse.json({ message: 'Full sync started' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function GET() {
  const syncStatus = await getSyncStatus();

  return NextResponse.json({
    status: currentTask.status,
    oddsMatchesCount: syncStatus.oddsMatches,
    liveMatchesCount: syncStatus.liveMatches,
    lastOddsSync: currentTask.lastOddsSync,
    lastLiveSync: currentTask.lastLiveSync,
    error: currentTask.error,
    isProduction: process.env.NODE_ENV === 'production',
  });
}

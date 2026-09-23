import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

export async function POST(req: Request) {
  if (!convex) {
    return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const league = String(body.league ?? '').trim();
    const homeTeam = String(body.homeTeam ?? '').trim();
    const awayTeam = String(body.awayTeam ?? '').trim();
    const date = String(body.date ?? '').trim();
    const time = String(body.time ?? '18:00').trim();

    if (!league || !homeTeam || !awayTeam || !date) {
      return NextResponse.json(
        { error: 'League, home team, away team, and date are required.' },
        { status: 400 },
      );
    }

    const timestamp = new Date(`${date}T${time}:00`).toISOString();
    const matchType = ['free', 'paid', 'vip', 'unassigned'].includes(body.matchType)
      ? body.matchType
      : 'unassigned';

    const match = {
      id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      league,
      homeTeam,
      awayTeam,
      country: body.country ? String(body.country).trim() : undefined,
      timestamp,
      status: body.status || 'Scheduled',
      score: '0-0',
      matchType,
      isTrending: Boolean(body.isTrending),
      odds: {
        home: String(body.odds?.home ?? ''),
        away: String(body.odds?.away ?? ''),
        draw: body.odds?.draw ? String(body.odds.draw) : undefined,
      },
    };

    await convex.mutation(api.matches.create, { match });
    return NextResponse.json({ success: true, match }, { status: 201 });
  } catch (error) {
    console.error('[Admin Manual Match API] Failed to create match:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create match' },
      { status: 500 },
    );
  }
}

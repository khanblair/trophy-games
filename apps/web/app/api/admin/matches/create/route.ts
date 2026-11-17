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
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A JSON object is required.' }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const league = String(input.league ?? '').trim();
    const homeTeam = String(input.homeTeam ?? '').trim();
    const awayTeam = String(input.awayTeam ?? '').trim();
    const date = String(input.date ?? '').trim();
    const time = String(input.time ?? '18:00').trim();

    if (!league || !homeTeam || !awayTeam || !date) {
      return NextResponse.json(
        { error: 'League, home team, away team, and date are required.' },
        { status: 400 },
      );
    }

    // Require canonical date/time input and reject rollover dates such as Feb 31.
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
    if (!dateMatch || !timeMatch) {
      return NextResponse.json({ error: 'A valid date and kickoff time are required.' }, { status: 400 });
    }

    const [, year, month, day] = dateMatch;
    const [, hours, minutes] = timeMatch;
    const dateCheck = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (
      dateCheck.getUTCFullYear() !== Number(year) ||
      dateCheck.getUTCMonth() !== Number(month) - 1 ||
      dateCheck.getUTCDate() !== Number(day) ||
      Number(hours) > 23 ||
      Number(minutes) > 59
    ) {
      return NextResponse.json({ error: 'A valid date and kickoff time are required.' }, { status: 400 });
    }

    const timestampDate = new Date(`${date}T${time}:00`);
    const rawOdds = input.odds && typeof input.odds === 'object' && !Array.isArray(input.odds)
      ? input.odds as Record<string, unknown>
      : {};
    const matchType = ['free', 'paid', 'vip', 'unassigned'].includes(String(input.matchType))
      ? input.matchType as 'free' | 'paid' | 'vip' | 'unassigned'
      : 'unassigned';

    const match = {
      // Match-detail API detects manual IDs using the `manual-` prefix.
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      league,
      homeTeam,
      awayTeam,
      country: input.country ? String(input.country).trim() : undefined,
      timestamp: timestampDate.toISOString(),
      status: input.status ? String(input.status) : 'Scheduled',
      score: '0-0',
      matchType,
      isTrending: input.isTrending === true,
      odds: {
        home: String(rawOdds.home ?? ''),
        away: String(rawOdds.away ?? ''),
        draw: rawOdds.draw ? String(rawOdds.draw) : undefined,
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

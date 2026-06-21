import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// GET /api/analysis?date=YYYY-MM-DD - Get analysis for a specific date
export async function GET(req: Request) {
  if (!convex) {
    return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
    }

    const result = await convex.query(api.analysis.getByDate, { date });
    return NextResponse.json(result || { notFound: true });
  } catch (error: any) {
    console.error('[Analysis API] Get failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch analysis' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// GET /api/analysis/history - Get all analysis results
export async function GET() {
  if (!convex) {
    return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
  }

  try {
    const results = await convex.query(api.analysis.getAll, { limit: 50 });
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[Analysis API] History failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch history' }, { status: 500 });
  }
}

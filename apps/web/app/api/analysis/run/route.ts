import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// POST /api/analysis/run - Trigger DeepSeek analysis
export async function POST(req: Request) {
  if (!convex) {
    return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { date, analysisType } = body;

    if (!date || !analysisType) {
      return NextResponse.json({ error: 'Missing date or analysisType' }, { status: 400 });
    }

    const result = await convex.action(api.analysis.runAnalysis, { date, analysisType });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Analysis API] Run failed:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}

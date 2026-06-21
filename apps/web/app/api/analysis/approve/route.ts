import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@trophy-games/backend";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// POST /api/analysis/approve - Approve analysis and apply match types
export async function POST(req: Request) {
  if (!convex) {
    return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { resultId, selectedMatchIds, approveFree, approvePaid, approveVip } = body;

    if (!resultId) {
      return NextResponse.json({ error: 'Missing resultId' }, { status: 400 });
    }

    const result = await convex.mutation(api.analysis.approveAnalysis, {
      resultId,
      approvedBy: 'admin',
      selectedMatchIds,
      approveFree,
      approvePaid,
      approveVip,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Analysis API] Approve failed:', error);
    return NextResponse.json({ error: error.message || 'Approval failed' }, { status: 500 });
  }
}

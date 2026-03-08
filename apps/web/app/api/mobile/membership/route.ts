import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Check membership status
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');
        const type = searchParams.get('type') as 'vip' | 'paid' | null;

        if (!deviceId || !type) {
            return NextResponse.json({ error: 'deviceId and type required' }, { status: 400 });
        }

        const status = await convex.query(api.tokens.getMembershipStatus, { deviceId, type });
        return NextResponse.json(status);
    } catch (error) {
        console.error('[API] Membership status failed:', error);
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
    }
}

// Submit membership request
export async function POST(request: Request) {
    try {
        const { deviceId, type } = await request.json();

        if (!deviceId || !type) {
            return NextResponse.json({ error: 'deviceId and type required' }, { status: 400 });
        }

        const result = await convex.mutation(api.tokens.requestMembership, { deviceId, type });
        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] Request membership failed:', error);
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }
}

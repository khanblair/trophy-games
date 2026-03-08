import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
    try {
        const { token, deviceId } = await request.json();

        if (!token || !deviceId) {
            return NextResponse.json({ error: 'token and deviceId required' }, { status: 400 });
        }

        const result = await convex.query(api.tokens.verifyToken, { token, deviceId });
        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] Verify token failed:', error);
        return NextResponse.json({ error: 'Failed to verify token' }, { status: 500 });
    }
}

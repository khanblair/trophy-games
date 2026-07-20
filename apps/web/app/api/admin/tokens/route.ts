import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

export const dynamic = 'force-dynamic';

function getConvex() {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    return url ? new ConvexHttpClient(url) : null;
}

function generateToken(type: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const prefix = type === 'vip' ? 'VIP' : 'PAD';
    let token = prefix + '-';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
        if (i < 3) token += '-';
    }
    return token;
}

export async function GET() {
    try {
        const convex = getConvex();
        if (!convex) return NextResponse.json([]);
        const tokens = await convex.query(api.tokens.getAllTokens, {});
        return NextResponse.json(tokens);
    } catch (error) {
        console.error('[API] Get tokens failed:', error);
        return NextResponse.json({ error: 'Failed to load tokens' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const convex = getConvex();
        if (!convex) return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
        const { deviceId, username, type, matchId, expiresAt } = await request.json();

        if (!deviceId || !type) {
            return NextResponse.json({ error: 'deviceId and type required' }, { status: 400 });
        }

        const token = generateToken(type);

        await convex.mutation(api.tokens.createToken, {
            token,
            deviceId,
            username,
            type,
            matchId,
            expiresAt,
        });

        return NextResponse.json({ success: true, token });
    } catch (error) {
        console.error('[API] Create token failed:', error);
        return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const convex = getConvex();
        if (!convex) return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
        const { token } = await request.json();
        await convex.mutation(api.tokens.revokeToken, { token });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Revoke token failed:', error);
        return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const convex = getConvex();
        if (!convex) return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
        const { token } = await request.json();
        await convex.mutation(api.tokens.reactivateToken, { token });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Reactivate token failed:', error);
        return NextResponse.json({ error: 'Failed to reactivate token' }, { status: 500 });
    }
}

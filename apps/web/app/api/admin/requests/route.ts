import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
        const requests = await convex.query(api.tokens.getAllRequests, {});
        return NextResponse.json(requests);
    } catch (error) {
        console.error('[API] Get requests failed:', error);
        return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { requestId, action, matchId, expiresAt, notes } = await request.json();

        if (!requestId || !action) {
            return NextResponse.json({ error: 'requestId and action required' }, { status: 400 });
        }

        if (action === 'approve') {
            // Get the request to know the type
            const allRequests = await convex.query(api.tokens.getAllRequests, {});
            const req = allRequests.find((r: any) => r._id === requestId);
            if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

            const token = generateToken(req.type);
            await convex.mutation(api.tokens.approveMembershipRequest, {
                requestId,
                token,
                matchId,
                expiresAt,
            });
            return NextResponse.json({ success: true, token });
        }

        if (action === 'reject') {
            await convex.mutation(api.tokens.rejectMembershipRequest, {
                requestId,
                notes,
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('[API] Handle request failed:', error);
        return NextResponse.json({ error: 'Failed to handle request' }, { status: 500 });
    }
}

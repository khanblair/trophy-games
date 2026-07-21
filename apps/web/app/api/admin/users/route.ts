import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

export const dynamic = 'force-dynamic';

function getConvex() {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    return url ? new ConvexHttpClient(url) : null;
}

export async function GET() {
    try {
        const convex = getConvex();
        if (!convex) return NextResponse.json([]);
        const users = await convex.query(api.users.getAllUsers, {});
        return NextResponse.json(users);
    } catch (error) {
        console.error('[API] Get users failed:', error);
        return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const convex = getConvex();
        if (!convex) return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
        const { username, action } = await request.json();

        if (!username || !action) {
            return NextResponse.json({ error: 'username and action required' }, { status: 400 });
        }

        if (action === 'block') {
            await convex.mutation(api.users.blockUser, { username });
            return NextResponse.json({ success: true });
        }

        if (action === 'unblock') {
            await convex.mutation(api.users.unblockUser, { username });
            return NextResponse.json({ success: true });
        }

        if (action === 'clear_attempts') {
            await convex.mutation(api.users.clearFailedAttempts, { username });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('[API] Handle user action failed:', error);
        return NextResponse.json({ error: 'Failed to handle user action' }, { status: 500 });
    }
}

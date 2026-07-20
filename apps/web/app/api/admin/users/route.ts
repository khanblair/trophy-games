import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@trophy-games/backend';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
    try {
        const users = await convex.query(api.users.getAllUsers, {});
        return NextResponse.json(users);
    } catch (error) {
        console.error('[API] Get users failed:', error);
        return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
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

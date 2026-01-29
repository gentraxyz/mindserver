import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getUserInfo } from '@/lib/gentra';
import { createSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    console.log('HIT: /api/auth/callback', request.url);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error: 'Auth error from provider', details: error }, { status: 400 });
    }

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state params' }, { status: 400 });
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    console.log('Callback State Check:', { received: state, stored: storedState });

    // TEMPORARY: Relax state check for debugging if needed, but keeping strict for now
    if (!storedState || state !== storedState) {
        console.error('State mismatch error');
        return NextResponse.json({
            error: 'State mismatch',
            details: { received: state, stored: storedState || 'null' }
        }, { status: 400 });
    }

    // Clean up state cookie
    cookieStore.delete('oauth_state');

    try {
        console.log('Exchanging code for token...');
        const token = await exchangeCodeForToken(code);
        console.log('Token received, fetching user info...');
        const user = await getUserInfo(token);
        console.log('User info received:', user);

        await createSession(user);
        console.log('Session created, redirecting to dashboard...');

        return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (err: any) {
        console.error('Auth error detailed:', err);
        return NextResponse.json({
            error: 'Authentication failed',
            message: err.message,
            stack: err.stack
        }, { status: 500 });
    }
}

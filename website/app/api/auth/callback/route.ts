import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getUserInfo } from '@/lib/gentra';
import { createSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/?error=access_denied', request.url));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL('/?error=missing_params', request.url));
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    if (!storedState || state !== storedState) {
        return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
    }

    // Clean up state cookie
    cookieStore.delete('oauth_state');

    try {
        const token = await exchangeCodeForToken(code);
        const user = await getUserInfo(token);

        await createSession(user);

        return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (err) {
        console.error('Auth error:', err);
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }
}

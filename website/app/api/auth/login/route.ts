import { redirect } from 'next/navigation';
import { getAuthUrl } from '@/lib/gentra';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

export async function GET() {
    // Generate a random state for CSRF protection
    const state = randomBytes(16).toString('hex');

    // Store state in cookie for verification in callback
    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
    });

    const url = getAuthUrl(state);
    return redirect(url);
}

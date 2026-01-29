import { config } from '../config';

export interface GoogleUser {
    sub: string;
    name: string;
    given_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
}

export function getAuthUrl(state: string) {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.google.clientId,
        redirect_uri: config.google.redirectUri,
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
        state,
    });
    return `${config.google.authUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
    const params = new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.redirectUri,
        grant_type: 'authorization_code',
    });

    const res = await fetch(config.google.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
    });

    const data = await res.json();

    if (!res.ok) {
        console.error('Google token exchange failed:', data);
        throw new Error(data.error_description || data.error || 'Failed to exchange code with Google');
    }

    return data.access_token;
}

export async function getUserInfo(token: string): Promise<GoogleUser> {
    const res = await fetch(config.google.userInfoUrl, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error_description || data.error || 'Failed to get user info from Google');
    }

    return data;
}

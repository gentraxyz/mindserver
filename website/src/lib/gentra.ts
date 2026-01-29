import { config } from '../config';

export interface GentraUser {
    username: string;
    display_name: string;
    profile_image_url: string | null;
}

export function getAuthUrl(state: string) {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.gentra.clientId,
        redirect_uri: config.gentra.redirectUri,
        state,
    });
    return `${config.gentra.authUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: config.gentra.clientId,
        client_secret: config.gentra.clientSecret,
        redirect_uri: config.gentra.redirectUri, // Note: Redirect URI might not be required by Gentra token endpoint, but good practice
    });

    const res = await fetch(config.gentra.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
    });

    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error('Failed to parse token response JSON:', text);
        throw new Error(`Invalid JSON response from Gentra: ${text.substring(0, 100)}...`);
    }

    if (!res.ok) {
        console.error('Token exchange failed:', {
            status: res.status,
            body: data,
            params: {
                // Don't log client_secret
                client_id: config.gentra.clientId,
                redirect_uri: config.gentra.redirectUri,
                code: 'REDACTED'
            }
        });
        throw new Error(data.error_description || data.error || 'Failed to exchange code');
    }

    return data.access_token;
}

export async function getUserInfo(token: string): Promise<GentraUser> {
    const res = await fetch(config.gentra.userInfoUrl, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error_description || data.error || 'Failed to get user info');
    }

    return data;
}

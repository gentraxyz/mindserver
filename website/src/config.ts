export const config = {
    gentra: {
        clientId: process.env.GENTRA_CLIENT_ID || '',
        clientSecret: process.env.GENTRA_CLIENT_SECRET || '',
        redirectUri: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback` : 'http://localhost:3000/api/auth/callback',
        authUrl: 'https://gentra.xyz/GentraID/Developers/authorize.php',
        tokenUrl: 'https://gentra.xyz/GentraID/Developers/token.php',
        userInfoUrl: 'https://gentra.xyz/GentraID/Developers/userinfo.php',
    },
    worker: {
        url: process.env.NEXT_PUBLIC_WORKER_URL || 'https://mindserver-worker.webmaster-e1c.workers.dev',
    },
    session: {
        secret: process.env.SESSION_SECRET || 'default-secret-change-me-in-prod',
    }
};

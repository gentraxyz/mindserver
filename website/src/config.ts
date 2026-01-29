export const config = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback` : 'http://localhost:3000/api/auth/callback',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    worker: {
        url: process.env.NEXT_PUBLIC_WORKER_URL || 'https://mindserver-worker.webmaster-e1c.workers.dev',
    },
    session: {
        secret: process.env.SESSION_SECRET || 'default-secret-change-me-in-prod',
    }
};

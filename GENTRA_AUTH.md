# GentraID Authentication Setup

MindServer now requires users to sign in with their Gentra account. Each user is limited to 3 tasks per day.

## Configuration

1. Register your application on the Gentra Developer Portal to obtain:
   - Client ID
   - Client Secret

2. Add the credentials to `keys.json`:
```json
{
  "GENTRA_CLIENT_ID": "your_client_id_here",
  "GENTRA_CLIENT_SECRET": "your_client_secret_here",
  "SESSION_SECRET": "a_random_secret_key_for_sessions"
}
```

3. When registering your application on Gentra, set the redirect URI to:
   - `http://localhost:8080/auth/gentra/callback` (for local development)
   - `https://yourdomain.com/auth/gentra/callback` (for production)

## Production Deployment

For production deployment with HTTPS:
- Set `NODE_ENV=production` environment variable to enable secure cookies
- Set `REDIRECT_URI=https://yourdomain.com` environment variable (without trailing slash)
- Ensure your application is served over HTTPS
- Update the redirect URI in Gentra to use `https://yourdomain.com/auth/gentra/callback`

Example production environment variables:
```bash
NODE_ENV=production
REDIRECT_URI=https://mindserver.example.com
```

## Features

- **OAuth 2.0 Authentication**: Secure login using Gentra's authorization flow
- **Task Limiting**: Each user can create 3 agents per day
- **Session Management**: User sessions persist across page refreshes
- **Profile Display**: Shows user's Gentra profile picture and display name
- **Task Counter**: Displays remaining tasks for the day

## How It Works

1. User clicks "Sign in with Gentra"
2. User is redirected to Gentra's authorization page
3. User approves the application
4. User is redirected back with an authorization code
5. Server exchanges code for access token
6. Server fetches user profile information
7. User session is created and user can access the app

## Endpoints

- `GET /auth/gentra` - Initiates OAuth flow
- `GET /auth/gentra/callback` - Handles OAuth callback
- `GET /auth/logout` - Logs out the user
- `GET /api/user` - Returns current user info and task usage

## Task Usage Tracking

The system tracks task usage per user per day:
- Counter resets at midnight UTC
- Tasks are incremented when creating a new agent
- Once limit is reached, users must wait until the next day

## Development

For local development without valid Gentra credentials, you can modify the authentication check in `mindserver.js`, but this is not recommended for production use.

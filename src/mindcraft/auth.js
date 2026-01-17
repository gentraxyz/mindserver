import axios from 'axios';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load GentraID credentials from keys.json
let gentraCredentials = { client_id: '', client_secret: '' };
try {
    const keysPath = path.join(__dirname, '..', '..', 'keys.json');
    const keys = JSON.parse(readFileSync(keysPath, 'utf8'));
    gentraCredentials.client_id = keys.GENTRA_CLIENT_ID || '';
    gentraCredentials.client_secret = keys.GENTRA_CLIENT_SECRET || '';
} catch (err) {
    console.warn('Could not load GentraID credentials from keys.json:', err.message);
}

// GentraID OAuth endpoints
const GENTRA_AUTH_URL = 'https://gentra.xyz/GentraID/Developers/authorize.php';
const GENTRA_TOKEN_URL = 'https://gentra.xyz/GentraID/Developers/token.php';
const GENTRA_USERINFO_URL = 'https://gentra.xyz/GentraID/Developers/userinfo.php';

// In-memory storage for user sessions and task usage
// WARNING: This in-memory storage is suitable for development and single-instance deployments only.
// For production deployments with multiple server instances or for data persistence across restarts,
// implement a proper storage solution such as:
// - Redis for distributed session storage
// - PostgreSQL/MySQL for persistent user and task tracking
// - MongoDB for flexible schema storage
const userSessions = new Map();
const taskUsage = new Map(); // { username: { date: 'YYYY-MM-DD', count: number } }

// Maximum tasks per day per user
const MAX_TASKS_PER_DAY = 3;

/**
 * Generate authorization URL for GentraID OAuth flow
 */
export function getAuthorizationUrl(redirectUri, state) {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: gentraCredentials.client_id,
        redirect_uri: redirectUri,
        state: state
    });
    return `${GENTRA_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code) {
    // Validate authorization code
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
        throw new Error('Invalid authorization code');
    }

    try {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code.trim(),
            client_id: gentraCredentials.client_id,
            client_secret: gentraCredentials.client_secret
        });

        const response = await axios.post(GENTRA_TOKEN_URL, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error exchanging code for token:', error.response?.data || error.message);
        throw new Error('Failed to exchange authorization code for token');
    }
}

/**
 * Get user info from GentraID using access token
 */
export async function getUserInfo(accessToken) {
    try {
        const response = await axios.get(GENTRA_USERINFO_URL, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error getting user info:', error.response?.data || error.message);
        throw new Error('Failed to get user info from GentraID');
    }
}

/**
 * Store user session
 */
export function createUserSession(sessionId, userData) {
    userSessions.set(sessionId, {
        username: userData.username,
        display_name: userData.display_name,
        profile_image_url: userData.profile_image_url,
        createdAt: Date.now()
    });
}

/**
 * Get user session
 */
export function getUserSession(sessionId) {
    return userSessions.get(sessionId);
}

/**
 * Destroy user session
 */
export function destroyUserSession(sessionId) {
    userSessions.delete(sessionId);
}

/**
 * Get current date as YYYY-MM-DD string
 */
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Check if user has tasks remaining for today
 */
export function hasTasksRemaining(username) {
    const currentDate = getCurrentDate();
    const usage = taskUsage.get(username);

    if (!usage || usage.date !== currentDate) {
        // New day or first use
        return true;
    }

    return usage.count < MAX_TASKS_PER_DAY;
}

/**
 * Get remaining tasks for user today
 */
export function getRemainingTasks(username) {
    const currentDate = getCurrentDate();
    const usage = taskUsage.get(username);

    if (!usage || usage.date !== currentDate) {
        return MAX_TASKS_PER_DAY;
    }

    return Math.max(0, MAX_TASKS_PER_DAY - usage.count);
}

/**
 * Increment task usage for user
 */
export function incrementTaskUsage(username) {
    const currentDate = getCurrentDate();
    const usage = taskUsage.get(username);

    if (!usage || usage.date !== currentDate) {
        // New day or first use
        taskUsage.set(username, { date: currentDate, count: 1 });
    } else {
        usage.count += 1;
        taskUsage.set(username, usage);
    }
}

/**
 * Check if GentraID is configured
 */
export function isGentraConfigured() {
    return gentraCredentials.client_id && gentraCredentials.client_secret;
}

/**
 * Get total tasks used today for user
 */
export function getTasksUsedToday(username) {
    const currentDate = getCurrentDate();
    const usage = taskUsage.get(username);

    if (!usage || usage.date !== currentDate) {
        return 0;
    }

    return usage.count;
}

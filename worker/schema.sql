CREATE TABLE IF NOT EXISTS user_keys (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_key TEXT NOT NULL,
    username TEXT,
    display_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

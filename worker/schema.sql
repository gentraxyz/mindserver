CREATE TABLE IF NOT EXISTS user_keys (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_key TEXT NOT NULL,
    username TEXT,
    display_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_usage (
    username TEXT NOT NULL,
    date TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    PRIMARY KEY (username, date)
);

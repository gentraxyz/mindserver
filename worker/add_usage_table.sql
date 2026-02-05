-- Migration script to add user_usage table for daily limit tracking
CREATE TABLE IF NOT EXISTS user_usage (
    username TEXT NOT NULL,
    date TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    PRIMARY KEY (username, date)
);

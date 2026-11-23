CREATE TABLE user_account (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL REFERENCES member(id),
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    disabled BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url VARCHAR(500),
    created_date TIMESTAMPTZ NOT NULL,
    updated_date TIMESTAMPTZ NOT NULL,
    created_by_id VARCHAR(36)
);

CREATE UNIQUE INDEX user_account_username_key ON user_account(lower(username));
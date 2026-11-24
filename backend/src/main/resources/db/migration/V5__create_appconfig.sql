CREATE TABLE app_config (
    id VARCHAR(36) PRIMARY KEY,
    key VARCHAR(36) NOT NULL,
    value text NOT NULL,
    created_date TIMESTAMPTZ NOT NULL,
    updated_date TIMESTAMPTZ NOT NULL,
    created_by_id VARCHAR(36)
);

CREATE UNIQUE INDEX app_config_unique_account_key ON app_config(key);
CREATE TABLE notification(
    id VARCHAR(36) PRIMARY KEY,
    archived boolean not null default false,
    archive_date timestamptz,
    publish_date timestamptz not null,
    read_by jsonb not null default '[]'::jsonb,
    message TEXT,
    type TEXT not null,
    title TEXT not null,
    created_date TIMESTAMPTZ NOT NULL,
    updated_date TIMESTAMPTZ NOT NULL,
    created_by_id VARCHAR(36)
);
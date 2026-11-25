CREATE TABLE achievement(
    id VARCHAR(36) PRIMARY KEY,
    active boolean not null default false,
    category text,
    description text,
    icon text,
    name text,
    points integer,
    threshold integer,
    created_date TIMESTAMPTZ NOT NULL,
    updated_date TIMESTAMPTZ NOT NULL,
    created_by_id VARCHAR(36)
)
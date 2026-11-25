CREATE TABLE beer_batch(
    id VARCHAR(36) PRIMARY KEY,
    quantity  INTEGER not null,
    consumed_adjustment INTEGER,
    cost NUMERIC(10, 2) not null,
    date DATE not null,
    notes TEXT,
    minimum_stock INTEGER,
    type TEXT,
    created_date TIMESTAMPTZ NOT NULL,
    updated_date TIMESTAMPTZ NOT NULL,
    created_by_id VARCHAR(36)
);
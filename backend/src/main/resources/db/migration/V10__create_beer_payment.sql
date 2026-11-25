-- Pagos de cerveza. Lo pagado por alguien es SUM(amount) de sus filas sin
-- archivar. Las correcciones ("descontar", "fijar") son filas con importe
-- negativo, así queda rastro de todo.
CREATE TABLE beer_payment(
    id VARCHAR(36) PRIMARY KEY,
    -- NULL = invitados. Igual que en beer_consumption, sin ON DELETE.
    member_id VARCHAR(36) REFERENCES member(id),
    amount NUMERIC(10, 2) NOT NULL,
    date TIMESTAMPTZ,
    notes TEXT,
    archived BOOLEAN NOT NULL DEFAULT false,
    archive_year INTEGER,
    created_date TIMESTAMPTZ NOT NULL,
    updated_date TIMESTAMPTZ NOT NULL,
    created_by_id VARCHAR(36)
);

CREATE INDEX beer_payment_member_id_idx ON beer_payment(member_id);

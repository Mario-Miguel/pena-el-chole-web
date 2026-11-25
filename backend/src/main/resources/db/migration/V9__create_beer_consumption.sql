-- Cada fila es una o varias cervezas apuntadas a un integrante. Es la única
-- fuente de verdad: las cervezas de alguien son SUM(quantity) de sus filas sin
-- archivar (ya no hay contador aparte).
CREATE TABLE beer_consumption(
    id VARCHAR(36) PRIMARY KEY,
    -- NULL = invitados (gente de fuera de la peña). Sin ON DELETE: no se puede
    -- borrar un integrante que tiene cervezas apuntadas (409).
    member_id VARCHAR(36) REFERENCES member(id),
    type TEXT,
    quantity INTEGER NOT NULL,
    -- Al cerrar el año se archivan (no se borran) para guardar el histórico
    archived BOOLEAN NOT NULL DEFAULT false,
    archive_year INTEGER,
    created_date TIMESTAMPTZ NOT NULL,
    updated_date TIMESTAMPTZ NOT NULL,
    created_by_id VARCHAR(36)
);

CREATE INDEX beer_consumption_member_id_idx ON beer_consumption(member_id);

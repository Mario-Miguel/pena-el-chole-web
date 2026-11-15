CREATE TABLE integrante (
    id               VARCHAR(36)  PRIMARY KEY,
    nombre           VARCHAR(255) NOT NULL,
    categoria        VARCHAR(50),
    cargo            VARCHAR(50),
    cervezas         INTEGER      NOT NULL DEFAULT 0,
    fecha_nacimiento DATE,
    created_date     TIMESTAMPTZ  NOT NULL,
    updated_date     TIMESTAMPTZ  NOT NULL,
    created_by_id    VARCHAR(36)
);

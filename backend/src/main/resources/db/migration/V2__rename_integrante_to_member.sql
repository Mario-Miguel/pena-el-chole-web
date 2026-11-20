-- El backend pasa a usar nombres en inglés. V1 ya está aplicada, así que no se
-- edita: se renombra aquí (Flyway compara el checksum de las migraciones aplicadas).
ALTER TABLE integrante RENAME TO member;
ALTER INDEX integrante_pkey RENAME TO member_pkey;

ALTER TABLE member RENAME COLUMN nombre           TO name;
ALTER TABLE member RENAME COLUMN categoria        TO category;
ALTER TABLE member RENAME COLUMN cargo            TO role;
ALTER TABLE member RENAME COLUMN cervezas         TO beers;
ALTER TABLE member RENAME COLUMN fecha_nacimiento TO birth_date;

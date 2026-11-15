# Backend: Peña El Chole

Spring Boot 4.1 · Java 21 · PostgreSQL 17 · Flyway · Spring Data JPA · Spring Security.
`API.md` has the contract the frontend expects.

## Run it

```bash
docker compose up -d        # PostgreSQL on localhost:5432 (db/user/pass: pena)
./mvnw spring-boot:run      # API on http://localhost:8080
./mvnw test                 # tests (Testcontainers starts its own PostgreSQL in Docker)
```

With the backend running, `pnpm run dev` in the project root serves the frontend. Vite proxies `/api` to port 8080.

## Structure

The code is organized **by feature**: each entity's package holds everything about it.

```
src/main/java/com/penaelchole/backend/
├── BackendApplication.java      # entry point
├── config/                      # Spring configuration (security, CORS, ...)
│   └── SecurityConfig.java
├── common/                      # code shared by every feature
│   └── BaseEntity.java          # id, created_date, updated_date, created_by_id
└── integrante/                  # one package per entity
    ├── Integrante.java          # JPA entity (= "integrante" table)
    ├── IntegranteRepository.java# data access (Spring Data)
    ├── IntegranteService.java   # business logic, transactions
    ├── IntegranteController.java# HTTP endpoints (/api/entities/Integrante)
    └── IntegranteResponse.java  # JSON returned to the frontend (snake_case)

src/main/resources/
├── application.properties
└── db/migration/                # Flyway: V1__..., V2__... run in order on startup
```

A request flows **Controller → Service → Repository → database**, and the data comes back as a `...Response` DTO.

### Adding a new entity
1. Write a migration `db/migration/V<n>__create_<table>.sql`. Never edit a migration that has already run; add a new one instead.
2. Create the package with the entity (`extends BaseEntity`), repository, service, controller and response DTO.
3. Add a test in `src/test/java/.../<feature>/`.

## Try it

There's no create endpoint yet, so insert a row by hand:

```bash
docker compose exec postgres psql -U pena -c \
  "INSERT INTO integrante (id, nombre, categoria, cargo, created_date, updated_date)
   VALUES (gen_random_uuid(), 'Pepe', 'cargos', 'tesorero', now(), now());"

curl http://localhost:8080/api/entities/Integrante
```

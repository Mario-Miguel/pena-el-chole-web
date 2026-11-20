# Backend: Peña El Chole

Spring Boot 4.1 · Java 21 · PostgreSQL 17 · Flyway · Spring Data JPA · Spring Security.
`API.md` has the contract the frontend expects; `ROADMAP.md` has the step-by-step plan and the entities left to map.

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
└── member/                      # one package per entity
    ├── Member.java              # JPA entity (= "member" table)
    ├── MemberRepository.java    # data access (Spring Data)
    ├── MemberService.java       # business logic, transactions
    ├── MemberController.java    # HTTP endpoints (/api/entities/Integrante)
    └── MemberResponse.java      # JSON returned to the frontend (snake_case)

src/main/resources/
├── application.properties
└── db/migration/                # Flyway: V1__..., V2__... run in order on startup
```

A request flows **Controller → Service → Repository → database**, and the data comes back as a `...Response` DTO.

### Adding a new entity
1. Write a migration `db/migration/V<n>__create_<table>.sql`. Never edit a migration that has already run; add a new one instead.
2. Create the package with the entity (`extends BaseEntity`), repository, service, controller and response DTO.
   Code, tables and columns are in **English**; the API contract (endpoint path and JSON keys) stays as the frontend expects it, in Spanish.
   Map the names with `@JsonProperty("nombre")` in the DTOs and `@ApiName("nombre")` on the entity field (used by filters and `sort`).
3. Add a test in `src/test/java/.../<feature>/`.

## Try it

```bash
curl -X POST http://localhost:8080/api/entities/Integrante \
  -H 'Content-Type: application/json' \
  -d '{"nombre": "Pepe", "categoria": "cargos", "cargo": "tesorero"}'

curl http://localhost:8080/api/entities/Integrante
```

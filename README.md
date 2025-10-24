# ProServ Monorepo

Modern web platform for consulting estimate management. This repository uses an Nx + pnpm monorepo to host the frontend, backend, and shared packages required for the MVP.

## Getting Started

```bash
corepack enable
pnpm install
pnpm dev # starts api + frontend locally
```

### Project Layout
- `apps/frontend` – Next.js 15 web client
- `apps/api` – NestJS service layer
- `packages/shared` – Shared TypeScript domain types & Zod schemas
- `docs` – Architecture, security, and operational runbooks

Nx is configured with caching, linting, testing, and formatting defaults. Use `pnpm nx run-many -t <target>` to execute tasks across projects.

### Local Runtime Dependencies
- `docker compose up -d postgres redis minio mailpit otel-collector` bootstraps the shared services.
- `pnpm db:generate && pnpm db:migrate` prepares the API database schema when developing outside Docker.
- `.env.example` files exist under `apps/api` and `apps/frontend` to guide configuration. Copy to `.env.local` for local development or adjust the docker-specific env files.

### Dockerized Stack
- Build and run the full application stack:
  ```bash
  docker compose up --build
  ```
- API will auto-run `prisma migrate deploy` on container startup. Verify health at `http://localhost:4000/health` and UI at `http://localhost:3000`.
- Default organization data, an engagement lead account, and organization-wide rate cards for every delivery role are provisioned automatically when the API boots so new environments no longer require manual seeding.
- API configuration for containers lives in `apps/api/.env.docker` (referenced automatically by compose).
- Override `NEXT_PUBLIC_API_URL` or other settings using environment variables or a `.env` file recognized by Docker Compose.

### Creating Your First Project
- Launch the UI at `http://localhost:3000/projects/create`, supply the name, client, kickoff date, base currency, and billing model, then submit. You will be redirected to the new project overview and the dashboard will populate automatically.
- Prefer an API call? The same workflow is available via `POST http://localhost:4000/api/v1/projects`:
  ```bash
  curl -X POST http://localhost:4000/api/v1/projects \
    -H 'Content-Type: application/json' \
    -d '{
      "name": "Customer Experience Revamp",
      "clientName": "Northwind Manufacturing",
      "startDate": "2024-07-01",
      "baseCurrency": "USD",
      "billingModel": "TIME_AND_MATERIAL"
    }'
  ```
- The service creates any missing organization or engagement owner records automatically, so a fresh database no longer needs manual seeding before the workspace is usable.
- To test multi-user scenarios locally, set `PROSERV_SESSION_USER_ID`, `PROSERV_SESSION_USER_EMAIL`, and optional name/role environment variables before starting the frontend. Those values are forwarded to the API on every request to scope project access per user.

### Managing Rate Cards
- Navigate to `/resources` in the dashboard to view and update organization-wide rate cards. A built-in manager lets you edit bill and cost rates for every role, create additional cards, and assign them to projects from the workspace sidebar.
- When a project is created, the baseline version automatically links to the organization's default rate card. Owners can swap cards or rename the baseline from the project workspace.
- REST endpoints are exposed under `/api/v1/rate-cards`:
  - `GET /api/v1/rate-cards` returns the collection of rate cards and available roles.
  - `POST /api/v1/rate-cards` creates a new card with optional entry overrides.
  - `PATCH /api/v1/rate-cards/:id` updates metadata and role-based rates.
  All endpoints require the same session headers used for project APIs (`x-proserv-user-id`, `x-proserv-user-email`, etc.).

### Managing Roles
- The role catalog (also under `/resources`) lets administrators create, edit, and archive the delivery roles available to projects, staffing plans, and rate cards. Updates apply immediately and rate cards backfill new roles automatically.
- REST endpoints are exposed under `/api/v1/roles`:
  - `GET /api/v1/roles?includeArchived=true` lists roles and returns active/archived counts.
  - `POST /api/v1/roles` creates a new role (code, name, optional description).
  - `PATCH /api/v1/roles/:id` updates role metadata such as the code or description.
  - `POST /api/v1/roles/:id/archive` archives the role and removes its entries from active rate cards.
  Session headers (`x-proserv-user-id`, `x-proserv-user-email`, etc.) scope requests to the caller's organization.

When running via Docker Compose, the frontend uses `NEXT_PUBLIC_API_URL` for browser calls (defaults to `http://localhost:4000/api`) and `API_INTERNAL_URL` to reach the API from inside the container network (`http://api:4000/api`). Update those values if you change service ports or names.

## Tooling & Standards
- Node `22.9.0` (see `.nvmrc` / `.tool-versions`)
- pnpm `10.19.0`
- ESLint + Prettier with Tailwind plugin
- Husky + lint-staged + Commitlint (configured after Git init)
- Automated dependency updates recommended via Renovate/Dependabot

Security baselines, environment configuration, and deployment guidance are documented in `docs/security.md` (to be expanded as features land).

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

## Tooling & Standards
- Node `22.9.0` (see `.nvmrc` / `.tool-versions`)
- pnpm `10.19.0`
- ESLint + Prettier with Tailwind plugin
- Husky + lint-staged + Commitlint (configured after Git init)
- Automated dependency updates recommended via Renovate/Dependabot

Security baselines, environment configuration, and deployment guidance are documented in `docs/security.md` (to be expanded as features land).

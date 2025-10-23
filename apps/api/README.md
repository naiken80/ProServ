# API Service

NestJS 11 service powering the ProServ estimator platform.

## Development

```bash
pnpm nx serve api
```

### Database Tooling

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

Ensure a PostgreSQL instance is available and update `apps/api/.env` from `.env.example` before running migrations.

### Projects API
- `GET /api/v1/projects` – paginated summaries used by the dashboard.
- `GET /api/v1/projects/:id` – overview card for a single engagement.
- `POST /api/v1/projects` – create a project and baseline estimate version. Required fields: `name`, `clientName`, `startDate`, `baseCurrency`, `billingModel`.
- `PATCH /api/v1/projects/:id` – update core project fields and optionally rename the baseline version.

All mutations automatically provision a default organization and engagement lead when the database is empty so new environments do not require seed data.

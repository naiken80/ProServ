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
- `GET /api/v1/projects` – paginated summaries scoped to the signed-in user (based on the `x-proserv-user-*` headers).
- `GET /api/v1/projects/:id` – workspace summary plus baseline snapshot for a single engagement.
- `POST /api/v1/projects` – create a project and baseline estimate version. Required fields: `name`, `clientName`, `startDate`, `baseCurrency`, `billingModel`.
- `PATCH /api/v1/projects/:id` – update core project fields and optionally rename the baseline version.

The service seeds a default organization, engagement lead, architect role, and rate card on startup. When customising requests (e.g. in tests), include `x-proserv-user-id` and `x-proserv-user-email` headers so role-aware filtering returns the correct projects.

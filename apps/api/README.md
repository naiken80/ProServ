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

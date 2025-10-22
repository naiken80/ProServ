# `@proserv/shared`

Type-safe contracts shared between the API and frontend layers. Includes core domain schemas and TypeScript types derived from Zod definitions.

## Scripts
- `pnpm nx build shared` – emit CommonJS artifacts under `dist/packages/shared`
- `pnpm nx test shared` – run schema-focused unit tests
- `pnpm nx lint shared` – lint the shared source

Consumers can import either the Zod schema (e.g. `projectSchema`) or the inferred type (e.g. `Project`).

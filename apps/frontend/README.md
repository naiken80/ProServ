# Frontend Application

Next.js 15 App Router UI for the ProServ estimator platform.

## Stack
- Tailwind CSS + shadcn-inspired primitives
- TanStack Query for data fetching/state
- Zustand for local stores (placeholder)
- React Hook Form + Zod (wired via shared validation package in future work)
- next-themes + custom theming tokens
- next-pwa for offline caching and installable experience

## Local Development
```bash
pnpm nx serve frontend
```

Environment variables live in `.env.local`. See `.env.example` for expected keys.

Playwright tests live under `apps/frontend-e2e`. Unit specs leverage Jest + Testing Library.

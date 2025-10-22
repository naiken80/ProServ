# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
ENV NX_DAEMON=false
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/frontend ./apps/frontend
COPY packages ./packages

RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm nx build frontend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NX_DAEMON=false

# Next.js needs NODE_ENV during runtime
ENV PORT=3000
EXPOSE 3000

COPY --from=deps /app/dist/apps/frontend/.next/standalone ./
COPY --from=deps /app/dist/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=deps /app/dist/apps/frontend/.next ./dist/apps/frontend/.next
COPY --from=deps /app/apps/frontend/public ./apps/frontend/public

CMD ["node", "apps/frontend/server.js"]

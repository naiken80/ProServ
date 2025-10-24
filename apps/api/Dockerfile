# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NX_DAEMON=false

# Enable pnpm
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY packages ./packages
COPY prisma ./prisma
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm exec prisma generate
RUN pnpm nx build shared
RUN mkdir -p node_modules/@proserv && cp -R dist/packages/shared node_modules/@proserv/shared
RUN pnpm nx build api

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV NX_DAEMON=false

COPY --from=base /app/dist/apps/api ./dist
COPY --from=base /app/dist/packages/shared ./dist/packages/shared
COPY --from=base /app/node_modules ./node_modules
COPY prisma ./prisma

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]

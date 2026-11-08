# syntax=docker/dockerfile:1

FROM node:24.21.0-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

COPY . .
RUN yarn build

FROM node:24.21.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output ./

# Nitro's node-server output keeps its runtime dependency list in
# server/package.json but does not vendor node_modules — install them here
# so the final image doesn't need the full project node_modules.
RUN cd server && npm install --omit=dev --no-audit --no-fund

# Local storage used by server/api/solicitacoes (see nuxt.config.ts).
# Mount a volume here in production so data survives container restarts;
# this is a development-grade store, not a real database (see docs/etapa-iniciais.md).
VOLUME ["/app/.data"]

EXPOSE 3000
CMD ["node", "server/index.mjs"]

FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml .npmrc ./
RUN yarn install --immutable

COPY . .
RUN yarn build

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

COPY --from=build /app/.output ./.output
COPY --from=build /app/server/database/migrations ./server/database/migrations

EXPOSE 3000
VOLUME ["/app/.data"]

CMD ["node", ".output/server/index.mjs"]

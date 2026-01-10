FROM oven/bun:1 AS base

FROM base AS install
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json bun.lock ./
RUN bun install

FROM base AS builder
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY --from=install /usr/src/app/node_modules /usr/src/app/node_modules
COPY . .
RUN bun build src/index.ts --outfile ./dist/index.js

FROM base
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]

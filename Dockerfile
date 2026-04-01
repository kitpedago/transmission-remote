# Stage 1: Install all dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

# Stage 2: Build client
FROM deps AS client-build
COPY client/ client/
RUN npm run build -w client

# Stage 3: Build server
FROM deps AS server-build
COPY server/ server/
RUN npm run build -w server

# Stage 4: Production deps only
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --omit=dev

# Stage 5: Production image
FROM node:20-alpine
WORKDIR /app

COPY --from=prod-deps /app/node_modules node_modules/
COPY --from=server-build /app/server/dist server/dist/
COPY --from=server-build /app/server/package.json server/
COPY --from=client-build /app/client/dist client/dist/
COPY package.json ./

RUN mkdir -p server/data

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/dist/dev.js"]

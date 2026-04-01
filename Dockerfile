# Stage 1: Build client
FROM node:20-alpine AS client-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci
COPY client/ client/
RUN npm run build -w client

# Stage 2: Build server
FROM node:20-alpine AS server-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --omit=dev
COPY server/ server/
RUN npm run build -w server

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

COPY --from=server-build /app/node_modules node_modules/
COPY --from=server-build /app/server/node_modules server/node_modules/
COPY --from=server-build /app/server/dist server/dist/
COPY --from=server-build /app/server/package.json server/
COPY --from=client-build /app/client/dist client/dist/
COPY package.json ./

# Create data directory for SQLite
RUN mkdir -p server/data

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/dist/dev.js"]

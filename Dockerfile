# Stage 1: Build everything
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm install

COPY client/ client/
COPY server/ server/
RUN npx -w client tsc -b && npx -w client vite build
RUN npx -w server tsc

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm install --omit=dev

COPY --from=build /app/server/dist server/dist/
COPY --from=build /app/client/dist client/dist/
COPY --from=build /app/server/package.json server/

RUN mkdir -p server/data

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/dist/dev.js"]

# Stage 1: Build Vite client
FROM node:20-alpine AS client-build

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ ./
RUN npm run build


# Stage 2: Production server
FROM node:20-alpine AS server

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

ENV PORT=3000
ENV MQTT_BROKER=mqtt://localhost:1883

EXPOSE 3000

CMD ["node", "server/index.js"]

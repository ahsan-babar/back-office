# Stage 1: Build TypeScript backend inside monorepo workspace
FROM node:26-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/package.json ./backend/

RUN npm ci --workspace=backend --include-workspace-root

COPY backend ./backend
RUN npm --workspace=backend run build

# Stage 2: Minimal production runtime
FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

RUN npm ci --omit=dev --workspace=backend --include-workspace-root && npm cache clean --force

COPY --from=builder /app/backend/dist ./backend/dist

USER node
EXPOSE 3000

CMD ["node", "backend/dist/main.js"]

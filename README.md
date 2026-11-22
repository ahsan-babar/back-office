# Back-Office User & Session Management System

A full-stack back-office application for managing users and active authentication sessions, built with **Node.js 26 LTS**, **TypeScript 5+**, **NestJS 11**, **MongoDB** (AWS DocumentDB wire-compatible), **React**, and **Docker Compose**.

---

## Architecture & Key Design Decisions

- **Monorepo Layout:** Managed via npm workspaces (`backend` and `frontend`) sharing a strict TypeScript baseline (`tsconfig.base.json`) and unified ESLint / Husky quality gates.
- **Domain-Driven Business Rules:**
  - **Users:** Immutable `createdAt`, automatic `updatedAt` tracking, atomic `loginsCounter` increments, and strict prevention of `firstName`/`lastName` edits while a user's status is `inactive`.
  - **Sessions:** Inactive users cannot create sessions; sessions track `createdAt` and `terminatedAt`, and deactivating or deleting a user immediately revokes all active sessions for that user.
- **Transport-Decoupled HTTP Layer:** Domain services (`IUsersService`, `ISessionsService`) are completely decoupled from Express. While `@nestjs/platform-express` is used for clean `supertest` integration ergonomics, swapping to `@nestjs/platform-fastify` requires only a bootstrap adapter change if raw JSON throughput ever becomes a bottleneck.

---

## Configurable Environment Variables

Copy `.env.example` to `.env` before running locally:

```bash
cp .env.example .env
```

| Variable | Scope | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Backend | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | Backend | `3000` | Port exposed by the NestJS REST API |
| `MONGODB_URI` | Backend | `mongodb://localhost:27017/back-office` | MongoDB / AWS DocumentDB connection string |
| `CORS_ORIGIN` | Backend | `http://localhost:5173` | Allowed frontend origin for browser CORS requests |
| `VITE_API_BASE_URL` | Frontend | `http://localhost:3000/api` | Base URL used by the React SPA to reach the REST API |

---

## Getting Started

### Prerequisites
- **Node.js `>=26.0.0`** (run `nvm use` to automatically activate `.nvmrc`)
- **Docker & Docker Compose** (for containerized runs or local MongoDB)

### 1. Install Dependencies
```bash
nvm use
npm install
```

### 2. Development Mode
Start MongoDB via Docker Compose, then run the backend and frontend dev servers:
```bash
docker compose up -d mongodb
npm run dev:backend
npm run dev:frontend
```
- **Backend API:** `http://localhost:3000/api`
- **Frontend App:** `http://localhost:5173`

### 3. Production Mode (Full Stack via Docker Compose)
Build and launch MongoDB (`ums-mongodb`), the NestJS API (`api-users`), and the Nginx-served React SPA (`app-web`):
```bash
npm run docker:up
```
- **Production Web UI:** `http://localhost:8080`
- **Production REST API:** `http://localhost:3000/api`

To stop and remove containers/volumes:
```bash
npm run docker:down
```

---

## Building, Linting & Testing

| Command | Description |
| :--- | :--- |
| `npm run lint` | Runs ESLint across all workspaces |
| `npm run build` | Compiles production builds for backend and frontend |
| `npm run test:backend` | Executes backend unit and HTTP integration tests (using in-memory MongoDB) |
| `npm run test:backend:cov` | Executes backend tests with Node.js native V8 code coverage report |
| `npm run test:e2e` | Runs Playwright end-to-end tests against the full stack |

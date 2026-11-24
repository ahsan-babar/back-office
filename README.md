# Back-Office User & Session Management System

A full-stack back-office application for managing users and active authentication sessions, built with **Node.js 26 LTS**, **TypeScript 5+**, **NestJS 11**, **MongoDB** (AWS DocumentDB wire-compatible), **React**, **Material UI (MUI)**, and **Docker Compose**.

---

## Architecture & Key Design Decisions

- **Monorepo Layout:** Managed via npm workspaces (`backend` and `frontend`) sharing a strict TypeScript baseline (`tsconfig.base.json`) and unified ESLint / Husky quality gates.
- **Domain-Driven Business Rules:**
  - **Users:** Immutable `createdAt`, automatic `updatedAt` tracking, atomic `loginsCounter` increments, and strict prevention of `firstName`/`lastName` edits while a user's status is `inactive`.
  - **Sessions:** Inactive users cannot create sessions; sessions track `createdAt` and `terminatedAt`, and deactivating or deleting a user immediately revokes all active sessions for that user.
- **Transport-Decoupled HTTP Layer:** Domain services (`IUsersService`, `ISessionsService`) are completely decoupled from Express. While `@nestjs/platform-express` is used for clean `supertest` integration ergonomics, swapping to `@nestjs/platform-fastify` requires only a bootstrap adapter change if raw JSON throughput ever becomes a bottleneck.
- **Frontend SPA Architecture:** Built with **React**, **TypeScript**, **React Router**, and **Material UI**, featuring centralized 

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
| `FRONTEND_PORT` | Docker Compose | `8080` | Host port mapped to the Nginx container serving the production React SPA |
| `E2E_BASE_URL` | Playwright E2E | `http://localhost:8080` | Target frontend URL used by Playwright (`http://localhost:8080` for Docker or `http://localhost:5173` for Vite dev) |


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

### 2. Development Mode (Backend & Frontend)
Start MongoDB via Docker Compose, then launch the backend and frontend development servers in separate terminals:

```bash
# 1. Start MongoDB
docker compose up -d mongodb

# 2. Start the NestJS Backend API (watch mode)
npm run dev:backend

# 3. Start the React + Vite Frontend SPA (HMR enabled)
npm run dev:frontend
```
- **Frontend App (Vite Dev Server):** `http://localhost:5173`
- **Backend REST API:** `http://localhost:3000/api`

### 3. Production Mode (Full Stack via Docker Compose)
The `docker-compose.yml` orchestrates three isolated services on a shared bridge network with health checks:
1. **`mongodb` (`ums-mongodb`):** MongoDB database with persistent named volume storage.
2. **`backend` (`api-users`):** Multi-stage production NestJS API build on port `3000`, waiting for `mongodb` health before starting.
3. **`frontend` (`app-web`):** Multi-stage Vite production bundle served via **Nginx** on port `8080` with SPA fallback routing (`try_files $uri /index.html`).

Build and launch the entire stack:
```bash
npm run docker:up
# or directly: docker compose up --build -d
```
- **Production Web UI (Nginx):** `http://localhost:8080`
- **Production REST API:** `http://localhost:3000/api`

To inspect logs or tear down containers and volumes:
```bash
docker compose logs -f
npm run docker:down
# or directly: docker compose down -v
```

---

## Building, Linting & Testing

### Workspace Commands (Run from Root)

| Command | Description |
| :--- | :--- |
| `npm run lint` | Runs ESLint across both `backend` and `frontend` workspaces |
| `npm run build` | Compiles production TypeScript & Vite bundles for `backend` and `frontend` |
| `npm run test:backend` | Executes backend unit and HTTP integration tests (using `mongodb-memory-server`) |
| `npm run test:backend:cov` | Executes backend tests with Node.js native V8 code coverage report |
| `npm run test:frontend` | Executes frontend component and flow tests via Vitest & React Testing Library |
| `npm run test:frontend:cov` | Executes frontend tests with V8 code coverage report (`lines`, `functions`, `branches`, `statements`) |
| `npm run test:e2e` | Runs Playwright end-to-end tests against the running full stack |
| `npm run test:e2e-ui` | Runs Playwright end-to-end tests against the running full stack with ui |

### Running Frontend Tests Directly
```bash
# Single run
npm --workspace=frontend run test

# Watch mode during active UI development
npm --workspace=frontend exec vitest

# Generate V8 HTML & terminal coverage report (outputs to frontend/coverage/)
npm --workspace=frontend run test:coverage
```

### Running End-to-End (E2E) Tests with Playwright

Playwright executes end-to-end browser flows against the live full stack (`MongoDB` + `NestJS API` + `React SPA`).

1. **Ensure the full stack is running** (either via Docker Compose on port `8080` or local dev servers on port `5173`):
   ```bash
   # Option A: Production Docker Compose stack (default E2E_BASE_URL=http://localhost:8080)
   npm run docker:up

   # Option B: Local development servers (set E2E_BASE_URL=http://localhost:5173)
   docker compose up -d mongodb
   npm run dev:backend
   npm run dev:frontend
   ```

2. **Install Playwright browser binaries** (first time only):
   ```bash
   npx playwright install chromium
   ```

3. **Run the Playwright test suite:**
   ```bash
   # Headless execution against Docker Compose (http://localhost:8080)
   npm run test:e2e

   # Headless execution against local Vite dev server (http://localhost:5173)
   E2E_BASE_URL=http://localhost:5173 npm run test:e2e

   # Interactive visual timeline UI (recommended for step-by-step debugging)
   npm run test:e2e-ui

   # Headed browser execution with slowed actions
   npx playwright test --headed --slow-mo=250

   # Open the HTML trace & video report after a run
   npx playwright show-report
   ```

---


### Backend (NestJS & MongoDB) Roadmap

- **High-Throughput Fastify Adapter (`@nestjs/platform-fastify`):** Because all domain services and controllers are decoupled from Express-specific primitives, switching NestJS from `@nestjs/platform-express` to `@nestjs/platform-fastify` (along with `fast-json-stringify` schema serialization) can be enabled in `main.ts` to significantly boost request throughput and lower p99 JSON serialization latency under heavy concurrent traffic.
- **Session Transport & Expiration:** Currently, session IDs are persisted in `localStorage` and sent via the `x-session-id` header for straightforward SPA integration. For higher XSS resistance in production, sessions should be issued as `HttpOnly; Secure; SameSite=Strict` cookies with a configurable TTL and sliding expiration.
- **Role-Based Access Control (RBAC) & Self-Protection:** Any authenticated active user currently has full administrative privileges on `/users`, including deactivating or deleting their own account. Adding explicit `admin` vs. `operator` roles and preventing self-deletion would improve operational safety.
- **Search, Filtering & Sorting:** The `GET /api/users` endpoint supports offset pagination (`6` items per page). Adding indexed query filters (`status`, name/email prefix search) and column sorting would improve usability at larger scale.
- **Rate Limiting & Audit Logging:** Adding request throttling on `/api/auth/signin` and `/api/auth/signup` plus an immutable audit trail for user status changes and session revocations would harden production security.
- **Immutable Audit Trail:** Persist an append-only audit log capturing who created, modified, deactivated, or deleted user accounts and active sessions.


### Frontend (React) Roadmap
- **Server-State Management (TanStack Query):** Replace manual `useEffect` data-fetching hooks with **TanStack Query** to enable automatic caching, background revalidation, request deduplication, and optimistic UI updates for user mutations.
- **Shared Schema Validation (`React Hook Form` + `Zod`):** Introduce **React Hook Form** with **Zod** validation schemas shared between the NestJS backend and React frontend to eliminate duplicate validation logic and minimize form re-renders.
- **Route-Level Code Splitting:** Lazy-load feature routes (`UsersDashboardPage`, `SignInPage`, `SignUpPage`) via `React.lazy()` and `Suspense` to reduce initial bundle size and improve Time-to-Interactive (TTI).
- **URL-Synchronized Pagination & Filtering:** Persist pagination (`?page=`), status filters, and debounced search inputs in URL query parameters (`useSearchParams`) so views remain stateful across page reloads and shareable links.
- **Error Boundaries & Toast Notifications:** Add React Error Boundaries around feature modules and a global MUI `Snackbar` notification queue for consistent, non-blocking API error handling.
- **Automated Accessibility (`axe-core`) & Visual Regression:** Integrate `@axe-core/playwright` into the E2E pipeline to enforce WCAG 2.1 AA keyboard/focus standards across dialogs and both light/dark MUI themes.
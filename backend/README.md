# Back-Office REST API (`backend`)

NestJS 11 + TypeScript + MongoDB (AWS DocumentDB wire-compatible) backend service powering user directory management, password hashing, session lifecycle enforcement, and domain invariants.

---

## Architecture & Domain Rules

- **Transport-Decoupled Service Layer:** Domain services (`IUsersService`, `ISessionsService`) are decoupled from Express-specific request/response objects, allowing seamless migration to `@nestjs/platform-fastify` with minimal bootstrap changes.
- **MongoDB / AWS DocumentDB Compatibility:** Queries and repository operations avoid MongoDB Atlas-only or non-DocumentDB features (such as `$lookup` aggregations or multi-document transactions where unsupported), keeping persistence wire-compatible with AWS DocumentDB.
- **Core Business Invariants:**
  - **Immutable Creation Timestamps:** `createdAt` is set once at creation and never overwritten on updates; `updatedAt` updates automatically on every mutation.
  - **Atomic Login Tracking:** Successful sign-ins atomically increment `loginsCounter` (`$inc`) and open a new active session.
  - **Inactive User Restrictions:**
    - Users with `status: 'inactive'` cannot sign in or open new sessions.
    - `firstName` and `lastName` cannot be modified while a user's `status` is `'inactive'` (attempting to do so returns HTTP `400 Bad Request`).
    - Setting a user's status to `'inactive'` or deleting the user immediately terminates all active sessions (`terminatedAt = now`) belonging to that user.

---

## Directory Structure

```text
backend/src/
├── common/
│   ├── decorators/           # Custom parameter decorators (e.g., @CurrentUser, @CurrentSession)
│   ├── filters/              # Global HTTP exception filters
│   ├── guards/               # Session authentication guard validating x-session-id
│   └── interfaces/           # Shared domain service contracts (IUsersService, ISessionsService)
├── config/
│   └── env.validation.ts     # Environment variable schema validation and defaults
├── modules/
│   ├── auth/
│   │   ├── dto/              # SignUpDto, SignInDto
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   ├── sessions/
│   │   ├── schemas/          # Mongoose Session schema & indexes
│   │   ├── sessions.controller.ts
│   │   ├── sessions.module.ts
│   │   └── sessions.service.ts
│   └── users/
│       ├── dto/              # CreateUserDto, UpdateUserDto, PaginationQueryDto
│       ├── schemas/          # Mongoose User schema & unique email index
│       ├── users.controller.ts
│       ├── users.module.ts
│       └── users.service.ts
├── app.module.ts             # Root NestJS module wiring ConfigModule, MongooseModule, and feature modules
└── main.ts                   # Application bootstrap, global ValidationPipe, CORS, and /api prefix
```

---

## API Endpoints Overview

All endpoints are prefixed with `/api`. Protected routes require a valid active `x-session-id` request header.

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/signup` | No | Registers a new active user and opens an initial session |
| `POST` | `/api/auth/signin` | No | Authenticates an active user, increments `loginsCounter`, and returns a new session |
| `GET` | `/api/sessions/current` | Yes | Validates the `x-session-id` header and returns the current `{ user, session }` |
| `DELETE` | `/api/sessions/:id` | Yes | Terminates an active session (`terminatedAt` timestamp set) |
| `GET` | `/api/users` | Yes | Returns a paginated list of users (`?page=1&limit=6`) |
| `POST` | `/api/users` | Yes | Creates a new managed user (`active` or `inactive`) |
| `PATCH` | `/api/users/:id` | Yes | Updates user fields (blocks `firstName`/`lastName` edits when user is `inactive`; revokes sessions on deactivation) |
| `DELETE` | `/api/users/:id` | Yes | Permanently deletes a user and terminates all of their active sessions |

---

## Environment Variables

Configure via the root `.env` file (see `.env.example`):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | `3000` | HTTP listening port for the NestJS server |
| `MONGODB_URI` | `mongodb://localhost:27017/back-office` | MongoDB / AWS DocumentDB connection URI |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin(s) for browser CORS requests |

---

## Scripts

Run from `backend/` (or from root via `npm --workspace=backend run <script>`):

| Command | Description |
| :--- | :--- |
| `npm run start:dev` | Starts NestJS in watch mode on `http://localhost:3000/api` |
| `npm run build` | Compiles TypeScript production output to `dist/` |
| `npm run start:prod` | Runs the compiled production bundle (`node dist/main`) |
| `npm run lint` | Runs ESLint across `src/` and `test/` |
| `npm run test` | Executes unit and HTTP integration tests using `mongodb-memory-server` |
| `npm run test:cov` | Runs tests with V8 code coverage report (`coverage/`) |
| `npm run docs` | Generates static HTML API documentation from JSDoc/TSDoc comments (`docs/`) |
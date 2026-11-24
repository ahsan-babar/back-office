# Back-Office Frontend (`frontend`)

React + TypeScript Single-Page Application (SPA) built with **Vite** and **Material UI (MUI)** for managing back-office users, authentication sessions, and light/dark UI themes.

---

## Directory Structure

```text
frontend/src/
├── config/
│   └── constants.ts          # Route constants, localStorage keys, and global event names
├── context/
│   ├── AuthContext.tsx       # Session hydration, sign-in/sign-up, logout, and 401 listener
│   └── ThemeModeContext.tsx  # Persistent light/dark MUI theme state
├── features/
│   ├── auth/
│   │   ├── SignInPage.tsx    # Operator login form (/signin)
│   │   └── SignUpPage.tsx    # Operator registration form (/signup)
│   └── users/
│       ├── UsersDashboardPage.tsx  # Paginated user directory & CRUD orchestration (/users)
│       ├── UserFormDialog.tsx      # Modal dialog for creating/editing users (enforces inactive name lock)
│       └── DeleteUserDialog.tsx    # Confirmation modal for user deletion
├── hooks/
│   └── useAuth.ts            # Re-exported typed hook for consuming AuthContext
├── layouts/
│   └── DashboardLayout.tsx   # Top AppBar with greeting, theme toggle, and Log Out button
├── routes/
│   ├── AppRoutes.tsx         # Declarative route definitions and fallback redirects
│   └── ProtectedRoute.tsx    # Auth guard distinguishing initial visitors (/signup) vs. logged-out users (/signin)
├── services/
│   └── apiClient.ts          # Typed Fetch wrapper injecting x-session-id headers and emitting 401 events
├── types/
│   └── domain.ts             # Shared frontend domain interfaces and request/response DTOs
└── App.spec.tsx              # Integration test suite (Vitest + React Testing Library)
```

---

## Key State & Routing Flows

1. **Session Hydration:** On mount, `AuthProvider` checks `localStorage` for a persisted `sessionId`. If present, it calls `GET /api/sessions/current` while rendering an accessible loading indicator (`aria-label="Loading session"`).
2. **Deterministic Unauthenticated Redirects:**
   - **Fresh Unauthenticated Visitor:** Accessing `/users` with no prior logout redirects to `/signup`.
   - **Explicit Logout or `401 Unauthorized`:** `AuthProvider` sets a synchronous `loggedOutRef` flag before clearing `user` state, ensuring `ProtectedRoute` deterministically navigates to `/signin` without render-order race conditions.
3. **Inactive User Name-Lock Enforcement:** In `UserFormDialog`, when editing a user whose `status` is `inactive`, `firstName` and `lastName` inputs are disabled in the UI (mirroring the backend domain invariant) while allowing `email` and `status` updates.

---

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite development server on `http://localhost:5173` |
| `npm run build` | Type-checks (`tsc`) and outputs production static assets to `dist/` |
| `npm run lint` | Runs ESLint across `src/` |
| `npm run test` | Executes Vitest + React Testing Library test suite |
| `npm run test:coverage` | Generates V8 code coverage report in `coverage/` |

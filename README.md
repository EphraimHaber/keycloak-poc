# Keycloak POC

Minimal Keycloak SSO proof of concept with local username/password authentication.

- **Keycloak** server via Docker with pre-configured realm, client, and test user
- **Backend**: tRPC over Fastify with JWT validation middleware
- **Frontend**: React with TanStack Router (auth guards) + TanStack Query (via tRPC)

## Prerequisites

- Docker
- Node.js 18+

## Quick start

You need three terminals.

### 1. Start Keycloak

```bash
docker compose up
```

Wait until you see `Keycloak ... started` in the logs. Admin console is at http://localhost:8080 (login: `admin` / `admin`).

### 2. Start the backend

```bash
cd backend
npm install
npm run dev
```

Runs on http://localhost:3000. Validates JWTs against Keycloak's JWKS endpoint.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173.

## Pages

### `/` — Home

Public landing page. Shows current auth status and links to other pages.

### `/dashboard` — Dashboard (protected)

Requires authentication. If you're not logged in, visiting this page automatically redirects you to the Keycloak login screen. Once authenticated, it displays your user profile (username, email, subject) and calls protected backend endpoints.

### `/playground` — API Playground

Public page for interactively testing all backend endpoints at different authorization levels. Features:

- **Auth status display** — shows your current username and assigned roles
- **Token toggle** — checkbox to send or withhold the auth token, so you can see how endpoints respond to unauthenticated requests
- **Per-endpoint test buttons** plus a "Test All" button
- **Response viewer** — shows HTTP status codes and JSON responses for each call
- **Test user reference table** — built-in credentials you can use to log in with different roles

#### Backend endpoints tested in the Playground

| Endpoint | Access level | Description |
|----------|-------------|-------------|
| `health` | Public | No auth required |
| `me` | Authenticated | Any logged-in user |
| `viewerData` | Role: viewer, manager, or admin | Viewer-level content |
| `managerData` | Role: manager or admin | Manager-level content |
| `adminData` | Role: admin only | Admin-level content |

## Test users

| Username  | Password  | Email                  | Roles                    |
|-----------|-----------|------------------------|--------------------------|
| `admin`   | `admin`   | `admin@example.com`    | admin, manager, viewer   |
| `manager` | `manager` | `manager@example.com`  | manager, viewer          |
| `viewer`  | `viewer`  | `viewer@example.com`   | viewer                   |

## Usage

1. Open http://localhost:5173
2. Click **Login** (or navigate to Dashboard)
3. You'll be redirected to the Keycloak login page
4. Log in with any test user above (e.g. `admin` / `admin`)
5. You'll be redirected back to the app, now authenticated
6. Visit the **Playground** to test endpoints with different roles — log out and back in as a different user to see how access changes
7. The **Dashboard** page calls protected tRPC endpoints that validate your JWT on the backend

## Architecture

```
Browser (5173)          Backend (3000)          Keycloak (8080)
  |                        |                        |
  |-- login redirect ----->|                        |
  |                        |                        |
  |<----------- Keycloak login page --------------->|
  |                        |                        |
  |-- tRPC request ------->|                        |
  |   (Bearer token)       |-- verify JWT --------->|
  |                        |   (JWKS endpoint)      |
  |                        |<-- public keys --------|
  |<-- response ---------- |                        |
```

### Backend auth flow

1. Every tRPC request has the Keycloak access token attached as `Authorization: Bearer <token>`
2. The backend `createContext` extracts the token and verifies it against Keycloak's JWKS endpoint using `jose`
3. Protected procedures check for a valid user in the context; return `UNAUTHORIZED` if missing

### Frontend auth guard

1. `keycloak-js` handles the OIDC flow (login, token refresh, silent SSO check)
2. TanStack Router's `beforeLoad` hook on `/dashboard` checks auth state
3. If not authenticated, triggers `keycloak.login()` which redirects to Keycloak
4. tRPC client automatically attaches the access token to every request via `httpBatchLink` headers

## Adding more users

Either add them to `realm-export.json` before first start, or use the Keycloak admin console at http://localhost:8080/admin (realm: `my-app` > Users > Add user).

## Adding more protected routes

1. Create a new page component in `frontend/src/pages/`
2. Add a route in `frontend/src/router.tsx` with the same `beforeLoad` auth guard as `dashboardRoute`
3. Add a protected tRPC procedure in `backend/src/router.ts` using `protectedProcedure`

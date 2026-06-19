# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SDN302 Assignment 4 — a quiz-management app split into two independent packages:

- `api/` — Express 5 + Mongoose REST API (TypeScript, CommonJS), scaffolded from `express-generator-typescript`.
- `web/` — React 19 SPA built with Vite, Redux Toolkit, and React Bootstrap (ESM).

There is no top-level workspace; each package has its own `package.json` and is built/run on its own. Both contain `pnpm-lock.yaml` and `pnpm-workspace.yaml`, but the npm scripts and READMEs use `npm` — commands below use `npm` to match.

## Commands

Run these **from inside `api/` or `web/`** (not the repo root).

### API (`cd api`)
- `npm run dev` — dev server with hot reload (nodemon + ts-node). **Uses SWC, which does NOT typecheck.**
- `npm run type-check` — `tsc --noEmit`. Run this separately; `dev`/`build` via SWC won't catch type errors.
- `npm run lint` — ESLint (type-checked rules; flat config in `eslint.config.ts`).
- `npm run format` — Prettier.
- `npm run build` — runs lint, then compiles with `tsconfig.prod.json` into `dist/`.
- `npm start` — runs the built `dist/main.js` (build first).
- Tests: `vitest` is installed but **no `test` script is wired up** (the README's `npm test` does not exist yet).

### Web (`cd web`)
- `npm run dev` — Vite dev server (default port 5173).
- `npm run build` — `tsc -b` then `vite build`.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` / `npm run format` — ESLint / Prettier.

### Full stack via Docker
- `docker compose up` — Mongo + API + Web (dev targets, source volume-mounted, hot reload). Reads root `.env` (copy from `.env.example`).
- `docker compose -f docker-compose.prod.yml up` — production targets (web served by nginx on port 80).

## Architecture

### API: layered routes → services → models
Request flow per resource (`auth`, `question`):

1. **Route** (`src/routes/*.route.ts`) — defines HTTP endpoints, attaches auth + Zod validation middleware, calls a service, shapes the response. Handlers are wrapped in `asyncHandler` (`src/lib/utils.ts`) so thrown errors propagate to the central error handler — no try/catch in handlers.
2. **Service** (`src/services/*.service.ts`) — business logic and Mongoose access. Services are plain async functions and **throw typed `Error` subclasses** (e.g. `QuestionNotFoundError`, `ForbiddenError`, `InvalidCredentialsError`, `UsernameAlreadyTakenError`) instead of sending responses.
3. **Model** (`src/models/*.ts`) — Mongoose schemas; types derived via `InferSchemaType`.

Routes are assembled in `src/router.ts` and mounted under `/api/*` in `src/main.ts`.

**Central error handling (important pattern):** `src/router.ts` ends with one error-handling middleware that maps each domain error class to an HTTP status via `instanceof` checks, falling back to 500. To surface a new error as a specific status code: define an `Error` subclass in the service, throw it, and add a matching `instanceof` branch in `router.ts`. Validation failures (400) are emitted directly by `validateBody`.

**Validation:** `validateBody(schema)` (`src/middleware/validate.ts`) is a Zod middleware that replaces `req.body` with the parsed value and threads `z.infer<T>` into the handler's type, so `req.body` is typed downstream. Pair it with `asyncHandler<InputType>(...)` to type the handler.

**Auth:** JWT signed/verified with `jose` (HS256) in `src/lib/authentication.ts`. The token is set as an **httpOnly cookie named `token`** at login (not returned in the body). `verifyUser` / `verifyAdmin` middleware gate routes and populate `req.user` (typed globally via `src/types/express.d.ts`). Question update/delete is authorized for the author **or** any admin.

**Config:** `src/config/env.ts` validates `process.env` with Zod at startup and **exits the process if invalid**. Always import the typed `env` object from there; reading `process.env` directly is flagged by the `no-process-env` ESLint rule.

**Known incomplete areas (assignment scaffold):**
- `src/services/auth.service.ts` stores and compares passwords **in plaintext** (`bcryptjs` is a dependency but unused) — hashing is not yet implemented.
- `src/models/Quiz.ts`, `src/routes/user.route.ts`, `src/services/user.service.ts` are empty stubs; user routes are not mounted in `router.ts`.

### Web: Redux Toolkit + thunks as the API client
- **Store** (`src/store.ts`) wires `auth` and `questions` slices. There is no separate API/HTTP client layer — **each slice's `createAsyncThunk` calls `fetch` directly**. New server interactions go in a slice thunk following the existing pattern.
- All requests use `credentials: "include"` so the httpOnly auth cookie is sent. Base URL comes from `import.meta.env.VITE_API_URL` (defaults to `http://localhost:3000`).
- **Auth persistence:** the JWT lives in the httpOnly cookie (invisible to JS); the slice mirrors the user object in `localStorage` under `currentUser` to survive reloads. Logout clears localStorage only.
- **Routing** (`src/main.tsx`, react-router v7): public `/login`, `/register`, `/dashboard`; admin `/admin/question`, `/admin/quiz`. `src/components/AdminLayout.tsx` guards admin pages **client-side** (redirects unauthenticated → `/login`, non-admin → `/dashboard`).
- **Forms:** Formik + Yup (e.g. `src/routes/admin/Question.tsx`). Note the validation shapes are duplicated — Yup on the client, Zod on the server — and must be kept in sync.
- **UI:** React Bootstrap components with Bootstrap CSS imported globally in `main.tsx`. The Vite alias `@` → `src/` is configured but most imports are relative. (This package was recently migrated off shadcn/Tailwind — ignore stale Tailwind references.)

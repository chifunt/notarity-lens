# Milestones

## Sprint 0: Safety and repo inspection

- Status: complete
- Scope: inspect the repository, verify `_context` is not tracked, tighten ignore rules, and avoid committing secrets.
- Notes:
  - `_context` is present locally and ignored.
  - `apps/api/.env.local` is present locally and ignored.
  - Only `.env.example`, `.gitignore`, and `LICENSE` were tracked at start.
- Next: configure the pnpm workspace and app package skeleton.

## Sprint 1: Workspace setup

- Status: complete
- Scope: create the pnpm workspace, Vite web app, Hono API app, shared package skeletons, TypeScript configs, and placeholder env examples.
- Checks:
  - `pnpm install` succeeds after approving the required `esbuild` build scripts.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds with no test files yet.
  - `pnpm build` succeeds.
  - Built API `GET /health` returns `{ "ok": true }`.
- Next: add shared Zod schemas and persona fixtures for Joshua, Robert, and Elizabeth.

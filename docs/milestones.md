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

## Sprint 2: Fixtures and schemas

- Status: complete
- Scope: add shared Zod contracts for evidence, field status, inferred fields, extracted documents, price lines, Notarity product selections, appointment payloads, drafts, and persona fixtures.
- Fixture coverage:
  - Joshua happy path with exact critical payload, price lines, and canonical filename mapping.
  - Robert fallback route for Lithuania.
  - Elizabeth edge-case route for Austria with participant ambiguity.
- Checks:
  - `pnpm --filter @notarity-lens/shared test` succeeds.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: implement the deterministic Notarity core: condition engine, product resolver, file map, price helper, payload builder, and tests.

## Sprint 3: Deterministic Notarity core

- Status: complete
- Scope: implement documented condition operators, country/product routing, timeslot label selection, canonical filename mapping, price summing, and deterministic Joshua payload generation.
- Tests:
  - ES route exposes the NIE path.
  - NIE application auto-adds NIE Personal Data.
  - AT route uses the Austria branch.
  - generic non-AT/non-ES route uses the generic branch.
  - Joshua payload critical fields match the expected booking.
  - product filenames match normalized multipart filenames.
  - Joshua price lines sum to EUR 580.
- Checks:
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: add Hono API mock routes and live-safe Notarity/AI client skeletons.

## Sprint 4: API mock server

- Status: complete
- Scope: add Hono routes for fixtures, upload metadata, mock extraction, mock inference, booking form, products, timeslots, price, and submit.
- Safety:
  - Mock mode is the default.
  - Live submit is blocked unless `ALLOW_LIVE_SUBMIT=true`.
  - Real Notarity client reads env placeholders and does not log credentials.
- Tests:
  - health route
  - fixture route
  - mock infer route
  - mock price route
  - mock submit route
- Checks:
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
  - Built API manually returns Joshua fixture, EUR 580 mock price, and mock submit success.
- Next: build the web flow using the Lovable design reference and connect it to the mock API.

## Sprint 5/6: Joshua happy path web flow

- Status: complete
- Scope: replace the placeholder web app with a routed Lens flow using the Lovable reference structure and calm Notarity-style UI.
- Screens:
  - `/` upload/intake with “Load Joshua demo” and upload-later path.
  - `/lens/analyze` document list, canonical filename mapping, reading progress, and receipt sidebar.
  - `/lens/evidence` split evidence/document panel and inferred fields.
  - `/lens/country` country-of-use semantics and confirmation.
  - `/lens/plan` product route and required companion document.
  - `/lens/cost` mock-priced receipt and preparation timeline.
  - `/lens/appointment` participant, timeslot, and shipping summary.
  - `/lens/review` grouped final review, payload preview, submit gating, and mock submit CTA.
  - `/lens/success` mock booking success and next steps.
- Browser verification:
  - Start to success Joshua flow works against local API.
  - Receipt shows EUR 580 from mock price endpoint.
  - Mock submit returns a `mock_appt_*` id.
  - Desktop review screenshot checked.
  - Mobile review layout checked; submit is gated unless required fields were confirmed.
- Checks:
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: add the DeepSeek prompt/schema package and live-safe AI adapter fallback, then document setup and demo.

## Sprint 7/8: AI and live-safe adapters

- Status: complete for P0 mock mode; live submit remains deliberately gated.
- Scope:
  - Add backend-only OpenAI-compatible DeepSeek client.
  - Add strict extraction prompt and schema exports in `@notarity-lens/ai`.
  - Validate live AI JSON with Zod.
  - Fall back to Joshua fixture when `MOCK_AI=true`, no key is configured, or live AI output fails validation.
  - Keep Notarity live reads and price behind `MOCK_NOTARITY=false`.
  - Keep live submit blocked unless explicitly enabled; multipart live submit is documented as not enabled for public demo safety.
- Tests:
  - Inference mapper maps NIE and Spanish tax authority language to ES.
  - New York maps to billing/residence, not country of use.
  - Barcelona maps to shipping/representative evidence.
  - Multiple countries produce `needs_review`.
- Checks:
  - `pnpm typecheck` succeeds from a clean build-output state.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: add README, REPORT, architecture docs, and demo checklist; run final verification.

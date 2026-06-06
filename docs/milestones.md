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

## Sprint 10: Tests, docs, and demo prep

- Status: complete
- Scope: add public setup docs, report, architecture notes, and a Joshua demo checklist.
- Artifacts:
  - `README.md`
  - `REPORT.md`
  - `docs/architecture.md`
  - `docs/demo-checklist.md`
- Checks:
  - `pnpm install` succeeds.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
  - `git ls-files _context` returns no tracked context files.
  - Secret scan found no committed token or password; only runtime header construction code matched.
- Next: final completion audit against the P0 acceptance criteria.

## Sprint 11: Lovable visual alignment pass A

- Status: complete
- Scope: align the real web app with the Lovable export's first-screen structure, visual tokens, shell, and analyze-step behavior.
- Changes:
  - Added the official Notarity logo asset to the web public bundle and used it in the app header.
  - Replaced the earlier shell with the Lovable-style max-width header, segmented progress bar, sticky right rail, and Notarity color tokens.
  - Reworked `/` into the Lovable-style centered upload card with secondary scan/upload-later actions.
  - Replaced user-facing "demo route" language with "sample request" wording so Joshua is a reliable sample persona, not a product mode.
  - Changed `/lens/analyze` into an automatic backend-style progress sequence that advances to evidence when the draft is ready.
- Intentional differences from the Lovable export:
  - Kept the step icons inside the horizontal progress bar because they improve scan speed without changing the segmented timeline model.
  - Kept the PRD route order with cost before appointment/review; the Lovable export jumps from plan to review, but the research and scope lock require early, itemized cost.
  - Kept letter spacing neutral for accessibility and predictable fit across mobile widths.
- Verification:
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
  - Browser check: desktop start page, sample-request analyze transition, evidence arrival, and mobile start page layout verified at `390x844`.
- Next: align the evidence screen with Lovable's document tabs while adding highlighted cited quotes across all uploaded documents.

## Sprint 12: Evidence tabs and cited-quote highlights

- Status: complete
- Scope: make `/lens/evidence` behave like the Lovable evidence review screen while adding the missing inspection depth requested in the critique.
- Changes:
  - Replaced the static document list with a tabbed document evidence panel.
  - Added per-document citation counts in tabs and per-page citation counts inside the active document.
  - Highlighted cited quote ranges directly in the extracted document text.
  - Made field-card evidence chips clickable so selecting a citation switches the active document tab.
  - Updated evidence chips, inference cards, and status badges to use the Notarity/Lovable token system.
- Evidence handling decision:
  - Some fixture quotes overlap, such as `Foreign Identity Number (NIE)` inside `obtaining a Foreign Identity Number (NIE)`.
  - The UI highlights the merged span in the document text and still renders each citation as a chip, so all evidence remains inspectable without invalid nested highlights.
- Verification:
  - Browser check: desktop evidence screen shows both document tabs and highlighted cited quotes.
  - Browser check: clicking the `NIE personal details form` field-card citation switches to the personal-details document tab.
  - Browser check: mobile evidence layout stacks without text overlap at `390x844`; DOM has one app shell despite a full-page screenshot stitching artifact.
- Next: continue Lovable alignment for country, route, cost, appointment, review, and success screens, then add deeper unsure/help flows.

## Sprint 13: Remaining route visual alignment

- Status: complete
- Scope: bring the country, route, cost, appointment, review, and success screens into the same Lovable/Notarity component language.
- Changes:
  - Tokenized country semantics, route cards, receipts, preparation timeline, review rows, payload preview, error banner, and success state.
  - Added Lovable-style summary cards to final review.
  - Reworked appointment into participant, slot, and explanatory side panels instead of three generic summary tiles.
  - Removed the duplicate receipt rail from the cost screen; the main cost screen now owns the itemized price panel.
  - Reset state when starting another booking from success.
- Intentional differences from the Lovable export:
  - Kept cost before appointment and review because the PRD says cost should be shown early as line items before the user proceeds.
  - Kept the safe fixture timeslot visible as an explicit ID because product IDs, timeslot IDs, and prices must not be invented by AI.
- Verification:
  - Browser check: full sample flow still reaches `/lens/success` after the polish.
  - Browser check: desktop review and appointment screens visually inspected.
  - Browser check: mobile appointment and review have no horizontal overflow at `390x844`.
  - Palette scan found no remaining old `slate`, `violet`, `emerald`, `blue`, `rose`, `amber`, or `tracking-*` classes in the Lens UI files touched.
- Next: add uncertainty/help affordances and deeper assistant-like support for "I am not sure" without submitting or changing deterministic payloads.

## Sprint 14: Country uncertainty support

- Status: complete
- Scope: turn the country screen's `I am not sure` control into a useful assistant-like support surface.
- Changes:
  - Added an inline help panel explaining why Spain is suggested as the country of use.
  - Shows the country evidence chips directly in the help panel.
  - Adds a `Show cited evidence` action that routes back to `/lens/evidence`.
  - Keeps `Confirm Spain` as the only state-changing action in the panel.
- Safety decision:
  - The help panel explains and links evidence, but does not let a conversational answer change country, products, price, or payload. Deterministic confirmation remains the gate.
- Verification:
  - Browser check: `I am not sure` opens the panel.
  - Browser check: `Show cited evidence` routes back to `/lens/evidence`.
- Next: expand uncertainty support to route/product, price, and appointment screens, then consider a backend-backed assistant endpoint with strict read-only guardrails.

## Sprint 15: Route uncertainty support

- Status: complete
- Scope: make the route screen's uncertainty control useful without allowing unsafe product mutations.
- Changes:
  - Replaced the previous inert `Change` control with an `I am not sure` panel.
  - Explains why the NIE route and companion Personal Data product are selected.
  - Shows deterministic Notarity product IDs in structured boxes.
  - Shows product evidence chips and a `Show cited evidence` action back to `/lens/evidence`.
- Safety decision:
  - Product IDs remain deterministic outputs from route rules. The help panel can explain and route to evidence, but does not let a conversational answer invent or swap product IDs.
- Verification:
  - Browser check: `I am not sure` opens the route help panel.
  - Browser check: `Show cited evidence` routes back to `/lens/evidence`.
- Next: expand uncertainty support to cost and appointment, then add automated browser smoke tests for the sample flow.

## Sprint 16: Web flow regression smoke test

- Status: complete
- Scope: add automated web-side regression coverage for the sample Lens flow.
- Changes:
  - Added `apps/web/src/features/lens/store.test.ts`.
  - Mocks `fetch` and exercises the actual Zustand Lens store.
  - Covers Joshua fixture loading, pricing, country confirmation, route confirmation, submit, and reset.
- Test-shape decision:
  - The web package currently has Vitest but no DOM-testing or Playwright dependency. This sprint adds a focused store/API smoke test without expanding dependencies.
- Verification:
  - `pnpm --filter @notarity-lens/web test` now runs one passing test instead of no web tests.
- Next: add cost and appointment uncertainty support, then consider a small browser-level smoke test dependency if the repo can afford it.

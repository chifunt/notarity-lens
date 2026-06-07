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

## Sprint 17: Appointment participant help

- Status: complete
- Scope: remove the remaining inert appointment control and replace it with real participant guidance.
- Changes:
  - Replaced `Add another participant` with `Who needs to join?`.
  - Added an inline participant help panel explaining that every signer must be listed and verify identity.
  - Kept the Joshua sample payload unchanged; the panel informs without mutating participants.
- Verification:
  - Browser check: appointment screen opens the participant help panel.
- Next: add cost uncertainty support and evaluate whether participant editing should become real state in a later non-P0 sprint.

## Sprint 18: Cost uncertainty support

- Status: complete
- Scope: explain the itemized price without implying Lens calculates final pricing itself.
- Changes:
  - Added `I am not sure about the price` to the receipt.
  - The panel explains that live mode must use the Notarity pricing endpoint as authoritative.
  - Keeps the visible line-item receipt and lists what can affect the endpoint result.
- Verification:
  - Browser check: cost screen opens the price help panel and keeps the itemized total visible.
- Next: add higher-signal automated UI smoke coverage or deepen real participant editing behind deterministic payload updates.

## Sprint 19: Review change actions

- Status: complete
- Scope: remove inert `Change` controls from final review.
- Changes:
  - Review rows now accept optional `onChange` actions.
  - Country, product, document, hard copy, price, participant, billing, and shipping rows route to the relevant screen.
  - Change buttons now have accessible names such as `Change Price`.
- Verification:
  - Browser check: `Change Price` on review routes back to `/lens/cost`.
- Next: add a small browser-level smoke test or continue replacing fixture-only UI with real editable state where it is safe.

## Sprint 20: Control audit cleanup

- Status: complete
- Scope: find and remove misleading inert controls in the Lens UI.
- Changes:
  - Audited Lens buttons and action cards.
  - Replaced the inert `Scan from phone` card with a real `Choose from this device` upload action wired to the file picker.
- Verification:
  - Button scan shows remaining controls are wired, disabled intentionally, or conditionally rendered with handlers.
- Next: decide whether to implement real editable participant state or add a browser-level smoke test dependency.

## Sprint 21: Display generalization pass A

- Status: complete
- Scope: reduce Joshua/Spain-specific rendering where fixture and payload data already provide the value.
- Changes:
  - Added `apps/web/src/features/lens/display.ts` for country names, product names, address formatting, file summaries, and shipping summaries.
  - Reused display helpers in inference cards, product route cards, country semantics, preparation timeline, review, appointment, and success.
  - Replaced several hardcoded review/success/appointment strings with fixture-derived values.
  - Kept product ID labels local in the web helper to avoid pulling shared fixtures into the client bundle.
- Remaining limitation:
  - The app still loads Joshua as the primary sample request and some start-page sample copy remains Joshua-specific. This sprint prepares for broader persona support without changing the core route state model.
- Verification:
  - Browser check: fresh sample flow reaches review and still renders Spain, NIE number application, NIE Personal Data, and Joshua shipping correctly.
- Next: introduce a real `loadPersona` store action and a safe sample selector, then audit which screens need deeper non-Joshua behavior.

## Sprint 22: Generic persona store loader

- Status: complete
- Scope: make the web Lens store load any supported sample persona while preserving the existing Joshua sample action used by the UI.
- Changes:
  - Added `loadPersona(persona)` to the Lens store and made `loadJoshuaDemo()` delegate to it.
  - Typed the fixture API helper to supported persona IDs.
  - Extended the web store smoke test to load and price the Robert fixture through the generic loader.
- Remaining limitation:
  - The UI still defaults to the Joshua sample. A user-facing selector needs a separate screen audit because non-Joshua fixture evidence and product inference depth are not yet equivalent to Joshua.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: add safe fixture evidence fallbacks and then expose a small sample selector only where the non-Joshua screens are ready.

## Sprint 23: Evidence document fallback

- Status: complete
- Scope: make the evidence viewer tolerate fixtures where inferred fields cite documents that are stored on the fixture rather than duplicated under the inference object.
- Changes:
  - Added a document resolver that prefers extraction documents and falls back to the fixture document list when needed.
  - Passed fixture documents into the evidence preview panel.
  - Added an empty document-text state instead of rendering a blank preview if neither source has pages.
  - Added web unit coverage for Joshua extraction documents and Robert fixture-document fallback.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
  - Browser check: sample evidence screen still opens with two document tabs and highlighted cited quotes.
- Next: expose a small sample selector on the start screen only after route/cost/appointment copy is audited for non-Joshua fixture data.

## Sprint 24: Sample selector readiness

- Status: complete
- Scope: expose the supported sample personas without keeping Joshua-only assumptions in the route and review screens.
- Changes:
  - Added start-screen sample request cards for Joshua, Robert, and Elizabeth.
  - Made product-route file, apostille, companion-product, and evidence-help copy derive from the active payload.
  - Replaced hardcoded review hard-copy/shipping text with payload-derived summaries and not-applicable statuses.
  - Generalized the empty-state sample copy.
  - Added display-helper tests for no-file products, hard-copy summaries, and nullable boolean labels.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: Robert selector path reaches final review with Signature notarisation, No hard copy shipment, and No files attached yet.
  - Browser check: Elizabeth selector path reaches final review with FlexCo Incorporation, United Kingdom billing context, and No hard copy shipment.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: mobile-smoke the selector and continue tightening remaining non-Joshua copy or gating defects.

## Sprint 25: Mobile selector verification

- Status: complete
- Scope: verify the sample selector and a non-Joshua review path at a narrow mobile viewport.
- Result:
  - No code changes were needed.
  - At `390x844`, the start screen shows all three sample request cards without horizontal overflow.
  - At `390x844`, Elizabeth reaches final review without horizontal overflow.
  - Mobile review shows FlexCo Incorporation and No hard copy shipment.
- Verification:
  - Browser check: mobile selector and Elizabeth review path pass at `390x844`.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: replace remaining route-default assumptions with explicit sample/upload mode state so upload-later and selected samples do not rely on the Joshua fallback.

## Sprint 26: Explicit sample loading

- Status: complete
- Scope: stop loading Joshua implicitly when a user enters the analyze flow without selecting a sample.
- Changes:
  - Removed the `/lens/analyze` auto-load effect that silently fetched Joshua when no fixture existed.
  - Changed file selection to enter analyze without substituting Joshua sample data.
  - Made the default sample buttons say Joshua explicitly.
  - Updated the empty state to explain that no draft is loaded yet and a sample request must be chosen.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: direct `/lens/analyze` stays on the explicit empty state and does not auto-load Joshua.
  - Browser check: `Use Joshua sample request` from the analyze empty state advances to evidence.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: add a real uploaded-file draft path or remove upload wording until uploaded PDFs can produce a complete deterministic payload.

## Sprint 27: Uploaded document metadata path

- Status: complete
- Scope: make PDF selection a real metadata upload path without pretending uploaded PDFs already have a complete Notarity payload.
- Changes:
  - Added a web multipart upload API helper for `/api/documents/upload`.
  - Added store state for uploaded document metadata.
  - File selection now uploads selected PDFs and clears any active sample fixture/price.
  - Analyze shows uploaded document metadata separately from complete sample drafts.
  - Added web store coverage proving uploads do not create a sample fixture.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Manual API check: multipart `POST /api/documents/upload` returns source `upload` and uploaded document metadata.
  - Browser check: start screen still renders the PDF chooser and all three sample cards.
  - Browser check: direct `/lens/analyze` still shows the explicit no-draft state.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: implement real extraction-to-payload generation for uploaded documents or keep uploaded files as review-only metadata.

## Sprint 28: Sample picker layout cleanup

- Status: complete
- Scope: remove nested-card sample picker layout and make every no-draft state offer all supported sample personas.
- Changes:
  - Extracted a reusable sample request grid.
  - Changed the start-screen sample section into an unframed section with individual sample cards.
  - Added the same sample picker below the no-draft analyze empty state.
  - Added the same sample picker below uploaded document metadata.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: start screen shows exactly three sample cards.
  - Browser check: direct analyze empty state shows exactly three sample cards and Robert can be selected from there to reach evidence.
  - Browser check: start and analyze sample pickers have no horizontal overflow at `390x844`.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: decide whether uploaded document metadata should remain review-only or drive a constrained extraction-to-payload path.

## Sprint 29: Documentation refresh

- Status: complete
- Scope: align public docs and demo notes with the current selector and upload-metadata behavior.
- Changes:
  - Updated README demo steps from the old Load Joshua demo wording to the current Joshua sample card.
  - Documented Robert and Elizabeth as fallback sample branches.
  - Documented arbitrary PDF upload as metadata-only until payload generation exists.
  - Updated report limitations and architecture notes to match the implemented upload metadata path.
- Verification:
  - Stale docs wording scan completed; remaining old wording is historical milestone context or intentional limitations.
  - `pnpm typecheck` succeeds.
- Next: decide whether uploaded document metadata should remain review-only or drive a constrained extraction-to-payload path.

## Sprint 30: Mock submit CTA accuracy

- Status: complete
- Scope: align the final review submit CTA with mock vs live mode.
- Changes:
  - Final review now labels the ready submit action as `Create mock booking request` when the current price response is from mock mode.
  - Live-priced drafts keep the generic `Create booking request` label.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: Joshua review shows `Create mock booking request` and no generic create-booking CTA in mock mode.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue acceptance audit against demo script and polish any remaining wording mismatches.

## Sprint 31: Final acceptance audit

- Status: complete
- Scope: verify the P0 MVP against the pasted acceptance checklist.
- Verification:
  - `pnpm install --frozen-lockfile` succeeds.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
  - `git ls-files _context` returns no tracked context files.
  - Secret scan found only placeholders, documentation references, and runtime header construction.
  - Browser check: Joshua sample reaches evidence with highlighted citations, country confirmation, product route confirmation, €580 cost, appointment, final review, payload preview, `Create mock booking request`, mock submit success, mock appointment id, and success summary.
- Result:
  - P0 Joshua demo is ready in mock mode.
  - Robert and Elizabeth are available as fallback sample branches.
  - Arbitrary uploaded PDFs are honestly handled as metadata-only until extraction-to-payload generation is implemented.

## Sprint 32: Deep-link sample recovery

- Status: complete
- Scope: make guarded Lens routes recoverable with any supported sample persona instead of only Joshua.
- Changes:
  - Deep-linked no-draft screens now show the reusable sample picker below the no-draft message.
  - Users can load Joshua, Robert, or Elizabeth from country, route, cost, appointment, review, success, or evidence routes when no draft exists.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: direct `/lens/country` shows all three sample cards with no draft loaded.
  - Browser check: selecting Elizabeth from direct `/lens/country` loads the Austria country semantics screen in-place.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue deep-link and edge-state audits across the guarded flow.

## Sprint 33: Store stale-state hardening

- Status: complete
- Scope: prevent stale drafts, prices, upload metadata, or loading state from surviving sample-load failures and resets.
- Changes:
  - `loadPersona` now clears the active fixture, upload metadata, price, and submit result before fetching a new sample.
  - Failed sample loads now leave an explicit empty/error state instead of showing the previous draft behind the error.
  - `reset` now clears `loading` in addition to draft data and errors.
  - Added web store regression coverage for failed sample loading and reset cleanup.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: switching from Joshua to Robert shows Robert evidence and no stale Joshua text.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue store and UI state audits, especially race-prone navigation and failure states.

## Sprint 34: Sample picker accessibility polish

- Status: complete
- Scope: improve accessible control names and upload-state behavior in the start/sample picker area.
- Changes:
  - Sample request cards now expose concise accessible names such as `Use Robert Stevens sample request`.
  - The hidden file input clears after upload handling so selecting the same PDF again can trigger another upload.
  - Secondary file/continue controls are disabled while an upload or sample load is in progress.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: sample request cards expose concise accessible names for Joshua, Robert, and Elizabeth.
  - Browser check: selecting Robert via the accessible sample-card name still reaches Robert evidence.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue accessibility and interaction audits for the remaining flow controls.

## Sprint 35: Participant summary robustness

- Status: complete
- Scope: remove first-participant-only assumptions from appointment and review rendering.
- Changes:
  - Added a participant summary display helper.
  - Appointment now lists every participant email from the payload.
  - Participant help text reports how many participants are currently in the payload instead of claiming the persona is the only signer.
  - Final review participant row now summarizes all participant emails.
  - Added display-helper coverage for multi-participant summaries.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: Elizabeth appointment lists participant emails.
  - Browser check: participant help reports the payload participant count.
  - Browser check: Elizabeth final review includes the participant email.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: keep auditing copy that may overstate certainty around inferred people and participant ambiguity.

## Sprint 36: Required confirmation gating

- Status: complete
- Scope: ensure final review cannot submit while any required inference field remains unresolved.
- Changes:
  - Added review-readiness helpers for required and unresolved confirmation fields.
  - Final review now blocks submit when unresolved required confirmations remain.
  - Final review surfaces unresolved fields in a dedicated review panel.
  - Participant rows show `needs_review` when a people inference is still unresolved.
  - Added regression coverage for Joshua confirmation readiness and Elizabeth participant ambiguity.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: Elizabeth review shows unresolved Participant ambiguity and no mock submit CTA.
  - Browser check: Joshua review remains mock-submit ready after country and route confirmations.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: add clearer resolution paths for non-P0 ambiguity cases, especially participant review.

## Sprint 37: Participant ambiguity resolution

- Status: complete
- Scope: give users a clear way to resolve participant ambiguity that blocks final review.
- Changes:
  - Added a `confirmPeople` store action.
  - Appointment participants now show a status badge.
  - When people inferences are unresolved, appointment shows `Confirm listed participants`.
  - Confirming listed participants marks people inference fields as confirmed so final review can proceed.
  - Added store coverage for participant inference confirmation.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: Elizabeth appointment shows `Confirm listed participants` while participant ambiguity is unresolved.
  - Browser check: confirming listed participants removes the unresolved panel and enables the mock submit CTA on review.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue adding explicit resolution paths for any remaining blocked review states.

## Sprint 38: Success route guard

- Status: complete
- Scope: prevent the success route from implying a booking request exists when no submit result is present.
- Changes:
  - Success now shows the booking-ready summary only when `submitResult` exists.
  - Direct success visits with a loaded draft but no submit result show a no-booking-created state and a return-to-review action.
  - Payload preview is hidden on success until a booking request has actually been created.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: direct `/lens/success` with no loaded draft shows the guarded sample picker.
  - Browser check: choosing Joshua from the success-route sample picker shows `No booking request created yet`, hides payload preview, and returns to final review.
  - Browser check: normal Joshua mock submit still shows `Booking request ready`, the `mock_appt_...` id, payload preview, and the start-another-booking action.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue route guard audits for other direct-navigation edge cases.

## Sprint 39: Review resolution actions

- Status: complete
- Scope: make blocked final-review states honest and directly actionable.
- Changes:
  - Added review status aggregation so inferred products, people, billing, unresolved shipping, and unresolved hard-copy state are not shown as confirmed prematurely.
  - Added per-field actions in the unresolved-confirmations panel for country, shipping, apostille, hard copy, and participant ambiguity.
  - Review actions route users to the screen that can resolve the blocker instead of relying on the lower review table.
- Verification:
  - `pnpm --filter @notarity-lens/web typecheck` succeeds.
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - Browser check: unconfirmed Joshua review shows inferred product/billing/participant rows, review-required shipping and hard-copy rows, and routes `Review hard copy` to Route.
  - Browser check: Elizabeth participant ambiguity shows `Review participants`, routes to Appointment, and exposes `Confirm listed participants`.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue auditing review and route summaries for stale or misleading state.

## Sprint 40: Stepper accessible-name polish

- Status: complete
- Scope: make duplicated top-stepper controls distinguishable to assistive tech and browser automation.
- Changes:
  - Progress-bar step links now expose names like `Go to Evidence step`.
  - Visible text step links keep their concise step names, so reachable progress markers and labels no longer collide on exact accessible-name checks.
- Verification:
  - `pnpm --filter @notarity-lens/web typecheck` succeeds.
  - Browser check: on the Joshua evidence screen, exact `Evidence` and `Go to Evidence step` links each resolve once.
  - Browser check: exact `Analyze` and `Go to Analyze step` links each resolve once, while future `Success` remains unavailable.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue accessibility checks for repeated controls and mobile stepper behavior.

## Sprint 41: Shipping review route alignment

- Status: complete
- Scope: make the final-review shipping row send users to the screen that can resolve shipping confirmation.
- Changes:
  - Changed `Change Shipping` from Evidence to Country, matching the unresolved-field `Review shipping` action and the screen that confirms country/shipping context.
- Verification:
  - `pnpm --filter @notarity-lens/web typecheck` succeeds.
  - Browser check: unconfirmed Joshua review exposes one `Change Shipping` action and routes it to `/lens/country`.
  - Browser check: the destination shows the country question, shipping context, and `Confirm Spain`.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue checking review `Change` destinations against where each field can actually be resolved.

## Sprint 42: Joshua sample name consistency

- Status: complete
- Scope: remove the mismatch between the sample selector name and the Joshua fixture/payload name.
- Changes:
  - Renamed the Joshua sample card from `Joshua Blake` to `Joshua Timms`.
  - Updated README and demo checklist instructions to match the fixture and visible flow.
- Verification:
  - `pnpm --filter @notarity-lens/web typecheck` succeeds.
  - `rg "Joshua Blake" README.md docs apps packages` returns no matches.
  - Browser check: exact `Use Joshua Timms sample request` appears once, the old Joshua Blake accessible name is absent, and selecting the card reaches Evidence with Joshua Timms text.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue checking visible sample names against fixture identities and documentation.

## Sprint 43: Submit readiness blocker parity

- Status: complete
- Scope: make the final-review blocker panel list every field that can disable submit.
- Changes:
  - Country and product-route inference fields are now always part of review readiness, even when their fixture metadata does not set `requiresConfirmation`.
  - Optional people/address/apostille/hard-copy fields still participate only when marked as requiring confirmation.
  - Product blockers now route to Route with distinct `Review product` and `Review companion` actions.
  - Added readiness coverage for Joshua product blockers and Robert country confirmation.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - `pnpm --filter @notarity-lens/web typecheck` succeeds.
  - Browser check: direct Robert review shows a country blocker, keeps submit disabled, and routes `Review country` to Lithuania confirmation.
  - Browser check: direct Joshua review shows product, companion, country, shipping, apostille, and hard-copy blockers with one action each, and `Review product` routes to Route.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue checking submit gating against visible blocker explanations for each persona.

## Sprint 44: Submit readiness single source

- Status: complete
- Scope: remove duplicated submit-readiness logic from Final review.
- Changes:
  - Added a `readyForSubmit` helper that derives submit readiness from price availability and unresolved readiness blockers.
  - Final review now uses the shared helper instead of duplicating country/product/status checks inline.
  - Added coverage that confirmed Joshua is ready only when price exists and unconfirmed Robert is not ready.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - `pnpm --filter @notarity-lens/web typecheck` succeeds.
  - Browser check: confirmed Joshua review exposes `Create mock booking request` without the required-fields blocker.
  - Browser check: unconfirmed Robert review hides submit, shows `Confirm required fields first`, and exposes `Review country`.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue reducing duplicated readiness and status derivation across review surfaces.

## Sprint 45: API persona validation hardening

- Status: complete
- Scope: prevent invalid persona values from throwing or falling through on API routes.
- Changes:
  - Shared the same persona enum across fixture params and persona request bodies.
  - `/api/documents/upload`, `/api/extract`, and `/api/infer` now return controlled JSON errors for unknown personas instead of casting or throwing.
  - Added API coverage for unknown fixture, inference, and upload fixture personas.
- Verification:
  - `pnpm --filter @notarity-lens/api test` succeeds.
  - `pnpm --filter @notarity-lens/api typecheck` succeeds.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue API input validation audits for payload and multipart edge cases.

## Sprint 46: API payload validation hardening

- Status: complete
- Scope: prevent invalid price/submit payloads from surfacing as server errors.
- Changes:
  - Added safe record handling before checking body keys so JSON `null` and other non-object bodies cannot trip `Object.keys`.
  - `/api/price` and `/api/submit` now use safe appointment-payload parsing and return controlled `Invalid appointment payload` errors.
  - Added API coverage for invalid price and submit payloads.
- Verification:
  - `pnpm --filter @notarity-lens/api test` succeeds.
  - `pnpm --filter @notarity-lens/api typecheck` succeeds.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue API validation audits around empty/default request bodies and live-submit failure modes.

## Sprint 47: Submit failure navigation guard

- Status: complete
- Scope: keep users on Final review when submit fails instead of navigating to a no-booking success state.
- Changes:
  - `submitBooking` now returns a boolean success value.
  - Final review navigates to Success only after a successful submit.
  - Final review now renders the shared error banner so submit failures are visible in place.
  - Added store coverage for submit failure without stale submit results.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - `pnpm --filter @notarity-lens/web typecheck` succeeds.
  - Browser check: confirmed Joshua review still reaches Success after successful mock submit.
  - Browser check: success page shows booking-ready state and a `mock_appt_...` id after submit.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue checking failure paths for load, upload, price, and submit actions.

## Sprint 48: Stale submit result cleanup

- Status: complete
- Scope: prevent old submit results from surviving a later failed submit attempt.
- Changes:
  - `submitBooking` clears `submitResult` before each submit request starts.
  - Strengthened submit-failure coverage to start with a previous result and assert it is cleared on failure.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - `pnpm --filter @notarity-lens/web typecheck` succeeds.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue checking stale state around upload and sample-load failures.

## Sprint 49: Web API error-message propagation

- Status: complete
- Scope: show useful server-provided JSON errors in web failure states.
- Changes:
  - Web API helpers now read `{ error }` from failed JSON responses before falling back to generic status text.
  - Submit-failure coverage now exercises a server JSON error and verifies the Review error state receives the specific message.
- Verification:
  - `pnpm --filter @notarity-lens/web test` succeeds.
  - `pnpm --filter @notarity-lens/web typecheck` succeeds.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue checking load, upload, and price failure messages in the web flow.

## Sprint 50: Upload MIME validation

- Status: complete
- Scope: enforce PDF-only uploads on the backend, not just through the browser file picker.
- Changes:
  - Added server-side PDF validation for `/api/documents/upload`.
  - Uploads now reject non-PDF files with `Only PDF documents are supported`.
  - Added API coverage for non-PDF upload rejection.
- Verification:
  - `pnpm --filter @notarity-lens/api test` succeeds.
  - `pnpm --filter @notarity-lens/api typecheck` succeeds.
  - `pnpm typecheck` succeeds.
  - `pnpm lint` succeeds.
  - `pnpm test` succeeds.
  - `pnpm build` succeeds.
- Next: continue hardening upload edge cases around multiple files and mixed-validity batches.

# Notarity Lens

START HACK Hackathon Vienna 2026 project for Notarity.

Notarity Lens is a document-first booking assistant for remote notarisation. It
reads uploaded documents, extracts the facts that matter, shows the exact
evidence behind each inference, asks the user to confirm or edit the details, and
turns the result into a Notarity-ready booking request.

Core pitch:

> Notarity already made notarisation remote. We made the confusing part before
> the appointment understandable.

## Research Story

The project started from a simple observation in the START HACK Notarity brief:
the appointment itself is already remote, but the preparation work before the
appointment still asks users to understand legal, geographic, and product
details they often cannot confidently interpret.

Our research focused on the gap between "I have this document" and "I know which
Notarity booking to create." The risky part is not only reading a PDF. It is
understanding what the document is for, where it will be used, which country
controls the booking route, which supporting documents are required, whether a
hard copy or apostille is needed, who must sign, and what the user should expect
to pay.

The clearest research finding was that country semantics must be kept separate.
A document can mention a person's nationality, home address, billing country,
shipping destination, and country of use in the same page. For Notarity, those
are not interchangeable. The most important example in the demo is Joshua Timms:
he lives and pays from the United States, but the notarised NIE application is
for Spain and the hard copy ships to Barcelona.

That shaped the product principle:

> The AI can read and explain evidence, but the user and deterministic booking
> logic must stay in control.

We tested that principle with the original sample personas and then added a
persona research matrix with generated PDFs. The matrix covered complete
documents, insufficient evidence, conflicting country signals, hard-copy and
apostille routing, and participant ambiguity. Those cases are documented in
`docs/persona-research-results.md` and `docs/persona-case-results.md`.

The conclusion was pragmatic: for the hackathon presentation, the best story is
not "we support every legal document." The strongest story is "we can turn a
real document set into a trustworthy Notarity booking path, show why each choice
was made, and ask for confirmation exactly where uncertainty matters." That is
why the final demo is Joshua-first while the broader persona set remains as a
regression and research harness.

## Tags

`START HACK 2026` `Vienna` `Notarity` `AI` `DeepSeek` `PDF extraction`
`document automation` `legaltech` `remote notarisation` `React` `Vite` `Hono`
`TypeScript`

## Demo Scope

The primary demo path is the Joshua Timms NIE application sample. The app is
currently tuned to make that live walkthrough feel complete and reliable:

- The upload screen is document-first, supports drag and drop, stages multiple
  PDFs before continuing, and no longer offers a fileless path.
- Demo sample requests are kept behind a collapsible demo section.
- The Joshua demo uses the actual reference PDFs from
  `_context/notarity-reference-materials/personas/joshua/documents`.
- Uploaded and demo PDFs can be previewed in the app, with tab navigation when a
  request has multiple documents.
- The Analyze screen waits for the real backend document read before allowing
  the user to continue.
- The Evidence screen shows editable inferred details, evidence chips, and the
  source PDF preview with document highlights.
- Joshua's participant email is prefilled from the demo data so the appointment
  step only needs confirmation.
- Country, route, review, cost, appointment, and success screens are wired into
  one guided booking flow.
- The interface includes motion polish, staggered screen transitions, animated
  cards, receipt updates, status badges, and reduced-motion support.

Additional sample personas exist for testing inference boundaries, including
cases where documents are complete and cases where the uploaded information is
not enough. The project direction for the final hackathon demo is Joshua-first.

## What Is Implemented

- Text-layer PDF extraction in the API using `pdfjs-dist`.
- Backend document upload endpoint with previewable uploaded files.
- Fixture PDF serving for demo samples.
- DeepSeek-backed inference when `MOCK_AI=false` and `DEEPSEEK_API_KEY` is set.
- Deterministic fallback inference for safe local demos.
- Editable evidence review for country of use, product, companion document,
  client details, billing country, shipping destination, apostille, hard copy,
  and participant email.
- Country semantics screen that separates country of use, billing/home country,
  and shipping destination.
- Product route selection for the NIE number application and the required NIE
  Personal Data companion document.
- Live receipt/sidebar pattern for multi-column screens.
- Mock-safe price, draft, and submit flow.
- Unit and API tests for payload generation, condition logic, pricing,
  inference mapping, fixtures, and smoke routes.

## Architecture

- `apps/web` - React, Vite, React Router, Tailwind CSS, Framer Motion, and
  Zustand.
- `apps/api` - Hono API server, PDF extraction, fixture serving, inference,
  draft, price, and submit routes.
- `packages/ai` - DeepSeek/OpenAI-compatible inference client and prompts.
- `packages/notarity` - Notarity payload, pricing, and submission integration
  boundary.
- `packages/shared` - Shared schemas, fixtures, and flow types.

Useful API routes:

- `GET /health`
- `GET /api/fixtures/:persona`
- `GET /api/fixtures/:persona/documents/:documentId/pdf`
- `POST /api/documents/upload`
- `POST /api/infer`
- `POST /api/draft`
- `POST /api/price`
- `POST /api/submit`

## Run Locally

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open the web URL printed by Vite. The default is <http://localhost:5173>, but
Vite may choose the next available port, such as <http://localhost:5174>, if the
default port is already in use.

API health runs at <http://localhost:8787/health>.

## Environment

Use `.env.example` as the source for placeholders. Do not commit real secrets.

Recommended demo-safe defaults:

```env
MOCK_NOTARITY=true
MOCK_AI=true
ALLOW_LIVE_SUBMIT=false
VITE_API_BASE_URL=http://localhost:8787
```

To use live DeepSeek inference locally:

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL_FAST=deepseek-v4-flash
DEEPSEEK_MODEL_REVIEW=deepseek-v4-pro
MOCK_AI=false
```

DeepSeek keys are backend-only. Never prefix DeepSeek secrets with `VITE_`.

Notarity integration flags:

```env
NOTARITY_API_BASE_URL=https://staging-api.notarity.com
NOTARITY_BOOKING_FORM_SLUG=start-vienna-hackathon
NOTARITY_ORIGIN=https://staging.notarity.com/#/my-companies/HpKfHmbViXxFEMzjtxln/appointment-requests
NOTARITY_BOOKING_FORM_ID=kmVXjYM937qB8JTYG2yH
NOTARITY_DRAFT_ID=vfniS9nfoq8nMpRqQj7Z
NOTARITY_BASIC_AUTH_USERNAME=
NOTARITY_BASIC_AUTH_PASSWORD=
NOTARITY_BEARER_TOKEN=
```

Live submit remains blocked unless `ALLOW_LIVE_SUBMIT=true` is explicitly set.
The hackathon demo should run in mock submit mode.

## Scripts

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Focused web checks:

```bash
pnpm --filter @notarity-lens/web lint
pnpm --filter @notarity-lens/web test
pnpm --filter @notarity-lens/web build
```

## Recommended Demo Path

1. Start the app with `pnpm dev`.
2. Open the web URL printed by Vite.
3. Expand the demo sample requests section.
4. Select the Joshua Timms demo sample.
5. Wait on Analyze until the documents are fully read.
6. Continue to Evidence and inspect the PDFs, highlights, evidence chips, and
   editable extracted details.
7. Confirm or edit the country of use, product route, companion document,
   client, address, apostille, hard copy, and participant email details.
8. Continue through Country, Route, Review, Cost, Appointment, and Success.
9. Use the final payload preview to show what would be submitted to Notarity.

## Demo Boundaries

- The Joshua fixture is the polished happy path for the START HACK Vienna 2026
  presentation.
- Text-layer PDFs are extracted. Scanned-image OCR is not implemented.
- DeepSeek inference is available when configured, but mock inference remains
  the default so demos do not depend on API keys or network availability.
- The LLM proposes extracted facts and evidence. Deterministic code still owns
  product IDs, timeslot IDs, prices, and final payload construction.
- Pricing and submission are mock-safe by default.

## Safety Notes

- `_context/` is ignored and must stay out of public commits.
- `.env`, `.env.*`, and `.env.local` are ignored; `.env.example` contains
  placeholders only.
- No API keys, Notarity credentials, or authorization headers should be logged.
- Final submit is user-confirmed and mock by default.

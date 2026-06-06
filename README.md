# Notarity Lens

Notarity Lens is a document-first guided booking prototype for the Notarity
hackathon.

Core pitch:

> Notarity already made notarisation remote. We made the confusing part before
> the appointment understandable.

The app reads or loads documents, shows evidence-backed inferred facts, asks the
user to confirm high-impact fields, builds a deterministic Notarity payload, gets
an itemized price, and submits a mock appointment request.

## What Works

- Joshua Timms demo flow from upload/intake to mock success.
- Evidence review for Spain, NIE, Joshua, New York billing, Barcelona shipping,
  apostille, and hard copy.
- Country semantics screen that separates country of use, billing/home, and
  shipping.
- Product route with NIE number application and the required NIE Personal Data
  companion document.
- Canonical filename mapping:
  `nie_personal_details-joshuatimms.pdf` maps to
  `nie_personal_details.pdf`.
- Mock price endpoint returns:
  - NIE number application: EUR 550
  - NIE Personal Data: EUR 0
  - Hard Copy including shipping: EUR 30
  - Total: EUR 580
- Final review, payload preview, submit gating, and mock submit success.
- Unit/API tests for payload generation, condition logic, pricing, inference
  mapping, fixtures, and API smoke routes.

## What Is Mocked

- PDF extraction uses Joshua fixture text.
- AI inference defaults to `MOCK_AI=true`.
- Notarity API defaults to `MOCK_NOTARITY=true`.
- Submit defaults to mock mode. Live submit is blocked unless explicitly enabled
  and the current safe skeleton still refuses multipart live submission.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open:

- Web: <http://localhost:5173>
- API health: <http://localhost:8787/health>

## Environment

Use `.env.example` as the source for placeholders. Do not commit real secrets.

Important flags:

```env
MOCK_NOTARITY=true
MOCK_AI=true
ALLOW_LIVE_SUBMIT=false
VITE_API_BASE_URL=http://localhost:8787
```

DeepSeek keys are backend-only:

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL_FAST=deepseek-v4-flash
DEEPSEEK_MODEL_REVIEW=deepseek-v4-pro
```

Never prefix DeepSeek secrets with `VITE_`.

## Scripts

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Demo Path

1. Open the app.
2. Click `Load Joshua demo`.
3. Review document analysis and filename mapping.
4. Review evidence for NIE, Spanish tax authorities, Barcelona, Joshua Timms,
   and New York.
5. Confirm Spain as the country of use.
6. Confirm the product route:
   - NIE number application
   - NIE Personal Data
7. Review the EUR 580 receipt and preparation timeline.
8. Review the final payload.
9. Create the mock booking request.

## Safety Notes

- `_context/` is ignored and must stay out of public commits.
- `.env`, `.env.*`, and `.env.local` are ignored; `.env.example` contains
  placeholders only.
- No API keys, Notarity credentials, or authorization headers are logged.
- The LLM never chooses product IDs, timeslot IDs, prices, or final payload
  fields. Deterministic code does that mapping.
- Final submit is user-confirmed and mock by default.

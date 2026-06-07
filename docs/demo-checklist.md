# Demo Checklist

## Before Demo

- [ ] `pnpm install` has completed.
- [ ] `.env` exists from `.env.example`.
- [ ] `MOCK_NOTARITY=true`.
- [ ] `MOCK_AI=true`.
- [ ] `ALLOW_LIVE_SUBMIT=false`.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes.
- [ ] `pnpm dev` is running.
- [ ] Open <http://localhost:5173>.

## 3-Minute Joshua Path

1. Click the `Joshua Timms` sample request card or `Use Joshua sample`.
2. Show both uploaded documents and canonical filename mapping.
3. Show evidence:
   - Foreign Identity Number (NIE)
   - Spanish tax authorities
   - Barcelona, Spain
   - Joshua Timms
   - New York address
4. Confirm Spain as country of use.
5. Point out:
   - country of use: Spain
   - billing/home: United States
   - shipping: Spain
6. Confirm product route:
   - NIE number application
   - NIE Personal Data as required companion document
7. Show receipt:
   - EUR 550
   - EUR 0
   - EUR 30
   - Total EUR 580
8. Show preparation timeline.
9. Show final review and payload preview.
10. Click `Create mock booking request`.
11. Show success screen and mock appointment id.

## Pitch Lines

- “The document becomes the form.”
- “We replace the legal guesswork before the form.”
- “AI prepares the route, evidence builds trust, the user confirms, and Notarity
  receives a valid payload.”

## Fallbacks

- If AI extraction is discussed, say mock mode loads the same schema returned by
  the backend inference route.
- If live pricing is unavailable, show the fixture price labeled as demo price.
- If live submit is unavailable, show the payload preview and explain that live
  submit is gated for safety.
- If Joshua breaks, return to the start screen and choose the Robert Stevens or
  Elizabeth Midgley sample request card.
- If arbitrary PDF upload is discussed, explain that the current P0 records
  uploaded document metadata but does not yet generate a complete Notarity
  payload from arbitrary PDFs.

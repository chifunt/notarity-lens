# Persona Research Results

## Research Frame

This sprint series uses the local deep research and planning pack as the acceptance frame:

- `_context/notarity-reference-materials/research/deep-research-report-1.md`
- `_context/notarity-reference-materials/research/deep-research-report-2.md`
- `_context/notarity-reference-materials/planning-pack/00-scope-lock.md`
- `_context/notarity-reference-materials/planning-pack/02-tech-spec.md`

The recurring requirements are:

- Users arrive with documents, so the flow must read the document first.
- Country semantics must stay separate: country of use, residence, billing, and shipping are different facts.
- Every important AI inference needs evidence.
- Missing PDF evidence is not a failure; it must become a review state.
- Product IDs, timeslot IDs, payload shape, and price totals must come from deterministic fixtures or the API, never from AI invention.
- The price receipt must stay line-item based and available before final review.

## Additional Persona Matrix

| Sprint | Persona | Case Type | Expected Result |
|---|---|---|---|
| 61 | Amara Okafor | Complete generic signature-notarisation route | Germany is inferred as country of use, Netherlands stays billing/residence, no hard copy, EUR 120 mock price. |
| 63 | Noah Chen | Insufficient destination evidence | Country evidence is missing, the review remains blocked until the user confirms the inferred route. |
| 64 | Sofia Rossi | Conflicting country semantics | Spain appears in the document while Italy appears in residence/billing context; country of use remains a high-signal review field. |
| 65 | Kenji Tanaka | Complete hard-copy/apostille route | Spain/NIE route uses hard copy and apostille evidence, but person/address facts differ from Joshua. |
| 66 | Priya Nair | Participant ambiguity | The document names an applicant and an authorized co-signer; participant setup remains unresolved until reviewed. |

## Result Log

| Sprint | Status | Notes |
|---|---|---|
| 60 | Complete | Added this matrix and a dependency-free fixture PDF writer so every new case can include a reproducible PDF artifact. |
| 61 | Complete | Added Amara Okafor with generated PDF, complete document evidence, `DE` country of use, `NL` billing/home, signature notarisation, no hard copy, and EUR 120 mock price. |
| 62 | Complete | Browser-tested Amara end to end. Evidence, country, route, cost, review, and mock submit are coherent; fixed the no-hard-copy country card so it no longer displays billing country as a shipment. |
| 63 | Complete | Added Noah Chen with generated PDF where the country of use is explicitly `not stated`. Browser confirms the evidence and country help show a review-needed state; tests confirm review blocks until country and route are confirmed. |
| 64 | Complete | Added Sofia Rossi with generated PDF containing Spain as country of use and Italy as billing/home. Browser confirms conflict status, separated country semantics, EUR 120 pricing, and a clean review after confirmation. |
| 65 | Complete | Added Kenji Tanaka with two generated NIE PDFs, Japan billing/home, Spain country of use, Valencia hard-copy shipping, apostille, companion product, and EUR 580. Browser confirms the full hard-copy route. |
| 66 | Complete | Added Priya Nair with generated PDF naming a possible co-signer. Browser confirms review blocks on participant ambiguity and clears after confirming listed participants. |
| 67 | Complete | Polished the eight-persona sample picker with responsive 1/2/4-column layout, case labels, and status badges. Browser confirms all personas/labels render on desktop and mobile without horizontal overflow. |
| 68 | Complete | Added `docs/persona-case-results.md` and a shared regression test that locks the eight-persona scenario mix: complete generic, missing evidence, conflict, hard-copy/apostille, and participant ambiguity. |
| 69 | Complete | Ran full automated verification and an all-persona Browser evidence sweep. Fixed Robert's legacy fixture so his name appears as evidence-backed participant output. |

# Persona Case Results

## Summary

The app now covers the original three personas plus five generated-PDF personas. The added cases exercise complete evidence, missing evidence, conflicting country semantics, hard-copy/apostille routing, and participant ambiguity.

| Persona | PDF Artifacts | Case Type | Initial Review State | Expected Output |
|---|---:|---|---|---|
| Joshua Timms | 2 context PDFs | Original hard-copy NIE route | Needs review | Spain country of use, US billing, Barcelona shipping, NIE + Personal Data, apostille, hard copy, EUR 580. |
| Robert Stevens | 1 context PDF | Original simple generic route | Inferred country/product | Lithuania country of use, signature notarisation, no hard copy, EUR 120. |
| Elizabeth Midgley | 1 context PDF | Original participant ambiguity | Needs review | Austria country of use, FlexCo route, UK business billing, participant ambiguity, jurisdiction-priced EUR 0 fixture. |
| Amara Okafor | 1 generated PDF | Complete generic route | Inferred country/product | Germany country of use, Netherlands billing/home, signature notarisation, no hard copy, EUR 120. |
| Noah Chen | 1 generated PDF | Insufficient PDF data | Missing country | Draft country Germany requires confirmation because the PDF says country of use is not stated; Canada billing/home, EUR 120. |
| Sofia Rossi | 1 generated PDF | Country conflict | Conflict | Spain country of use with Italy billing/home context; signature notarisation, no hard copy, EUR 120. |
| Kenji Tanaka | 2 generated PDFs | Complete hard-copy NIE route | Needs review | Spain country of use, Japan billing/home, Valencia shipping, NIE + Personal Data, apostille, hard copy, EUR 580. |
| Priya Nair | 1 generated PDF | Participant ambiguity | Needs review | Germany country of use, UK billing/home, signature notarisation, possible co-signer review, EUR 120. |

## Generated PDFs

| Persona | Files |
|---|---|
| Amara Okafor | `docs/generated-personas/amara-okafor/Signature_Authorisation_Amara_Okafor.pdf` |
| Noah Chen | `docs/generated-personas/noah-chen/Affidavit_Noah_Chen.pdf` |
| Sofia Rossi | `docs/generated-personas/sofia-rossi/Spanish_Bank_Authorisation_Sofia_Rossi.pdf` |
| Kenji Tanaka | `docs/generated-personas/kenji-tanaka/NIE_Application_Kenji_Tanaka.pdf`; `docs/generated-personas/kenji-tanaka/NIE_Personal_Details_Kenji_Tanaka.pdf` |
| Priya Nair | `docs/generated-personas/priya-nair/German_Subsidiary_Authorisation_Priya_Nair.pdf` |

## Browser Results

| Persona | Browser Result |
|---|---|
| All eight personas | Final sweep reaches `/lens/evidence` for every sample and finds each persona's expected evidence signals. |
| Amara Okafor | Start to Success succeeds; no hard-copy state displays correctly. |
| Noah Chen | Evidence and country help show missing country data; review gate is covered by tests and recovery succeeds after confirmation. |
| Sofia Rossi | Country conflict is visible; review clears after confirming Spain. |
| Kenji Tanaka | Full hard-copy/apostille route renders both PDFs, companion product, and EUR 580. |
| Priya Nair | Review blocks on participant ambiguity and clears after confirming listed participants. |

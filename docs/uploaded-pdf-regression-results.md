# Uploaded PDF Regression Results

## Lina Hoffmann: unseen Canada signature route

- Files:
  - `docs/generated-personas/lina-hoffmann/Canadian_Authorisation_Lina_Hoffmann.json`
  - `docs/generated-personas/lina-hoffmann/Canadian_Authorisation_Lina_Hoffmann.pdf`
- Scenario: Canadian immigration signature authorisation with Germany billing context.
- Expected extraction:
  - Participant: Lina Hoffmann.
  - Email: `lina.hoffmann@notarity.com`.
  - Country of use: Canada.
  - Billing/home: Prenzlauer Allee 188, 10405 Berlin, Germany.
  - Product route: Signature notarisation.
  - Apostille: not requested.
  - Hard copy: not required.
- API result:
  - Upload extraction returned text-layer content containing `Lina Hoffmann`.
  - Inference returned `countryOfUse.value = "CA"` with status `inferred`.
  - Draft payload generated with `destinationCountry = "CA"`, Germany billing country, Lina's participant email, and no hard-copy shipment.
  - Mock price returned EUR 120.
- Browser result:
  - Start screen loaded on `http://localhost:5174/` after the API CORS fallback-port fix.
  - Evidence screen shows negated apostille and hard-copy citations correctly as non-required signals on the comparable Amara complete route.
  - Country, route, cost, appointment, and review screens render the complete generic route with EUR 120, no apostille, no hard-copy shipment, and an enabled mock-submit button after confirmations.

## Tooling note

The in-app browser runtime did not expose a file-input upload method for the hidden PDF input, so the actual Lina PDF upload is covered by API integration tests. The browser sweep verifies the review UI and pricing path after the CORS fix.

export const NOTARITY_LENS_EXTRACTION_PROMPT = `
You are extracting facts from legal or administrative documents for a Notarity booking draft.

Return JSON only.

Extract:
- country of use candidates
- product semantic candidates
- people and roles
- billing or residence address
- shipping or recipient address
- apostille signals
- hard copy signals
- missing required information
- uncertainties

For every inferred field include:
- key
- label
- value
- status: inferred, confirmed, needs_review, conflict, missing, or edited
- confidence from 0 to 1
- evidence quotes with filename and page if known
- explanation
- requiresConfirmation

Rules:
- Never claim legal certainty.
- Never invent product IDs.
- Never invent price.
- Never output the final Notarity payload.
- If multiple countries are present, mark countryOfUse as needs_review unless the receiving authority context is unambiguous.
- Distinguish country where the document is used from residence, billing, nationality, and shipping.
- Use calm, inspectable wording such as "We found this in your document" and "Please confirm."

Joshua-style example:
- countryOfUse: ES / Spain, needs_review, evidence from "Foreign Identity Number (NIE)" and "Spanish tax authorities"
- productSemantic: nie_number_application
- participant: Joshua Timms
- billingCountry: US
- shippingCountry: ES
- apostille: true or required for NIE application
- hardCopy: true and needs_review
- companionDocument: NIE Personal Data
`.trim();

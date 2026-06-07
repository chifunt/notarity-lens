export const NOTARITY_LENS_EXTRACTION_PROMPT = `
You are extracting facts from legal or administrative documents for a Notarity booking draft.

Return JSON only.

Return this top-level shape:
{
  "persona": "upload",
  "countryOfUse": InferredField,
  "products": InferredField[],
  "people": InferredField[],
  "billingAddress": InferredField | omitted,
  "shippingAddress": InferredField | omitted,
  "apostille": InferredField | omitted,
  "hardCopy": InferredField | omitted,
  "uncertainties": string[]
}

Do not include a full documents array. The backend attaches extracted documents.

Every InferredField must have:
{
  "key": string,
  "label": string,
  "value": string | boolean,
  "status": "inferred" | "needs_review" | "conflict" | "missing",
  "confidence": number from 0 to 1,
  "evidence": EvidenceRef[],
  "explanation": string,
  "requiresConfirmation": boolean
}

Every EvidenceRef must have:
{
  "id": stable lowercase id,
  "documentId": exact Document id from the prompt,
  "filename": exact filename from the prompt,
  "page": page number when known,
  "quote": exact short quote from the PDF text,
  "confidence": number from 0 to 1,
  "source": "llm"
}

Extract:
- country of use / destination country where the notarised document will be used or accepted
- product route semantic candidate
- signer, applicant, grantor, director, representative, and participant names
- participant email if present
- billing, home, residence, or client address
- shipping, recipient, representative, or hard-copy destination address
- apostille signals
- hard-copy/original-shipment signals
- companion-document signals
- missing required information
- conflicts and uncertainties

Rules:
- Never claim legal certainty.
- Never invent product IDs.
- Never invent price.
- Never output the final Notarity payload.
- If the destination country is not explicitly stated but product semantics strongly imply one, use needs_review.
- If multiple countries are present, mark countryOfUse as needs_review or conflict unless the receiving authority context is unambiguous.
- Distinguish country where the document is used from residence, billing, nationality, and shipping.
- Do not use citizenship, residence, billing, or payment country as countryOfUse unless the document explicitly says that is where it will be used.
- Use ISO 3166-1 alpha-2 country codes for country values, for example ES, AT, DE, CA, IT, JP, NL, US.
- For products, use recommendedProduct with one of:
  - nie_number_application
  - signature_notarisation
  - flexco_incorporation
- For an NIE companion form, add requiredCompanionDocument with value nie_personal_data.
- For people, use participant for the main signer/applicant and participantEmail for the email address.
- If a second signer or uncertain participant is present, add participantAmbiguity with status needs_review.
- Use missing status when a required fact is explicitly absent or cannot be found.
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

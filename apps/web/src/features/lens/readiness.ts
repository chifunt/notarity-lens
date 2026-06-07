import type { DocumentFactExtraction, InferredField } from "./types";

const resolvedStatuses = new Set(["confirmed", "not_applicable"]);

export function requiredConfirmationFields(inference: DocumentFactExtraction) {
  return [
    inference.countryOfUse,
    ...inference.products,
    ...[
      ...inference.people,
      inference.billingAddress,
      inference.shippingAddress,
      inference.apostille,
      inference.hardCopy,
    ].filter(
      (field): field is InferredField =>
        Boolean(field?.requiresConfirmation),
    ),
  ].filter((field): field is InferredField => Boolean(field));
}

export function unresolvedConfirmationFields(inference: DocumentFactExtraction) {
  return requiredConfirmationFields(inference).filter(
    (field) => !resolvedStatuses.has(field.status),
  );
}

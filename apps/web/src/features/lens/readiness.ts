import type { DocumentFactExtraction, InferredField } from "./types";

const resolvedStatuses = new Set(["confirmed", "edited", "not_applicable"]);
const optionalConfirmationFieldKeys = new Set(["hardCopy"]);

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
    ].filter((field): field is InferredField => {
      if (!field) return false;
      return (
        field.requiresConfirmation &&
        !optionalConfirmationFieldKeys.has(field.key)
      );
    }),
  ].filter((field): field is InferredField => Boolean(field));
}

export function unresolvedConfirmationFields(inference: DocumentFactExtraction) {
  return requiredConfirmationFields(inference).filter(
    (field) => !resolvedStatuses.has(field.status),
  );
}

export function readyForSubmit(
  inference: DocumentFactExtraction,
  hasPrice: boolean,
) {
  return hasPrice && unresolvedConfirmationFields(inference).length === 0;
}

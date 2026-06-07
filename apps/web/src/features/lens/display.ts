import type { AppointmentPayload, InferredField } from "./types";

const JOSHUA_NIE_APPLICATION_PRODUCT_ID = "UpEJ7raQEKQKFhWn12r2";
const JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID = "xK5IkgPX1LTYdWLFzW8X";
const ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID = "ujwBkZleJLPEzByCnPCS";
const ELIZABETH_FLEXCO_PRODUCT_ID = "S3N2zyJENFE0vTjrKTZn";

const countryNames: Record<string, string> = {
  AT: "Austria",
  CA: "Canada",
  DE: "Germany",
  ES: "Spain",
  GB: "United Kingdom",
  IT: "Italy",
  JP: "Japan",
  LT: "Lithuania",
  NL: "Netherlands",
  US: "United States",
};

const productNames: Record<string, string> = {
  [JOSHUA_NIE_APPLICATION_PRODUCT_ID]: "NIE number application",
  [JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID]: "NIE Personal Data",
  [ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID]: "Signature notarisation",
  [ELIZABETH_FLEXCO_PRODUCT_ID]: "FlexCo Incorporation",
};

export function formatCountry(value: unknown) {
  const code = String(value ?? "");
  return countryNames[code] ?? code;
}

export function formatProductName(productId: string) {
  return productNames[productId] ?? productId;
}

export function formatProductSummary(payload: AppointmentPayload) {
  return payload.products.map((product) => formatProductName(product.id)).join("; ");
}

export function formatFilesSummary(payload: AppointmentPayload) {
  const files = payload.products.flatMap((product) => product.files);
  return files.length ? files.join(", ") : "No files attached yet";
}

export function formatParticipantsSummary(payload: AppointmentPayload) {
  const emails = payload.participants
    .map((participant) => participant.email)
    .filter(Boolean);
  return emails.length ? emails.join(", ") : "No participants added";
}

export function formatProductFiles(files: string[]) {
  return files.length ? files.join(", ") : "No files attached yet";
}

export function formatBooleanChoice(value: unknown) {
  return value === true ? "Required" : value === false ? "Not needed" : "Not applicable";
}

export function formatFieldValue(field: InferredField) {
  if (field.key === "countryOfUse") return formatCountry(field.value);
  if (typeof field.value === "boolean") return formatBooleanChoice(field.value);
  if (field.key === "recommendedProduct") {
    if (field.value === "nie_number_application") return "NIE number application";
    if (field.value === "signature_notarisation") return "Signature notarisation";
    return String(field.value);
  }
  if (field.key === "requiredCompanionDocument") {
    return field.value === "nie_personal_data"
      ? "NIE Personal Data"
      : String(field.value);
  }
  return String(field.value);
}

type AddressLike = {
  address?: unknown;
  city?: unknown;
  countryCode?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  stateProvince?: unknown;
  zipCode?: unknown;
};

export function formatAddress(details: AddressLike | undefined) {
  if (!details) return "Not provided";
  const name = [details.firstName, details.lastName].filter(Boolean).join(" ");
  const location = [
    details.address,
    details.zipCode,
    details.city,
    details.stateProvince,
    formatCountry(details.countryCode),
  ].filter(Boolean);
  return [name, ...location].filter(Boolean).join(", ");
}

export function formatShippingSummary(payload: AppointmentPayload) {
  if (!payload.hardCopy?.hardCopy) return "No hard copy shipment";
  return payload.shippingDetails
    ? `Hard copy to ${formatAddress(payload.shippingDetails)}`
    : "Hard copy requested";
}

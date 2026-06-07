import {
  ELIZABETH_FLEXCO_PRODUCT_ID,
  ELIZABETH_TIMESLOT_ID,
  JOSHUA_NIE_APPLICATION_PRODUCT_ID,
  JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID,
  JOSHUA_TIMESLOT_ID,
  ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
  ROBERT_TIMESLOT_ID,
  joshuaPayload,
  personaFixtures,
  type Address,
  type AppointmentPayload,
  type DocumentFactExtraction,
  type ExtractedDocument,
  type InferredField,
  type NotarityProductSelection,
} from "@notarity-lens/shared";
import { canonicalizeFilename } from "./file-map.js";

export type UploadedPayloadDraft = {
  payload?: AppointmentPayload;
  blockers: string[];
  warnings: string[];
};

type ParsedAddress = {
  address?: string;
  zipCode?: string;
  city?: string;
  stateProvince?: string;
  countryCode?: string;
};

const COUNTRY_CODES: Record<string, string> = {
  austria: "AT",
  canada: "CA",
  germany: "DE",
  italy: "IT",
  japan: "JP",
  lithuania: "LT",
  netherlands: "NL",
  spain: "ES",
  "united kingdom": "GB",
  uk: "GB",
  "united states": "US",
  usa: "US",
};

const PRODUCT_ID_BY_ROUTE: Record<string, string> = {
  flexco_incorporation: ELIZABETH_FLEXCO_PRODUCT_ID,
  nie_number_application: JOSHUA_NIE_APPLICATION_PRODUCT_ID,
  signature_notarisation: ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
};

function clonePayload(payload: AppointmentPayload): AppointmentPayload {
  return {
    ...payload,
    hardCopy: { ...payload.hardCopy },
    products: payload.products.map((product) => ({
      ...product,
      files: product.files.map((filename) => canonicalizeFilename(filename)),
    })),
    participants: payload.participants.map((participant) => ({ ...participant })),
    timeslots: [...payload.timeslots],
    billingDetails: cloneAddress(payload.billingDetails),
    contactDetails: {
      ...payload.contactDetails,
      businessDetails: payload.contactDetails.businessDetails
        ? { ...payload.contactDetails.businessDetails }
        : undefined,
    },
    shippingDetails: payload.shippingDetails
      ? {
          ...cloneAddress(payload.shippingDetails),
          shippingDetailsSameAsBillingDetails:
            payload.shippingDetails.shippingDetailsSameAsBillingDetails,
        }
      : undefined,
  };
}

function cloneAddress<T extends Address>(address: T): T {
  return {
    ...address,
    businessDetails: address.businessDetails
      ? { ...address.businessDetails }
      : undefined,
  };
}

function fieldValue(inference: DocumentFactExtraction, key: string) {
  const fields: Array<InferredField | undefined> = [
    inference.countryOfUse,
    ...inference.products,
    ...inference.people,
    inference.billingAddress,
    inference.shippingAddress,
    inference.hardCopy,
    inference.apostille,
  ];
  return fields.find((field) => field?.key === key)?.value;
}

function documentsText(documents: ExtractedDocument[]) {
  return documents
    .flatMap((document) => document.textByPage.map((page) => page.text))
    .join("\n");
}

function emailFromInference(inference: DocumentFactExtraction) {
  const fieldEmail = fieldValue(inference, "participantEmail");
  if (typeof fieldEmail === "string" && fieldEmail.includes("@")) return fieldEmail;

  const match = documentsText(inference.documents).match(
    /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i,
  );
  return match?.[1];
}

function participantName(inference: DocumentFactExtraction) {
  const value = fieldValue(inference, "participant");
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "Client",
    lastName: parts.slice(1).join(" ") || "Signer",
  };
}

function routeValue(inference: DocumentFactExtraction) {
  const value = inference.products.find((field) => field.key === "recommendedProduct")
    ?.value;
  return typeof value === "string" ? value : undefined;
}

function selectedProductIds(route: string) {
  const primaryProductId = PRODUCT_ID_BY_ROUTE[route];
  if (!primaryProductId) return [];
  if (route === "nie_number_application") {
    return [primaryProductId, JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID];
  }
  return [primaryProductId];
}

function templateForRoute(route: string) {
  if (route === "nie_number_application") return clonePayload(joshuaPayload);
  if (route === "flexco_incorporation") {
    return clonePayload(personaFixtures.elizabeth.payload);
  }
  return clonePayload(personaFixtures.robert.payload);
}

function productFiles(productId: string, documents: ExtractedDocument[]) {
  const filenames = documents.map((document) =>
    canonicalizeFilename(document.canonicalName || document.filename),
  );
  if (productId === ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID) return [];
  if (productId === JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID) {
    return filenames.filter((filename) => /personal|details/i.test(filename));
  }
  if (productId === JOSHUA_NIE_APPLICATION_PRODUCT_ID) {
    const applicationFiles = filenames.filter(
      (filename) => !/personal|details/i.test(filename),
    );
    return applicationFiles.length ? applicationFiles : filenames;
  }
  return filenames;
}

function productSelection(
  productId: string,
  route: string,
  inference: DocumentFactExtraction,
): NotarityProductSelection {
  const apostilleValue = inference.apostille?.value === true;
  const apostille =
    productId === JOSHUA_NIE_APPLICATION_PRODUCT_ID
      ? true
      : productId === ELIZABETH_FLEXCO_PRODUCT_ID ||
          productId === JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID
        ? null
        : apostilleValue;

  return {
    id: productId,
    apostille,
    userInput: "",
    documentsNotReadyYet: false,
    needHelpDrafting: false,
    proofOfRepresentation: route === "flexco_incorporation" ? null : false,
    files: productFiles(productId, inference.documents),
  };
}

function countryCodeFromText(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return COUNTRY_CODES[normalized];
}

function parseAddress(value: unknown): ParsedAddress {
  if (typeof value !== "string" || !value.trim()) return {};
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const countryCode = countryCodeFromText(parts.at(-1));
  const address = parts.length > 2 ? parts[0] : undefined;
  const cityPart = parts.length > 1 ? parts.at(-2) : parts[0];
  const zipCity = cityPart?.match(/^([A-Z0-9 -]{3,12})\s+(.+)$/i);
  const stateZip = parts.length > 3 ? parts.at(-2)?.match(/^([A-Z]{2})\s+(.+)$/i) : undefined;

  return {
    address,
    zipCode: zipCity?.[1] ?? stateZip?.[2],
    city: zipCity?.[2] ?? (parts.length > 1 ? cityPart : undefined),
    stateProvince: stateZip?.[1] ?? "",
    countryCode,
  };
}

function applyIdentity(
  payload: AppointmentPayload,
  { name, email }: { name: string; email: string },
) {
  const { firstName, lastName } = splitName(name);
  payload.participants = [{ email, client: true, supervisor: false }];
  payload.billingDetails.firstName = firstName;
  payload.billingDetails.lastName = lastName;
  payload.billingDetails.email = email;
  payload.contactDetails.firstName = firstName;
  payload.contactDetails.lastName = lastName;
  payload.contactDetails.email = email;
  if (payload.shippingDetails) {
    payload.shippingDetails.firstName = firstName;
    payload.shippingDetails.lastName = lastName;
    payload.shippingDetails.email = email;
  }
}

function applyBillingAddress(
  payload: AppointmentPayload,
  inference: DocumentFactExtraction,
  destinationCountry: string,
) {
  const parsed = parseAddress(inference.billingAddress?.value);
  payload.billingDetails = {
    ...payload.billingDetails,
    address: parsed.address || payload.billingDetails.address,
    zipCode: parsed.zipCode || payload.billingDetails.zipCode,
    city: parsed.city || payload.billingDetails.city,
    stateProvince: parsed.stateProvince ?? payload.billingDetails.stateProvince,
    countryCode: parsed.countryCode || destinationCountry,
  };
  payload.contactDetails = {
    ...payload.contactDetails,
    contactDetailsSameAsBillingDetails: true,
  };
}

function applyTimeslot(payload: AppointmentPayload, route: string, country: string) {
  if (country === "AT") payload.timeslots = [ELIZABETH_TIMESLOT_ID];
  else if (route === "signature_notarisation") payload.timeslots = [ROBERT_TIMESLOT_ID];
  else payload.timeslots = [JOSHUA_TIMESLOT_ID];
}

export function buildUploadedPayload(
  inference: DocumentFactExtraction,
): UploadedPayloadDraft {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const country =
    typeof inference.countryOfUse.value === "string"
      ? inference.countryOfUse.value
      : undefined;
  const route = routeValue(inference);
  const name = participantName(inference);
  const email = emailFromInference(inference);

  if (
    !country ||
    !/^[A-Z]{2}$/.test(country) ||
    inference.countryOfUse.status === "missing" ||
    inference.countryOfUse.status === "conflict"
  ) {
    blockers.push("Country of use must be resolved before payload generation.");
  }
  if (!route || !PRODUCT_ID_BY_ROUTE[route]) {
    blockers.push("Supported Notarity product route was not detected.");
  }
  if (!name) blockers.push("Participant name was not detected.");
  if (!email) blockers.push("Participant email was not detected.");

  if (blockers.length || !country || !route || !name || !email) {
    return { blockers, warnings };
  }

  const productIds = selectedProductIds(route);
  const payload = templateForRoute(route);
  payload.destinationCountry = country;
  payload.products = productIds.map((productId) =>
    productSelection(productId, route, inference),
  );
  payload.hardCopy = {
    hardCopy: inference.hardCopy?.value === true,
    expressShipping: false,
  };
  if (!payload.hardCopy.hardCopy) payload.shippingDetails = undefined;
  applyTimeslot(payload, route, country);
  applyIdentity(payload, { name, email });
  applyBillingAddress(payload, inference, country);

  if (!inference.billingAddress) {
    warnings.push("Billing address was not extracted; draft uses route template defaults.");
  }

  return { payload, blockers, warnings };
}

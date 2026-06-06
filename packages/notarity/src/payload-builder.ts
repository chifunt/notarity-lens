import {
  JOSHUA_NIE_APPLICATION_PRODUCT_ID,
  JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID,
  joshuaDocuments,
  joshuaPayload,
  joshuaPriceLines,
  type AppointmentPayload,
  type ExtractedDocument,
  type PriceLine,
} from "@notarity-lens/shared";
import { canonicalizeFilename, normalizeDocumentFilenames } from "./file-map.js";
import { confirmedPriceFromLines } from "./price.js";

export type BuildJoshuaPayloadInput = {
  documents?: ExtractedDocument[];
  priceLines?: PriceLine[];
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
    billingDetails: {
      ...payload.billingDetails,
      businessDetails: payload.billingDetails.businessDetails
        ? { ...payload.billingDetails.businessDetails }
        : undefined,
    },
    contactDetails: {
      ...payload.contactDetails,
      businessDetails: payload.contactDetails.businessDetails
        ? { ...payload.contactDetails.businessDetails }
        : undefined,
    },
    shippingDetails: payload.shippingDetails
      ? {
          ...payload.shippingDetails,
          businessDetails: payload.shippingDetails.businessDetails
            ? { ...payload.shippingDetails.businessDetails }
            : undefined,
        }
      : undefined,
  };
}

function canonicalFileForProduct(productId: string, documents: ExtractedDocument[]) {
  const normalized = normalizeDocumentFilenames(documents);

  if (productId === JOSHUA_NIE_APPLICATION_PRODUCT_ID) {
    return normalized.find((document) =>
      document.canonicalName.includes("nie-application-demo-joshua_timms"),
    )?.canonicalName;
  }

  if (productId === JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID) {
    return normalized.find(
      (document) => document.canonicalName === "nie_personal_details.pdf",
    )?.canonicalName;
  }

  return undefined;
}

export function buildJoshuaPayload(input: BuildJoshuaPayloadInput = {}) {
  const documents = input.documents ?? joshuaDocuments;
  const priceLines = input.priceLines ?? joshuaPriceLines;
  const payload = clonePayload(joshuaPayload);

  payload.confirmedPrice = confirmedPriceFromLines(priceLines);
  payload.products = payload.products.map((product) => {
    const canonicalFile = canonicalFileForProduct(product.id, documents);
    return {
      ...product,
      files: canonicalFile ? [canonicalFile] : product.files.map(canonicalizeFilename),
    };
  });

  return payload;
}

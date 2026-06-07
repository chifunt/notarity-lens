import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  ELIZABETH_FLEXCO_PRODUCT_ID,
  JOSHUA_NIE_APPLICATION_PRODUCT_ID,
  JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID,
  ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
} from "@notarity-lens/shared";
import {
  draftPayload,
  getPersonaFixture,
  getUploadedPdfUrl,
  inferDocuments,
  pricePayload,
  submitPayload,
  uploadDocumentFiles,
} from "./api";
import type {
  AppointmentSelection,
  DocumentFactExtraction,
  ExtractedDocument,
  FieldStatus,
  InferredField,
  LensFixture,
  PersonaFixture,
  PriceResponse,
  SubmitResponse,
} from "./types";

type SaveInferenceFieldInput = {
  key: string;
  value: string | boolean;
};

export type AnalysisStage =
  | "idle"
  | "loading_sample"
  | "uploading"
  | "inferring"
  | "drafting"
  | "pricing"
  | "ready";

type LensStore = {
  fixture: LensFixture | null;
  uploadedDocuments: ExtractedDocument[];
  appointmentSelection: AppointmentSelection;
  price: PriceResponse | null;
  submitResult: SubmitResponse | null;
  analysisStage: AnalysisStage;
  loading: boolean;
  error: string | null;
  loadPersona: (persona?: PersonaFixture["id"]) => Promise<boolean>;
  loadJoshuaDemo: () => Promise<boolean>;
  uploadDocuments: (files: File[]) => Promise<boolean>;
  confirmEvidence: () => void;
  confirmInferenceField: (key: string) => void;
  markInferenceFieldUnsure: (key: string) => void;
  saveInferenceField: (input: SaveInferenceFieldInput) => void;
  selectAppointmentSlot: (selection: AppointmentSelection) => void;
  confirmCountry: () => void;
  confirmRoute: () => void;
  confirmPeople: () => void;
  submitBooking: () => Promise<boolean>;
  reset: () => void;
};

function updateField<T>(field: InferredField<T>, status: FieldStatus): InferredField<T> {
  return { ...field, status };
}

function updateOptionalField<T>(
  field: InferredField<T> | undefined,
  status: FieldStatus,
): InferredField<T> | undefined {
  return field ? updateField(field, status) : undefined;
}

const countryCodes: Record<string, string> = {
  austria: "AT",
  at: "AT",
  canada: "CA",
  ca: "CA",
  germany: "DE",
  de: "DE",
  italy: "IT",
  it: "IT",
  japan: "JP",
  jp: "JP",
  lithuania: "LT",
  lt: "LT",
  netherlands: "NL",
  nl: "NL",
  spain: "ES",
  es: "ES",
  "united kingdom": "GB",
  gb: "GB",
  uk: "GB",
  "united states": "US",
  us: "US",
  usa: "US",
};

export const defaultAppointmentSelection: AppointmentSelection = {
  date: "2026-06-09",
  dateLabel: "Tue, Jun 09",
  time: "09:00",
  timezone: "Europe/Vienna",
};

const fieldLabels: Record<string, string> = {
  apostille: "Apostille",
  billingAddress: "Billing/home address",
  countryOfUse: "Country of use",
  hardCopy: "Hard copy",
  participant: "Participant",
  participantAmbiguity: "Participant ambiguity",
  participantEmail: "Participant email",
  recommendedProduct: "Recommended product",
  requiredCompanionDocument: "Required companion document",
  shippingAddress: "Shipping address",
};

const productIdsByRoute: Record<string, string[]> = {
  flexco_incorporation: [ELIZABETH_FLEXCO_PRODUCT_ID],
  nie_number_application: [
    JOSHUA_NIE_APPLICATION_PRODUCT_ID,
    JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID,
  ],
  signature_notarisation: [ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID],
};

function normalizeFieldValue(input: SaveInferenceFieldInput) {
  if (typeof input.value === "boolean") return input.value;
  const value = input.value.trim();
  if (input.key === "countryOfUse") {
    return countryCodes[value.toLowerCase()] ?? value.toUpperCase();
  }
  return value;
}

function manualField(
  input: SaveInferenceFieldInput,
  existing?: InferredField,
): InferredField {
  return {
    key: input.key,
    label: existing?.label ?? fieldLabels[input.key] ?? input.key,
    value: normalizeFieldValue(input),
    status: "edited",
    confidence: existing?.confidence,
    evidence: existing?.evidence ?? [],
    explanation: existing
      ? "Edited by user."
      : "Added by user because it was not found in the document.",
    requiresConfirmation: false,
  };
}

function updateArrayField(fields: InferredField[], input: SaveInferenceFieldInput) {
  const index = fields.findIndex((field) => field.key === input.key);
  if (index === -1) return [...fields, manualField(input)];
  return fields.map((field, fieldIndex) =>
    fieldIndex === index ? manualField(input, field) : field,
  );
}

function statusArrayField(fields: InferredField[], key: string, status: FieldStatus) {
  return fields.map((field) => (field.key === key ? updateField(field, status) : field));
}

function saveInferenceFieldValue(
  inference: DocumentFactExtraction,
  input: SaveInferenceFieldInput,
): DocumentFactExtraction {
  if (input.key === "countryOfUse") {
    return {
      ...inference,
      countryOfUse: manualField(input, inference.countryOfUse) as InferredField<string>,
    };
  }

  if (input.key === "recommendedProduct" || input.key === "requiredCompanionDocument") {
    return {
      ...inference,
      products: updateArrayField(inference.products, input),
    };
  }

  if (
    input.key === "participant" ||
    input.key === "participantEmail" ||
    input.key === "participantAmbiguity"
  ) {
    return {
      ...inference,
      people: updateArrayField(inference.people, input),
    };
  }

  if (input.key === "billingAddress") {
    return {
      ...inference,
      billingAddress: manualField(
        input,
        inference.billingAddress,
      ) as InferredField<string>,
    };
  }

  if (input.key === "shippingAddress") {
    return {
      ...inference,
      shippingAddress: manualField(
        input,
        inference.shippingAddress,
      ) as InferredField<string>,
    };
  }

  if (input.key === "apostille") {
    return {
      ...inference,
      apostille: manualField(input, inference.apostille) as InferredField<boolean>,
    };
  }

  if (input.key === "hardCopy") {
    return {
      ...inference,
      hardCopy: manualField(input, inference.hardCopy) as InferredField<boolean>,
    };
  }

  return inference;
}

function updateInferenceFieldStatus(
  inference: DocumentFactExtraction,
  key: string,
  status: FieldStatus,
): DocumentFactExtraction {
  return {
    ...inference,
    countryOfUse:
      inference.countryOfUse.key === key
        ? updateField(inference.countryOfUse, status)
        : inference.countryOfUse,
    products: statusArrayField(inference.products, key, status),
    people: statusArrayField(inference.people, key, status),
    billingAddress:
      inference.billingAddress?.key === key
        ? updateField(inference.billingAddress, status)
        : inference.billingAddress,
    shippingAddress:
      inference.shippingAddress?.key === key
        ? updateField(inference.shippingAddress, status)
        : inference.shippingAddress,
    apostille:
      inference.apostille?.key === key
        ? updateField(inference.apostille, status)
        : inference.apostille,
    hardCopy:
      inference.hardCopy?.key === key
        ? updateField(inference.hardCopy, status)
        : inference.hardCopy,
  };
}

function syncPayloadWithField(
  payload: LensFixture["payload"],
  input: SaveInferenceFieldInput,
): LensFixture["payload"] {
  if (!payload) return payload;
  const value = normalizeFieldValue(input);

  if (input.key === "countryOfUse" && typeof value === "string") {
    return { ...payload, destinationCountry: value };
  }

  if (input.key === "hardCopy" && typeof value === "boolean") {
    return {
      ...payload,
      hardCopy: { ...payload.hardCopy, hardCopy: value },
      shippingDetails: value ? payload.shippingDetails : undefined,
    };
  }

  if (input.key === "recommendedProduct" && typeof value === "string") {
    const productIds = productIdsByRoute[value];
    if (!productIds) return payload;

    const existingProductsById = new Map(
      payload.products.map((product) => [product.id, product]),
    );

    return {
      ...payload,
      products: productIds.map((productId) => ({
        id: productId,
        apostille:
          productId === JOSHUA_NIE_APPLICATION_PRODUCT_ID
            ? true
            : existingProductsById.get(productId)?.apostille ?? false,
        files: existingProductsById.get(productId)?.files ?? [],
      })),
    };
  }

  if (input.key === "apostille" && typeof value === "boolean") {
    return {
      ...payload,
      products: payload.products.map((product) =>
        product.id === JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID
          ? product
          : { ...product, apostille: value },
      ),
    };
  }

  if (input.key === "participantEmail" && typeof value === "string") {
    return {
      ...payload,
      participants: payload.participants.length
        ? payload.participants.map((participant, index) =>
            index === 0 ? { ...participant, email: value } : participant,
          )
        : [{ email: value, client: true, supervisor: false }],
      billingDetails: { ...payload.billingDetails, email: value },
      shippingDetails: payload.shippingDetails
        ? { ...payload.shippingDetails, email: value }
        : undefined,
    };
  }

  return payload;
}

function withInference(
  fixture: LensFixture | null,
  updater: (inference: DocumentFactExtraction) => DocumentFactExtraction,
) {
  if (!fixture) return fixture;
  return {
    ...fixture,
    inference: updater(fixture.inference),
  };
}

function appointmentSelectionForFixture(fixture: LensFixture): AppointmentSelection {
  return {
    ...defaultAppointmentSelection,
    timezone: String(fixture.payload?.timezone ?? defaultAppointmentSelection.timezone),
  };
}

let activeUploadRunId = 0;
const activePreviewUrls = new Set<string>();

function createPreviewUrl(file: File) {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    return undefined;
  }
  const url = URL.createObjectURL(file);
  activePreviewUrls.add(url);
  return url;
}

function clearPreviewUrls() {
  if (typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function") {
    activePreviewUrls.clear();
    return;
  }

  activePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  activePreviewUrls.clear();
}

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function previewUrlByFile(files: File[]) {
  return new Map(files.map((file) => [fileKey(file), createPreviewUrl(file)]));
}

function pendingUploadDocuments(
  files: File[],
  previewUrls: Map<string, string | undefined>,
): ExtractedDocument[] {
  return files.map((file, index) => ({
    id: `pending-upload-${index}`,
    filename: file.name,
    canonicalName: file.name,
    mimeType: file.type || "application/pdf",
    size: file.size,
    textByPage: [],
    extractionStatus: "pending",
    previewUrl: previewUrls.get(fileKey(file)),
  }));
}

function attachPreviewUrls(
  documents: ExtractedDocument[],
  files: File[],
  previewUrls: Map<string, string | undefined>,
  uploadSessionId?: string,
) {
  return documents.map((document) => {
    const file = files.find(
      (candidate) =>
        candidate.name === document.filename && candidate.size === document.size,
    );
    const uploadedPdfUrl = uploadSessionId
      ? getUploadedPdfUrl(uploadSessionId, document.id)
      : undefined;

    return {
      ...document,
      previewUrl:
        uploadedPdfUrl ?? (file ? previewUrls.get(fileKey(file)) : document.previewUrl),
    };
  });
}

type LensPersistedState = Pick<
  LensStore,
  | "fixture"
  | "uploadedDocuments"
  | "appointmentSelection"
  | "price"
  | "submitResult"
  | "analysisStage"
>;

function persistReadyDraft(state: LensStore): LensPersistedState {
  const hasReadyDraft = state.analysisStage === "ready" && Boolean(state.fixture);

  return {
    fixture: hasReadyDraft ? state.fixture : null,
    uploadedDocuments: hasReadyDraft ? state.uploadedDocuments : [],
    appointmentSelection: hasReadyDraft
      ? state.appointmentSelection
      : defaultAppointmentSelection,
    price: hasReadyDraft ? state.price : null,
    submitResult: hasReadyDraft ? state.submitResult : null,
    analysisStage: hasReadyDraft ? "ready" : "idle",
  };
}

export const useLensStore = create<LensStore>()(
  persist(
    (set, get) => {
      return {
        fixture: null,
        uploadedDocuments: [],
        appointmentSelection: defaultAppointmentSelection,
        price: null,
        submitResult: null,
        analysisStage: "idle",
        loading: false,
        error: null,

        loadPersona: async (persona = "joshua") => {
          activeUploadRunId += 1;
          clearPreviewUrls();
          set({
            fixture: null,
            uploadedDocuments: [],
            appointmentSelection: defaultAppointmentSelection,
            price: null,
            submitResult: null,
            analysisStage: "loading_sample",
            loading: true,
            error: null,
          });
          try {
            const fixture = await getPersonaFixture(persona);
            const price = await pricePayload(fixture.payload);
            set({
              fixture,
              appointmentSelection: appointmentSelectionForFixture(fixture),
              price,
              analysisStage: "ready",
              loading: false,
            });
            return true;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unable to load sample request";
            set({
              fixture: null,
              uploadedDocuments: [],
              appointmentSelection: defaultAppointmentSelection,
              price: null,
              submitResult: null,
              error: message,
              analysisStage: "idle",
              loading: false,
            });
            return false;
          }
        },

        loadJoshuaDemo: async () => get().loadPersona("joshua"),

        uploadDocuments: async (files) => {
          if (!files.length) return false;
          const runId = (activeUploadRunId += 1);
          const isCurrentRun = () => activeUploadRunId === runId;
          clearPreviewUrls();
          const previewUrls = previewUrlByFile(files);

          set({
            fixture: null,
            uploadedDocuments: pendingUploadDocuments(files, previewUrls),
            appointmentSelection: defaultAppointmentSelection,
            price: null,
            submitResult: null,
            analysisStage: "uploading",
            loading: true,
            error: null,
          });
          try {
            const upload = await uploadDocumentFiles(files);
            if (!isCurrentRun()) return false;
            const documents = attachPreviewUrls(
              upload.documents,
              files,
              previewUrls,
              upload.sessionId,
            );
            clearPreviewUrls();
            set({ uploadedDocuments: documents, analysisStage: "inferring" });

            const infer = await inferDocuments(documents);
            if (!isCurrentRun()) return false;
            set({ analysisStage: "drafting" });

            const draft = await draftPayload(infer.inference);
            if (!isCurrentRun()) return false;
            set({ analysisStage: "pricing" });

            const price = draft.payload ? await pricePayload(draft.payload) : null;
            if (!isCurrentRun()) return false;

            const payload = draft.payload
              ? { ...draft.payload, confirmedPrice: price?.confirmedPrice }
              : undefined;
            const fixture: LensFixture = {
              id: "upload",
              name: "Uploaded documents",
              scenario: "Uploaded PDF draft",
              documents,
              inference: { ...infer.inference, documents },
              payload,
            };
            set({
              fixture,
              appointmentSelection: payload
                ? appointmentSelectionForFixture(fixture)
                : defaultAppointmentSelection,
              uploadedDocuments: documents,
              price,
              analysisStage: "ready",
              error: draft.blockers.length ? draft.blockers.join(" ") : null,
              loading: false,
            });
            return true;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unable to upload documents";
            if (isCurrentRun()) {
              clearPreviewUrls();
              set({
                fixture: null,
                uploadedDocuments: [],
                appointmentSelection: defaultAppointmentSelection,
                price: null,
                submitResult: null,
                analysisStage: "idle",
                error: message,
                loading: false,
              });
            }
            return false;
          }
        },

        confirmEvidence: () => set((state) => ({ fixture: state.fixture })),

        confirmInferenceField: (key) =>
          set((state) => ({
            fixture: withInference(state.fixture, (inference) =>
              updateInferenceFieldStatus(inference, key, "confirmed"),
            ),
          })),

        markInferenceFieldUnsure: (key) =>
          set((state) => ({
            fixture: withInference(state.fixture, (inference) =>
              updateInferenceFieldStatus(inference, key, "needs_review"),
            ),
          })),

        saveInferenceField: (input) =>
          set((state) => ({
            fixture: state.fixture
              ? {
                  ...state.fixture,
                  inference: saveInferenceFieldValue(state.fixture.inference, input),
                  payload: syncPayloadWithField(state.fixture.payload, input),
                }
              : state.fixture,
          })),

        selectAppointmentSlot: (selection) =>
          set(() => ({
            appointmentSelection: selection,
          })),

        confirmCountry: () =>
          set((state) => ({
            fixture: withInference(state.fixture, (inference) => ({
              ...inference,
              countryOfUse: updateField(inference.countryOfUse, "confirmed"),
              billingAddress: updateOptionalField(inference.billingAddress, "confirmed"),
              shippingAddress: updateOptionalField(
                inference.shippingAddress,
                "confirmed",
              ),
            })),
          })),

        confirmRoute: () =>
          set((state) => ({
            fixture: withInference(state.fixture, (inference) => ({
              ...inference,
              products: inference.products.map((field) =>
                updateField(field, "confirmed"),
              ),
              apostille: updateOptionalField(inference.apostille, "confirmed"),
              hardCopy: updateOptionalField(inference.hardCopy, "confirmed"),
            })),
          })),

        confirmPeople: () =>
          set((state) => ({
            fixture: withInference(state.fixture, (inference) => ({
              ...inference,
              people: inference.people.map((field) => updateField(field, "confirmed")),
            })),
          })),

        submitBooking: async () => {
          const fixture = get().fixture;
          if (!fixture) return false;
          if (!fixture.payload) {
            set({
              error: "Payload is not ready for uploaded documents yet",
              loading: false,
            });
            return false;
          }

          set({ submitResult: null, loading: true, error: null });
          try {
            const submitResult = await submitPayload(fixture.payload);
            set({ submitResult, loading: false });
            return true;
          } catch (error) {
            const message = error instanceof Error ? error.message : "Submit failed";
            set({ error: message, loading: false });
            return false;
          }
        },

        reset: () =>
          set(() => {
            activeUploadRunId += 1;
            clearPreviewUrls();
            return {
              fixture: null,
              uploadedDocuments: [],
              appointmentSelection: defaultAppointmentSelection,
              price: null,
              submitResult: null,
              analysisStage: "idle",
              loading: false,
              error: null,
            };
          }),
      };
    },
    {
      name: "notarity-lens-ready-draft",
      storage: createJSONStorage(() => sessionStorage),
      partialize: persistReadyDraft,
    },
  ),
);

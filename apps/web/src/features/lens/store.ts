import { create } from "zustand";
import { getPersonaFixture, pricePayload, submitPayload, uploadDocumentFiles } from "./api";
import type {
  DocumentFactExtraction,
  ExtractedDocument,
  FieldStatus,
  InferredField,
  PersonaFixture,
  PriceResponse,
  SubmitResponse,
} from "./types";

type LensStore = {
  fixture: PersonaFixture | null;
  uploadedDocuments: ExtractedDocument[];
  price: PriceResponse | null;
  submitResult: SubmitResponse | null;
  loading: boolean;
  error: string | null;
  loadPersona: (persona?: PersonaFixture["id"]) => Promise<void>;
  loadJoshuaDemo: () => Promise<void>;
  uploadDocuments: (files: File[]) => Promise<void>;
  confirmEvidence: () => void;
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

function withInference(
  fixture: PersonaFixture | null,
  updater: (inference: DocumentFactExtraction) => DocumentFactExtraction,
) {
  if (!fixture) return fixture;
  return {
    ...fixture,
    inference: updater(fixture.inference),
  };
}

export const useLensStore = create<LensStore>((set, get) => ({
  fixture: null,
  uploadedDocuments: [],
  price: null,
  submitResult: null,
  loading: false,
  error: null,

  loadPersona: async (persona = "joshua") => {
    set({
      fixture: null,
      uploadedDocuments: [],
      price: null,
      submitResult: null,
      loading: true,
      error: null,
    });
    try {
      const fixture = await getPersonaFixture(persona);
      const price = await pricePayload(fixture.payload);
      set({ fixture, price, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load sample request";
      set({ error: message, loading: false });
    }
  },

  loadJoshuaDemo: async () => get().loadPersona("joshua"),

  uploadDocuments: async (files) => {
    if (!files.length) return;

    set({
      fixture: null,
      uploadedDocuments: [],
      price: null,
      submitResult: null,
      loading: true,
      error: null,
    });
    try {
      const upload = await uploadDocumentFiles(files);
      set({ uploadedDocuments: upload.documents, loading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to upload documents";
      set({ error: message, loading: false });
    }
  },

  confirmEvidence: () => set((state) => ({ fixture: state.fixture })),

  confirmCountry: () =>
    set((state) => ({
      fixture: withInference(state.fixture, (inference) => ({
        ...inference,
        countryOfUse: updateField(inference.countryOfUse, "confirmed"),
        billingAddress: updateOptionalField(inference.billingAddress, "confirmed"),
        shippingAddress: updateOptionalField(inference.shippingAddress, "confirmed"),
      })),
    })),

  confirmRoute: () =>
    set((state) => ({
      fixture: withInference(state.fixture, (inference) => ({
        ...inference,
        products: inference.products.map((field) => updateField(field, "confirmed")),
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
    set({
      fixture: null,
      uploadedDocuments: [],
      price: null,
      submitResult: null,
      loading: false,
      error: null,
    }),
}));

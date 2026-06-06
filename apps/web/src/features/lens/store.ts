import { create } from "zustand";
import { getPersonaFixture, pricePayload, submitPayload } from "./api";
import type {
  DocumentFactExtraction,
  FieldStatus,
  InferredField,
  PersonaFixture,
  PriceResponse,
  SubmitResponse,
} from "./types";

type LensStore = {
  fixture: PersonaFixture | null;
  price: PriceResponse | null;
  submitResult: SubmitResponse | null;
  loading: boolean;
  error: string | null;
  loadPersona: (persona?: PersonaFixture["id"]) => Promise<void>;
  loadJoshuaDemo: () => Promise<void>;
  confirmEvidence: () => void;
  confirmCountry: () => void;
  confirmRoute: () => void;
  submitBooking: () => Promise<void>;
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
  price: null,
  submitResult: null,
  loading: false,
  error: null,

  loadPersona: async (persona = "joshua") => {
    set({ loading: true, error: null, submitResult: null });
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

  submitBooking: async () => {
    const fixture = get().fixture;
    if (!fixture) return;

    set({ loading: true, error: null });
    try {
      const submitResult = await submitPayload(fixture.payload);
      set({ submitResult, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submit failed";
      set({ error: message, loading: false });
    }
  },

  reset: () => set({ fixture: null, price: null, submitResult: null, error: null }),
}));

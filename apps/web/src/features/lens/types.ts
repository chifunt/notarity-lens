export type FieldStatus =
  | "inferred"
  | "confirmed"
  | "needs_review"
  | "conflict"
  | "missing"
  | "edited"
  | "not_applicable";

export type EvidenceRef = {
  id: string;
  documentId: string;
  filename: string;
  page?: number;
  quote: string;
  confidence?: number;
  source: string;
};

export type InferredField<T = unknown> = {
  key: string;
  label: string;
  value: T;
  status: FieldStatus;
  confidence?: number;
  evidence: EvidenceRef[];
  explanation?: string;
  requiresConfirmation: boolean;
};

export type ExtractedDocument = {
  id: string;
  filename: string;
  canonicalName: string;
  mimeType: string;
  size: number;
  textByPage: Array<{ page: number; text: string }>;
  extractionStatus: string;
};

export type DocumentFactExtraction = {
  persona?: string;
  documents: ExtractedDocument[];
  countryOfUse: InferredField<string>;
  products: InferredField[];
  people: InferredField[];
  billingAddress?: InferredField<string>;
  shippingAddress?: InferredField<string>;
  hardCopy?: InferredField<boolean>;
  apostille?: InferredField<boolean>;
  uncertainties: string[];
};

export type PriceLine = {
  name: string;
  amount: number;
  pricePerUnit: number;
  net: number;
  _product?: string;
  identifier?: string | number;
  pricingEnabled?: boolean;
};

export type AppointmentPayload = {
  destinationCountry: string;
  confirmedPrice?: number;
  products: Array<{
    id: string;
    apostille: boolean | null;
    files: string[];
  }>;
  participants: Array<{ email: string; client: boolean; supervisor: boolean }>;
  timeslots: string[];
  billingDetails: { countryCode: string; [key: string]: unknown };
  shippingDetails?: { countryCode: string; [key: string]: unknown };
  hardCopy: { hardCopy: boolean; expressShipping: boolean };
  [key: string]: unknown;
};

export type PersonaFixture = {
  id:
    | "joshua"
    | "robert"
    | "elizabeth"
    | "amara"
    | "noah"
    | "sofia"
    | "kenji"
    | "priya";
  name: string;
  scenario: string;
  documents: ExtractedDocument[];
  inference: DocumentFactExtraction;
  priceLines: PriceLine[];
  payload: AppointmentPayload;
};

export type LensFixture = Omit<PersonaFixture, "id" | "payload" | "priceLines"> & {
  id: PersonaFixture["id"] | "upload";
  payload?: AppointmentPayload;
  priceLines?: PriceLine[];
};

export type PriceResponse = {
  lines: PriceLine[];
  confirmedPrice: number;
  source: "mock" | "live" | "rule";
};

export type InferDocumentsResponse = {
  inference: DocumentFactExtraction;
  source: "mock" | "live" | "fallback" | "rule";
  warning?: string;
};

export type DraftPayloadResponse = {
  payload?: AppointmentPayload;
  blockers: string[];
  warnings: string[];
};

export type UploadDocumentsResponse = {
  sessionId: string;
  documents: ExtractedDocument[];
  source: "fixture" | "upload";
};

export type MobileUploadStatus = "waiting" | "processing" | "ready" | "error";

export type MobileUploadResult = {
  fixture: LensFixture;
  price: PriceResponse | null;
  blockers: string[];
  warnings: string[];
};

export type MobileUploadSession = {
  sessionId: string;
  status: MobileUploadStatus;
  createdAt: string;
  updatedAt: string;
  uploadUrl: string;
  result?: MobileUploadResult;
  error?: string;
};

export type SubmitResponse = {
  ok: boolean;
  id: string;
  mode: "mock" | "live";
  payload: AppointmentPayload;
};

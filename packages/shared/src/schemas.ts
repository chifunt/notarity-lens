import { z } from "zod";

export const HealthResponseSchema = z.object({
  ok: z.literal(true),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const FieldStatusSchema = z.enum([
  "inferred",
  "confirmed",
  "needs_review",
  "conflict",
  "missing",
  "edited",
  "not_applicable",
]);

export type FieldStatus = z.infer<typeof FieldStatusSchema>;

export const EvidenceRefSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  filename: z.string(),
  page: z.number().int().positive().optional(),
  quote: z.string(),
  bbox: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  confidence: z.number().min(0).max(1).optional(),
  source: z.enum(["pdf_text", "ocr", "llm", "rule", "fixture"]),
});

export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;

export const InferredFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.unknown(),
  status: FieldStatusSchema,
  confidence: z.number().min(0).max(1).optional(),
  evidence: z.array(EvidenceRefSchema).default([]),
  explanation: z.string().optional(),
  requiresConfirmation: z.boolean().default(false),
});

export type InferredField<T = unknown> = Omit<
  z.infer<typeof InferredFieldSchema>,
  "value"
> & {
  value: T;
};

export const ExtractedDocumentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  canonicalName: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  textByPage: z
    .array(
      z.object({
        page: z.number().int().positive(),
        text: z.string(),
      }),
    )
    .default([]),
  extractionStatus: z.enum(["pending", "extracted", "fixture", "failed"]),
});

export type ExtractedDocument = z.infer<typeof ExtractedDocumentSchema>;

export const AddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  business: z.boolean(),
  email: z.string().email(),
  phoneNumber: z.string(),
  address: z.string(),
  zipCode: z.string(),
  city: z.string(),
  stateProvince: z.string(),
  countryCode: z.string().length(2),
  businessDetails: z
    .object({
      companyName: z.string(),
      vat: z.string(),
    })
    .optional(),
});

export type Address = z.infer<typeof AddressSchema>;

export const ContactDetailsSchema = AddressSchema.omit({
  address: true,
  zipCode: true,
  city: true,
  stateProvince: true,
  countryCode: true,
}).extend({
  contactDetailsSameAsBillingDetails: z.boolean(),
});

export type ContactDetails = z.infer<typeof ContactDetailsSchema>;

export const ShippingDetailsSchema = AddressSchema.extend({
  shippingDetailsSameAsBillingDetails: z.boolean(),
});

export type ShippingDetails = z.infer<typeof ShippingDetailsSchema>;

export const PriceLineSchema = z.object({
  name: z.string(),
  amount: z.number(),
  pricePerUnit: z.number(),
  net: z.number(),
  _product: z.string().optional(),
  identifier: z.union([z.string(), z.number()]).optional(),
  pricingEnabled: z.boolean().optional(),
});

export type PriceLine = z.infer<typeof PriceLineSchema>;

export const NotarityProductSelectionSchema = z.object({
  id: z.string(),
  apostille: z.boolean().nullable(),
  userInput: z.string(),
  documentsNotReadyYet: z.boolean(),
  needHelpDrafting: z.boolean(),
  proofOfRepresentation: z.boolean().nullable(),
  files: z.array(z.string()),
});

export type NotarityProductSelection = z.infer<typeof NotarityProductSelectionSchema>;

export const ParticipantSchema = z.object({
  email: z.string().email(),
  client: z.boolean(),
  supervisor: z.boolean(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

export const AppointmentPayloadSchema = z.object({
  _bookingForm: z.string(),
  language: z.string(),
  origin: z.string(),
  confirmedPrice: z.number().optional(),
  hardCopy: z.object({
    expressShipping: z.boolean(),
    hardCopy: z.boolean(),
  }),
  newsletter: z.boolean(),
  mode: z.enum(["debug", "live"]),
  _appointmentRequestDraft: z.string(),
  destinationCountry: z.string().length(2),
  products: z.array(NotarityProductSelectionSchema),
  participants: z.array(ParticipantSchema),
  timeslots: z.array(z.string()),
  instantNotarisationSupported: z.boolean(),
  instant: z.boolean(),
  timezone: z.string(),
  billingDetails: AddressSchema,
  contactDetails: ContactDetailsSchema,
  shippingDetails: ShippingDetailsSchema.optional(),
  preferredNotary: z.string(),
});

export type AppointmentPayload = z.infer<typeof AppointmentPayloadSchema>;

export const ProductFixtureSchema = z.object({
  id: z.string(),
  tag: z.string().optional(),
  title: z.string(),
  baseFee: z.number().int().nonnegative(),
  apostilleRequired: z.boolean(),
  showApostille: z.boolean(),
  fileUploadRequired: z.boolean(),
  hardCopySupported: z.boolean(),
  instantNotarisationSupported: z.boolean(),
});

export type ProductFixture = z.infer<typeof ProductFixtureSchema>;

export const DocumentFactExtractionSchema = z.object({
  persona: z.string().optional(),
  documents: z.array(ExtractedDocumentSchema),
  countryOfUse: InferredFieldSchema,
  products: z.array(InferredFieldSchema),
  people: z.array(InferredFieldSchema),
  billingAddress: InferredFieldSchema.optional(),
  shippingAddress: InferredFieldSchema.optional(),
  hardCopy: InferredFieldSchema.optional(),
  apostille: InferredFieldSchema.optional(),
  uncertainties: z.array(z.string()).default([]),
});

export type DocumentFactExtraction = z.infer<typeof DocumentFactExtractionSchema>;

export const LensDraftSchema = z.object({
  sessionId: z.string(),
  mode: z.enum(["mock", "live"]),
  persona: z
    .enum([
      "joshua",
      "robert",
      "elizabeth",
      "amara",
      "noah",
      "sofia",
      "kenji",
      "priya",
    ])
    .optional(),
  files: z.array(ExtractedDocumentSchema),
  inference: DocumentFactExtractionSchema.optional(),
  countryOfUse: z.object({
    value: z.string().optional(),
    status: FieldStatusSchema,
    evidence: z.array(EvidenceRefSchema).default([]),
  }),
  billingCountry: z.string().optional(),
  shippingCountry: z.string().optional(),
  products: z.array(NotarityProductSelectionSchema).default([]),
  participants: z.array(ParticipantSchema).default([]),
  billingDetails: AddressSchema.optional(),
  contactDetails: ContactDetailsSchema.optional(),
  hardCopy: z
    .object({
      hardCopy: z.boolean(),
      expressShipping: z.boolean(),
    })
    .default({ hardCopy: false, expressShipping: false }),
  shippingDetails: ShippingDetailsSchema.optional(),
  timeslots: z.array(z.string()).default([]),
  confirmedPrice: z.number().optional(),
});

export type LensDraft = z.infer<typeof LensDraftSchema>;

export const PersonaFixtureSchema = z.object({
  id: z.enum([
    "joshua",
    "robert",
    "elizabeth",
    "amara",
    "noah",
    "sofia",
    "kenji",
    "priya",
  ]),
  name: z.string(),
  scenario: z.string(),
  documents: z.array(ExtractedDocumentSchema),
  inference: DocumentFactExtractionSchema,
  products: z.array(ProductFixtureSchema),
  priceLines: z.array(PriceLineSchema),
  payload: AppointmentPayloadSchema,
});

export type PersonaFixture = z.infer<typeof PersonaFixtureSchema>;

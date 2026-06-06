import {
  AT_TIMESLOT_LABEL,
  AUSTRIA_PRODUCT_TAG,
  ELIZABETH_FLEXCO_PRODUCT_ID,
  ELIZABETH_TIMESLOT_ID,
  GENERIC_PRODUCT_TAG,
  JOSHUA_NIE_APPLICATION_PRODUCT_ID,
  JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID,
  JOSHUA_TIMESLOT_ID,
  NON_AT_TIMESLOT_LABEL,
  NOTARITY_BOOKING_FORM_ID,
  NOTARITY_DRAFT_ID,
  NOTARITY_ORIGIN,
  ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
  ROBERT_TIMESLOT_ID,
  SPAIN_NIE_PRODUCT_TAG,
} from "../constants.js";
import type {
  Address,
  AppointmentPayload,
  DocumentFactExtraction,
  EvidenceRef,
  ExtractedDocument,
  PersonaFixture,
  PriceLine,
  ProductFixture,
} from "../schemas.js";

const JOSHUA_FILE_A = "nie-application-demo-joshua_timms.pdf";
const JOSHUA_FILE_B_ORIGINAL = "nie_personal_details-joshuatimms.pdf";
const JOSHUA_FILE_B_CANONICAL = "nie_personal_details.pdf";

const evidence = (
  id: string,
  documentId: string,
  filename: string,
  page: number,
  quote: string,
  confidence = 0.92,
): EvidenceRef => ({
  id,
  documentId,
  filename,
  page,
  quote,
  confidence,
  source: "fixture",
});

export const joshuaDocuments: ExtractedDocument[] = [
  {
    id: "doc-joshua-nie-application",
    filename: JOSHUA_FILE_A,
    canonicalName: JOSHUA_FILE_A,
    mimeType: "application/pdf",
    size: 147511,
    extractionStatus: "fixture",
    textByPage: [
      {
        page: 1,
        text: [
          "Power of Attorney for obtaining a Foreign Identity Number (NIE).",
          "Applicant: Joshua Timms.",
          "Residence: 350 5th Avenue, New York, NY 10118, United States.",
          "Purpose: Spanish tax authorities and work in Spain.",
        ].join(" "),
      },
      {
        page: 2,
        text: [
          "Representative: Maria Garcia Lopez.",
          "Address for hard copy: Carrer de Mallorca 401, 08013 Barcelona, Spain.",
          "Original signed and apostilled hard copy required for Spanish authorities.",
        ].join(" "),
      },
    ],
  },
  {
    id: "doc-joshua-personal-details",
    filename: JOSHUA_FILE_B_ORIGINAL,
    canonicalName: JOSHUA_FILE_B_CANONICAL,
    mimeType: "application/pdf",
    size: 84758,
    extractionStatus: "fixture",
    textByPage: [
      {
        page: 1,
        text: [
          "NIE personal details form.",
          "Name: Joshua Timms.",
          "Nationality: United States of America.",
          "Email: joshua.timms@notarity.com.",
          "Motivation: employed by a Spanish employer.",
        ].join(" "),
      },
    ],
  },
];

export const joshuaInference: DocumentFactExtraction = {
  persona: "joshua",
  documents: joshuaDocuments,
  countryOfUse: {
    key: "countryOfUse",
    label: "Country of use",
    value: "ES",
    status: "needs_review",
    confidence: 0.92,
    evidence: [
      evidence(
        "ev-joshua-nie",
        "doc-joshua-nie-application",
        JOSHUA_FILE_A,
        1,
        "Foreign Identity Number (NIE)",
      ),
      evidence(
        "ev-joshua-tax",
        "doc-joshua-nie-application",
        JOSHUA_FILE_A,
        1,
        "Spanish tax authorities",
      ),
      evidence(
        "ev-joshua-barcelona",
        "doc-joshua-nie-application",
        JOSHUA_FILE_A,
        2,
        "Barcelona, Spain",
      ),
    ],
    explanation:
      "The document mentions NIE, Spanish tax authorities, and Barcelona. Please confirm Spain as the country where the notarised document will be used or accepted.",
    requiresConfirmation: true,
  },
  products: [
    {
      key: "recommendedProduct",
      label: "Recommended product",
      value: "nie_number_application",
      status: "inferred",
      confidence: 0.91,
      evidence: [
        evidence(
          "ev-joshua-product",
          "doc-joshua-nie-application",
          JOSHUA_FILE_A,
          1,
          "obtaining a Foreign Identity Number (NIE)",
        ),
      ],
      explanation: "This maps deterministically to the NIE number application product.",
      requiresConfirmation: false,
    },
    {
      key: "requiredCompanionDocument",
      label: "Required companion document",
      value: "nie_personal_data",
      status: "inferred",
      confidence: 0.86,
      evidence: [
        evidence(
          "ev-joshua-companion",
          "doc-joshua-personal-details",
          JOSHUA_FILE_B_CANONICAL,
          1,
          "NIE personal details form",
        ),
      ],
      explanation:
        "Because NIE number application was selected, Notarity also needs the NIE Personal Data form.",
      requiresConfirmation: false,
    },
  ],
  people: [
    {
      key: "participant",
      label: "Participant",
      value: "Joshua Timms",
      status: "inferred",
      confidence: 0.95,
      evidence: [
        evidence(
          "ev-joshua-name",
          "doc-joshua-nie-application",
          JOSHUA_FILE_A,
          1,
          "Applicant: Joshua Timms",
        ),
      ],
      explanation: "Joshua Timms appears as the applicant.",
      requiresConfirmation: false,
    },
  ],
  billingAddress: {
    key: "billingAddress",
    label: "Billing/home address",
    value: "350 5th Avenue, New York, NY 10118, United States",
    status: "inferred",
    confidence: 0.88,
    evidence: [
      evidence(
        "ev-joshua-ny",
        "doc-joshua-nie-application",
        JOSHUA_FILE_A,
        1,
        "350 5th Avenue, New York, NY 10118, United States",
      ),
    ],
    explanation: "New York is treated as residence and billing context, not country of use.",
    requiresConfirmation: false,
  },
  shippingAddress: {
    key: "shippingAddress",
    label: "Shipping address",
    value: "Carrer de Mallorca 401, 08013 Barcelona, Spain",
    status: "needs_review",
    confidence: 0.84,
    evidence: [
      evidence(
        "ev-joshua-shipping",
        "doc-joshua-nie-application",
        JOSHUA_FILE_A,
        2,
        "Carrer de Mallorca 401, 08013 Barcelona, Spain",
      ),
    ],
    explanation: "The hard copy should ship to Barcelona.",
    requiresConfirmation: true,
  },
  apostille: {
    key: "apostille",
    label: "Apostille",
    value: true,
    status: "needs_review",
    confidence: 0.87,
    evidence: [
      evidence(
        "ev-joshua-apostille",
        "doc-joshua-nie-application",
        JOSHUA_FILE_A,
        2,
        "Original signed and apostilled hard copy required",
      ),
    ],
    explanation: "Apostille is required for the NIE application route.",
    requiresConfirmation: true,
  },
  hardCopy: {
    key: "hardCopy",
    label: "Hard copy",
    value: true,
    status: "needs_review",
    confidence: 0.85,
    evidence: [
      evidence(
        "ev-joshua-hard-copy",
        "doc-joshua-nie-application",
        JOSHUA_FILE_A,
        2,
        "Original signed and apostilled hard copy required",
      ),
    ],
    explanation: "A physical original is needed and should be shipped to Barcelona.",
    requiresConfirmation: true,
  },
  uncertainties: [
    "Spain appears both as country of use and shipping country, while the billing address is in the United States. This is valid but should be confirmed.",
  ],
};

export const joshuaPriceLines: PriceLine[] = [
  {
    name: "NIE number application",
    _product: JOSHUA_NIE_APPLICATION_PRODUCT_ID,
    amount: 1,
    pricePerUnit: 55000,
    net: 55000,
    identifier: 1,
    pricingEnabled: true,
  },
  {
    name: "NIE Personal Data",
    _product: JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID,
    amount: 1,
    pricePerUnit: 0,
    net: 0,
    identifier: 2,
    pricingEnabled: true,
  },
  {
    name: "Hard Copy including shipping",
    amount: 1,
    pricePerUnit: 3000,
    net: 3000,
    identifier: 3,
    pricingEnabled: true,
  },
];

export const joshuaBillingDetails: Address = {
  firstName: "Joshua",
  lastName: "Timms",
  business: false,
  email: "joshua.timms@notarity.com",
  phoneNumber: "+12125550174",
  address: "5th Ave 350",
  zipCode: "10118",
  city: "New York",
  stateProvince: "NY",
  countryCode: "US",
};

export const joshuaPayload: AppointmentPayload = {
  _bookingForm: NOTARITY_BOOKING_FORM_ID,
  language: "en",
  origin: NOTARITY_ORIGIN,
  confirmedPrice: 580,
  hardCopy: { expressShipping: false, hardCopy: true },
  newsletter: false,
  mode: "debug",
  _appointmentRequestDraft: NOTARITY_DRAFT_ID,
  destinationCountry: "ES",
  products: [
    {
      id: JOSHUA_NIE_APPLICATION_PRODUCT_ID,
      apostille: true,
      userInput: "",
      documentsNotReadyYet: false,
      needHelpDrafting: false,
      proofOfRepresentation: null,
      files: [JOSHUA_FILE_A],
    },
    {
      id: JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID,
      apostille: null,
      userInput: "",
      documentsNotReadyYet: false,
      needHelpDrafting: false,
      proofOfRepresentation: null,
      files: [JOSHUA_FILE_B_CANONICAL],
    },
  ],
  participants: [
    { email: "joshua.timms@notarity.com", client: true, supervisor: false },
  ],
  timeslots: [JOSHUA_TIMESLOT_ID],
  instantNotarisationSupported: false,
  instant: false,
  timezone: "Europe/Vienna",
  billingDetails: joshuaBillingDetails,
  contactDetails: {
    contactDetailsSameAsBillingDetails: true,
    firstName: "Joshua",
    lastName: "Timms",
    business: false,
    email: "joshua.timms@notarity.com",
    phoneNumber: "+12125550174",
  },
  shippingDetails: {
    shippingDetailsSameAsBillingDetails: false,
    firstName: "Joshua",
    lastName: "Timms",
    business: false,
    email: "joshua.timms@notarity.com",
    phoneNumber: "+12125550174",
    address: "Carrer de Mallorca 401",
    zipCode: "08013",
    city: "Barcelona",
    stateProvince: "CT",
    countryCode: "ES",
  },
  preferredNotary: "",
};

export const productFixtures: ProductFixture[] = [
  {
    id: JOSHUA_NIE_APPLICATION_PRODUCT_ID,
    tag: SPAIN_NIE_PRODUCT_TAG,
    title: "NIE number application",
    baseFee: 55000,
    apostilleRequired: true,
    showApostille: true,
    fileUploadRequired: true,
    hardCopySupported: true,
    instantNotarisationSupported: false,
  },
  {
    id: JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID,
    title: "NIE Personal Data",
    baseFee: 0,
    apostilleRequired: false,
    showApostille: false,
    fileUploadRequired: true,
    hardCopySupported: false,
    instantNotarisationSupported: false,
  },
  {
    id: ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
    tag: GENERIC_PRODUCT_TAG,
    title: "Signature notarisation",
    baseFee: 12000,
    apostilleRequired: false,
    showApostille: true,
    fileUploadRequired: false,
    hardCopySupported: false,
    instantNotarisationSupported: false,
  },
  {
    id: ELIZABETH_FLEXCO_PRODUCT_ID,
    tag: AUSTRIA_PRODUCT_TAG,
    title: "FlexCo Incorporation",
    baseFee: 0,
    apostilleRequired: false,
    showApostille: false,
    fileUploadRequired: true,
    hardCopySupported: false,
    instantNotarisationSupported: false,
  },
];

export const joshuaFixture: PersonaFixture = {
  id: "joshua",
  name: "Joshua Timms",
  scenario:
    "American freelance software developer in New York applying for a Spanish NIE, with apostille and hard copy shipping to Barcelona.",
  documents: joshuaDocuments,
  inference: joshuaInference,
  products: productFixtures.filter((product) =>
    [JOSHUA_NIE_APPLICATION_PRODUCT_ID, JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID].includes(
      product.id,
    ),
  ),
  priceLines: joshuaPriceLines,
  payload: joshuaPayload,
};

export const robertFixture: PersonaFixture = {
  id: "robert",
  name: "Robert Stevens",
  scenario:
    "Lithuanian company owner needs a Power of Attorney notarised remotely while away from his office.",
  documents: [
    {
      id: "doc-robert-poa",
      filename: "Robert_Stevens_sample_case.pdf",
      canonicalName: "Robert_Stevens_sample_case.pdf",
      mimeType: "application/pdf",
      size: 0,
      extractionStatus: "fixture",
      textByPage: [
        {
          page: 1,
          text: "Power of Attorney for shareholder agreement representation in Lithuania.",
        },
      ],
    },
  ],
  inference: {
    persona: "robert",
    documents: [],
    countryOfUse: {
      key: "countryOfUse",
      label: "Country of use",
      value: "LT",
      status: "inferred",
      confidence: 0.82,
      evidence: [
        evidence(
          "ev-robert-lt",
          "doc-robert-poa",
          "Robert_Stevens_sample_case.pdf",
          1,
          "shareholder agreement representation in Lithuania",
        ),
      ],
      explanation: "Lithuania is the relevant country of use.",
      requiresConfirmation: false,
    },
    products: [],
    people: [],
    uncertainties: [],
  },
  products: productFixtures.filter(
    (product) => product.id === ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
  ),
  priceLines: [
    {
      name: "Signature notarisation",
      _product: ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
      amount: 1,
      pricePerUnit: 12000,
      net: 12000,
      pricingEnabled: true,
    },
  ],
  payload: {
    _bookingForm: NOTARITY_BOOKING_FORM_ID,
    language: "en",
    origin: "https://staging.notarity.com/#/book/start-vienna-hackathon/page-4",
    confirmedPrice: 120,
    destinationCountry: "LT",
    products: [
      {
        id: ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
        apostille: false,
        userInput: "",
        documentsNotReadyYet: false,
        needHelpDrafting: false,
        proofOfRepresentation: false,
        files: [],
      },
    ],
    participants: [{ email: "mp@notarity.com", client: true, supervisor: false }],
    timeslots: [ROBERT_TIMESLOT_ID],
    instantNotarisationSupported: false,
    instant: false,
    timezone: "Europe/Vienna",
    billingDetails: {
      firstName: "Robert",
      lastName: "Stevens",
      business: false,
      email: "mp+robertstevens@notarity.com",
      phoneNumber: "+436781220282",
      address: "Savanoriu pr. 120",
      zipCode: "44148",
      city: "Kaunas",
      stateProvince: "Kauno apskr.",
      countryCode: "LT",
    },
    contactDetails: {
      contactDetailsSameAsBillingDetails: true,
      firstName: "Robert",
      lastName: "Stevens",
      business: false,
      email: "mp+robertstevens@notarity.com",
      phoneNumber: "+436781220282",
    },
    hardCopy: { hardCopy: false, expressShipping: false },
    preferredNotary: "",
    newsletter: false,
    mode: "debug",
    _appointmentRequestDraft: NOTARITY_DRAFT_ID,
  },
};

export const elizabethFixture: PersonaFixture = {
  id: "elizabeth",
  name: "Elizabeth Midgley",
  scenario:
    "British SaaS founder incorporating an Austrian FlexCo, with UK billing and a co-founder ambiguity.",
  documents: [
    {
      id: "doc-elizabeth-flexco",
      filename: "Gesellschaftsvertrag_Midgley_Tech_EU_FlexCo.pdf",
      canonicalName: "Gesellschaftsvertrag_Midgley_Tech_EU_FlexCo.pdf",
      mimeType: "application/pdf",
      size: 0,
      extractionStatus: "fixture",
      textByPage: [
        {
          page: 1,
          text: "Austrian FlexCo incorporation documents for company seat in Vienna.",
        },
      ],
    },
  ],
  inference: {
    persona: "elizabeth",
    documents: [],
    countryOfUse: {
      key: "countryOfUse",
      label: "Country of use",
      value: "AT",
      status: "needs_review",
      confidence: 0.78,
      evidence: [
        evidence(
          "ev-elizabeth-at",
          "doc-elizabeth-flexco",
          "Gesellschaftsvertrag_Midgley_Tech_EU_FlexCo.pdf",
          1,
          "company seat in Vienna",
        ),
      ],
      explanation:
        "Austria is likely the country of use, while billing remains in the United Kingdom.",
      requiresConfirmation: true,
    },
    products: [],
    people: [
      {
        key: "participantAmbiguity",
        label: "Participant ambiguity",
        value: "Elizabeth Midgley; possible co-founder Sophie in Berlin",
        status: "needs_review",
        confidence: 0.6,
        evidence: [],
        explanation:
          "The scenario mentions a co-founder, but the expected payload includes Elizabeth only.",
        requiresConfirmation: true,
      },
    ],
    uncertainties: [
      "Scenario mentions a co-founder in Berlin, but expected payload includes Elizabeth only.",
    ],
  },
  products: productFixtures.filter((product) => product.id === ELIZABETH_FLEXCO_PRODUCT_ID),
  priceLines: [],
  payload: {
    _bookingForm: NOTARITY_BOOKING_FORM_ID,
    language: "en",
    origin: NOTARITY_ORIGIN,
    hardCopy: { expressShipping: true, hardCopy: false },
    newsletter: false,
    mode: "debug",
    _appointmentRequestDraft: NOTARITY_DRAFT_ID,
    destinationCountry: "AT",
    products: [
      {
        id: ELIZABETH_FLEXCO_PRODUCT_ID,
        apostille: null,
        userInput: "",
        documentsNotReadyYet: false,
        needHelpDrafting: false,
        proofOfRepresentation: null,
        files: ["Gesellschaftsvertrag_Midgley_Tech_EU_FlexCo.pdf"],
      },
    ],
    participants: [
      { email: "elizabeth.midgley@notarity.com", client: true, supervisor: false },
    ],
    timeslots: [ELIZABETH_TIMESLOT_ID],
    instantNotarisationSupported: false,
    instant: false,
    timezone: "Europe/Vienna",
    billingDetails: {
      firstName: "Elizabeth",
      lastName: "Midgley",
      business: true,
      email: "elizabeth.midgley@notarity.com",
      phoneNumber: "+447911123456",
      address: "Finsbury Square 14",
      zipCode: "EC2A 2AH",
      city: "London",
      stateProvince: "England",
      countryCode: "GB",
      businessDetails: { companyName: "Midgley Tech Ltd", vat: "" },
    },
    contactDetails: {
      contactDetailsSameAsBillingDetails: true,
      firstName: "Elizabeth",
      lastName: "Midgley",
      business: true,
      email: "elizabeth.midgley@notarity.com",
      phoneNumber: "+447911123456",
      businessDetails: { companyName: "Midgley Tech Ltd", vat: "" },
    },
    preferredNotary: "",
  },
};

export const personaFixtures: Record<PersonaFixture["id"], PersonaFixture> = {
  joshua: joshuaFixture,
  robert: robertFixture,
  elizabeth: elizabethFixture,
};

export const mockBookingForm = {
  id: NOTARITY_BOOKING_FORM_ID,
  slug: "start-vienna-hackathon",
  timeslotLabels: {
    default: NON_AT_TIMESLOT_LABEL,
    AT: AT_TIMESLOT_LABEL,
  },
  productTags: {
    AT: [AUSTRIA_PRODUCT_TAG],
    ES: [SPAIN_NIE_PRODUCT_TAG, GENERIC_PRODUCT_TAG],
    generic: [GENERIC_PRODUCT_TAG],
  },
};

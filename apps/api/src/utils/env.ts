export type ApiConfig = {
  notarityApiBaseUrl: string;
  bookingFormSlug: string;
  bookingFormId: string;
  notarityOrigin: string;
  notarityDraftId: string;
  basicAuthUsername?: string;
  basicAuthPassword?: string;
  bearerToken?: string;
  mockNotarity: boolean;
  mockAi: boolean;
  allowLiveSubmit: boolean;
};

function envBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === "") return fallback;
  return value.toLowerCase() === "true";
}

export function getApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    notarityApiBaseUrl:
      env.NOTARITY_API_BASE_URL ?? "https://staging-api.notarity.com",
    bookingFormSlug: env.NOTARITY_BOOKING_FORM_SLUG ?? "start-vienna-hackathon",
    bookingFormId: env.NOTARITY_BOOKING_FORM_ID ?? "kmVXjYM937qB8JTYG2yH",
    notarityOrigin:
      env.NOTARITY_ORIGIN ??
      "https://staging.notarity.com/#/my-companies/HpKfHmbViXxFEMzjtxln/appointment-requests",
    notarityDraftId: env.NOTARITY_DRAFT_ID ?? "vfniS9nfoq8nMpRqQj7Z",
    basicAuthUsername: env.NOTARITY_BASIC_AUTH_USERNAME || undefined,
    basicAuthPassword: env.NOTARITY_BASIC_AUTH_PASSWORD || undefined,
    bearerToken: env.NOTARITY_BEARER_TOKEN || undefined,
    mockNotarity: envBoolean(env.MOCK_NOTARITY, true),
    mockAi: envBoolean(env.MOCK_AI, true),
    allowLiveSubmit: envBoolean(env.ALLOW_LIVE_SUBMIT, false),
  };
}

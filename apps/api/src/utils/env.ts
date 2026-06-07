import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
  deepseekApiKey?: string;
  deepseekBaseUrl: string;
  deepseekModelFast: string;
  deepseekModelReview: string;
};

let localEnvLoaded = false;

function parseEnvValue(rawValue: string) {
  const value = rawValue.trim();
  const quote = value[0];
  if (
    (quote === "\"" || quote === "'") &&
    value[value.length - 1] === quote
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseEnvFile(contents: string) {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const assignment = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separator = assignment.indexOf("=");
    if (separator === -1) continue;

    const key = assignment.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    values[key] = parseEnvValue(assignment.slice(separator + 1));
  }

  return values;
}

function loadLocalEnvFiles(env: NodeJS.ProcessEnv) {
  if (env !== process.env) return;
  if (localEnvLoaded || env.NODE_ENV === "test" || env.VITEST) return;
  localEnvLoaded = true;

  const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const repoRoot = resolve(apiRoot, "../..");
  const originallySet = new Set(Object.keys(env));

  for (const filePath of [
    resolve(repoRoot, ".env"),
    resolve(repoRoot, ".env.local"),
    resolve(apiRoot, ".env"),
    resolve(apiRoot, ".env.local"),
  ]) {
    if (!existsSync(filePath)) continue;

    const values = parseEnvFile(readFileSync(filePath, "utf8"));
    for (const [key, value] of Object.entries(values)) {
      if (!originallySet.has(key)) env[key] = value;
    }
  }
}

function envBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === "") return fallback;
  return value.toLowerCase() === "true";
}

export function getApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  loadLocalEnvFiles(env);

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
    deepseekApiKey: env.DEEPSEEK_API_KEY || undefined,
    deepseekBaseUrl: env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    deepseekModelFast: env.DEEPSEEK_MODEL_FAST ?? "deepseek-v4-flash",
    deepseekModelReview: env.DEEPSEEK_MODEL_REVIEW ?? "deepseek-v4-pro",
  };
}

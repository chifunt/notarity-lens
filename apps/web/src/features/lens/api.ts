import type {
  PersonaFixture,
  PriceResponse,
  SubmitResponse,
  UploadDocumentsResponse,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function responseErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) {
      return `${body.error} (${response.status})`;
    }
  } catch {
    // Fall back to the generic status message below when the body is not JSON.
  }

  return `API request failed (${response.status})`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function requestFormJson<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export function getApiHealth() {
  return requestJson<{ ok: true }>("/health");
}

export function getPersonaFixture(persona: PersonaFixture["id"] = "joshua") {
  return requestJson<PersonaFixture>(`/api/fixtures/${persona}`);
}

export function uploadDocumentFiles(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return requestFormJson<UploadDocumentsResponse>("/api/documents/upload", formData);
}

export function pricePayload(payload: unknown) {
  return requestJson<PriceResponse>("/api/price", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitPayload(payload: unknown) {
  return requestJson<SubmitResponse>("/api/submit", {
    method: "POST",
    body: JSON.stringify({ payload }),
  });
}

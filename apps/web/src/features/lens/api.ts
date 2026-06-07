import type {
  DraftPayloadResponse,
  ExtractedDocument,
  InferDocumentsResponse,
  MobileUploadSession,
  DocumentFactExtraction,
  PersonaFixture,
  PriceResponse,
  SubmitResponse,
  UploadDocumentsResponse,
} from "./types";

const CONFIGURED_API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function apiBaseUrl() {
  try {
    const url = new URL(CONFIGURED_API_BASE);
    if (typeof window !== "undefined") {
      const currentHost = window.location.hostname;
      if (isLoopbackHost(url.hostname) && !isLoopbackHost(currentHost)) {
        url.hostname = currentHost;
      }
    }
    return url.origin;
  } catch {
    return CONFIGURED_API_BASE;
  }
}

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
  const response = await fetch(`${apiBaseUrl()}${path}`, {
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
  const response = await fetch(`${apiBaseUrl()}${path}`, {
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

export function getFixturePdfUrl(
  persona: PersonaFixture["id"],
  documentId: ExtractedDocument["id"],
) {
  return `${apiBaseUrl()}/api/fixtures/${persona}/documents/${encodeURIComponent(
    documentId,
  )}/pdf`;
}

export function uploadDocumentFiles(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return requestFormJson<UploadDocumentsResponse>("/api/documents/upload", formData);
}

export function createMobileUploadSession(webOrigin: string) {
  return requestJson<MobileUploadSession>("/api/mobile-sessions", {
    method: "POST",
    body: JSON.stringify({ webOrigin }),
  });
}

export function getMobileUploadSession(sessionId: string) {
  return requestJson<MobileUploadSession>(`/api/mobile-sessions/${sessionId}`);
}

export function resetMobileUploadSession(sessionId: string) {
  return requestJson<{ ok: true }>(`/api/mobile-sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export function uploadMobileSessionFiles(sessionId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return requestFormJson<MobileUploadSession>(
    `/api/mobile-sessions/${sessionId}/upload`,
    formData,
  );
}

export function inferDocuments(documents: ExtractedDocument[]) {
  return requestJson<InferDocumentsResponse>("/api/infer", {
    method: "POST",
    body: JSON.stringify({ documents }),
  });
}

export function draftPayload(inference: DocumentFactExtraction) {
  return requestJson<DraftPayloadResponse>("/api/draft", {
    method: "POST",
    body: JSON.stringify({ inference }),
  });
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

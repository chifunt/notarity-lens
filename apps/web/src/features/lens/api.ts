import type { PersonaFixture, PriceResponse, SubmitResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function getApiHealth() {
  return requestJson<{ ok: true }>("/health");
}

export function getPersonaFixture(persona = "joshua") {
  return requestJson<PersonaFixture>(`/api/fixtures/${persona}`);
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

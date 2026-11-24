import type { DiagramResponse } from "@/types/diagram";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      typeof error?.detail === "string"
        ? error.detail
        : `Request failed (HTTP ${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

export function getResults() {
  return request<DiagramResponse[]>("/results");
}

export function generateDiagram(conceptId: number) {
  return request<DiagramResponse>(
    `/generate/${conceptId}`,
    {
      method: "POST",
    },
  );
}

export function checkHealth() {
  return request<{ status: string }>("/health");
}
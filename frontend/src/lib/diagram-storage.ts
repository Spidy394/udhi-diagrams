import type { DiagramResponse } from "@/types/diagram";

const STORAGE_KEY = "udhi-generated-diagrams-v1";

type SavedDiagrams = Record<number, DiagramResponse>;

export function loadGeneratedDiagrams(): SavedDiagrams {
  const stored = localStorage.getItem(STORAGE_KEY);

  return stored ? JSON.parse(stored) : {};
}

export function saveGeneratedDiagram(
  diagram: DiagramResponse,
): void {
  const stored = loadGeneratedDiagrams();

  stored[diagram.concept.id] = diagram;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(stored),
  );
}

export function mergeDiagrams(
  baseline: DiagramResponse[],
): DiagramResponse[] {
  const generated = loadGeneratedDiagrams();

  return baseline.map(
    (diagram) =>
      generated[diagram.concept.id] ?? diagram,
  );
}

export function clearGeneratedDiagrams(): void {
  localStorage.removeItem(STORAGE_KEY);
}
"use client";

import { useEffect, useState } from "react";

import { getResults } from "@/lib/api";
import type { DiagramResponse } from "@/types/diagram";

export default function Home() {
  const [diagrams, setDiagrams] = useState<DiagramResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getResults()
      .then(setDiagrams)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading diagrams...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        Science Diagram Maker
      </h1>

      <p>Loaded {diagrams.length} diagrams.</p>

      {diagrams.map(({ concept, result }) => (
        <div key={concept.id} className="mt-4 border p-4">
          <h2>{concept.name}</h2>

          <p>Subject: {concept.subject}</p>

          <p>
            Validation: {result.passed ? "Passed" : "Failed"}
          </p>

          <p>
            Cost: $
            {result.estimated_cost_usd?.toFixed(6) ?? "Unknown"}
          </p>

          <p>Retries: {result.retries}</p>
        </div>
      ))}
    </main>
  );
}
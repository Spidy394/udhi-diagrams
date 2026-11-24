"use client";

import { useEffect, useRef, useState } from "react";

import {
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";

import { toast } from "sonner";

import Header from "@/components/Header";
import StatsOverview from "@/components/StatsOverview";
import DiagramTable from "@/components/DiagramTable";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useReviews } from "@/hooks/use-reviews";

import {
  getResults,
  generateDiagram,
} from "@/lib/api";

import type { DiagramResponse } from "@/types/diagram";

const Dashboard = () => {
  const [diagrams, setDiagrams] = useState<DiagramResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const generationLock = useRef(false);

  const {
    hydrated,
    storageError,
    getReview,
    setStatus,
    setNote,
  } = useReviews();

  async function loadDiagrams() {
    setLoading(true);
    setError(null);
    setApiStatus("checking");

    try {
      const results = await getResults();

      setDiagrams(results);
      setApiStatus("online");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load saved diagrams.",
      );

      setApiStatus("offline");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDiagrams();
  }, []);

  async function handleGenerate(conceptId: number) {
    if (generationLock.current) return;

    generationLock.current = true;
    setGeneratingId(conceptId);

    const concept = diagrams.find(
      (item) => item.concept.id === conceptId,
    )?.concept;

    const toastId = toast.loading(
      `Generating ${concept?.name ?? "diagram"}...`,
    );

    try {
      const generated = await generateDiagram(conceptId);

      setDiagrams((previous) =>
        previous.map((item) =>
          item.concept.id === conceptId
            ? generated
            : item,
        ),
      );

      setApiStatus("online");

      if (generated.result.passed) {
        toast.success("Diagram generated successfully.", {
          id: toastId,
          description:
            "All automated validation checks passed.",
        });
      } else {
        toast.warning("Diagram failed validation.", {
          id: toastId,
          description:
            "The generation pipeline completed, but some checks failed.",
        });
      }
    } catch (err) {
      toast.error("Diagram generation failed.", {
        id: toastId,
        description:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred.",
      });
    } finally {
      generationLock.current = false;
      setGeneratingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Header apiStatus={apiStatus} />

      <main className="mx-auto max-w-[1800px] space-y-8 px-6 py-8">
        {/* Page heading */}
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Diagram review
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Generate, validate and review AI-powered
              science diagrams for UK GCSE students.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={loadDiagrams}
            disabled={loading || generatingId !== null}
          >
            <RefreshCw
              className={`size-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Reload saved results
          </Button>
        </section>

        {/* Storage warning */}
        {storageError && (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            {storageError}
          </div>
        )}

        {/* Loading state */}
        {(loading || !hydrated) && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-32 rounded-xl"
                />
              ))}
            </div>

            <Skeleton className="h-[500px] rounded-xl" />

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading saved diagrams...
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-xl border bg-card p-12 text-center"
          >
            <AlertCircle className="size-10 text-destructive" />

            <div>
              <h3 className="font-semibold">
                Unable to load diagrams
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {error}
              </p>
            </div>

            <Button onClick={loadDiagrams}>
              Try again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading &&
          hydrated &&
          !error &&
          diagrams.length === 0 && (
            <div className="rounded-xl border bg-card p-12 text-center">
              <h3 className="font-semibold">
                No saved diagrams available
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Run the backend batch generation script
                to populate results.json.
              </p>
            </div>
          )}

        {/* Main dashboard */}
        {!loading &&
          hydrated &&
          !error &&
          diagrams.length > 0 && (
            <>
              <StatsOverview diagrams={diagrams} />

              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Science concepts
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    Inspect generated diagrams and record
                    your review decisions.
                  </p>
                </div>

                <DiagramTable
                  diagrams={diagrams}
                  generatingId={generatingId}
                  getReview={getReview}
                  onStatusChange={setStatus}
                  onNoteChange={setNote}
                  onGenerate={handleGenerate}
                />
              </section>
            </>
          )}

        {/* Footer */}
        <footer className="flex flex-wrap justify-between gap-2 border-t pt-5 text-xs text-muted-foreground">
          <p>
            Science Diagram Maker · Udhi Technologies
            home assignment
          </p>

          <p>
            Reviews are stored locally in your browser.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;

"use client";

import { useEffect, useRef, useState } from "react";

import {
    AlertCircle,
    FileSearch,
    Loader2,
    RefreshCw,
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

import {
    mergeDiagrams,
    saveGeneratedDiagram,
} from "@/lib/diagram-storage";

import type { DiagramResponse } from "@/types/diagram";

const Dashboard = () => {
    const [diagrams, setDiagrams] = useState<DiagramResponse[]>(
        [],
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [apiStatus, setApiStatus] = useState<
        "checking" | "online" | "offline"
    >("checking");
    const [generatingId, setGeneratingId] = useState<
        number | null
    >(null);

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

            try {
                setDiagrams(mergeDiagrams(results));
            } catch {
                setDiagrams(results);

                toast.warning("Unable to load locally saved diagrams.");
            }
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
        void Promise.resolve().then(loadDiagrams);
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

            try {
                saveGeneratedDiagram(generated);
            } catch {
                toast.warning(
                    "The diagram was generated but could not be saved locally.",
                );
            }

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
        <div className="relative min-h-dvh overflow-x-clip bg-background">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_72%)]"
            />

            <Header apiStatus={apiStatus} />

            <main
                aria-busy={loading || !hydrated}
                className="relative mx-auto max-w-[1400px] space-y-8 px-5 py-8 sm:px-6 lg:px-8 lg:py-10"
            >
                <section className="flex flex-col gap-5 border-b border-border/60 pb-7 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                        <p className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                            <span className="h-px w-5 bg-primary/50" aria-hidden="true" />
                            Quality assurance
                        </p>

                        <h1 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-foreground text-balance">
                            Diagram review
                        </h1>

                        <p className="mt-3 max-w-[58ch] text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                            Inspect AI-generated GCSE science diagrams, verify automated checks,
                            and record human review decisions in one workspace.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadDiagrams}
                        disabled={loading || generatingId !== null}
                        className="bg-card/60 shadow-[0_1px_1px_rgba(0,0,0,0.02)]"
                    >
                        <RefreshCw
                            className={`size-3.5 ${
                                loading ? "animate-spin" : ""
                            }`}
                        />
                        Reload saved results
                    </Button>
                </section>

                {storageError && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning-soft/70 px-4 py-3 text-sm text-warning"
                    >
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <p>{storageError}</p>
                    </div>
                )}

                {(loading || !hydrated) && (
                    <div className="space-y-6" aria-hidden="true">
                        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="bg-card/80 px-5 py-5">
                                    <Skeleton className="h-3 w-20 rounded-sm bg-muted/80" />
                                    <Skeleton className="mt-4 h-8 w-24 rounded-sm bg-muted/80" />
                                    <Skeleton className="mt-3 h-3 w-32 rounded-sm bg-muted/70" />
                                </div>
                            ))}
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border/70 bg-card/60">
                            <div className="border-b border-border/60 px-5 py-4">
                                <Skeleton className="h-4 w-32 rounded-sm bg-muted/80" />
                                <Skeleton className="mt-2 h-3 w-56 rounded-sm bg-muted/70" />
                            </div>
                            <div className="divide-y divide-border/60">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="grid gap-4 px-5 py-5 lg:grid-cols-[1.2fr_1.6fr_1fr_1fr_1.4fr_auto]">
                                        <Skeleton className="h-20 rounded-md bg-muted/60" />
                                        <Skeleton className="h-32 rounded-md bg-muted/60" />
                                        <Skeleton className="h-24 rounded-md bg-muted/60" />
                                        <Skeleton className="h-20 rounded-md bg-muted/60" />
                                        <Skeleton className="h-28 rounded-md bg-muted/60" />
                                        <Skeleton className="h-8 w-24 rounded-md bg-muted/60" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p role="status" className="sr-only">
                            Loading saved diagrams...
                        </p>
                    </div>
                )}

                {!loading && error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-border/70 bg-card/70 px-6 py-14 text-center shadow-[var(--shadow-soft)]"
                    >
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-danger/15 bg-danger-soft/70 text-danger">
                            <AlertCircle className="size-5" strokeWidth={1.8} />
                        </div>

                        <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-foreground">
                            Unable to load diagrams
                        </h3>

                        <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                            {error}
                        </p>

                        <Button
                            size="sm"
                            variant="outline"
                            className="mt-6 bg-background/70"
                            onClick={loadDiagrams}
                        >
                            <RefreshCw className="size-3.5" />
                            Try again
                        </Button>
                    </div>
                )}

                {!loading &&
                    hydrated &&
                    !error &&
                    diagrams.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border/80 bg-card/45 px-6 py-14 text-center">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border/70 bg-muted/50 text-muted-foreground">
                                <FileSearch className="size-5" strokeWidth={1.8} />
                            </div>

                            <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-foreground">
                                No saved diagrams available
                            </h3>

                            <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                                Run the backend batch generation script to populate{" "}
                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground/80">
                                    results.json
                                </code>
                                .
                            </p>
                        </div>
                    )}

                {!loading &&
                    hydrated &&
                    !error &&
                    diagrams.length > 0 && (
                        <>
                            <StatsOverview diagrams={diagrams} />

                            <section className="space-y-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                                            Review queue
                                        </p>
                                        <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-foreground">
                                            Science concepts
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Inspect generated diagrams, validation results, and reviewer notes.
                                        </p>
                                    </div>
                                </div>

                                {generatingId !== null && (
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-none"
                                    >
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <Loader2 className="size-4 animate-spin" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                Generating and validating diagram
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                The pipeline may retry automatically if generation or validation fails.
                                            </p>
                                        </div>
                                    </div>
                                )}

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

                <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border/60 pt-6 text-xs text-muted-foreground">
                    <p className="font-mono text-[11px] tracking-[0.01em]">
                        Science Diagram Maker · Udhi Technologies
                    </p>
                    <p>Reviews are stored locally in your browser.</p>
                </footer>
            </main>
        </div>
    );
};

export default Dashboard;

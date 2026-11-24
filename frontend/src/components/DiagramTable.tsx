"use client";

import {
  Loader2,
  RefreshCw,
  Maximize2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import DiagramPreview from "./DiagramPreview";
import ValidationStatus from "./ValidationStatus";
import ReviewControls from "./ReviewControls";

import type {
  Concept,
  DiagramResponse,
  Review,
  ReviewStatus,
} from "@/types/diagram";

interface DiagramTableProps {
  diagrams: DiagramResponse[];
  generatingId: number | null;

  getReview: (conceptId: number, svg: string) => Review;

  onStatusChange: (
    conceptId: number,
    svg: string,
    status: ReviewStatus,
  ) => void;

  onNoteChange: (
    conceptId: number,
    svg: string,
    note: string,
  ) => void;

  onGenerate: (conceptId: number) => void;
}

type DiagramResult = DiagramResponse["result"];

const ConceptSummary = ({ concept }: { concept: Concept }) => (
  <div className="space-y-2.5">
    <p className="text-[13px] font-semibold leading-snug tracking-[-0.015em] text-foreground">
      {concept.name}
    </p>

    <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.03em] text-muted-foreground">
      {concept.subject}
    </span>

    <p className="text-xs leading-relaxed text-muted-foreground">
      {concept.description}
    </p>
  </div>
);

const PreviewPanel = ({
  svg,
  name,
  safe,
  isGenerating,
  onGenerate,
  disabled,
}: {
  svg: string;
  name: string;
  safe: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  disabled: boolean;
}) => (
  <div className="space-y-2">
    <DiagramPreview svg={svg} name={name} safe={safe} />

    <div className="grid grid-cols-2 gap-1.5">
      <Dialog>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="xs"
              disabled={!safe}
              className="w-full justify-center border-border/70 bg-background/50 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            />
          }
        >
          <Maximize2 className="size-3" />
          Expand
        </DialogTrigger>

        <DialogContent className="gap-5 border-border/70 bg-card/95 p-5 shadow-[var(--shadow-panel)] sm:max-w-5xl">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base font-semibold tracking-[-0.02em]">
              {name}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Enlarged preview for detailed inspection.
            </p>
          </DialogHeader>

          <DiagramPreview svg={svg} name={name} safe={safe} />
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="xs"
        disabled={disabled}
        onClick={onGenerate}
        className="w-full justify-center border-border/70 bg-background/50 text-[11px] font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
      >
        {isGenerating ? (
          <Loader2 className="size-3 animate-spin text-primary" />
        ) : (
          <RefreshCw className="size-3" />
        )}
        {isGenerating ? "Generating..." : "Regenerate"}
      </Button>
    </div>
  </div>
);

const MetricsList = ({ result }: { result: DiagramResult }) => (
  <dl className="space-y-2.5 text-xs">
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">Estimated cost</dt>
      <dd className="font-mono text-[11px] font-medium text-foreground tabular-nums">
        {result.estimated_cost_usd !== null
          ? `$${result.estimated_cost_usd.toFixed(6)}`
          : "Unknown"}
      </dd>
    </div>

    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">Retries</dt>
      <dd className="font-mono text-[11px] font-medium text-foreground tabular-nums">
        {result.retries}
      </dd>
    </div>

    <p className="font-mono text-[10px] tracking-[0.01em] text-muted-foreground/90">
      API {result.api_retries} · Validation {result.validation_retries}
    </p>

    <div className="space-y-1.5 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
      <div className="flex items-baseline justify-between gap-3">
        <dt>Input tokens</dt>
        <dd className="font-mono tabular-nums text-foreground/80">
          {result.input_tokens ?? "—"}
        </dd>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <dt>Output tokens</dt>
        <dd className="font-mono tabular-nums text-foreground/80">
          {result.output_tokens ?? "—"}
        </dd>
      </div>
    </div>
  </dl>
);

const DiagramTable = ({
  diagrams,
  generatingId,
  getReview,
  onStatusChange,
  onNoteChange,
  onGenerate,
}: DiagramTableProps) => {
  return (
    <>
      {/* Desktop review table */}
      <div className="hidden overflow-hidden rounded-xl border border-border/70 bg-card/75 shadow-[var(--shadow-soft)] lg:block">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-muted/25">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-[18%] px-5 py-3.5 font-mono text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Concept
              </TableHead>
              <TableHead className="w-[26%] px-5 py-3.5 font-mono text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Animated diagram
              </TableHead>
              <TableHead className="w-[19%] px-5 py-3.5 font-mono text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Validation
              </TableHead>
              <TableHead className="w-[15%] px-5 py-3.5 font-mono text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Metrics
              </TableHead>
              <TableHead className="w-[22%] px-5 py-3.5 font-mono text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Reviewer feedback
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {diagrams.map(({ concept, result }) => {
              const isGenerating = generatingId === concept.id;
              const review = getReview(concept.id, result.svg);
              const safe = Boolean(
                result.checks?.safe_svg?.passed &&
                result.checks?.valid_svg?.passed,
              );

              return (
                <TableRow
                  key={concept.id}
                  className={`group align-top border-border/55 transition-colors duration-150 ${
                    isGenerating ? "bg-primary/5" : "hover:bg-muted/20"
                  }`}
                >
                  <TableCell className="w-[18%] whitespace-normal px-5 py-5">
                    <ConceptSummary concept={concept} />
                  </TableCell>

                  <TableCell className="w-[26%] whitespace-normal px-5 py-5">
                    <PreviewPanel
                      svg={result.svg}
                      name={concept.name}
                      safe={safe}
                      isGenerating={isGenerating}
                      onGenerate={() => onGenerate(concept.id)}
                      disabled={generatingId !== null}
                    />
                  </TableCell>

                  <TableCell className="w-[19%] whitespace-normal px-5 py-5">
                    <ValidationStatus checks={result.checks} />
                  </TableCell>

                  <TableCell className="w-[15%] whitespace-normal px-5 py-5">
                    <MetricsList result={result} />
                  </TableCell>

                  <TableCell className="w-[22%] whitespace-normal px-5 py-5">
                    <ReviewControls
                      review={review}
                      disabled={isGenerating}
                      onStatusChange={(status) =>
                        onStatusChange(
                          concept.id,
                          result.svg,
                          status,
                        )
                      }
                      onNoteChange={(note) =>
                        onNoteChange(
                          concept.id,
                          result.svg,
                          note,
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Compact stacked records */}
      <div className="space-y-4 lg:hidden">
        {diagrams.map(({ concept, result }) => {
          const isGenerating = generatingId === concept.id;
          const review = getReview(concept.id, result.svg);
          const safe =
            result.checks.safe_svg.passed &&
            result.checks.valid_svg.passed;

          return (
            <article
              key={concept.id}
              className="overflow-hidden rounded-xl border border-border/70 bg-card/75 shadow-[var(--shadow-soft)]"
            >
              <div className="border-b border-border/60 bg-muted/20 px-4 py-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug tracking-[-0.015em] text-foreground">
                      {concept.name}
                    </p>
                    <span className="inline-flex items-center rounded-full border border-border/70 bg-background/60 px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.03em] text-muted-foreground">
                      {concept.subject}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {concept.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-4">
                <PreviewPanel
                  svg={result.svg}
                  name={concept.name}
                  safe={safe}
                  isGenerating={isGenerating}
                  onGenerate={() => onGenerate(concept.id)}
                  disabled={generatingId !== null}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-background/45 p-3.5">
                    <p className="mb-2.5 font-mono text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                      Validation
                    </p>
                    <ValidationStatus checks={result.checks} />
                  </div>

                  <div className="rounded-lg border border-border/60 bg-background/45 p-3.5">
                    <p className="mb-2.5 font-mono text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                      Metrics
                    </p>
                    <MetricsList result={result} />
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <p className="mb-3 font-mono text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                    Review
                  </p>
                  <ReviewControls
                    review={review}
                    disabled={isGenerating}
                    onStatusChange={(status) =>
                      onStatusChange(
                        concept.id,
                        result.svg,
                        status,
                      )
                    }
                    onNoteChange={(note) =>
                      onNoteChange(
                        concept.id,
                        result.svg,
                        note,
                      )
                    }
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
};

export default DiagramTable;

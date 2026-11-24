"use client";

import { useId } from "react";

import { Check, X, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type { Review, ReviewStatus } from "@/types/diagram";

interface ReviewControlsProps {
  review: Review;
  disabled?: boolean;
  onStatusChange: (status: ReviewStatus) => void;
  onNoteChange: (note: string) => void;
}

const formatUpdatedAt = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const ReviewControls = ({
  review,
  disabled = false,
  onStatusChange,
  onNoteChange,
}: ReviewControlsProps) => {
  const noteId = useId();
  const updatedAt = review.updatedAt
    ? formatUpdatedAt(review.updatedAt)
    : null;

  const handleDecision = (target: "approved" | "rejected") => {
    // If already active, clicking again naturally toggles back to pending
    if (review.status === target) {
      onStatusChange("pending");
    } else {
      onStatusChange(target);
    }
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Decision segmented toggle */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
            Review decision
          </span>

          {review.status !== "pending" && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onStatusChange("pending")}
              className="inline-flex cursor-pointer items-center gap-1 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <RotateCcw className="size-2.5" />
              Reset
            </button>
          )}
        </div>

        <div
          role="group"
          aria-label="Review decision"
          className="grid grid-cols-2 gap-1 rounded-lg border border-border/70 bg-muted/30 p-1"
        >
          <Button
            size="sm"
            type="button"
            variant="ghost"
            aria-pressed={review.status === "approved"}
            className={`h-8 text-xs font-medium transition-all ${
              review.status === "approved"
                ? "bg-success-soft text-success shadow-xs font-semibold ring-1 ring-success/25 hover:bg-success-soft/90"
                : "text-muted-foreground hover:bg-card hover:text-foreground"
            }`}
            disabled={disabled}
            onClick={() => handleDecision("approved")}
          >
            <Check className="size-3.5" />
            {review.status === "approved" ? "Approved" : "Approve"}
          </Button>

          <Button
            size="sm"
            type="button"
            variant="ghost"
            aria-pressed={review.status === "rejected"}
            className={`h-8 text-xs font-medium transition-all ${
              review.status === "rejected"
                ? "bg-danger-soft text-danger shadow-xs font-semibold ring-1 ring-danger/25 hover:bg-danger-soft/90"
                : "text-muted-foreground hover:bg-card hover:text-foreground"
            }`}
            disabled={disabled}
            onClick={() => handleDecision("rejected")}
          >
            <X className="size-3.5" />
            {review.status === "rejected" ? "Rejected" : "Reject"}
          </Button>
        </div>
      </div>

      {/* Reviewer notes */}
      <div className="space-y-1.5">
        <label
          htmlFor={noteId}
          className="block font-mono text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase"
        >
          Reviewer notes
        </label>

        <Textarea
          id={noteId}
          aria-label="Reviewer notes"
          placeholder="Add context, issues, or approval notes"
          value={review.note}
          disabled={disabled}
          onChange={(event) => onNoteChange(event.target.value)}
          className="min-h-[68px] resize-y bg-background/60 text-xs leading-relaxed placeholder:text-muted-foreground/70"
        />
      </div>

      {updatedAt && (
        <p className="font-mono text-[10px] tracking-[0.01em] text-muted-foreground/80">
          Updated {updatedAt}
        </p>
      )}
    </div>
  );
};

export default ReviewControls;

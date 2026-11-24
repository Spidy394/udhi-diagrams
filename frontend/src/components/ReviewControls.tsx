"use client";

import { Check, X, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import type { Review, ReviewStatus } from "@/types/diagram";

interface ReviewControlsProps {
    review: Review;
    disabled?: boolean;
    onStatusChange: (status: ReviewStatus) => void;
    onNoteChange: (note: string) => void;
}

const ReviewControls = ({
    review,
    disabled = false,
    onStatusChange,
    onNoteChange,
}: ReviewControlsProps) => {
    return (
        <div className="min-w-[220px] space-y-3">
            <div className="flex items-center justify-between">
                <Badge
                    variant="outline"
                    className={
                        review.status === "approved"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : review.status === "rejected"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "text-muted-foreground"
                    }
                >
                    {review.status === "approved"
                        ? "Approved"
                        : review.status === "rejected"
                            ? "Rejected"
                            : "Pending review"}
                </Badge>

                {review.status !== "pending" && (
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        aria-label="Reset review status"
                        onClick={() => onStatusChange("pending")}
                    >
                        <RotateCcw className="size-3.5" />
                    </Button>
                )}
            </div>

            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant={
                        review.status === "approved"
                            ? "default"
                            : "outline"
                    }
                    className="flex-1"
                    disabled={disabled}
                    onClick={() => onStatusChange("approved")}
                >
                    <Check className="size-4" />
                    Approve
                </Button>

                <Button
                    size="sm"
                    variant={
                        review.status === "rejected"
                            ? "destructive"
                            : "outline"
                    }
                    className="flex-1"
                    disabled={disabled}
                    onClick={() => onStatusChange("rejected")}
                >
                    <X className="size-4" />
                    Reject
                </Button>
            </div>

            <Textarea
                placeholder="Add reviewer notes..."
                aria-label="Reviewer notes"
                value={review.note}
                disabled={disabled}
                onChange={(event) =>
                    onNoteChange(event.target.value)
                }
                className="min-h-20 resize-y text-sm"
            />

            {review.updatedAt && (
                <p className="text-xs text-muted-foreground">
                    Review updated
                </p>
            )}
        </div>
    )
}

export default ReviewControls
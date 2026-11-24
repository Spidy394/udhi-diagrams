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

import { Badge } from "@/components/ui/badge";

import DiagramPreview from "./DiagramPreview";
import ValidationStatus from "./ValidationStatus";
import ReviewControls from "./ReviewControls";

import type {
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


const DiagramTable = ({
    diagrams,
    generatingId,
    getReview,
    onStatusChange,
    onNoteChange,
    onGenerate,
}: DiagramTableProps) => {
    return (
        <div className="overflow-x-auto rounded-xl border bg-card">
            <Table className="min-w-[1200px]">
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>Concept</TableHead>
                        <TableHead>Animated diagram</TableHead>
                        <TableHead>Validation</TableHead>
                        <TableHead>Generation metrics</TableHead>
                        <TableHead>Reviewer feedback</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {diagrams.map(({ concept, result }) => {
                        const isGenerating =
                            generatingId === concept.id;

                        const review = getReview(
                            concept.id,
                            result.svg,
                        );

                        const safe =
                            result.checks.safe_svg.passed &&
                            result.checks.valid_svg.passed;

                        return (
                            <TableRow
                                key={concept.id}
                                className="align-top"
                            >
                                {/* Concept */}

                                <TableCell className="w-[180px] whitespace-normal p-4">
                                    <div className="space-y-2">
                                        <p className="font-semibold">
                                            {concept.name}
                                        </p>

                                        <Badge variant="secondary">
                                            {concept.subject}
                                        </Badge>

                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                            {concept.description}
                                        </p>
                                    </div>
                                </TableCell>

                                {/* Animated preview */}

                                <TableCell className="w-[360px] p-4">
                                    <div className="space-y-2">
                                        <DiagramPreview
                                            svg={result.svg}
                                            name={concept.name}
                                            safe={safe}
                                        />

                                        <Dialog>
                                            <DialogTrigger
                                                render={
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full"
                                                        disabled={!safe}
                                                    />
                                                }
                                            >
                                                <Maximize2 className="size-4" />
                                                Expand diagram
                                            </DialogTrigger>

                                            <DialogContent className="sm:max-w-5xl">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        {concept.name}
                                                    </DialogTitle>
                                                </DialogHeader>

                                                <DiagramPreview
                                                    svg={result.svg}
                                                    name={concept.name}
                                                    safe={safe}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </TableCell>

                                {/* Validation checks */}

                                <TableCell className="w-[190px] p-4">
                                    <ValidationStatus
                                        checks={result.checks}
                                    />
                                </TableCell>

                                {/* Generation metrics */}

                                <TableCell className="p-4">
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Estimated cost
                                            </p>

                                            <p className="font-medium tabular-nums">
                                                {result.estimated_cost_usd !== null
                                                    ? `$${result.estimated_cost_usd.toFixed(6)}`
                                                    : "Unknown"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Retries
                                            </p>

                                            <p className="font-medium">
                                                {result.retries}
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                API: {result.api_retries} ·
                                                Validation: {result.validation_retries}
                                            </p>
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            <p>
                                                Input: {result.input_tokens ?? "—"}
                                            </p>

                                            <p>
                                                Output: {result.output_tokens ?? "—"}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Review */}

                                <TableCell className="p-4">
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

                                {/* Generation action */}

                                <TableCell className="p-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={generatingId !== null}
                                        onClick={() => onGenerate(concept.id)}
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="size-4" />
                                        )}

                                        {isGenerating
                                            ? "Generating..."
                                            : "Generate"}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    )
}

export default DiagramTable
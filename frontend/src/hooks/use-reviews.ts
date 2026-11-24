"use client";

import { useEffect, useState } from "react";

import type {
  Review,
  Reviews,
  ReviewStatus,
} from "@/types/diagram";

const STORAGE_KEY = "udhi-diagram-reviews-v1";

export function getDiagramVersion(svg: string): string {
  let hash = 2166136261;

  for (let i = 0; i < svg.length; i++) {
    hash ^= svg.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}

export function useReviews() {
  const [reviews, setReviews] = useState<Reviews>({});
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        setReviews(JSON.parse(stored));
      }
    } catch {
      setStorageError("Unable to load saved reviews.");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(reviews),
      );
    } catch {
      setStorageError("Unable to persist reviews.");
    }
  }, [reviews, hydrated]);

  function getReview(
    conceptId: number,
    svg: string,
  ): Review {
    const version = getDiagramVersion(svg);
    const existing = reviews[conceptId];

    if (existing?.diagramVersion === version) {
      return existing;
    }

    return {
      status: "pending",
      note: "",
      updatedAt: "",
      diagramVersion: version,
    };
  }

  function updateReview(
    conceptId: number,
    svg: string,
    updates: Partial<
      Pick<Review, "status" | "note">
    >,
  ) {
    const version = getDiagramVersion(svg);

    setReviews((previous) => {
      const existing = previous[conceptId];

      const current: Review =
        existing?.diagramVersion === version
          ? existing
          : {
              status: "pending",
              note: "",
              updatedAt: "",
              diagramVersion: version,
            };

      return {
        ...previous,
        [conceptId]: {
          ...current,
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }

  function setStatus(
    conceptId: number,
    svg: string,
    status: ReviewStatus,
  ) {
    updateReview(conceptId, svg, { status });
  }

  function setNote(
    conceptId: number,
    svg: string,
    note: string,
  ) {
    updateReview(conceptId, svg, { note });
  }

  return {
    reviews,
    hydrated,
    storageError,
    getReview,
    setStatus,
    setNote,
  };
}
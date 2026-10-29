"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LeaderboardPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  setPage: (updater: (p: number) => number) => void;
}

export function LeaderboardPagination({
  page,
  totalPages,
  totalCount,
  setPage,
}: LeaderboardPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="p-4 border-t border-border/60 bg-secondary/20 flex items-center justify-between text-xs font-mono">
      <span className="text-muted-foreground">
        Showing page {page} of {totalPages} ({totalCount} verified records)
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="p-1.5 rounded bg-secondary border border-border hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="p-1.5 rounded bg-secondary border border-border hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

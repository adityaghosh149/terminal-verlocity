"use client";

import React from "react";
import { BookOpen, ChevronDown } from "lucide-react";

export function MethodologyCard() {
  return (
    <details className="mt-8 rounded-xl border border-border/80 bg-card/50 backdrop-blur-md font-mono text-xs overflow-hidden group">
      <summary className="flex items-center justify-between p-4 cursor-pointer select-none text-foreground hover:bg-secondary/40 transition-colors">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
          <BookOpen className="h-4 w-4" />
          Mathematical Model & Data Science Methodology
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>

      <div className="p-4 pt-2 border-t border-border/40 space-y-2.5 text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Expected Value:</strong> Computed via{" "}
          <code className="text-primary font-bold">EV = (1 - p)R - pC</code> where{" "}
          <code className="text-foreground">p</code> is the corruption risk,{" "}
          <code className="text-foreground">R</code> is clean reward, and{" "}
          <code className="text-foreground">C</code> is corruption penalty.
        </p>
        <p>
          <strong className="text-foreground">Variance & Law of Large Numbers:</strong> Individual trials exhibit variance. Over larger sample sizes, total realized score converges toward total expected value (sum of EV).
        </p>
      </div>
    </details>
  );
}

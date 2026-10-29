"use client";

import React from "react";
import { BookOpen } from "lucide-react";

export function MethodologyCard() {
  return (
    <div className="mt-12 p-6 rounded-xl border border-border/80 bg-card/50 backdrop-blur-md font-mono text-xs">
      <div className="flex items-center gap-2 text-primary font-bold text-sm mb-3">
        <BookOpen className="h-4 w-4" />
        MATHEMATICAL & DATA SCIENCE METHODOLOGY
      </div>
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Expected Value (EV):</strong> Computed using{" "}
          <code className="text-primary font-bold">EV = (1 - p)R - pC - K</code> where{" "}
          <code className="text-foreground">p</code> is the corruption probability,{" "}
          <code className="text-foreground">R</code> is the clean packet reward, and{" "}
          <code className="text-foreground">C</code> is the corruption penalty.
        </p>
        <p>
          <strong className="text-foreground">Variance vs Law of Large Numbers:</strong> Over an
          individual trial, a packet with positive expected value (e.g. +84 PTS) may still roll
          corrupted and penalize the player. As the sample size{" "}
          <code className="text-foreground">N</code> grows across multiple runs, empirical realized
          return converges toward mathematical expectation.
        </p>
        <p>
          <strong className="text-foreground">Calibration Interpretation:</strong> Small sample sizes
          (<code className="text-foreground">N &lt; 20</code>) exhibit natural sampling variance.
          Binned empirical charts reflect actual observed outcomes without altering underlying true
          game distributions.
        </p>
      </div>
    </div>
  );
}

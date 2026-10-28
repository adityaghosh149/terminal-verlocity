"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  HelpCircle,
  X,
  Target,
  Calculator,
  Award,
  Shield,
} from "lucide-react";

export function HowToPlayModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const modalContent = isOpen ? (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-primary/40 bg-card p-6 sm:p-8 shadow-2xl font-sans text-foreground">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono text-primary tracking-widest uppercase font-bold">
            GAMEPLAY PROTOCOLS // GUIDE
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-foreground">
          HOW TO PLAY & SCORING RULES
        </h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6">
          A high-stakes fusion of rapid keyboard typing and mathematical risk management.
        </p>

        <div className="space-y-6 text-sm">
          {/* 1. Core Gameplay Loop */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border/60">
            <h3 className="font-display font-bold text-foreground text-base flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              1. The Interception Mechanic
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Data packets descend continuously across 4 active lanes. To intercept a packet,{" "}
              <strong className="text-foreground">type its first letter</strong> on your keyboard to lock onto it. As you type consecutive letters, the target highlights in electric cyan. Completing the word captures the payload.
            </p>
          </div>

          {/* 2. Expected Value & Strategy */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/30">
            <h3 className="font-display font-bold text-primary text-base flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4" />
              2. The Golden Rule of Expected Value (EV)
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed mb-3">
              <strong className="text-foreground">DO NOT TYPE EVERYTHING ON SCREEN!</strong> Each packet displays an objective corruption risk ($p$), a clean reward ($R$), and a penalty ($C$):
            </p>
            <div className="p-3 rounded bg-black/60 border border-primary/20 font-mono text-xs text-center text-primary font-bold my-2">
              EV = (1 - p) × Reward - p × Corruption Penalty
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30">
                <div className="text-emerald-400 font-bold">+EV // RATIONAL CHOICE</div>
                <div className="text-muted-foreground mt-1 text-[11px]">
                  Reward: +100 | Risk: 10% | Penalty: -40
                  <br />
                  <span className="text-emerald-400 font-bold">EV = 0.9(100) - 0.1(40) = +86 PTS</span>
                  <br />
                  <strong className="text-foreground">Action: INTERCEPT IMMEDIATELY</strong>
                </div>
              </div>

              <div className="p-2.5 rounded bg-rose-950/20 border border-rose-500/30">
                <div className="text-rose-400 font-bold">-EV // MALICIOUS TRAP</div>
                <div className="text-muted-foreground mt-1 text-[11px]">
                  Reward: +50 | Risk: 70% | Penalty: -120
                  <br />
                  <span className="text-rose-400 font-bold">EV = 0.3(50) - 0.7(120) = -69 PTS</span>
                  <br />
                  <strong className="text-foreground">Action: IGNORE / LET ESCAPE</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Detailed Scoring Rules */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border/60">
            <h3 className="font-display font-bold text-foreground text-base flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-amber-400" />
              3. Scoring & Multipliers
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold font-mono shrink-0">CLEAN PACKET:</span>
                <span className="text-muted-foreground">
                  Yields advertised Reward points multiplied by current Combo multiplier:{" "}
                  <code className="text-foreground font-mono">Points = Reward × ComboMultiplier</code> (from 1.0x up to 3.0x).
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-rose-400 font-bold font-mono shrink-0">CORRUPTED PACKET:</span>
                <span className="text-muted-foreground">
                  Incurs full point deduction (<code className="text-rose-400 font-mono">-Penalty</code>), breaks your active combo to 0x, and damages 1 Firewall Shield.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold font-mono shrink-0">MISSED PACKET:</span>
                <span className="text-muted-foreground">
                  If a packet hits the bottom firewall threshold without interception, it costs 1 Shield and a minor escape penalty (-30% of reward).
                </span>
              </div>
            </div>
          </div>

          {/* 4. Firewall Shields & Survival */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border/60">
            <h3 className="font-display font-bold text-foreground text-base flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              4. Firewall Integrity (3 Shields)
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              You start every run with <strong className="text-foreground">3 Firewall Shields</strong>. A shield is lost if a packet escapes past the bottom firewall threshold or when you decrypt a corrupted payload. In <strong className="text-foreground">Endless Mode</strong>, you survive until all 3 shields drop. In <strong className="text-foreground">Classic Mode</strong>, you have 90 seconds to maximize your validated score.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="bg-primary text-primary-foreground font-display font-bold px-6 py-2.5 rounded-lg text-sm hover:opacity-90 transition-all glow-primary"
          >
            GOT IT // START PLAYING
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs font-mono text-primary hover:text-foreground bg-primary/10 hover:bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-lg transition-all"
      >
        <HelpCircle className="h-4 w-4" />
        <span>HOW TO PLAY & SCORING</span>
      </button>

      {mounted && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}

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
            GAME RULES & FIELD MANUAL
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-foreground">
          HOW TO PLAY & WIN
        </h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6">
          Type fast, evaluate risk, and protect your 3 firewall shields.
        </p>

        <div className="space-y-5 text-sm">
          {/* 1. Core Rule: Intercept Before Timeout */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
            <h3 className="font-display font-bold text-foreground text-base flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              1. Type Words Before They Disappear
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Words descend across 4 lanes. Type the first letter on your keyboard to lock target, then type the rest of the word to capture it.
            </p>
            <div className="mt-2.5 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0" />
              <span>CRITICAL: If a packet reaches the bottom without being typed, it disappears and you LOSE 1 SHIELD!</span>
            </div>
          </div>

          {/* 2. Color-Coded Risk Tiers */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
            <h3 className="font-display font-bold text-foreground text-base flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-primary" />
              2. Three Simple Color Tiers (Risk vs. Reward)
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed mb-3">
              Every packet has a clear color showing its corruption probability. Clean payloads give points; corrupted payloads cost points and a shield!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40">
                <div className="text-emerald-400 font-black text-sm">🟢 SAFE</div>
                <div className="text-muted-foreground mt-1 text-[11px] space-y-1">
                  <div>• Risk: <strong>10% – 20%</strong></div>
                  <div>• Reward: <strong>+50 to +70 PTS</strong></div>
                  <div className="text-emerald-400 font-bold pt-1">Safe steady points</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/40">
                <div className="text-amber-400 font-black text-sm">🟡 CAUTION</div>
                <div className="text-muted-foreground mt-1 text-[11px] space-y-1">
                  <div>• Risk: <strong>25% – 40%</strong></div>
                  <div>• Reward: <strong>+100 to +140 PTS</strong></div>
                  <div className="text-amber-400 font-bold pt-1">Balanced reward</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/40">
                <div className="text-rose-400 font-black text-sm">🔴 DANGER</div>
                <div className="text-muted-foreground mt-1 text-[11px] space-y-1">
                  <div>• Risk: <strong>50% – 65%</strong></div>
                  <div>• Reward: <strong>+180 to +250 PTS</strong></div>
                  <div className="text-rose-400 font-bold pt-1">High-stakes jackpot</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Firewall Shields & Game Over */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
            <h3 className="font-display font-bold text-foreground text-base flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              3. Firewall Integrity (3 Shields / Lives)
            </h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span><strong>-1 Shield:</strong> A packet hits the bottom line and disappears before you finish typing it.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span><strong>-1 Shield:</strong> A typed packet corrupts (based on its risk %).</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span><strong>Game Over:</strong> When all 3 Shields are lost, the run ends immediately!</span>
              </div>
            </div>
          </div>

          {/* 4. Integer Multipliers */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
            <h3 className="font-display font-bold text-amber-400 text-base flex items-center gap-2 mb-2">
              <Award className="h-4 w-4" />
              4. Streak Combo Multipliers
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed mb-2">
              Type clean packets consecutively to trigger integer score multipliers:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
              <div className="p-2 rounded bg-black/40 border border-border">
                <div className="text-amber-400 font-bold text-sm">2x COMBO</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">3 in a row</div>
              </div>
              <div className="p-2 rounded bg-black/40 border border-border">
                <div className="text-amber-400 font-bold text-sm">3x COMBO</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">6 in a row</div>
              </div>
              <div className="p-2 rounded bg-black/40 border border-primary/50 glow-primary">
                <div className="text-primary font-black text-sm">4x MAX</div>
                <div className="text-[10px] text-primary mt-0.5">10+ in a row</div>
              </div>
            </div>
          </div>

          {/* 5. Data Science Note */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs">
            <div className="font-mono font-bold text-primary mb-1">
              DATA SCIENCE METRIC // EXPECTED VALUE (EV)
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              <div className="my-1 text-primary font-bold text-xs">
                EV = (1 - p) × Reward - (p × Penalty)
              </div>
              Every packet displays its mathematical EV. Over repeated arcade runs, prioritizing packets with higher EV generates provably higher statistical scores.
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="bg-primary text-primary-foreground font-display font-bold px-6 py-2.5 rounded-lg text-sm hover:opacity-90 transition-all glow-primary"
          >
            UNDERSTOOD // PLAY NOW
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

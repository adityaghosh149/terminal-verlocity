"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  HelpCircle,
  X,
  Target,
  Award,
  Shield,
  Zap,
  Flame,
  Maximize,
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
          Simple rules: type words before they hit bottom, build multiplier streaks, type fast for bonuses, and keep your 5 shields intact!
        </p>

        <div className="space-y-4 text-sm">
          {/* 1. Word Lengths by Difficulty */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
            <h3 className="font-display font-bold text-foreground text-base flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              1. Word Lengths & Typing Lock
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed mb-3">
              Words descend in 4 vertical lanes. Type the first letter of any word on your keyboard to lock onto it, then type the rest to catch it before it reaches the bottom firewall!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/40">
                <span className="text-emerald-400 font-bold block">🟢 EASY</span>
                <span className="text-muted-foreground text-[11px]">Exact 4-letter words (DATA, RISK, CODE)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/40">
                <span className="text-amber-400 font-bold block">🟡 MEDIUM</span>
                <span className="text-muted-foreground text-[11px]">Exact 5-letter words (CYBER, LOGIC, SHIFT)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/40">
                <span className="text-rose-400 font-bold block">🔴 HARD</span>
                <span className="text-muted-foreground text-[11px]">Exact 6-letter words (MATRIX, CIPHER, QUANTUM)</span>
              </div>
            </div>
          </div>

          {/* 2. Streak Multipliers */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
            <h3 className="font-display font-bold text-amber-400 text-base flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4" />
              2. Clean Streak Multipliers
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed mb-2.5">
              Type clean words consecutively without errors to unlock massive point multipliers:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
              <div className="p-2.5 rounded bg-black/40 border border-border">
                <div className="text-amber-400 font-bold text-sm">2x MULTIPLIER</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">3 in a row</div>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-border">
                <div className="text-amber-400 font-bold text-sm">3x MULTIPLIER</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">6 in a row</div>
              </div>
              <div className="p-2.5 rounded bg-black/40 border border-primary/50 glow-primary">
                <div className="text-primary font-black text-sm">4x MAX</div>
                <div className="text-[10px] text-primary mt-0.5">10+ in a row</div>
              </div>
            </div>
          </div>

          {/* 3. Typing Speed Bonus */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
            <h3 className="font-display font-bold text-emerald-400 text-base flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4" />
              3. Typing Speed Bonus (+20% to +100%)
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed mb-2.5">
              The faster your fingers type each word, the more bonus points you earn! Speed bonuses are applied directly to your pure typing score (e.g. a 50% speed bonus on a 100 pt word = +50 pts):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono text-xs">
              <div className="p-2 rounded bg-secondary/50 border border-border">
                <div className="font-bold text-foreground text-xs">30+ WPM</div>
                <div className="text-primary text-[11px] font-bold">+20% Bonus</div>
              </div>
              <div className="p-2 rounded bg-secondary/50 border border-border">
                <div className="font-bold text-foreground text-xs">50+ WPM</div>
                <div className="text-primary text-[11px] font-bold">+35% Bonus</div>
              </div>
              <div className="p-2 rounded bg-secondary/50 border border-border">
                <div className="font-bold text-foreground text-xs">70+ WPM</div>
                <div className="text-primary text-[11px] font-bold">+50% Bonus</div>
              </div>
              <div className="p-2 rounded bg-secondary/50 border border-border">
                <div className="font-bold text-foreground text-xs">90+ WPM</div>
                <div className="text-primary text-[11px] font-bold">+75% Bonus</div>
              </div>
              <div className="p-2 rounded bg-primary/20 border border-primary/50 glow-primary">
                <div className="font-bold text-primary text-xs">110+ WPM</div>
                <div className="text-emerald-400 text-[11px] font-black">+100% DOUBLE!</div>
              </div>
            </div>
          </div>

          {/* 4. Fair 5-Shield Defense */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
            <h3 className="font-display font-bold text-foreground text-base flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              4. Fair 5-Shield Defense
            </h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span><strong>5 Shields:</strong> You start every run with 5 shields (lives).</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span><strong>No Shield Loss on Safe/Caution:</strong> 🟢 Safe (&lt;25%) and 🟡 Caution (25%–49%) words <strong className="text-emerald-400">never cost a shield</strong> even if corrupted!</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span><strong>Shield Risk:</strong> Only 🔴 Danger words (≥50%) risk a shield if corrupted, or if any word reaches the bottom defense line unintercepted.</span>
              </div>
            </div>
          </div>

          {/* 5. Special Controls */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
            <h3 className="font-display font-bold text-primary text-base flex items-center gap-2 mb-2">
              <Maximize className="h-4 w-4" />
              5. Tactical EMP Blast & Full Screen Mode
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded bg-primary/10 border border-primary/30">
                <div className="text-primary font-bold">[TAB] EMP BLAST</div>
                <p className="text-muted-foreground text-[11px] mt-1">
                  Instantly clears the lowest word before it breaches your firewall. Defuses with 0 shield loss & +50% points. Recharge +1 charge at every 10x streak!
                </p>
              </div>
              <div className="p-3 rounded bg-secondary/60 border border-border">
                <div className="text-emerald-400 font-bold">[F] FULL SCREEN</div>
                <p className="text-muted-foreground text-[11px] mt-1">
                  Press <kbd className="px-1 py-0.5 rounded bg-black/60 border border-border text-foreground">F</kbd> anytime to toggle distraction-free full screen mode with responsive edge-to-edge word descent.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="bg-primary text-primary-foreground font-display font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all glow-primary shadow-lg"
          >
            GOT IT // LET&apos;S PLAY
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

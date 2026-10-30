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
  BookOpen,
  Calculator,
  Trophy,
  AlertTriangle,
  Sparkles,
  Terminal,
} from "lucide-react";

type ModalTab = "rules" | "scoring" | "strategy";

export function HowToPlayModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>("rules");
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-primary/40 bg-card shadow-2xl font-sans text-foreground flex flex-col">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-border/80 bg-secondary/30 relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-primary tracking-widest uppercase font-bold">
              TERMINAL VELOCITY // OFFICIAL FIELD MANUAL
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-foreground">
            GAME RULES, SCORING & PRO STRATEGY
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Master the mechanics: type words cleanly, protect your shields, avoid accuracy penalties, and maximize score yield.
          </p>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab("rules")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all ${
                activeTab === "rules"
                  ? "bg-primary text-primary-foreground glow-primary shadow"
                  : "bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              1. CORE RULES & SHIELDS
            </button>
            <button
              onClick={() => setActiveTab("scoring")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all ${
                activeTab === "scoring"
                  ? "bg-primary text-primary-foreground glow-primary shadow"
                  : "bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Calculator className="h-3.5 w-3.5" />
              2. SCORING & ACCURACY PENALTY
            </button>
            <button
              onClick={() => setActiveTab("strategy")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all ${
                activeTab === "strategy"
                  ? "bg-amber-500 text-black font-black shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                  : "bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              3. HOW TO SCORE BETTER
            </button>
          </div>
        </div>

        {/* Scrollable Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-sm">
          {/* TAB 1: CORE RULES & SHIELDS */}
          {activeTab === "rules" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Word Lengths & Typing Lock */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <h3 className="font-display font-bold text-foreground text-base flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  1. Word Lengths & Target Locking
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                  Words descend across 4 lanes toward the firewall defense line. Press the first letter of any active word on your keyboard to lock your typing focus, then type the rest of the word.
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

              {/* Fair 5-Shield Defense */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <h3 className="font-display font-bold text-foreground text-base flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  2. Fair 5-Shield Defense & Immunity
                </h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                    <span><strong>5 Starting Shields:</strong> You start every run with 5 shields (lives).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                    <span><strong>Safe & Caution Immunity:</strong> 🟢 Safe (&lt;25%) and 🟡 Caution (25%–49%) words <strong className="text-emerald-400">never deplete a shield</strong> even if corrupted!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                    <span><strong>Shield Loss Conditions:</strong> You lose 1 shield only if a 🔴 Danger word (≥50%) is corrupted, or if any word hits the bottom firewall defense line.</span>
                  </div>
                </div>
              </div>

              {/* Tactical Special Packets */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <h3 className="font-display font-bold text-primary text-base flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4" />
                  3. Tactical Power-Up Packets
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-400/50">
                    <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                      <span>🛡️ NANITE SHIELD</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] mt-1.5 leading-relaxed">
                      Spawns when shields drop to ≤2. Fast glowing cyan packet. Typing it cleanly restores <strong>+1 Shield</strong> (up to 5)!
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-400/50">
                    <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <span>⏳ MATRIX SLOW-MO</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] mt-1.5 leading-relaxed">
                      Reaching streaks of 15, 30, and 45 triggers <strong>5 seconds of 50% slow-mo</strong> ($0.5\times$ speed) to clear packed lanes.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-400/50">
                    <div className="text-amber-300 font-bold flex items-center gap-1.5">
                      <span>🌟 HIGH ROLLER</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] mt-1.5 leading-relaxed">
                      Ultra-rare golden packet granting <strong>3x Advertised Reward</strong> with a 50/50 coin-flip risk ($p = 0.50$).
                    </p>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <h3 className="font-display font-bold text-foreground text-base flex items-center gap-2 mb-2">
                  <Maximize className="h-4 w-4 text-primary" />
                  4. Tactical Hotkeys
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
                  <div className="p-2 rounded bg-black/40 border border-border">
                    <div className="font-bold text-primary">[TAB]</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">EMP Blast Defusal</div>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-border">
                    <div className="font-bold text-primary">[F]</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Fullscreen Toggle</div>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-border">
                    <div className="font-bold text-primary">[ESC]</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Pause Run</div>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-border">
                    <div className="font-bold text-primary">[Ctrl+Enter]</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Quick Restart</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCORING & ACCURACY PENALTY */}
          {activeTab === "scoring" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Score Equation */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <h3 className="font-display font-bold text-primary text-base flex items-center gap-2 mb-1">
                  <Calculator className="h-4 w-4" />
                  The Total Score Formula
                </h3>
                <p className="font-mono text-xs text-foreground font-bold mt-1">
                  Total Score = (Base Typing Score - Accuracy Penalty) + Multiplier Score + Speed Bonus Score
                </p>
              </div>

              {/* NEW ACCURACY PENALTY RULE */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40">
                <h3 className="font-display font-bold text-rose-400 text-base flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Accuracy Penalty: (2 × (100 - Accuracy))%
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                  To prevent reckless button-mashing, every mistyped character reduces your Base Typing Score by <strong>twice your error rate</strong>:
                </p>
                <div className="p-3 rounded-lg bg-black/60 border border-border font-mono text-xs mb-3">
                  <div className="text-rose-300 font-bold">
                    Penalty % = 2 × (100 - Accuracy %)
                  </div>
                  <div className="text-muted-foreground text-[11px] mt-1">
                    Deducted strictly from your Base Typing Score before multipliers.
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono text-xs">
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/50">
                    <div className="text-emerald-400 font-bold">100% ACC</div>
                    <div className="text-[10px] text-emerald-300 mt-0.5">0% Penalty</div>
                  </div>
                  <div className="p-2 rounded bg-secondary/50 border border-border">
                    <div className="text-foreground font-bold">98% ACC</div>
                    <div className="text-[10px] text-amber-400 mt-0.5">-4% Penalty</div>
                  </div>
                  <div className="p-2 rounded bg-secondary/50 border border-border">
                    <div className="text-foreground font-bold">95% ACC</div>
                    <div className="text-[10px] text-amber-400 mt-0.5">-10% Penalty</div>
                  </div>
                  <div className="p-2 rounded bg-secondary/50 border border-border">
                    <div className="text-foreground font-bold">90% ACC</div>
                    <div className="text-[10px] text-rose-400 mt-0.5">-20% Penalty</div>
                  </div>
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-500/50">
                    <div className="text-rose-400 font-bold">80% ACC</div>
                    <div className="text-[10px] text-rose-400 mt-0.5">-40% Penalty</div>
                  </div>
                </div>
              </div>

              {/* Clean Streak Multipliers */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <h3 className="font-display font-bold text-amber-400 text-base flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4" />
                  Clean Streak Multipliers (up to 4x)
                </h3>
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

              {/* Speed Bonus Percentages */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <h3 className="font-display font-bold text-emerald-400 text-base flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4" />
                  Typing Speed Bonus (+20% to +100%)
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed mb-2.5">
                  Applied directly to your Net Typing Score based on packet typing speed (WPM):
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
            </div>
          )}

          {/* TAB 3: PRO STRATEGY: HOW TO SCORE BETTER */}
          {activeTab === "strategy" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40">
                <div className="flex items-center gap-2 text-amber-400 font-display font-black text-base mb-1">
                  <Trophy className="h-5 w-5" />
                  PRO GUIDE: TOP 6 TACTICS TO DOMINATE THE LEADERBOARD
                </div>
                <p className="text-muted-foreground text-xs">
                  Tested and verified by top leaderboard runners. Follow these rules to maximize your score:
                </p>
              </div>

              {/* Tactic 1 */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-foreground text-sm">
                      Protect Your Accuracy Above All Else
                    </h4>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      A single typo produces a catastrophic double penalty: it resets your <strong>4x clean streak multiplier</strong> back to 1x AND deducts <strong>2% per error rate</strong> from your entire Base Typing score. Never rush at the cost of mistakes; 98%+ accuracy always yields higher scores than reckless 110 WPM spamming.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tactic 2 */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-foreground text-sm">
                      Build Your Multipliers on 🟢 Safe & 🟡 Caution Words
                    </h4>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      Safe packets have less than 25% corruption risk and <strong>CANNOT deplete your shields</strong> even if they corrupt. Use them to reliably ramp up your streak to 10 in a row to reach the permanent <strong>4x MAX multiplier</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tactic 3 */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-foreground text-sm">
                      Exploit Decryption Overclock (Matrix Slow-Mo ⏳)
                    </h4>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      At streaks 15, 30, and 45, all falling packets slow down by 50% for 5 full seconds. Use this breathing room to eliminate lowest-lane packets, prevent firewall breaches, and set up your next streak wave!
                    </p>
                  </div>
                </div>
              </div>

              {/* Tactic 4 */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-foreground text-sm">
                      Clutch Shield Recovery with Nanite Packets (🛡️)
                    </h4>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      If your shields drop to 2 or 1, keep your eyes open for the glowing cyan Nanite Shield packet. Typing it cleanly restores +1 Shield instantly, keeping your run alive when you are near elimination.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tactic 5 */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs shrink-0">
                    5
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-foreground text-sm">
                      Only Gamble on Golden High Rollers (🌟) with 3+ Shields
                    </h4>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      Golden packets grant a colossal <strong>3x points reward</strong>, but carry a true 50% corruption chance. If you have 4 or 5 shields, the mathematical Expected Value is positive when paired with streak multipliers. If you only have 1 or 2 shields left, ignore it!
                    </p>
                  </div>
                </div>
              </div>

              {/* Tactic 6 */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono font-bold text-xs shrink-0">
                    6
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-foreground text-sm">
                      Save EMP Blast ([TAB]) for Redline Defense
                    </h4>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      EMP immediately vaporizes the lowest impending breach with 0 shield loss and a +50% point reward. Don&apos;t waste it on high words; save it for when a dangerous word touches the firewall line!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 bg-secondary/20 flex items-center justify-between">
          <div className="text-[11px] font-mono text-muted-foreground">
            Current Tab: <span className="text-foreground uppercase font-bold">{activeTab}</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-primary text-primary-foreground font-display font-bold px-6 py-2 rounded-xl text-xs hover:opacity-90 transition-all glow-primary shadow-lg"
          >
            CLOSE & RETURN TO GAME
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
        title="Open Game Rules, Scoring and Strategy Guide"
      >
        <HelpCircle className="h-4 w-4" />
        <span>RULES & STRATEGY GUIDE</span>
      </button>

      {mounted && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}

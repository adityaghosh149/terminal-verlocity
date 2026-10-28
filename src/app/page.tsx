import Link from "next/link";
import {
  Terminal,
  Zap,
  ShieldAlert,
  BarChart3,
  Trophy,
  Cpu,
  Lock,
  ArrowRight,
  TrendingUp,
  Target,
  Flame,
  Award,
  Calculator,
  Shield,
  HelpCircle,
} from "lucide-react";
import { HowToPlayModal } from "@/components/game/HowToPlayModal";

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background radial glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="container max-w-6xl px-4 pt-14 pb-16 sm:pt-20 sm:pb-24 text-center relative z-10">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-primary/30 text-xs font-mono text-primary mb-6 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-primary" />
          SYSTEM OPERATIONAL // DATA STREAM LIVE
        </div>

        {/* Hero Title with Chakra Petch font */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground font-display">
          TERMINAL <span className="text-primary glow-text">VELOCITY</span>
        </h1>
        <p className="mt-3 text-lg sm:text-xl font-medium tracking-widest text-muted-foreground uppercase font-mono">
          Type fast. Think faster.
        </p>

        {/* Mission Statement */}
        <p className="mt-6 text-sm sm:text-base max-w-2xl mx-auto text-muted-foreground leading-relaxed">
          Intercept encrypted data packets descending through the terminal grid across 4 active lanes.
          Typing speed is your engine, but <span className="text-foreground font-semibold">Expected Value (EV) and probability</span> dictate your survival. Clean packets multiply your score; corrupted packets penalize your firewall.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/game"
            className="flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold px-8 py-3.5 rounded-lg text-sm hover:opacity-90 transition-all glow-primary tracking-wider"
          >
            <Terminal className="h-5 w-5" />
            LAUNCH INTERCEPTOR
            <ArrowRight className="h-4 w-4" />
          </Link>
          <HowToPlayModal />
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-display font-medium px-6 py-3.5 rounded-lg text-sm border border-border transition-all"
          >
            <Trophy className="h-4 w-4 text-amber-400" />
            GLOBAL STANDINGS
          </Link>
        </div>

        {/* Live Mathematical Formula Telemetry Widget */}
        <div className="mt-14 mx-auto max-w-3xl rounded-xl border border-primary/30 bg-card/85 backdrop-blur-md p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 pb-4 mb-5">
            <span className="text-xs font-mono font-bold text-primary flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              EXPECTED VALUE MODEL // PROBABILITY ENGINE
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              MODEL: EV = (1 - p)R - pC - K
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-3.5 rounded-lg bg-secondary/50 border border-border/60">
              <div className="text-[11px] text-muted-foreground uppercase">REWARD (R)</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">+120 PTS</div>
              <div className="text-[11px] text-muted-foreground mt-1">Clean payload yield</div>
            </div>

            <div className="p-3.5 rounded-lg bg-secondary/50 border border-border/60">
              <div className="text-[11px] text-muted-foreground uppercase">CORRUPTION RISK (p)</div>
              <div className="text-xl font-bold text-rose-400 mt-1">20% CHANCE</div>
              <div className="text-[11px] text-muted-foreground mt-1">Penalty: -60 PTS</div>
            </div>

            <div className="p-3.5 rounded-lg bg-primary/15 border border-primary/40">
              <div className="text-[11px] text-primary font-bold uppercase">EXPECTED VALUE</div>
              <div className="text-xl font-black text-primary glow-text mt-1">+84.0 PTS</div>
              <div className="text-[11px] text-emerald-400 mt-1">EV &gt; 0 // RATIONAL CHOICE</div>
            </div>
          </div>
        </div>
      </section>

      {/* How the Game Works & Scoring Section */}
      <section className="container max-w-6xl px-4 py-16 border-t border-border/60">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary mb-3">
            <Target className="h-3.5 w-3.5" />
            OPERATIONAL PROTOCOLS
          </div>
          <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
            HOW THE GAME & SCORING WORK
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-2 max-w-xl mx-auto">
            A comprehensive breakdown of packet telemetry, typing mechanics, multipliers, and rational decision-making
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-xl bg-card/60 border border-border/80 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
              <Terminal className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">1. Type to Intercept</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Packets descend across 4 vertical lanes. Type the first letter of any packet to acquire target lock. Continue typing its exact characters before it reaches the bottom firewall threshold.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl bg-card/60 border border-border/80 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">2. Clean Interceptions</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Decrypted clean packets award their advertised points multiplied by your active Combo Multiplier (from 1.0x up to 3.0x for consecutive captures).
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl bg-card/60 border border-border/80 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">3. Corrupted Traps</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              If an intercepted packet rolls corrupted ($p$), you suffer a severe point deduction, lose 1 of your 3 firewall shields, and your combo multiplier resets to 0x!
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-xl bg-card/60 border border-border/80 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Calculator className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">4. Rational Filtering</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Never type high-risk, low-reward packets! When Expected Value is negative ($EV &lt; 0$), intentionally let the packet escape or focus your keystrokes on high-yield positive EV payloads.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container max-w-6xl px-4 py-16 border-t border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-card/40 border border-border/60 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold font-display text-foreground">Arcade Typing Modes</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Classic 90-second sprint, Endless survival, and Daily Deterministic Challenge with identical seeds across Easy, Medium, and Hard tiers.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card/40 border border-border/60 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold font-display text-foreground">Data Science Analytics</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Post-game telemetry charts compare your realized score against theoretical Expected Value, calibration curves, and typing velocity curves.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card/40 border border-border/60 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold font-display text-foreground">Custom Authentication</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Zero third-party auth. Argon2id password hashing, rotating JWT refresh tokens with family reuse detection, and single-use OTP verification.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

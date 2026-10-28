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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="container max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-32 text-center relative z-10">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border text-xs font-mono text-primary mb-8 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-primary" />
          SYSTEM OPERATIONAL // DATA STREAM LIVE
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground font-mono">
          TERMINAL <span className="text-primary glow-text">VELOCITY</span>
        </h1>
        <p className="mt-4 text-xl sm:text-2xl font-light tracking-wide text-muted-foreground font-mono">
          Type fast. Think faster.
        </p>

        {/* Mission Statement */}
        <p className="mt-6 text-base sm:text-lg max-w-2xl mx-auto text-muted-foreground leading-relaxed">
          Intercept encrypted data packets descending through the terminal grid.
          Typing speed is your engine, but <span className="text-foreground font-semibold">probability and expected value</span> dictate your survival. Clean packets yield rewards, corrupted packets incur penalties.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/game"
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-3.5 rounded-lg text-base hover:opacity-90 transition-all glow-primary font-mono tracking-wider"
          >
            <Terminal className="h-5 w-5" />
            LAUNCH INTERCEPTOR
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-medium px-6 py-3.5 rounded-lg text-base border border-border transition-all font-mono"
          >
            <Trophy className="h-4 w-4 text-amber-400" />
            GLOBAL LEADERBOARD
          </Link>
        </div>

        {/* Mathematical Preview Box */}
        <div className="mt-16 mx-auto max-w-3xl rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
            <span className="text-xs font-mono font-bold text-primary flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              PROBABILITY ENGINE TELEMETRY
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              MODEL: EV = (1 - p)R - pC - K
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-sm">
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
              <div className="text-xs text-muted-foreground">REWARD (R)</div>
              <div className="text-xl font-bold text-emerald-400">+120 PTS</div>
              <div className="text-[11px] text-muted-foreground mt-1">Clean payload yield</div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
              <div className="text-xs text-muted-foreground">CORRUPTION (p)</div>
              <div className="text-xl font-bold text-rose-400">20% CHANCE</div>
              <div className="text-[11px] text-muted-foreground mt-1">Penalty: -60 PTS</div>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="text-xs text-primary font-bold">EXPECTED VALUE</div>
              <div className="text-xl font-black text-primary">+84.0 PTS</div>
              <div className="text-[11px] text-muted-foreground mt-1">EV &gt; 0 // RATIONAL CHOICE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container max-w-6xl px-4 py-16 border-t border-border/40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-card/40 border border-border/60 flex flex-col">
            <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold font-mono text-foreground">Arcade Typing Action</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Descend into 3 high-intensity difficulty modes (Easy, Medium, Hard). Intercept falling packets with precise keystrokes before they escape beyond the bottom firewall.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card/40 border border-border/60 flex flex-col">
            <div className="h-12 w-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold font-mono text-foreground">Data Science Analytics</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Post-game telemetry charts compare your realized score against theoretical Expected Value. Evaluate your empirical corruption calibration, risk-reward spread, and WPM curves.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card/40 border border-border/60 flex flex-col">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold font-mono text-foreground">Custom Authentication</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Zero managed auth providers. Engineered from scratch with Argon2id password hashing, rotating JWT refresh tokens, email OTP verification challenges, and score integrity validation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

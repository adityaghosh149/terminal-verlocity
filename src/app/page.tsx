import Link from "next/link";
import {
  Terminal,
  Zap,
  ShieldAlert,
  BarChart3,
  Trophy,
  ArrowRight,
  Target,
  Flame,
  Shield,
  Maximize,
  TrendingUp,
} from "lucide-react";
import { HowToPlayModal } from "@/components/game/HowToPlayModal";

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background radial glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="container max-w-6xl px-4 pt-14 pb-14 sm:pt-20 sm:pb-20 text-center relative z-10">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-primary/30 text-xs font-mono text-primary mb-6 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-primary" />
          FAST-PACED ARCADE TYPING // PROBABILITY STRATEGY
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground font-display">
          TERMINAL <span className="text-primary glow-text">VELOCITY</span>
        </h1>
        <p className="mt-3 text-base sm:text-lg font-medium tracking-wider text-muted-foreground uppercase font-mono">
          Type Fast • Pick Smart • Defend Your Shields
        </p>

        {/* Mission Statement: simple & easy to read */}
        <p className="mt-5 text-sm sm:text-base max-w-2xl mx-auto text-muted-foreground leading-relaxed">
          Falling words are descending across 4 lanes. Type them on your keyboard before they hit the bottom defense line.
          Chain clean words for up to <span className="text-amber-400 font-bold">4x multipliers</span>, type fast for up to <span className="text-primary font-bold">+100% speed bonuses</span>, and protect your <span className="text-emerald-400 font-bold">5 shields</span>!
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/game"
            className="flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold px-8 py-3.5 rounded-xl text-sm hover:opacity-90 transition-all glow-primary tracking-wider shadow-lg"
          >
            <Terminal className="h-5 w-5" />
            PLAY GAME NOW
            <ArrowRight className="h-4 w-4" />
          </Link>
          <HowToPlayModal />
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-display font-medium px-6 py-3.5 rounded-xl text-sm border border-border transition-all"
          >
            <Trophy className="h-4 w-4 text-amber-400" />
            LEADERBOARD
          </Link>
        </div>

        {/* Word Length & Risk Tiers Quick Banner */}
        <div className="mt-12 mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-left font-mono text-xs">
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
              <span>🟢 EASY MODE</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20">4 LETTERS</span>
            </div>
            <p className="text-muted-foreground text-[11px] mt-1">
              Short 4-letter words (DATA, RISK, CODE). Low corruption risk, relaxed speed. Perfect for warming up.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
              <span>🟡 MEDIUM MODE</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20">5 LETTERS</span>
            </div>
            <p className="text-muted-foreground text-[11px] mt-1">
              Standard 5-letter words (CYBER, LOGIC, PROXY). Balanced speeds, great combo potential and rewards.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-rose-400 font-bold mb-1">
              <span>🔴 HARD MODE</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20">6 LETTERS</span>
            </div>
            <p className="text-muted-foreground text-[11px] mt-1">
              Intense 6-letter words (MATRIX, CIPHER, VECTOR). High velocity, massive points, true test of typing mastery.
            </p>
          </div>
        </div>
      </section>

      {/* Simple & Clear Gameplay Rules Section */}
      <section className="container max-w-6xl px-4 py-14 border-t border-border/60">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary mb-2">
            <Target className="h-3.5 w-3.5" />
            EASY TO LEARN • THRILLING TO MASTER
          </div>
          <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
            GAME RULES IN 4 SIMPLE STEPS
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-1 max-w-lg mx-auto">
            Everything you need to know to play, score high, and dominate the leaderboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Rule 1 */}
          <div className="p-5 rounded-xl bg-card border border-border/80 flex flex-col shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <Terminal className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">1. Type to Catch Words</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Words descend in 4 vertical lanes. Type the first letter of any word to lock onto it, then type the rest before it reaches the bottom defense line!
            </p>
          </div>

          {/* Rule 2 */}
          <div className="p-5 rounded-xl bg-card border border-border/80 flex flex-col shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">2. Streak Multipliers</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Catch clean words in a row to boost your score:
              <br />
              • <strong className="text-amber-400">2x Multiplier</strong> at 3 streak
              <br />
              • <strong className="text-amber-400">3x Multiplier</strong> at 6 streak
              <br />
              • <strong className="text-primary">4x Max Multiplier</strong> at 10 streak!
            </p>
          </div>

          {/* Rule 3 */}
          <div className="p-5 rounded-xl bg-card border border-border/80 flex flex-col shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">3. Typing Speed Bonus</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              The faster you type each word, the more bonus you earn! Speed bonus percentages are calculated directly on your pure typing score (e.g. a 50% speed bonus on a 100 pt word = +50 pts), up to <strong className="text-emerald-400">+100% bonus (Double Points)</strong> at 110+ WPM!
            </p>
          </div>

          {/* Rule 4 */}
          <div className="p-5 rounded-xl bg-card border border-border/80 flex flex-col shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">4. Fair 5-Shield Defense</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              You start with <strong>5 Shields</strong>. 🟢 Safe and 🟡 Caution words <strong className="text-emerald-400">NEVER cost a shield</strong>! Only risky 🔴 Danger words or letting a word hit the bottom line costs 1 shield.
            </p>
          </div>
        </div>
      </section>

      {/* Special Features & Controls Section */}
      <section className="container max-w-6xl px-4 py-14 border-t border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Feature 1 */}
          <div className="p-6 rounded-xl bg-card/60 border border-border/60 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold font-display text-foreground">Tactical EMP Blast [TAB]</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Start with 1 EMP charge. Press <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-border font-mono text-[10px] text-primary">TAB</kbd> to instantly vaporize the lowest danger word without shield penalty and earn 50% points. Recharge +1 EMP at every 10x streak!
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-xl bg-card/60 border border-border/60 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Maximize className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold font-display text-foreground">Full Screen Arcade Mode [F]</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Press <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-border font-mono text-[10px] text-emerald-400">F</kbd> or click the full screen button anytime for a distraction-free, full-height arcade experience with smooth edge-to-edge word descent.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-xl bg-card/60 border border-border/60 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold font-display text-foreground">Progress & Stats Curves</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Log in with your username to record your games. Your profile tracks your typing speed, accuracy, score decompositions (Base, Multiplier, Speed Bonus, Luck), and performance curves across Easy, Medium, and Hard!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

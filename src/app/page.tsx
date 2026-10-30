import Link from "next/link";
import {
  Terminal,
  Zap,
  Shield,
  Trophy,
  ArrowRight,
  Flame,
  BarChart3,
  Sparkles,
  Keyboard,
  Headphones,
  Code,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { HowToPlayModal } from "@/components/game/HowToPlayModal";
import { OnlinePresenceBadge } from "@/components/layout/OnlinePresenceBadge";

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background radial glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="container max-w-6xl px-4 pt-14 pb-14 sm:pt-20 sm:pb-20 text-center relative z-10">
        {/* Status pills & Online Runner Count */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-primary/30 text-xs font-mono text-primary animate-pulse">
            <span className="h-2 w-2 rounded-full bg-primary" />
            THE FUN WAY TO BOOST YOUR TYPING SPEED & ACCURACY
          </div>
          <OnlinePresenceBadge />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground font-display">
          TERMINAL <span className="text-primary glow-text">VELOCITY</span>
        </h1>
        <p className="mt-3 text-base sm:text-lg font-medium tracking-wider text-muted-foreground uppercase font-mono">
          Play An Action-Packed Game • Type Faster • Master Precision
        </p>

        {/* Mission Statement: Fun, Addictive Typing Improvement */}
        <p className="mt-5 text-sm sm:text-base max-w-2xl mx-auto text-muted-foreground leading-relaxed">
          Tired of boring typing tests and dry repetitive paragraphs? <strong className="text-foreground">Terminal Velocity</strong> transforms finger speed, muscle memory, and keystroke accuracy into an adrenaline-fueled cyberpunk arcade game. 
          Intercept descending words, chain <span className="text-amber-400 font-bold">4x multipliers</span>, trigger <span className="text-emerald-400 font-bold">matrix slow-mo pulses</span>, and watch your WPM skyrocket while having fun!
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/game"
            className="flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold px-8 py-3.5 rounded-xl text-sm hover:opacity-90 transition-all glow-primary tracking-wider shadow-lg"
          >
            <Terminal className="h-5 w-5" />
            START PLAYING NOW
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

        {/* Quick Speed Growth Metric Highlights */}
        <div className="mt-12 mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
          <div className="p-4 rounded-xl border border-primary/20 bg-card/60 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-primary glow-text">+25-40 WPM</div>
            <div className="text-[11px] text-muted-foreground uppercase mt-1">Average Speed Gain</div>
          </div>
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-card/60 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">99%+ Accuracy</div>
            <div className="text-[11px] text-muted-foreground uppercase mt-1">Trained by Stakes</div>
          </div>
          <div className="p-4 rounded-xl border border-amber-500/20 bg-card/60 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">4 Word Packs</div>
            <div className="text-[11px] text-muted-foreground uppercase mt-1">Dev, Security, Linux</div>
          </div>
          <div className="p-4 rounded-xl border border-purple-500/20 bg-card/60 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-purple-400">100% Free</div>
            <div className="text-[11px] text-muted-foreground uppercase mt-1">Pure Arcade Action</div>
          </div>
        </div>
      </section>

      {/* WHY TERMINAL VELOCITY IS THE BEST WAY TO IMPROVE TYPING */}
      <section className="container max-w-6xl px-4 py-16 border-t border-border/60 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            GAMIFIED TYPING IMPROVEMENT
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-foreground">
            WHY PRACTICE TYPING THE BORING WAY?
          </h2>
          <p className="text-sm font-mono text-muted-foreground mt-2 max-w-2xl mx-auto">
            Traditional typing tutors feel like homework. Terminal Velocity turns keystrokes into an addictive, flow-state arcade experience that builds reflex memory naturally.
          </p>
        </div>

        {/* Feature Grid: Marketed as Fun Typing Mastery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Fast Reflexes */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all shadow-lg flex flex-col group">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform glow-primary">
              <Keyboard className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">
              Adrenaline-Fueled Muscle Memory
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-1">
              Words descend in real-time across 4 lanes. Your fingers quickly react, lock onto targets, and type under pressure. Just 10 minutes a day builds lightning-fast finger dexterity without feeling like practice.
            </p>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[11px] font-mono text-primary font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Real-time hand-eye coordination</span>
            </div>
          </div>

          {/* Card 2: Accuracy Stakes */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/50 transition-all shadow-lg flex flex-col group">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">
              Precision-First Accuracy Scoring
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-1">
              Speed is meaningless if you fill your text with mistakes. Our <strong className="text-foreground">(2 × Error Rate)% penalty</strong> and streak resets train your brain to type with surgical 99%+ accuracy before ramping up pure velocity.
            </p>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Eliminates sloppy button-mashing</span>
            </div>
          </div>

          {/* Card 3: Arcade Power-ups */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 hover:border-amber-500/50 transition-all shadow-lg flex flex-col group">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <Flame className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">
              Tactical Power-Ups & Matrix Slow-Mo
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-1">
              Experience the thrill of clutch comebacks: trigger a 5-second <strong className="text-amber-400">Matrix Slow-Mo Overclock</strong> at 15-streaks, catch rare cyan Nanite Shield packets to restore shields, and use emergency EMP blasts!
            </p>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[11px] font-mono text-amber-400 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Exciting gameplay in every session</span>
            </div>
          </div>

          {/* Card 4: Themed Word Packs */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 hover:border-cyan-500/50 transition-all shadow-lg flex flex-col group">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Code className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">
              Vocabulary That Actually Matters
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-1">
              Why type random fairy tales? Choose themed word packs that sharpen your daily workflow: Developer keywords (<code className="text-cyan-300">async</code>, <code className="text-cyan-300">const</code>), Cybersecurity terms, or Linux commands (<code className="text-cyan-300">docker</code>, <code className="text-cyan-300">sudo</code>).
            </p>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Practice coding & system syntax</span>
            </div>
          </div>

          {/* Card 5: Synthwave Flow */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 hover:border-purple-500/50 transition-all shadow-lg flex flex-col group">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Headphones className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">
              Dynamic Synthwave Flow State
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-1">
              Lock into the typing zone. Our procedural Web Audio synthesizer dynamically layers instruments as your streak climbs—from ambient sub-bass up to a blazing 4x MAX lead synth that syncs to your fingers.
            </p>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[11px] font-mono text-purple-400 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Audio-reactive rhythm stimulation</span>
            </div>
          </div>

          {/* Card 6: Typo Heatmap & Telemetry */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all shadow-lg flex flex-col group">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform glow-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">
              Interactive QWERTY Typo Heatmaps
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-1">
              Diagnose your weak keys instantly. Our post-game Data Science dashboard features an interactive virtual keyboard highlighting your error-prone keys, speed improvement curves, and behavioral typing personas.
            </p>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[11px] font-mono text-primary font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Targeted keystroke diagnostics</span>
            </div>
          </div>
        </div>

        {/* Bottom Banner Call to Action */}
        <div className="mt-14 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-primary/15 via-secondary/80 to-primary/15 border border-primary/30 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-4xl font-black font-display text-foreground tracking-tight">
              READY TO SMASH YOUR PERSONAL BEST?
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-mono">
              Zero downloads. Zero setup. Jump straight into the terminal and feel the thrill of high-speed arcade typing.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/game"
                className="flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold px-8 py-3.5 rounded-xl text-sm hover:opacity-90 transition-all glow-primary tracking-wider shadow-lg"
              >
                <Zap className="h-4 w-4" />
                PLAY NOW IN BROWSER
              </Link>
              <HowToPlayModal />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

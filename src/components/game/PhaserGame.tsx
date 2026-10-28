"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Clock,
  Zap,
  Flame,
  Volume2,
  VolumeX,
  RotateCcw,
  BarChart2,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Skull,
  TrendingUp,
  AlertOctagon,
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ProbabilityEngine, SeededRandom } from "@/lib/probability/engine";
import { soundEngine } from "@/lib/audio/soundEngine";
import { PacketDefinition, PacketEvent, GameRunResult } from "@/types";

interface FloatingFeedback {
  id: string;
  text: string;
  type: "clean" | "corrupted" | "missed";
  lane: number;
  y: number;
}

// Clean Integer Streak Combo: 3 in a row = 2x, 6 in a row = 3x, 10+ = 4x MAX
const getComboMultiplier = (c: number): number => {
  if (c >= 10) return 4;
  if (c >= 6) return 3;
  if (c >= 3) return 2;
  return 1;
};

interface PhaserGameProps {
  mode: "classic" | "endless" | "daily";
  difficulty: "easy" | "medium" | "hard";
  onGameOver?: (result: GameRunResult) => void;
}

// 4 distinct horizontal column lanes (percentages from left edge)
const LANES = [14, 38, 62, 86];

export function PhaserGame({ mode, difficulty, onGameOver }: PhaserGameProps) {
  const router = useRouter();
  const { theme, hudMode, soundEnabled, setSoundEnabled, sfxVolume, screenShake, setLastRunResult } =
    useGameStore();
  const { isAuthenticated } = useAuthStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // Live game telemetry state
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(mode === "classic" ? 90 : 0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<"ready" | "playing" | "gameover">("ready");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Floating score and missed damage indicators
  const [feedbacks, setFeedbacks] = useState<FloatingFeedback[]>([]);
  const [isShaking, setIsShaking] = useState(false);

  const triggerShake = useCallback(() => {
    if (screenShake) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 260);
    }
  }, [screenShake]);

  const addFeedback = useCallback(
    (text: string, type: "clean" | "corrupted" | "missed", lane: number, y: number) => {
      const id = `feed_${Date.now()}_${Math.random()}`;
      setFeedbacks((prev) => [...prev.slice(-4), { id, text, type, lane, y }]);
      setTimeout(() => {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      }, 900);
    },
    []
  );

  // Packets state
  const [activePackets, setActivePackets] = useState<PacketDefinition[]>([]);

  // Synchronized state refs for zero-latency keystroke processing without event listener churning
  const gameStatusRef = useRef(gameStatus);
  gameStatusRef.current = gameStatus;

  const activePacketsRef = useRef(activePackets);
  activePacketsRef.current = activePackets;

  const activeTargetIdRef = useRef(activeTargetId);
  activeTargetIdRef.current = activeTargetId;

  const currentInputRef = useRef(currentInput);
  currentInputRef.current = currentInput;

  const comboRef = useRef(combo);
  comboRef.current = combo;

  const maxComboRef = useRef(maxCombo);
  maxComboRef.current = maxCombo;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const livesRef = useRef(lives);
  livesRef.current = lives;

  // Internal run refs
  const runDataRef = useRef<{
    runId: string;
    runToken: string;
    seed: string;
    startTime: number;
    rng: SeededRandom;
    events: PacketEvent[];
    keystrokesTotal: number;
    keystrokesCorrect: number;
    packetCounter: number;
    lastSpawnTime: number;
  }>({
    runId: "",
    runToken: "",
    seed: "",
    startTime: 0,
    rng: new SeededRandom("default"),
    events: [],
    keystrokesTotal: 0,
    keystrokesCorrect: 0,
    packetCounter: 0,
    lastSpawnTime: 0,
  });

  // Mobile virtual keyboard input
  const inputRef = useRef<HTMLInputElement>(null);

  // Spawn helper: picks the lane with fewest active packets
  const getOptimalLane = useCallback((packets: PacketDefinition[]): number => {
    const laneCounts = [0, 0, 0, 0];
    for (const pkt of packets) {
      if (pkt.laneIndex >= 0 && pkt.laneIndex < 4) {
        laneCounts[pkt.laneIndex]++;
      }
    }
    let minLane = 0;
    let minCount = laneCounts[0];
    for (let i = 1; i < 4; i++) {
      if (laneCounts[i] < minCount) {
        minCount = laneCounts[i];
        minLane = i;
      }
    }
    return minLane;
  }, []);

  // Initialize Game Run Session with Server
  const initializeRun = useCallback(async () => {
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const rng = new SeededRandom(data.seed);
      const now = Date.now();

      // Immediately generate an initial wave of 3 packets across lanes 0, 1, 2
      const initialPackets: PacketDefinition[] = [];
      const waveCount = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
      for (let i = 0; i < waveCount; i++) {
        const pkt = ProbabilityEngine.generatePacket(
          `pkt_${i + 1}`,
          difficulty,
          rng,
          now - i * 400,
          i % 4
        );
        // Stagger initial progress slightly for natural flow
        pkt.durationSeconds -= i * 0.8;
        initialPackets.push(pkt);
      }

      runDataRef.current = {
        runId: data.runId,
        runToken: data.runToken,
        seed: data.seed,
        startTime: now,
        rng,
        events: [],
        keystrokesTotal: 0,
        keystrokesCorrect: 0,
        packetCounter: waveCount,
        lastSpawnTime: now,
      };

      setScore(0);
      scoreRef.current = 0;
      setLives(3);
      livesRef.current = 3;
      setCombo(0);
      comboRef.current = 0;
      setMaxCombo(0);
      maxComboRef.current = 0;
      setTimeRemaining(mode === "classic" ? 90 : 0);
      setElapsedSeconds(0);
      setCurrentInput("");
      currentInputRef.current = "";
      setActivePackets(initialPackets);
      activePacketsRef.current = initialPackets;
      setActiveTargetId(null);
      activeTargetIdRef.current = null;
      setGameStatus("playing");
      gameStatusRef.current = "playing";

      // Instantly focus game container so physical keyboard works immediately without clicking
      setTimeout(() => {
        containerRef.current?.focus();
      }, 10);
    } catch (err) {
      console.error("Game init failed:", err);
    }
  }, [mode, difficulty]);

  // Handle immediate restart
  const handleRestart = useCallback(() => {
    soundEngine.playKeyClick();
    initializeRun();
    setTimeout(() => {
      containerRef.current?.focus();
    }, 10);
  }, [initializeRun]);

  // Handle Game Over & Score Submission
  const handleGameOver = useCallback(
    async (finalScoreVal: number, maxComboVal: number) => {
      setGameStatus("gameover");
      gameStatusRef.current = "gameover";
      soundEngine.playGameOver();

      const run = runDataRef.current;
      const endTime = Date.now();
      const durationSeconds = Math.max(1, Math.round((endTime - run.startTime) / 1000));

      const wpm =
        run.keystrokesCorrect > 0
          ? Math.round((run.keystrokesCorrect / 5) / (durationSeconds / 60))
          : 0;
      const accuracy =
        run.keystrokesTotal > 0
          ? Math.round((run.keystrokesCorrect / run.keystrokesTotal) * 100)
          : 100;

      const runResult: GameRunResult = {
        runId: run.runId,
        mode,
        difficulty,
        seed: run.seed,
        startTime: run.startTime,
        endTime,
        durationSeconds,
        finalScore: finalScoreVal,
        wpm,
        accuracy,
        totalPacketsSpawned: run.packetCounter,
        packetsCaptured: run.events.filter((e) => e.action === "intercepted").length,
        cleanCount: run.events.filter((e) => e.outcome === "clean").length,
        corruptedCount: run.events.filter((e) => e.outcome === "corrupted").length,
        missedCount: run.events.filter((e) => e.action === "missed").length,
        ignoredCount: run.events.filter((e) => e.action === "ignored").length,
        totalExpectedValue: Number(
          run.events
            .filter((e) => e.action === "intercepted")
            .reduce((sum, e) => sum + e.expectedValue, 0)
            .toFixed(1)
        ),
        totalRealizedScore: run.events
          .filter((e) => e.action === "intercepted")
          .reduce((sum, e) => sum + e.pointsDelta, 0),
        maxCombo: maxComboVal,
        events: run.events,
        status: "validated",
      };

      setLastRunResult(runResult);
      if (onGameOver) onGameOver(runResult);

      // Submit to server
      setIsSubmitting(true);
      try {
        await fetch("/api/game/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runToken: run.runToken,
            finalScore: finalScoreVal,
            wpm,
            accuracy,
            maxCombo: maxComboVal,
            events: run.events,
            endTime,
          }),
        });
      } catch (err) {
        console.error("Score submit error:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [difficulty, mode, onGameOver, setLastRunResult]
  );

  // High-Frequency 60 FPS RequestAnimationFrame Loop
  useEffect(() => {
    if (gameStatus !== "playing") return;

    let animId: number;
    let lastTime = performance.now();
    let oneSecAccumulator = 0;

    // Target concurrency and spawn cooldowns
    const targetCount = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
    const minSpawnDelay = difficulty === "easy" ? 1400 : difficulty === "medium" ? 950 : 650;

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // 1. Update Game Timers
      oneSecAccumulator += dt;
      if (oneSecAccumulator >= 1) {
        oneSecAccumulator -= 1;
        if (mode === "classic") {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              handleGameOver(score, maxCombo);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setElapsedSeconds((prev) => prev + 1);
        }
      }

      // 2. High-speed smooth spawning
      const now = Date.now();
      setActivePackets((prev) => {
        let current = [...prev];

        // Check if we need to spawn a new packet
        if (
          current.length < targetCount &&
          now - runDataRef.current.lastSpawnTime >= minSpawnDelay
        ) {
          runDataRef.current.lastSpawnTime = now;
          runDataRef.current.packetCounter += 1;
          const lane = getOptimalLane(current);
          const newPkt = ProbabilityEngine.generatePacket(
            `pkt_${runDataRef.current.packetCounter}`,
            difficulty,
            runDataRef.current.rng,
            now,
            lane
          );
          current.push(newPkt);
        }

        // 3. Move packets downwards with exact dt
        const next: PacketDefinition[] = [];
        let escapedCount = 0;
        const escapedLanes: number[] = [];

        for (const pkt of current) {
          const newDur = pkt.durationSeconds - dt;
          if (newDur <= 0) {
            // Packet reached bottom firewall line & timed out!
            escapedCount++;
            escapedLanes.push(pkt.laneIndex);
            soundEngine.playMissedPacket();

            // Clear target lock immediately if player was typing this expired packet
            if (activeTargetIdRef.current === pkt.id) {
              activeTargetIdRef.current = null;
              currentInputRef.current = "";
              setActiveTargetId(null);
              setCurrentInput("");
            }

            runDataRef.current.events.push({
              packetId: pkt.id,
              code: pkt.code,
              reward: pkt.reward,
              corruptionProbability: pkt.corruptionProbability,
              corruptionPenalty: pkt.corruptionPenalty,
              expectedValue: pkt.expectedValue,
              action: "missed",
              outcome: "missed",
              timestampMs: Date.now() - runDataRef.current.startTime,
              pointsDelta: -Math.round(pkt.reward * 0.3),
              wpm: 0,
              accuracy: 0,
            });
          } else {
            next.push({ ...pkt, durationSeconds: newDur });
          }
        }

        if (escapedCount > 0) {
          triggerShake();
          for (const l of escapedLanes) {
            addFeedback("LOST! -1 SHIELD", "missed", l, 460);
          }
          comboRef.current = 0;
          setCombo(0);
          setLives((l) => {
            const nextL = Math.max(0, l - escapedCount);
            livesRef.current = nextL;
            if (nextL <= 0) {
              handleGameOver(scoreRef.current, maxComboRef.current);
            }
            return nextL;
          });
        }

        activePacketsRef.current = next;
        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [addFeedback, difficulty, gameStatus, getOptimalLane, handleGameOver, maxCombo, mode, score, triggerShake]);

  // Handle Keystrokes & Typing Interception (Reads from refs for instantaneous response)
  const processKey = useCallback(
    (char: string) => {
      if (gameStatusRef.current !== "playing") return;

      const upperChar = char.toUpperCase();
      runDataRef.current.keystrokesTotal += 1;
      soundEngine.playKeyClick();

      const packets = activePacketsRef.current;
      const targetId = activeTargetIdRef.current;
      const curInput = currentInputRef.current;

      // Find best target packet
      let target = packets.find((p) => p.id === targetId);

      if (!target) {
        // Find packet starting with this character (prioritize packet lowest on screen / least duration remaining)
        const candidates = packets
          .filter((p) => p.code.startsWith(upperChar))
          .sort((a, b) => a.durationSeconds - b.durationSeconds);

        if (candidates.length > 0) {
          target = candidates[0];
          activeTargetIdRef.current = target.id;
          setActiveTargetId(target.id);
          currentInputRef.current = upperChar;
          setCurrentInput(upperChar);
          runDataRef.current.keystrokesCorrect += 1;
          return;
        } else {
          // Mistype
          return;
        }
      }

      // If we already have a target, check next expected character
      const expectedNext = target.code.charAt(curInput.length);
      if (upperChar === expectedNext) {
        const nextInput = curInput + upperChar;
        currentInputRef.current = nextInput;
        setCurrentInput(nextInput);
        runDataRef.current.keystrokesCorrect += 1;

        // Completed packet!
        if (nextInput === target.code) {
          // Resolve packet outcome strictly using probability model
          const { outcome } = ProbabilityEngine.sampleOutcome(
            target.corruptionProbability,
            runDataRef.current.rng
          );

          let pointsDelta = 0;
          const currentCombo = comboRef.current;
          const comboMultiplier = getComboMultiplier(currentCombo);

          if (outcome === "clean") {
            pointsDelta = target.reward * comboMultiplier;
            soundEngine.playCleanInterception();
            const nextCombo = currentCombo + 1;
            comboRef.current = nextCombo;
            setCombo(nextCombo);
            if (nextCombo > maxComboRef.current) {
              maxComboRef.current = nextCombo;
              setMaxCombo(nextCombo);
            }
            if (nextCombo === 3 || nextCombo === 6 || nextCombo === 10) {
              soundEngine.playComboUp(nextCombo);
            }
            addFeedback(`+${pointsDelta} PTS (${comboMultiplier}x)`, "clean", target.laneIndex, 250);
          } else {
            // Corrupted packet!
            pointsDelta = -target.corruptionPenalty;
            soundEngine.playCorruptedGlitch();
            triggerShake();
            comboRef.current = 0;
            setCombo(0);
            const nextLives = Math.max(0, livesRef.current - 1);
            livesRef.current = nextLives;
            setLives(nextLives);
            addFeedback(`${pointsDelta} PTS [-1 SHIELD]`, "corrupted", target.laneIndex, 250);
            if (nextLives <= 0) {
              handleGameOver(scoreRef.current + pointsDelta, maxComboRef.current);
            }
          }

          const newScore = Math.max(0, scoreRef.current + pointsDelta);
          scoreRef.current = newScore;
          setScore(newScore);

          // Log packet event
          runDataRef.current.events.push({
            packetId: target.id,
            code: target.code,
            reward: target.reward,
            corruptionProbability: target.corruptionProbability,
            corruptionPenalty: target.corruptionPenalty,
            expectedValue: target.expectedValue,
            action: "intercepted",
            outcome,
            timestampMs: Date.now() - runDataRef.current.startTime,
            pointsDelta,
            wpm: 65,
            accuracy: 96,
          });

          // Remove packet from active list
          const remaining = packets.filter((p) => p.id !== target?.id);
          activePacketsRef.current = remaining;
          setActivePackets(remaining);

          activeTargetIdRef.current = null;
          setActiveTargetId(null);
          currentInputRef.current = "";
          setCurrentInput("");
        }
      } else {
        // Mistype on active target: reset current target focus
        currentInputRef.current = "";
        setCurrentInput("");
        activeTargetIdRef.current = null;
        setActiveTargetId(null);
      }
    },
    [addFeedback, handleGameOver, triggerShake]
  );

  // Auto-focus container on mount and when entering playing or ready states
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (gameStatus === "playing" || gameStatus === "ready") {
      containerRef.current?.focus();
    }
  }, [gameStatus]);

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a form input outside the game (e.g. search, modal, auth)
      if (
        (e.target instanceof HTMLInputElement && e.target !== inputRef.current) ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // If mobile virtual input is focused, let onInput handle it to avoid duplicate keystroke events
      if (e.target === inputRef.current) {
        return;
      }

      // If in ready or gameover state, Space or Enter starts / restarts immediately
      if (
        (gameStatusRef.current === "ready" || gameStatusRef.current === "gameover") &&
        (e.key === " " || e.key === "Enter")
      ) {
        e.preventDefault();
        initializeRun();
        setTimeout(() => {
          containerRef.current?.focus();
        }, 10);
        return;
      }

      // If in ready state and player presses any letter [a-zA-Z], automatically start run and type that letter
      if (
        gameStatusRef.current === "ready" &&
        e.key.length === 1 &&
        /^[a-zA-Z]$/.test(e.key) &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        initializeRun().then(() => {
          processKey(e.key);
          setTimeout(() => {
            containerRef.current?.focus();
          }, 10);
        });
        return;
      }

      if (e.key === "Backspace") {
        currentInputRef.current = currentInputRef.current.slice(0, -1);
        setCurrentInput(currentInputRef.current);
        if (currentInputRef.current.length === 0) {
          activeTargetIdRef.current = null;
          setActiveTargetId(null);
        }
        return;
      }

      if (e.key === "Escape") {
        activeTargetIdRef.current = null;
        setActiveTargetId(null);
        currentInputRef.current = "";
        setCurrentInput("");
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        processKey(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [initializeRun, processKey]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Terminal Velocity Arcade Playfield"
      className={`relative w-full max-w-5xl mx-auto h-[690px] rounded-xl border border-primary/30 bg-card/95 overflow-hidden shadow-2xl flex flex-col font-sans select-none focus:outline-none focus:ring-1 focus:ring-primary/50 ${
        isShaking ? "animate-shake ring-2 ring-rose-500/80" : ""
      }`}
      onClick={() => {
        containerRef.current?.focus();
      }}
    >
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 scanlines z-30 pointer-events-none" />

      {/* Top HUD Telemetry Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/80 bg-secondary/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-6">
          {/* Score */}
          <div>
            <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              CURRENT SCORE
            </div>
            <div className="text-3xl font-black font-display tracking-tight text-primary glow-text">
              {score.toLocaleString()}
            </div>
          </div>

          {/* Clean Integer Streak Combo */}
          <div className="hidden sm:block">
            <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              STREAK COMBO
            </div>
            <div className="text-2xl font-black font-display text-amber-400 flex items-center gap-1">
              <Flame className={`h-5 w-5 ${combo >= 3 ? "text-amber-400 fill-amber-400/40" : "text-muted-foreground"}`} />
              {getComboMultiplier(combo)}x
              {combo > 0 && (
                <span className="text-xs font-mono text-muted-foreground ml-1 font-normal">
                  ({combo})
                </span>
              )}
            </div>
          </div>

          {/* Shields / Firewall Integrity */}
          <div>
            <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              FIREWALL INTEGRITY
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {[1, 2, 3].map((idx) => (
                <Shield
                  key={idx}
                  className={`h-5 w-5 transition-all ${
                    idx <= lives
                      ? "text-primary fill-primary/30 drop-shadow-[0_0_8px_currentColor]"
                      : "text-muted-foreground/30 fill-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center: Mode Specific Status Telemetry */}
        <div className="hidden md:flex items-center gap-2 font-mono text-xs">
          {mode === "classic" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-bold">
              <Zap className="h-3.5 w-3.5" />
              <span>CLASSIC 90S SPRINT</span>
              <span className="text-muted-foreground">//</span>
              <span className="text-amber-400">{difficulty.toUpperCase()}</span>
            </div>
          )}
          {mode === "endless" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              <Shield className="h-3.5 w-3.5" />
              <span>SURVIVAL WAVE {Math.floor(elapsedSeconds / 30) + 1}</span>
              <span className="text-muted-foreground">//</span>
              <span className="text-amber-400">{difficulty.toUpperCase()}</span>
            </div>
          )}
          {mode === "daily" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>DAILY CHALLENGE</span>
              <span className="text-muted-foreground">//</span>
              <span className="text-primary">{difficulty.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Right side: Mode-Adaptive Timer, Restart button & Sound toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase text-right">
              {mode === "classic" ? "TIME REMAINING" : "SURVIVAL TIME"}
            </div>
            <div
              className={`text-2xl font-black font-display flex items-center justify-end gap-1.5 ${
                mode === "classic" && timeRemaining <= 10
                  ? "text-rose-500 animate-pulse glow-danger"
                  : mode === "classic" && timeRemaining <= 20
                  ? "text-amber-400"
                  : "text-foreground"
              }`}
            >
              <Clock className="h-5 w-5 text-primary" />
              {mode === "classic"
                ? `${timeRemaining}s`
                : `${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60)
                    .toString()
                    .padStart(2, "0")}`}
            </div>
          </div>

          {/* In-Game Restart Button */}
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              handleRestart();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 border border-border hover:border-primary/50 text-xs font-mono font-bold text-muted-foreground hover:text-foreground transition-all active:scale-95 shadow-sm glow-hover"
            title="Restart Current Game"
          >
            <RotateCcw className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">RESTART</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-secondary/80 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle Sound"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Arcade Canvas Playfield (4 Lanes) */}
      <div className="relative flex-1 bg-black/75 overflow-hidden">
        {/* Subtle grid lines & 4 lane guides */}
        <div className="absolute inset-0 terminal-grid opacity-35 pointer-events-none" />
        <div className="absolute inset-0 flex justify-between px-12 pointer-events-none opacity-15">
          <div className="w-[1px] h-full bg-border border-dashed border-l" />
          <div className="w-[1px] h-full bg-border border-dashed border-l" />
          <div className="w-[1px] h-full bg-border border-dashed border-l" />
          <div className="w-[1px] h-full bg-border border-dashed border-l" />
        </div>

        {/* Bottom Escape Firewall Line */}
        <div className="absolute bottom-6 left-0 right-0 h-1.5 bg-rose-500/60 border-t border-rose-500 z-10 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.6)]">
          <span className="text-[9px] font-mono tracking-widest text-rose-300 bg-black/95 px-3 py-0.5 rounded border border-rose-500/60 uppercase font-black">
            [ FIREWALL DEFENSE LINE // TIMEOUT = -1 SHIELD ]
          </span>
        </div>

        {/* Floating feedback animations */}
        {feedbacks.map((f) => (
          <div
            key={f.id}
            style={{
              left: `${LANES[f.lane % 4]}%`,
              top: `${f.y}px`,
            }}
            className={`absolute pointer-events-none z-30 font-mono text-xs font-black px-2.5 py-1 rounded-md border shadow-2xl animate-float-feedback select-none ${
              f.type === "clean"
                ? "bg-emerald-950/95 border-emerald-400 text-emerald-300 glow-primary"
                : f.type === "corrupted"
                ? "bg-rose-950/95 border-rose-500 text-rose-300 glow-danger"
                : "bg-rose-950/95 border-rose-500 text-rose-200"
            }`}
          >
            {f.text}
          </div>
        ))}

        {/* Ready / Start Overlay */}
        {gameStatus === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-40 p-6 text-center animate-in fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 mb-4 glow-primary">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
              DATA STREAM ONLINE
            </h2>
            <p className="mt-2 text-xs font-mono text-muted-foreground uppercase tracking-widest">
              MODE: <span className="text-primary font-bold">{mode}</span> // DIFFICULTY:{" "}
              <span className="text-amber-400 font-bold">{difficulty}</span>
            </p>
            <p className="mt-3 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Words descend across 4 telemetry lanes. Type the first letter to acquire lock. Keep your 3 Shields intact: words that reach the bottom line will disappear and cost a shield!
            </p>

            <div className="mt-8 flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  initializeRun();
                  setTimeout(() => {
                    containerRef.current?.focus();
                  }, 10);
                }}
                className="bg-primary text-primary-foreground font-display font-black px-8 py-3.5 rounded-lg text-sm hover:opacity-90 transition-all glow-primary tracking-widest"
              >
                START INTERCEPTION [SPACE]
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameStatus === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-40 p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/30 mb-3 glow-danger">
              <AlertTriangle className="h-8 w-8 text-rose-500 animate-bounce" />
            </div>
            <h2 className="text-3xl font-black font-display tracking-tight text-rose-500">
              TERMINAL SHUTDOWN
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Firewall depleted or operational timeline concluded
            </p>

            <div className="mt-5 p-5 rounded-xl bg-card border border-border/80 max-w-sm w-full font-mono">
              <div className="text-[11px] text-muted-foreground uppercase">FINAL VALIDATED SCORE</div>
              <div className="text-4xl font-black text-primary glow-text mt-1">
                {score.toLocaleString()} PTS
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-muted-foreground">
                <div className="p-2.5 rounded bg-secondary/50 border border-border/40">
                  MAX COMBO: <span className="text-amber-400 font-bold">{getComboMultiplier(maxCombo)}x ({maxCombo})</span>
                </div>
                <div className="p-2.5 rounded bg-secondary/50 border border-border/40">
                  CAPTURED: <span className="text-foreground font-bold">{runDataRef.current.events.filter(e => e.action === "intercepted").length}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  initializeRun();
                  setTimeout(() => {
                    containerRef.current?.focus();
                  }, 10);
                }}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold px-6 py-2.5 rounded-lg text-xs hover:opacity-90 transition-all glow-primary"
              >
                <RotateCcw className="h-4 w-4" />
                PLAY AGAIN [SPACE]
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-display font-medium px-5 py-2.5 rounded-lg text-xs border border-border transition-all"
              >
                <BarChart2 className="h-4 w-4 text-primary" />
                VIEW DATA SCIENCE ANALYTICS
              </button>
            </div>
          </div>
        )}

        {/* 4 Multi-Lane Descending Packets */}
        {gameStatus === "playing" &&
          activePackets.map((pkt) => {
            const isTarget = activeTargetId === pkt.id;
            const totalDuration =
              difficulty === "easy" ? 11 : difficulty === "medium" ? 8.5 : 6.5;
            const progress = Math.max(0, Math.min(1, 1 - pkt.durationSeconds / totalDuration));
            const topY = progress * 460 + 15; // 15px to 475px

            // Column lane horizontal coordinate
            const lanePercent = LANES[pkt.laneIndex % 4];

            // Standardized Risk Tiers
            const isSafe = pkt.corruptionProbability < 0.25;
            const isCaution = pkt.corruptionProbability >= 0.25 && pkt.corruptionProbability < 0.50;
            const isDanger = pkt.corruptionProbability >= 0.50;

            return (
              <div
                key={pkt.id}
                onClick={() => {
                  setActiveTargetId(pkt.id);
                  activeTargetIdRef.current = pkt.id;
                  setCurrentInput("");
                  currentInputRef.current = "";
                }}
                style={{
                  top: `${topY}px`,
                  left: `${lanePercent}%`,
                  transform: "translateX(-50%)",
                }}
                className={`absolute w-52 sm:w-56 rounded-xl border p-2.5 backdrop-blur-md cursor-pointer select-none will-change-transform transition-[border-color,box-shadow] duration-150 ${
                  isTarget
                    ? "border-primary bg-primary/20 ring-2 ring-primary scale-105 z-20 glow-primary shadow-2xl"
                    : isSafe
                    ? "border-emerald-500/50 bg-card/90 hover:border-emerald-400 z-10 shadow-lg"
                    : isCaution
                    ? "border-amber-500/50 bg-card/90 hover:border-amber-400 z-10 shadow-lg"
                    : "border-rose-500/50 bg-card/90 hover:border-rose-400 z-10 shadow-lg"
                }`}
              >
                {/* Header: Reward & Clear Color Risk Tag */}
                <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                  <span className="font-bold text-foreground font-display text-xs">+{pkt.reward} PTS</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isSafe
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : isCaution
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    }`}
                  >
                    {isSafe ? "🟢 SAFE" : isCaution ? "🟡 RISKY" : "🔴 DANGER"} ({Math.round(pkt.corruptionProbability * 100)}%)
                  </span>
                </div>

                {/* Packet String to Type */}
                <div className="text-center font-mono text-lg font-black tracking-widest my-1 py-1 rounded bg-black/60 border border-border/40">
                  {isTarget ? (
                    <span>
                      <span className="text-primary glow-text font-black">
                        {pkt.code.slice(0, currentInput.length)}
                      </span>
                      <span className="text-foreground">
                        {pkt.code.slice(currentInput.length)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-foreground">{pkt.code}</span>
                  )}
                </div>

                {/* Bottom Row: EV and Countdown */}
                <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-1 border-t border-border/40">
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      isSafe ? "text-emerald-400" : isCaution ? "text-amber-400" : "text-rose-400"
                    }`}
                  >
                    EV: +{pkt.expectedValue}
                  </span>
                  <span className="text-muted-foreground text-[9px] font-bold">
                    {Math.max(0, pkt.durationSeconds).toFixed(1)}s LEFT
                  </span>
                </div>

                {/* Decay progress bar */}
                <div className="w-full bg-secondary/80 h-1 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full ${
                      isTarget
                        ? "bg-primary"
                        : isSafe
                        ? "bg-emerald-400"
                        : isCaution
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                    style={{ width: `${(pkt.durationSeconds / totalDuration) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* Bottom Keyboard Telemetry & Assist Bar */}
      <div className="px-6 py-2.5 border-t border-border/80 bg-secondary/40 flex items-center justify-between z-20 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-muted-foreground">KEYBOARD INTERFACE:</span>
          {activeTargetId ? (
            <span className="text-primary font-bold">
              LOCKED ON [{currentInput}_] // TYPE NEXT CHAR
            </span>
          ) : (
            <span className="text-muted-foreground">
              SCANNING // TYPE ANY PACKET FIRST LETTER TO LOCK TARGET
            </span>
          )}
        </div>

        {/* Mobile touch hidden input */}
        <input
          ref={inputRef}
          type="text"
          className="opacity-0 absolute -z-10 h-0 w-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const val = e.target.value;
            if (val.length > 0) {
              processKey(val.charAt(val.length - 1));
              e.target.value = "";
            }
          }}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (inputRef.current) inputRef.current.focus();
            }}
            className="sm:hidden text-xs px-2.5 py-1 rounded bg-primary/20 text-primary border border-primary/40 font-mono"
          >
            OPEN TOUCH KEYPAD
          </button>
        </div>
      </div>
    </div>
  );
}

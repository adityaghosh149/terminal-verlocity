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
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ProbabilityEngine, SeededRandom } from "@/lib/probability/engine";
import { soundEngine } from "@/lib/audio/soundEngine";
import { PacketDefinition, PacketEvent, GameRunResult } from "@/types";

interface PhaserGameProps {
  mode: "classic" | "endless" | "daily";
  difficulty: "easy" | "medium" | "hard";
  onGameOver?: (result: GameRunResult) => void;
}

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

  // Packets state
  const [activePackets, setActivePackets] = useState<PacketDefinition[]>([]);

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
  });

  // Mobile virtual keyboard input
  const inputRef = useRef<HTMLInputElement>(null);

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

      runDataRef.current = {
        runId: data.runId,
        runToken: data.runToken,
        seed: data.seed,
        startTime: data.startTime,
        rng: new SeededRandom(data.seed),
        events: [],
        keystrokesTotal: 0,
        keystrokesCorrect: 0,
        packetCounter: 0,
      };

      setScore(0);
      setLives(3);
      setCombo(0);
      setMaxCombo(0);
      setTimeRemaining(mode === "classic" ? 90 : 0);
      setElapsedSeconds(0);
      setCurrentInput("");
      setActivePackets([]);
      setActiveTargetId(null);
      setGameStatus("playing");

      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err) {
      console.error("Game init failed:", err);
    }
  }, [mode, difficulty]);

  // Handle Game Over & Score Submission
  const handleGameOver = useCallback(
    async (finalScoreVal: number, maxComboVal: number) => {
      setGameStatus("gameover");
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

  // Main Game Loop Timer & Packet Descent (60 FPS tick)
  useEffect(() => {
    if (gameStatus !== "playing") return;

    let lastSpawn = Date.now();
    const spawnInterval = difficulty === "easy" ? 2800 : difficulty === "medium" ? 2200 : 1600;

    const gameInterval = setInterval(() => {
      const now = Date.now();

      // Countdown in classic mode
      if (mode === "classic") {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(gameInterval);
            handleGameOver(score, maxCombo);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setElapsedSeconds((prev) => prev + 1);
      }

      // Spawn packets periodically
      if (now - lastSpawn > spawnInterval && activePackets.length < 6) {
        lastSpawn = now;
        runDataRef.current.packetCounter += 1;
        const newPacket = ProbabilityEngine.generatePacket(
          `pkt_${runDataRef.current.packetCounter}`,
          difficulty,
          runDataRef.current.rng,
          now
        );
        setActivePackets((prev) => [...prev, newPacket]);
      }
    }, 1000);

    return () => clearInterval(gameInterval);
  }, [activePackets.length, difficulty, gameStatus, handleGameOver, maxCombo, mode, score]);

  // High-frequency animation frame loop for smooth packet descent
  useEffect(() => {
    if (gameStatus !== "playing") return;

    let animId: number;
    let lastTime = performance.now();

    const updateFrame = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setActivePackets((prev) => {
        const next: PacketDefinition[] = [];
        let hitBottomOccurred = false;

        for (const pkt of prev) {
          const newDuration = pkt.durationSeconds - dt;
          if (newDuration <= 0) {
            // Packet escaped!
            hitBottomOccurred = true;
            soundEngine.playMissedPacket();

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
            next.push({ ...pkt, durationSeconds: newDuration });
          }
        }

        if (hitBottomOccurred) {
          setCombo(0);
          setLives((l) => {
            const nextLives = l - 1;
            if (nextLives <= 0) {
              handleGameOver(score, maxCombo);
            }
            return Math.max(0, nextLives);
          });
        }

        return next;
      });

      animId = requestAnimationFrame(updateFrame);
    };

    animId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animId);
  }, [gameStatus, handleGameOver, maxCombo, score]);

  // Handle Keystrokes & Typing Interception
  const processKey = useCallback(
    (char: string) => {
      if (gameStatus !== "playing") return;

      const upperChar = char.toUpperCase();
      runDataRef.current.keystrokesTotal += 1;
      soundEngine.playKeyClick();

      // Find best target packet
      let target = activePackets.find((p) => p.id === activeTargetId);

      if (!target) {
        // Find packet starting with this character
        target = activePackets.find((p) => p.code.startsWith(upperChar));
        if (target) {
          setActiveTargetId(target.id);
          setCurrentInput(upperChar);
          runDataRef.current.keystrokesCorrect += 1;
          return;
        } else {
          // Mistype
          return;
        }
      }

      // If we already have a target, check next expected character
      const expectedNext = target.code.charAt(currentInput.length);
      if (upperChar === expectedNext) {
        const nextInput = currentInput + upperChar;
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
          if (outcome === "clean") {
            const comboMultiplier = 1 + Math.min(2.0, combo * 0.1);
            pointsDelta = Math.round(target.reward * comboMultiplier);
            soundEngine.playCleanInterception();
            const nextCombo = combo + 1;
            setCombo(nextCombo);
            if (nextCombo > maxCombo) setMaxCombo(nextCombo);
            if (nextCombo % 5 === 0) soundEngine.playComboUp(nextCombo);
          } else {
            // Corrupted packet!
            pointsDelta = -target.corruptionPenalty;
            soundEngine.playCorruptedGlitch();
            setCombo(0);
            setLives((l) => {
              const nextLives = l - 1;
              if (nextLives <= 0) {
                handleGameOver(score + pointsDelta, maxCombo);
              }
              return Math.max(0, nextLives);
            });
          }

          setScore((s) => Math.max(0, s + pointsDelta));

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
            wpm: 60,
            accuracy: 95,
          });

          // Remove packet from active list
          setActivePackets((prev) => prev.filter((p) => p.id !== target?.id));
          setActiveTargetId(null);
          setCurrentInput("");
        }
      } else {
        // Mistype on active target: reset current target focus
        setCurrentInput("");
        setActiveTargetId(null);
      }
    },
    [activePackets, activeTargetId, combo, currentInput, gameStatus, handleGameOver, maxCombo, score]
  );

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        setCurrentInput((prev) => prev.slice(0, -1));
        return;
      }
      if (e.key === "Escape") {
        setActiveTargetId(null);
        setCurrentInput("");
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        processKey(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [processKey]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto h-[680px] rounded-xl border border-border/80 bg-card/90 overflow-hidden shadow-2xl flex flex-col font-mono select-none"
    >
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 scanlines z-30 pointer-events-none" />

      {/* Top HUD Telemetry Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-secondary/40 backdrop-blur-sm z-20">
        <div className="flex items-center gap-6">
          {/* Score */}
          <div>
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">
              SCORE
            </div>
            <div className="text-2xl font-black text-primary glow-text">
              {score.toLocaleString()}
            </div>
          </div>

          {/* Combo Multiplier */}
          <div className="hidden sm:block">
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">
              COMBO
            </div>
            <div className="text-xl font-bold text-amber-400 flex items-center gap-1">
              <Flame className="h-4 w-4" />
              {combo}x
            </div>
          </div>

          {/* Shields / Health */}
          <div>
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">
              FIREWALL INTEGRITY
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {[1, 2, 3].map((idx) => (
                <Shield
                  key={idx}
                  className={`h-5 w-5 transition-all ${
                    idx <= lives
                      ? "text-primary fill-primary/30"
                      : "text-muted-foreground/30 fill-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center: Mode & Difficulty */}
        <div className="hidden md:flex flex-col items-center">
          <div className="text-[10px] font-bold tracking-widest text-primary uppercase">
            {mode.toUpperCase()} RUN // {difficulty.toUpperCase()}
          </div>
          <div className="text-xs text-muted-foreground">
            HUD MODE: {hudMode.toUpperCase()}
          </div>
        </div>

        {/* Right side: Timer & Sound toggle */}
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase text-right">
              {mode === "classic" ? "TIME REMAINING" : "SURVIVAL TIME"}
            </div>
            <div className="text-2xl font-black text-foreground flex items-center justify-end gap-1.5">
              <Clock className="h-5 w-5 text-primary" />
              {mode === "classic"
                ? `${timeRemaining}s`
                : `${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60)
                    .toString()
                    .padStart(2, "0")}`}
            </div>
          </div>

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

      {/* Main Arcade Canvas Playfield */}
      <div className="relative flex-1 bg-black/60 overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 terminal-grid opacity-40 pointer-events-none" />

        {/* Bottom Escape Firewall Warning Line */}
        <div className="absolute bottom-6 left-0 right-0 h-1 bg-rose-500/40 border-t border-rose-500/80 z-10 flex items-center justify-center">
          <span className="text-[9px] font-mono tracking-widest text-rose-400 bg-black/90 px-3 py-0.5 rounded border border-rose-500/40 uppercase">
            [ BOTTOM FIREWALL - DECAY THRESHOLD ]
          </span>
        </div>

        {/* Game Ready / Launcher Overlay */}
        {gameStatus === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 backdrop-blur-md z-40 p-6 text-center">
            <Zap className="h-16 w-16 text-primary animate-pulse mb-4" />
            <h2 className="text-3xl font-black text-foreground tracking-wider">
              DATA STREAM READY
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Mode: <span className="text-foreground font-bold">{mode.toUpperCase()}</span> | Difficulty:{" "}
              <span className="text-foreground font-bold">{difficulty.toUpperCase()}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-md">
              Type falling packet codes to intercept clean payloads. Beware of high corruption probabilities!
            </p>

            <button
              onClick={initializeRun}
              className="mt-8 bg-primary text-primary-foreground font-black px-8 py-3 rounded-lg text-base hover:opacity-90 transition-all glow-primary font-mono tracking-widest"
            >
              INITIALIZE RUN [ENTER]
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameStatus === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-40 p-6 text-center">
            <AlertTriangle className="h-14 w-14 text-rose-500 mb-3 animate-bounce" />
            <h2 className="text-3xl font-black text-rose-500 tracking-wider">
              TERMINAL SHUTDOWN
            </h2>
            <div className="mt-4 p-4 rounded-xl bg-secondary/40 border border-border/80 max-w-sm w-full">
              <div className="text-xs text-muted-foreground">FINAL SCORE</div>
              <div className="text-4xl font-black text-primary glow-text mt-1">
                {score.toLocaleString()}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono text-muted-foreground">
                <div className="p-2 rounded bg-card/60">
                  MAX COMBO: <span className="text-foreground font-bold">{maxCombo}x</span>
                </div>
                <div className="p-2 rounded bg-card/60">
                  PACKETS: <span className="text-foreground font-bold">{runDataRef.current.events.length}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={initializeRun}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-lg text-sm hover:opacity-90 transition-all glow-primary font-mono"
              >
                <RotateCcw className="h-4 w-4" />
                PLAY AGAIN
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-medium px-5 py-2.5 rounded-lg text-sm border border-border transition-all font-mono"
              >
                <BarChart2 className="h-4 w-4 text-primary" />
                DATA SCIENCE TELEMETRY
              </button>
            </div>
          </div>
        )}

        {/* Falling Packets */}
        {gameStatus === "playing" &&
          activePackets.map((pkt) => {
            const isTarget = activeTargetId === pkt.id;
            // Calculate progress downwards: durationRemaining / originalDuration
            const totalDuration =
              difficulty === "easy" ? 11 : difficulty === "medium" ? 8.5 : 6.5;
            const progress = Math.max(0, Math.min(1, 1 - pkt.durationSeconds / totalDuration));
            const topY = progress * 480 + 20; // 20px to 500px

            // Risk indicator colors
            const riskBorder =
              pkt.riskRating === "low"
                ? "border-emerald-500/60 bg-emerald-950/20"
                : pkt.riskRating === "medium"
                ? "border-amber-500/60 bg-amber-950/20"
                : pkt.riskRating === "high"
                ? "border-orange-500/60 bg-orange-950/20"
                : "border-rose-500/60 bg-rose-950/20";

            return (
              <div
                key={pkt.id}
                onClick={() => {
                  setActiveTargetId(pkt.id);
                  setCurrentInput("");
                }}
                style={{ top: `${topY}px`, left: "50%", transform: "translateX(-50%)" }}
                className={`absolute w-80 rounded-lg border p-3 backdrop-blur-md cursor-pointer transition-all duration-75 shadow-lg ${riskBorder} ${
                  isTarget ? "ring-2 ring-primary scale-105 z-20 glow-primary" : "opacity-90 z-10"
                }`}
              >
                {/* Header: Reward & Risk Probability */}
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-emerald-400">+{pkt.reward} PTS</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      pkt.riskRating === "low"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : pkt.riskRating === "medium"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    Risk: {Math.round(pkt.corruptionProbability * 100)}%
                  </span>
                </div>

                {/* Packet Code to Type */}
                <div className="text-center font-mono text-xl font-black tracking-widest my-1 py-1 rounded bg-black/50 border border-border/40">
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

                {/* Analytical HUD Level */}
                {hudMode === "analytical" && (
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono mt-1 pt-1 border-t border-border/30 text-muted-foreground">
                    <div>
                      EV:{" "}
                      <span
                        className={`font-bold ${
                          pkt.expectedValue >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {pkt.expectedValue > 0 ? `+${pkt.expectedValue}` : pkt.expectedValue}
                      </span>
                    </div>
                    <div className="text-right">
                      VPS:{" "}
                      <span className="text-primary font-bold">
                        {pkt.valuePerSecond}/s
                      </span>
                    </div>
                  </div>
                )}

                {/* Decay progress bar */}
                <div className="w-full bg-secondary/60 h-1 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-primary transition-all duration-75"
                    style={{ width: `${(pkt.durationSeconds / totalDuration) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* Bottom Mobile / Keyboard Assist Input Bar */}
      <div className="px-6 py-2.5 border-t border-border/60 bg-secondary/30 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>KEYBOARD INTERFACE:</span>
          {activeTargetId ? (
            <span className="font-mono text-primary font-bold">
              TARGET LOCKED: [{currentInput}_]
            </span>
          ) : (
            <span className="font-mono text-muted-foreground">
              READY // TYPE ANY PACKET FIRST CHARACTER
            </span>
          )}
        </div>

        {/* Mobile touch hidden input so mobile keyboard appears */}
        <input
          ref={inputRef}
          type="text"
          className="opacity-0 absolute -z-10 h-0 w-0"
          onChange={(e) => {
            const val = e.target.value;
            if (val.length > 0) {
              processKey(val.charAt(val.length - 1));
              e.target.value = "";
            }
          }}
        />

        <button
          onClick={() => {
            if (inputRef.current) inputRef.current.focus();
          }}
          className="sm:hidden text-xs px-2.5 py-1 rounded bg-primary/20 text-primary border border-primary/40 font-mono"
        >
          OPEN KEYPAD
        </button>
      </div>
    </div>
  );
}

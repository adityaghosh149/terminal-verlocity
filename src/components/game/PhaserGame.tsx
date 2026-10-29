"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import { useSessionStore } from "@/store/useSessionStore";
import { ProbabilityEngine, SeededRandom } from "@/lib/probability/engine";
import { soundEngine } from "@/lib/audio/soundEngine";
import { PacketDefinition, PacketEvent, GameRunResult } from "@/types";

import {
  FloatingFeedback,
  getComboMultiplier,
  LANES,
  PhaserGameProps,
} from "./types";
import { GameHud } from "./GameHud";
import { PacketCard } from "./PacketCard";
import { GameReadyOverlay } from "./GameReadyOverlay";
import { GameOverModal } from "./GameOverModal";
import { GameBottomBar } from "./GameBottomBar";

export function PhaserGame({ mode, difficulty, onGameOver }: PhaserGameProps) {
  const router = useRouter();
  const { soundEnabled, setSoundEnabled, screenShake, setLastRunResult } = useGameStore();
  const { username, openCallsignModal } = useSessionStore();
  const usernameRef = useRef(username);
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

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

  // Floating score and damage indicators
  const [feedbacks, setFeedbacks] = useState<FloatingFeedback[]>([]);
  const [isShaking, setIsShaking] = useState(false);

  // Tactical Emergency EMP Defuser ability (Starts with 1, recharges at 10x combo)
  const [empCharges, setEmpCharges] = useState(1);
  const empChargesRef = useRef(1);
  empChargesRef.current = empCharges;
  const [empActive, setEmpActive] = useState(false);

  // Audio-reactive rhythm grid pulse state
  const [gridPulse, setGridPulse] = useState(false);

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

  // Synchronized state refs for zero-latency keystroke processing
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

  // Tactical Emergency EMP Defusal Ability: Vaporizes lowest imminent threat packet without shield penalty
  const triggerEmp = useCallback(() => {
    if (gameStatusRef.current !== "playing" || empChargesRef.current <= 0) return;

    // Decrement charge
    const newCharges = empChargesRef.current - 1;
    empChargesRef.current = newCharges;
    setEmpCharges(newCharges);

    // Audio & Shockwave FX
    soundEngine.playEmpBlast();
    setEmpActive(true);
    setTimeout(() => setEmpActive(false), 650);

    const packets = activePacketsRef.current;
    if (packets.length === 0) return;

    // Find the packet closest to the defense line (least duration remaining)
    const sorted = [...packets].sort((a, b) => a.durationSeconds - b.durationSeconds);
    const targetPkt = sorted[0];

    // Clear active target if player was currently locked onto this packet
    if (activeTargetIdRef.current === targetPkt.id) {
      activeTargetIdRef.current = null;
      currentInputRef.current = "";
      setActiveTargetId(null);
      setCurrentInput("");
    }

    // Award 50% reward points as partial tactical bypass
    const defusedPoints = Math.round(targetPkt.reward * 0.5);
    const newScore = scoreRef.current + defusedPoints;
    scoreRef.current = newScore;
    setScore(newScore);

    // Record clean packet event
    runDataRef.current.events.push({
      packetId: targetPkt.id,
      code: targetPkt.code,
      reward: targetPkt.reward,
      corruptionProbability: targetPkt.corruptionProbability,
      corruptionPenalty: targetPkt.corruptionPenalty,
      expectedValue: targetPkt.expectedValue,
      action: "intercepted",
      outcome: "clean",
      timestampMs: Date.now() - runDataRef.current.startTime,
      pointsDelta: defusedPoints,
      wpm: 60,
      accuracy: 100,
    });

    addFeedback(`⚡ DEFUSED! +${defusedPoints} PTS`, "clean", targetPkt.laneIndex, 300);

    // Remove defused packet from playfield
    const remaining = packets.filter((p) => p.id !== targetPkt.id);
    activePacketsRef.current = remaining;
    setActivePackets(remaining);
  }, [addFeedback]);

  // Initialize Game Run Session with Server
  const initializeRun = useCallback(async () => {
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, difficulty, username: usernameRef.current || "OPERATIVE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const rng = new SeededRandom(data.seed);
      const now = Date.now();

      // Immediately generate an initial wave with guaranteed safe starter and unique initial letters
      const initialPackets: PacketDefinition[] = [];
      const waveCount = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
      for (let i = 0; i < waveCount; i++) {
        const usedInitials = initialPackets.map((p) => p.code.charAt(0));
        // Guarantee packet 0 is 100% Safe (0 shield risk), and subsequent packets safe/caution
        const forcedTier = i === 0 ? "safe" : i === 1 ? "caution" : undefined;
        const pkt = ProbabilityEngine.generatePacket(
          `pkt_${i + 1}`,
          difficulty,
          rng,
          now - i * 400,
          i % 4,
          usedInitials,
          forcedTier
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
      setLives(5);
      livesRef.current = 5;
      setCombo(0);
      comboRef.current = 0;
      setMaxCombo(0);
      maxComboRef.current = 0;
      setEmpCharges(1);
      empChargesRef.current = 1;
      setEmpActive(false);
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
          ? Math.round(run.keystrokesCorrect / 5 / (durationSeconds / 60))
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
            username: usernameRef.current || "OPERATIVE",
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

          // Unique initial letters: prevent two words starting with the same letter from spawning
          const activeInitials = current.map((p) => p.code.charAt(0));

          // Guaranteed Safe Stream: ensure at least one 🟢 SAFE packet is ALWAYS active on screen!
          const hasSafe = current.some((p) => p.corruptionProbability < 0.25);
          const dangerCount = current.filter((p) => p.corruptionProbability >= 0.50).length;

          let forcedTier: "safe" | "caution" | "danger" | undefined = undefined;
          if (!hasSafe) {
            forcedTier = "safe";
          } else if (dangerCount >= 1) {
            // Cap at 1 danger packet so player is never trapped with multiple high-risk words
            forcedTier = runDataRef.current.rng.next() > 0.4 ? "safe" : "caution";
          }

          const newPkt = ProbabilityEngine.generatePacket(
            `pkt_${runDataRef.current.packetCounter}`,
            difficulty,
            runDataRef.current.rng,
            now,
            lane,
            activeInitials,
            forcedTier
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
  }, [
    addFeedback,
    difficulty,
    gameStatus,
    getOptimalLane,
    handleGameOver,
    maxCombo,
    mode,
    score,
    triggerShake,
  ]);

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
          setGridPulse(true);
          setTimeout(() => setGridPulse(false), 90);
          return;
        } else {
          // Mistype
          return;
        }
      }

      // If we already have a target, check next expected character
      let resolvedTarget = target;
      let nextInput = "";

      const expectedNext = target.code.charAt(curInput.length);
      if (upperChar === expectedNext) {
        nextInput = curInput + upperChar;
      } else {
        // Disambiguation: check if typing matches another active packet starting with curInput + upperChar
        const prefixAttempt = curInput + upperChar;
        const alt = packets.find((p) => p.code.startsWith(prefixAttempt));
        if (alt) {
          resolvedTarget = alt;
          activeTargetIdRef.current = alt.id;
          setActiveTargetId(alt.id);
          nextInput = prefixAttempt;
        } else {
          // Mistype on active target: reset current target focus
          currentInputRef.current = "";
          setCurrentInput("");
          activeTargetIdRef.current = null;
          setActiveTargetId(null);
          return;
        }
      }

      currentInputRef.current = nextInput;
      setCurrentInput(nextInput);
      runDataRef.current.keystrokesCorrect += 1;
      setGridPulse(true);
      setTimeout(() => setGridPulse(false), 90);

      // Completed packet!
      if (nextInput === resolvedTarget.code) {
        // Resolve packet outcome strictly using probability model
        const { outcome } = ProbabilityEngine.sampleOutcome(
          resolvedTarget.corruptionProbability,
          runDataRef.current.rng
        );

        let pointsDelta = 0;
        const currentCombo = comboRef.current;
        const comboMultiplier = getComboMultiplier(currentCombo);

        if (outcome === "clean") {
          pointsDelta = resolvedTarget.reward * comboMultiplier;
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
          if (nextCombo === 10) {
            empChargesRef.current += 1;
            setEmpCharges((c) => c + 1);
            addFeedback("⚡ EMP RESTORED!", "clean", 1, 180);
          }
          addFeedback(
            `+${pointsDelta} PTS (${comboMultiplier}x)`,
            "clean",
            resolvedTarget.laneIndex,
            250
          );
        } else {
          // Corrupted packet!
          pointsDelta = -resolvedTarget.corruptionPenalty;
          soundEngine.playCorruptedGlitch();
          triggerShake();
          comboRef.current = 0;
          setCombo(0);

          // FAIR SHIELD RULE:
          // 🟢 SAFE (< 0.25) and 🟡 CAUTION (0.25 - 0.49) packets NEVER COST A SHIELD on corruption!
          // Only 🔴 DANGER (>= 0.50) packets carry a shield risk if corrupted.
          const isDanger = resolvedTarget.corruptionProbability >= 0.50;
          let lostShield = false;

          if (isDanger) {
            if (livesRef.current > 1) {
              lostShield = true;
              const nextLives = livesRef.current - 1;
              livesRef.current = nextLives;
              setLives(nextLives);
            } else {
              // Emergency Shield Deflection at 1 life: spares elimination, increases point penalty
              pointsDelta = Math.round(pointsDelta * 1.5);
              addFeedback("DEFLECTED! SHIELD SAVED", "corrupted", resolvedTarget.laneIndex, 220);
            }
          }

          if (lostShield) {
            addFeedback(
              `${pointsDelta} PTS [-1 SHIELD]`,
              "corrupted",
              resolvedTarget.laneIndex,
              250
            );
            if (livesRef.current <= 0) {
              handleGameOver(scoreRef.current + pointsDelta, maxComboRef.current);
            }
          } else {
            addFeedback(
              `${pointsDelta} PTS [CORRUPTED]`,
              "corrupted",
              resolvedTarget.laneIndex,
              250
            );
          }
        }

        const newScore = Math.max(0, scoreRef.current + pointsDelta);
        scoreRef.current = newScore;
        setScore(newScore);

        // Log packet event
        runDataRef.current.events.push({
          packetId: resolvedTarget.id,
          code: resolvedTarget.code,
          reward: resolvedTarget.reward,
          corruptionProbability: resolvedTarget.corruptionProbability,
          corruptionPenalty: resolvedTarget.corruptionPenalty,
          expectedValue: resolvedTarget.expectedValue,
          action: "intercepted",
          outcome,
          timestampMs: Date.now() - runDataRef.current.startTime,
          pointsDelta,
          wpm: 65,
          accuracy: 96,
        });

        // Remove packet from active list
        const remaining = packets.filter((p) => p.id !== resolvedTarget?.id);
        activePacketsRef.current = remaining;
        setActivePackets(remaining);

        activeTargetIdRef.current = null;
        setActiveTargetId(null);
        currentInputRef.current = "";
        setCurrentInput("");
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
      // Ignore if user is typing in a form input outside the game
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // If in ready or gameover state, Space or Enter starts / restarts immediately
      if (
        (gameStatusRef.current === "ready" || gameStatusRef.current === "gameover") &&
        (e.key === " " || e.key === "Enter")
      ) {
        e.preventDefault();
        if (!usernameRef.current) {
          openCallsignModal();
          return;
        }
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
        if (!usernameRef.current) {
          openCallsignModal();
          return;
        }
        initializeRun().then(() => {
          processKey(e.key);
          setTimeout(() => {
            containerRef.current?.focus();
          }, 10);
        });
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        triggerEmp();
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
  }, [initializeRun, processKey, triggerEmp]);

  const totalDuration = difficulty === "easy" ? 11 : difficulty === "medium" ? 8.5 : 6.5;

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
      <GameHud
        score={score}
        combo={combo}
        lives={lives}
        mode={mode}
        difficulty={difficulty}
        timeRemaining={timeRemaining}
        elapsedSeconds={elapsedSeconds}
        soundEnabled={soundEnabled}
        onRestart={handleRestart}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Main Arcade Canvas Playfield (4 Lanes) */}
      <div className="relative flex-1 bg-black/75 overflow-hidden">
        {/* Audio-reactive subtle grid lines & 4 lane guides */}
        <div
          className={`absolute inset-0 terminal-grid pointer-events-none transition-all duration-150 ${
            gridPulse
              ? "opacity-60 scale-[1.003]"
              : combo >= 6
              ? "opacity-45"
              : "opacity-30"
          }`}
        />

        {/* EMP Blast Shockwave Ring Effect */}
        {empActive && (
          <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-primary bg-primary/10 pointer-events-none z-30 animate-emp-shockwave shadow-[0_0_80px_hsl(var(--primary))]" />
        )}

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
          <GameReadyOverlay
            mode={mode}
            difficulty={difficulty}
            onStart={() => {
              initializeRun();
              setTimeout(() => {
                containerRef.current?.focus();
              }, 10);
            }}
          />
        )}

        {/* Game Over Overlay */}
        {gameStatus === "gameover" && (
          <GameOverModal
            score={score}
            maxCombo={maxCombo}
            events={runDataRef.current.events}
            onPlayAgain={() => {
              initializeRun();
              setTimeout(() => {
                containerRef.current?.focus();
              }, 10);
            }}
            onViewAnalytics={() => router.push("/dashboard")}
          />
        )}

        {/* 4 Multi-Lane Descending Packets */}
        {gameStatus === "playing" &&
          activePackets.map((pkt) => (
            <PacketCard
              key={pkt.id}
              packet={pkt}
              isTarget={activeTargetId === pkt.id}
              currentInput={currentInput}
              totalDuration={totalDuration}
              onClick={() => {
                setActiveTargetId(pkt.id);
                activeTargetIdRef.current = pkt.id;
                setCurrentInput("");
                currentInputRef.current = "";
              }}
            />
          ))}
      </div>

      {/* Bottom Keyboard Telemetry & Assist Bar */}
      <GameBottomBar
        activeTargetId={activeTargetId}
        currentInput={currentInput}
        empCharges={empCharges}
        gameStatus={gameStatus}
        onTriggerEmp={triggerEmp}
        onProcessKey={processKey}
      />
    </div>
  );
}

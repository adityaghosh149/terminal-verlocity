"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import { useSessionStore } from "@/store/useSessionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ProbabilityEngine, SeededRandom } from "@/lib/probability/engine";
import { soundEngine } from "@/lib/audio/soundEngine";
import { round2 } from "@/lib/utils";
import { PacketDefinition, PacketEvent, GameRunResult, WordPackType } from "@/types";

import {
  FloatingFeedback,
  getComboMultiplier,
  getSpeedBonusPercent,
  LANES,
  PhaserGameProps,
} from "./types";
import { GameHud } from "./GameHud";
import { PacketCard } from "./PacketCard";
import { GameReadyOverlay } from "./GameReadyOverlay";
import { GamePauseOverlay } from "./GamePauseOverlay";
import { GameOverModal } from "./GameOverModal";
import { GameBottomBar } from "./GameBottomBar";

export function PhaserGame({ mode, difficulty, onGameOver }: PhaserGameProps) {
  const router = useRouter();
  const { soundEnabled, setSoundEnabled, screenShake, setLastRunResult, lastRunResult } = useGameStore();
  const { username } = useSessionStore();
  const { user, openAuthModal } = useAuthStore();
  const effectiveUsername = user?.username || username;
  const usernameRef = useRef(effectiveUsername);
  useEffect(() => {
    usernameRef.current = effectiveUsername;
  }, [effectiveUsername]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Live game telemetry state
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(mode === "classic" ? 90 : 0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<"ready" | "playing" | "paused" | "gameover">("ready");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playfieldRef = useRef<HTMLDivElement>(null);
  const [playfieldHeight, setPlayfieldHeight] = useState<number>(550);

  useEffect(() => {
    const updatePlayfieldHeight = () => {
      if (playfieldRef.current) {
        const h = playfieldRef.current.clientHeight;
        if (h > 100) setPlayfieldHeight(h);
      }
    };
    updatePlayfieldHeight();
    window.addEventListener("resize", updatePlayfieldHeight);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && playfieldRef.current) {
      ro = new ResizeObserver(() => updatePlayfieldHeight());
      ro.observe(playfieldRef.current);
    }
    return () => {
      window.removeEventListener("resize", updatePlayfieldHeight);
      ro?.disconnect();
    };
  }, [isFullscreen]);

  // Fullscreen Mode Toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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

  const [wordPack, setWordPack] = useState<WordPackType>("core");
  const wordPackRef = useRef<WordPackType>("core");
  wordPackRef.current = wordPack;

  const [slowMoActive, setSlowMoActive] = useState(false);
  const slowMoActiveRef = useRef(false);
  slowMoActiveRef.current = slowMoActive;
  const slowMoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pausedAtRef = useRef<number>(0);
  const targetStartTimeRef = useRef<number>(Date.now());

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
    recentWords: string[];
    typoMap: Record<string, number>;
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
    recentWords: [],
    typoMap: {},
  });

  // Spawn helper: intelligently selects lane adhering to user rules:
  // 1. Max 2 words per lane at any time.
  // 2. Prioritize empty lanes. If all 4 are empty, pick any uniformly at random.
  // 3. If multiple lanes are empty (e.g. 2 empty), pick uniformly at random among them (never hardcoded to first lane).
  const getOptimalLane = useCallback((packets: PacketDefinition[]): number => {
    const laneCounts = [0, 0, 0, 0];
    for (const pkt of packets) {
      if (pkt.laneIndex >= 0 && pkt.laneIndex < 4) {
        laneCounts[pkt.laneIndex]++;
      }
    }

    // Filter lanes that have fewer than 2 active words
    const lanesUnderLimit = [0, 1, 2, 3].filter((l) => laneCounts[l] < 2);
    const candidatePool = lanesUnderLimit.length > 0 ? lanesUnderLimit : [0, 1, 2, 3];

    // Find the minimum count among available candidates (e.g., 0 if any empty)
    const minCount = Math.min(...candidatePool.map((l) => laneCounts[l]));
    const leastPopulatedLanes = candidatePool.filter((l) => laneCounts[l] === minCount);

    // Pick uniformly at random among the least populated lanes
    const chosenIndex = Math.floor(Math.random() * leastPopulatedLanes.length);
    return leastPopulatedLanes[chosenIndex];
  }, []);

  // Toggle Pause / Resume
  const togglePause = useCallback(() => {
    if (gameStatusRef.current === "playing") {
      pausedAtRef.current = Date.now();
      setGameStatus("paused");
      gameStatusRef.current = "paused";
      soundEngine.stopSynthwave();
    } else if (gameStatusRef.current === "paused") {
      const pauseDuration = Date.now() - (pausedAtRef.current || Date.now());
      runDataRef.current.startTime += pauseDuration;
      runDataRef.current.lastSpawnTime += pauseDuration;
      setGameStatus("playing");
      gameStatusRef.current = "playing";
      soundEngine.updateSynthwaveLayer(comboRef.current);
      setTimeout(() => {
        containerRef.current?.focus();
      }, 10);
    }
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
    const defusedPoints = round2(targetPkt.reward * 0.5);
    const newScore = round2(scoreRef.current + defusedPoints);
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
      pureTypingPoints: defusedPoints,
      multiplierPoints: 0,
      speedBonusPoints: 0,
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
        body: JSON.stringify({ mode, difficulty, username: usernameRef.current || "PLAYER" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const rng = new SeededRandom(data.seed);
      const now = Date.now();

      // Immediately generate an initial wave with guaranteed safe starter and unique initial letters
      const initialPackets: PacketDefinition[] = [];
      const waveCount = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
      const initialRecentWords: string[] = [];
      for (let i = 0; i < waveCount; i++) {
        const usedInitials = initialPackets.map((p) => p.code.charAt(0));
        const usedWords = [...initialPackets.map((p) => p.code), ...initialRecentWords];
        // Guarantee packet 0 is 100% Safe (0 shield risk), and subsequent packets safe/caution
        const forcedTier = i === 0 ? "safe" : i === 1 ? "caution" : undefined;
        const lane = getOptimalLane(initialPackets);
        const pkt = ProbabilityEngine.generatePacket(
          `pkt_${i + 1}`,
          difficulty,
          rng,
          now - i * 400,
          lane,
          usedInitials,
          forcedTier,
          usedWords,
          {
            wordPack: wordPackRef.current,
            playerLives: 5,
          }
        );
        // Stagger initial progress slightly for natural flow
        pkt.durationSeconds -= i * 0.8;
        initialPackets.push(pkt);
        initialRecentWords.push(pkt.code);
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
        recentWords: initialRecentWords,
        typoMap: {},
      };

      soundEngine.updateSynthwaveLayer(0);
      slowMoActiveRef.current = false;
      setSlowMoActive(false);

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
  }, [mode, difficulty, getOptimalLane]);

  // Handle immediate restart
  const handleRestart = useCallback(() => {
    soundEngine.stopSynthwave();
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
      const durationSeconds = round2(Math.max(1, (endTime - run.startTime) / 1000));

      const wpm =
        run.keystrokesCorrect > 0
          ? round2(run.keystrokesCorrect / 5 / (durationSeconds / 60))
          : 0;
      const accuracy =
        run.keystrokesTotal > 0
          ? round2((run.keystrokesCorrect / run.keystrokesTotal) * 100)
          : 100;

      let pureTypingTotal = 0;
      let multiplierTotal = 0;
      let speedBonusTotal = 0;
      let expectedTotal = 0;

      for (const e of run.events) {
        if (e.action === "intercepted") {
          expectedTotal += (e.expectedValue || 0);
          const pure = e.pureTypingPoints !== undefined
            ? e.pureTypingPoints
            : (e.outcome === "clean" ? e.reward : -e.corruptionPenalty);
          pureTypingTotal += pure;
          multiplierTotal += (e.multiplierPoints || 0);
          speedBonusTotal += (e.speedBonusPoints || 0);
        } else if (e.action === "missed") {
          pureTypingTotal += (e.pointsDelta || 0);
        }
      }

      expectedTotal = round2(expectedTotal);
      const rawTypingScore = round2(pureTypingTotal);
      multiplierTotal = round2(multiplierTotal);
      speedBonusTotal = round2(speedBonusTotal);

      // Accuracy Penalty: (2 * (100 - accuracy))% on true typing score
      const errorRate = Math.max(0, 100 - accuracy);
      const accuracyPenaltyPct = round2(Math.min(100, 2 * errorRate));
      const accuracyPenaltyScore = round2(Math.max(0, rawTypingScore * (accuracyPenaltyPct / 100)));
      const netPureTyping = round2(rawTypingScore - accuracyPenaltyScore);

      // Final score reflects net pure typing after accuracy penalty
      const calculatedFinalScore = round2(Math.max(0, netPureTyping + multiplierTotal + speedBonusTotal));
      setScore(calculatedFinalScore);
      scoreRef.current = calculatedFinalScore;

      // Luck score: strictly computed using expected EV and net pure typing score, NOT total score
      const luckScore = round2(netPureTyping - expectedTotal);

      soundEngine.stopSynthwave();

      const runResult: GameRunResult = {
        runId: run.runId,
        mode,
        difficulty,
        seed: run.seed,
        startTime: run.startTime,
        endTime,
        durationSeconds,
        finalScore: calculatedFinalScore,
        actualTypingScore: netPureTyping,
        rawTypingScore,
        accuracyPenaltyPct,
        accuracyPenaltyScore,
        multiplierScore: multiplierTotal,
        speedBonusScore: speedBonusTotal,
        expectedScore: expectedTotal,
        luckScore,
        wpm,
        accuracy,
        totalPacketsSpawned: run.packetCounter,
        packetsCaptured: run.events.filter((e) => e.action === "intercepted").length,
        cleanCount: run.events.filter((e) => e.outcome === "clean").length,
        corruptedCount: run.events.filter((e) => e.outcome === "corrupted").length,
        missedCount: run.events.filter((e) => e.action === "missed").length,
        ignoredCount: run.events.filter((e) => e.action === "ignored").length,
        totalExpectedValue: expectedTotal,
        totalRealizedScore: calculatedFinalScore,
        maxCombo: maxComboVal,
        events: run.events,
        status: "validated",
        typoMap: run.typoMap || {},
        wordPack: wordPackRef.current,
      };

      setLastRunResult(runResult);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tv_last_run_typos", JSON.stringify(run.typoMap || {}));
        } catch {}
      }
      if (onGameOver) onGameOver(runResult);

      // Submit to server
      setIsSubmitting(true);
      try {
        await fetch("/api/game/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runToken: run.runToken,
            finalScore: calculatedFinalScore,
            actualTypingScore: netPureTyping,
            rawTypingScore,
            accuracyPenaltyPct,
            accuracyPenaltyScore,
            multiplierScore: multiplierTotal,
            speedBonusScore: speedBonusTotal,
            expectedScore: expectedTotal,
            luckScore,
            wpm,
            accuracy,
            maxCombo: maxComboVal,
            events: run.events,
            endTime,
            username: usernameRef.current || "Player",
            typoMap: run.typoMap || {},
            wordPack: wordPackRef.current,
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
              handleGameOver(scoreRef.current, maxComboRef.current);
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
      const elapsedSec = Math.max(0, (now - runDataRef.current.startTime) / 1000);

      // Speed scaling: keep base falling speed consistent with difficulty at start,
      // but progressively accelerate with elapsed time and score!
      // Decryption Overclock (Matrix Slow-Mo): drops velocity by 50% for 5s
      const speedMult = Math.min(2.4, 1.0 + elapsedSec * 0.005 + scoreRef.current * 0.00003);
      const effectiveDt = (slowMoActiveRef.current ? dt * 0.5 : dt) * speedMult;

      setActivePackets((prev) => {
        let current = [...prev];

        // Responsive spawn cadence: if the playfield has < 2 packets, refill immediately (75ms).
        // Typists are never limited by slow spawn rates.
        const minSpawnDelay =
          current.length < 2
            ? 75
            : difficulty === "easy"
            ? 420
            : difficulty === "medium"
            ? 320
            : 220;

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

          const activeWords = current.map((p) => p.code);
          const allExcludedWords = [
            ...activeWords,
            ...(runDataRef.current.recentWords || []),
          ];

          const hasShieldOnScreen = current.some((p) => p.specialType === "shield");
          const newPkt = ProbabilityEngine.generatePacket(
            `pkt_${runDataRef.current.packetCounter}`,
            difficulty,
            runDataRef.current.rng,
            now,
            lane,
            activeInitials,
            forcedTier,
            allExcludedWords,
            {
              wordPack: wordPackRef.current,
              playerLives: livesRef.current,
              hasShieldOnScreen,
            }
          );
          current.push(newPkt);

          // Maintain recent words history (sliding window of 50 words) to prevent repetition
          if (!runDataRef.current.recentWords) runDataRef.current.recentWords = [];
          runDataRef.current.recentWords.push(newPkt.code);
          if (runDataRef.current.recentWords.length > 50) {
            runDataRef.current.recentWords.shift();
          }
        }

        // 3. Move packets downwards with progressive effectiveDt
        const next: PacketDefinition[] = [];
        let escapedCount = 0;
        const escapedLanes: number[] = [];

        for (const pkt of current) {
          const newDur = pkt.durationSeconds - effectiveDt;
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
              pointsDelta: -round2(pkt.reward * 0.3),
              pureTypingPoints: -round2(pkt.reward * 0.3),
              multiplierPoints: 0,
              speedBonusPoints: 0,
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
            addFeedback("LOST! -1 SHIELD", "missed", l, Math.max(260, playfieldHeight - 80));
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
    mode,
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
          targetStartTimeRef.current = Date.now();
          currentInputRef.current = upperChar;
          setCurrentInput(upperChar);
          runDataRef.current.keystrokesCorrect += 1;
          setGridPulse(true);
          setTimeout(() => setGridPulse(false), 90);
          return;
        } else {
          // Log mistyped keystroke for interactive heatmap
          if (!runDataRef.current.typoMap) runDataRef.current.typoMap = {};
          runDataRef.current.typoMap[upperChar] = (runDataRef.current.typoMap[upperChar] || 0) + 1;
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
          targetStartTimeRef.current = Date.now();
          nextInput = prefixAttempt;
        } else {
          // Mistype on active target: log error and reset current target focus
          if (!runDataRef.current.typoMap) runDataRef.current.typoMap = {};
          runDataRef.current.typoMap[upperChar] = (runDataRef.current.typoMap[upperChar] || 0) + 1;
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

        // Calculate typing speed (WPM) on this packet to award Speed Bonus
        const typingDurationSec = Math.max(0.2, (Date.now() - targetStartTimeRef.current) / 1000);
        const wordLength = resolvedTarget.code.length;
        const packetWpm = Math.round((wordLength / 5) / (typingDurationSec / 60));
        const speedBonusPct = getSpeedBonusPercent(packetWpm);

        let pointsDelta = 0;
        let pureTypingPoints = 0;
        let multiplierPoints = 0;
        let speedBonusPoints = 0;
        const currentCombo = comboRef.current;
        const comboMultiplier = getComboMultiplier(currentCombo);

        if (outcome === "clean") {
          pureTypingPoints = resolvedTarget.reward;
          multiplierPoints = round2(resolvedTarget.reward * (comboMultiplier - 1));
          // Speed bonus is calculated strictly on the pure typing score
          speedBonusPoints = speedBonusPct > 0 ? round2(pureTypingPoints * (speedBonusPct / 100)) : 0;
          pointsDelta = round2(pureTypingPoints + multiplierPoints + speedBonusPoints);

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

          // Tactical Mechanic 1: Nanite Shield Recovery
          if (resolvedTarget.specialType === "shield") {
            if (livesRef.current < 5) {
              const nextLives = Math.min(5, livesRef.current + 1);
              livesRef.current = nextLives;
              setLives(nextLives);
              soundEngine.playShieldRestored();
              addFeedback("🛡️ +1 SHIELD RESTORED!", "clean", resolvedTarget.laneIndex, 280);
            }
          }

          // Tactical Mechanic 2: Golden High Roller Reward
          if (resolvedTarget.specialType === "high_roller") {
            addFeedback("🌟 3X HIGH ROLLER CASHED!", "clean", resolvedTarget.laneIndex, 300);
          }

          // Tactical Mechanic 3: Decryption Overclock (Matrix Slow-Mo 5s at streaks 15, 30, 45)
          if (nextCombo === 15 || nextCombo === 30 || nextCombo === 45) {
            slowMoActiveRef.current = true;
            setSlowMoActive(true);
            soundEngine.playSlowMoPulse();
            addFeedback("⏳ MATRIX SLOW-MO (5s)!", "clean", 1, 260);
            if (slowMoTimerRef.current) clearTimeout(slowMoTimerRef.current);
            slowMoTimerRef.current = setTimeout(() => {
              slowMoActiveRef.current = false;
              setSlowMoActive(false);
            }, 5000);
          }

          // Dynamic Layered Synthwave Audio: Escalate musical layers with streak
          soundEngine.updateSynthwaveLayer(nextCombo);

          const bonusTag = speedBonusPct > 0 ? ` (+${speedBonusPct}% SPD)` : "";
          addFeedback(
            `+${pointsDelta} PTS (${comboMultiplier}x${bonusTag})`,
            "clean",
            resolvedTarget.laneIndex,
            250
          );
        } else {
          // Corrupted packet!
          pointsDelta = -resolvedTarget.corruptionPenalty;
          pureTypingPoints = pointsDelta;
          multiplierPoints = 0;
          speedBonusPoints = 0;
          soundEngine.playCorruptedGlitch();
          triggerShake();
          comboRef.current = 0;
          setCombo(0);
          soundEngine.updateSynthwaveLayer(0);

          if (resolvedTarget.specialType === "high_roller") {
            addFeedback("💥 HIGH ROLLER GLITCH!", "corrupted", resolvedTarget.laneIndex, 300);
          }

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
              pointsDelta = round2(pointsDelta * 1.5);
              pureTypingPoints = pointsDelta;
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

        const newScore = Math.max(0, round2(scoreRef.current + pointsDelta));
        scoreRef.current = newScore;
        setScore(newScore);

        // Log packet event with detailed score decomposition
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
          pureTypingPoints,
          multiplierPoints,
          speedBonusPoints,
          wpm: packetWpm,
          accuracy: 96,
          specialType: resolvedTarget.specialType,
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
    return () => {
      soundEngine.stopSynthwave();
      if (slowMoTimerRef.current) clearTimeout(slowMoTimerRef.current);
    };
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

      // Immediate restart shortcuts anytime: Ctrl+Enter or F2
      if ((e.ctrlKey && e.key === "Enter") || e.key === "F2") {
        e.preventDefault();
        handleRestart();
        return;
      }

      // Pause toggle with Escape
      if (e.key === "Escape") {
        e.preventDefault();
        if (gameStatusRef.current === "playing" || gameStatusRef.current === "paused") {
          togglePause();
        }
        return;
      }

      // Fullscreen shortcut: F during ready/pause, or Alt+Enter
      if (
        (e.key.toLowerCase() === "f" && (gameStatusRef.current === "ready" || gameStatusRef.current === "paused")) ||
        (e.altKey && e.key === "Enter")
      ) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      // When paused: R restarts run, Space or Enter resumes
      if (gameStatusRef.current === "paused") {
        if (e.key.toLowerCase() === "r") {
          e.preventDefault();
          handleRestart();
          return;
        }
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          togglePause();
          return;
        }
        return;
      }

      // If in ready or gameover state, Space or Enter starts / restarts immediately
      if (
        (gameStatusRef.current === "ready" || gameStatusRef.current === "gameover") &&
        (e.key === " " || e.key === "Enter")
      ) {
        e.preventDefault();
        if (!usernameRef.current) {
          openAuthModal("login");
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
          openAuthModal("login");
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

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        processKey(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRestart, initializeRun, openAuthModal, processKey, toggleFullscreen, togglePause, triggerEmp]);

  const totalDuration = difficulty === "easy" ? 11 : difficulty === "medium" ? 8.5 : 6.5;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Terminal Velocity Arcade Playfield"
      className={`relative w-full ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen max-w-none rounded-none border-none bg-background"
          : "max-w-5xl mx-auto h-[690px] rounded-xl border border-primary/30 bg-card/95"
      } overflow-hidden shadow-2xl flex flex-col font-sans select-none focus:outline-none focus:ring-1 focus:ring-primary/50 ${
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
        isPaused={gameStatus === "paused"}
        isFullscreen={isFullscreen}
        onRestart={handleRestart}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onTogglePause={togglePause}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Main Arcade Canvas Playfield (4 Lanes) */}
      <div ref={playfieldRef} className="relative flex-1 bg-black/75 overflow-hidden">
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

        {/* Decryption Overclock Matrix Slow-Mo Banner */}
        {slowMoActive && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 font-mono text-xs font-black animate-pulse shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2 pointer-events-none">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            ⏳ DECRYPTION OVERCLOCK: MATRIX SLOW-MO 0.5X ACTIVE
          </div>
        )}

        {/* Ready / Start Overlay */}
        {gameStatus === "ready" && (
          <GameReadyOverlay
            mode={mode}
            difficulty={difficulty}
            wordPack={wordPack}
            onSelectWordPack={setWordPack}
            onStart={() => {
              initializeRun();
              setTimeout(() => {
                containerRef.current?.focus();
              }, 10);
            }}
          />
        )}

        {/* Pause Overlay */}
        {gameStatus === "paused" && (
          <GamePauseOverlay onResume={togglePause} onRestart={handleRestart} />
        )}

        {/* Game Over Overlay */}
        {gameStatus === "gameover" && (
          <GameOverModal
            score={score}
            maxCombo={maxCombo}
            events={runDataRef.current.events}
            accuracy={lastRunResult?.accuracy}
            rawTypingScore={lastRunResult?.rawTypingScore}
            accuracyPenaltyPct={lastRunResult?.accuracyPenaltyPct}
            accuracyPenaltyScore={lastRunResult?.accuracyPenaltyScore}
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
        {(gameStatus === "playing" || gameStatus === "paused") &&
          activePackets.map((pkt) => (
            <PacketCard
              key={pkt.id}
              packet={pkt}
              isTarget={activeTargetId === pkt.id}
              currentInput={currentInput}
              totalDuration={totalDuration}
              playfieldHeight={playfieldHeight}
              onClick={() => {
                if (gameStatus === "paused") return;
                setActiveTargetId(pkt.id);
                activeTargetIdRef.current = pkt.id;
                targetStartTimeRef.current = Date.now();
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

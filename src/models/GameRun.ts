import mongoose, { Schema, Document, Model } from "mongoose";
import { GameMode, Difficulty, PacketEvent } from "@/types";

export interface IGameRun extends Document {
  runId: string;
  username: string;
  userId?: mongoose.Types.ObjectId;
  guestId?: string;
  mode: GameMode;
  difficulty: Difficulty;
  seed: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  finalScore: number;
  actualTypingScore?: number;
  rawTypingScore?: number;
  accuracyPenaltyPct?: number;
  accuracyPenaltyScore?: number;
  multiplierScore?: number;
  speedBonusScore?: number;
  expectedScore?: number;
  luckScore?: number;
  wpm: number;
  accuracy: number;
  packetsCaptured: number;
  cleanCount: number;
  corruptedCount: number;
  missedCount: number;
  ignoredCount: number;
  totalExpectedValue: number;
  totalRealizedScore: number;
  maxCombo: number;
  status: "validated" | "rejected";
  validationReason?: string;
  typoMap?: Record<string, number>;
  wordPack?: string;
  events: PacketEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const GameRunSchema = new Schema<IGameRun>(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      default: "PLAYER",
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    guestId: {
      type: String,
      index: true,
    },
    mode: {
      type: String,
      enum: ["classic", "endless", "daily"],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      index: true,
    },
    seed: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationSeconds: {
      type: Number,
      required: true,
    },
    finalScore: {
      type: Number,
      required: true,
      index: true,
    },
    actualTypingScore: {
      type: Number,
      default: 0,
    },
    rawTypingScore: {
      type: Number,
      default: 0,
    },
    accuracyPenaltyPct: {
      type: Number,
      default: 0,
    },
    accuracyPenaltyScore: {
      type: Number,
      default: 0,
    },
    multiplierScore: {
      type: Number,
      default: 0,
    },
    speedBonusScore: {
      type: Number,
      default: 0,
    },
    expectedScore: {
      type: Number,
      default: 0,
    },
    luckScore: {
      type: Number,
      default: 0,
    },
    wpm: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      required: true,
    },
    packetsCaptured: {
      type: Number,
      default: 0,
    },
    cleanCount: {
      type: Number,
      default: 0,
    },
    corruptedCount: {
      type: Number,
      default: 0,
    },
    missedCount: {
      type: Number,
      default: 0,
    },
    ignoredCount: {
      type: Number,
      default: 0,
    },
    totalExpectedValue: {
      type: Number,
      default: 0,
    },
    totalRealizedScore: {
      type: Number,
      default: 0,
    },
    maxCombo: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["validated", "rejected"],
      default: "validated",
      index: true,
    },
    validationReason: {
      type: String,
    },
    typoMap: {
      type: Map,
      of: Number,
      default: {},
    },
    wordPack: {
      type: String,
      default: "core",
    },
    events: {
      type: [Object],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for global and mode/difficulty leaderboards
GameRunSchema.index({ status: 1, finalScore: -1 });
GameRunSchema.index({ status: 1, mode: 1, difficulty: 1, finalScore: -1 });
GameRunSchema.index({ status: 1, seed: 1, finalScore: -1 });
GameRunSchema.index({ username: 1, status: 1, createdAt: -1 });
GameRunSchema.index({ userId: 1, createdAt: -1 });

function roundToTwo(num: number | undefined | null): number | undefined {
  if (num === undefined || num === null || isNaN(num)) return undefined;
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

GameRunSchema.pre("save", function (next) {
  if (typeof this.finalScore === "number") this.finalScore = roundToTwo(this.finalScore)!;
  if (typeof this.actualTypingScore === "number") this.actualTypingScore = roundToTwo(this.actualTypingScore);
  if (typeof this.multiplierScore === "number") this.multiplierScore = roundToTwo(this.multiplierScore);
  if (typeof this.speedBonusScore === "number") this.speedBonusScore = roundToTwo(this.speedBonusScore);
  if (typeof this.expectedScore === "number") this.expectedScore = roundToTwo(this.expectedScore);
  if (typeof this.luckScore === "number") this.luckScore = roundToTwo(this.luckScore);
  if (typeof this.wpm === "number") this.wpm = roundToTwo(this.wpm)!;
  if (typeof this.accuracy === "number") this.accuracy = roundToTwo(this.accuracy)!;
  if (typeof this.durationSeconds === "number") this.durationSeconds = roundToTwo(this.durationSeconds)!;
  if (typeof this.totalExpectedValue === "number") this.totalExpectedValue = roundToTwo(this.totalExpectedValue)!;
  if (typeof this.totalRealizedScore === "number") this.totalRealizedScore = roundToTwo(this.totalRealizedScore)!;
  next();
});

export const GameRun: Model<IGameRun> =
  mongoose.models.GameRun || mongoose.model<IGameRun>("GameRun", GameRunSchema);

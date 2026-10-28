import mongoose, { Schema, Document, Model } from "mongoose";
import { GameMode, Difficulty, PacketEvent } from "@/types";

export interface IGameRun extends Document {
  runId: string;
  userId?: mongoose.Types.ObjectId;
  guestId?: string;
  mode: GameMode;
  difficulty: Difficulty;
  seed: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  finalScore: number;
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
GameRunSchema.index({ userId: 1, createdAt: -1 });

export const GameRun: Model<IGameRun> =
  mongoose.models.GameRun || mongoose.model<IGameRun>("GameRun", GameRunSchema);

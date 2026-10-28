import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  isVerified: boolean;
  level: number;
  xp: number;
  lifetimeScore: number;
  bestScore: number;
  gamesPlayed: number;
  packetsClean: number;
  packetsCorrupted: number;
  packetsMissed: number;
  bestWpm: number;
  avgAccuracy: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return password hashes in queries by default
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    level: {
      type: Number,
      default: 1,
    },
    xp: {
      type: Number,
      default: 0,
    },
    lifetimeScore: {
      type: Number,
      default: 0,
    },
    bestScore: {
      type: Number,
      default: 0,
      index: true,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    packetsClean: {
      type: Number,
      default: 0,
    },
    packetsCorrupted: {
      type: Number,
      default: 0,
    },
    packetsMissed: {
      type: Number,
      default: 0,
    },
    bestWpm: {
      type: Number,
      default: 0,
    },
    avgAccuracy: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent overwrite model error in development
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

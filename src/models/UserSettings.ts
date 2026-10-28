import mongoose, { Schema, Document, Model } from "mongoose";
import { Theme, HudMode, Difficulty, GameMode } from "@/types";

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  theme: Theme;
  accentColor: string;
  hudMode: HudMode;
  preferredDifficulty: Difficulty;
  preferredMode: GameMode;
  soundEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  keyboardClicks: boolean;
  screenShake: boolean;
  particleEffects: boolean;
  reducedMotion: boolean;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ["midnight", "cyberpunk", "terminal", "amber", "light"],
      default: "midnight",
    },
    accentColor: {
      type: String,
      default: "#00f0ff",
    },
    hudMode: {
      type: String,
      enum: ["minimal", "standard", "analytical"],
      default: "analytical",
    },
    preferredDifficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    preferredMode: {
      type: String,
      enum: ["classic", "endless", "daily"],
      default: "classic",
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    sfxVolume: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1,
    },
    musicVolume: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
    keyboardClicks: {
      type: Boolean,
      default: true,
    },
    screenShake: {
      type: Boolean,
      default: true,
    },
    particleEffects: {
      type: Boolean,
      default: true,
    },
    reducedMotion: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const UserSettings: Model<IUserSettings> =
  mongoose.models.UserSettings ||
  mongoose.model<IUserSettings>("UserSettings", UserSettingsSchema);

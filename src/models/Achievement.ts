import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    achievementId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "Trophy",
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate unlock of the same achievement for a user
AchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const Achievement: Model<IAchievement> =
  mongoose.models.Achievement ||
  mongoose.model<IAchievement>("Achievement", AchievementSchema);

export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: "FIRST_RUN",
    title: "First Contact",
    description: "Complete your first data stream interception run.",
    icon: "Play",
  },
  {
    id: "CLEAN_STREAK_5",
    title: "Surgical Typist",
    description: "Intercept 5 clean packets consecutively without corruption.",
    icon: "ShieldCheck",
  },
  {
    id: "HIGH_ACCURACY",
    title: "Precision Operative",
    description: "Achieve >= 95% typing accuracy in a completed run.",
    icon: "Target",
  },
  {
    id: "SCORE_1000",
    title: "Centurion",
    description: "Amass a score exceeding 1,000 points in a single run.",
    icon: "Award",
  },
  {
    id: "HARD_SURVIVOR",
    title: "Overclocked",
    description: "Successfully complete a Hard difficulty run.",
    icon: "Flame",
  },
  {
    id: "DATA_SCIENTIST",
    title: "Rational Actor",
    description: "Achieve 100% Rational Decision Index (all captured packets had positive EV).",
    icon: "BarChart3",
  },
  {
    id: "SPEED_DEMON",
    title: "Velocity 80",
    description: "Clock an average typing speed of 80+ WPM.",
    icon: "Zap",
  },
];

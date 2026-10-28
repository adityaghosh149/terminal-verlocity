import mongoose, { Schema, Document, Model } from "mongoose";
import { ChallengePurpose } from "@/lib/auth/otp";

export interface IVerificationChallenge extends Document {
  target: string; // normalized email
  purpose: ChallengePurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isConsumed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationChallengeSchema = new Schema<IVerificationChallenge>(
  {
    target: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["EMAIL_VERIFICATION", "PASSWORD_RESET", "LOGIN_OTP"],
      required: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB TTL index
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isConsumed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const VerificationChallenge: Model<IVerificationChallenge> =
  mongoose.models.VerificationChallenge ||
  mongoose.model<IVerificationChallenge>("VerificationChallenge", VerificationChallengeSchema);

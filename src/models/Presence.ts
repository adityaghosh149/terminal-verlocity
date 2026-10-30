import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPresence extends Document {
  sessionId: string;
  userId?: string;
  username?: string;
  path?: string;
  lastSeen: Date;
}

const PresenceSchema = new Schema<IPresence>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    username: {
      type: String,
      default: "guest",
    },
    path: {
      type: String,
      default: "/",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 90,
    },
  },
  { timestamps: true }
);

export const Presence: Model<IPresence> =
  mongoose.models.Presence || mongoose.model<IPresence>("Presence", PresenceSchema);

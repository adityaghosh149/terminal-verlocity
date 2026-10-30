import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserSettings {
  theme: string;
  preferredDifficulty: "easy" | "medium" | "hard";
  preferredMode: "classic" | "endless" | "daily";
  soundEnabled: boolean;
  screenShake: boolean;
}

export interface IUser extends Document {
  name: string;
  username: string;
  usernameLower?: string;
  password: string;
  settings: IUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      index: true,
    },
    usernameLower: {
      type: String,
      index: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    settings: {
      theme: { type: String, default: "midnight" },
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
      soundEnabled: { type: Boolean, default: true },
      screenShake: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", function (next) {
  if (this.username) {
    this.usernameLower = this.username.toLowerCase();
  }
  next();
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

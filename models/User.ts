// /models/User.ts
import mongoose, { Document, Model, Schema } from "mongoose";

// 1. Define an interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  spotifyId: string;
  refreshToken: string;
  image?: string; // image is optional
  quizResults?: {
    score: number;
    totalQuestions: number;
    date: Date;
    timeRange: string;
  }[];
}

// 2. Create the Mongoose Schema using the interface
const UserSchema: Schema<IUser> = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  spotifyId: {
    type: String,
    required: true,
    unique: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  quizResults: [{
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    timeRange: {
      type: String,
      default: 'medium_term',
    },
  }],
});

// 3. Create and export the Mongoose model
// This prevents Mongoose from redefining the model every time in development (HMR)
const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default UserModel;

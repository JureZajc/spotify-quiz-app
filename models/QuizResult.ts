// /models/QuizResult.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IQuizResult extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeRange: string;
  date: Date;
  tracks?: {
    trackId: string;
    trackName: string;
    artist: string;
    correct: boolean;
  }[];
}

const QuizResultSchema: Schema<IQuizResult> = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  timeRange: {
    type: String,
    default: 'medium_term',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  tracks: [{
    trackId: String,
    trackName: String,
    artist: String,
    correct: Boolean,
  }],
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Add indexes for common queries
QuizResultSchema.index({ userId: 1, date: -1 });
QuizResultSchema.index({ date: -1 });
QuizResultSchema.index({ percentage: -1 });

const QuizResultModel: Model<IQuizResult> =
  mongoose.models.QuizResult || mongoose.model<IQuizResult>("QuizResult", QuizResultSchema);

export default QuizResultModel;

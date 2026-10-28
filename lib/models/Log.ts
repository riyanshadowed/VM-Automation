import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILog extends Document {
  commentId: string;
  mediaId: string;
  username: string;
  commentText: string;
  matchedRuleName?: string;
  matchedKeywords?: string[];
  replySent: boolean;
  replyText?: string;
  dmSent: boolean;
  dmText?: string;
  status: "success" | "ignored" | "failed";
  errorMessage?: string;
  isSimulated?: boolean;
  createdAt: Date;
}

const LogSchema = new Schema<ILog>(
  {
    commentId: { type: String, required: true },
    mediaId: { type: String, default: "" },
    username: { type: String, required: true },
    commentText: { type: String, required: true },
    matchedRuleName: { type: String },
    matchedKeywords: { type: [String], default: [] },
    replySent: { type: Boolean, default: false },
    replyText: { type: String },
    dmSent: { type: Boolean, default: false },
    dmText: { type: String },
    status: {
      type: String,
      enum: ["success", "ignored", "failed"],
      default: "success",
    },
    errorMessage: { type: String },
    isSimulated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const LogModel: Model<ILog> =
  mongoose.models.Log || mongoose.model<ILog>("Log", LogSchema);


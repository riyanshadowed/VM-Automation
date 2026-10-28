import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRule extends Document {
  name: string;
  triggerKeywords: string[];
  matchType: "contains" | "exact";
  mediaId: string; // "all" or specific Instagram media ID
  dmMessage: string;
  commentReplies: string[];
  autoLike: boolean;
  isActive: boolean;
  totalTriggered: number;
  createdAt: Date;
  updatedAt: Date;
}

const RuleSchema = new Schema<IRule>(
  {
    name: { type: String, required: true },
    triggerKeywords: { type: [String], required: true },
    matchType: { type: String, enum: ["contains", "exact"], default: "contains" },
    mediaId: { type: String, default: "all" },
    dmMessage: { type: String, required: true },
    commentReplies: { type: [String], default: [] },
    autoLike: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    totalTriggered: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const RuleModel: Model<IRule> =
  mongoose.models.Rule || mongoose.model<IRule>("Rule", RuleSchema);


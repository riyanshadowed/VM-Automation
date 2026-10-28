import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  metaAppId: string;
  metaAppSecret: string;
  metaVerifyToken: string;
  pageAccessToken: string;
  instagramAccountId: string;
  pageId: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    metaAppId: { type: String, default: "" },
    metaAppSecret: { type: String, default: "" },
    metaVerifyToken: { type: String, default: "vyapar_automate_verify_token_123" },
    pageAccessToken: { type: String, default: "" },
    instagramAccountId: { type: String, default: "" },
    pageId: { type: String, default: "" },
  },
  { timestamps: true }
);

export const SettingsModel: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);


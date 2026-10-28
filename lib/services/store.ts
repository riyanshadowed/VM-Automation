import fs from "fs";
import path from "path";
import { connectToDatabase } from "../db/mongoose";
import { RuleModel, IRule } from "../models/Rule";
import { LogModel, ILog } from "../models/Log";
import { SettingsModel, ISettings } from "../models/Settings";

export interface AutomationRule {
  _id: string;
  name: string;
  triggerKeywords: string[];
  matchType: "contains" | "exact";
  mediaId: string;
  dmMessage: string;
  commentReplies: string[];
  autoLike: boolean;
  isActive: boolean;
  totalTriggered: number;
  createdAt: string;
}

export interface AutomationLog {
  _id: string;
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
  createdAt: string;
}

export interface AppSettings {
  metaAppId: string;
  metaAppSecret: string;
  metaVerifyToken: string;
  pageAccessToken: string;
  instagramAccountId: string;
  pageId: string;
}

const defaultRules: AutomationRule[] = [
  {
    _id: "rule_1",
    name: "E-Book / PDF Giveaway (Reel Automation)",
    triggerKeywords: ["book", "pdf", "guide", "free"],
    matchType: "contains",
    mediaId: "all",
    dmMessage:
      "Hey {username}! 🚀 Thanks for dropping a comment on our reel. Here is your direct download link for the Complete Automation Guide: https://example.com/free-guide. Let me know if you have any questions!",
    commentReplies: [
      "Check your DM! 📩 Sent you the direct download link.",
      "Sent to your inbox! Check your DM 🚀",
      "Check your messages! Happy learning ✨",
      "DM sent! Let me know if you received it 👍",
    ],
    autoLike: true,
    isActive: true,
    totalTriggered: 14,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    _id: "rule_2",
    name: "Pricing & Quotation Enquiry",
    triggerKeywords: ["price", "cost", "rate", "fees"],
    matchType: "contains",
    mediaId: "all",
    dmMessage:
      "Hello {username}! 👋 Our automation packages start at just ₹999/month. You can view all features and pricing breakdown here: https://example.com/pricing. Would you like to schedule a quick 10-minute demo?",
    commentReplies: [
      "Sent you the complete pricing details in your DM! 💼",
      "Details sent to your inbox! Check your DM 📲",
      "Just sent you a DM with the plans & discounts! ✨",
    ],
    autoLike: true,
    isActive: true,
    totalTriggered: 8,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    _id: "rule_3",
    name: "VIP Community & WhatsApp Group Link",
    triggerKeywords: ["join", "link", "group", "community"],
    matchType: "contains",
    mediaId: "all",
    dmMessage:
      "Welcome {username}! 🎉 Here is your exclusive invite link to join our VIP Creators Club: https://chat.whatsapp.com/sample-invite. See you inside!",
    commentReplies: [
      "Sent you the private VIP invite link in DM! 🤝",
      "Check your inbox for the community link! 🚀",
    ],
    autoLike: true,
    isActive: true,
    totalTriggered: 22,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

const defaultLogs: AutomationLog[] = [
  {
    _id: "log_1",
    commentId: "ig_comment_101",
    mediaId: "reel_8829102",
    username: "rahul_tech_dev",
    commentText: "Please send me the pdf guide bro!",
    matchedRuleName: "E-Book / PDF Giveaway (Reel Automation)",
    matchedKeywords: ["pdf", "guide"],
    replySent: true,
    replyText: "Check your DM! 📩 Sent you the direct download link.",
    dmSent: true,
    dmText:
      "Hey rahul_tech_dev! 🚀 Thanks for dropping a comment on our reel. Here is your direct download link...",
    status: "success",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    _id: "log_2",
    commentId: "ig_comment_102",
    mediaId: "reel_8829102",
    username: "priya_marketing",
    commentText: "What is the price of this tool?",
    matchedRuleName: "Pricing & Quotation Enquiry",
    matchedKeywords: ["price"],
    replySent: true,
    replyText: "Sent you the complete pricing details in your DM! 💼",
    dmSent: true,
    dmText:
      "Hello priya_marketing! 👋 Our automation packages start at just ₹999/month...",
    status: "success",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    _id: "log_3",
    commentId: "ig_comment_103",
    mediaId: "post_910291",
    username: "amit_business",
    commentText: "Nice post keep it up!",
    replySent: false,
    dmSent: false,
    status: "ignored",
    errorMessage: "No trigger keyword matched in comment",
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
  },
];

// Local JSON fallback store file path
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

interface LocalData {
  rules: AutomationRule[];
  logs: AutomationLog[];
  settings: AppSettings;
}

function getLocalData(): LocalData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial: LocalData = {
        rules: defaultRules,
        logs: defaultLogs,
        settings: {
          metaAppId: process.env.META_APP_ID || "",
          metaAppSecret: process.env.META_APP_SECRET || "",
          metaVerifyToken:
            process.env.META_VERIFY_TOKEN || "vyapar_automate_verify_token_123",
          pageAccessToken: process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || "",
          instagramAccountId: process.env.INSTAGRAM_ACCOUNT_ID || "",
          pageId: process.env.FACEBOOK_PAGE_ID || "",
        },
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw) as LocalData;
  } catch (err) {
    console.error("Local data read error:", err);
    return {
      rules: defaultRules,
      logs: defaultLogs,
      settings: {
        metaAppId: "",
        metaAppSecret: "",
        metaVerifyToken: "vyapar_automate_verify_token_123",
        pageAccessToken: "",
        instagramAccountId: "",
        pageId: "",
      },
    };
  }
}

function saveLocalData(data: LocalData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Local data write error:", err);
  }
}

export async function getRules(): Promise<AutomationRule[]> {
  const db = await connectToDatabase();
  if (db) {
    const rules = await RuleModel.find().sort({ createdAt: -1 }).lean();
    if (rules.length === 0) {
      // Seed default rules into MongoDB
      await RuleModel.insertMany(defaultRules.map(({ _id, ...rest }) => rest));
      const seeded = await RuleModel.find().sort({ createdAt: -1 }).lean();
      return seeded.map((r) => ({
        ...r,
        _id: r._id.toString(),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      })) as AutomationRule[];
    }
    return rules.map((r) => ({
      ...r,
      _id: r._id.toString(),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })) as AutomationRule[];
  }

  // Fallback
  const data = getLocalData();
  return data.rules;
}

export async function createRule(
  input: Omit<AutomationRule, "_id" | "createdAt" | "totalTriggered">
): Promise<AutomationRule> {
  const db = await connectToDatabase();
  if (db) {
    const created = await RuleModel.create({
      ...input,
      totalTriggered: 0,
    });
    return {
      ...created.toObject(),
      _id: created._id.toString(),
      createdAt: created.createdAt.toISOString(),
    } as AutomationRule;
  }

  const data = getLocalData();
  const newRule: AutomationRule = {
    _id: "rule_" + Date.now(),
    name: input.name,
    triggerKeywords: input.triggerKeywords,
    matchType: input.matchType || "contains",
    mediaId: input.mediaId || "all",
    dmMessage: input.dmMessage,
    commentReplies: input.commentReplies || [],
    autoLike: input.autoLike ?? true,
    isActive: input.isActive ?? true,
    totalTriggered: 0,
    createdAt: new Date().toISOString(),
  };
  data.rules.unshift(newRule);
  saveLocalData(data);
  return newRule;
}

export async function updateRule(
  id: string,
  updates: Partial<AutomationRule>
): Promise<AutomationRule | null> {
  const db = await connectToDatabase();
  if (db) {
    const updated = await RuleModel.findByIdAndUpdate(id, updates, {
      new: true,
    }).lean();
    if (!updated) return null;
    return {
      ...updated,
      _id: updated._id.toString(),
      createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : new Date().toISOString(),
    } as AutomationRule;
  }

  const data = getLocalData();
  const index = data.rules.findIndex((r) => r._id === id);
  if (index === -1) return null;
  data.rules[index] = { ...data.rules[index], ...updates };
  saveLocalData(data);
  return data.rules[index];
}

export async function deleteRule(id: string): Promise<boolean> {
  const db = await connectToDatabase();
  if (db) {
    const res = await RuleModel.findByIdAndDelete(id);
    return !!res;
  }

  const data = getLocalData();
  const filtered = data.rules.filter((r) => r._id !== id);
  if (filtered.length === data.rules.length) return false;
  data.rules = filtered;
  saveLocalData(data);
  return true;
}

export async function incrementRuleTriggerCount(id: string): Promise<void> {
  const db = await connectToDatabase();
  if (db) {
    await RuleModel.findByIdAndUpdate(id, { $inc: { totalTriggered: 1 } });
    return;
  }

  const data = getLocalData();
  const rule = data.rules.find((r) => r._id === id);
  if (rule) {
    rule.totalTriggered = (rule.totalTriggered || 0) + 1;
    saveLocalData(data);
  }
}

export async function getLogs(limit = 50): Promise<AutomationLog[]> {
  const db = await connectToDatabase();
  if (db) {
    const logs = await LogModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return logs.map((l) => ({
      ...l,
      _id: l._id.toString(),
      createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
    })) as AutomationLog[];
  }

  const data = getLocalData();
  return data.logs.slice(0, limit);
}

export async function addLog(
  log: Omit<AutomationLog, "_id" | "createdAt">
): Promise<AutomationLog> {
  const db = await connectToDatabase();
  if (db) {
    const created = await LogModel.create(log);
    return {
      ...created.toObject(),
      _id: created._id.toString(),
      createdAt: created.createdAt.toISOString(),
    } as AutomationLog;
  }

  const data = getLocalData();
  const newLog: AutomationLog = {
    ...log,
    _id: "log_" + Date.now(),
    createdAt: new Date().toISOString(),
  };
  data.logs.unshift(newLog);
  if (data.logs.length > 200) data.logs.pop(); // keep last 200 logs
  saveLocalData(data);
  return newLog;
}

export async function clearAllLogs(): Promise<void> {
  const db = await connectToDatabase();
  if (db) {
    await LogModel.deleteMany({});
    return;
  }

  const data = getLocalData();
  data.logs = [];
  saveLocalData(data);
}

export async function getSettings(): Promise<AppSettings> {
  const db = await connectToDatabase();
  if (db) {
    const s = await SettingsModel.findOne().lean();
    if (s) {
      return {
        metaAppId: s.metaAppId || process.env.META_APP_ID || "",
        metaAppSecret: s.metaAppSecret || process.env.META_APP_SECRET || "",
        metaVerifyToken:
          s.metaVerifyToken ||
          process.env.META_VERIFY_TOKEN ||
          "vyapar_automate_verify_token_123",
        pageAccessToken:
          s.pageAccessToken || process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || "",
        instagramAccountId:
          s.instagramAccountId || process.env.INSTAGRAM_ACCOUNT_ID || "",
        pageId: s.pageId || process.env.FACEBOOK_PAGE_ID || "",
      };
    }
  }

  const data = getLocalData();
  return {
    metaAppId: data.settings?.metaAppId || process.env.META_APP_ID || "",
    metaAppSecret: data.settings?.metaAppSecret || process.env.META_APP_SECRET || "",
    metaVerifyToken:
      data.settings?.metaVerifyToken ||
      process.env.META_VERIFY_TOKEN ||
      "vyapar_automate_verify_token_123",
    pageAccessToken:
      data.settings?.pageAccessToken ||
      process.env.INSTAGRAM_PAGE_ACCESS_TOKEN ||
      "",
    instagramAccountId:
      data.settings?.instagramAccountId ||
      process.env.INSTAGRAM_ACCOUNT_ID ||
      "",
    pageId: data.settings?.pageId || process.env.FACEBOOK_PAGE_ID || "",
  };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const cleanSettings: Partial<AppSettings> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined && value !== null) {
      if (
        (key === "pageAccessToken" || key === "metaAppSecret") &&
        typeof value === "string" &&
        value.trim() === ""
      ) {
        // Do not erase existing token/secret with an empty string
        continue;
      }
      (cleanSettings as Record<string, unknown>)[key] = value;
    }
  }

  const db = await connectToDatabase();
  if (db) {
    const updated = await SettingsModel.findOneAndUpdate(
      {},
      { $set: cleanSettings },
      { upsert: true, new: true }
    ).lean();
    return {
      metaAppId: updated?.metaAppId || "",
      metaAppSecret: updated?.metaAppSecret || "",
      metaVerifyToken: updated?.metaVerifyToken || "vyapar_automate_verify_token_123",
      pageAccessToken: updated?.pageAccessToken || "",
      instagramAccountId: updated?.instagramAccountId || "",
      pageId: updated?.pageId || "",
    };
  }

  const data = getLocalData();
  data.settings = { ...data.settings, ...cleanSettings };
  saveLocalData(data);
  return data.settings;
}

export async function getDashboardStats() {
  const rules = await getRules();
  const logs = await getLogs(500);

  const commentsProcessed = logs.length;
  const matchedComments = logs.filter(
    (l) => l.status === "success" || l.matchedRuleName
  ).length;
  const successfulDMs = logs.filter((l) => l.dmSent).length;
  const failedActions = logs.filter((l) => l.status === "failed").length;
  const activeRulesCount = rules.filter((r) => r.isActive).length;

  return {
    commentsProcessed,
    matchedComments,
    successfulDMs,
    failedActions,
    activeRulesCount,
    totalRulesCount: rules.length,
  };
}

export async function getDatabaseStatus() {
  const isAtlas = Boolean(process.env.MONGODB_URI);
  if (!isAtlas) {
    return {
      isConnected: true,
      type: "Local Database",
      detail: "Running locally in .data/store.json",
      isAtlas: false,
    };
  }
  const db = await connectToDatabase();
  return {
    isConnected: !!db,
    type: db ? "MongoDB Atlas" : "MongoDB Connection Failed",
    detail: db ? "Connected to Cloud Atlas Cluster" : "Please check MONGODB_URI in .env.local",
    isAtlas: true,
  };
}


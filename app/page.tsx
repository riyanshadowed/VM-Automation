"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Settings as SettingsIcon,
  Activity,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Heart,
  Info,
  Eye,
  EyeOff,
  Menu,
  X,
  ChevronRight,
  Moon,
  Zap,
  TrendingUp,
  Database,
  Radio,
} from "lucide-react";

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

interface Rule {
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

interface Log {
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

interface Stats {
  commentsProcessed: number;
  matchedComments: number;
  successfulDMs: number;
  failedActions: number;
  activeRulesCount: number;
  totalRulesCount: number;
}

interface SettingsState {
  metaAppId: string;
  metaVerifyToken: string;
  instagramAccountId: string;
  pageId: string;
  hasPageAccessToken: boolean;
  pageAccessTokenMasked: string;
  hasAppSecret: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "rules" | "simulator" | "settings">("overview");

  // Data states
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats>({
    commentsProcessed: 0,
    matchedComments: 0,
    successfulDMs: 0,
    failedActions: 0,
    activeRulesCount: 0,
    totalRulesCount: 0,
  });
  const [settings, setSettings] = useState<SettingsState>({
    metaAppId: "",
    metaVerifyToken: "vyapar_automate_verify_token_123",
    instagramAccountId: "",
    pageId: "",
    hasPageAccessToken: false,
    pageAccessTokenMasked: "",
    hasAppSecret: false,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:3000/api/instagram/webhook");
  const [dbStatus, setDbStatus] = useState({
    isConnected: true,
    type: "Local Database",
    detail: "Running locally in .data/store.json",
    isAtlas: false,
  });

  // Filter logs state
  const [logFilter, setLogFilter] = useState<"all" | "success" | "ignored" | "failed">("all");

  // Create rule modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    keywords: "",
    matchType: "contains" as "contains" | "exact",
    mediaId: "all",
    dmMessage: "",
    commentReplies: "Check your DM! 📩\nSent to your inbox! Check messages ✨\nDM sent! Check your inbox 🚀",
    autoLike: true,
  });
  const [creatingRule, setCreatingRule] = useState(false);

  // Simulator test form state
  const [simForm, setSimForm] = useState({
    username: "rahul_creator",
    commentText: "Please send me the pdf guide!",
    mediaId: "reel_test_101",
  });
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    metaAppId: "",
    metaAppSecret: "",
    metaVerifyToken: "vyapar_automate_verify_token_123",
    pageAccessToken: "",
    instagramAccountId: "",
    pageId: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<string | null>(null);

  const handleSubscribePage = async () => {
    try {
      setSubscribing(true);
      setSubscribeStatus(null);
      const res = await fetch("/api/instagram/subscribe-page", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSubscribeStatus("Page & Instagram successfully subscribed to Webhook! Real comments will now flow.");
      } else {
        setSubscribeStatus("Error: " + (data.error || "Failed to subscribe"));
      }
    } catch {
      setSubscribeStatus("Error calling subscription API");
    } finally {
      setSubscribing(false);
    }
  };

  // Load initial data
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [rulesRes, logsRes, settingsRes] = await Promise.all([
        fetch("/api/rules"),
        fetch("/api/logs"),
        fetch("/api/settings"),
      ]);

      const rulesData = await rulesRes.json();
      const logsData = await logsRes.json();
      const settingsData = await settingsRes.json();

      if (rulesData.success) setRules(rulesData.rules);
      if (logsData.success) {
        setLogs(logsData.logs);
        if (logsData.stats) setStats(logsData.stats);
        if (logsData.dbStatus) setDbStatus(logsData.dbStatus);
      }
      if (settingsData.success) {
        setSettings(settingsData.settings);
        setSettingsForm((prev) => ({
          ...prev,
          metaAppId: settingsData.settings.metaAppId || "",
          metaVerifyToken: settingsData.settings.metaVerifyToken || "vyapar_automate_verify_token_123",
          instagramAccountId: settingsData.settings.instagramAccountId || "",
          pageId: settingsData.settings.pageId || "",
          pageAccessToken: settingsData.settings.pageAccessToken || prev.pageAccessToken || "",
        }));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/instagram/webhook`);
    }
    fetchData();
  }, [fetchData]);

  // Copy helper
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Toggle Rule Status
  const toggleRule = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRules((prev) =>
          prev.map((r) => (r._id === id ? { ...r, isActive: !currentStatus } : r))
        );
        setStats((prev) => ({
          ...prev,
          activeRulesCount: !currentStatus
            ? prev.activeRulesCount + 1
            : prev.activeRulesCount - 1,
        }));
      }
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  // Delete Rule
  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this automation rule?")) return;
    try {
      const res = await fetch(`/api/rules/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setRules((prev) => prev.filter((r) => r._id !== id));
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  // Create Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.keywords || !newRule.dmMessage) {
      alert("Please fill in Rule Name, Trigger Keywords, and DM Message.");
      return;
    }

    try {
      setCreatingRule(true);
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRule.name,
          triggerKeywords: newRule.keywords,
          matchType: newRule.matchType,
          mediaId: newRule.mediaId,
          dmMessage: newRule.dmMessage,
          commentReplies: newRule.commentReplies,
          autoLike: newRule.autoLike,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        setNewRule({
          name: "",
          keywords: "",
          matchType: "contains",
          mediaId: "all",
          dmMessage: "",
          commentReplies:
            "Check your DM! 📩\nSent to your inbox! Check messages ✨\nDM sent! Check your inbox 🚀",
          autoLike: true,
        });
        fetchData();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Failed to create rule:", err);
    } finally {
      setCreatingRule(false);
    }
  };

  // Run Simulator Test
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simForm.commentText) return;

    try {
      setSimulating(true);
      const res = await fetch("/api/instagram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simForm),
      });

      const data = await res.json();
      if (data.success) {
        setSimResult(data.result);
        fetchData(); // refresh logs
      } else {
        alert("Simulation error: " + data.error);
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  // Clear all logs
  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all activity logs?")) return;
    try {
      await fetch("/api/logs", { method: "DELETE" });
      setLogs([]);
      setStats((prev) => ({
        ...prev,
        commentsProcessed: 0,
        matchedComments: 0,
        successfulDMs: 0,
        failedActions: 0,
      }));
    } catch (err) {
      console.error("Failed to clear logs:", err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });

      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        if (data.settings.pageAccessToken) {
          setSettingsForm((prev) => ({
            ...prev,
            pageAccessToken: data.settings.pageAccessToken,
          }));
        }
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        alert("Settings error: " + data.error);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (logFilter === "all") return true;
    return log.status === logFilter;
  });

  return (
    <main className="min-h-screen bg-[#090D16] text-slate-100 font-sans antialiased bg-radial-glow relative selection:bg-emerald-500 selection:text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1480px]">
        {/* Mobile Slide-Over Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[#0B101D] border-r border-slate-800 p-5 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="/logo.png"
                        alt="VyaparMitra Logo"
                        className="h-11 w-11 rounded-xl object-contain border border-emerald-500/30 bg-slate-950 p-1 shadow-md shadow-emerald-500/10"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse"></span>
                    </div>
                    <div>
                      <p className="font-extrabold tracking-tight text-white leading-tight text-base">
                        Vyapar<span className="text-emerald-400">Mitra</span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">Auto-DM &amp; Growth Engine</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-5 space-y-1.5 text-sm font-medium">
                  <button
                    onClick={() => {
                      setActiveTab("overview");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 transition ${
                      activeTab === "overview"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold"
                        : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                    }`}
                  >
                    <Activity className="h-4 w-4" />
                    <span>Overview Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("rules");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 transition ${
                      activeTab === "rules"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold"
                        : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="h-4 w-4" />
                      <span>Automations</span>
                    </div>
                    <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      {rules.length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("simulator");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 transition ${
                      activeTab === "simulator"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold"
                        : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span>Test Simulator</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("settings");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 transition ${
                      activeTab === "settings"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold"
                        : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                    }`}
                  >
                    <SettingsIcon className="h-4 w-4" />
                    <span>Meta API Settings</span>
                  </button>
                </nav>
              </div>

              {/* Mobile Drawer Bottom Info */}
              <div className="pt-4 border-t border-slate-800/80">
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider">Meta Graph API v21.0</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px]">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        dbStatus.isAtlas
                          ? dbStatus.isConnected
                            ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                            : "bg-rose-500"
                          : "bg-blue-400"
                      }`}
                    ></span>
                    <span className="font-semibold text-slate-200">{dbStatus.type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-800/80 bg-[#0B101D]/90 backdrop-blur-2xl px-5 py-6 lg:flex lg:flex-col justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="VyaparMitra Logo"
                  className="h-11 w-11 rounded-xl object-contain border border-emerald-500/30 bg-slate-950 p-1 shadow-md shadow-emerald-500/10"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse"></span>
              </div>
              <div>
                <p className="font-extrabold tracking-tight text-white leading-tight text-lg">
                  Vyapar<span className="text-emerald-400">Mitra</span>
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-slate-400 font-medium">Auto-DM &amp; Growth</p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5 text-sm font-medium">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${
                  activeTab === "overview"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Activity className="h-4 w-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab("rules")}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition ${
                  activeTab === "rules"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4" />
                  <span>Automations</span>
                </div>
                <span className="rounded-full bg-slate-800 border border-slate-700/80 px-2 py-0.5 text-xs text-slate-300">
                  {rules.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("simulator")}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${
                  activeTab === "simulator"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>Test Simulator</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${
                  activeTab === "settings"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Meta API Settings</span>
              </button>
            </nav>
          </div>

          {/* Quick Info Box in sidebar bottom */}
          <div className="pt-6">
            <div className="rounded-2xl border border-slate-800 bg-[#0E1626]/90 p-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider">Meta API Engine</p>
                </div>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Official Graph API comment triggers with anti-spam rate limiting.
              </p>
              <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800 text-[11px]">
                <div className="flex items-center gap-2">
                  <Database className="h-3 w-3 text-slate-400" />
                  <span className="font-semibold text-slate-300">{dbStatus.type}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/80 bg-[#090D16]/85 backdrop-blur-xl px-4 py-3 sm:px-8 sm:py-3.5 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Drawer Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Brand Logo on Mobile */}
              <img
                src="/logo.png"
                alt="VyaparMitra"
                className="lg:hidden h-8 w-8 rounded-lg object-contain border border-emerald-500/30 bg-slate-950 p-0.5 shrink-0"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-emerald-400" />
                    VyaparMitra
                  </span>
                  <span className="text-slate-600 hidden xs:inline">•</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 capitalize hidden xs:inline">
                    {activeTab}
                  </span>
                </div>
                <h1 className="text-sm sm:text-lg font-extrabold tracking-tight text-white truncate">
                  {activeTab === "overview" && "Instagram Automation Dashboard"}
                  {activeTab === "rules" && "Comment-to-DM Rules Engine"}
                  {activeTab === "simulator" && "Event Simulator & Tester"}
                  {activeTab === "settings" && "Meta Graph API Credentials"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Connected Account Pill */}
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                <span className="font-semibold text-slate-200">@vyaparmitraapp</span>
              </div>

              {/* Theme Pill */}
              <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-400">
                <Moon className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium">Dark Mode</span>
              </div>

              <button
                onClick={fetchData}
                disabled={refreshing}
                title="Refresh live data"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-200 shadow-sm hover:bg-slate-800 hover:text-white transition active:scale-95"
              >
                <RefreshCw className={`h-4 w-4 sm:h-3.5 sm:w-3.5 text-emerald-400 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">New Rule</span>
              </button>
            </div>
          </header>

          {/* Page Body */}
          <div className="flex-1 p-3.5 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 pb-24 lg:pb-10">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <>
                {/* Hero Banner with Modern SaaS Glow */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C1322] via-[#0F1B2F] to-[#062c20]/60 p-5 sm:p-8 text-white shadow-2xl border border-slate-800/90">
                  <div className="absolute right-6 -bottom-8 opacity-10 pointer-events-none hidden md:block">
                    <img src="/logo.png" alt="" className="h-56 w-56 object-contain" />
                  </div>
                  <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                        VyaparMitra AI Auto-DM Engine
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/60">
                        ⚡ Real-Time Webhook
                      </span>
                    </div>

                    <h2 className="mt-4 text-xl sm:text-3xl font-black tracking-tight leading-snug">
                      Reel &amp; Post Comments ko Direct Customers &amp; Leads me badlein.
                    </h2>
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-300">
                      Jab koi follower aapke Reel ya Post par keyword comment karega (jaise &ldquo;PRICE&rdquo;, &ldquo;LINK&rdquo;, &ldquo;PDF&rdquo;),
                      VyaparMitra instantly public comment reply dega aur direct message (DM) me link send karega.
                    </p>

                    <div className="mt-6 flex flex-col xs:flex-row items-stretch xs:items-center gap-3">
                      <button
                        onClick={() => setActiveTab("simulator")}
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:from-emerald-400 hover:to-emerald-300 shadow-lg shadow-emerald-500/25 text-center active:scale-95"
                      >
                        Try Live Simulator →
                      </button>
                      <button
                        onClick={() => setActiveTab("rules")}
                        className="rounded-xl border border-slate-700 bg-slate-850/80 px-5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white text-center active:scale-95"
                      >
                        Manage Rules ({rules.length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
                  <article className="glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800/80 hover:border-blue-500/30 transition">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Processed
                      </p>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <MessageSquare className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-white">
                      {stats.commentsProcessed}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <TrendingUp className="h-3 w-3 text-blue-400" />
                      <span>Comments received</span>
                    </div>
                  </article>

                  <article className="glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800/80 hover:border-violet-500/30 transition">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Triggered
                      </p>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <Sparkles className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-white">
                      {stats.matchedComments}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Zap className="h-3 w-3 text-violet-400" />
                      <span>Automations matched</span>
                    </div>
                  </article>

                  <article className="glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800/80 hover:border-emerald-500/40 transition">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        DMs Sent
                      </p>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                        <Send className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-emerald-400">
                      {stats.successfulDMs}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400/80">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Delivered to inbox</span>
                    </div>
                  </article>

                  <article className="glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800/80 hover:border-amber-500/30 transition">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Active Rules
                      </p>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Layers className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-white">
                      {stats.activeRulesCount}{" "}
                      <span className="text-xs sm:text-sm font-normal text-slate-400">/ {rules.length}</span>
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Radio className="h-3 w-3 text-amber-400" />
                      <span>Running automations</span>
                    </div>
                  </article>
                </div>

                {/* Webhook & Setup Quick Card */}
                <div className="rounded-2xl border border-slate-800/90 bg-[#0B101D] p-4 sm:p-6 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                        <h3 className="font-bold text-sm sm:text-base text-white">Meta Webhook Live Endpoint</h3>
                      </div>
                      <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
                        Configure this URL in Meta Developer Portal &gt; Webhooks &gt; Instagram field &apos;comments&apos;.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <code className="flex-1 md:flex-initial rounded-xl bg-slate-950 px-3.5 py-2 font-mono text-[11px] sm:text-xs text-emerald-300 border border-slate-800 break-all select-all shadow-inner">
                        {webhookUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(webhookUrl, "webhook")}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-sm hover:bg-slate-700 hover:text-white transition active:scale-95"
                      >
                        {copiedField === "webhook" ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Activity Feed Section */}
                <div className="rounded-2xl border border-slate-800/80 bg-[#0D1322]/90 shadow-xl overflow-hidden backdrop-blur-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 p-4 sm:px-6 gap-3">
                    <div>
                      <h2 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                        <span>Real-Time Activity Feed</span>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-400">Live incoming comments &amp; automated responses</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                      <div className="flex overflow-x-auto no-scrollbar rounded-xl bg-slate-950 p-1 text-xs font-medium border border-slate-800 max-w-full">
                        {(["all", "success", "ignored", "failed"] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setLogFilter(filter)}
                            className={`rounded-lg px-3 py-1 capitalize transition shrink-0 ${
                              logFilter === filter
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>

                      {logs.length > 0 && (
                        <button
                          onClick={handleClearLogs}
                          className="shrink-0 text-xs text-slate-400 hover:text-rose-400 transition px-2.5 py-1 rounded-lg hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {filteredLogs.length === 0 ? (
                      <div className="p-10 text-center">
                        <MessageSquare className="mx-auto h-9 w-9 text-slate-600" />
                        <p className="mt-3 text-sm font-semibold text-slate-300">No events found</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Try running a test comment in the Test Simulator tab or drop a comment on Instagram!
                        </p>
                      </div>
                    ) : (
                      filteredLogs.map((log) => (
                        <div key={log._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 gap-3 hover:bg-slate-850/40 transition">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-xs font-bold text-slate-200">
                              {log.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs text-white">@{log.username}</span>
                                {log.isSimulated && (
                                  <span className="rounded-md bg-violet-950/70 border border-violet-800/60 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
                                    Simulated
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-500">
                                  {mounted
                                    ? new Date(log.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Recently"}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-slate-200 font-medium">
                                &ldquo;{log.commentText}&rdquo;
                              </p>

                              {log.matchedRuleName && (
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                                  <span className="text-slate-400">Rule:</span>
                                  <span className="rounded-md bg-indigo-950/80 px-2 py-0.5 font-medium text-indigo-300 border border-indigo-800/60">
                                    {log.matchedRuleName}
                                  </span>
                                  {log.matchedKeywords && log.matchedKeywords.length > 0 && (
                                    <span className="text-slate-400 font-mono">
                                      (Keyword: {log.matchedKeywords.join(", ")})
                                    </span>
                                  )}
                                </div>
                              )}

                              {log.replyText && (
                                <p className="mt-1 text-[11px] text-slate-400">
                                  <span className="font-semibold text-slate-300">Public Reply:</span> {log.replyText}
                                </p>
                              )}

                              {log.errorMessage && (
                                <p className="mt-1 text-[11px] text-rose-400 font-medium bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 rounded">
                                  {log.errorMessage}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                            {log.status === "success" && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-800/60 shadow-[0_0_12px_rgba(52,211,153,0.15)]">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                DM Sent
                              </span>
                            )}
                            {log.status === "ignored" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-400 border border-slate-700/60">
                                <Info className="h-3.5 w-3.5 text-slate-400" />
                                Ignored
                              </span>
                            )}
                            {log.status === "failed" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/60 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-800/60">
                                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                                Failed
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {/* AUTOMATIONS / RULES TAB */}
            {activeTab === "rules" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">Active Keyword Automation Rules</h2>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Configure keywords, comment reply variations, and automatic direct messages.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition w-full sm:w-auto active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Automation Rule</span>
                  </button>
                </div>

                <div className="grid gap-3 sm:gap-4">
                  {rules.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-[#0D1322] p-8 sm:p-12 text-center">
                      <Layers className="mx-auto h-10 w-10 text-slate-600" />
                      <h3 className="mt-3 text-base font-semibold text-slate-200">No automation rules yet</h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Create your first rule to start automatically replying to Instagram comments.
                      </p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md"
                      >
                        <Plus className="h-4 w-4" />
                        Create First Rule
                      </button>
                    </div>
                  ) : (
                    rules.map((rule) => (
                      <div
                        key={rule._id}
                        className={`rounded-2xl border transition bg-[#0D1322]/90 p-4 sm:p-6 shadow-xl backdrop-blur-xl ${
                          rule.isActive
                            ? "border-slate-800/80 hover:border-slate-700/80"
                            : "border-slate-800/40 opacity-70 bg-slate-950/60"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm sm:text-base text-white">{rule.name}</h3>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold ${
                                  rule.isActive
                                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shadow-[0_0_10px_rgba(52,211,153,0.15)]"
                                    : "bg-slate-800/80 text-slate-400 border border-slate-700/60"
                                }`}
                              >
                                {rule.isActive ? "Active" : "Paused"}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                Triggered {rule.totalTriggered || 0} times
                              </span>
                            </div>

                            {/* Trigger Keywords */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[11px] font-medium text-slate-400">Keywords:</span>
                              {rule.triggerKeywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="rounded-lg bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 text-[11px] font-mono text-indigo-300"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                            <button
                              onClick={() => toggleRule(rule._id, rule.isActive)}
                              className={`flex-1 sm:flex-initial rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-95 ${
                                rule.isActive
                                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                  : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold shadow-sm"
                              }`}
                            >
                              {rule.isActive ? "Pause Automation" : "Activate"}
                            </button>

                            <button
                              onClick={() => handleDeleteRule(rule._id)}
                              className="rounded-xl p-2 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 border border-transparent hover:border-rose-900/40 transition active:scale-95"
                              title="Delete Rule"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="mt-4 grid gap-3 sm:gap-4 rounded-xl bg-slate-950/60 p-3 sm:p-4 grid-cols-1 sm:grid-cols-2 border border-slate-800/80">
                          <div>
                            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
                              <Send className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Private DM Message (Delivered to inbox)</span>
                            </div>
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono break-words">
                              {rule.dmMessage}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
                              <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
                              <span>Public Comment Replies ({rule.commentReplies?.length || 0} variations)</span>
                            </div>
                            <div className="mt-1.5 space-y-1.5">
                              {rule.commentReplies?.slice(0, 3).map((reply, idx) => (
                                <p
                                  key={idx}
                                  className="text-xs text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 truncate"
                                >
                                  💬 &ldquo;{reply}&rdquo;
                                </p>
                              ))}
                              {(rule.commentReplies?.length || 0) > 3 && (
                                <p className="text-[11px] text-slate-500 pl-1">
                                  + {rule.commentReplies.length - 3} more variations (anti-spam rotation)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TEST SIMULATOR TAB */}
            {activeTab === "simulator" && (
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Simulator Form */}
                <div className="rounded-2xl border border-slate-800/90 bg-[#0D1322]/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/30">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-base sm:text-lg">Instagram Event Simulator</h2>
                      <p className="text-xs text-slate-400">
                        Test comment automation rules instantly without needing a live Meta account.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleRunSimulation} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Commenter Username
                      </label>
                      <div className="mt-1.5 relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm">
                          @
                        </span>
                        <input
                          type="text"
                          required
                          value={simForm.username}
                          onChange={(e) =>
                            setSimForm({ ...simForm, username: e.target.value })
                          }
                          placeholder="rahul_creator"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Comment Text
                      </label>
                      <input
                        type="text"
                        required
                        value={simForm.commentText}
                        onChange={(e) =>
                          setSimForm({ ...simForm, commentText: e.target.value })
                        }
                        placeholder="e.g. Please send the link or book!"
                        className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 self-center">Quick tests:</span>
                        {["Send link please", "App", "PDF guide", "Free course", "What is the price?"].map(
                          (sample) => (
                            <button
                              key={sample}
                              type="button"
                              onClick={() => setSimForm({ ...simForm, commentText: sample })}
                              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 px-2.5 py-1 text-xs text-slate-300 transition"
                            >
                              {sample}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Reel / Post ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={simForm.mediaId}
                        onChange={(e) =>
                          setSimForm({ ...simForm, mediaId: e.target.value })
                        }
                        placeholder="reel_test_101"
                        className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={simulating}
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 py-3 text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition disabled:opacity-50 active:scale-95"
                    >
                      {simulating ? "Processing comment..." : "Simulate Comment Event →"}
                    </button>
                  </form>
                </div>

                {/* Simulator Output Preview with Phone Mockup */}
                <div className="rounded-2xl border border-slate-800/90 bg-[#0D1322]/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base sm:text-lg">Live Execution Breakdown</h3>
                    <p className="text-xs text-slate-400">
                      Step-by-step breakdown of rule matching &amp; DM dispatch
                    </p>

                    {simResult ? (
                      <div className="mt-6 space-y-4">
                        <div
                          className={`rounded-xl p-4 border ${
                            simResult.matched
                              ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-200"
                              : "bg-slate-900 border-slate-800 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {simResult.matched ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-slate-400" />
                            )}
                            <span className="font-bold text-sm">
                              {simResult.matched ? "Rule Triggered Successfully!" : "No Trigger Keyword Matched"}
                            </span>
                          </div>

                          {simResult.matched && (
                            <p className="mt-1 text-xs text-emerald-300 font-medium">
                              Rule: <span className="font-semibold text-white">{simResult.ruleName}</span> | Keywords:{" "}
                              <span className="font-mono text-emerald-400">{simResult.matchedKeywords?.join(", ")}</span>
                            </p>
                          )}
                        </div>

                        {simResult.replyText && (
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Step 1: Public Comment Reply (Posted on Reel)
                            </span>
                            <div className="mt-2 flex items-start gap-2.5 bg-slate-900 p-3 rounded-lg border border-slate-800">
                              <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                                VM
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold text-slate-300">@vyaparmitraapp</p>
                                <p className="text-xs text-white font-medium mt-0.5">
                                  💬 &ldquo;{simResult.replyText}&rdquo;
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {simResult.dmText && (
                          <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/30 p-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                              Step 2: Private Direct Message (DM)
                            </span>
                            <div className="mt-2 bg-slate-900 p-3.5 rounded-xl border border-indigo-900/50">
                              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                                <InstagramIcon className="h-3.5 w-3.5 text-pink-400" />
                                <span>Direct Message to @{simForm.username}</span>
                              </div>
                              <p className="mt-2 text-xs leading-relaxed text-slate-200 font-mono">
                                {simResult.dmText}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-14 text-center text-slate-500 py-6">
                        <Sparkles className="mx-auto h-10 w-10 text-slate-600 animate-pulse" />
                        <p className="mt-3 text-sm font-semibold text-slate-300">Ready to simulate</p>
                        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                          Enter a test comment on the left to see the instant live public reply and private DM simulation here.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 rounded-xl bg-slate-950 p-3.5 border border-slate-800 text-xs text-slate-400">
                    💡 <strong>Pro Tip:</strong> You can define custom variables like <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[11px]">&#123;username&#125;</code> in your DM text to automatically address the user!
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-8 max-w-4xl">
                {/* Webhook Configuration Card */}
                <div className="rounded-2xl border border-slate-800/90 bg-[#0D1322]/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">1. Meta Webhook Credentials</h2>
                      <p className="mt-1 text-xs text-slate-400">
                        Copy these into Meta for Developers &gt; App Dashboard &gt; Webhooks &gt; Instagram.
                      </p>
                    </div>
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Callback URL (Webhook URL)
                      </label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={webhookUrl}
                          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-xs text-emerald-300 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(webhookUrl, "settingsWebhook")}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 shadow-sm hover:bg-slate-700 hover:text-white transition"
                        >
                          {copiedField === "settingsWebhook" ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Verify Token
                      </label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={settings.metaVerifyToken}
                          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-xs text-emerald-300 select-all"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(settings.metaVerifyToken, "settingsToken")
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 shadow-sm hover:bg-slate-700 hover:text-white transition"
                        >
                          {copiedField === "settingsToken" ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* API Credentials Form */}
                <div className="rounded-2xl border border-slate-800/90 bg-[#0D1322]/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">2. Official Meta Graph API Credentials</h2>
                      <p className="mt-1 text-xs text-slate-400">
                        Connect your Instagram Business Account to enable live automated public replies and private DMs.
                      </p>
                    </div>
                  </div>

                  {settingsSuccess && (
                    <div className="mt-4 rounded-xl bg-emerald-950/80 border border-emerald-800/80 p-3 text-xs font-semibold text-emerald-300 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Settings updated successfully in MongoDB Atlas!
                    </div>
                  )}

                  <form onSubmit={handleSaveSettings} className="mt-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Page Access Token (Instagram &amp; Facebook Page Token)
                        </label>
                        {settings.hasPageAccessToken && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-800/60 shadow-[0_0_10px_rgba(52,211,153,0.15)]">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            Saved &amp; Active
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 relative">
                        <input
                          type={showToken ? "text" : "password"}
                          value={settingsForm.pageAccessToken}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              pageAccessToken: e.target.value,
                            })
                          }
                          placeholder={
                            settings.hasPageAccessToken
                              ? `Configured (${settings.pageAccessTokenMasked})`
                              : "Paste your EAAL... token here"
                          }
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 pr-10 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Requires <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">instagram_basic</code>,{" "}
                        <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">instagram_manage_comments</code> &amp;{" "}
                        <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">instagram_manage_messages</code> permissions.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Instagram Business Account ID
                        </label>
                        <input
                          type="text"
                          value={settingsForm.instagramAccountId}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              instagramAccountId: e.target.value,
                            })
                          }
                          placeholder="e.g. 17841448696038408"
                          className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Facebook Page ID
                        </label>
                        <input
                          type="text"
                          value={settingsForm.pageId}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              pageId: e.target.value,
                            })
                          }
                          placeholder="e.g. 950092798195289"
                          className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Meta App ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={settingsForm.metaAppId}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              metaAppId: e.target.value,
                            })
                          }
                          placeholder="e.g. 1129392723013211"
                          className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Meta App Secret (Optional)
                        </label>
                        <input
                          type="password"
                          value={settingsForm.metaAppSecret}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              metaAppSecret: e.target.value,
                            })
                          }
                          placeholder={settings.hasAppSecret ? "••••••••••••" : "App Secret"}
                          className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {subscribeStatus && (
                      <div className="rounded-xl bg-indigo-950/60 border border-indigo-800/80 p-3 text-xs font-semibold text-indigo-300">
                        {subscribeStatus}
                      </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 px-6 py-3 sm:py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition disabled:opacity-50 text-center active:scale-95"
                      >
                        {savingSettings ? "Saving Settings..." : "Save Meta Credentials"}
                      </button>

                      <button
                        type="button"
                        onClick={handleSubscribePage}
                        disabled={subscribing}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 sm:py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-50 text-center active:scale-95"
                      >
                        {subscribing ? "Subscribing Page..." : "🔗 Subscribe Page to Webhooks (1-Click)"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Direct Links & Setup Guide */}
                <div className="rounded-2xl border border-slate-800/90 bg-[#0D1322]/90 p-5 sm:p-8 shadow-xl backdrop-blur-xl">
                  <h3 className="font-bold text-sm sm:text-base text-white">Direct Meta Access Links &amp; Setup Guide</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <a
                      href="https://developers.facebook.com/tools/explorer/?app_id=1129392723013211"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:border-emerald-500/40 transition group"
                    >
                      <div className="flex items-center justify-between text-emerald-400">
                        <span className="font-bold text-xs uppercase tracking-wider">Graph API Explorer</span>
                        <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Select Page &apos;Vyapar Mitra App&apos; and generate instant access token.
                      </p>
                    </a>

                    <a
                      href="https://business.facebook.com/settings/system-users"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:border-violet-500/40 transition group"
                    >
                      <div className="flex items-center justify-between text-violet-400">
                        <span className="font-bold text-xs uppercase tracking-wider">System Users</span>
                        <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Assign Facebook Page &amp; Instagram Account under &apos;Assign Assets&apos;.
                      </p>
                    </a>

                    <a
                      href="https://developers.facebook.com/apps/1129392723013211/webhooks/"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:border-blue-500/40 transition group"
                    >
                      <div className="flex items-center justify-between text-blue-400">
                        <span className="font-bold text-xs uppercase tracking-wider">Webhooks Setup</span>
                        <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Subscribe to &apos;comments&apos; field on Instagram Webhook object.
                      </p>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-800/90 bg-[#090D16]/95 px-2 py-2 backdrop-blur-2xl shadow-2xl lg:hidden">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 transition text-[11px] font-semibold active:scale-95 ${
            activeTab === "overview"
              ? "text-emerald-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === "overview" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : ""}`}>
            <Activity className="h-4 w-4" />
          </div>
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 transition text-[11px] font-semibold active:scale-95 ${
            activeTab === "rules"
              ? "text-emerald-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === "rules" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : ""}`}>
            <Layers className="h-4 w-4" />
          </div>
          <span>Rules</span>
          {rules.length > 0 && (
            <span className="absolute top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-slate-950 shadow-sm">
              {rules.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("simulator")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 transition text-[11px] font-semibold active:scale-95 ${
            activeTab === "simulator"
              ? "text-emerald-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === "simulator" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : ""}`}>
            <Sparkles className="h-4 w-4" />
          </div>
          <span>Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 transition text-[11px] font-semibold active:scale-95 ${
            activeTab === "settings"
              ? "text-emerald-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === "settings" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : ""}`}>
            <SettingsIcon className="h-4 w-4" />
          </div>
          <span>Settings</span>
        </button>
      </nav>

      {/* CREATE RULE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1322] border border-slate-800 p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">Create Automation Rule</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">Auto reply to comments and send direct messages</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="mt-4 sm:mt-5 space-y-3.5 sm:space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g. Free E-book Reel Giveaway"
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Trigger Keywords (Comma separated)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewRule({ ...newRule, keywords: newRule.keywords ? newRule.keywords + ", *" : "*" })}
                    className="text-[10px] text-emerald-400 hover:underline"
                  >
                    + Add * (Wildcard All)
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newRule.keywords}
                  onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })}
                  placeholder="e.g. link, pdf, price, course, free"
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  When a comment contains any of these keywords, the automation triggers.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Private DM Message (Sent to Inbox)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewRule({ ...newRule, dmMessage: newRule.dmMessage + " {username}" })}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    + Insert &#123;username&#125;
                  </button>
                </div>
                <textarea
                  required
                  rows={3}
                  value={newRule.dmMessage}
                  onChange={(e) => setNewRule({ ...newRule, dmMessage: e.target.value })}
                  placeholder="Hey {username}! 🚀 Here is the link you requested: https://example.com/link"
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-base sm:text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Use <code className="text-emerald-400 font-bold">&#123;username&#125;</code> to insert the commenter&apos;s username dynamically.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Public Comment Replies (1 per line for Anti-Spam rotation)
                </label>
                <textarea
                  rows={3}
                  value={newRule.commentReplies}
                  onChange={(e) => setNewRule({ ...newRule, commentReplies: e.target.value })}
                  placeholder="Check your DM! 📩&#10;Sent to your inbox! Check messages ✨"
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-base sm:text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Multiple variations prevent Instagram from flagging automated replies as spam.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoLike"
                  checked={newRule.autoLike}
                  onChange={(e) => setNewRule({ ...newRule, autoLike: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="autoLike" className="text-xs text-slate-300 font-medium">
                  Automatically like the user&apos;s comment
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 sm:flex-initial rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRule}
                  className="flex-1 sm:flex-initial rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition text-center"
                >
                  {creatingRule ? "Creating..." : "Save Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

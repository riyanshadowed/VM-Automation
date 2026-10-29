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
} from "lucide-react";

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
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        {/* Mobile Slide-Over Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white p-5 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.png"
                      alt="VyaparMitra Logo"
                      className="h-11 w-11 rounded-xl object-contain border border-slate-200/80 bg-white shadow-sm p-0.5"
                    />
                    <div>
                      <p className="font-extrabold tracking-tight text-slate-900 leading-tight text-base">
                        Vyapar<span className="text-emerald-600">Mitra</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[11px] text-slate-500 font-medium">Auto-DM &amp; Growth</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
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
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="h-4 w-4" />
                      <span>Automations</span>
                    </div>
                    <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs text-slate-700">
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
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <span>Test Simulator</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("settings");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 transition ${
                      activeTab === "settings"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <SettingsIcon className="h-4 w-4" />
                    <span>Meta API Settings</span>
                  </button>
                </nav>
              </div>

              {/* Mobile Drawer Bottom Info */}
              <div className="pt-4 border-t border-slate-100">
                <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3.5">
                  <div className="flex items-center gap-2 text-violet-900">
                    <Shield className="h-4 w-4 text-violet-600" />
                    <p className="text-xs font-semibold uppercase tracking-wider">Meta Graph API</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px]">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        dbStatus.isAtlas
                          ? dbStatus.isConnected
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-rose-500"
                          : "bg-blue-500"
                      }`}
                    ></span>
                    <span className="font-semibold text-slate-800">{dbStatus.type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-5 py-6 lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <img
              src="/logo.png"
              alt="VyaparMitra Logo"
              className="h-11 w-11 rounded-xl object-contain border border-slate-200/80 bg-white shadow-sm p-0.5"
            />
            <div>
              <p className="font-extrabold tracking-tight text-slate-900 leading-tight text-lg">
                Vyapar<span className="text-emerald-600">Mitra</span>
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs text-slate-500 font-medium">Auto-DM &amp; Growth</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-sm font-medium">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("rules")}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition ${
                activeTab === "rules"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4" />
                <span>Automations</span>
              </div>
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs text-slate-700">
                {rules.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("simulator")}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${
                activeTab === "simulator"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span>Test Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${
                activeTab === "settings"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <SettingsIcon className="h-4 w-4" />
              <span>Meta API Settings</span>
            </button>
          </nav>

          {/* Quick Info Box in sidebar bottom */}
          <div className="mt-auto pt-6">
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
              <div className="flex items-center gap-2 text-violet-900">
                <Shield className="h-4 w-4 text-violet-600" />
                <p className="text-xs font-semibold uppercase tracking-wider">Meta Graph API</p>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-violet-800">
                Comment-to-DM triggers are live and anti-spam protected.
              </p>
              <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-violet-200/60 text-[11px]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    dbStatus.isAtlas
                      ? dbStatus.isConnected
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-rose-500"
                      : "bg-blue-500"
                  }`}
                ></span>
                <span className="font-semibold text-slate-800">{dbStatus.type}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-8 sm:py-3.5 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Drawer Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition active:scale-95"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Brand Logo on Mobile */}
              <img
                src="/logo.png"
                alt="VyaparMitra"
                className="lg:hidden h-8 w-8 rounded-lg object-contain border border-slate-200/80 bg-white p-0.5 shrink-0"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                    VyaparMitra
                  </span>
                  <span className="text-slate-300 hidden xs:inline">•</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-500 capitalize hidden xs:inline">
                    {activeTab}
                  </span>
                </div>
                <h1 className="text-sm sm:text-lg font-extrabold tracking-tight text-slate-900 truncate">
                  {activeTab === "overview" && "Instagram Automation Dashboard"}
                  {activeTab === "rules" && "Comment-to-DM Rules"}
                  {activeTab === "simulator" && "Event Simulator"}
                  {activeTab === "settings" && "Meta API Credentials"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Account Connection Pill */}
              <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-1.5 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-slate-700">@vyaparmitraapp</span>
              </div>

              <button
                onClick={fetchData}
                disabled={refreshing}
                title="Refresh data"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition active:scale-95"
              >
                <RefreshCw className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95 shadow-emerald-600/20"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">New Rule</span>
              </button>
            </div>
          </header>

          {/* Page Body */}
          <div className="flex-1 p-3.5 sm:p-6 lg:p-10 space-y-5 sm:space-y-8 pb-24 lg:pb-10">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <>
                {/* Hero Banner with VyaparMitra Brand Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-4 sm:p-8 text-white shadow-xl border border-slate-800">
                  <div className="absolute right-6 -bottom-6 opacity-15 pointer-events-none hidden md:block">
                    <img src="/logo.png" alt="" className="h-44 w-44 object-contain rounded-2xl" />
                  </div>
                  <div className="relative z-10 max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-300 backdrop-blur-sm border border-emerald-500/30">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                      VyaparMitra AI Auto-DM Engine
                    </span>
                    <h2 className="mt-3 sm:mt-4 text-lg sm:text-2xl font-extrabold tracking-tight">
                      Reel &amp; Post Comments ko Direct Customers &amp; Leads me badlein.
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
                      Jab koi follower aapke Reel ya Post par keyword comment karega (jaise &ldquo;PRICE&rdquo;, &ldquo;LINK&rdquo;, &ldquo;PDF&rdquo;),
                      VyaparMitra instantly public comment reply dega aur direct message (DM) me link send karega.
                    </p>

                    <div className="mt-5 sm:mt-6 flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5">
                      <button
                        onClick={() => setActiveTab("simulator")}
                        className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 shadow-md shadow-emerald-500/20 text-center active:scale-95"
                      >
                        Try Live Simulator →
                      </button>
                      <button
                        onClick={() => setActiveTab("rules")}
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15 text-center active:scale-95"
                      >
                        Manage Rules ({rules.length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
                  <article className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Processed
                      </p>
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {stats.commentsProcessed}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">Comments received</p>
                  </article>

                  <article className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Triggered
                      </p>
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {stats.matchedComments}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">Automations matched</p>
                  </article>

                  <article className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                        DMs Sent
                      </p>
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600">
                      {stats.successfulDMs}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">Delivered to inbox</p>
                  </article>

                  <article className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Active Rules
                      </p>
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      {stats.activeRulesCount}{" "}
                      <span className="text-xs sm:text-sm font-normal text-slate-400">/ {rules.length}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">Running automations</p>
                  </article>
                </div>

                {/* Webhook & Setup Quick Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h3 className="font-semibold text-sm sm:text-base text-slate-900">Your Meta Webhook Endpoint</h3>
                      </div>
                      <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                        Use this endpoint in your Meta Developer App &gt; Webhooks &gt; Instagram.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <code className="flex-1 md:flex-initial rounded-lg bg-slate-100 px-3 py-2 font-mono text-[11px] sm:text-xs text-slate-700 break-all select-all">
                        {webhookUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(webhookUrl, "webhook")}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition active:scale-95"
                      >
                        {copiedField === "webhook" ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Copied!</span>
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
                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 p-4 sm:px-6 gap-3">
                    <div>
                      <h2 className="font-bold text-sm sm:text-base text-slate-900">Recent Activity Logs</h2>
                      <p className="text-[11px] sm:text-xs text-slate-500">Real-time incoming comments &amp; automated responses</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                      <div className="flex overflow-x-auto no-scrollbar rounded-lg bg-slate-100 p-1 text-xs font-medium max-w-full">
                        {(["all", "success", "ignored", "failed"] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setLogFilter(filter)}
                            className={`rounded-md px-2.5 py-1 capitalize transition shrink-0 ${
                              logFilter === filter
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>

                      {logs.length > 0 && (
                        <button
                          onClick={handleClearLogs}
                          className="shrink-0 text-xs text-slate-400 hover:text-rose-600 transition px-2 py-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {filteredLogs.length === 0 ? (
                      <div className="p-8 text-center">
                        <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-2 text-sm font-medium text-slate-600">No events found</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Try running a test comment in the Test Simulator tab!
                        </p>
                      </div>
                    ) : (
                      filteredLogs.map((log) => (
                        <div key={log._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 gap-3 hover:bg-slate-50/60 transition">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                              {log.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs text-slate-900">@{log.username}</span>
                                {log.isSimulated && (
                                  <span className="rounded bg-violet-100 px-1.5 py-0.2 text-[10px] font-semibold text-violet-700">
                                    Simulated
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-400">
                                  {mounted
                                    ? new Date(log.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Recently"}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-slate-700 font-medium">
                                &ldquo;{log.commentText}&rdquo;
                              </p>

                              {log.matchedRuleName && (
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                                  <span className="text-slate-400">Rule:</span>
                                  <span className="rounded bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 border border-indigo-100/60">
                                    {log.matchedRuleName}
                                  </span>
                                  {log.matchedKeywords && log.matchedKeywords.length > 0 && (
                                    <span className="text-slate-500">
                                      (Keyword: {log.matchedKeywords.join(", ")})
                                    </span>
                                  )}
                                </div>
                              )}

                              {log.replyText && (
                                <p className="mt-1 text-[11px] text-slate-500">
                                  <span className="font-medium text-slate-600">Reply:</span> {log.replyText}
                                </p>
                              )}

                              {log.errorMessage && (
                                <p className="mt-1 text-[11px] text-rose-500 font-medium">
                                  {log.errorMessage}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                            {log.status === "success" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                DM Sent
                              </span>
                            )}
                            {log.status === "ignored" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                <Info className="h-3.5 w-3.5 text-slate-400" />
                                Ignored
                              </span>
                            )}
                            {log.status === "failed" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200/60">
                                <XCircle className="h-3.5 w-3.5 text-rose-600" />
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
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Active Keyword Rules</h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      Configure keywords, comment reply variations, and automatic direct messages.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition w-full sm:w-auto active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Automation Rule</span>
                  </button>
                </div>

                <div className="grid gap-3 sm:gap-4">
                  {rules.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center">
                      <Layers className="mx-auto h-10 w-10 text-slate-300" />
                      <h3 className="mt-3 text-base font-semibold text-slate-800">No automation rules yet</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Create your first rule to start automatically replying to Instagram comments.
                      </p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Create First Rule
                      </button>
                    </div>
                  ) : (
                    rules.map((rule) => (
                      <div
                        key={rule._id}
                        className={`rounded-2xl border transition bg-white p-4 sm:p-6 shadow-sm ${
                          rule.isActive
                            ? "border-slate-200/80"
                            : "border-slate-200/50 opacity-70 bg-slate-50/50"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm sm:text-base text-slate-900">{rule.name}</h3>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold ${
                                  rule.isActive
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {rule.isActive ? "Active" : "Paused"}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Triggered {rule.totalTriggered || 0} times
                              </span>
                            </div>

                            {/* Trigger Keywords */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[11px] font-medium text-slate-500">Keywords:</span>
                              {rule.triggerKeywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="rounded-md bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 text-[11px] font-medium text-indigo-700"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <button
                              onClick={() => toggleRule(rule._id, rule.isActive)}
                              className={`flex-1 sm:flex-initial rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                                rule.isActive
                                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                              }`}
                            >
                              {rule.isActive ? "Pause Automation" : "Activate"}
                            </button>

                            <button
                              onClick={() => handleDeleteRule(rule._id)}
                              className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition active:scale-95"
                              title="Delete Rule"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="mt-4 grid gap-3 sm:gap-4 rounded-xl bg-slate-50/80 p-3 sm:p-4 grid-cols-1 sm:grid-cols-2 border border-slate-100">
                          <div>
                            <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs">
                              <Send className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Private DM Message (Delivered to inbox)</span>
                            </div>
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-700 bg-white p-3 rounded-lg border border-slate-200/60 font-mono break-words">
                              {rule.dmMessage}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs">
                              <MessageSquare className="h-3.5 w-3.5 text-violet-600" />
                              <span>Public Comment Replies ({rule.commentReplies?.length || 0} variations)</span>
                            </div>
                            <div className="mt-1.5 space-y-1.5">
                              {rule.commentReplies?.slice(0, 3).map((reply, idx) => (
                                <p
                                  key={idx}
                                  className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 truncate"
                                >
                                  💬 &ldquo;{reply}&rdquo;
                                </p>
                              ))}
                              {(rule.commentReplies?.length || 0) > 3 && (
                                <p className="text-[11px] text-slate-400 pl-1">
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
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">Instagram Event Simulator</h2>
                      <p className="text-xs text-slate-500">
                        Test comment automation rules without needing a live Meta account.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleRunSimulation} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Commenter Username
                      </label>
                      <div className="mt-1.5 relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">
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
                          className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-[11px] text-slate-400 self-center">Quick tests:</span>
                        {["Send link please", "What is the price?", "PDF guide", "Free course", "Nice post!"].map(
                          (sample) => (
                            <button
                              key={sample}
                              type="button"
                              onClick={() => setSimForm({ ...simForm, commentText: sample })}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 transition"
                            >
                              {sample}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Reel / Post ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={simForm.mediaId}
                        onChange={(e) =>
                          setSimForm({ ...simForm, mediaId: e.target.value })
                        }
                        placeholder="reel_test_101"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={simulating}
                      className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      {simulating ? "Processing comment..." : "Simulate Comment Event →"}
                    </button>
                  </form>
                </div>

                {/* Simulator Output Preview */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">Execution Result</h3>
                    <p className="text-xs text-slate-500">
                      Step-by-step breakdown of rule matching &amp; DM dispatch
                    </p>

                    {simResult ? (
                      <div className="mt-6 space-y-4">
                        <div
                          className={`rounded-xl p-4 border ${
                            simResult.matched
                              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                              : "bg-slate-100 border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {simResult.matched ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-slate-500" />
                            )}
                            <span className="font-bold text-sm">
                              {simResult.matched ? "Rule Triggered Successfully!" : "No Trigger Keyword Matched"}
                            </span>
                          </div>

                          {simResult.matched && (
                            <p className="mt-1 text-xs text-emerald-800 font-medium">
                              Rule: <span className="font-semibold">{simResult.ruleName}</span> | Keywords:{" "}
                              <span className="font-semibold">{simResult.matchedKeywords?.join(", ")}</span>
                            </p>
                          )}
                        </div>

                        {simResult.replyText && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Step 1: Public Comment Reply
                            </span>
                            <p className="mt-1 text-xs font-semibold text-slate-800">
                              💬 &ldquo;{simResult.replyText}&rdquo;
                            </p>
                          </div>
                        )}

                        {simResult.dmText && (
                          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                              Step 2: Private Direct Message (DM)
                            </span>
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-800 font-medium bg-white p-3 rounded-lg border border-indigo-100">
                              {simResult.dmText}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-12 text-center text-slate-400">
                        <Sparkles className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-2 text-xs">
                          Run a simulation on the left to see the instant live result here.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 rounded-xl bg-slate-50 p-3.5 border border-slate-200/60 text-xs text-slate-500">
                    💡 <strong>Tip:</strong> You can define custom variables like <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono text-[11px]">&#123;username&#125;</code> in your DM text to automatically address the user!
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-8 max-w-4xl">
                {/* Webhook Configuration Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">1. Meta Webhook Credentials</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Copy these into Meta for Developers &gt; App Dashboard &gt; Webhooks &gt; Instagram.
                  </p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Callback URL (Webhook URL)
                      </label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={webhookUrl}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(webhookUrl, "settingsWebhook")}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                        >
                          {copiedField === "settingsWebhook" ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-600" />
                              <span>Copied</span>
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
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Verify Token
                      </label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={settings.metaVerifyToken}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(settings.metaVerifyToken, "settingsToken")
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                        >
                          {copiedField === "settingsToken" ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-600" />
                              <span>Copied</span>
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
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">2. Official Meta Graph API Credentials</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Connect your Instagram Business Account to enable live automated public replies and private DMs.
                  </p>

                  {settingsSuccess && (
                    <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Settings updated successfully!
                    </div>
                  )}

                  <form onSubmit={handleSaveSettings} className="mt-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Page Access Token (Instagram &amp; Facebook Page Token)
                        </label>
                        {settings.hasPageAccessToken && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
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
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-xs font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Requires <code className="text-slate-600">instagram_basic</code>,{" "}
                        <code className="text-slate-600">instagram_manage_comments</code> &amp;{" "}
                        <code className="text-slate-600">instagram_manage_messages</code> permissions.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
                          placeholder="e.g. 178414000000000"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
                          placeholder="e.g. 1092837482910"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
                          placeholder="e.g. 849201928374"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    {subscribeStatus && (
                      <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-xs font-semibold text-indigo-900">
                        {subscribeStatus}
                      </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="rounded-xl bg-slate-900 px-6 py-3 sm:py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50 text-center active:scale-95"
                      >
                        {savingSettings ? "Saving Settings..." : "Save Meta Credentials"}
                      </button>

                      <button
                        type="button"
                        onClick={handleSubscribePage}
                        disabled={subscribing}
                        className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 sm:py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50 text-center active:scale-95"
                      >
                        {subscribing ? "Subscribing Page..." : "🔗 Subscribe Page to Webhooks (1-Click)"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Step-by-Step Meta Developer Setup Guide */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-8 shadow-sm">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">Step-by-Step Meta Developer Setup Guide (Hinglish)</h3>
                  <div className="mt-4 space-y-4 text-xs text-slate-600 leading-relaxed">
                    <div className="border-l-2 border-indigo-500 pl-4 py-1">
                      <h4 className="font-semibold text-slate-900">Step 1: Meta Developer App Create Karein</h4>
                      <p>
                        <a
                          href="https://developers.facebook.com/apps"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                          developers.facebook.com <ExternalLink className="h-3 w-3" />
                        </a>{" "}
                        par jaakar <strong>&ldquo;Create App&rdquo;</strong> click karein aur App Type me <strong>&ldquo;Business&rdquo;</strong> select karein.
                      </p>
                    </div>

                    <div className="border-l-2 border-indigo-500 pl-4 py-1">
                      <h4 className="font-semibold text-slate-900">Step 2: Instagram Graph API &amp; Webhooks Add Karein</h4>
                      <p>
                        App dashboard me <strong>Webhooks</strong> aur <strong>Instagram Graph API</strong> products ko add karein.
                      </p>
                    </div>

                    <div className="border-l-2 border-indigo-500 pl-4 py-1">
                      <h4 className="font-semibold text-slate-900">Step 3: Webhook Setup &amp; Verification</h4>
                      <p>
                        Webhooks dropdown me <strong>&ldquo;Instagram&rdquo;</strong> select karein. Upar diye gaye <strong>Callback URL</strong> aur <strong>Verify Token</strong> ko paste karke &ldquo;Verify and Save&rdquo; karein. Phir <strong>comments</strong> field ko Subscribe karein.
                      </p>
                    </div>

                    <div className="border-l-2 border-indigo-500 pl-4 py-1">
                      <h4 className="font-semibold text-slate-900">Step 4: Page Access Token Generate Karein</h4>
                      <p>
                        Graph API Explorer ya App Roles me jaakar Page Token generate karein jisme ye permissions enabled hon:
                        <br />
                        <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">instagram_basic</code>,{" "}
                        <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">instagram_manage_comments</code>,{" "}
                        <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">instagram_manage_messages</code>,{" "}
                        <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">pages_show_list</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 py-1.5 backdrop-blur-lg shadow-[0_-4px_25px_rgba(0,0,0,0.06)] lg:hidden">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 transition text-[11px] font-semibold active:scale-95 ${
            activeTab === "overview"
              ? "text-emerald-700"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === "overview" ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30" : ""}`}>
            <Activity className="h-4 w-4" />
          </div>
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 transition text-[11px] font-semibold active:scale-95 ${
            activeTab === "rules"
              ? "text-emerald-700"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === "rules" ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30" : ""}`}>
            <Layers className="h-4 w-4" />
          </div>
          <span>Rules</span>
          {rules.length > 0 && (
            <span className="absolute top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white shadow-sm">
              {rules.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("simulator")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 transition text-[11px] font-semibold active:scale-95 ${
            activeTab === "simulator"
              ? "text-emerald-700"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === "simulator" ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30" : ""}`}>
            <Sparkles className="h-4 w-4" />
          </div>
          <span>Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 transition text-[11px] font-semibold active:scale-95 ${
            activeTab === "settings"
              ? "text-emerald-700"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === "settings" ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30" : ""}`}>
            <SettingsIcon className="h-4 w-4" />
          </div>
          <span>Settings</span>
        </button>
      </nav>

      {/* CREATE RULE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 sm:pb-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">Create Comment Automation Rule</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Auto reply to comments and send direct messages</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="mt-4 sm:mt-5 space-y-3.5 sm:space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g. Free E-book Reel Giveaway"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Trigger Keywords (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={newRule.keywords}
                  onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })}
                  placeholder="e.g. link, pdf, price, course, free"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  When a comment contains any of these keywords, the automation triggers.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Private DM Message (Sent to Inbox)
                </label>
                <textarea
                  required
                  rows={3}
                  value={newRule.dmMessage}
                  onChange={(e) => setNewRule({ ...newRule, dmMessage: e.target.value })}
                  placeholder="Hey {username}! 🚀 Here is the link you requested: https://example.com/link"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-base sm:text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-mono"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Use <code className="text-indigo-600 font-bold">&#123;username&#125;</code> to insert the commenter&apos;s username dynamically.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Public Comment Replies (1 per line for Anti-Spam rotation)
                </label>
                <textarea
                  rows={3}
                  value={newRule.commentReplies}
                  onChange={(e) => setNewRule({ ...newRule, commentReplies: e.target.value })}
                  placeholder="Check your DM! 📩&#10;Sent to your inbox! Check messages ✨"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-base sm:text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Multiple variations prevent Instagram from flagging automated replies as spam.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoLike"
                  checked={newRule.autoLike}
                  onChange={(e) => setNewRule({ ...newRule, autoLike: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-0"
                />
                <label htmlFor="autoLike" className="text-xs text-slate-700 font-medium">
                  Automatically like the user&apos;s comment
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 sm:flex-initial rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRule}
                  className="flex-1 sm:flex-initial rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 text-center"
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

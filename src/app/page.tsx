"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Search, 
  ShieldAlert, 
  FileText, 
  Download, 
  ChevronRight, 
  ShieldCheck, 
  FileCheck,
  ArrowLeft,
  Scale,
  AlertTriangle,
  Building2,
  Lock,
  User,
  LogOut,
  PanelLeft,
  Plus,
  Trash2,
  Clock,
  History,
  MessageSquare,
  X
} from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  organization?: string;
  role?: string;
}

// Types
type Risk = {
  area: string;
  severity: number;
  description: string;
};

type Source = {
  title: string;
  status: string;
  excerpt: string;
  section?: string;
  verified?: boolean;
};

type AnswerData = {
  isOutOfScope?: boolean;
  conclusion: string;
  whyItMatters: string;
  risks: Risk[];
  sources: Source[];
};

type HistoryItem = {
  id: string;
  query: string;
  tagline?: string;
  timestamp: number;
  answer: AnswerData;
};

export default function DiraIntelligenceTerminal() {
  const [state, setState] = useState<"LOGIN" | "ASK" | "LOADING" | "ANSWER">("LOGIN");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<AnswerData | null>(null);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Search history state - strictly isolated to current authenticated user
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [historySearch, setHistorySearch] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch search history directly from database for the active user
  const fetchUserHistory = async (userId: string) => {
    try {
      const res = await fetch(`/api/history?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.history)) {
          setHistory(data.history);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote user history from database:", e);
    }
  };

  // Restore authenticated session and fetch that user's history
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dira_auth_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.id) {
          setCurrentUser(user);
          setState("ASK");
          fetchUserHistory(user.id);
        } else {
          setHistory([]);
        }
      } else {
        // Not logged in: Ensure zero history leakage
        setHistory([]);
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
      setHistory([]);
    }

    if (typeof window !== "undefined") {
      setIsSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setQuery(item.query);
    setAnswer(item.answer);
    setState("ANSWER");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Optimistic local state update
    setHistory((prev) => prev.filter((item) => item.id !== id));

    // Delete record from database verifying user ownership
    if (currentUser?.id) {
      try {
        await fetch(`/api/history?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(currentUser.id)}`, {
          method: "DELETE"
        });
      } catch (err) {
        console.error("Failed to delete history item from database:", err);
      }
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Permanently clear all your search history from the database?")) {
      // Optimistic local wipe
      setHistory([]);

      // Wipe all user records from database
      if (currentUser?.id) {
        try {
          await fetch(`/api/history?all=true&userId=${encodeURIComponent(currentUser.id)}`, {
            method: "DELETE"
          });
        } catch (err) {
          console.error("Failed to clear history from database:", err);
        }
      }
    }
  };

  // Strict Access Guard: If user is not authenticated, strictly lock to LOGIN state
  useEffect(() => {
    if (!currentUser && state !== "LOGIN") {
      setState("LOGIN");
      setQuery("");
      setAnswer(null);
    }
  }, [currentUser, state]);

  const handleNewQuestion = () => {
    if (!currentUser) {
      setState("LOGIN");
      return;
    }
    setState("ASK");
    setQuery("");
    setAnswer(null);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const filteredHistory = history.filter((item) =>
    item.query.toLowerCase().includes(historySearch.toLowerCase()) ||
    (item.tagline && item.tagline.toLowerCase().includes(historySearch.toLowerCase()))
  );

  const researchMilestones = [
    "Checking Kenyan statutory laws and regulations...",
    "Reviewing data protection and cloud directives...",
    "Verifying official legal citations and section numbers...",
    "Preparing your compliance answer..."
  ];

  // Auto-rotate research status during loading
  useEffect(() => {
    if (state === "LOADING") {
      setLoadingStep(0);
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % researchMilestones.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [state]);

  // Auto-focus input on ASK state
  useEffect(() => {
    if (state === "ASK" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state]);

  // Rigorous Logout: Purge active session and wipe history state immediately
  const handleLogout = () => {
    localStorage.removeItem("dira_auth_user");
    localStorage.removeItem("dira_auth_token");
    localStorage.removeItem("dira_query_history");
    setCurrentUser(null);
    setHistory([]); // ZERO LEAKAGE: Empty history immediately
    setState("LOGIN");
    setQuery("");
    setAnswer(null);
  };

  const handleSubmit = async (overrideQuery?: string) => {
    if (!currentUser) {
      setState("LOGIN");
      return;
    }

    const targetQuery = overrideQuery || query;
    if (!targetQuery.trim()) return;

    if (overrideQuery) setQuery(overrideQuery);
    setState("LOADING");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: targetQuery, userId: currentUser.id }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setAnswer(data);
      setState("ANSWER");

      const tagline = data.tagline || (targetQuery.length > 40 ? targetQuery.slice(0, 40) + '...' : targetQuery);

      // Optimistic update of local user history
      const tempId = Date.now().toString();
      const historyEntry: HistoryItem = {
        id: tempId,
        query: targetQuery,
        tagline: tagline,
        timestamp: Date.now(),
        answer: data,
      };

      setHistory((prev) => {
        const filtered = prev.filter(
          (item) => item.query.trim().toLowerCase() !== targetQuery.trim().toLowerCase()
        );
        return [historyEntry, ...filtered].slice(0, 50);
      });

      // Synchronize directly with Supabase database for authenticated user
      if (currentUser?.id) {
        try {
          const histRes = await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.id,
              query: targetQuery,
              tagline: tagline,
              answer: data
            })
          });
          if (histRes.ok) {
            const histData = await histRes.json();
            if (histData.item?.id) {
              setHistory((prev) =>
                prev.map((item) => (item.id === tempId ? { ...item, id: histData.item.id } : item))
              );
            }
          }
        } catch (dbSyncErr) {
          console.error("Failed to sync query history to database:", dbSyncErr);
        }
      }

    } catch (err) {
      console.error(err);
      setAnswer({
        conclusion: "Unable to retrieve legal and regulatory information.",
        whyItMatters: "A connection issue occurred while searching the knowledge base. Please try asking again.",
        risks: [],
        sources: []
      });
      setState("ANSWER");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Verdict status styling for dark theme and print
  const getVerdictStyle = (conclusion: string, isOutOfScope?: boolean) => {
    if (isOutOfScope) {
      return {
        label: "OUT OF SCOPE",
        bg: "bg-[#1E1508] print:bg-amber-50",
        border: "border-[#8A5C1B] print:border-amber-300",
        text: "text-[#FBBF24] print:text-amber-800",
        indicator: "bg-[#F59E0B]"
      };
    }
    const text = (conclusion || "").toUpperCase();
    if (text.includes("UNVERIFIED")) {
      return {
        label: "UNVERIFIED LEGAL AUTHORITY",
        bg: "bg-[#251215] print:bg-rose-50",
        border: "border-[#991B1B] print:border-rose-300",
        text: "text-[#F87171] print:text-rose-800",
        indicator: "bg-[#DC2626]"
      };
    }
    if (text.includes("PROHIBITED") || text.includes("FATAL REGULATORY RISK") || text.includes("RESTRICTION") || text.includes("NOT PERMITTED")) {
      return {
        label: "NOT PERMITTED / HIGH RISK",
        bg: "bg-[#1E0E11] print:bg-red-50",
        border: "border-[#8A232D] print:border-red-300",
        text: "text-[#FF6B72] print:text-red-800",
        indicator: "bg-[#EF4444]"
      };
    }
    if (text.includes("CONDITIONALLY ALLOWED") || text.includes("RESTRICTED") || text.includes("HIGH REGULATORY RISK")) {
      return {
        label: "CONDITIONALLY ALLOWED",
        bg: "bg-[#1E1508] print:bg-amber-50",
        border: "border-[#8A5C1B] print:border-amber-300",
        text: "text-[#FBBF24] print:text-amber-800",
        indicator: "bg-[#F59E0B]"
      };
    }
    if (text.includes("COMPLIANT") || text.includes("PERMITTED") || text.includes("ALLOWED") || text.includes("AUTHORIZED")) {
      return {
        label: "PERMITTED / COMPLIANT",
        bg: "bg-[#091D14] print:bg-emerald-50",
        border: "border-[#1B5E3C] print:border-emerald-300",
        text: "text-[#34D399] print:text-emerald-800",
        indicator: "bg-[#10B981]"
      };
    }
    return {
      label: "REGULATORY GUIDANCE",
      bg: "bg-[#0F172A] print:bg-blue-50",
      border: "border-[#1E3A8A] print:border-blue-300",
      text: "text-[#60A5FA] print:text-blue-800",
      indicator: "bg-[#3B82F6]"
    };
  };

  return (
    <div className="min-h-screen w-full bg-[#000000] text-neutral-100 flex flex-col font-sans selection:bg-[#C8A97E]/30 selection:text-white print:bg-white print:text-slate-900">
      
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-[#1A1A1A] bg-[#000000] px-6 py-4 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Hide search history" : "Show search history"}
            className="p-1.5 px-2.5 rounded-lg bg-[#111111] hover:bg-[#1A1A1A] border border-[#262626] text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
          >
            <PanelLeft className="w-4 h-4 text-[#C8A97E]" />
            <span className="hidden sm:inline text-xs font-medium text-neutral-200">History</span>
            {history.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#181818] text-[#C8A97E] border border-[#333333]">
                {history.length}
              </span>
            )}
          </button>

          <div className="w-8 h-8 rounded-lg bg-[#111111] border border-[#242424] flex items-center justify-center">
            <Scale className="w-4 h-4 text-[#C8A97E]" />
          </div>
          <div>
            <span className="font-bold tracking-wider text-sm text-white">
              DIRA INTELLIGENCE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {state === "ANSWER" && (
            <div className="flex items-center gap-2.5 mr-2">
              <button
                onClick={() => {
                  if (!currentUser) {
                    setState("LOGIN");
                    return;
                  }
                  setState("ASK");
                  setQuery("");
                  setAnswer(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#111111] hover:bg-[#1A1A1A] border border-[#262626] text-neutral-300 hover:text-white text-xs font-medium transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-neutral-400" />
                <span>Ask Another Question</span>
              </button>
              <button 
                onClick={() => window.print()} 
                className="px-3.5 py-1.5 rounded-lg bg-[#C8A97E] hover:bg-[#D4BA96] text-[#000000] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          )}

          {currentUser ? (
            <div className="flex items-center gap-3 pl-3 border-l border-[#222222]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center text-xs font-bold text-[#C8A97E]">
                  {(currentUser.fullName || currentUser.email).charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {currentUser.fullName || currentUser.email}
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    {currentUser.role || currentUser.organization || "Executive"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#161616] rounded-lg border border-transparent hover:border-[#262626] transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#1A1A1A] border border-[#262626] text-neutral-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 rounded-lg bg-[#C8A97E] hover:bg-[#D4BA96] text-[#000000] text-xs font-semibold transition-all cursor-pointer"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Workspace Container with History Sidebar */}
      <div className="flex-1 w-full flex overflow-hidden relative">
        
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden print:hidden" 
          />
        )}

        {/* Search & Response History Sidebar */}
        <aside
          className={`
            ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0 lg:w-0'}
            fixed lg:static inset-y-0 left-0 z-40 lg:z-auto
            h-[calc(100vh-65px)] bg-[#070707] border-r border-[#1C1C1C]
            flex flex-col transition-all duration-300 ease-in-out
            overflow-hidden shrink-0 print:hidden
          `}
        >
          {/* Sidebar Top: Header & New Question */}
          <div className="p-3.5 border-b border-[#1A1A1A] flex flex-col gap-2.5 bg-[#0A0A0A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#C8A97E]" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  Recent Inquiries
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#181818] border border-[#262626] text-[#C8A97E]">
                  {history.length}
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Close sidebar"
                className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-[#161616] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {currentUser ? (
              <button
                onClick={handleNewQuestion}
                className="w-full py-2 px-3 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#2B2B2B] hover:border-[#C8A97E]/50 text-white text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#C8A97E]" />
                <span>Ask New Question</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="w-full py-2 px-3 rounded-xl bg-[#C8A97E] hover:bg-[#D4BA96] text-black text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-black" />
                <span>Sign In to Ask Questions</span>
              </Link>
            )}
          </div>

          {/* Search/Filter Bar (if 2+ items) */}
          {history.length > 2 && (
            <div className="px-3 pt-2.5 pb-1 bg-[#070707]">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F0F0F] border border-[#222222] focus-within:border-[#C8A97E]/60 text-xs">
                <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Filter past questions..."
                  className="bg-transparent text-white placeholder:text-neutral-500 text-xs outline-none w-full"
                />
                {historySearch && (
                  <button 
                    onClick={() => setHistorySearch("")}
                    className="text-neutral-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* History Item List */}
          <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5">
            {!currentUser ? (
              <div className="py-12 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                <p className="text-xs text-neutral-300 font-medium">
                  Sign in to access your inquiries
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Search history is private and isolated to authenticated executive accounts.
                </p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                <p className="text-xs text-neutral-300 font-medium">
                  {history.length === 0 ? "No search history yet" : "No matching questions"}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {history.length === 0
                    ? "Questions and legal answers you view will appear here for fast review."
                    : "Try searching with different terms."}
                </p>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isSelected = item.query.trim().toLowerCase() === query.trim().toLowerCase() && state === "ANSWER";
                const verdict = getVerdictStyle(item.answer?.conclusion || "", item.answer?.isOutOfScope);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistory(item)}
                    className={`
                      group relative p-3 rounded-xl border text-left cursor-pointer transition-all duration-150
                      ${isSelected 
                        ? 'bg-[#141414] border-[#C8A97E]/70 shadow-xs' 
                        : 'bg-[#0A0A0A] hover:bg-[#121212] border-[#1C1C1C] hover:border-[#2A2A2A]'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold leading-snug line-clamp-1 ${isSelected ? 'text-[#C8A97E]' : 'text-neutral-100 group-hover:text-white'}`}>
                          {item.tagline || item.query}
                        </p>
                        <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5 group-hover:text-neutral-300">
                          {item.query}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                        title="Delete question from history"
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 hover:bg-[#1C1C1C] rounded transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#161616]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${verdict.indicator}`} />
                        <span className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                          {verdict.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer */}
          {history.length > 0 && (
            <div className="p-3 border-t border-[#1A1A1A] bg-[#0A0A0A] flex items-center justify-between text-xs">
              <span className="text-[11px] text-neutral-400">
                {history.length} {history.length === 1 ? 'saved inquiry' : 'saved inquiries'}
              </span>
              <button
                onClick={handleClearHistory}
                className="text-[11px] text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </aside>

        {/* Main Screen Container */}
        <main className="flex-1 w-full overflow-y-auto flex flex-col items-center justify-start p-4 sm:p-8 md:p-10 max-w-6xl mx-auto print:p-0 print:m-0 print:max-w-full print:block">
        <AnimatePresence mode="wait">
          
          {/* --- STATE 0: LOGIN --- */}
          {state === "LOGIN" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="my-auto flex flex-col items-center max-w-md w-full bg-[#0A0A0A] border border-[#222222] p-8 sm:p-10 rounded-2xl shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-center mb-6">
                <Scale className="w-8 h-8 text-[#C8A97E]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                Kenya Legal & Compliance Intelligence
              </h1>
              <p className="text-sm text-neutral-300 mb-8 leading-relaxed">
                Instant, verified answers on Kenya's Data Protection Act, Cloud Regulations, and Compliance Requirements.
              </p>
              
              <div className="w-full flex flex-col gap-3">
                <Link
                  href="/login"
                  className="w-full py-3.5 bg-[#C8A97E] hover:bg-[#D4BA96] text-[#000000] font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Sign In</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/signup"
                  className="w-full py-3 bg-[#141414] hover:bg-[#1A1A1A] border border-[#333333] text-neutral-100 hover:text-white font-medium text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#C8A97E]" />
                  <span>Create Account</span>
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-[#1C1C1C] flex items-center justify-center gap-2 text-xs text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-[#C8A97E]" />
                <span>Verified Kenyan Laws & Official Citations</span>
              </div>
            </motion.div>
          )}

          {/* --- STATE 1: ASK --- */}
          {state === "ASK" && (
            <motion.div
              key="ask"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="my-auto w-full max-w-3xl flex flex-col"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Ask a legal or compliance question
                </h2>
                <p className="text-neutral-300 text-sm mt-3 max-w-xl mx-auto">
                  Ask about Kenyan data protection rules, foreign cloud hosting, AI verification, or statutory penalties.
                </p>
              </div>

              {/* Clean Grok Dark Query Card */}
              <div className="w-full bg-[#0A0A0A] border border-[#222222] focus-within:border-[#C8A97E]/70 focus-within:ring-1 focus-within:ring-[#C8A97E]/30 rounded-2xl p-5 shadow-2xl transition-all">
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Can we use third-party AI to verify customer identity?"
                  className="w-full bg-transparent text-base sm:text-lg text-white placeholder:text-neutral-400 outline-none resize-none leading-relaxed"
                  rows={3}
                />
                
                <div className="flex items-center justify-between pt-4 border-t border-[#1A1A1A] mt-2">
                  <span className="text-xs text-neutral-400 font-mono">Press Enter to submit</span>
                  <button
                    disabled={!query.trim()}
                    onClick={() => handleSubmit()}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                      query.trim()
                        ? 'bg-[#C8A97E] hover:bg-[#D4BA96] text-[#000000] cursor-pointer shadow-sm'
                        : 'bg-[#181818] text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Get Answer</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Common Questions */}
              <div className="mt-8 text-left">
                <p className="text-xs font-semibold text-neutral-400 mb-2.5">Common questions to try:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    "Can we use third party AI to authenticate customer data?",
                    "Can government agencies store citizen health data in foreign clouds?",
                    "What are the statutory requirements and penalties for cross-border data transfer?",
                    "Are we required to conduct a DPIA before deploying biometric verification?"
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmit(prompt)}
                      className="p-3.5 bg-[#0A0A0A] hover:bg-[#141414] border border-[#222222] hover:border-[#C8A97E]/50 rounded-xl text-left text-neutral-200 hover:text-white text-xs transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <span className="line-clamp-1">{prompt}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#C8A97E] shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- STATE 2: LOADING --- */}
          {state === "LOADING" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="my-auto flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                <div className="absolute inset-0 border-2 border-[#262626] border-t-[#C8A97E] rounded-full animate-spin [animation-duration:1s]" />
                <Scale className="w-6 h-6 text-[#C8A97E]" />
              </div>
              
              <div className="bg-[#0A0A0A] border border-[#222222] px-6 py-4 rounded-xl shadow-lg max-w-md w-full">
                <p className="text-neutral-200 text-sm font-medium">
                  {researchMilestones[loadingStep]}
                </p>
                <div className="flex justify-center gap-1.5 mt-3">
                  {researchMilestones.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === loadingStep ? 'bg-[#C8A97E] w-6' : 'bg-[#222222] w-2'}`} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- STATE 3: ANSWER DASHBOARD --- */}
          {state === "ANSWER" && answer && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col gap-6 pb-12 print:gap-5 print:pb-0 print:block"
            >
              {/* ========================================================= */}
              {/* PRINT-ONLY EXECUTIVE MEMORANDUM HEADER                     */}
              {/* Pure white background, prominent high-visibility metadata */}
              {/* ========================================================= */}
              <div className="hidden print:block w-full mb-6 pb-4 border-b-2 border-slate-900 break-inside-avoid">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase font-sans">
                      DIRA INTELLIGENCE
                    </h1>
                  </div>

                  <div className="text-right font-mono text-xs text-slate-900 space-y-1">
                    <div className="font-bold tracking-wider text-red-700 uppercase">
                      CONFIDENTIAL // C-SUITE DIRECTIVE
                    </div>
                    <div><span className="font-semibold text-slate-700">Jurisdiction:</span> Republic of Kenya / EAC</div>
                    <div><span className="font-semibold text-slate-700">Date Issued:</span> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div><span className="font-semibold text-slate-700">Doc Reference:</span> DIRA-STAT-{Math.abs(query.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)).toString(16).toUpperCase().padStart(8, '0')}</div>
                  </div>
                </div>

                {/* Evaluated Query Box */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-300">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 uppercase">
                      Your Question
                    </span>
                    {(() => {
                      const style = getVerdictStyle(answer.conclusion, answer.isOutOfScope);
                      return (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-slate-400 bg-white text-slate-950 uppercase">
                          {style.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-base font-semibold text-slate-950 leading-snug">
                    {query}
                  </p>
                </div>
              </div>

              {/* Question Context Header Banner (Screen Only) */}
              <div className="w-full bg-[#0A0A0A] border border-[#222222] rounded-2xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-[#C8A97E] uppercase tracking-wider block mb-1">
                    Your Question
                  </span>
                  <h2 className="text-lg sm:text-xl text-white font-semibold break-words">
                    {query}
                  </h2>
                </div>
                {(() => {
                  const style = getVerdictStyle(answer.conclusion, answer.isOutOfScope);
                  return (
                    <div className={`px-4 py-2 rounded-xl border ${style.bg} ${style.border} flex items-center gap-2 shrink-0`}>
                      <span className={`w-2 h-2 rounded-full ${style.indicator}`} />
                      <span className={`text-xs font-bold tracking-wide ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* CASE A: OUT OF SCOPE */}
              {answer.isOutOfScope ? (
                <div className="w-full bg-[#0A0A0A] print:bg-white border border-amber-600/40 print:border-amber-300 rounded-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-xl print:shadow-none break-inside-avoid print:break-inside-avoid">
                  <div className="w-14 h-14 rounded-2xl bg-[#1E1508] border border-[#8A5C1B] flex items-center justify-center mx-auto mb-5 print:hidden">
                    <ShieldAlert className="w-7 h-7 text-amber-400" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-[#1E1508] print:bg-amber-100 text-[#FBBF24] print:text-amber-900 border border-[#8A5C1B] mb-3 inline-block">
                    Question Out of Scope
                  </span>
                  <h3 className="text-xl sm:text-2xl text-white print:text-slate-900 font-semibold mt-2 mb-4">
                    {answer.conclusion}
                  </h3>
                  <p className="text-neutral-300 print:text-slate-700 leading-relaxed text-sm max-w-xl mx-auto mb-8">
                    {answer.whyItMatters}
                  </p>

                  <div className="w-full border-t border-[#1F1F1F] pt-6 print:hidden">
                    <p className="text-neutral-400 text-xs font-semibold mb-4">
                      Try asking about Kenyan data protection or cloud policies:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      {[
                        "Can we use third party AI to authenticate customer data?",
                        "Can government agencies store citizen health data in foreign clouds?",
                        "What are statutory penalties for cross-border data transfer without safeguards?",
                        "Are we required to conduct a DPIA before deploying biometric verification?"
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSubmit(prompt)}
                          className="p-3.5 rounded-xl bg-[#121212] hover:bg-[#1A1A1A] border border-[#242424] text-neutral-300 hover:text-white text-xs leading-relaxed transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <span className="line-clamp-2">{prompt}</span>
                          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-[#C8A97E] shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                
                /* CASE B: FULL STRUCTURED ANSWER */
                <div className="dossier-grid grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:flex print:flex-col print:gap-5">
                  
                  {/* Left Column: Direct Answer, Explanation, and Official Sources */}
                  <div className="dossier-col lg:col-span-7 flex flex-col gap-6 print:contents">
                    
                    {/* Direct Answer Block */}
                    <div className="bg-[#0A0A0A] print:bg-white border border-[#222222] print:border-slate-300 rounded-2xl print:rounded-xl p-6 sm:p-7 shadow-md print:shadow-none break-inside-avoid print:break-inside-avoid print:order-1">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#1A1A1A] print:border-slate-100">
                        <Scale className="w-4 h-4 text-[#C8A97E]" />
                        <span className="text-xs font-semibold tracking-wide text-neutral-300 print:text-slate-700 uppercase">
                          Direct Answer
                        </span>
                      </div>
                      <p className="text-xl sm:text-2xl print:text-base text-white print:text-slate-950 font-normal print:font-semibold leading-snug">
                        {answer.conclusion}
                      </p>
                    </div>

                    {/* Legal & Regulatory Explanation Block */}
                    <div className="bg-[#0A0A0A] print:bg-white border border-[#222222] print:border-slate-300 rounded-2xl print:rounded-xl p-6 sm:p-7 shadow-md print:shadow-none break-inside-avoid print:break-inside-avoid print:order-2">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#1A1A1A] print:border-slate-100">
                        <Building2 className="w-4 h-4 text-[#C8A97E]" />
                        <span className="text-xs font-semibold tracking-wide text-neutral-300 print:text-slate-700 uppercase">
                          Legal & Regulatory Explanation
                        </span>
                      </div>
                      <p className="text-sm sm:text-base print:text-xs text-neutral-200 print:text-slate-700 leading-relaxed">
                        {answer.whyItMatters}
                      </p>
                    </div>

                    {/* Primary Evidentiary Citations */}
                    <div className="bg-[#0A0A0A] print:bg-white border border-[#222222] print:border-slate-300 rounded-2xl print:rounded-xl p-6 sm:p-7 shadow-md print:shadow-none break-inside-avoid print:break-inside-avoid print:order-4">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#1A1A1A] print:border-slate-100">
                        <FileCheck className="w-4 h-4 text-[#C8A97E]" />
                        <span className="text-xs font-semibold tracking-wide text-neutral-300 print:text-slate-700 uppercase">
                          Official Legal Sources Cited
                        </span>
                      </div>

                      {!(answer.sources || []).length ? (
                        <p className="text-xs text-neutral-400 print:text-slate-500">No specific statutory citations were linked to this query.</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {answer.sources.map((source, idx) => {
                            const isBinding = source.status?.includes('ACT') || source.status?.includes('REGULATION');
                            const isUnverified = source.verified === false || (source.section && source.section.toLowerCase().includes('unverified'));
                            return (
                              <div 
                                key={idx} 
                                onClick={() => setActiveSource(source)}
                                className="bg-[#101010] hover:bg-[#161616] border border-[#222222] hover:border-[#383838] print:bg-slate-50 print:border-slate-300 rounded-xl p-4 cursor-pointer transition-all duration-200 group break-inside-avoid print:break-inside-avoid"
                              >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex flex-col gap-0.5">
                                    <h4 className="text-sm font-semibold text-white print:text-slate-950 group-hover:text-[#C8A97E] transition-colors">
                                      {source.title}
                                    </h4>
                                    {source.section && (
                                      <span className={`text-xs font-medium ${isUnverified ? 'text-[#F87171] print:text-rose-700' : 'text-[#C8A97E] print:text-slate-700'}`}>
                                        {source.section}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {isUnverified && (
                                      <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-[#2A0E12] text-[#F87171] border-[#7F1D1D] print:bg-rose-100 print:text-rose-900 print:border-rose-300">
                                        UNVERIFIED
                                      </span>
                                    )}
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${
                                      isBinding 
                                        ? 'bg-[#181818] print:bg-slate-100 text-[#C8A97E] print:text-slate-900 border-[#C8A97E] print:border-slate-300' 
                                        : 'bg-[#181818] print:bg-slate-100 text-neutral-300 print:text-slate-800 border-[#383838] print:border-slate-300'
                                    }`}>
                                      {source.status}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-neutral-300 print:text-slate-600 line-clamp-2 print:line-clamp-none leading-relaxed pl-3 border-l-2 border-[#C8A97E] print:border-slate-300 group-hover:border-[#C8A97E] transition-colors font-serif italic">
                                  "{source.excerpt}"
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Key Compliance Risks & Requirements */}
                  <div className="dossier-col lg:col-span-5 flex flex-col gap-6 print:contents">
                    
                    {/* Risk & Requirement Cards */}
                    <div className="bg-[#0A0A0A] print:bg-white border border-[#222222] print:border-slate-300 rounded-2xl print:rounded-xl p-6 sm:p-7 shadow-md print:shadow-none break-inside-avoid print:break-inside-avoid print:order-3">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#1A1A1A] print:border-slate-100">
                        <AlertTriangle className="w-4 h-4 text-amber-500 print:text-amber-600" />
                        <span className="text-xs font-semibold tracking-wide text-neutral-300 print:text-slate-700 uppercase">
                          Key Risks & Requirements
                        </span>
                      </div>

                      {!(answer.risks || []).length ? (
                        <div className="bg-[#101010] print:bg-slate-50 border border-[#222222] print:border-slate-300 rounded-xl p-6 text-center">
                          <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs text-neutral-400 print:text-slate-600">No major compliance risks identified.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {answer.risks.map((risk, idx) => {
                            const isCritical = risk.severity >= 4;
                            return (
                              <div 
                                key={idx}
                                className="bg-[#101010] print:bg-slate-50 border border-[#222222] print:border-slate-300 rounded-xl p-4 flex flex-col gap-2 break-inside-avoid print:break-inside-avoid"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-white print:text-slate-900">
                                    {risk.area}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                                    isCritical 
                                      ? 'bg-[#1E0E11] print:bg-red-50 text-[#FF6B72] print:text-red-700 border-[#8A232D] print:border-red-300' 
                                      : 'bg-[#1E1508] print:bg-amber-50 text-[#FBBF24] print:text-amber-800 border-[#8A5C1B] print:border-amber-300'
                                  }`}>
                                    RISK LEVEL {risk.severity}/5
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-300 print:text-slate-600 leading-relaxed">
                                  {risk.description}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Review Sign-off (Print-Only) */}
                    <div className="hidden print:block print:order-5 w-full pt-4 mt-2 border-t border-slate-300 break-inside-avoid text-xs text-slate-800">
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <div className="border-b border-slate-400 h-6 mb-1.5" />
                          <span className="text-[10px] uppercase text-slate-600 font-medium">Legal / Compliance Review</span>
                        </div>
                        <div>
                          <div className="border-b border-slate-400 h-6 mb-1.5" />
                          <span className="text-[10px] uppercase text-slate-600 font-medium">Management Approval</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      </div>

      {/* --- EVIDENCE INSPECTION MODAL --- */}
      <AnimatePresence>
        {activeSource && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm print:hidden"
            onClick={() => setActiveSource(null)}
          >
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.98, opacity: 0 }} 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#0A0A0A] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-[#1F1F1F] bg-[#121212] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#2E2E2E] flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#C8A97E]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{activeSource.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-neutral-300 uppercase">{activeSource.status}</span>
                      {activeSource.section && (
                        <>
                          <span className="text-neutral-500 text-xs">•</span>
                          <span className="text-xs font-medium text-[#C8A97E]">{activeSource.section}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSource(null)} 
                  aria-label="Close modal"
                  className="w-8 h-8 rounded-lg bg-[#1A1A1A] hover:bg-[#262626] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-mono"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="bg-[#121212] rounded-xl p-5 border-l-4 border-[#C8A97E]">
                  <p className="text-sm text-neutral-200 leading-relaxed font-serif whitespace-pre-wrap">
                    {activeSource.excerpt}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

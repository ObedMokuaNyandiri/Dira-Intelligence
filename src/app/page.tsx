"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldAlert, FileText, Download, ChevronRight, Activity, ShieldCheck, FileCheck } from "lucide-react";

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
};

type AnswerData = {
  conclusion: string;
  whyItMatters: string;
  risks: Risk[];
  sources: Source[];
};

export default function DiraIntelligenceTerminal() {
  const [state, setState] = useState<"LOGIN" | "ASK" | "LOADING" | "ANSWER">("LOGIN");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<AnswerData | null>(null);
  const [activeSource, setActiveSource] = useState<Source | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus input on ASK state
  useEffect(() => {
    if (state === "ASK" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state]);

  const handleLogin = () => setState("ASK");

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setState("LOADING");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setAnswer(data);
      setState("ANSWER");
    } catch (err) {
      console.error(err);
      // Fallback state on error
      setAnswer({
        conclusion: "SYSTEM ERROR: Failed to retrieve intelligence.",
        whyItMatters: "The secure connection to the knowledge base was interrupted.",
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

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 sm:p-12 font-sans overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gold-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-blue-500/5 blur-[150px] pointer-events-none" />

      <AnimatePresence mode="wait">
        
        {/* --- STATE 0: LOGIN --- */}
        {state === "LOGIN" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center max-w-sm w-full"
          >
            <div className="w-16 h-16 border border-white/10 bg-black/40 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(200,169,126,0.1)]">
              <ShieldCheck className="w-8 h-8 text-gold-500" />
            </div>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2">DIRA<span className="font-bold text-gold-500">.INTEL</span></h1>
            <p className="text-sm text-neutral-400 mb-10 text-center">Secure Executive Terminal</p>
            
            <button 
              onClick={handleLogin}
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span>Authenticate</span>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-gold-500 transition-colors" />
            </button>
          </motion.div>
        )}

        {/* --- STATE 1: ASK --- */}
        {state === "ASK" && (
          <motion.div
            key="ask"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40, filter: "blur(5px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-3xl flex flex-col items-center"
          >
            <p className="text-gold-500 text-sm font-semibold tracking-widest uppercase mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4" /> System Ready
            </p>
            <h2 className="text-4xl sm:text-5xl font-light text-white text-center mb-12 tracking-tight">
              What decision are you considering?
            </h2>

            <div className="w-full relative group">
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Can we use third-party AI to process customer data?"
                className="w-full bg-black/40 border border-white/10 focus:border-gold-500/50 rounded-2xl p-6 pl-14 text-xl sm:text-2xl text-white placeholder:text-neutral-600 outline-none resize-none shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 backdrop-blur-xl"
                rows={3}
              />
              <Search className="absolute top-7 left-6 w-6 h-6 text-neutral-500 group-focus-within:text-gold-500 transition-colors" />
              
              <AnimatePresence>
                {query.trim() && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => handleSubmit()}
                    className="absolute bottom-6 right-6 bg-gold-500 hover:bg-gold-400 text-black px-6 py-2 rounded-lg font-medium transition-colors shadow-[0_0_20px_rgba(200,169,126,0.3)]"
                  >
                    Analyze
                  </motion.button>
                )}
              </AnimatePresence>
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
            className="flex flex-col items-center justify-center h-64"
          >
            <div className="relative w-24 h-24 flex items-center justify-center mb-8">
              <div className="absolute inset-0 border-t-2 border-gold-500 rounded-full animate-spin [animation-duration:1.5s]" />
              <div className="absolute inset-2 border-r-2 border-slate-blue-500 rounded-full animate-spin [animation-duration:2s]" />
              <div className="absolute inset-4 border-b-2 border-white/20 rounded-full animate-spin [animation-duration:1s]" />
              <ShieldAlert className="w-6 h-6 text-gold-500 animate-pulse" />
            </div>
            <p className="text-neutral-400 font-mono text-sm tracking-widest uppercase animate-pulse">Cross-referencing directives...</p>
          </motion.div>
        )}

        {/* --- STATE 3: ANSWER & DASHBOARD --- */}
        {state === "ANSWER" && answer && (
          <motion.div
            key="answer"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1 }}
            className="w-full max-w-6xl flex flex-col h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8 shrink-0">
              <div>
                <p className="text-gold-500 text-sm font-semibold tracking-widest uppercase mb-2">Subject Query</p>
                <h2 className="text-2xl text-white font-light line-clamp-2 pr-8">{query}</h2>
              </div>
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export Memo</span>
              </button>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
              
              {/* Left Column: Conclusion & Context */}
              <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto pr-2 pb-8">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} 
                  className="bg-black/40 border border-white/5 rounded-2xl p-8 backdrop-blur-xl"
                >
                  <p className="text-neutral-500 text-sm font-semibold tracking-widest uppercase mb-4">Executive Conclusion</p>
                  <p className="text-2xl text-white font-light leading-relaxed">
                    {answer.conclusion}
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  className="bg-black/40 border border-white/5 rounded-2xl p-8 backdrop-blur-xl"
                >
                  <p className="text-neutral-500 text-sm font-semibold tracking-widest uppercase mb-4">Strategic Implication</p>
                  <p className="text-lg text-neutral-300 leading-relaxed">
                    {answer.whyItMatters}
                  </p>
                </motion.div>

                {/* Evidence Section (Sources) */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="flex flex-col gap-4 mt-4"
                >
                  <p className="text-neutral-500 text-sm font-semibold tracking-widest uppercase">Primary Sources</p>
                  {answer.sources.map((source, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveSource(source)}
                      className="bg-white/5 border border-white/10 hover:border-gold-500/50 rounded-xl p-5 cursor-pointer transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <FileCheck className="w-5 h-5 text-gold-500" />
                          <h4 className="text-white font-medium">{source.title}</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-white/10 text-neutral-300 uppercase tracking-wider">
                          {source.status}
                        </span>
                      </div>
                      <p className="text-neutral-400 text-sm line-clamp-2 leading-relaxed border-l-2 border-white/10 pl-3 group-hover:border-gold-500/30 transition-colors">
                        "{source.excerpt}"
                      </p>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right Column: Risk Map */}
              <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pb-8">
                <p className="text-neutral-500 text-sm font-semibold tracking-widest uppercase mb-2">Areas Requiring Review</p>
                {answer.risks.length === 0 ? (
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-8 text-center backdrop-blur-xl">
                    <ShieldCheck className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">No major risks detected.</p>
                  </div>
                ) : (
                  answer.risks.map((risk, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + (idx * 0.1) }}
                      key={idx} 
                      className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-white font-medium text-lg">{risk.area}</h4>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div 
                              key={level} 
                              className={`w-2 h-2 rounded-full ${level <= risk.severity ? (risk.severity > 3 ? 'bg-red-500' : 'bg-gold-500') : 'bg-white/10'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-neutral-400 text-sm leading-relaxed">{risk.description}</p>
                    </motion.div>
                  ))
                )}
              </div>
              
            </div>

            {/* Floating Restart Button */}
            <button 
              onClick={() => { setState("ASK"); setQuery(""); setAnswer(null); }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 backdrop-blur-xl px-6 py-3 rounded-full text-white text-sm font-medium hover:border-white/30 transition-colors shadow-2xl flex items-center gap-2 z-40"
            >
              <Search className="w-4 h-4" /> New Query
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STATE 5: EVIDENCE MODAL --- */}
      <AnimatePresence>
        {activeSource && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-12 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveSource(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl bg-obsidian-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gold-500" />
                  <h3 className="text-white font-medium text-lg">{activeSource.title}</h3>
                </div>
                <button onClick={() => setActiveSource(null)} className="text-neutral-500 hover:text-white transition-colors">
                  ✕
                </button>
              </div>
              <div className="p-8 overflow-y-auto">
                <p className="text-neutral-500 text-sm font-semibold tracking-widest uppercase mb-4">Verbatim Excerpt</p>
                <div className="bg-white/5 rounded-xl p-6 border-l-4 border-gold-500">
                  <p className="text-lg text-neutral-200 leading-relaxed whitespace-pre-wrap font-serif">
                    {activeSource.excerpt}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

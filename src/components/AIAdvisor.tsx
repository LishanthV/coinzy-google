import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Brain, Bot, HelpCircle, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface AIAdvisorProps {
  summary: any;
  onRefresh: () => void;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

const SAMPLE_SUGGESTIONS = [
  "How much did I spend in total this month?",
  "Suggest a customized savings strategy for my goals.",
  "Check my active category budgets and give alert insights.",
  "Identify recurring bills or anomalous subscription expenses."
];

export default function AIAdvisor({ summary, onRefresh }: AIAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am your Coinzy AI Smart Advisor. I have safe, private access to your transaction log, active category budgets, savings goals, and recurring bill schedules. Ask me anything or choose a smart action below!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setApiKeyError(null);
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build conversation history (excluding IDs)
      const historyPayload = messages.slice(-10).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text
      }));

      const response = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.keyMissing) {
          setApiKeyError(data.error);
        } else {
          throw new Error(data.error || "Failed to communicate with AI");
        }
        return;
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.text || "I was unable to formulate a response at this time. Please try again.",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      console.error(error);
      const botErrorMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: `Error connecting to Gemini Advisor: ${error.message || "Unknown error"}. Ensure your network is active and server is running.`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botErrorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex flex-col h-[520px] lg:col-span-3">
      {/* Advisor Header */}
      <div className="flex justify-between items-center pb-4 border-b border-[#e2e8f0] dark:border-[#334155] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl flex items-center justify-center text-[#27ae60]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold font-display text-[#0a3d62] dark:text-white flex items-center gap-1.5">
              Gemini AI Smart Advisor
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                Live Analysis
              </span>
            </h3>
            <p className="text-[11px] text-[#64748b] dark:text-slate-400">
              Safe server-side analysis of your current month accounts.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-[#27ae60] rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Refresh current finance database"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Space */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-0 text-sm">
        {apiKeyError && (
          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-300 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold">Gemini Advisor Connection Offline</p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                  Your server-side model cannot access the Gemini API because the <b>GEMINI_API_KEY</b> environment secret is not configured yet.
                </p>
              </div>
            </div>
            <div className="pl-7 text-[11px] bg-white/50 dark:bg-[#0f172a]/30 p-2.5 rounded-xl border border-amber-100 dark:border-slate-800">
              <p className="font-bold">Instructions to activate your AI Advisor:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 dark:text-slate-400">
                <li>Go to the <b>Settings (Gear Icon)</b> panel on the top right.</li>
                <li>Under the <b>Secrets / Env Vars</b> section, enter your Gemini API Key.</li>
                <li>Label the key as <b>GEMINI_API_KEY</b> and click Save.</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isBot = m.sender === "bot";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${!isBot ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isBot 
                    ? "bg-emerald-50 dark:bg-slate-800 text-[#27ae60]" 
                    : "bg-[#0a3d62] text-white"
                }`}
              >
                {isBot ? <Bot className="w-4.5 h-4.5" /> : <Brain className="w-4.5 h-4.5" />}
              </div>

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed text-xs shadow-sm whitespace-pre-line ${
                  isBot
                    ? "bg-gray-50 border border-gray-100 text-gray-800 dark:bg-[#111827]/40 dark:border-[#334155]/30 dark:text-slate-200"
                    : "bg-emerald-500 text-white font-medium"
                }`}
              >
                {m.text}
                <div className="text-[9px] text-right mt-1 opacity-60">
                  {m.timestamp.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-slate-800 text-[#27ae60] flex items-center justify-center shrink-0">
              <Bot className="w-4.5 h-4.5 animate-bounce" />
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 dark:bg-[#111827]/40 dark:border-[#334155]/30 text-gray-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#27ae60] rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-[#27ae60] rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-[#27ae60] rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] font-bold text-gray-400">Gemini analyzing transaction logs...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && !loading && (
        <div className="space-y-1.5 py-2 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-gray-400" /> Suggested AI Actions:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSendMessage(s)}
                className="text-[10px] font-bold px-2.5 py-1.5 bg-[#f8fafc] dark:bg-slate-800/40 text-gray-700 dark:text-slate-300 border border-gray-200/60 dark:border-[#334155]/50 rounded-xl hover:border-[#27ae60] dark:hover:border-blue-500 hover:bg-white transition text-left shrink-0 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-[#e2e8f0] dark:border-[#334155] pt-4 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Gemini: 'Suggest budget limits', 'How much did I save?'..."
          disabled={loading}
          className="flex-1 bg-gray-50 border border-[#e2e8f0] dark:bg-[#0f172a] dark:border-[#334155] px-4 py-3 rounded-xl text-xs focus:outline-none focus:border-[#27ae60] dark:focus:border-[#60a5fa] disabled:opacity-60 transition text-[#0a3d62] dark:text-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-[#27ae60] hover:bg-[#1e8449] disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:opacity-50 text-white p-3 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

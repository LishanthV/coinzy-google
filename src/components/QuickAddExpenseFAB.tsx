import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  X, 
  DollarSign, 
  Calendar, 
  Tag, 
  Loader2, 
  Check, 
  AlertCircle, 
  FileText 
} from "lucide-react";
import { CATEGORIES, CAT_ICONS, CURRENCY_SYMBOLS } from "../types.ts";

interface QuickAddExpenseFABProps {
  currencyCode?: string;
  onRefresh: () => void;
}

export default function QuickAddExpenseFAB({ currencyCode = "INR", onRefresh }: QuickAddExpenseFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Food");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";

  // Default date to today on mount/open
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please specify a description or merchant name.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid numeric expense amount greater than 0.");
      return;
    }

    if (!date) {
      setError("Please pick a valid transaction calendar date.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        amount: parsedAmount,
        category,
        date,
        note: note.trim(),
        type: "expense",
        tags: tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : []
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to record transaction. Please verify your balance.");
      } else {
        setSuccess(true);
        onRefresh();
        
        // Auto close after showing success checkmark
        setTimeout(() => {
          setIsOpen(false);
          // Reset form fields
          setTitle("");
          setAmount("");
          setCategory("Food");
          setNote("");
          setTagsStr("");
          setSuccess(false);
        }, 1200);
      }
    } catch (err) {
      setError("Server connectivity issues. Try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          id="quick-add-expense-fab-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-emerald-500 to-[#27ae60] text-white rounded-full shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 border border-emerald-400 focus:outline-none cursor-pointer group"
          title="Quick add new expense"
        >
          <Plus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
        </motion.button>
      </div>

      {/* MODAL & BACKDROP */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog Body */}
            <motion.div
              id="quick-add-expense-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black font-display text-[#0a3d62] dark:text-white flex items-center gap-1.5">
                    <span className="p-1 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-500 text-sm">💸</span>
                    Quick Expense Ledger
                  </h3>
                  <p className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">Record a spending transaction instantly</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition duration-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content / Success state */}
              <div className="p-6">
                {success ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center text-[#27ae60] border border-emerald-200 dark:border-emerald-900/30">
                      <Check className="w-8 h-8 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#0a3d62] dark:text-white text-base">Expense Logged</h4>
                      <p className="text-xs text-gray-400 mt-1">Wallet and budget charts synced successfully!</p>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error visual block */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-red-700 dark:text-red-400 text-xs font-bold flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    {/* Numeric Input - Large display style */}
                    <div className="relative">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                        Amount
                      </label>
                      <div className="relative rounded-2xl overflow-hidden border border-[#e2e8f0] dark:border-[#334155] bg-slate-50 dark:bg-[#111827]/40 focus-within:border-emerald-500 transition duration-200">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#27ae60] font-bold text-lg font-mono">
                          {currencySymbol}
                        </div>
                        <input
                          id="quick-expense-amount-input"
                          type="number"
                          step="any"
                          required
                          disabled={loading}
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="block w-full pl-9 pr-4 py-3 bg-transparent text-lg font-extrabold text-[#0a3d62] dark:text-white font-mono placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Decription Title Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                        Merchant or Description
                      </label>
                      <div className="relative rounded-2xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#111827]/40 focus-within:border-emerald-500 transition duration-200">
                        <input
                          id="quick-expense-title-input"
                          type="text"
                          required
                          disabled={loading}
                          placeholder="e.g. Swiggy Lunch, Uber Ride"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="block w-full px-4 py-2.5 bg-transparent text-sm font-bold text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Grid of Date and Category */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Date selection */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                          Date
                        </label>
                        <div className="relative rounded-2xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#111827]/40 flex items-center px-3 py-2.5 focus-within:border-emerald-500 transition duration-200">
                          <Calendar className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                          <input
                            id="quick-expense-date-input"
                            type="date"
                            required
                            disabled={loading}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="block w-full bg-transparent text-xs font-bold text-slate-700 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Dropdown Category select */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                          Category
                        </label>
                        <div className="relative rounded-2xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#111827]/40 flex items-center px-3 py-2.5 focus-within:border-emerald-500 transition duration-200">
                          <span className="mr-2 text-sm">{CAT_ICONS[category] || "💳"}</span>
                          <select
                            id="quick-expense-category-input"
                            value={category}
                            disabled={loading}
                            onChange={(e) => setCategory(e.target.value)}
                            className="block w-full bg-transparent text-xs font-bold text-slate-700 dark:text-white focus:outline-none cursor-pointer"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat} className="dark:bg-[#1e293b]">
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Quick Horizontal emoji buttons for Category */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Quick Category Pill Select
                      </label>
                      <div className="flex flex-wrap gap-1.5 py-1">
                        {CATEGORIES.map((cat) => {
                          const isSelected = category === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategory(cat)}
                              disabled={loading}
                              className={`px-2.5 py-1 text-xs rounded-xl border font-bold flex items-center gap-1 transition duration-150 cursor-pointer ${
                                isSelected 
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400" 
                                  : "bg-gray-50 border-gray-100 text-slate-500 hover:border-gray-300 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-400"
                              }`}
                            >
                              <span>{CAT_ICONS[cat]}</span>
                              <span className="text-[10px]">{cat}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Note details */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                        Note / Tags
                      </label>
                      <div className="relative rounded-2xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#111827]/40 flex items-start px-3 py-2">
                        <FileText className="w-4 h-4 text-slate-400 mr-2 mt-1 shrink-0" />
                        <input
                          id="quick-expense-note-input"
                          type="text"
                          disabled={loading}
                          placeholder="Note (e.g. dinner with team)"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="block w-full bg-transparent text-xs font-bold text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Form actions */}
                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => setIsOpen(false)}
                        className="w-1/3 py-2.5 border border-slate-200 dark:border-slate-700 font-extrabold text-xs text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition duration-200 cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-[#27ae60] text-white font-extrabold text-xs rounded-xl hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-500/10 transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Recording...
                          </>
                        ) : (
                          "Log Expense"
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

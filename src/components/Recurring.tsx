import React, { useState, useEffect } from "react";
import { Plus, BellRing, RefreshCcw, Trash2, ShieldAlert, Check } from "lucide-react";
import { CATEGORIES, CAT_ICONS, CURRENCY_SYMBOLS } from "../types.ts";

interface RecurringProps {
  summary: any;
  onRefresh: () => void;
}

export default function Recurring({ summary, onRefresh }: RecurringProps) {
  const [recurringList, setRecurringList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Bills");
  const [dayOfMonth, setDayOfMonth] = useState("5");
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const currencyCode = summary?.currencyCode || "INR";
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recurring");
      const data = await res.json();
      if (res.ok) {
        setRecurringList(data.recurring || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title || !amount || !category || !dayOfMonth) {
      setError("Please fill out all mandatory details.");
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid expense amount.");
      return;
    }

    const day = parseInt(dayOfMonth);
    if (isNaN(day) || day < 1 || day > 31) {
      setError("Day of month must be between 1 and 31.");
      return;
    }

    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount: amt, category, dayOfMonth: day, note }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create schedule");
      } else {
        setSuccess(`Successfully added recurring schedule for "${title}"!`);
        setTitle("");
        setAmount("");
        setNote("");
        fetchRecurring();
        onRefresh();
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this recurring expense schedule? No future automated debits will occur.")) return;
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRecurring();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-[#27ae60] uppercase tracking-wider">
          Subscriptions & Standing Orders
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[#0a3d62] dark:text-white">
          Recurring Expenses
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setup recurring expense form */}
        <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-[#27ae60]" />
            Establish Bill Schedule
          </h3>

          {error && <p className="text-xs font-bold text-red-500 mb-3">{error}</p>}
          {success && <p className="text-xs font-bold text-emerald-600 mb-3 flex items-center gap-1"><Check className="w-4 h-4" /> {success}</p>}

          <form onSubmit={handleCreateRecurring} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                Expense Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Netflix Subscription, Fiber Broadband"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] text-sm dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-3 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] text-sm dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Billing Day *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  placeholder="e.g. 5"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] text-sm dark:text-white font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] text-sm dark:text-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CAT_ICONS[cat] || "💳"} {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <input
                type="text"
                placeholder="Optional billing details"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] text-sm dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#27ae60] hover:bg-[#1e8449] text-white py-3 rounded-xl font-bold transition text-sm cursor-pointer"
            >
              Add Billing Schedule
            </button>
          </form>
        </div>

        {/* List of active recurring charges */}
        <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white flex items-center gap-2 mb-6">
            <BellRing className="w-5 h-5 text-[#27ae60]" />
            Active Subscriptions & Schedules
          </h3>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px]">
            {loading ? (
              <p className="text-center py-12 text-gray-500">Retrieving schedules...</p>
            ) : recurringList.length > 0 ? (
              recurringList.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 bg-[#f8fafc] dark:bg-[#0f172a] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-white dark:bg-[#1e293b] p-2 rounded-xl border border-gray-100 dark:border-gray-800 shrink-0">
                      {CAT_ICONS[rec.category] || "💳"}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-[#64748b] dark:text-gray-400 mt-0.5">
                        Billing day: <strong className="text-gray-700 dark:text-white">{rec.dayOfMonth}th</strong> • {rec.category}
                      </p>
                      {rec.note && <p className="text-[10px] text-gray-400 mt-1">Memo: {rec.note}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-red-500">
                        -{currencySymbol}{rec.amount.toFixed(2)}
                      </p>
                      <span className="text-[9px] bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300 font-bold px-1.5 py-0.5 rounded">
                        Monthly
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteRecurring(rec.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/25 transition cursor-pointer"
                      title="Cancel schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <ShieldAlert className="w-12 h-12 text-gray-300 mb-3" />
                <h4 className="font-bold text-[#0a3d62] dark:text-white">No active schedules</h4>
                <p className="text-xs text-[#64748b] dark:text-gray-400 mt-1 max-w-sm">
                  Add subscriptions like Netflix, PG rent, or wifi charges. Trackify will debit them automatically when due.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

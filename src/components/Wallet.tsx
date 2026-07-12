import React, { useState } from "react";
import { 
  Plus, 
  Wallet as WalletIcon, 
  CheckCircle, 
  DollarSign, 
  Compass, 
  Target, 
  AlertCircle 
} from "lucide-react";
import { CATEGORIES, CAT_ICONS, CURRENCY_SYMBOLS } from "../types.ts";
import BudgetProgress from "./BudgetProgress.tsx";

const GOAL_ICONS = ["🎯", "🏖️", "🚗", "🏠", "💻", "✈️", "🎓", "💍", "📱", "💰"];


interface WalletProps {
  summary: any;
  onRefresh: () => void;
}

export default function Wallet({ summary, onRefresh }: WalletProps) {
  const [walletAmt, setWalletAmt] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletSuccess, setWalletSuccess] = useState("");
  const [walletError, setWalletError] = useState("");

  // Budget states
  const [budgetCat, setBudgetCat] = useState("Food");
  const [budgetAmt, setBudgetAmt] = useState("");
  const [budgetSuccess, setBudgetSuccess] = useState("");
  const [budgetError, setBudgetError] = useState("");

  // Savings Goal states
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalIcon, setGoalIcon] = useState("🎯");
  const [goalSuccess, setGoalSuccess] = useState("");
  const [goalError, setGoalError] = useState("");

  const currencyCode = summary?.currencyCode || "INR";
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";
  const currentBalance = summary?.walletBalance || 0;

  const handleAddWalletMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalletError("");
    setWalletSuccess("");

    const amt = parseFloat(walletAmt);
    if (isNaN(amt) || amt <= 0) {
      setWalletError("Please enter a valid deposit amount.");
      return;
    }

    setWalletLoading(true);
    try {
      const res = await fetch("/api/wallet/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();

      if (!res.ok) {
        setWalletError(data.error || "Failed to add funds");
      } else {
        setWalletSuccess(`Successfully loaded ${currencySymbol}${amt} into Coinzy Wallet!`);
        setWalletAmt("");
        onRefresh();
      }
    } catch (err) {
      setWalletError("Server error.");
    } finally {
      setWalletLoading(false);
    }
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetError("");
    setBudgetSuccess("");

    const amt = parseFloat(budgetAmt);
    if (isNaN(amt) || amt < 0) {
      setBudgetError("Please enter a valid budget amount.");
      return;
    }

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: budgetCat, amount: amt }),
      });
      const data = await res.json();

      if (!res.ok) {
        setBudgetError(data.error || "Failed to save budget");
      } else {
        setBudgetSuccess(`Successfully set spending budget for ${budgetCat}!`);
        setBudgetAmt("");
        onRefresh();
      }
    } catch (err) {
      setBudgetError("Server error.");
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoalError("");
    setGoalSuccess("");

    if (!goalTitle || !goalTarget) {
      setGoalError("Please enter all mandatory details.");
      return;
    }

    const target = parseFloat(goalTarget);
    if (isNaN(target) || target <= 0) {
      setGoalError("Target savings must be a valid positive amount.");
      return;
    }

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: goalTitle, targetAmount: target, icon: goalIcon }),
      });
      const data = await res.json();

      if (!res.ok) {
        setGoalError(data.error || "Failed to create savings goal");
      } else {
        setGoalSuccess(`Successfully established savings goal for "${goalTitle}"!`);
        setGoalTitle("");
        setGoalTarget("");
        onRefresh();
      }
    } catch (err) {
      setGoalError("Server error.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-[#27ae60] uppercase tracking-wider">
          Funds & Limits
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[#0a3d62] dark:text-white">
          Wallet, Budgeting & Targets
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Manager */}
        <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white flex items-center gap-2">
                <WalletIcon className="w-5 h-5 text-[#27ae60]" />
                Coinzy Digital Wallet
              </h3>
            </div>

            <div className="bg-[#f8fafc] dark:bg-[#0f172a] p-5 rounded-2xl border border-[#e2e8f0] dark:border-[#334155] text-center mb-6">
              <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                Current Wallet Funds
              </p>
              <h4 className="text-3xl font-extrabold font-display tracking-tight text-[#0a3d62] dark:text-white mt-1">
                {currencySymbol}{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            </div>

            {walletError && <p className="text-xs text-red-500 font-semibold mb-3 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {walletError}</p>}
            {walletSuccess && <p className="text-xs text-emerald-600 font-semibold mb-3 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {walletSuccess}</p>}

            <form onSubmit={handleAddWalletMoney} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Deposit Funds ({currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="1"
                    placeholder="Enter deposit amount"
                    value={walletAmt}
                    onChange={(e) => setWalletAmt(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] text-sm dark:text-white font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={walletLoading}
                className="w-full bg-[#27ae60] hover:bg-[#1e8449] text-white py-3 rounded-xl font-bold transition disabled:opacity-50 text-sm cursor-pointer"
              >
                Add Money to Wallet
              </button>
            </form>
          </div>
        </div>

        {/* Budget Configurator */}
        <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white flex items-center gap-2 mb-6">
            <Compass className="w-5 h-5 text-[#27ae60]" />
            Category Budget Setter
          </h3>

          {budgetError && <p className="text-xs text-red-500 font-semibold mb-3 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {budgetError}</p>}
          {budgetSuccess && <p className="text-xs text-emerald-600 font-semibold mb-3 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {budgetSuccess}</p>}

          <form onSubmit={handleUpdateBudget} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={budgetCat}
                onChange={(e) => setBudgetCat(e.target.value)}
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
                Monthly Spending Limit ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  placeholder="Set budget amount"
                  value={budgetAmt}
                  onChange={(e) => setBudgetAmt(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] text-sm dark:text-white font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#27ae60] hover:bg-[#1e8449] text-white py-3 rounded-xl font-bold transition text-sm cursor-pointer"
            >
              Update Category Budget
            </button>
          </form>
        </div>

        {/* Savings Goal Creator */}
        <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-[#27ae60]" />
            Establish Savings Goal
          </h3>

          {goalError && <p className="text-xs text-red-500 font-semibold mb-3 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {goalError}</p>}
          {goalSuccess && <p className="text-xs text-emerald-600 font-semibold mb-3 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {goalSuccess}</p>}

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                Goal Title
              </label>
              <input
                type="text"
                placeholder="e.g. Dream Vacation, New Phone"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] text-sm dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                Target Savings Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  placeholder="Set target amount"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] text-sm dark:text-white font-bold"
                />
              </div>
            </div>

            {/* Goal Icons list selector */}
            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
                Aesthetic Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {GOAL_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setGoalIcon(icon)}
                    className={`p-2.5 text-xl rounded-xl border text-center transition cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800 ${goalIcon === icon ? "border-[#27ae60] bg-emerald-50/60 dark:bg-slate-800" : "border-[#e2e8f0] dark:border-[#334155]"}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#27ae60] hover:bg-[#1e8449] text-white py-3 rounded-xl font-bold transition text-sm cursor-pointer"
            >
              Establish Goal
            </button>
          </form>
        </div>
      </div>

      {/* Live Budget Tracking Progress Component */}
      <BudgetProgress summary={summary} onRefresh={onRefresh} />
    </div>
  );
}

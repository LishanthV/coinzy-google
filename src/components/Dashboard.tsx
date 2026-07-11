import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowRight, 
  Sparkles, 
  PlusCircle, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CAT_ICONS, CURRENCY_SYMBOLS } from "../types.ts";

interface DashboardProps {
  summary: any;
  user: any;
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
}

const CAT_COLORS = ["#7F77DD", "#AFA9EC", "#CECBF6", "#534AB7", "#888780", "#D3D1C7", "#3C3489", "#B4B2A9"];

export default function Dashboard({ summary, user, onNavigate, onRefresh }: DashboardProps) {
  const [simLoading, setSimLoading] = useState(false);
  const [simSuccess, setSimSuccess] = useState("");
  const [goalSaveAmt, setGoalSaveAmt] = useState<Record<string, string>>({});
  const [goalLoading, setGoalLoading] = useState<string | null>(null);

  const {
    walletBalance = 0,
    currencyCode = "INR",
    totalIncome = 0,
    totalExpenses = 0,
    chartData = [],
    budgets = [],
    goals = [],
    recentTransactions = []
  } = summary || {};

  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return { text: "Good morning", emoji: "☀️" };
    if (hr < 17) return { text: "Good afternoon", emoji: "⛅" };
    return { text: "Good evening", emoji: "🌙" };
  };
  const greeting = getGreeting();

  const handleSimulateGPay = async () => {
    setSimLoading(true);
    setSimSuccess("");
    try {
      const amount = (Math.random() * 800 + 100).toFixed(2);
      const merchants = [
        "Swiggy Delivery", "Uber Cab Trip", "Chai Point", 
        "Croma Retail", "Starbucks Coffee", "Amazon Marketplace"
      ];
      const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];

      const res = await fetch("/api/sync/gpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, title: randomMerchant }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setSimSuccess(data.message);
        onRefresh();
        setTimeout(() => setSimSuccess(""), 4500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  const handleAddGoalFunds = async (goalId: string) => {
    const amtStr = goalSaveAmt[goalId];
    if (!amtStr) return;
    const amt = parseFloat(amtStr);
    if (isNaN(amt) || amt <= 0) return;

    setGoalLoading(goalId);
    try {
      const res = await fetch(`/api/goals/${goalId}/add-funds`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to add funds");
      } else {
        setGoalSaveAmt(prev => ({ ...prev, [goalId]: "" }));
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGoalLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Personalized Welcome Banner */}
      <div className="bg-gradient-to-r from-[#27ae60]/10 via-[#0a3d62]/5 to-transparent border border-emerald-100/50 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
          <span className="text-4xl p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm select-none">
            {greeting.emoji}
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-[#0a3d62] dark:text-white">
              {greeting.text}, {user?.name || "User"}!
            </h1>
            <p className="text-xs text-[#64748b] dark:text-slate-400 font-medium mt-1">
              Your finance ledger, wallets, and UPI statements are fully synchronized and up to date.
            </p>
          </div>
        </div>
        <div className="text-center sm:text-right shrink-0">
          <p className="text-[10px] font-bold text-[#64748b] dark:text-slate-400 uppercase tracking-widest">Available Cash Flow</p>
          <p className="text-2xl font-extrabold text-[#27ae60] mt-1">
            {currencySymbol}{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-bold text-[#27ae60] uppercase tracking-wider">
            Monthly Spending Overview
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[#0a3d62] dark:text-white">
            Finance Analytics Dashboard
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleSimulateGPay}
            disabled={simLoading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#0a3d62] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#072d48] dark:bg-blue-600 dark:hover:bg-blue-700 transition cursor-pointer"
          >
            <Sparkles className="w-4.5 h-4.5 text-yellow-300" />
            {simLoading ? "Simulating..." : "Simulate GPay Push"}
          </button>
          <button
            onClick={() => onNavigate("transactions")}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#27ae60] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#1e8449] transition cursor-pointer"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Simulator Notification Toast */}
      {simSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-sm dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 transition-all duration-300">
          <CheckCircle className="w-5 h-5 shrink-0 text-[#27ae60] mt-0.5" />
          <div>
            <p className="font-bold text-sm">GPay UPI Sim Alert:</p>
            <p className="text-xs mt-0.5">{simSuccess}</p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance */}
        <div className="bg-gradient-to-br from-[#0a3d62] to-[#125381] text-white rounded-3xl p-6 shadow-md relative overflow-hidden dark:from-slate-800 dark:to-slate-900">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
            <Wallet className="w-48 h-48" />
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/10 p-3 rounded-2xl">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <button
              onClick={() => onNavigate("wallet")}
              className="text-xs font-bold text-white bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition cursor-pointer"
            >
              Add Money
            </button>
          </div>
          <p className="text-xs font-semibold text-white/75 uppercase tracking-wider">
            Available Balance
          </p>
          <h3 className="text-3xl font-extrabold font-display tracking-tight mt-1">
            {currencySymbol}{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Income This Month */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl text-[#27ae60]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider">
              Income This Month
            </p>
            <h3 className="text-2xl font-extrabold font-display text-[#0a3d62] dark:text-white mt-1">
              {currencySymbol}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Expenses This Month */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-2xl text-red-500">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider">
              Expenses This Month
            </p>
            <h3 className="text-2xl font-extrabold font-display text-[#0a3d62] dark:text-white mt-1">
              {currencySymbol}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      {/* Analytics & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Spending Analytics Chart */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-3xl p-6 shadow-sm lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white">
              Category Spending Analytics
            </h3>
            <span className="text-xs font-bold text-[#64748b] dark:text-gray-400">Current Month</span>
          </div>
          
          <div className="h-64 sm:h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    contentStyle={{
                      backgroundColor: "#0a3d62",
                      borderColor: "transparent",
                      borderRadius: "12px",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "12px"
                    }}
                  />
                  <Bar dataKey="amount" fill="#27ae60" radius={[6, 6, 0, 0]} maxBarSize={32}>
                    {chartData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="text-4xl mb-2">📊</div>
                <h4 className="font-bold text-[#0a3d62] dark:text-white">No Spending Analytics</h4>
                <p className="text-xs text-[#64748b] dark:text-gray-400 mt-0.5">Start logging your expenses to populate chart metrics.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white">
              Recent Activity
            </h3>
            <button
              onClick={() => onNavigate("transactions")}
              className="text-xs font-bold text-[#27ae60] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center border-b border-[#e2e8f0] dark:border-[#334155] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-[#f8fafc] dark:bg-[#0f172a] rounded-xl shrink-0">
                      {CAT_ICONS[tx.category] || "💳"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {tx.title}
                      </p>
                      <p className="text-xs text-[#64748b] dark:text-gray-400">
                        {tx.category} • {tx.date}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-extrabold shrink-0 ${tx.type === 'income' ? 'text-[#27ae60]' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="text-4xl mb-2">💸</div>
                <h4 className="font-bold text-[#0a3d62] dark:text-white">No transactions yet</h4>
                <p className="text-xs text-[#64748b] dark:text-gray-400 mt-0.5">Your financial transactions will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budgets & Savings Goals Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Budget Meters */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white">
              Category Budgets Status
            </h3>
            <button
              onClick={() => onNavigate("wallet")}
              className="text-xs font-bold text-[#27ae60] hover:underline cursor-pointer"
            >
              Set Budgets
            </button>
          </div>

          <div className="space-y-5">
            {budgets.length > 0 ? (
              budgets.map((b: any) => {
                // Find actual spending for this category
                const catSpend = chartData.find((c: any) => c.category === b.category)?.amount || 0;
                const percentage = Math.min((catSpend / b.amount) * 100, 100);
                const isOver = catSpend > b.amount;

                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="text-base">{CAT_ICONS[b.category] || "💳"}</span>
                        {b.category}
                      </span>
                      <span className="font-semibold text-xs text-[#64748b] dark:text-gray-400">
                        <strong className={isOver ? "text-red-500" : "text-[#0a3d62] dark:text-white"}>
                          {currencySymbol}{catSpend.toFixed(0)}
                        </strong>{" "}
                        / {currencySymbol}{b.amount}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[#f1f5f9] dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-500" : percentage > 85 ? "bg-amber-500" : "bg-[#27ae60]"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-[#0a3d62] dark:text-white">No active budgets this month</h4>
                <p className="text-xs text-[#64748b] dark:text-gray-400 mt-0.5">Control your expenses by setting spending limits in Wallet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Savings Goals Goals Trackers */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white">
              Target Savings Goals
            </h3>
            <button
              onClick={() => onNavigate("wallet")}
              className="text-xs font-bold text-[#27ae60] hover:underline cursor-pointer"
            >
              Add Goal
            </button>
          </div>

          <div className="space-y-6">
            {goals.length > 0 ? (
              goals.map((g: any) => {
                const pct = Math.min((g.savedAmount / g.targetAmount) * 100, 100);

                return (
                  <div key={g.id} className="p-4 bg-[#f8fafc] dark:bg-[#0f172a] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl shrink-0 p-1.5 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-[#e2e8f0]/40">
                        {g.icon || "🎯"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                          {g.title}
                        </h4>
                        <p className="text-xs text-[#64748b] dark:text-gray-400">
                          {currencySymbol}{g.savedAmount.toLocaleString()} saved of {currencySymbol}{g.targetAmount.toLocaleString()} ({pct.toFixed(0)}%)
                        </p>
                      </div>
                    </div>

                    {/* Funding Input */}
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748b]">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          placeholder="Amount to allocate"
                          disabled={goalLoading === g.id}
                          value={goalSaveAmt[g.id] || ""}
                          onChange={(e) => setGoalSaveAmt(prev => ({ ...prev, [g.id]: e.target.value }))}
                          className="w-full pl-6 pr-3 py-1.5 bg-white border border-[#e2e8f0] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#27ae60] dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                        />
                      </div>
                      <button
                        onClick={() => handleAddGoalFunds(g.id)}
                        disabled={goalLoading === g.id || !goalSaveAmt[g.id]}
                        className="bg-[#27ae60] hover:bg-[#1e8449] text-white text-xs font-bold px-3 py-2 rounded-lg shrink-0 transition disabled:opacity-40 cursor-pointer"
                      >
                        {goalLoading === g.id ? "Saving..." : "Add Funds"}
                      </button>
                    </div>

                    {/* Progress slider */}
                    <div className="w-full bg-[#f1f5f9] dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-[#27ae60] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-[#0a3d62] dark:text-white">No active savings targets</h4>
                <p className="text-xs text-[#64748b] dark:text-gray-400 mt-0.5">Start planning for big purchases or trips in the Wallet panel.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

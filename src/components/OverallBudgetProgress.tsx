import { useMemo } from "react";
import { motion } from "motion/react";
import { Compass, AlertTriangle, CheckCircle, ShieldAlert, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { CURRENCY_SYMBOLS } from "../types.ts";

interface OverallBudgetProgressProps {
  summary: any;
  onNavigate: (tab: string) => void;
}

export default function OverallBudgetProgress({ summary, onNavigate }: OverallBudgetProgressProps) {
  const { budgets = [], chartData = [], currencyCode = "INR" } = summary || {};
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";

  // Calculate stats using useMemo for stability and performance
  const stats = useMemo(() => {
    if (!budgets || budgets.length === 0) {
      return {
        totalBudgeted: 0,
        totalSpentInBudgeted: 0,
        usagePercent: 0,
        remaining: 0,
        isOver: false,
        overCount: 0,
        statusLabel: "No Budgets Set",
        statusColor: "text-slate-500",
        bgLight: "bg-slate-50",
        borderLight: "border-slate-200"
      };
    }

    const totalBudgeted = budgets.reduce((sum: number, b: any) => sum + b.amount, 0);
    const totalSpentInBudgeted = budgets.reduce((sum: number, b: any) => {
      const spend = chartData.find((c: any) => c.category === b.category)?.amount || 0;
      return sum + spend;
    }, 0);

    const usagePercent = totalBudgeted > 0 ? (totalSpentInBudgeted / totalBudgeted) * 100 : 0;
    const remaining = totalBudgeted - totalSpentInBudgeted;
    const isOver = remaining < 0;

    let overCount = 0;
    budgets.forEach((b: any) => {
      const spent = chartData.find((c: any) => c.category === b.category)?.amount || 0;
      if (spent > b.amount) {
        overCount++;
      }
    });

    let statusLabel = "On Track";
    let statusColor = "text-emerald-600 dark:text-emerald-400";
    let bgLight = "bg-emerald-50/60 dark:bg-emerald-950/20";
    let borderLight = "border-emerald-100 dark:border-emerald-900/30";

    if (usagePercent >= 100) {
      statusLabel = "Budget Exceeded";
      statusColor = "text-red-600 dark:text-red-400 font-extrabold";
      bgLight = "bg-red-50/60 dark:bg-red-950/20";
      borderLight = "border-red-100 dark:border-red-900/30";
    } else if (usagePercent >= 80) {
      statusLabel = "Warning: Near Limit";
      statusColor = "text-amber-600 dark:text-amber-400 font-bold";
      bgLight = "bg-amber-50/60 dark:bg-amber-950/20";
      borderLight = "border-amber-100 dark:border-amber-900/30";
    } else if (usagePercent >= 50) {
      statusLabel = "Moderate Usage";
      statusColor = "text-sky-600 dark:text-sky-400 font-semibold";
      bgLight = "bg-sky-50/60 dark:bg-sky-950/20";
      borderLight = "border-[#e2e8f0] dark:border-slate-800";
    }

    return {
      totalBudgeted,
      totalSpentInBudgeted,
      usagePercent,
      remaining,
      isOver,
      overCount,
      statusLabel,
      statusColor,
      bgLight,
      borderLight
    };
  }, [budgets, chartData]);

  if (budgets.length === 0) {
    return (
      <motion.div 
        id="overall-budget-onboarding"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-start gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="mx-auto md:mx-0 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl text-[#27ae60] shrink-0">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0a3d62] dark:text-white">
              Unlock Smart Budget Limits & Warnings
            </h3>
            <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1 max-w-lg leading-relaxed">
              You haven't established monthly category spending budgets yet. Set limit thresholds to visualize your safety margin, and receive auto-triggered notifications when you touch 80% capacity!
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate("wallet")}
          className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#27ae60] text-white text-xs font-bold rounded-xl hover:bg-[#1e8449] transition duration-200 cursor-pointer shadow-sm shadow-emerald-600/10"
        >
          Setup Monthly Limits
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      id="overall-budget-progress-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-3xl p-6 shadow-sm space-y-5"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-[#27ae60] uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
            Monthly Spend Tracker
          </span>
          <h3 className="text-lg font-black font-display text-[#0a3d62] dark:text-white mt-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#27ae60]" />
            Monthly Budget Utilisation
          </h3>
          <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
            Aggregated metrics comparing active monthly categories against limits.
          </p>
        </div>

        {/* Dynamic Status Pill */}
        <div className={`px-4 py-2 rounded-2xl border ${stats.bgLight} ${stats.borderLight} flex items-center gap-2 self-start sm:self-auto`}>
          {stats.usagePercent >= 100 ? (
            <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" />
          ) : stats.usagePercent >= 80 ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          )}
          <div className="text-left">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">Health Status</p>
            <p className={`text-xs font-bold mt-1 ${stats.statusColor} leading-none`}>
              {stats.statusLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Main Progress Bar Workspace */}
      <div className="space-y-2">
        <div className="flex justify-between items-end text-xs font-semibold">
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Spent vs Limit</p>
            <p className="text-base font-extrabold text-[#0a3d62] dark:text-white font-mono">
              {currencySymbol}{stats.totalSpentInBudgeted.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-xs font-medium text-slate-400"> / {currencySymbol}{stats.totalBudgeted.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Usage Capacity</p>
            <p className={`text-base font-extrabold font-mono ${stats.usagePercent >= 100 ? "text-red-500" : stats.usagePercent >= 80 ? "text-amber-500" : "text-[#27ae60]"}`}>
              {stats.usagePercent.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Multi-gradient premium visual progress bar */}
        <div className="w-full bg-[#f1f5f9] dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-100 dark:border-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(stats.usagePercent, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              stats.usagePercent >= 100 
                ? "bg-gradient-to-r from-red-500 to-rose-600 animate-pulse" 
                : stats.usagePercent >= 80 
                  ? "bg-gradient-to-r from-amber-400 to-amber-500" 
                  : "bg-gradient-to-r from-emerald-500 to-[#27ae60]"
            }`}
          />
        </div>
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        {/* Metric 1 */}
        <div className="bg-[#f8fafc] dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Safety Margin</p>
          <div className="mt-1.5">
            <p className={`text-sm font-extrabold font-mono ${stats.isOver ? "text-red-500" : "text-[#27ae60]"}`}>
              {stats.isOver ? "-" : ""}{currencySymbol}{Math.abs(stats.remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {stats.isOver ? "Deficit over monthly limits" : "Remaining safe budget"}
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#f8fafc] dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Limit Breaches</p>
          <div className="mt-1.5 flex items-center justify-between">
            <div>
              <p className={`text-sm font-extrabold ${stats.overCount > 0 ? "text-red-500 animate-pulse" : "text-slate-700 dark:text-slate-300"}`}>
                {stats.overCount} {stats.overCount === 1 ? "Category" : "Categories"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Exceeded individual caps
              </p>
            </div>
            {stats.overCount > 0 && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#f8fafc] dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Action Required</p>
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-xs font-bold text-[#0a3d62] dark:text-slate-300">
              {stats.usagePercent >= 100 
                ? "Restructure limits" 
                : stats.usagePercent >= 80 
                  ? "Restrict spending" 
                  : "Limits look healthy"}
            </p>
            <button
              onClick={() => onNavigate("wallet")}
              className="text-[10px] font-extrabold text-[#27ae60] hover:underline cursor-pointer flex items-center gap-0.5"
            >
              Adjust
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

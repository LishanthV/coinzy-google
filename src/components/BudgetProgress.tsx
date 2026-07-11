import { motion } from "motion/react";
import { Compass, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { CAT_ICONS, CURRENCY_SYMBOLS } from "../types.ts";

interface BudgetProgressProps {
  summary: any;
  onRefresh: () => void;
}

export default function BudgetProgress({ summary, onRefresh }: BudgetProgressProps) {
  const { budgets = [], chartData = [], currencyCode = "INR" } = summary || {};
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";

  // Calculate stats
  const totalBudgeted = budgets.reduce((sum: number, b: any) => sum + b.amount, 0);
  const totalSpentInBudgeted = budgets.reduce((sum: number, b: any) => {
    const spend = chartData.find((c: any) => c.category === b.category)?.amount || 0;
    return sum + spend;
  }, 0);

  const budgetUsagePercent = totalBudgeted > 0 ? (totalSpentInBudgeted / totalBudgeted) * 100 : 0;

  return (
    <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#e2e8f0] dark:border-[#334155] pb-4">
        <div>
          <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#27ae60]" />
            Active Category Budgets
          </h3>
          <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
            Real-time monthly limits set for spending habits.
          </p>
        </div>
        
        {budgets.length > 0 && (
          <div className="bg-[#f8fafc] dark:bg-[#0f172a] px-4 py-2.5 rounded-2xl border border-[#e2e8f0] dark:border-[#334155] text-right">
            <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Total Allocated Budget</p>
            <p className="text-sm font-extrabold text-[#0a3d62] dark:text-white mt-0.5">
              {currencySymbol}{totalSpentInBudgeted.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-xs font-semibold text-gray-400"> / {currencySymbol}{totalBudgeted.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </p>
          </div>
        )}
      </div>

      {budgets.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center mb-3">
            <Compass className="w-7 h-7 text-[#27ae60]" />
          </div>
          <h4 className="font-bold text-base text-[#0a3d62] dark:text-white">No active budgets established</h4>
          <p className="text-xs text-[#64748b] dark:text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
            Specify spending limits for your frequent categories using the config form above to enable tracking alerts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Global usage stats */}
          <div className="bg-emerald-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-emerald-100/40 dark:border-slate-700/50">
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Overall Budget Usage
              </span>
              <span className={budgetUsagePercent > 100 ? "text-red-500" : "text-emerald-700 dark:text-emerald-400"}>
                {budgetUsagePercent.toFixed(0)}% Utilized
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${budgetUsagePercent > 100 ? "bg-red-500" : budgetUsagePercent > 85 ? "bg-amber-500" : "bg-[#27ae60]"}`}
              />
            </div>
          </div>

          {/* Grid of category progress bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b: any) => {
              const spent = chartData.find((c: any) => c.category === b.category)?.amount || 0;
              const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
              const isOver = spent > b.amount;
              const isClose = !isOver && percent >= 85;

              return (
                <div
                  key={b.id}
                  className="p-4 border border-[#e2e8f0] dark:border-[#334155] rounded-2xl bg-white dark:bg-[#111827]/40 shadow-sm space-y-3.5 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl p-2 bg-[#f8fafc] dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 shrink-0 select-none">
                        {CAT_ICONS[b.category] || "💳"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#0a3d62] dark:text-white truncate">
                          {b.category}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
                          Spending Limit
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                        {currencySymbol}{spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-400 font-semibold">
                        of {currencySymbol}{b.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  {/* Progress indicator bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percent, 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          isOver 
                            ? "bg-red-500" 
                            : isClose 
                              ? "bg-amber-500" 
                              : "bg-[#27ae60]"
                        }`}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-gray-400">
                        {percent.toFixed(0)}% Spent
                      </span>

                      {isOver ? (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Over Budget!
                        </span>
                      ) : isClose ? (
                        <span className="text-amber-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Warning: Near Limit
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Safe Margin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

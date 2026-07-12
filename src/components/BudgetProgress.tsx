import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, AlertCircle, CheckCircle2, TrendingUp, Bell, BellOff, X, ShieldAlert } from "lucide-react";
import { CAT_ICONS, CURRENCY_SYMBOLS } from "../types.ts";

interface BudgetProgressProps {
  summary: any;
  onRefresh: () => void;
}

export default function BudgetProgress({ summary, onRefresh }: BudgetProgressProps) {
  const { budgets = [], chartData = [], currencyCode = "INR" } = summary || {};
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";

  // Threshold Warning States
  const [permission, setPermission] = useState<string>("default");
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [notifiedCategories, setNotifiedCategories] = useState<string[]>([]);

  // Detect initial permission status
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Browser push notifications are not supported in your browser.");
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        new Notification("🔔 Coinzy Budget Alerts Active", {
          body: "We will alert you here and on your desktop when any category budget exceeds 80%!",
          icon: "https://cdn-icons-png.flaticon.com/512/564/564619.png"
        });
      }
    } catch (err) {
      console.error("Failed to request notification permission:", err);
    }
  };

  // Real-time automatic monitoring of budget thresholds (>= 80%)
  useEffect(() => {
    if (!budgets || budgets.length === 0 || !chartData) return;

    const crossedCategories: string[] = [];
    budgets.forEach((b: any) => {
      const spent = chartData.find((c: any) => c.category === b.category)?.amount || 0;
      const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      if (percent >= 80) {
        crossedCategories.push(b.category);
      }
    });

    // Find categories crossing the threshold that we haven't notified in this session yet
    const newlyCrossed = crossedCategories.filter(cat => !notifiedCategories.includes(cat));

    if (newlyCrossed.length > 0) {
      // Trigger native desktop notification if allowed
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        newlyCrossed.forEach(cat => {
          const b = budgets.find((bg: any) => bg.category === cat);
          const spent = chartData.find((c: any) => c.category === cat)?.amount || 0;
          const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
          const isOver = spent > b.amount;
          
          try {
            new Notification(isOver ? `🚨 Budget Exceeded: ${cat}` : `⚠️ Budget Threshold Alert: ${cat}`, {
              body: isOver 
                ? `You spent ${currencySymbol}${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} of your ${currencySymbol}${b.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} limit (${percent.toFixed(0)}%!).`
                : `You spent ${percent.toFixed(0)}% of your ${cat} budget limit (${currencySymbol}${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${currencySymbol}${b.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}).`,
              tag: `budget-alert-${cat}`,
              icon: "https://cdn-icons-png.flaticon.com/512/564/564619.png"
            });
          } catch (e) {
            console.error("Native push blocked or threw exception inside frame:", e);
          }
        });
      }
      setNotifiedCategories(prev => [...prev, ...newlyCrossed]);
    }
  }, [budgets, chartData, notifiedCategories, currencySymbol]);

  // Calculate stats
  const totalBudgeted = budgets.reduce((sum: number, b: any) => sum + b.amount, 0);
  const totalSpentInBudgeted = budgets.reduce((sum: number, b: any) => {
    const spend = chartData.find((c: any) => c.category === b.category)?.amount || 0;
    return sum + spend;
  }, 0);

  const budgetUsagePercent = totalBudgeted > 0 ? (totalSpentInBudgeted / totalBudgeted) * 100 : 0;

  // Compile active alerts that haven't been dismissed by the user
  const activeAlerts = budgets
    .map((b: any) => {
      const spent = chartData.find((c: any) => c.category === b.category)?.amount || 0;
      const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return {
        category: b.category,
        spent,
        budget: b.amount,
        percent,
        isOver: spent > b.amount,
        isExceeding80: percent >= 80
      };
    })
    .filter(alert => alert.isExceeding80 && !dismissedAlerts.includes(alert.category));

  const dismissAlert = (category: string) => {
    setDismissedAlerts(prev => [...prev, category]);
  };

  const resetDismissed = () => {
    setDismissedAlerts([]);
  };

  return (
    <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header */}
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

        {/* Notifications Permission Action Switch */}
        <div className="flex items-center gap-2">
          {permission === "default" && (
            <button
              onClick={requestNotificationPermission}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0fdf4] border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 animate-bounce" />
              Enable Browser Alerts
            </button>
          )}
          {permission === "granted" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 rounded-xl border border-gray-200/50 dark:border-slate-700/50">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span>Browser Alerts Active</span>
            </div>
          )}
          {permission === "denied" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/10 text-xs font-bold text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
              <BellOff className="w-3.5 h-3.5" />
              <span>Alerts Blocked</span>
            </div>
          )}
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

      {/* Visual Threshold Alert Warning Drawer (AnimatePresence) */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-2.5"
          >
            {activeAlerts.map((alert) => (
              <div
                key={alert.category}
                className={`flex items-start justify-between p-4 rounded-2xl border ${
                  alert.isOver 
                    ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30 text-red-900 dark:text-red-200" 
                    : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-900 dark:text-amber-200"
                } shadow-sm relative overflow-hidden`}
              >
                {/* Visual side accent bar */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${alert.isOver ? "bg-red-500" : "bg-amber-500"}`} />
                
                <div className="flex items-start gap-3 pl-2.5">
                  <div className={`p-2 rounded-xl mt-0.5 ${alert.isOver ? "bg-red-100 dark:bg-red-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
                    <ShieldAlert className={`w-4 h-4 ${alert.isOver ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold flex items-center gap-1.5">
                      <span>{alert.category} Threshold Exceeded!</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        alert.isOver 
                          ? "bg-red-200/60 text-red-800 dark:bg-red-900/40 dark:text-red-300" 
                          : "bg-amber-200/60 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}>
                        {alert.percent.toFixed(0)}%
                      </span>
                    </h4>
                    <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-300">
                      You have spent <span className="font-bold">{currencySymbol}{alert.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> of your <span className="font-bold">{currencySymbol}{alert.budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> monthly limit. 
                      {alert.isOver 
                        ? " Please evaluate your expenses to stay clear of debt." 
                        : " Consider pausing non-essential purchases in this category."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => dismissAlert(alert.category)}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  title="Dismiss warning for now"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recover Dismissed Alerts Action Link */}
      {dismissedAlerts.length > 0 && (
        <div className="text-right">
          <button
            onClick={resetDismissed}
            className="text-[10px] font-bold text-slate-400 hover:text-[#27ae60] underline cursor-pointer"
          >
            Show {dismissedAlerts.length} dismissed warning{dismissedAlerts.length > 1 ? "s" : ""}
          </button>
        </div>
      )}

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
                className={`h-full rounded-full ${budgetUsagePercent > 100 ? "bg-red-500" : budgetUsagePercent > 80 ? "bg-amber-500" : "bg-[#27ae60]"}`}
              />
            </div>
          </div>

          {/* Grid of category progress bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b: any) => {
              const spent = chartData.find((c: any) => c.category === b.category)?.amount || 0;
              const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
              const isOver = spent > b.amount;
              const isClose = !isOver && percent >= 80;

              return (
                <div
                  key={b.id}
                  className={`p-4 border rounded-2xl bg-white dark:bg-[#111827]/40 shadow-sm space-y-3.5 flex flex-col justify-between transition duration-200 ${
                    isOver 
                      ? "border-red-200 dark:border-red-900/30 hover:border-red-300" 
                      : isClose 
                        ? "border-amber-200 dark:border-amber-900/30 hover:border-amber-300" 
                        : "border-[#e2e8f0] dark:border-[#334155] hover:border-emerald-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`text-2xl p-2 rounded-xl shadow-sm border shrink-0 select-none ${
                        isOver 
                          ? "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-500" 
                          : isClose 
                            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-500" 
                            : "bg-[#f8fafc] dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                      }`}>
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
                      <p className={`text-sm font-extrabold ${isOver ? "text-red-600 dark:text-red-400" : isClose ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}>
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
                            ? "bg-red-500 animate-pulse" 
                            : isClose 
                              ? "bg-amber-500" 
                              : "bg-[#27ae60]"
                        }`}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className={`${isOver ? "text-red-500" : isClose ? "text-amber-500 font-extrabold" : "text-gray-400"}`}>
                        {percent.toFixed(0)}% Spent
                      </span>

                      {isOver ? (
                        <span className="text-red-500 flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5" /> Exceeded!
                        </span>
                      ) : isClose ? (
                        <span className="text-amber-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Exceeded 80% Threshold
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

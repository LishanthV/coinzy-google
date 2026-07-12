import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  Percent, 
  ArrowRight, 
  ShieldAlert, 
  PiggyBank,
  Sparkles,
  Info
} from "lucide-react";
import { CURRENCY_SYMBOLS, CAT_ICONS } from "../types.ts";

interface EndOfMonthProjectionProps {
  transactions: any[];
  budgets: any[];
  currencyCode?: string;
}

// Typical categories classified as discretionary vs non-discretionary
const DISCRETIONARY_CATEGORIES = ["Food", "Shopping", "Entertainment", "Travel", "Others"];

export default function EndOfMonthProjection({ 
  transactions = [], 
  budgets = [], 
  currencyCode = "INR" 
}: EndOfMonthProjectionProps) {
  const [discretionaryReduction, setDiscretionaryReduction] = useState(20); // default 20% savings target slider
  const [showTooltip, setShowTooltip] = useState(false);

  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";

  // Dynamic calculations for the current month
  const stats = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentDay = today.getDate();

    // Get total days in current month
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = totalDaysInMonth - currentDay;

    // Filter current month's expenses
    const currentMonthExpenses = transactions.filter((tx) => {
      if (tx.type !== "expense") return false;
      const txDate = new Date(tx.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const totalSpentSoFar = currentMonthExpenses.reduce((sum, tx) => sum + tx.amount, 0);

    // Filter discretionary expenses
    const discretionaryExpenses = currentMonthExpenses.filter((tx) => 
      DISCRETIONARY_CATEGORIES.includes(tx.category)
    );
    const discretionarySpentSoFar = discretionaryExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    const fixedSpentSoFar = totalSpentSoFar - discretionarySpentSoFar;

    // Daily average (prevent divide by 0)
    const dailyAverageTotal = totalSpentSoFar / Math.max(1, currentDay);
    const dailyAverageDiscretionary = discretionarySpentSoFar / Math.max(1, currentDay);
    const dailyAverageFixed = fixedSpentSoFar / Math.max(1, currentDay);

    // Simple Linear Projection (dailyAverage * totalDays)
    const projectedTotal = dailyAverageTotal * totalDaysInMonth;
    const projectedDiscretionary = dailyAverageDiscretionary * totalDaysInMonth;
    const projectedFixed = dailyAverageFixed * totalDaysInMonth;

    // Total Budget limit for this month
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.amount, 0);

    // Projected savings if reducing discretionary spending by X%
    const reductionFraction = discretionaryReduction / 100;
    const futureDaysDiscretionarySavings = dailyAverageDiscretionary * daysRemaining * reductionFraction;
    const newProjectedTotal = projectedTotal - futureDaysDiscretionarySavings;
    const potentialSavingsAmt = futureDaysDiscretionarySavings;

    // Alert status calculation
    const isExceedingBudget = totalBudgetLimit > 0 && projectedTotal > totalBudgetLimit;
    const newIsExceedingBudget = totalBudgetLimit > 0 && newProjectedTotal > totalBudgetLimit;
    const percentOfBudget = totalBudgetLimit > 0 ? (projectedTotal / totalBudgetLimit) * 100 : 0;
    const newPercentOfBudget = totalBudgetLimit > 0 ? (newProjectedTotal / totalBudgetLimit) * 100 : 0;

    return {
      currentDay,
      totalDaysInMonth,
      daysRemaining,
      totalSpentSoFar,
      discretionarySpentSoFar,
      dailyAverageTotal,
      dailyAverageDiscretionary,
      projectedTotal,
      projectedDiscretionary,
      totalBudgetLimit,
      potentialSavingsAmt,
      newProjectedTotal,
      isExceedingBudget,
      newIsExceedingBudget,
      percentOfBudget,
      newPercentOfBudget,
      monthName: today.toLocaleString("default", { month: "long" }),
      currentMonthExpensesCount: currentMonthExpenses.length
    };
  }, [transactions, budgets, discretionaryReduction]);

  const {
    currentDay,
    totalDaysInMonth,
    daysRemaining,
    totalSpentSoFar,
    discretionarySpentSoFar,
    dailyAverageTotal,
    dailyAverageDiscretionary,
    projectedTotal,
    projectedDiscretionary,
    totalBudgetLimit,
    potentialSavingsAmt,
    newProjectedTotal,
    isExceedingBudget,
    newIsExceedingBudget,
    percentOfBudget,
    newPercentOfBudget,
    monthName,
    currentMonthExpensesCount
  } = stats;

  const hasExpenses = totalSpentSoFar > 0;

  return (
    <div 
      id="eom-spending-projection-card"
      className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
              Predictive Spending AI
            </span>
            <h3 className="text-lg font-black font-display text-[#0a3d62] dark:text-white mt-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500 animate-pulse" />
              End-of-Month Projection ({monthName})
            </h3>
            <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
              Forecasting final expenses based on your daily rate of {currencySymbol}{Math.round(dailyAverageTotal).toLocaleString()}/day.
            </p>
          </div>

          <div className="relative">
            <button 
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <Info className="w-4 h-4" />
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-8 z-10 w-64 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-lg leading-relaxed border border-slate-700">
                Calculates daily spending average in the current calendar month and multiplies it by the total days of the month to project your final bill. Allows simulating cutting back on non-essential purchases.
              </div>
            )}
          </div>
        </div>

        {/* Not enough data warning */}
        {!hasExpenses && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-[#0a3d62] dark:text-white text-sm">Projection Sandbox Pending</h4>
            <p className="text-xs text-[#64748b] dark:text-slate-400 mt-1 max-w-sm">
              Log transactions for {monthName} to generate smart daily spending trends and end-of-month forecasts.
            </p>
          </div>
        )}

        {hasExpenses && (
          <div className="space-y-6">
            {/* Visual Projection Gauge Meter */}
            <div className="bg-[#f8fafc] dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Side: Projection Values */}
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Projected Total Spending</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-[#0a3d62] dark:text-white font-mono">
                      {currencySymbol}{Math.round(projectedTotal).toLocaleString()}
                    </span>
                    {totalBudgetLimit > 0 && (
                      <span className="text-xs font-bold text-slate-500">
                        of {currencySymbol}{totalBudgetLimit.toLocaleString()} Budget
                      </span>
                    )}
                  </div>
                  
                  {/* Alert state banner */}
                  {totalBudgetLimit > 0 ? (
                    isExceedingBudget ? (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-extrabold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-lg border border-red-100 dark:border-red-950/30 w-fit">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Exceeding budget by {currencySymbol}{Math.round(projectedTotal - totalBudgetLimit).toLocaleString()} ({Math.round(percentOfBudget)}%)</span>
                      </div>
                    ) : (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-950/30 w-fit">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>On track! Safe under budget limit ({Math.round(percentOfBudget)}%)</span>
                      </div>
                    )
                  ) : (
                    <div className="mt-2 text-[10px] text-slate-400 font-bold">
                      Set a monthly budget limit in Wallet section to activate limits check.
                    </div>
                  )}
                </div>

                {/* Right Side: Current Month Snapshot */}
                <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-4 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Month Progress</p>
                    <p className="text-xs font-extrabold text-slate-700 dark:text-white mt-0.5">
                      Day {currentDay} of {totalDaysInMonth} ({Math.round((currentDay / totalDaysInMonth) * 100)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Spent So Far</p>
                    <p className="text-xs font-extrabold text-slate-700 dark:text-white mt-0.5 font-mono">
                      {currencySymbol}{Math.round(totalSpentSoFar).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Discretionary Total</p>
                    <p className="text-xs font-extrabold text-slate-700 dark:text-white mt-0.5 font-mono">
                      {currencySymbol}{Math.round(discretionarySpentSoFar).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Daily Discretionary</p>
                    <p className="text-xs font-extrabold text-slate-700 dark:text-white mt-0.5 font-mono">
                      {currencySymbol}{Math.round(dailyAverageDiscretionary).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bar visualizer */}
              {totalBudgetLimit > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentOfBudget, 100)}%` }}
                      className={`h-full rounded-full ${isExceedingBudget ? "bg-red-500" : "bg-emerald-500"}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* INTERACTIVE CUTBACK SIMULATOR SANDBOX */}
            <div className="border border-[#7F77DD]/20 bg-violet-50/20 dark:bg-violet-950/5 rounded-2xl p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <PiggyBank className="w-4 h-4 text-[#7F77DD]" />
                <h4 className="text-xs font-extrabold text-[#0a3d62] dark:text-white uppercase tracking-wider">
                  Discretionary Spend Cutback Sandbox
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Discretionary expenses (Dining out, entertainment, shopping) are easiest to prune. 
                Move the slider to simulate cutting back on non-essential spending for the remaining <strong className="text-slate-700 dark:text-white">{daysRemaining} days</strong>:
              </p>

              {/* Slider Input */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Reduce Discretionary Spend By:</span>
                  <span className="px-2.5 py-0.5 text-xs font-extrabold bg-[#7F77DD] text-white rounded-lg font-mono">
                    {discretionaryReduction}%
                  </span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={discretionaryReduction}
                  onChange={(e) => setDiscretionaryReduction(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#7F77DD]"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% (No change)</span>
                  <span>50% (Slight trim)</span>
                  <span>100% (Strict freeze)</span>
                </div>
              </div>

              {/* Sandbox Projection Comparison Card */}
              {discretionaryReduction > 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-950 p-3.5 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Projected End-of-Month Savings</p>
                      <p className="text-sm font-black text-emerald-500 mt-0.5 font-mono">
                        +{currencySymbol}{Math.round(potentialSavingsAmt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">New Projected Total</p>
                      <p className="text-sm font-black text-slate-700 dark:text-white mt-0.5 font-mono">
                        {currencySymbol}{Math.round(newProjectedTotal).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Impact of sandbox change on overall budget */}
                  {totalBudgetLimit > 0 && (
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Budget Limit Status:</span>
                      {newIsExceedingBudget ? (
                        <span className="font-extrabold text-red-500 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Still Exceeds Budget ({Math.round(newPercentOfBudget)}%)
                        </span>
                      ) : (
                        <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Budget Saved! ({Math.round(newPercentOfBudget)}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 text-center italic py-2">
                  Adjust the slider to simulate savings potential and dynamic adjustments.
                </div>
              )}
            </div>

            {/* Recommendation Insight */}
            <div className="flex items-start gap-2.5 bg-[#f8fafc] dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <span className="text-lg">💡</span>
              <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                {isExceedingBudget ? (
                  discretionaryReduction > 0 && !newIsExceedingBudget ? (
                    <span>By maintaining a <strong className="text-slate-700 dark:text-white">{discretionaryReduction}%</strong> reduction on discretionary spending for the remaining days of this month, you will successfully pull your finances back into safe budget bounds!</span>
                  ) : (
                    <span>You are currently on a trajectory to overspend this month. We highly recommend trimming non-essentials by at least <strong className="text-slate-700 dark:text-white">30%</strong> or setting budget triggers on food and entertainment.</span>
                  )
                ) : (
                  <span>Your current spending habits are highly sustainable and comfortably under budget. Adjusting the slider lets you plan ahead for aggressive savings or investment goals. Keep up the good work!</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

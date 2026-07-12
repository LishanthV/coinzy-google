import { useMemo } from "react";
import { motion } from "motion/react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from "recharts";
import { Activity, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { CURRENCY_SYMBOLS } from "../types.ts";

interface MonthlySpendTrendProps {
  transactions: any[];
  budgets: any[];
  currencyCode?: string;
}

export default function MonthlySpendTrend({ transactions = [], budgets = [], currencyCode = "INR" }: MonthlySpendTrendProps) {
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";

  // Compute 6-month historical spending trend dynamically
  const trendData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Total budgeted baseline comparison
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = targetDate.toLocaleString("default", { month: "short" });
      const yearVal = targetDate.getFullYear();
      const monthNum = targetDate.getMonth();

      // Filter transactions for this calendar month & year
      const monthlyExpenses = transactions.filter((tx) => {
        if (tx.type !== "expense") return false;
        const txDate = new Date(tx.date);
        return txDate.getMonth() === monthNum && txDate.getFullYear() === yearVal;
      });

      const totalSpent = monthlyExpenses.reduce((sum, tx) => sum + tx.amount, 0);

      data.push({
        name: `${monthName} ${yearVal.toString().slice(-2)}`,
        spending: parseFloat(totalSpent.toFixed(0)),
        limit: totalBudgeted > 0 ? totalBudgeted : undefined
      });
    }

    return data;
  }, [transactions, budgets]);

  // Aggregate statistics
  const averageSpending = useMemo(() => {
    if (trendData.length === 0) return 0;
    const sum = trendData.reduce((acc, curr) => acc + curr.spending, 0);
    return parseFloat((sum / trendData.length).toFixed(0));
  }, [trendData]);

  const peakSpending = useMemo(() => {
    if (trendData.length === 0) return { month: "N/A", amount: 0 };
    let peak = { month: "N/A", amount: 0 };
    trendData.forEach((d) => {
      if (d.spending > peak.amount) {
        peak = { month: d.name, amount: d.spending };
      }
    });
    return peak;
  }, [trendData]);

  const totalSpentAllMonths = trendData.reduce((sum, d) => sum + d.spending, 0);

  // Check if there is any spending recorded in the last 6 months
  const hasSpendingHistory = totalSpentAllMonths > 0;

  return (
    <div 
      id="monthly-spend-trend-card"
      className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <span className="text-[10px] font-extrabold text-[#7F77DD] uppercase tracking-wider bg-violet-50 dark:bg-violet-950/20 px-2.5 py-1 rounded-full">
              Trend Analytics
            </span>
            <h3 className="text-lg font-black font-display text-[#0a3d62] dark:text-white mt-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#7F77DD]" />
              6-Month Spending Curve
            </h3>
            <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
              Visualize monthly expense oscillations over the preceding 6 months.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-[#7F77DD]" />
            <span>Rolling Half-Year View</span>
          </div>
        </div>

        {/* Highlight Stats Panels */}
        {hasSpendingHistory && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#f8fafc] dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl">
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Average Monthly</p>
              <p className="text-sm font-extrabold text-[#0a3d62] dark:text-white mt-1 font-mono">
                {currencySymbol}{averageSpending.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#f8fafc] dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl">
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Highest Month</p>
              <p className="text-sm font-extrabold text-red-500 mt-1 font-mono">
                {currencySymbol}{peakSpending.amount.toLocaleString()} 
                <span className="text-[9px] text-slate-400 font-normal ml-1">({peakSpending.month})</span>
              </p>
            </div>
            <div className="hidden sm:block bg-[#f8fafc] dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl">
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Total Accumulated</p>
              <p className="text-sm font-extrabold text-[#27ae60] mt-1 font-mono">
                {currencySymbol}{totalSpentAllMonths.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Chart Canvas */}
        <div className="h-64 sm:h-72 w-full flex items-center justify-center">
          {hasSpendingHistory ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7F77DD" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7F77DD" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a3d62",
                    borderColor: "transparent",
                    borderRadius: "12px",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "12px"
                  }}
                  formatter={(value: any) => [`${currencySymbol}${Number(value).toLocaleString()}`, "Spending"]}
                />
                
                {/* Active limit reference line if budgets are set */}
                {budgets.reduce((sum, b) => sum + b.amount, 0) > 0 && (
                  <ReferenceLine 
                    y={budgets.reduce((sum, b) => sum + b.amount, 0)} 
                    stroke="#ef4444" 
                    strokeDasharray="4 4" 
                    label={{ 
                      value: "Total Monthly Budget Limit", 
                      fill: "#ef4444", 
                      fontSize: 9, 
                      fontWeight: 700,
                      position: "top" 
                    }} 
                  />
                )}

                {/* Main Curve Line */}
                <Line 
                  type="monotone" 
                  dataKey="spending" 
                  stroke="#7F77DD" 
                  strokeWidth={3} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#ef4444" }} 
                  dot={{ r: 4, stroke: "#7F77DD", strokeWidth: 2, fill: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 w-full">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/20 text-[#7F77DD] flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-bold text-[#0a3d62] dark:text-white">Trend Data Pending</h4>
              <p className="text-xs text-[#64748b] dark:text-gray-400 mt-1 max-w-sm">
                Add spending transactions or sync UPI alerts to construct your chronological spending curve.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import { Coins, CheckCircle, ShieldAlert, Award, FileDown, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { CURRENCIES, CURRENCY_SYMBOLS } from "../types.ts";

interface SettingsProps {
  summary: any;
  onRefresh: () => void;
}

export default function Settings({ summary, onRefresh }: SettingsProps) {
  const [currency, setCurrency] = useState(summary?.currencyCode || "INR");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Export States
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [exportPeriod, setExportPeriod] = useState<"all" | "this-month" | "last-month" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportTxs, setExportTxs] = useState<any[]>([]);

  // Calculate high-fidelity Savings Score for the Monthly Report
  const savingsScore = useMemo(() => {
    const totalInc = exportTxs.filter(tx => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0);
    const totalExp = exportTxs.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0);
    if (totalInc === 0) return 60; // default base score
    
    const savingsRate = ((totalInc - totalExp) / totalInc) * 100;
    let score = 65 + Math.max(-35, Math.min(savingsRate * 0.4, 15));
    
    const activeBudgets = summary?.budgets || [];
    let overBudgetCount = 0;
    activeBudgets.forEach((b: any) => {
      const spent = exportTxs.filter(tx => tx.category === b.category && tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0);
      if (spent > b.amount) overBudgetCount++;
    });

    if (activeBudgets.length > 0) {
      const budgetSuccessRate = (activeBudgets.length - overBudgetCount) / activeBudgets.length;
      score += budgetSuccessRate * 20;
    } else {
      score += 15; // standard bonus for default good standing
    }

    return Math.min(Math.round(score), 100);
  }, [exportTxs, summary]);

  // Delete Account States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/update-currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currencyCode: currency }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update currency");
      } else {
        setSuccess("Currency configuration updated successfully!");
        onRefresh();
      }
    } catch (err) {
      setError("Server connection issue.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      if (!res.ok) throw new Error("Could not fetch transactions for statement.");
      
      let transactions = data.transactions || [];
      const now = new Date();

      if (exportPeriod === "this-month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        transactions = transactions.filter((tx: any) => new Date(tx.date) >= startOfMonth);
      } else if (exportPeriod === "last-month") {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        transactions = transactions.filter((tx: any) => {
          const d = new Date(tx.date);
          return d >= startOfLastMonth && d <= endOfLastMonth;
        });
      } else if (exportPeriod === "custom") {
        if (startDate) {
          transactions = transactions.filter((tx: any) => tx.date >= startDate);
        }
        if (endDate) {
          transactions = transactions.filter((tx: any) => tx.date <= endDate);
        }
      }

      // Sort by date descending
      transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const dateStr = new Date().toISOString().split("T")[0];

      if (exportFormat === "csv") {
        const headers = "ID,Date,Merchant/Title,Category,Type,Amount,Note,Tags\n";
        const rows = transactions.map((tx: any) => {
          const safeTitle = (tx.title || "").replace(/"/g, '""');
          const safeCategory = (tx.category || "");
          const safeNote = (tx.note || "").replace(/"/g, '""');
          const safeTags = (tx.tags || []).join("; ");
          return `"${tx.id}","${tx.date}","${safeTitle}","${safeCategory}","${tx.type}","${tx.amount}","${safeNote}","${safeTags}"`;
        }).join("\n");

        const csvContent = headers + rows;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `coinzy_statement_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setExportTxs(transactions);
        setTimeout(() => {
          window.print();
        }, 400);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to generate statement.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type 'DELETE' to confirm account deletion.");
      return;
    }

    setDeleteError("");
    setDeleteLoading(true);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      
      if (!res.ok) {
        setDeleteError(data.error || "Could not delete account.");
      } else {
        window.location.reload();
      }
    } catch (err) {
      setDeleteError("Connection error while requesting deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in max-w-2xl no-print">
        {/* Header */}
        <div>
          <p className="text-xs font-bold text-[#27ae60] uppercase tracking-wider">
            Preferences & Calibration
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[#0a3d62] dark:text-white">
            System Settings
          </h2>
        </div>

        {/* Currency Form Card */}
        <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-[#27ae60]" />
            Default Currency Settings
          </h3>
          <p className="text-xs text-[#64748b] dark:text-gray-400 mb-6">
            Calibrate your base currency representation. Transactions, wallets, budgets, and savings charts will automatically convert to display this symbol.
          </p>

          {success && <p className="text-xs font-bold text-emerald-600 mb-4 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {success}</p>}
          {error && <p className="text-xs font-bold text-red-500 mb-4 flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> {error}</p>}

          <form onSubmit={handleUpdateCurrency} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
                Select Currency
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CURRENCIES.map((code) => {
                  const sym = CURRENCY_SYMBOLS[code] || "$";
                  const isSelected = currency === code;

                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCurrency(code)}
                      className={`p-3 rounded-xl border text-left flex justify-between items-center transition cursor-pointer ${isSelected ? "border-[#27ae60] bg-emerald-50/40 text-gray-900 dark:bg-slate-800 dark:text-white" : "border-[#e2e8f0] dark:border-[#334155] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/40"}`}
                    >
                      <span className="text-xs font-bold font-mono">{code}</span>
                      <span className="text-base font-extrabold text-[#27ae60]">{sym}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#27ae60] hover:bg-[#1e8449] text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-40 cursor-pointer"
            >
              {loading ? "Updating currency..." : "Save Preferences"}
            </button>
          </form>
        </div>

        {/* Export Statement Panel */}
        <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white flex items-center gap-2 mb-4">
            <FileDown className="w-5 h-5 text-[#27ae60]" />
            Export Statement
          </h3>
          <p className="text-xs text-[#64748b] dark:text-gray-400 mb-6">
            Generate and export a secure, transaction ledger statement. Instantly select spreadsheet spreadsheets (CSV) or high-contrast, print-optimized document formatting (PDF).
          </p>

          <div className="space-y-4">
            {/* Format Selector */}
            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat("csv")}
                  className={`p-3.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${exportFormat === "csv" ? "border-[#27ae60] bg-emerald-50/30 text-[#27ae60] dark:bg-slate-800" : "border-[#e2e8f0] dark:border-[#334155] text-gray-600 dark:text-gray-300"}`}
                >
                  CSV Spreadsheet (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat("pdf")}
                  className={`p-3.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${exportFormat === "pdf" ? "border-[#27ae60] bg-emerald-50/30 text-[#27ae60] dark:bg-slate-800" : "border-[#e2e8f0] dark:border-[#334155] text-gray-600 dark:text-gray-300"}`}
                >
                  PDF Document Print (.pdf)
                </button>
              </div>
            </div>

            {/* Period Selector */}
            <div>
              <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                Statement Period
              </label>
              <select
                value={exportPeriod}
                onChange={(e: any) => setExportPeriod(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#e2e8f0] bg-white text-gray-700 dark:bg-slate-800 dark:border-[#334155] dark:text-white text-xs font-bold"
              >
                <option value="all">All-Time Statement</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Conditional Custom Dates */}
            {exportPeriod === "custom" && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#e2e8f0] bg-white text-gray-700 dark:bg-slate-800 dark:border-[#334155] dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#e2e8f0] bg-white text-gray-700 dark:bg-slate-800 dark:border-[#334155] dark:text-white text-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              className="w-full bg-[#0a3d62] hover:bg-[#072d48] text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {exportLoading ? "Preparing export..." : `Generate ${exportFormat.toUpperCase()} Statement`}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50/20 border border-red-200/50 dark:bg-red-950/5 dark:border-red-900/30 rounded-3xl p-6">
          <h3 className="text-lg font-extrabold font-display text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Danger Zone
          </h3>
          <p className="text-xs text-[#64748b] dark:text-gray-400 mb-6">
            Once deleted, your account credentials, transactions ledger, budgets, active savings goals, and scanned receipts will be permanently destroyed. This action is irreversible.
          </p>

          {showDeleteConfirm ? (
            <div className="bg-white border border-red-200 dark:bg-slate-900 dark:border-red-900/40 rounded-2xl p-4 space-y-4 animate-fade-in">
              <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Double Confirmation Required
              </p>
              <p className="text-xs text-gray-500">
                Please type <strong className="text-red-600 font-mono">DELETE</strong> in the box below to authorize deletion:
              </p>

              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full p-3 rounded-xl border border-red-200 text-center font-bold font-mono text-sm bg-red-50/10 dark:bg-slate-800 dark:border-slate-700 text-red-600 dark:text-red-400 focus:outline-none"
              />

              {deleteError && <p className="text-xs font-bold text-red-500">{deleteError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                    setDeleteError("");
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-xs transition disabled:opacity-40 cursor-pointer"
                >
                  {deleteLoading ? "Destroying Account..." : "Confirm Deletion"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20 py-3 rounded-xl font-bold text-sm transition cursor-pointer"
            >
              Permanently Delete My Account
            </button>
          )}
        </div>

        {/* Brand card */}
        <div className="bg-gradient-to-br from-[#0a3d62] to-[#1a5f91] text-white rounded-3xl p-6 shadow-sm flex items-start gap-4">
          <Award className="w-10 h-10 shrink-0 text-yellow-300 mt-1" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm">Automated Finance Tracker v2.0</h4>
            <p className="text-xs text-white/80 leading-relaxed">
              Trackify is designed for modern, friction-free tracking of finances. By linking email notifications with high-contrast local analytics charts and goal projections, it gives you complete financial freedom.
            </p>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY EMBEDDED CONTAINER */}
      <div className="hidden print:block print-container font-sans bg-white text-black p-8">
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">COINZY STATEMENT</h1>
            <p className="text-sm text-slate-500 mt-1">Automated Financial Report • Trackify</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p><strong>Statement Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Selected Period:</strong> {exportPeriod.toUpperCase().replace("-", " ")}</p>
            {exportPeriod === "custom" && <p>{startDate} to {endDate}</p>}
            <p><strong>Currency:</strong> {summary?.currencyCode || "INR"}</p>
          </div>
        </div>

        {/* METRICS & SCORE */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border rounded-xl p-4 bg-slate-50">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Income</p>
            <p className="text-lg font-extrabold text-emerald-600 mt-1 font-mono">
              {(CURRENCY_SYMBOLS[summary?.currencyCode || "INR"] || "$")}{" "}
              {exportTxs.filter(tx => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="border rounded-xl p-4 bg-slate-50">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Expenses</p>
            <p className="text-lg font-extrabold text-red-500 mt-1 font-mono">
              {(CURRENCY_SYMBOLS[summary?.currencyCode || "INR"] || "$")}{" "}
              {exportTxs.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="border rounded-xl p-4 bg-slate-50">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Net Flow</p>
            <p className={`text-lg font-extrabold mt-1 font-mono ${
              exportTxs.reduce((sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount), 0) >= 0 
                ? "text-emerald-600" 
                : "text-red-500"
            }`}>
              {(CURRENCY_SYMBOLS[summary?.currencyCode || "INR"] || "$")}{" "}
              {exportTxs.reduce((sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="border rounded-xl p-4 bg-emerald-50 border-emerald-200">
            <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Saving Score</p>
            <p className="text-lg font-extrabold text-emerald-700 mt-1">
              {savingsScore} <span className="text-xs text-emerald-500">/ 100</span>
            </p>
          </div>
        </div>

        {/* ACTIVE BUDGETS PERFORMANCES */}
        {summary?.budgets && summary.budgets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Active Category Budgets Performance</h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-slate-100">
                  <th className="py-2 px-3 font-bold text-slate-600">Category</th>
                  <th className="py-2 px-3 font-bold text-slate-600">Monthly Budget</th>
                  <th className="py-2 px-3 font-bold text-slate-600">Actual Spend</th>
                  <th className="py-2 px-3 font-bold text-slate-600 text-right">Status Margin</th>
                </tr>
              </thead>
              <tbody>
                {summary.budgets.map((b: any, idx: number) => {
                  const spent = exportTxs.filter(tx => tx.category === b.category && tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0);
                  const isOver = spent > b.amount;
                  return (
                    <tr key={idx} className="border-b">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{b.category}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{(CURRENCY_SYMBOLS[summary?.currencyCode || "INR"] || "$")}{b.amount.toLocaleString()}</td>
                      <td className={`py-2.5 px-3 font-semibold font-mono ${isOver ? "text-red-600" : "text-slate-700"}`}>
                        {(CURRENCY_SYMBOLS[summary?.currencyCode || "INR"] || "$")}{spent.toLocaleString()}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${isOver ? "text-red-500" : "text-emerald-600"}`}>
                        {isOver ? `Over by ${(CURRENCY_SYMBOLS[summary?.currencyCode || "INR"] || "$")}${(spent - b.amount).toLocaleString()}` : "Safe Margin"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TARGET SAVINGS GOALS */}
        {summary?.goals && summary.goals.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Target Savings Goals Status</h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-slate-100">
                  <th className="py-2 px-3 font-bold text-slate-600">Goal Title</th>
                  <th className="py-2 px-3 font-bold text-slate-600">Target Goal</th>
                  <th className="py-2 px-3 font-bold text-slate-600">Amount Saved</th>
                  <th className="py-2 px-3 font-bold text-slate-600 text-right font-semibold">Progress Achieved</th>
                </tr>
              </thead>
              <tbody>
                {summary.goals.map((g: any, idx: number) => {
                  const pct = Math.min((g.savedAmount / g.targetAmount) * 100, 100);
                  return (
                    <tr key={idx} className="border-b">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{g.title}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{(CURRENCY_SYMBOLS[summary?.currencyCode || "INR"] || "$")}{g.targetAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{(CURRENCY_SYMBOLS[summary?.currencyCode || "INR"] || "$")}{g.savedAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600 font-mono">{pct.toFixed(0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TRANSACTION LIST */}
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Itemized Transaction Ledger</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-slate-100">
              <th className="py-2 px-3 text-[10px] font-bold uppercase text-slate-600">Date</th>
              <th className="py-2 px-3 text-[10px] font-bold uppercase text-slate-600">Merchant/Title</th>
              <th className="py-2 px-3 text-[10px] font-bold uppercase text-slate-600">Category</th>
              <th className="py-2 px-3 text-[10px] font-bold uppercase text-slate-600 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {exportTxs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">No transactions recorded for the selected range.</td>
              </tr>
            ) : (
              exportTxs.map((tx, idx) => (
                <tr key={tx.id || idx} className="border-b">
                  <td className="py-2 px-3 text-xs text-slate-600 font-mono">{tx.date}</td>
                  <td className="py-2 px-3 text-xs font-semibold text-slate-800">
                    {tx.title}
                    {tx.note && <span className="block text-[10px] text-slate-400 mt-0.5">{tx.note}</span>}
                  </td>
                  <td className="py-2 px-3 text-xs text-slate-500">{tx.category}</td>
                  <td className={`py-2 px-3 text-xs font-bold text-right font-mono ${tx.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                    {tx.type === "income" ? "+" : "-"}{(CURRENCY_SYMBOLS[summary?.currencyCode || "INR"] || "$")}{tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="mt-12 pt-6 border-t text-center text-[10px] text-slate-400 uppercase tracking-widest">
          <p>This is a digital ledger statement generated via Trackify.</p>
          <p className="mt-1">coinzy_statement_report • Confidentiality Secured</p>
        </div>
      </div>
    </>
  );
}


import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  FileText, 
  Upload, 
  Check, 
  X,
  AlertCircle
} from "lucide-react";
import { CATEGORIES, INCOME_CATS, CAT_ICONS, CURRENCY_SYMBOLS } from "../types.ts";

interface TransactionsProps {
  summary: any;
  onRefresh: () => void;
}

export default function Transactions({ summary, onRefresh }: TransactionsProps) {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Add Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [formError, setFormError] = useState("");

  // Receipt Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [scanError, setScanError] = useState("");

  const currencyCode = summary?.currencyCode || "INR";
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      if (res.ok) {
        setTxs(data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!title || !amount || !category || !date) {
      setFormError("Please fill in all mandatory fields.");
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError("Please enter a valid transaction amount.");
      return;
    }

    try {
      const payload = {
        title,
        amount: amt,
        category,
        date,
        note,
        type: txType,
        tags: tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : []
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to add transaction");
      } else {
        // Reset and refresh
        setTitle("");
        setAmount("");
        setNote("");
        setTagsStr("");
        setShowAddForm(false);
        fetchTransactions();
        onRefresh();
      }
    } catch (err) {
      setFormError("Server error. Please try again.");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This action will adjust your wallet balance.")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTransactions();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Receipt scanning
  const handleScanReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanFile) return;

    setScanLoading(true);
    setScanError("");
    setScannedItems([]);

    const formData = new FormData();
    formData.append("bill", scanFile);

    try {
      const res = await fetch("/api/sync/receipt", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setScanError(data.error || "Failed to scan receipt");
      } else {
        setScannedItems(data.items || []);
      }
    } catch (err) {
      setScanError("OCR scanner service error.");
    } finally {
      setScanLoading(false);
    }
  };

  // Confirm and Import OCR Items
  const handleImportScannedItems = async () => {
    try {
      // We will loop and post each scanned item as an expense
      for (const item of scannedItems) {
        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            amount: item.amount,
            category: item.category,
            date: new Date().toISOString().split('T')[0],
            note: "Imported from scanned bill receipt OCR",
            type: "expense"
          }),
        });
      }
      
      // Close OCR panels
      setScannedItems([]);
      setScanFile(null);
      setShowScanner(false);
      fetchTransactions();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Inferred category matching helper
  const filteredTxs = txs.filter((tx) => {
    const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase()) || 
                          (tx.note && tx.note.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || tx.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-bold text-[#27ae60] uppercase tracking-wider">
            Ledger & Expenses
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[#0a3d62] dark:text-white">
            Transactions History
          </h2>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setShowScanner(!showScanner);
              setShowAddForm(false);
              setScannedItems([]);
              setScanFile(null);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#0a3d62] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#072d48] dark:bg-slate-700 dark:hover:bg-slate-600 transition cursor-pointer"
          >
            <FileText className="w-4.5 h-4.5" />
            Scan Bill Receipt
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowScanner(false);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#27ae60] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#1e8449] transition cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            Manual Add
          </button>
        </div>
      </div>

      {/* RECEIPT SCANNING MODAL DRAWER */}
      {showScanner && (
        <div className="p-6 bg-[#e9f7ef] border border-emerald-200 rounded-3xl dark:bg-slate-800 dark:border-emerald-900/40">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-extrabold text-[#1a5f35] dark:text-[#60a5fa] font-display flex items-center gap-2">
                📸 Intelligent Bill & Receipt Scanner (OCR)
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                Upload a bill photo (grocery, uber trip, hotel) to extract and import items automatically.
              </p>
            </div>
            <button onClick={() => setShowScanner(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!scannedItems.length ? (
            <form onSubmit={handleScanReceipt} className="space-y-4">
              <div className="border-2 border-dashed border-[#27ae60]/40 rounded-2xl p-8 text-center bg-white dark:bg-[#1e293b]">
                <Upload className="w-10 h-10 text-[#27ae60] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#0a3d62] dark:text-white mb-1">
                  Drag and drop your bill receipt image here
                </p>
                <p className="text-xs text-[#64748b]">Supports JPG, PNG up to 5MB</p>
                
                <input
                  type="file"
                  id="receiptUpload"
                  accept="image/*"
                  onChange={(e) => setScanFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
                <label
                  htmlFor="receiptUpload"
                  className="mt-4 inline-block bg-[#e9f7ef] text-[#27ae60] font-bold text-xs px-4 py-2 rounded-xl border border-emerald-200 hover:bg-[#27ae60] hover:text-white transition cursor-pointer"
                >
                  {scanFile ? scanFile.name : "Select Image File"}
                </label>
              </div>

              {scanError && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {scanError}
                </p>
              )}

              {scanFile && (
                <button
                  type="submit"
                  disabled={scanLoading}
                  className="w-full bg-[#27ae60] hover:bg-[#1e8449] text-white py-3 rounded-xl font-bold transition disabled:opacity-40 cursor-pointer text-sm"
                >
                  {scanLoading ? "Scanning Receipt Items with OCR..." : "Perform OCR Scan & Extract Items"}
                </button>
              )}
            </form>
          ) : (
            // Review Extracted items
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-emerald-100 shadow-sm">
                <h4 className="font-extrabold text-sm text-[#0a3d62] dark:text-white mb-3">
                  Review Extracted Receipt Items
                </h4>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {scannedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#f8fafc] dark:bg-[#0f172a] p-3 rounded-xl">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-gray-900 dark:text-white">{item.title}</p>
                        <span className="inline-block mt-1 text-[10px] bg-[#e9f7ef] text-[#27ae60] px-2 py-0.5 rounded font-bold">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-xs font-extrabold text-gray-900 dark:text-white">
                        {currencySymbol}{item.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setScannedItems([])}
                  className="flex-1 bg-white border border-[#e2e8f0] text-gray-700 py-3 rounded-xl font-bold text-xs hover:bg-[#f8fafc] dark:bg-[#1e293b] dark:border-[#334155] dark:text-white transition cursor-pointer"
                >
                  Cancel Scan
                </button>
                <button
                  onClick={handleImportScannedItems}
                  className="flex-1 bg-[#27ae60] hover:bg-[#1e8449] text-white py-3 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Import All {scannedItems.length} Scanned Items
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANUAL TRANSACTION ADDER FORM */}
      {showAddForm && (
        <form onSubmit={handleAddTransaction} className="p-6 bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#e2e8f0] dark:border-[#334155]">
            <h3 className="font-extrabold font-display text-[#0a3d62] dark:text-white">
              Add New Transaction
            </h3>
            {/* Type Selector (Expense vs Income) */}
            <div className="flex gap-1 bg-[#f1f5f9] dark:bg-[#0f172a] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setTxType("expense"); setCategory("Food"); }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${txType === "expense" ? "bg-red-500 text-white" : "text-gray-500 hover:text-gray-800"}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => { setTxType("income"); setCategory("Salary"); }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${txType === "income" ? "bg-[#27ae60]" : "text-gray-500 hover:text-gray-800"}`}
              >
                Income
              </button>
            </div>
          </div>

          {formError && <p className="text-xs font-bold text-red-500">{formError}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider mb-1">
                Merchant / Payee Name *
              </label>
              <input
                type="text"
                required
                placeholder={txType === "expense" ? "Organic Supermarket" : "Corporate Payout"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] dark:text-white text-sm"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider mb-1">
                Amount ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] dark:text-white text-sm"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] dark:text-white text-sm"
              >
                {txType === "expense" 
                  ? CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)
                  : INCOME_CATS.map((cat) => <option key={cat} value={cat}>{cat}</option>)
                }
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] dark:text-white text-sm"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider mb-1">
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="Short memo or comment"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] dark:text-white text-sm"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="office, weekly, leisure"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-white border border-[#e2e8f0] text-gray-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#f8fafc] dark:bg-[#1e293b] dark:border-[#334155] dark:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#27ae60] hover:bg-[#1e8449] text-white font-bold px-6 py-2 rounded-xl text-sm cursor-pointer"
            >
              Save Transaction
            </button>
          </div>
        </form>
      )}

      {/* FILTER CONTROLS */}
      <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] p-4 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#27ae60] dark:text-white"
          />
        </div>

        {/* Filter Sliders */}
        <div className="flex flex-wrap gap-2">
          {/* Type dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl text-xs font-bold text-[#64748b] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#27ae60]"
          >
            <option value="all">💳 All Transaction Types</option>
            <option value="expense">📉 Expense Ledger Only</option>
            <option value="income">📈 Income Receipts Only</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl text-xs font-bold text-[#64748b] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#27ae60]"
          >
            <option value="all">📂 All Categories</option>
            {[...CATEGORIES, ...INCOME_CATS].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LEDGER TABLE */}
      <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center p-12 text-gray-500">Retrieving transactions ledger...</div>
        ) : filteredTxs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] dark:bg-[#0f172a] border-b border-[#e2e8f0] dark:border-[#334155]">
                  <th className="p-4 text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider">Transaction</th>
                  <th className="p-4 text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="p-4 text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider text-right">Amount</th>
                  <th className="p-4 text-xs font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="border-b border-[#e2e8f0] dark:border-[#334155] last:border-0 hover:bg-[#f8fafc]/40 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-1.5 bg-[#f8fafc] dark:bg-[#0f172a] rounded-xl shrink-0">
                          {CAT_ICONS[tx.category] || "💳"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{tx.title}</p>
                          {tx.note && <p className="text-[11px] text-gray-400 dark:text-gray-400 truncate mt-0.5">{tx.note}</p>}
                          {tx.tags && tx.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tx.tags.map((tag: string) => (
                                <span key={tag} className="text-[9px] font-bold bg-[#f1f5f9] dark:bg-[#0f172a] text-[#64748b] dark:text-gray-300 px-1.5 py-0.5 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-300">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-[#64748b] dark:text-gray-400 whitespace-nowrap">{tx.date}</td>
                    <td className={`p-4 text-right font-extrabold text-sm whitespace-nowrap ${tx.type === 'income' ? 'text-[#27ae60]' : 'text-red-500'}`}>
                      <span className="inline-flex items-center gap-1 justify-end">
                        {tx.type === 'income' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-16">
            <SlidersHorizontal className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="font-extrabold text-[#0a3d62] dark:text-white">No Matching Transactions</h4>
            <p className="text-xs text-[#64748b] dark:text-gray-400 mt-1">Adjust search terms or query filters and try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}

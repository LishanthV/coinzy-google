import { useState, useEffect } from "react";
import { 
  Sparkles, 
  MailWarning, 
  CheckCircle2, 
  RefreshCw, 
  Inbox, 
  Check, 
  Layers, 
  HelpCircle,
  Smartphone,
  Copy,
  CheckCheck,
  Send,
  ArrowRight,
  Wifi
} from "lucide-react";
import { CATEGORIES, INCOME_CATS, CAT_ICONS, CURRENCY_SYMBOLS } from "../types.ts";

interface UPISyncProps {
  summary: any;
  onRefresh: () => void;
}

export default function UPISync({ summary, onRefresh }: UPISyncProps) {
  const [upiTxs, setUpiTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editMap, setEditMap] = useState<Record<string, { title: string; category: string; amount: string; date: string; type: string }>>({});
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [customSms, setCustomSms] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const currencyCode = summary?.currencyCode || "INR";
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || "$";

  const fetchUpiTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sync/gmail");
      const data = await res.json();
      if (res.ok) {
        const txs = data.transactions || [];
        setUpiTxs(txs);
        // Pre-fill edits map
        const initialMap: typeof editMap = {};
        txs.forEach((tx: any) => {
          const isInc = tx.type === "income";
          initialMap[tx.id] = {
            title: tx.title,
            category: tx.category || (isInc ? "Salary" : "Others"),
            amount: tx.amount.toString(),
            date: tx.date || new Date().toISOString().split("T")[0],
            type: tx.type || "expense"
          };
        });
        setEditMap(initialMap);
        setSelectedIds(txs.map((tx: any) => tx.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpiTransactions();
  }, []);

  const handleScanInbox = async () => {
    setFetchLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/sync/gmail/fetch", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message);
        fetchUpiTransactions();
        onRefresh();
      } else {
        setErrorMsg(data.error || "Failed to fetch inbox");
      }
    } catch (err) {
      setErrorMsg("Connection to sync service lost.");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleFieldChange = (id: string, field: "title" | "category" | "amount" | "date", value: string) => {
    setEditMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleImportSelected = async () => {
    if (selectedIds.length === 0) return;
    setSuccessMsg("");
    setErrorMsg("");

    // Prepare batch imports array matching server's expected { id, title, amount, category, date, upiRef, type }
    const imports = selectedIds.map((id) => {
      const edits = editMap[id];
      const original = upiTxs.find((t) => t.id === id);
      return {
        id,
        title: edits?.title || original.title,
        amount: parseFloat(edits?.amount || original.amount),
        category: edits?.category || original.category,
        date: edits?.date || original.date,
        upiRef: original.upiRef,
        type: edits?.type || original.type || "expense"
      };
    });

    try {
      const res = await fetch("/api/sync/gmail/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imports }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message);
        fetchUpiTransactions();
        onRefresh();
      } else {
        setErrorMsg(data.error || "Failed to import selected items");
      }
    } catch (err) {
      setErrorMsg("Sync confirmation service offline.");
    }
  };

  const handleSimulateSms = async (textToUse?: string) => {
    const text = textToUse || customSms;
    if (!text.trim()) return;

    setSmsSending(true);
    setSmsSuccess("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/sync/sms-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sender: "SBI-BANK",
          email: summary?.email || "demo@example.com"
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSmsSuccess(data.message);
        if (!textToUse) setCustomSms("");
        fetchUpiTransactions();
        onRefresh();
        setTimeout(() => setSmsSuccess(""), 5000);
      } else {
        setErrorMsg(data.error || "Failed to process SMS");
      }
    } catch (err) {
      setErrorMsg("Failed to connect to the SMS parsing gateway.");
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-bold text-[#27ae60] uppercase tracking-wider">
            Automated Inbox Scanning
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[#0a3d62] dark:text-white">
            UPI Gmail & GPay Synchronizer
          </h2>
        </div>
        <button
          onClick={handleScanInbox}
          disabled={fetchLoading}
          className="inline-flex items-center gap-2 bg-[#27ae60] text-white text-sm font-bold px-5 py-3 rounded-xl hover:bg-[#1e8449] transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${fetchLoading ? "animate-spin" : ""}`} />
          {fetchLoading ? "Scanning Mail Inbox..." : "Scan Mail Inbox"}
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-sm dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-[#27ae60] shrink-0 mt-0.5" />
          <p className="text-xs font-semibold">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl flex items-start gap-3 shadow-sm dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
          <MailWarning className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold">{errorMsg}</p>
        </div>
      )}

      {/* Synchronizer Guide Card */}
      <div className="p-6 bg-gradient-to-r from-sky-50 to-blue-50 border border-blue-100 rounded-3xl dark:from-slate-800 dark:to-slate-900 dark:border-[#334155] flex flex-col md:flex-row gap-5 items-center justify-between">
        <div className="space-y-1.5 text-center md:text-left">
          <h3 className="font-extrabold text-[#0a3d62] dark:text-white text-base">
            How UPI Inbox Sync Works
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-xl">
            Trackify scans your incoming transaction alert emails (from GPay, PhonePe, SBI, Paytm). When it detects a transaction, it queues it here. You can change categories, rename merchants, and import them with 1-click.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-3 py-1.5 rounded-full dark:bg-sky-950/40 dark:text-sky-300">
            No API Keys Needed
          </span>
          <span className="bg-emerald-100 text-[#27ae60] text-[10px] font-bold px-3 py-1.5 rounded-full dark:bg-emerald-950/40">
            Privacy Protected
          </span>
        </div>
      </div>

      {/* Mobile SMS Webhook Setup & Simulation Gateway */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guide */}
        <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl">
                <Smartphone className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white">
                Live Mobile SMS Auto-Tracker Setup
              </h3>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              When your bank sends you an SMS about debited or credited money, you can have your phone automatically send it directly to this application in real-time.
            </p>

            {/* Unique Webhook URL */}
            <div className="space-y-2 mb-4">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Personal Webhook URL</label>
              <div className="flex items-center gap-2 bg-[#f8fafc] dark:bg-[#0f172a] p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={window.location.origin + "/api/sync/sms-webhook?email=" + encodeURIComponent(summary?.email || "demo@example.com")}
                  className="w-full bg-transparent text-xs font-mono text-[#0a3d62] dark:text-blue-400 focus:outline-none select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + "/api/sync/sms-webhook?email=" + encodeURIComponent(summary?.email || "demo@example.com"));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg text-gray-500 transition cursor-pointer"
                  title="Copy URL"
                >
                  {copied ? <CheckCheck className="w-4 h-4 text-[#27ae60]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Android vs iOS instructions */}
            <div className="space-y-3">
              <div className="border-l-2 border-blue-500 pl-3">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Android (Recommended)</span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Use <strong>MacroDroid</strong>, <strong>Tasker</strong>, or any free SMS Forwarder app. Create a trigger for "Incoming SMS" from bank sender IDs, and add an action to send an HTTP POST request to your URL above, passing the SMS body in the body parameter: <code className="bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">{"{ \"message\": \"[sms_body]\" }"}</code>.
                </p>
              </div>

              <div className="border-l-2 border-[#27ae60] pl-3">
                <span className="text-[11px] font-bold text-[#27ae60] uppercase tracking-wider">iOS (Apple Shortcuts)</span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Open Apple <strong>Shortcuts</strong> &rarr; <strong>Automation</strong> &rarr; Create Personal Automation &rarr; Choose <strong>"Message"</strong> or <strong>"Transaction"</strong> &rarr; Set Action to <strong>"Get Contents of URL"</strong>, set method to <strong>POST</strong>, and add request body: <code className="bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">{"{ \"message\": ShortcutInput }"}</code>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 text-[10px] text-gray-400 font-medium">
            <Wifi className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Webhook is live and ready to receive real-time POST requests.</span>
          </div>
        </div>

        {/* Simulator */}
        <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl">
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </span>
              <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white">
                Live SMS Webhook Simulator
              </h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              Don't want to wait for a real SMS? Test our intelligent bank text parsing engine by choosing a template below or writing your own fake bank alert!
            </p>

            {/* Quick Templates */}
            <div className="space-y-2 mb-4">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tap a bank alert template to populate:</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setCustomSms("Your a/c no. XXXXX9912 has been debited by Rs. 380.00 on 11-Jul-2026 at Swiggy. Info: UPI-391827.")}
                  className="text-left text-[11px] bg-[#f8fafc] hover:bg-[#f1f5f9] dark:bg-[#1e293b] dark:hover:bg-slate-700 p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 transition-all text-ellipsis overflow-hidden whitespace-nowrap"
                >
                  🔴 <strong>Debit:</strong> "debited Rs. 380.00 at Swiggy..."
                </button>
                <button
                  type="button"
                  onClick={() => setCustomSms("Dear SBI Customer, Rs 14500.00 credited to a/c XXXXX8871 via UPI Ref 314562817290 from TCS Salary.")}
                  className="text-left text-[11px] bg-[#f8fafc] hover:bg-[#f1f5f9] dark:bg-[#1e293b] dark:hover:bg-slate-700 p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 transition-all text-ellipsis overflow-hidden whitespace-nowrap"
                >
                  🟢 <strong>Credit:</strong> "credited Rs 14500.00 via UPI TCS Salary..."
                </button>
                <button
                  type="button"
                  onClick={() => setCustomSms("Transaction alert: Rs. 1200.00 spent on Amazon India via HDFC Card.")}
                  className="text-left text-[11px] bg-[#f8fafc] hover:bg-[#f1f5f9] dark:bg-[#1e293b] dark:hover:bg-slate-700 p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 transition-all text-ellipsis overflow-hidden whitespace-nowrap"
                >
                  🔴 <strong>Debit:</strong> "Rs. 1,200.00 spent on Amazon India..."
                </button>
              </div>
            </div>

            {/* Custom SMS Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">SMS Alert Message Text</label>
              <textarea
                value={customSms}
                onChange={(e) => setCustomSms(e.target.value)}
                placeholder="Paste or write any custom bank SMS alert text here..."
                rows={3}
                className="w-full p-3 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl text-xs font-mono text-[#0a3d62] dark:text-white focus:ring-1 focus:ring-[#27ae60] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleSimulateSms()}
              disabled={smsSending || !customSms.trim()}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#27ae60] hover:bg-[#1e8449] disabled:opacity-40 text-white text-xs font-bold py-3 px-4 rounded-xl transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {smsSending ? "Parsing Alert..." : "Parse & Simulate SMS Webhook"}
            </button>
            {smsSuccess && (
              <p className="text-[11px] text-center text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                {smsSuccess}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Alerts Queue */}
      <div className="bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-extrabold font-display text-[#0a3d62] dark:text-white">
              Pending Transaction Alerts ({upiTxs.length})
            </h3>
            <p className="text-xs text-[#64748b] dark:text-gray-400 mt-1">
              Select transaction rows to finalize and append to your expenses ledger.
            </p>
          </div>

          {upiTxs.length > 0 && (
            <button
              onClick={handleImportSelected}
              disabled={selectedIds.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0a3d62] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#072d48] dark:bg-blue-600 dark:hover:bg-blue-700 transition cursor-pointer disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              Approve & Import Selected ({selectedIds.length})
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Checking pending sync database...</div>
        ) : upiTxs.length > 0 ? (
          <div className="space-y-4">
            {upiTxs.map((tx) => {
              const isSelected = selectedIds.includes(tx.id);
              const fields = editMap[tx.id] || { 
                title: tx.title, 
                category: tx.category || (tx.type === "income" ? "Salary" : "Others"), 
                amount: tx.amount.toString(), 
                date: tx.date,
                type: tx.type || "expense"
              };
              const isIncome = fields.type === "income";
              const categoriesToUse = isIncome ? INCOME_CATS : CATEGORIES;

              return (
                <div
                  key={tx.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center gap-4 ${
                    isSelected 
                      ? isIncome 
                        ? "border-[#27ae60] bg-emerald-50/20 dark:bg-emerald-950/20"
                        : "border-[#27ae60] bg-emerald-50/20 dark:bg-slate-800/30" 
                      : isIncome
                        ? "border-emerald-200 bg-emerald-50/5 dark:border-emerald-900/30 dark:bg-emerald-950/5"
                        : "border-[#e2e8f0] dark:border-[#334155]"
                  }`}
                >
                  {/* Select Checkbox */}
                  <div className="flex items-center gap-3 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(tx.id)}
                      className="w-5 h-5 rounded border-[#e2e8f0] text-[#27ae60] focus:ring-[#27ae60] cursor-pointer"
                    />
                    <span className="text-2xl p-1.5 bg-[#f8fafc] dark:bg-[#0f172a] rounded-xl">
                      {isIncome ? "💰" : (CAT_ICONS[fields.category] || "💳")}
                    </span>
                  </div>

                  {/* Fields editing section */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Title */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Merchant / Title</label>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${isIncome ? "bg-emerald-100 text-[#27ae60] dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"}`}>
                          {isIncome ? "CREDIT" : "DEBIT"}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={fields.title}
                        onChange={(e) => handleFieldChange(tx.id, "title", e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#27ae60] dark:text-white"
                      />
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                      <select
                        value={fields.category}
                        onChange={(e) => handleFieldChange(tx.id, "category", e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#27ae60] dark:text-white"
                      >
                        {categoriesToUse.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Amount & Date info */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount ({currencySymbol})</label>
                      <input
                        type="number"
                        value={fields.amount}
                        onChange={(e) => handleFieldChange(tx.id, "amount", e.target.value)}
                        className={`w-full px-3 py-1.5 bg-white border border-[#e2e8f0] dark:bg-[#1e293b] dark:border-[#334155] rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#27ae60] dark:text-white ${isIncome ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                      />
                    </div>
                  </div>

                  {/* Metadata source badges */}
                  <div className="flex md:flex-col justify-between items-end gap-1.5 shrink-0 text-right">
                    <span className="text-[9px] font-bold text-[#64748b] bg-[#f1f5f9] dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      UPI Ref: {tx.upiRef || "N/A"}
                    </span>
                    <span className="text-[9px] font-semibold text-sky-600">
                      Source: {tx.sourceEmail}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 flex flex-col items-center justify-center">
            <Inbox className="w-12 h-12 text-gray-300 mb-3" />
            <h4 className="font-extrabold text-[#0a3d62] dark:text-white">All Clear! No alerts queue.</h4>
            <p className="text-xs text-[#64748b] dark:text-gray-400 mt-1 max-w-sm">
              Your UPI Inbox queue is fully reconciled! Hit the <strong className="text-[#27ae60]">"Scan Mail Inbox"</strong> button to scrape fresh transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

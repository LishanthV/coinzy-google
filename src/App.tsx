import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet as WalletIcon, 
  CalendarClock, 
  SmartphoneNfc, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  WifiOff
} from "lucide-react";

import Auth from "./components/Auth.tsx";
import Dashboard from "./components/Dashboard.tsx";
import Transactions from "./components/Transactions.tsx";
import Wallet from "./components/Wallet.tsx";
import Recurring from "./components/Recurring.tsx";
import UPISync from "./components/UPISync.tsx";
import Settings from "./components/Settings.tsx";

type Tab = "dashboard" | "transactions" | "wallet" | "recurring" | "upi" | "settings";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);

  // Synchronize browser online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Authenticate on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Check auth failed:", err);
        // Offline fallback for authentication state
        const savedUser = localStorage.getItem("trackifyUser");
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed && parsed.id) {
              console.log("[App] Offline Mode: Restored active session from cache");
              setUser(parsed);
            } else {
              setUser(null);
            }
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    // Load theme setting from localStorage
    const savedTheme = localStorage.getItem("trackifyTheme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  // Synchronize user to localStorage for iframe support
  useEffect(() => {
    if (user) {
      localStorage.setItem("trackifyUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("trackifyUser");
    }
  }, [user]);

  // Fetch metrics whenever user changes or refreshed
  const fetchSummary = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/dashboard/summary");
      if (res.status === 401) {
        setUser(null);
        setSummary(null);
        setActiveTab("dashboard");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setSummary(data);
        // Persist summary locally to support offline visualization
        localStorage.setItem("coinzy_summary", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Fetch summary failed:", err);
      // Retrieve offline summary backup
      const cachedSummary = localStorage.getItem("coinzy_summary");
      if (cachedSummary) {
        try {
          const parsed = JSON.parse(cachedSummary);
          setSummary(parsed);
          console.log("[App] Offline Mode: Displaying offline cached dashboard snapshot");
        } catch (e) {}
      }
    }
  };


  useEffect(() => {
    if (user) {
      fetchSummary();
    }
  }, [user]);

  const handleToggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("trackifyTheme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("trackifyTheme", "dark");
      setIsDarkMode(true);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        sessionStorage.setItem("loggedOut", "true");
        setUser(null);
        setSummary(null);
        setActiveTab("dashboard");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#27ae60] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-[#64748b] dark:text-slate-400 mt-4 tracking-wider uppercase">Loading finance dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onLoginSuccess={(u) => setUser(u)} />;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "transactions", label: "Ledger", icon: ArrowLeftRight },
    { id: "wallet", label: "Wallet & Limits", icon: WalletIcon },
    { id: "recurring", label: "Recurring Bills", icon: CalendarClock },
    { id: "upi", label: "UPI Sync", icon: SmartphoneNfc },
    { id: "settings", label: "Settings", icon: SettingsIcon }
  ] as const;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-[#1e293b] dark:text-slate-100 transition-colors duration-300">
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-[#e2e8f0] dark:border-[#334155] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#27ae60] text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
              C
            </span>
            <span className="font-extrabold text-xl font-display tracking-tight text-[#0a3d62] dark:text-white">
              Coinzy<span className="text-[#27ae60]">.</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? "bg-[#e9f7ef] text-[#27ae60] dark:bg-slate-800 dark:text-[#60a5fa]" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Controls & Toggles */}
          <div className="flex items-center gap-2">
            
            {/* Theme Toggle Button */}
            <button
              onClick={handleToggleTheme}
              className="p-2.5 rounded-xl border border-[#e2e8f0] hover:bg-gray-50 dark:border-[#334155] dark:hover:bg-slate-800 transition cursor-pointer text-gray-500 dark:text-gray-400"
              title="Toggle view theme"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-yellow-300" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Profile Greeting Info */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-100 dark:border-gray-800">
              <span className="w-8 h-8 rounded-full bg-[#f1f5f9] dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <UserIcon className="w-4 h-4" />
              </span>
              <div className="text-left leading-none">
                <p className="text-[11px] font-bold text-[#64748b]">Auth User</p>
                <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate max-w-[100px] mt-0.5">{user.name}</p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex p-2.5 rounded-xl border border-[#e2e8f0] dark:border-[#334155] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
              title="Logout session"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>

            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl border border-[#e2e8f0] dark:border-[#334155] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 border-t border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] space-y-1.5 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition flex items-center gap-3 cursor-pointer ${
                    isActive 
                      ? "bg-[#e9f7ef] text-[#27ae60] dark:bg-slate-800 dark:text-[#60a5fa]" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
            
            {/* Mobile Logout Button row */}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-3 cursor-pointer"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              Sign Out of Session
            </button>
          </div>
        )}
      </header>

      {/* OFFLINE STATUS NOTIFICATION BANNER */}
      {isOffline && (
        <div id="offline-network-banner" className="bg-amber-500 text-white text-xs font-black text-center py-2 px-4 flex items-center justify-center gap-2 animate-pulse shadow-inner">
          <WifiOff className="w-4 h-4 text-white animate-bounce" />
          <span>Offline Mode — Viewing cached local data. Some features require connection.</span>
        </div>
      )}

      {/* CORE CONTENT SWITCH ROUTER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {activeTab === "dashboard" && (
          <Dashboard 
            summary={summary} 
            user={user}
            onNavigate={(tab) => setActiveTab(tab as Tab)} 
            onRefresh={fetchSummary} 
          />
        )}
        {activeTab === "transactions" && (
          <Transactions 
            summary={summary} 
            onRefresh={fetchSummary} 
          />
        )}
        {activeTab === "wallet" && (
          <Wallet 
            summary={summary} 
            onRefresh={fetchSummary} 
          />
        )}
        {activeTab === "recurring" && (
          <Recurring 
            summary={summary} 
            onRefresh={fetchSummary} 
          />
        )}
        {activeTab === "upi" && (
          <UPISync 
            summary={summary} 
            onRefresh={fetchSummary} 
          />
        )}
        {activeTab === "settings" && (
          <Settings 
            summary={summary} 
            onRefresh={fetchSummary} 
          />
        )}
      </main>

      {/* FOOTER METRICS RAIL */}
      <footer className="mt-16 py-6 border-t border-[#e2e8f0] dark:border-[#334155] text-center text-xs text-[#64748b] dark:text-gray-500 bg-white dark:bg-[#1e293b]/40 mb-16 md:mb-0">
        <p className="font-semibold">Coinzy Smart Financial Dashboard © 2026</p>
        <p className="text-[10px] mt-1 text-gray-400 dark:text-gray-600">
          Powered by Express Core Engine, React View Layer & File-based DB Persistence
        </p>
      </footer>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md border-t border-[#e2e8f0] dark:border-[#334155] shadow-lg px-2 py-2.5 flex items-center justify-around pb-safe no-print">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 cursor-pointer ${
                isActive 
                  ? "text-[#27ae60] dark:text-[#60a5fa] scale-105" 
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
              <span className="text-[10px] font-bold tracking-tight text-center truncate w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

import React, { useState } from "react";
import { LogIn, UserPlus, KeyRound, Mail, User, ShieldCheck, RefreshCw } from "lucide-react";

interface AuthProps {
  onLoginSuccess: (user: any) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  // OTP Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpVal, setOtpVal] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.error === "unverified") {
          // Redirect to verification
          setVerifyEmail(data.email);
          setIsVerifying(true);
          setSuccess("Account is unverified. We resent an OTP!");
          // Trigger OTP resend to terminal
          fetch("/api/auth/resend-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email }),
          }).then(r => r.json()).then(d => {
            if (d.otp) setDevOtp(d.otp);
          });
        } else {
          setError(data.error || "Login failed");
        }
      } else {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setSuccess(data.message);
        setVerifyEmail(email);
        if (data.otp) {
          setDevOtp(data.otp);
        }
        setIsVerifying(true);
      }
    } catch (err) {
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVal) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, otp: otpVal }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
      } else {
        setSuccess(data.message);
        setIsVerifying(false);
        setIsLogin(true);
        setOtpVal("");
        setDevOtp("");
        setPassword("");
      }
    } catch (err) {
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend OTP");
      } else {
        setSuccess("A fresh verification code has been generated!");
        if (data.otp) {
          setDevOtp(data.otp);
        }
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-height-screen flex items-center justify-center bg-[#f8fafc] px-4 py-12 dark:bg-[#0f172a] transition-colors duration-300">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-[#e2e8f0] shadow-md dark:bg-[#1e293b] dark:border-[#334155] transition-colors duration-300">
        
        {/* Brand Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#e9f7ef] text-[#27ae60] mb-4 dark:bg-[#1e3a8a] dark:text-[#60a5fa]">
            <span className="text-3xl font-bold font-display">T</span>
          </div>
          <h2 className="text-3xl font-bold font-display tracking-tight text-[#0a3d62] dark:text-[#60a5fa]">
            {isVerifying ? "Verify Account" : isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-[#64748b] dark:text-gray-400 mt-1">
            {isVerifying 
              ? `Verification code sent to ${verifyEmail}` 
              : isLogin 
                ? "Sign in to access your Trackify dashboard" 
                : "The smartest way to automate & manage your finance"}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
            {success}
          </div>
        )}

        {/* Development Helper OTP Box */}
        {devOtp && (
          <div className="mb-6 p-4 bg-[#e6f0f7] text-[#0a3d62] text-sm rounded-2xl border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900">
            <p className="font-semibold mb-1">🛠️ Local Dev Helper:</p>
            <p>Your generated registration OTP code is: <strong className="text-lg font-mono text-[#27ae60] dark:text-[#60a5fa]">{devOtp}</strong></p>
          </div>
        )}

        {/* OPT VERIFICATION FORM */}
        {isVerifying ? (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#64748b] dark:text-gray-400 uppercase tracking-wider mb-2">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpVal}
                  onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-mono text-center text-lg tracking-[0.25em] font-bold focus:outline-none focus:ring-2 focus:ring-[#27ae60] dark:bg-[#0f172a] dark:border-[#334155] dark:text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpVal.length !== 6}
              className="w-full bg-[#27ae60] hover:bg-[#1e8449] text-white py-3.5 rounded-xl font-bold transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              Verify OTP & Activate
            </button>

            <div className="flex justify-between items-center pt-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsVerifying(false);
                  setDevOtp("");
                }}
                className="text-[#64748b] hover:text-gray-900 dark:hover:text-white"
              >
                ← Back to registration
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-[#27ae60] font-semibold flex items-center gap-1.5 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Resend Code
              </button>
            </div>
          </form>
        ) : (
          /* LOGIN OR REGISTER FORM */
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-[#64748b] dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] dark:bg-[#0f172a] dark:border-[#334155] dark:text-white"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#64748b] dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] dark:bg-[#0f172a] dark:border-[#334155] dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748b] dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27ae60] dark:bg-[#0f172a] dark:border-[#334155] dark:text-white"
                  required
                />
              </div>
              {!isLogin && (
                <p className="text-[11px] text-[#64748b] dark:text-gray-400 mt-1">
                  Must be at least 8 characters long.
                </p>
              )}
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-[#27ae60] hover:bg-[#1e8449] text-white py-3.5 rounded-xl font-bold transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isLogin ? (
                <>
                  <LogIn className="w-5 h-5" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> Sign Up & Send OTP
                </>
              )}
            </button>

            {/* Default Login Seeding Tips */}
            {isLogin && (
              <div className="pt-2 space-y-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("demo@example.com");
                    setPassword("CoinzyDemo2026!");
                    setTimeout(() => {
                      const btn = document.getElementById("login-submit-btn");
                      if (btn) btn.click();
                    }, 100);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#e9f7ef] hover:bg-[#d4efdf] text-[#27ae60] font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 cursor-pointer border border-[#c2ecd2] dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:border-emerald-800/30"
                >
                  ⚡ Instant Demo Sign-In
                </button>
                <div className="text-center text-[11px] text-gray-400">
                  Credentials: <span className="font-mono select-all text-gray-500 dark:text-gray-300">demo@example.com</span> / <span className="font-mono select-all text-gray-500 dark:text-gray-300">CoinzyDemo2026!</span>
                </div>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccess("");
                }}
                className="text-sm font-semibold text-[#27ae60] dark:text-[#60a5fa] hover:underline"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

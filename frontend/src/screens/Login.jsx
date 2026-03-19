import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

// ── Forgot Password Flow (3-step modal) ────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=newpassword
  const [fpEmail, setFpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const tm = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(tm);
  }, [countdown]);

  const sendOtp = async (email) => {
    setLoading(true); setError("");
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      setStep(2);
      setCountdown(60);
      setCanResend(false);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to send OTP. Check your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!fpEmail) { setError("Please enter your email"); return; }
    await sendOtp(fpEmail);
  };

  const handleResend = () => {
    if (!canResend) return;
    sendOtp(fpEmail);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("OTP must be 6 digits"); return; }
    setLoading(true); setError("");
    try {
      await axiosInstance.post("/auth/verify-otp", { email: fpEmail, otp });
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      await axiosInstance.post("/auth/reset-password-otp", { email: fpEmail, newPassword });
      setSuccess("Password reset! You can now sign in.");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 12, outline: "none",
    background: "#1C1C1C", border: "1px solid #2A2A2A", color: "#F5F5F5",
    fontSize: 14, boxSizing: "border-box",
  };
  const focusStyle = (e) => { e.target.style.border = "1px solid #F59E0B"; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.1)"; };
  const blurStyle = (e) => { e.target.style.border = "1px solid #2A2A2A"; e.target.style.boxShadow = "none"; };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500, display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)"
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#161616", borderRadius: 20, width: 380, padding: "36px 28px 28px",
        position: "relative", border: "1px solid #2A2A2A",
        boxShadow: "0 0 0 1px rgba(245,158,11,0.1), 0 32px 64px rgba(0,0,0,0.8)"
      }}>
        <div style={{ position: "absolute", top: 0, left: 20, right: 20, height: 1, background: "linear-gradient(90deg, transparent, #F59E0B, transparent)", opacity: 0.5 }} />
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%",
          border: "1px solid #2A2A2A", background: "#1C1C1C", color: "#525252", cursor: "pointer", fontSize: 14
        }}>✕</button>

        {/* Step indicators */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= s ? "#F59E0B" : "#2A2A2A", transition: "background 0.3s" }} />
          ))}
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h2 style={{ margin: "0 0 8px", color: "#F5F5F5", fontSize: 18, fontWeight: 800 }}>Password Reset!</h2>
            <p style={{ color: "#737373", fontSize: 14, margin: "0 0 20px" }}>You can now sign in with your new password.</p>
            <button onClick={onClose} style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
              Back to Sign In
            </button>
          </div>
        ) : step === 1 ? (
          <>
            <h2 style={{ margin: "0 0 6px", color: "#F5F5F5", fontSize: 18, fontWeight: 800 }}>Forgot Password</h2>
            <p style={{ margin: "0 0 20px", color: "#737373", fontSize: 13 }}>Enter your email to receive a 6-digit OTP</p>
            <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                placeholder="your@email.com" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} required />
              {error && <p style={{ color: "#FCA5A5", fontSize: 13, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                padding: "12px", borderRadius: 12, border: "none",
                background: loading ? "#2A2A2A" : "linear-gradient(135deg, #F59E0B, #D97706)",
                color: loading ? "#525252" : "#000", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer"
              }}>{loading ? "Sending OTP…" : "Send OTP"}</button>
            </form>
          </>
        ) : step === 2 ? (
          <>
            <h2 style={{ margin: "0 0 6px", color: "#F5F5F5", fontSize: 18, fontWeight: 800 }}>Enter OTP</h2>
            <p style={{ margin: "0 0 4px", color: "#737373", fontSize: 13 }}>Sent to <strong style={{ color: "#A3A3A3" }}>{fpEmail}</strong></p>
            <p style={{ margin: "0 0 20px", color: countdown > 0 ? "#F59E0B" : "#525252", fontSize: 12, fontWeight: 600 }}>
              {countdown > 0 ? `Expires in ${countdown}s` : "OTP expired"}
            </p>
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                style={{ ...inputStyle, fontSize: 24, letterSpacing: 12, textAlign: "center", fontWeight: 800 }}
                onFocus={focusStyle} onBlur={blurStyle}
              />
              {error && <p style={{ color: "#FCA5A5", fontSize: 13, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading || otp.length !== 6} style={{
                padding: "12px", borderRadius: 12, border: "none",
                background: (loading || otp.length !== 6) ? "#2A2A2A" : "linear-gradient(135deg, #F59E0B, #D97706)",
                color: (loading || otp.length !== 6) ? "#525252" : "#000",
                fontWeight: 700, fontSize: 14, cursor: (loading || otp.length !== 6) ? "not-allowed" : "pointer"
              }}>{loading ? "Verifying…" : "Verify OTP"}</button>
              <button type="button" onClick={handleResend} disabled={!canResend} style={{
                background: "none", border: "none", color: canResend ? "#F59E0B" : "#525252",
                fontSize: 13, cursor: canResend ? "pointer" : "not-allowed", fontWeight: 600
              }}>
                {canResend ? "Resend OTP" : `Resend in ${countdown}s`}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ margin: "0 0 6px", color: "#F5F5F5", fontSize: 18, fontWeight: 800 }}>New Password</h2>
            <p style={{ margin: "0 0 20px", color: "#737373", fontSize: 13 }}>Choose a strong new password</p>
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="New password" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} required />
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} required />
              {error && <p style={{ color: "#FCA5A5", fontSize: 13, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                padding: "12px", borderRadius: 12, border: "none",
                background: loading ? "#2A2A2A" : "linear-gradient(135deg, #F59E0B, #D97706)",
                color: loading ? "#525252" : "#000", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer"
              }}>{loading ? "Resetting…" : "Reset Password"}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Login Page ──────────────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("All fields are required"); return; }
    try {
      setLoading(true);
      const res = await axiosInstance.post("/auth/login", { email, password });
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("userId", res.data.userId);
        localStorage.setItem("username", res.data.email);
        if (res.data.role === "ADMIN") navigate("/admin");
        else navigate("/dashboard");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0A0A0A 0%, #111111 50%, #0A0A0A 100%)" }}>

      {/* Subtle grid texture overlay */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }} />

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              boxShadow: "0 0 24px rgba(245,158,11,0.35), 0 4px 16px rgba(0,0,0,0.4)"
            }}>
            <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#F5F5F5" }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: "#737373" }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: "#161616",
            border: "1px solid #2A2A2A",
            boxShadow: "0 0 0 1px rgba(245,158,11,0.08), 0 24px 48px rgba(0,0,0,0.5)"
          }}>

          {/* Gold top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, #F59E0B, transparent)", opacity: 0.6 }} />

          {error && (
            <div className="flex items-center gap-3 text-sm px-4 py-3 rounded-xl mb-6"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#FCA5A5"
              }}>
              🥺 {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#A3A3A3" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm"
                placeholder="john@example.com"
                required
                style={{ background: "#1C1C1C", border: "1px solid #2A2A2A", color: "#F5F5F5" }}
                onFocus={(e) => { e.target.style.border = "1px solid #F59E0B"; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.1)"; }}
                onBlur={(e) => { e.target.style.border = "1px solid #2A2A2A"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium" style={{ color: "#A3A3A3" }}>Password</label>
                <button type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs font-medium transition"
                  style={{ color: "#F59E0B" }}
                  onMouseEnter={(e) => e.target.style.color = "#FBBF24"}
                  onMouseLeave={(e) => e.target.style.color = "#F59E0B"}>
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                  style={{ background: "#1C1C1C", border: "1px solid #2A2A2A", color: "#F5F5F5" }}
                  onFocus={(e) => { e.target.style.border = "1px solid #F59E0B"; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.1)"; }}
                  onBlur={(e) => { e.target.style.border = "1px solid #2A2A2A"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                  style={{ color: "#525252" }}
                  onMouseEnter={(e) => e.target.style.color = "#A3A3A3"}
                  onMouseLeave={(e) => e.target.style.color = "#525252"}>
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-sm transition-all duration-200 mt-2 active:scale-[0.98]"
              style={loading ? {
                background: "#1C1C1C", color: "#525252", cursor: "not-allowed", border: "1px solid #2A2A2A"
              } : {
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#000000", fontWeight: "600",
                boxShadow: "0 4px 16px rgba(245,158,11,0.25)", border: "1px solid #F59E0B"
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 6px 24px rgba(245,158,11,0.4)"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 4px 16px rgba(245,158,11,0.25)"; }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "#525252" }}>
            Don't have an account?{" "}
            <Link to="/register"
              className="font-medium transition"
              style={{ color: "#F59E0B" }}
              onMouseEnter={(e) => e.target.style.color = "#FBBF24"}
              onMouseLeave={(e) => e.target.style.color = "#F59E0B"}>
              Create one
            </Link>
          </p>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
};

export default Login;
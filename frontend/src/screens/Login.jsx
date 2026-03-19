import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.post("/auth/login", { email, password });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("userId", res.data.userId);
        localStorage.setItem("username", res.data.email);
        console.log("userId saved:", res.data.userId);
        if (res.data.role === "ADMIN") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      console.log("err.response.data:", err.response?.data);
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
        style={{
          background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)",
        }} />

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
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#A3A3A3" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm"
                placeholder="john@example.com"
                required
                style={{
                  background: "#1C1C1C",
                  border: "1px solid #2A2A2A",
                  color: "#F5F5F5",
                  "--placeholder-color": "#525252",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid #F59E0B";
                  e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid #2A2A2A";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium" style={{ color: "#A3A3A3" }}>Password</label>
                <button type="button"
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
                  style={{
                    background: "#1C1C1C",
                    border: "1px solid #2A2A2A",
                    color: "#F5F5F5",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid #F59E0B";
                    e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid #2A2A2A";
                    e.target.style.boxShadow = "none";
                  }}
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
                background: "#1C1C1C",
                color: "#525252",
                cursor: "not-allowed",
                border: "1px solid #2A2A2A"
              } : {
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#000000",
                fontWeight: "600",
                boxShadow: "0 4px 16px rgba(245,158,11,0.25)",
                border: "1px solid #F59E0B"
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = "0 6px 24px rgba(245,158,11,0.4)";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = "0 4px 16px rgba(245,158,11,0.25)";
              }}>
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
    </div>
  );
};

export default Login;
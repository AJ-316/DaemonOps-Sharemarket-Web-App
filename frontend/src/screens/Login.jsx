import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [trespass, setTrespass] = useState(false);

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    if (email && password) setStep(2);
  };

  const handleTrespass = () => {
    setTrespass(true);
    setOtp("000000");
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      if (onLoginSuccess) onLoginSuccess();
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen bg-[#ECFDF5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-[#A7F3D0]">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          {step === 1 ? "Login" : "Enter OTP"}
        </h2>

        {step === 1 ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981] focus:ring-opacity-30 outline-none transition"
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981] focus:ring-opacity-30 outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-medium py-3 rounded-xl transition"
            >
              Login
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OTP *
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981] focus:ring-opacity-30 outline-none transition"
                placeholder="6-digit OTP"
                maxLength={6}
              />
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6}
              className={`w-full font-medium py-3 rounded-xl transition ${
                otp.length === 6
                  ? "bg-[#10B981] hover:bg-[#059669] text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Verify
            </button>
            <button
              onClick={handleTrespass}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-xl transition"
            >
              Trespass (Bypass OTP)
            </button>
            {trespass && (
              <p className="text-sm text-green-600 text-center">
                Trespass activated! OTP filled as 000000.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
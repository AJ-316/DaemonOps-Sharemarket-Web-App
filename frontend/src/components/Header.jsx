import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
    { label: "Markets", path: "/markets" },
    { label: "Stocks", path: "/stocks" },
    { label: "F&O", path: "/fno" },
    { label: "IPO", path: "/ipo" },
    { label: "MF", path: "/mf" },
];

const tickers = [
    { symbol: "NIFTY 50", value: "24,853.15", pct: "+0.60%", up: true },
    { symbol: "SENSEX", value: "81,721.40", pct: "+1.18%", up: true },
    { symbol: "BANKNIFTY", value: "53,402.60", pct: "−0.32%", up: false },
    { symbol: "USDINR", value: "₹84.21", pct: "−0.08%", up: false },
    { symbol: "GOLD", value: "₹71,430", pct: "+0.56%", up: true },
];

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        window.location.href = "/login";
    }

    return (
        <header className="w-full sticky top-0 z-50 bg-white border-b border-gray-200">

            {/* Ticker Strip */}
            <div className="bg-gray-950 px-4 py-1.5 flex items-center gap-6 overflow-x-auto scrollbar-none">
                {tickers.map((t) => (
                    <span key={t.symbol} className="flex items-center gap-2 text-xs shrink-0">
                        <span className="text-gray-400 font-medium">{t.symbol}</span>
                        <span className="text-white">{t.value}</span>
                        <span className={t.up ? "text-emerald-400" : "text-red-400"}>{t.pct}</span>
                    </span>
                ))}
                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">Market Open</span>
                </div>
            </div>

            {/* Main Nav */}
            <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-6">

                {/* Logo */}
                <div
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 cursor-pointer shrink-0"
                >
                    <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <span className="text-base font-bold text-gray-900 tracking-tight">Stocko</span>
                </div>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-0.5 flex-1">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            //   onClick={() => navigate(item.path)}
                            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${location.pathname === item.path
                                ? "text-emerald-700 bg-emerald-50"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Actions */}
                {!token ? (<div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => navigate("/login")}
                        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200
                       rounded-lg hover:bg-gray-50 transition"
                    >
                        Log in
                    </button>
                    <button
                        onClick={() => navigate("/register")}
                        className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600
                       rounded-lg hover:bg-emerald-700 transition"
                    >
                        Open Account
                    </button>
                </div>) : (
                    <div onClick={() => {
                        navigate('/dashboard')
                    }}>
                        <div className="flex gap-3 items-center justify-center">
                            <div className="rounded-full items-center justify-center flex h-8 w-8 bg-amber-200 hover:cursor-pointer">
                                <p className="font-bold">{role === "ADMIN" ? "A" : "U"}</p>
                            </div>
                            <div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 cursor-pointer text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </header>
    );
};

export default Header;
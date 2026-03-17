import React from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
    
    const navigate = useNavigate();

    return (
        <header className="w-full bg-white border-b border-emerald-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

                {/* Logo */}
                <h1
                    onClick={() => navigate("/")}
                    className="text-xl font-bold text-emerald-700 cursor-pointer"
                >
                    Tradify
                </h1>

                {/* Nav Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate("/login")}
                        className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => navigate("/register")}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
                    >
                        Register
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
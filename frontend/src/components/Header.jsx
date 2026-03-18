/**
 * Drop-in replacement for your existing Header component.
 *
 * Changes:
 *  - Added "My Portfolios" nav link (only visible when logged in)
 *  - Added "Markets" link pointing to /dashboard
 *
 * Assumptions / adapt as needed:
 *  - You store auth state in localStorage under key "token" (or swap with your auth hook)
 *  - Your header already uses Tailwind + React Router
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Replace "token" with however you detect auth in your app
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        isActive(to)
          ? "text-emerald-600"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-base tracking-tight">Stocko</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {/* {navLink("/", "Home")} */}
          {isLoggedIn && navLink("/dashboard", "Markets")}
          {isLoggedIn && navLink("/portfolio", "My Portfolios")}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Logout
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-1.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm shadow-emerald-100"
              >
                Open Account
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 text-gray-500 hover:text-gray-900"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700 font-medium">
            Home
          </Link>
          {isLoggedIn && (
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700 font-medium">
              Markets
            </Link>
          )}
          {isLoggedIn && (
            <Link to="/portfolio" onClick={() => setMenuOpen(false)} className="block text-sm text-emerald-600 font-semibold">
              My Portfolios
            </Link>
          )}
          <div className="pt-2 border-t border-gray-100">
            {isLoggedIn ? (
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="text-sm text-red-500 font-medium"
              >
                Logout
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => { navigate("/login"); setMenuOpen(false); }}
                  className="text-sm text-gray-600 font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { navigate("/register"); setMenuOpen(false); }}
                  className="text-sm text-emerald-600 font-semibold"
                >
                  Open Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location]);


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "#fff", borderBottom: "1px solid #f1f5f9",
      height: 56, display: "flex", alignItems: "center",
      padding: "0 24px", gap: 0
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: 32, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, background: "#10b981", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
          </svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", letterSpacing: "-0.02em" }}>Stocko</span>
      </Link>

      {/* Nav links */}
      {isLoggedIn && (
        <nav style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 24, flexShrink: 0 }}>
          {[
            { label: "Explore", path: "/dashboard" },
            { label: "Investments", path: "/portfolio" },
          ].map(({ label, path }) => (
            <Link key={path} to={path} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              textDecoration: "none", transition: "all .15s",
              color: isActive(path) ? "#10b981" : "#475569",
              background: isActive(path) ? "#f0fdf4" : "transparent",
              borderBottom: isActive(path) ? "2px solid #10b981" : "2px solid transparent",
            }}>{label}</Link>
          ))}
        </nav>
      )}

      {/* Right actions */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, paddingLeft: 16 }}>
        {isLoggedIn ? (
          <button onClick={handleLogout} style={{
            padding: "7px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
            background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>Logout</button>
        ) : (
          <>
            <button onClick={() => navigate("/login")} style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: "none", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}>Sign In</button>
            <button onClick={() => navigate("/register")} style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer"
            }}>Open Account</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosPending from "../api/axiosPending";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location]);

  // Poll notifications every 3s
  const fetchNotifications = useCallback(() => {
    if (!localStorage.getItem("token")) return;
    axiosPending.get("/pending-orders/notifications")
      .then((res) => setNotifications(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 3000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = () => {
    axiosPending.post("/pending-orders/notifications/read").then(() => {
      setNotifications([]);
      setShowNotifs(false);
    }).catch(() => {});
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;
  const unreadCount = notifications.length;

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
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>

        {/* Notification Bell */}
        {isLoggedIn && (
          <div ref={notifRef} style={{ position: "relative" }}>
            <button onClick={() => setShowNotifs((v) => !v)} style={{
              position: "relative", width: 36, height: 36, borderRadius: 8,
              border: "1px solid #f1f5f9", background: showNotifs ? "#f0fdf4" : "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={unreadCount > 0 ? "#10b981" : "#94a3b8"} strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 4, right: 4,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#ef4444", color: "#fff",
                  fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid #fff"
                }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifs && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: 320, background: "#fff", borderRadius: 14,
                border: "1px solid #f1f5f9", boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
                zIndex: 200, overflow: "hidden"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f8fafc" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkRead} style={{ background: "none", border: "none", fontSize: 11, color: "#10b981", fontWeight: 600, cursor: "pointer" }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                      No new notifications
                    </div>
                  ) : notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: "12px 16px", borderBottom: "1px solid #f8fafc",
                      background: n.read ? "#fff" : "#f0fdf4"
                    }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: n.message.includes("Stop Loss") ? "#fef2f2" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 14 }}>{n.message.includes("Stop Loss") ? "🔴" : "🟢"}</span>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, color: "#0f172a", lineHeight: 1.5 }}>{n.message}</p>
                          <p style={{ margin: "3px 0 0", fontSize: 10, color: "#94a3b8" }}>
                            {new Date(n.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
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

  const fetchNotifications = useCallback(() => {
    if (!localStorage.getItem("token")) return;
    axiosPending.get("/pending-orders/notifications")
      .then((res) => setNotifications(res.data || []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 3000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = () => {
    axiosPending.post("/pending-orders/notifications/read")
      .then(() => { setNotifications([]); setShowNotifs(false); })
      .catch(() => { });
  };

  const isActive = (path) => location.pathname === path;
  const unreadCount = notifications.length;
  const username = localStorage.getItem("username") || "U";

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "#111111",
      borderBottom: "1px solid #1E1E1E",
      height: 56,
      display: "flex", alignItems: "center", padding: "0 24px",
      boxShadow: "0 1px 0 rgba(245,158,11,0.06)",
    }}>

      {/* Logo */}
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: 32, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 10px rgba(245,158,11,0.3)"
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
            <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#F5F5F5", letterSpacing: "-0.02em" }}>Stocko</span>
      </Link>

      {/* Nav links */}
      {isLoggedIn && (
        <nav style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 24, flexShrink: 0 }}>
          {localStorage.getItem("role") === "ADMIN" ? (
            <span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", padding: "6px 14px" }}>
              Admin Console
            </span>
          ) : (
            [
              { label: "Explore", path: "/dashboard" },
              { label: "Investments", path: "/portfolio" },
            ].map(({ label, path }) => (
              <Link key={path} to={path} style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                textDecoration: "none", transition: "all .15s",
                color: isActive(path) ? "#F59E0B" : "#737373",
                background: isActive(path) ? "rgba(245,158,11,0.08)" : "transparent",
                borderBottom: isActive(path) ? "2px solid #F59E0B" : "2px solid transparent",
              }}>{label}</Link>
            ))
          )}
        </nav>
      )}

      {/* Right */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>

        {/* Notification Bell */}
        {isLoggedIn && (
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifs((v) => !v)}
              style={{
                position: "relative", width: 36, height: 36, borderRadius: 8,
                border: "1px solid #2A2A2A",
                background: showNotifs ? "rgba(245,158,11,0.08)" : "#1A1A1A",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F59E0B"; e.currentTarget.style.background = "rgba(245,158,11,0.08)"; }}
              onMouseLeave={(e) => { if (!showNotifs) { e.currentTarget.style.borderColor = "#2A2A2A"; e.currentTarget.style.background = "#1A1A1A"; } }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={unreadCount > 0 ? "#F59E0B" : "#525252"} strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 4, right: 4,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#EF4444", color: "#fff",
                  fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid #111111"
                }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotifs && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: 320,
                background: "#161616",
                borderRadius: 14,
                border: "1px solid #2A2A2A",
                boxShadow: "0 0 0 1px rgba(245,158,11,0.06), 0 16px 40px rgba(0,0,0,0.6)",
                zIndex: 200, overflow: "hidden"
              }}>
                {/* Dropdown gold accent */}
                <div style={{
                  position: "absolute", top: 0, left: "16px", right: "16px", height: "1px",
                  background: "linear-gradient(90deg, transparent, #F59E0B, transparent)",
                  opacity: 0.4,
                }} />

                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", borderBottom: "1px solid #1E1E1E"
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F5F5F5" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkRead} style={{
                      background: "none", border: "none", fontSize: 11,
                      color: "#F59E0B", fontWeight: 600, cursor: "pointer"
                    }}>
                      Mark all read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "#525252", fontSize: 13 }}>
                      No new notifications
                    </div>
                  ) : notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #1E1E1E",
                      background: n.read ? "transparent" : "rgba(245,158,11,0.04)"
                    }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: n.message.includes("Stop Loss") ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <span style={{ fontSize: 14 }}>{n.message.includes("Stop Loss") ? "🔴" : "🟢"}</span>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, color: "#D4D4D4", lineHeight: 1.5 }}>{n.message}</p>
                          <p style={{ margin: "3px 0 0", fontSize: 10, color: "#525252" }}>
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

        {/* User avatar / login buttons */}
        {isLoggedIn ? (
          <button
            onClick={() => navigate("/profile")}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "#000",
              boxShadow: isActive("/profile")
                ? "0 0 0 2px #F59E0B, 0 0 0 4px rgba(245,158,11,0.2)"
                : "0 0 8px rgba(245,158,11,0.2)",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 0 0 2px #F59E0B, 0 0 0 4px rgba(245,158,11,0.2)"}
            onMouseLeave={(e) => {
              if (!isActive("/profile")) e.currentTarget.style.boxShadow = "0 0 8px rgba(245,158,11,0.2)";
            }}
            title="Profile"
          >
            {username[0]?.toUpperCase() || "U"}
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "7px 16px", borderRadius: 8,
                border: "1px solid #2A2A2A",
                background: "transparent", color: "#A3A3A3",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#F5F5F5"; e.currentTarget.style.borderColor = "#3A3A3A"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#A3A3A3"; e.currentTarget.style.borderColor = "#2A2A2A"; }}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(245,158,11,0.25)",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 18px rgba(245,158,11,0.4)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(245,158,11,0.25)"}
            >
              Open Account
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
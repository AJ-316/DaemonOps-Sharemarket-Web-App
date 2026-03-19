import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosPortfolio from "../api/axiosPortfolio";
import axiosExchange from "../api/axiosExchange";

const fmt = (n) =>
  Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = (n) => {
  const num = Number(n);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)}Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)}L`;
  return `₹${fmt(num)}`;
};

// ── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current: "", newPw: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    if (!form.current || !form.newPw) { setError("Fill all fields."); return; }
    if (form.newPw !== form.confirm) { setError("New passwords don't match."); return; }
    if (form.newPw.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await axiosPortfolio.post("/api/auth/change-password", {
        currentPassword: form.current,
        newPassword: form.newPw,
      });
      setSuccess("Password changed successfully!");
      setForm({ current: "", newPw: "", confirm: "" });
      setTimeout(onClose, 1500);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to change password.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)"
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420,
        margin: "0 16px", padding: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Change Password</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { key: "current", label: "Current Password" },
            { key: "newPw", label: "New Password" },
            { key: "confirm", label: "Confirm New Password" },
          ].map(({ key, label }) => (
            <div key={key}>
              <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              <input type="password" value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}
          {error && <p style={{ margin: 0, fontSize: 12, color: "#dc2626" }}>{error}</p>}
          {success && <p style={{ margin: 0, fontSize: 12, color: "#059669" }}>{success}</p>}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Changing…" : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── KPI Tile ──────────────────────────────────────────────────────────────────
function KPITile({ label, value, sub, subColor, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 140, padding: "16px 20px", borderRadius: 14, background: accent || "#f8fafc", border: "1px solid #f1f5f9" }}>
      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: accent ? "rgba(255,255,255,0.7)" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: accent ? "#fff" : "#0f172a", fontVariantNumeric: "tabular-nums" }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: accent ? "rgba(255,255,255,0.85)" : (subColor || "#94a3b8") }}>{sub}</p>}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</p>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const email = localStorage.getItem("username") || "User";

  const [portfolios, setPortfolios] = useState([]);
  const [allHoldings, setAllHoldings] = useState([]);
  const [prices, setPrices] = useState({});
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wallet
  const [walletModal, setWalletModal] = useState(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  // Change password modal
  const [showPwModal, setShowPwModal] = useState(false);

  const fetchWallet = useCallback(() => {
    axiosPortfolio.get("/wallet").then((res) => setWallet(res.data)).catch(() => {});
  }, []);

  const refreshPrices = useCallback(() => {
    axiosExchange.get("/stocks").then((res) => {
      const map = {};
      res.data.forEach((s) => { map[s.companyId] = s; });
      setPrices(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      axiosPortfolio.get("/portfolio"),
      axiosPortfolio.get("/orders/history"),
    ]).then(async ([portfolioRes, ordersRes]) => {
      const pList = portfolioRes.data || [];
      setPortfolios(pList);
      setOrders(ordersRes.data || []);
      const holdingsArr = await Promise.all(
        pList.map((p) =>
          axiosPortfolio.get(`/portfolio/holdings/${p.id}`)
            .then((r) => (r.data || []).map((h) => ({ ...h, portfolioName: p.name })))
            .catch(() => [])
        )
      );
      setAllHoldings(holdingsArr.flat());
      setLoading(false);
    }).catch(() => setLoading(false));

    fetchWallet();
    refreshPrices();
    const iv = setInterval(refreshPrices, 3000);
    return () => clearInterval(iv);
  }, []);

  const totalInvested = orders
    .filter((o) => (o.status === "EXECUTED" || o.status === "COMPLETED") && o.orderType === "BUY")
    .reduce((s, o) => s + Number(o.totalValue || 0), 0);

  const totalCurrent = allHoldings.reduce((s, h) => {
    const p = Number(prices[h.companyId]?.currentPrice || h.averageBuyPrice || 0);
    return s + p * Number(h.quantityHeld || 0);
  }, 0);
  const holdingsCost = allHoldings.reduce((s, h) => s + Number(h.averageBuyPrice || 0) * Number(h.quantityHeld || 0), 0);
  const totalPnl = totalCurrent - holdingsCost;
  const totalPnlPct = holdingsCost > 0 ? ((totalPnl / holdingsCost) * 100) : 0;
  const pnlUp = totalPnl >= 0;

  const handleWalletAction = async () => {
    const amount = parseFloat(walletAmount);
    if (!amount || amount <= 0) { setWalletError("Enter a valid amount."); return; }
    setWalletLoading(true); setWalletError("");
    try {
      const endpoint = walletModal === "deposit" ? "/wallet/deposit" : "/wallet/withdraw";
      await axiosPortfolio.post(`${endpoint}?amount=${amount}`);
      fetchWallet();
      setWalletModal(null); setWalletAmount("");
    } catch (e) {
      setWalletError(e?.response?.data?.message || "Transaction failed.");
    } finally { setWalletLoading(false); }
  };

  const handleLogout = () => {
    ["token", "userId", "role", "username"].forEach((k) => localStorage.removeItem(k));
    navigate("/");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 56px)" }}>
      <div style={{ width: 28, height: 28, border: "2.5px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

      {/* ── Profile Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #059669, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{email[0]?.toUpperCase() || "U"}</span>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{email}</h1>
          {/* No duplicate email in subtext — just show ID and portfolio count */}
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "#94a3b8" }}>
            User ID: {userId} · {portfolios.length} portfolio{portfolios.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Actions — Change Password + Logout, side by side */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setShowPwModal(true)} style={{
            padding: "8px 18px", borderRadius: 10,
            border: "1px solid #e2e8f0", background: "#fff",
            color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Change Password
          </button>
          <button onClick={handleLogout} style={{
            padding: "8px 18px", borderRadius: 10,
            border: "1px solid #fecaca", background: "#fff",
            color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>Logout</button>
        </div>
      </div>

      {/* ── Investment Overview ── */}
      <SectionCard title="Investment Overview">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KPITile label="Total Invested" value={fmtCompact(totalInvested)}
            sub={`Across ${portfolios.length} portfolio${portfolios.length !== 1 ? "s" : ""}`} accent="#059669"/>
          <KPITile label="Current Value" value={fmtCompact(totalCurrent)}/>
          <KPITile label="Total P&L" value={`${pnlUp ? "+" : ""}${fmtCompact(totalPnl)}`}
            sub={`${pnlUp ? "▲" : "▼"} ${Math.abs(totalPnlPct).toFixed(2)}%`}
            subColor={pnlUp ? "#059669" : "#dc2626"}/>
          <KPITile label="Active Holdings" value={allHoldings.length}
            sub={`${orders.filter((o) => o.orderType === "BUY" && (o.status === "EXECUTED" || o.status === "COMPLETED")).length} total buys`}/>
        </div>

        {portfolios.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>By Portfolio</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {portfolios.map((p) => {
                const ph = allHoldings.filter((h) => h.portfolioId === p.id);
                const curr = ph.reduce((s, h) => s + Number(prices[h.companyId]?.currentPrice || h.averageBuyPrice || 0) * Number(h.quantityHeld || 0), 0);
                const cost = ph.reduce((s, h) => s + Number(h.averageBuyPrice || 0) * Number(h.quantityHeld || 0), 0);
                const pnl = curr - cost;
                const up = pnl >= 0;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }}/>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{ph.length} stocks</span>
                    </div>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{fmtCompact(curr)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: up ? "#059669" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                        {up ? "+" : ""}{fmtCompact(pnl)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Wallet ── */}
      <SectionCard title="Wallet">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Available Balance</p>
            <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
              {wallet ? `₹${fmt(wallet.balance)}` : "—"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setWalletModal("deposit"); setWalletError(""); setWalletAmount(""); }} style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer"
            }}>+ Add Money</button>
            <button onClick={() => { setWalletModal("withdraw"); setWalletError(""); setWalletAmount(""); }} style={{
              padding: "10px 24px", borderRadius: 10, border: "1px solid #e2e8f0",
              background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}>Withdraw</button>
          </div>
        </div>

        {walletModal && (
          <div style={{ marginTop: 20, background: walletModal === "deposit" ? "#f0fdf4" : "#fef2f2", borderRadius: 12, padding: 20, border: `1px solid ${walletModal === "deposit" ? "#bbf7d0" : "#fecaca"}` }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: walletModal === "deposit" ? "#059669" : "#dc2626" }}>
              {walletModal === "deposit" ? "Add Money to Wallet" : "Withdraw from Wallet"}
            </p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#475569" }}>₹</span>
              <input type="number" placeholder="Enter amount" value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleWalletAction()}
                style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 15, fontWeight: 600, outline: "none" }}
              />
              <button onClick={handleWalletAction} disabled={walletLoading} style={{
                padding: "10px 20px", borderRadius: 8, border: "none",
                background: walletModal === "deposit" ? "#10b981" : "#dc2626",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: walletLoading ? 0.7 : 1
              }}>{walletLoading ? "…" : "Confirm"}</button>
              <button onClick={() => setWalletModal(null)} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
            {walletError && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#dc2626" }}>{walletError}</p>}
            {wallet && walletModal === "withdraw" && (
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}>Available: ₹{fmt(wallet.balance)}</p>
            )}
          </div>
        )}
      </SectionCard>

      {/* Change password modal */}
      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
    </div>
  );
};

export default ProfilePage;
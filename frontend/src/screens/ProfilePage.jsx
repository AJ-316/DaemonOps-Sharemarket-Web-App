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

const T = {
  bg: "#0A0A0A",
  surface: "#161616",
  surface2: "#1C1C1C",
  border: "#2A2A2A",
  border2: "#1E1E1E",
  gold: "#F59E0B",
  goldDim: "#D97706",
  goldGlow: "rgba(245,158,11,0.1)",
  text: "#F5F5F5",
  textSub: "#A3A3A3",
  textDim: "#737373",
  textMute: "#525252",
  green: "#22C55E",
  greenDim: "rgba(34,197,94,0.1)",
  greenBdr: "rgba(34,197,94,0.2)",
  red: "#EF4444",
  redDim: "rgba(239,68,68,0.1)",
  redBdr: "rgba(239,68,68,0.2)",
};

const focusGold = (e) => { e.target.style.border = `1px solid ${T.gold}`; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.1)"; };
const blurGold = (e) => { e.target.style.border = `1px solid ${T.border}`; e.target.style.boxShadow = "none"; };

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
        currentPassword: form.current, newPassword: form.newPw,
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
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)"
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: T.surface, borderRadius: 20, width: "100%", maxWidth: 420,
        margin: "0 16px", padding: 28,
        border: `1px solid ${T.border}`,
        boxShadow: "0 0 0 1px rgba(245,158,11,0.08), 0 32px 64px rgba(0,0,0,0.7)",
        position: "relative"
      }}>
        {/* Gold accent */}
        <div style={{ position: "absolute", top: 0, left: 32, right: 32, height: 1, background: "linear-gradient(90deg,transparent,#F59E0B,transparent)", opacity: 0.5 }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>Change Password</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: T.textMute, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[{ key: "current", label: "Current Password" }, { key: "newPw", label: "New Password" }, { key: "confirm", label: "Confirm New Password" }].map(({ key, label }) => (
            <div key={key}>
              <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              <input type="password" value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                onFocus={focusGold} onBlur={blurGold}
                style={{ width: "100%", border: `1px solid ${T.border}`, background: T.surface2, color: T.text, borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border 0.2s, box-shadow 0.2s" }}
              />
            </div>
          ))}
          {error && <p style={{ margin: 0, fontSize: 12, color: T.red }}>{error}</p>}
          {success && <p style={{ margin: 0, fontSize: 12, color: T.green }}>{success}</p>}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface2, color: T.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Changing…" : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── KPI Tile ──────────────────────────────────────────────────────────────────
function KPITile({ label, value, sub, subColor, accent }) {
  const isAccent = !!accent;
  return (
    <div style={{
      flex: 1, minWidth: 140, padding: "16px 20px", borderRadius: 14,
      background: isAccent ? "linear-gradient(135deg, #1A1200, #2A1F00)" : T.surface2,
      border: isAccent ? "1px solid rgba(245,158,11,0.25)" : `1px solid ${T.border}`,
      position: "relative", overflow: "hidden"
    }}>
      {isAccent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#F59E0B,transparent)", opacity: 0.6 }} />}
      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: isAccent ? T.goldDim : T.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: isAccent ? T.gold : T.text, fontVariantNumeric: "tabular-nums" }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: isAccent ? T.textSub : (subColor || T.textDim) }}>{sub}</p>}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "13px 20px", borderBottom: `1px solid ${T.border2}` }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.gold, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</p>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
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

  const [walletModal, setWalletModal] = useState(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [showPwModal, setShowPwModal] = useState(false);

  const fetchWallet = useCallback(() => {
    axiosPortfolio.get("/wallet").then((res) => {
      setWallet(res.data);
      // Sync email with payment-service for notifications if not set
      if (res.data && !res.data.email) {
        axiosPortfolio.post(`/wallet/set-email?email=${email}`).then(fetchWallet).catch(() => { });
      }
    }).catch(() => { });
  }, [email]);

  const refreshPrices = useCallback(() => {
    axiosExchange.get("/stocks").then((res) => {
      const map = {}; res.data.forEach((s) => { map[s.companyId] = s; }); setPrices(map);
    }).catch(() => { });
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
  }, [fetchWallet, refreshPrices]);

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
      if (walletModal === "deposit") {
        // 1. Create Order on Backend
        const orderRes = await axiosPortfolio.post(`/payment/create-order?amount=${amount}`);
        console.log("Order Created Response:", orderRes.data);

        const { orderId, amount: rzpAmount, currency, key } = orderRes.data;

        if (!orderId || !key) {
          throw new Error("Missing orderId or key from payment service.");
        }

        // 2. Open Razorpay Checkout
        const options = {
          key: key,
          amount: rzpAmount,
          currency: currency,
          name: "Stocko Payments",
          description: "Wallet Add Money",
          order_id: orderId,
          handler: async (response) => {
            console.log("Razorpay Response:", response);
            try {
              // 3. Verify Payment on Backend
              await axiosPortfolio.post("/payment/verify", {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                amount: amount
              });
              fetchWallet();
              setWalletModal(null); setWalletAmount("");
              alert("Payment Successful! Wallet updated.");
            } catch (err) {
              console.error("Verification error:", err);
              setWalletError(err?.response?.data?.message || "Payment verification failed.");
            }
          },
          prefill: { email: email },
          theme: { color: T.gold },
          modal: {
            ondismiss: function () {
              setWalletLoading(false);
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Withdraw logic - triggers SMTP email in payment-service
        await axiosPortfolio.post(`/wallet/withdraw?amount=${amount}`);
        fetchWallet();
        setWalletModal(null); setWalletAmount("");
        alert("Withdrawal initiated! Check your email for confirmation.");
      }
    } catch (e) {
      setWalletError(e?.response?.data?.message || "Transaction failed.");
    } finally { setWalletLoading(false); }
  };

  const handleLogout = () => {
    ["token", "userId", "role", "username"].forEach((k) => localStorage.removeItem(k));
    navigate("/");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 56px)", background: T.bg }}>
      <div style={{ width: 28, height: 28, border: `2.5px solid ${T.gold}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: "calc(100vh - 56px)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Profile Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 0 3px rgba(245,158,11,0.15), 0 0 20px rgba(245,158,11,0.2)"
          }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#000" }}>{email[0]?.toUpperCase() || "U"}</span>
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>{email}</h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: T.textDim }}>
              User ID: {userId} · {portfolios.length} portfolio{portfolios.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Actions */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setShowPwModal(true)} style={{
              padding: "8px 18px", borderRadius: 10,
              border: `1px solid ${T.border}`, background: T.surface2,
              color: T.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, transition: "border-color 0.2s, color 0.2s"
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSub; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Change Password
            </button>
            <button onClick={handleLogout} style={{
              padding: "8px 18px", borderRadius: 10,
              border: `1px solid ${T.redBdr}`, background: T.redDim,
              color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "background 0.2s"
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.red; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = T.redDim; e.currentTarget.style.color = T.red; }}
            >Logout</button>
          </div>
        </div>

        {/* ── Investment Overview ── */}
        <SectionCard title="Investment Overview">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <KPITile label="Total Invested" value={fmtCompact(totalInvested)}
              sub={`Across ${portfolios.length} portfolio${portfolios.length !== 1 ? "s" : ""}`} accent={true} />
            <KPITile label="Current Value" value={fmtCompact(totalCurrent)} />
            <KPITile label="Total P&L" value={`${pnlUp ? "+" : ""}${fmtCompact(totalPnl)}`}
              sub={`${pnlUp ? "▲" : "▼"} ${Math.abs(totalPnlPct).toFixed(2)}%`}
              subColor={pnlUp ? T.green : T.red} />
            <KPITile label="Active Holdings" value={allHoldings.length}
              sub={`${orders.filter((o) => o.orderType === "BUY" && (o.status === "EXECUTED" || o.status === "COMPLETED")).length} total buys`} />
          </div>

          {portfolios.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.gold, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>By Portfolio</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {portfolios.map((p) => {
                  const ph = allHoldings.filter((h) => h.portfolioId === p.id);
                  const curr = ph.reduce((s, h) => s + Number(prices[h.companyId]?.currentPrice || h.averageBuyPrice || 0) * Number(h.quantityHeld || 0), 0);
                  const cost = ph.reduce((s, h) => s + Number(h.averageBuyPrice || 0) * Number(h.quantityHeld || 0), 0);
                  const pnl = curr - cost;
                  const up = pnl >= 0;
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, transition: "border-color 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(245,158,11,0.25)"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold, boxShadow: "0 0 4px rgba(245,158,11,0.4)" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.name}</span>
                        <span style={{ fontSize: 11, color: T.textDim }}>{ph.length} stocks</span>
                      </div>
                      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: T.textSub, fontVariantNumeric: "tabular-nums" }}>{fmtCompact(curr)}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: up ? T.green : T.red, fontVariantNumeric: "tabular-nums" }}>
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
              <p style={{ margin: "0 0 4px", fontSize: 11, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Available Balance</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: T.text, fontVariantNumeric: "tabular-nums" }}>
                {wallet ? `₹${fmt(wallet.balance)}` : "—"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setWalletModal("deposit"); setWalletError(""); setWalletAmount(""); }} style={{
                padding: "10px 24px", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`,
                color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(245,158,11,0.25)", transition: "box-shadow 0.2s"
              }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 20px rgba(245,158,11,0.4)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 14px rgba(245,158,11,0.25)"}
              >+ Add Money</button>
              <button onClick={() => { setWalletModal("withdraw"); setWalletError(""); setWalletAmount(""); }} style={{
                padding: "10px 24px", borderRadius: 10,
                border: `1px solid ${T.border}`, background: T.surface2,
                color: T.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "border-color 0.2s, color 0.2s"
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSub; }}
              >Withdraw</button>
            </div>
          </div>

          {walletModal && (
            <div style={{
              marginTop: 20,
              background: walletModal === "deposit" ? T.goldGlow : T.redDim,
              border: `1px solid ${walletModal === "deposit" ? "rgba(245,158,11,0.25)" : T.redBdr}`,
              borderRadius: 12, padding: 20
            }}>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: walletModal === "deposit" ? T.gold : T.red }}>
                {walletModal === "deposit" ? "Add Money to Wallet" : "Withdraw from Wallet"}
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: T.textSub }}>₹</span>
                <input type="number" placeholder="Enter amount" value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleWalletAction()}
                  onFocus={focusGold} onBlur={blurGold}
                  style={{ flex: 1, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, borderRadius: 8, padding: "10px 14px", fontSize: 15, fontWeight: 600, outline: "none", fontFamily: "inherit", transition: "border 0.2s, box-shadow 0.2s" }}
                />
                <button onClick={handleWalletAction} disabled={walletLoading} style={{
                  padding: "10px 20px", borderRadius: 8, border: "none",
                  background: walletModal === "deposit" ? `linear-gradient(135deg, ${T.gold}, ${T.goldDim})` : T.red,
                  color: walletModal === "deposit" ? "#000" : "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: walletLoading ? 0.7 : 1
                }}>{walletLoading ? "…" : "Confirm"}</button>
                <button onClick={() => setWalletModal(null)} style={{
                  padding: "10px 14px", borderRadius: 8,
                  border: `1px solid ${T.border}`, background: T.surface2,
                  color: T.textSub, fontSize: 13, cursor: "pointer"
                }}>Cancel</button>
              </div>
              {walletError && <p style={{ margin: "8px 0 0", fontSize: 12, color: T.red }}>{walletError}</p>}
              {wallet && walletModal === "withdraw" && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: T.textDim }}>Available: ₹{fmt(wallet.balance)}</p>
              )}
            </div>
          )}
        </SectionCard>

        {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
      </div>
    </div>
  );
};

export default ProfilePage;
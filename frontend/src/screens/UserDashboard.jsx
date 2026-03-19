import React, { useEffect, useState, useCallback, useRef } from "react";
import axiosCompany from "../api/axiosCompany";
import axiosExchange from "../api/axiosExchange";
import axiosPortfolio from "../api/axiosPortfolio";
import axiosPending from "../api/axiosPending";

const fmt2 = (n) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const T = {
  bg:       "#0A0A0A",
  surface:  "#161616",
  surface2: "#1C1C1C",
  border:   "#2A2A2A",
  border2:  "#1E1E1E",
  gold:     "#F59E0B",
  goldDim:  "#D97706",
  goldGlow: "rgba(245,158,11,0.1)",
  text:     "#F5F5F5",
  textSub:  "#A3A3A3",
  textDim:  "#737373",
  textMute: "#525252",
  green:    "#22C55E",
  greenDim: "rgba(34,197,94,0.1)",
  greenBdr: "rgba(34,197,94,0.2)",
  red:      "#EF4444",
  redDim:   "rgba(239,68,68,0.1)",
  redBdr:   "rgba(239,68,68,0.2)",
};

const focusGold = (e) => { e.target.style.border = `1px solid ${T.gold}`; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.1)"; };
const blurDark  = (e) => { e.target.style.border = `1px solid ${T.border}`; e.target.style.boxShadow = "none"; };

// ── Modal Shell ───────────────────────────────────────────────────────────────
function Modal({ onClose, children, width = 440 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)"
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: T.surface, borderRadius: 20, width: "100%", maxWidth: width,
        margin: "0 16px", padding: 28, position: "relative",
        border: `1px solid ${T.border}`,
        boxShadow: "0 0 0 1px rgba(245,158,11,0.08), 0 32px 64px rgba(0,0,0,0.7)",
        maxHeight: "90vh", overflowY: "auto"
      }}>
        <div style={{ position: "absolute", top: 0, left: 32, right: 32, height: 1, background: "linear-gradient(90deg,transparent,#F59E0B,transparent)", opacity: 0.5 }} />
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, width: 28, height: 28,
          borderRadius: "50%", border: `1px solid ${T.border}`, background: T.surface2,
          color: T.textMute, cursor: "pointer", fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>✕</button>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, bold, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: T.textDim, fontSize: 13 }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, fontSize: bold ? 15 : 13, color: color || T.text }}>{value}</span>
    </div>
  );
}

// ── Mini Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, up }) {
  if (!data || data.length < 2) return (
    <svg width="80" height="28" viewBox="0 0 80 28">
      <line x1="0" y1="14" x2="80" y2="14" stroke={T.border} strokeWidth="1.5" strokeDasharray="3 3"/>
    </svg>
  );
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 80, H = 28;
  const pts = data.map((v, i) =>
    `${((i / (data.length - 1)) * W).toFixed(1)},${(H - ((v - min) / range) * (H - 4) - 2).toFixed(1)}`
  ).join(" ");
  const color = up ? T.green : T.red;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// ── Buy Modal ─────────────────────────────────────────────────────────────────
function BuyModal({ stock, company, onClose }) {
  const [step, setStep] = useState("form");
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [newName, setNewName] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderResponse, setOrderResponse] = useState(null);
  const [error, setError] = useState("");
  const [orderMode, setOrderMode] = useState("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);

  const price = Number(stock.currentPrice);
  const totalNum = price * quantity;
  const total = totalNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const insufficientFunds = orderMode === "market" && walletBalance !== null && totalNum > walletBalance;

  useEffect(() => {
    axiosPortfolio.get("/wallet").then((res) => setWalletBalance(Number(res.data.balance))).catch(() => {});
    axiosPortfolio.get("/portfolio").then((res) => {
      const list = res.data || [];
      setPortfolios(list);
      if (list.length === 1) setSelectedPortfolio(list[0]);
    }).catch(() => {});
  }, []);

  const handleCreatePortfolio = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const name = newName.trim();
    try {
      await axiosPortfolio.post("/portfolio", { name });
      const updated = await axiosPortfolio.get("/portfolio");
      const list = updated.data || [];
      setPortfolios(list);
      setNewName(""); setShowNewInput(false);
      const created = list.find((p) => p.name === name);
      if (created) setSelectedPortfolio(created);
    } catch { setError("Failed to create portfolio."); }
    finally { setLoading(false); }
  };

  const handleBuy = async () => {
    if (!selectedPortfolio) return;
    setLoading(true); setError("");
    try {
      if (orderMode === "limit") {
        if (!limitPrice || isNaN(Number(limitPrice)) || Number(limitPrice) <= 0) {
          setError("Enter a valid limit price."); setLoading(false); return;
        }
        await axiosPending.post("/pending-orders", {
          companyId: stock.companyId, portfolioId: selectedPortfolio.id,
          type: "LIMIT_BUY", quantity: Number(quantity), triggerPrice: Number(limitPrice),
        });
        setOrderResponse({ orderId: "PENDING", status: "LIMIT_SET", orderType: "LIMIT_BUY",
          quantity, priceAtOrder: Number(limitPrice), totalValue: Number(limitPrice) * quantity });
        setStep("receipt");
      } else {
        const res = await axiosPortfolio.post("/orders", {
          companyId: stock.companyId, portfolioId: selectedPortfolio.id,
          orderType: "BUY", quantity: Number(quantity),
        });
        setOrderResponse(res.data); setStep("receipt");
      }
    } catch (e) { setError(e?.response?.data?.message || "Order failed."); }
    finally { setLoading(false); }
  };

  const qBtnStyle = { width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface2, color: T.textSub, fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

  if (step === "form") return (
    <Modal onClose={onClose}>
      {/* Stock header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: T.goldGlow, border: `1px solid rgba(245,158,11,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: T.gold }}>{(company?.ticker || "?").slice(0, 2)}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: T.text }}>{company?.name}</p>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.gold, background: T.goldGlow, border: `1px solid rgba(245,158,11,0.2)`, padding: "2px 7px", borderRadius: 5 }}>{company?.ticker}</span>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: T.textDim }}>NSE · Equity</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text, fontVariantNumeric: "tabular-nums" }}>
            ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: T.textDim }}>Market Price</p>
        </div>
      </div>

      {/* Wallet balance */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: T.textSub }}>Wallet Balance</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: walletBalance !== null ? (insufficientFunds ? T.red : T.green) : T.textDim }}>
          {walletBalance !== null ? `₹${walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Loading…"}
        </span>
      </div>

      {/* Quantity */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Quantity</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={qBtnStyle}>−</button>
          <input type="number" min={1} value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: 72, textAlign: "center", border: `1px solid ${T.border}`, background: T.surface2, borderRadius: 10, padding: "8px 0", fontSize: 16, fontWeight: 700, color: T.text, outline: "none", fontFamily: "inherit" }}
            onFocus={focusGold} onBlur={blurDark}
          />
          <button onClick={() => setQuantity((q) => q + 1)} style={qBtnStyle}>+</button>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, color: T.textDim }}>Total</p>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.gold, fontVariantNumeric: "tabular-nums" }}>₹{total}</p>
          </div>
        </div>
      </div>

      {/* Order Type Toggle */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Order Type</p>
        <div style={{ display: "flex", gap: 6, marginBottom: orderMode === "limit" ? 12 : 0 }}>
          {[{ label: "Market Buy", val: "market" }, { label: "Limit Buy", val: "limit" }].map(({ label, val }) => (
            <button key={val} onClick={() => setOrderMode(val)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: orderMode === val ? "none" : `1px solid ${T.border}`,
              background: orderMode === val ? `linear-gradient(135deg, ${T.gold}, ${T.goldDim})` : T.surface2,
              color: orderMode === val ? "#000" : T.textSub, transition: "all .15s"
            }}>{label}</button>
          ))}
        </div>
        {orderMode === "limit" && (
          <div style={{ background: "rgba(245,158,11,0.06)", border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 10, padding: "12px 14px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: T.gold, fontWeight: 600 }}>⚡ Auto-buy when price reaches or exceeds:</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 14, color: T.gold, fontWeight: 700 }}>₹</span>
              <input type="number" placeholder={`e.g. ${(price * 1.05).toFixed(2)}`} value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                style={{ flex: 1, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, borderRadius: 8, padding: "8px 12px", fontSize: 14, fontWeight: 600, outline: "none", fontFamily: "inherit" }}
                onFocus={focusGold} onBlur={blurDark}
              />
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 10, color: T.textDim }}>Current: ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })} · Order triggers when ≥ limit price</p>
          </div>
        )}
      </div>

      {/* Portfolio selector */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Add to Portfolio</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
          {portfolios.length === 0 && !showNewInput && (
            <p style={{ fontSize: 12, color: T.textDim, fontStyle: "italic", margin: 0 }}>No portfolios yet — create one below.</p>
          )}
          {portfolios.map((p) => (
            <button key={p.id} onClick={() => setSelectedPortfolio(p)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 10, cursor: "pointer",
              border: selectedPortfolio?.id === p.id ? `1.5px solid ${T.gold}` : `1px solid ${T.border}`,
              background: selectedPortfolio?.id === p.id ? T.goldGlow : T.surface2,
              transition: "all .15s"
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: selectedPortfolio?.id === p.id ? T.gold : T.textSub }}>{p.name}</span>
              {selectedPortfolio?.id === p.id && <span style={{ color: T.gold, fontSize: 15 }}>✓</span>}
            </button>
          ))}
        </div>
        {showNewInput ? (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input autoFocus type="text" placeholder="Portfolio name…" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePortfolio()}
              style={{ flex: 1, border: `1px solid ${T.gold}`, background: T.surface2, color: T.text, borderRadius: 8, padding: "7px 12px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
            />
            <button onClick={handleCreatePortfolio} disabled={loading}
              style={{ padding: "7px 14px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: "#000", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {loading ? "…" : "Save"}
            </button>
            <button onClick={() => setShowNewInput(false)}
              style={{ padding: "7px 10px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.textMute, cursor: "pointer" }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setShowNewInput(true)}
            style={{ marginTop: 8, background: "none", border: "none", color: T.gold, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
            + Create new portfolio
          </button>
        )}
      </div>

      {error && <p style={{ color: T.red, fontSize: 12, marginBottom: 12 }}>{error}</p>}
      {insufficientFunds && (
        <p style={{ fontSize: 12, color: T.red, marginBottom: 8, textAlign: "center" }}>⚠ Insufficient wallet balance. Add funds from your profile.</p>
      )}

      <button disabled={!selectedPortfolio || loading || insufficientFunds} onClick={() => setStep("confirm")} style={{
        width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
        background: (!selectedPortfolio || insufficientFunds) ? T.surface2 : `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`,
        color: (!selectedPortfolio || insufficientFunds) ? T.textMute : "#000",
        fontSize: 14, fontWeight: 700,
        cursor: (!selectedPortfolio || insufficientFunds) ? "not-allowed" : "pointer",
        boxShadow: (!selectedPortfolio || insufficientFunds) ? "none" : "0 4px 16px rgba(245,158,11,0.3)",
        transition: "all .15s"
      }}>Review Order →</button>
    </Modal>
  );

  if (step === "confirm") return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: T.goldGlow, border: `1px solid rgba(245,158,11,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2.5">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2 7h12M10 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm7 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
          </svg>
        </div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: T.text }}>Confirm Purchase</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: T.textDim }}>Review your order</p>
      </div>
      <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <InfoRow label="Stock" value={`${company?.name} (${company?.ticker})`} />
        <InfoRow label="Portfolio" value={selectedPortfolio?.name} />
        <InfoRow label="Quantity" value={quantity} />
        <InfoRow label="Price per share" value={`₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
          <InfoRow label="Total Amount" value={`₹${total}`} bold color={T.gold} />
        </div>
      </div>
      {error && <p style={{ color: T.red, fontSize: 12, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStep("form")} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface2, color: T.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back</button>
        <button onClick={handleBuy} disabled={loading} style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(245,158,11,0.25)" }}>
          {loading ? "Placing…" : "Confirm Buy"}
        </button>
      </div>
    </Modal>
  );

  const ok = ["EXECUTED","COMPLETED","LIMIT_SET"].includes(orderResponse?.status);
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px", background: ok ? T.greenDim : T.redDim, border: `1px solid ${ok ? T.greenBdr : T.redBdr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 24, color: ok ? T.green : T.red }}>{ok ? "✓" : "✕"}</span>
        </div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: T.text }}>{orderResponse?.status === "LIMIT_SET" ? "Limit Order Set!" : ok ? "Purchase Successful!" : "Order Rejected"}</p>
        {!ok && <p style={{ margin: "6px 0 0", fontSize: 12, color: T.red }}>{orderResponse?.rejectionReason}</p>}
      </div>
      <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <InfoRow label="Order ID" value={`#${orderResponse?.orderId}`} />
        <InfoRow label="Stock" value={`${company?.name} (${company?.ticker})`} />
        <InfoRow label="Quantity" value={orderResponse?.quantity} />
        <InfoRow label="Price per share" value={`₹${fmt2(orderResponse?.priceAtOrder)}`} />
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
          <InfoRow label="Total Value" value={`₹${fmt2(orderResponse?.totalValue)}`} bold color={T.gold} />
        </div>
      </div>
      <button onClick={onClose} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(245,158,11,0.25)" }}>Done</button>
    </Modal>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
const UserDashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [companies, setCompanies] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [buyModal, setBuyModal] = useState(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [priceRangeMax, setPriceRangeMax] = useState(100000);
  const [priceFilter, setPriceFilter] = useState([0, 100000]);

  useEffect(() => {
    axiosCompany.get("/companies").then((res) => {
      const map = {}; res.data.forEach((c) => { map[c.id] = c; }); setCompanies(map);
    }).catch(() => {});
  }, []);

  const fetchPrices = useCallback(() => {
    axiosExchange.get("/stocks").then((res) => {
      const sorted = res.data.sort((a, b) => a.companyId - b.companyId);
      setStocks(sorted); setLastUpdate(new Date().toLocaleTimeString()); setLoading(false);
      setPriceHistory((prev) => {
        const next = { ...prev };
        sorted.forEach((s) => { const hist = prev[s.companyId] || []; next[s.companyId] = [...hist, Number(s.currentPrice)].slice(-30); });
        return next;
      });
      if (sorted.length > 0) {
        const max = Math.max(...sorted.map((s) => Number(s.currentPrice)));
        const maxRounded = Math.ceil(max / 1000) * 1000;
        setPriceRangeMax(maxRounded);
        setPriceFilter((prev) => prev[1] === 100000 ? [0, maxRounded] : prev);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchPrices(); const iv = setInterval(fetchPrices, 1000); return () => clearInterval(iv); }, [fetchPrices]);

  const getPct = (current, open) => { if (!open || open === 0) return 0; return ((current - open) / open) * 100; };

  const filtered = stocks
    .filter((s) => {
      const c = companies[s.companyId], price = Number(s.currentPrice);
      if (filterSearch) { const q = filterSearch.toLowerCase(); if (!c?.name?.toLowerCase().includes(q) && !c?.ticker?.toLowerCase().includes(q)) return false; }
      if (price < priceFilter[0] || price > priceFilter[1]) return false;
      return true;
    })
    .sort((a, b) => {
      const ca = companies[a.companyId], cb = companies[b.companyId];
      if (sortBy === "name") return (ca?.name || "").localeCompare(cb?.name || "");
      if (sortBy === "price_asc") return Number(a.currentPrice) - Number(b.currentPrice);
      if (sortBy === "price_desc") return Number(b.currentPrice) - Number(a.currentPrice);
      if (sortBy === "change_asc") return getPct(a.currentPrice, a.openPriceToday) - getPct(b.currentPrice, b.openPriceToday);
      if (sortBy === "change_desc") return getPct(b.currentPrice, b.openPriceToday) - getPct(a.currentPrice, a.openPriceToday);
      return 0;
    });

  const pillStyle = (active) => ({
    padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
    border: active ? `1.5px solid ${T.gold}` : `1px solid ${T.border}`,
    background: active ? T.goldGlow : T.surface2,
    color: active ? T.gold : T.textSub,
    cursor: "pointer", transition: "all .15s"
  });

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", background: T.bg }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        input[type=range]{ accent-color: ${T.gold} }
        .stock-row:hover{ background: ${T.surface2} !important }
        .buy-btn:hover{ background: linear-gradient(135deg,${T.gold},${T.goldDim}) !important; color:#000 !important; box-shadow:0 4px 14px rgba(245,158,11,0.3) !important; }
      `}</style>

      {/* ══ FILTERS SIDEBAR ══ */}
      <aside style={{
        width: 220, flexShrink: 0, background: T.surface,
        borderRight: `1px solid ${T.border2}`, padding: "20px 16px",
        position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: T.gold, letterSpacing: "0.06em", textTransform: "uppercase" }}>Filters</span>
          <button onClick={() => { setFilterSearch(""); setPriceFilter([0, priceRangeMax]); setSortBy("name"); }}
            style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: T.textDim, cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}
          >Clear All</button>
        </div>

        {/* Sort */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Sort By</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[
              { label: "Name", val: "name" },
              { label: "Price ↑", val: "price_asc" },
              { label: "Price ↓", val: "price_desc" },
              { label: "Top Gainers", val: "change_desc" },
              { label: "Top Losers", val: "change_asc" },
            ].map(({ label, val }) => (
              <button key={val} onClick={() => setSortBy(val)} style={pillStyle(sortBy === val)}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: T.border2, margin: "0 0 20px" }}/>

        {/* Price buckets */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Market Price</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[
              { label: "All", min: 0, max: Infinity },
              { label: "Under ₹500", min: 0, max: 500 },
              { label: "₹500–₹2K", min: 500, max: 2000 },
              { label: "₹2K–₹10K", min: 2000, max: 10000 },
              { label: "Over ₹10K", min: 10000, max: Infinity },
            ].map(({ label, min, max }) => {
              const isActive = priceFilter[0] === min && priceFilter[1] === (max === Infinity ? priceRangeMax : max);
              return (
                <button key={label} onClick={() => setPriceFilter([min, max === Infinity ? priceRangeMax : max])} style={pillStyle(isActive)}>{label}</button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main style={{ flex: 1, padding: "24px 28px", overflow: "auto" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>Explore Stocks</h1>
            {lastUpdate && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: T.textDim, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }}/>
                <strong style={{ color: T.textSub }}>{filtered.length} Stocks</strong>&nbsp;· Updated {lastUpdate}
              </p>
            )}
          </div>

          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "7px 14px", width: 240, transition: "border-color 0.2s" }}
            onFocusCapture={(e) => e.currentTarget.style.borderColor = T.gold}
            onBlurCapture={(e) => e.currentTarget.style.borderColor = T.border}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Filter table…" value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              style={{ border: "none", background: "none", outline: "none", fontSize: 13, color: T.text, width: "100%", fontFamily: "inherit" }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: T.textDim, fontSize: 14 }}>Loading market data…</div>
        ) : (
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: "0 0 0 1px rgba(245,158,11,0.04)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#111111", borderBottom: `1px solid ${T.border2}` }}>
                  {[
                    { label: "Company", sortKey: "name" },
                    { label: "Chart", sortKey: null },
                    { label: "Market Price", sortKey: "price_desc" },
                    { label: "Open", sortKey: null },
                    { label: "High", sortKey: null },
                    { label: "Low", sortKey: null },
                    { label: "Change", sortKey: "change_desc" },
                    { label: "", sortKey: null },
                  ].map(({ label, sortKey }) => (
                    <th key={label} style={{
                      textAlign: "left", padding: "12px 16px",
                      fontSize: 10, fontWeight: 700, color: T.gold,
                      letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
                      cursor: sortKey ? "pointer" : "default"
                    }} onClick={() => sortKey && setSortBy(sortBy === sortKey ? "name" : sortKey)}>
                      {label}{sortKey && sortBy === sortKey ? " ↓" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "60px 0", color: T.textMute, fontSize: 14 }}>No stocks match your filters</td></tr>
                ) : filtered.map((s) => {
                  const company = companies[s.companyId];
                  const price = Number(s.currentPrice);
                  const pct = getPct(price, s.openPriceToday);
                  const isUp = pct >= 0;
                  const hist = priceHistory[s.companyId] || [];
                  return (
                    <tr key={s.id} className="stock-row" style={{ borderBottom: `1px solid ${T.border2}`, transition: "background .1s", cursor: "default" }}>
                      {/* Company */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                            background: isUp ? T.greenDim : T.redDim,
                            border: `1px solid ${isUp ? T.greenBdr : T.redBdr}`,
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: isUp ? T.green : T.red }}>
                              {(company?.ticker || "?").slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.text }}>{company?.name || "—"}</p>
                            <p style={{ margin: 0, fontSize: 11, color: T.textDim }}>{company?.ticker} · NSE</p>
                          </div>
                        </div>
                      </td>
                      {/* Sparkline */}
                      <td style={{ padding: "14px 16px" }}><Sparkline data={hist} up={isUp}/></td>
                      {/* Price */}
                      <td style={{ padding: "14px 16px" }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: T.text, fontVariantNumeric: "tabular-nums" }}>
                          ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </td>
                      {/* Open */}
                      <td style={{ padding: "14px 16px", color: T.textSub, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                        ₹{Number(s.openPriceToday).toFixed(2)}
                      </td>
                      {/* High */}
                      <td style={{ padding: "14px 16px", color: T.green, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                        ₹{Number(s.highToday).toFixed(2)}
                      </td>
                      {/* Low */}
                      <td style={{ padding: "14px 16px", color: T.red, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                        ₹{Number(s.lowToday).toFixed(2)}
                      </td>
                      {/* Change */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                          background: isUp ? T.greenDim : T.redDim,
                          color: isUp ? T.green : T.red,
                          border: `1px solid ${isUp ? T.greenBdr : T.redBdr}`
                        }}>
                          {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                        </span>
                      </td>
                      {/* Buy button */}
                      <td style={{ padding: "14px 16px" }}>
                        <button className="buy-btn" onClick={() => setBuyModal({ stock: s, company })} style={{
                          padding: "7px 20px", borderRadius: 8,
                          border: `1px solid rgba(245,158,11,0.3)`,
                          background: T.goldGlow, color: T.gold,
                          fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s"
                        }}>Buy</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {buyModal && <BuyModal stock={buyModal.stock} company={buyModal.company} onClose={() => setBuyModal(null)}/>}
    </div>
  );
};

export default UserDashboard;
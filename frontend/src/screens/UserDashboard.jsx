import React, { useEffect, useState, useCallback, useRef } from "react";
import axiosCompany from "../api/axiosCompany";
import axiosExchange from "../api/axiosExchange";
import axiosPortfolio from "../api/axiosPortfolio";
import axiosPending from "../api/axiosPending";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt2 = (n) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Modal Shell ───────────────────────────────────────────────────────────────
function Modal({ onClose, children, width = 440 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)"
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: width,
        margin: "0 16px", padding: 28, position: "relative",
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, width: 28, height: 28,
          borderRadius: "50%", border: "none", background: "#f1f5f9",
          color: "#64748b", cursor: "pointer", fontSize: 14, fontWeight: 700,
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
      <span style={{ color: "#94a3b8", fontSize: 13 }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, fontSize: bold ? 15 : 13, color: color || "#0f172a" }}>{value}</span>
    </div>
  );
}

// ── Mini Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, up }) {
  if (!data || data.length < 2) return (
    <svg width="80" height="28" viewBox="0 0 80 28">
      <line x1="0" y1="14" x2="80" y2="14" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3"/>
    </svg>
  );
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 80, H = 28;
  const pts = data.map((v, i) =>
    `${((i / (data.length - 1)) * W).toFixed(1)},${(H - ((v - min) / range) * (H - 4) - 2).toFixed(1)}`
  ).join(" ");
  const color = up ? "#10b981" : "#ef4444";
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
  const [orderMode, setOrderMode] = useState("market"); // "market" | "limit"
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
        // Create a pending LIMIT_BUY order
        await axiosPending.post("/pending-orders", {
          companyId: stock.companyId,
          portfolioId: selectedPortfolio.id,
          type: "LIMIT_BUY",
          quantity: Number(quantity),
          triggerPrice: Number(limitPrice),
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

  if (step === "form") return (
    <Modal onClose={onClose}>
      {/* Stock header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>{(company?.ticker || "?").slice(0, 2)}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#0f172a" }}>{company?.name}</p>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#f0fdf4", padding: "2px 7px", borderRadius: 5 }}>{company?.ticker}</span>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>NSE · Equity</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
            ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Market Price</p>
        </div>
      </div>

      {/* Wallet balance */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>Wallet Balance</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: walletBalance !== null ? (insufficientFunds ? "#dc2626" : "#059669") : "#94a3b8" }}>
          {walletBalance !== null ? `₹${walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Loading…"}
        </span>
      </div>

      {/* Quantity */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Quantity</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
          <input type="number" min={1} value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: 72, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 0", fontSize: 16, fontWeight: 700, color: "#0f172a", outline: "none" }}
          />
          <button onClick={() => setQuantity((q) => q + 1)}
            style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Total</p>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#059669", fontVariantNumeric: "tabular-nums" }}>₹{total}</p>
          </div>
        </div>
      </div>

      {/* Order Type Toggle */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Order Type</p>
        <div style={{ display: "flex", gap: 6, marginBottom: orderMode === "limit" ? 12 : 0 }}>
          {[{ label: "Market Buy", val: "market" }, { label: "Limit Buy", val: "limit" }].map(({ label, val }) => (
            <button key={val} onClick={() => setOrderMode(val)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: orderMode === val ? "none" : "1px solid #e2e8f0",
              background: orderMode === val ? "#10b981" : "#f8fafc",
              color: orderMode === val ? "#fff" : "#64748b", transition: "all .15s"
            }}>{label}</button>
          ))}
        </div>
        {orderMode === "limit" && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#92400e", fontWeight: 600 }}>
              ⚡ Auto-buy when price reaches or exceeds:
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 14, color: "#78350f", fontWeight: 700 }}>₹</span>
              <input
                type="number"
                placeholder={`e.g. ${(price * 1.05).toFixed(2)}`}
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                style={{ flex: 1, border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", fontSize: 14, fontWeight: 600, outline: "none", background: "#fff" }}
              />
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 10, color: "#92400e" }}>
              Current: ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })} · Order triggers when ≥ limit price
            </p>
          </div>
        )}
      </div>

      {/* Portfolio selector */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Add to Portfolio</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
          {portfolios.length === 0 && !showNewInput && (
            <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", margin: 0 }}>No portfolios yet — create one below.</p>
          )}
          {portfolios.map((p) => (
            <button key={p.id} onClick={() => setSelectedPortfolio(p)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 10, cursor: "pointer",
              border: selectedPortfolio?.id === p.id ? "1.5px solid #10b981" : "1px solid #f1f5f9",
              background: selectedPortfolio?.id === p.id ? "#f0fdf4" : "#f8fafc",
              transition: "all .15s"
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: selectedPortfolio?.id === p.id ? "#059669" : "#475569" }}>{p.name}</span>
              {selectedPortfolio?.id === p.id && <span style={{ color: "#10b981", fontSize: 15 }}>✓</span>}
            </button>
          ))}
        </div>
        {showNewInput ? (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input autoFocus type="text" placeholder="Portfolio name…" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePortfolio()}
              style={{ flex: 1, border: "1px solid #d1fae5", borderRadius: 8, padding: "7px 12px", fontSize: 13, outline: "none" }}
            />
            <button onClick={handleCreatePortfolio} disabled={loading}
              style={{ padding: "7px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {loading ? "…" : "Save"}
            </button>
            <button onClick={() => setShowNewInput(false)}
              style={{ padding: "7px 10px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 12, color: "#64748b", cursor: "pointer" }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setShowNewInput(true)}
            style={{ marginTop: 8, background: "none", border: "none", color: "#10b981", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
            + Create new portfolio
          </button>
        )}
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>{error}</p>}

      {insufficientFunds && (
        <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8, textAlign: "center" }}>
          ⚠ Insufficient wallet balance. Add funds from your profile.
        </p>
      )}
      <button disabled={!selectedPortfolio || loading || insufficientFunds} onClick={() => setStep("confirm")} style={{
        width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
        background: (!selectedPortfolio || insufficientFunds) ? "#d1fae5" : "#10b981",
        color: "#fff", fontSize: 14, fontWeight: 700,
        cursor: (!selectedPortfolio || insufficientFunds) ? "not-allowed" : "pointer", transition: "background .15s"
      }}>Review Order →</button>
    </Modal>
  );

  if (step === "confirm") return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2 7h12M10 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm7 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
          </svg>
        </div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: "#0f172a" }}>Confirm Purchase</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>Review your order</p>
      </div>
      <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <InfoRow label="Stock" value={`${company?.name} (${company?.ticker})`} />
        <InfoRow label="Portfolio" value={selectedPortfolio?.name} />
        <InfoRow label="Quantity" value={quantity} />
        <InfoRow label="Price per share" value={`₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
          <InfoRow label="Total Amount" value={`₹${total}`} bold color="#059669" />
        </div>
      </div>
      {error && <p style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStep("form")} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back</button>
        <button onClick={handleBuy} disabled={loading} style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: "#10b981", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Placing…" : "Confirm Buy"}
        </button>
      </div>
    </Modal>
  );

  const ok = orderResponse?.status === "EXECUTED" || orderResponse?.status === "COMPLETED" || orderResponse?.status === "LIMIT_SET";
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px", background: ok ? "#f0fdf4" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 24 }}>{ok ? "✓" : "✕"}</span>
        </div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: "#0f172a" }}>{orderResponse?.status === "LIMIT_SET" ? "Limit Order Set!" : ok ? "Purchase Successful!" : "Order Rejected"}</p>
        {!ok && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#dc2626" }}>{orderResponse?.rejectionReason}</p>}
      </div>
      <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <InfoRow label="Order ID" value={`#${orderResponse?.orderId}`} />
        <InfoRow label="Stock" value={`${company?.name} (${company?.ticker})`} />
        <InfoRow label="Quantity" value={orderResponse?.quantity} />
        <InfoRow label="Price per share" value={`₹${fmt2(orderResponse?.priceAtOrder)}`} />
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
          <InfoRow label="Total Value" value={`₹${fmt2(orderResponse?.totalValue)}`} bold color="#059669" />
        </div>
      </div>
      <button onClick={onClose} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: "#0f172a", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Done</button>
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

  // Filters
  const [filterSearch, setFilterSearch] = useState("");
  const [sortBy, setSortBy] = useState("name"); // "name" | "price_asc" | "price_desc" | "change_asc" | "change_desc"
  const [priceRange, setPriceRange] = useState([0, 0]); // [min, max]
  const [priceRangeMax, setPriceRangeMax] = useState(100000);
  const [priceFilter, setPriceFilter] = useState([0, 100000]);


  useEffect(() => {
    axiosCompany.get("/companies").then((res) => {
      const map = {};
      res.data.forEach((c) => { map[c.id] = c; });
      setCompanies(map);
    }).catch(() => {});
  }, []);

  const fetchPrices = useCallback(() => {
    axiosExchange.get("/stocks")
      .then((res) => {
        const sorted = res.data.sort((a, b) => a.companyId - b.companyId);
        setStocks(sorted);
        setLastUpdate(new Date().toLocaleTimeString());
        setLoading(false);
        // Update price history
        setPriceHistory((prev) => {
          const next = { ...prev };
          sorted.forEach((s) => {
            const hist = prev[s.companyId] || [];
            next[s.companyId] = [...hist, Number(s.currentPrice)].slice(-30);
          });
          return next;
        });
        // Set price range bounds on first load
        if (sorted.length > 0) {
          const max = Math.max(...sorted.map((s) => Number(s.currentPrice)));
          const maxRounded = Math.ceil(max / 1000) * 1000;
          setPriceRangeMax(maxRounded);
          setPriceFilter((prev) => prev[1] === 100000 ? [0, maxRounded] : prev);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPrices();
    const iv = setInterval(fetchPrices, 1000);
    return () => clearInterval(iv);
  }, [fetchPrices]);

  const getPct = (current, open) => {
    if (!open || open === 0) return 0;
    return ((current - open) / open) * 100;
  };

  // Apply filters + sort
  const filtered = stocks
    .filter((s) => {
      const c = companies[s.companyId];
      const price = Number(s.currentPrice);
      const pct = getPct(price, s.openPriceToday);

      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        if (!c?.name?.toLowerCase().includes(q) && !c?.ticker?.toLowerCase().includes(q)) return false;
      }
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


  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", background: "#f8fafc" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        input[type=range]{accent-color:#10b981}
        .stock-row:hover{background:#f0fdf4 !important}
        .buy-btn:hover{background:#059669 !important;color:#fff !important}
      `}</style>

      {/* ══ FILTERS SIDEBAR ══ */}
      <aside style={{
        width: 220, flexShrink: 0, background: "#fff",
        borderRight: "1px solid #f1f5f9", padding: "20px 16px",
        position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", letterSpacing: "0.04em", textTransform: "uppercase" }}>Filters</span>
          <button onClick={() => { setFilterSearch(""); setPriceFilter([0, priceRangeMax]); setSortBy("name"); }}
            style={{ background: "none", border: "1px solid #10b981", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#10b981", cursor: "pointer" }}>
            Clear All
          </button>
        </div>

        {/* Sort — square pills */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Sort By</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[
              { label: "Name", val: "name" },
              { label: "Price ↑", val: "price_asc" },
              { label: "Price ↓", val: "price_desc" },
              { label: "Top Gainers", val: "change_desc" },
              { label: "Top Losers", val: "change_asc" },
            ].map(({ label, val }) => (
              <button key={val} onClick={() => setSortBy(val)} style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: sortBy === val ? "1.5px solid #10b981" : "1px solid #e2e8f0",
                background: sortBy === val ? "#10b981" : "#fff",
                color: sortBy === val ? "#fff" : "#64748b",
                cursor: "pointer", transition: "all .15s"
              }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "#f1f5f9", margin: "0 0 20px" }}/>

        {/* Price — square pill buckets, no slider */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Market Price</p>
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
                <button key={label}
                  onClick={() => setPriceFilter([min, max === Infinity ? priceRangeMax : max])}
                  style={{
                    padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    border: isActive ? "1.5px solid #10b981" : "1px solid #e2e8f0",
                    background: isActive ? "#10b981" : "#fff",
                    color: isActive ? "#fff" : "#64748b",
                    cursor: "pointer", transition: "all .15s"
                  }}>{label}</button>
              );
            })}
          </div>
        </div>

      </aside>

            {/* ══ MAIN CONTENT ══ */}
      <main style={{ flex: 1, padding: "24px 32px", overflow: "auto" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Explore Stocks</h1>
            {lastUpdate && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite" }}/>
                <strong style={{ color: "#0f172a" }}>{filtered.length} Stocks</strong>&nbsp;· Updated {lastUpdate}
              </p>
            )}
          </div>
          {/* Inline search for table */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "7px 14px", width: 240 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Filter table…" value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              style={{ border: "none", background: "none", outline: "none", fontSize: 13, color: "#0f172a", width: "100%" }}
            />
          </div>
        </div>


        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8", fontSize: 14 }}>Loading market data…</div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
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
                      fontSize: 11, fontWeight: 700, color: "#94a3b8",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      cursor: sortKey ? "pointer" : "default"
                    }} onClick={() => sortKey && setSortBy(sortBy === sortKey ? "name" : sortKey)}>
                      {label} {sortKey && (sortBy === sortKey ? " ↓" : "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 14 }}>
                    No stocks match your filters
                  </td></tr>
                ) : filtered.map((s) => {
                  const company = companies[s.companyId];
                  const price = Number(s.currentPrice);
                  const pct = getPct(price, s.openPriceToday);
                  const isUp = pct >= 0;
                  const hist = priceHistory[s.companyId] || [];
                  return (
                    <tr key={s.id} className="stock-row" style={{ borderBottom: "1px solid #f8fafc", transition: "background .1s", cursor: "default" }}>
                      {/* Company */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: isUp ? "#f0fdf4" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: isUp ? "#059669" : "#dc2626" }}>
                              {(company?.ticker || "?").slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{company?.name || "—"}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{company?.ticker} · NSE</p>
                          </div>
                        </div>
                      </td>
                      {/* Sparkline */}
                      <td style={{ padding: "14px 16px" }}>
                        <Sparkline data={hist} up={isUp}/>
                      </td>
                      {/* Price */}
                      <td style={{ padding: "14px 16px" }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                          ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </td>
                      {/* Open */}
                      <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                        ₹{Number(s.openPriceToday).toFixed(2)}
                      </td>
                      {/* High */}
                      <td style={{ padding: "14px 16px", color: "#059669", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                        ₹{Number(s.highToday).toFixed(2)}
                      </td>
                      {/* Low */}
                      <td style={{ padding: "14px 16px", color: "#dc2626", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                        ₹{Number(s.lowToday).toFixed(2)}
                      </td>
                      {/* Change */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                          background: isUp ? "#f0fdf4" : "#fef2f2",
                          color: isUp ? "#059669" : "#dc2626"
                        }}>
                          {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                        </span>
                      </td>
                      {/* Buy button */}
                      <td style={{ padding: "14px 16px" }}>
                        <button className="buy-btn" onClick={() => setBuyModal({ stock: s, company })} style={{
                          padding: "7px 20px", borderRadius: 8, border: "1.5px solid #10b981",
                          background: "#fff", color: "#10b981",
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

      {buyModal && (
        <BuyModal stock={buyModal.stock} company={buyModal.company} onClose={() => setBuyModal(null)}/>
      )}
    </div>
  );
};

export default UserDashboard;
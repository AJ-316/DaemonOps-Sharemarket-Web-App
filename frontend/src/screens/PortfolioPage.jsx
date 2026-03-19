import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosPortfolio from "../api/axiosPortfolio";
import axiosExchange from "../api/axiosExchange";
import axiosCompany from "../api/axiosCompany";

const fmt = (n) =>
  Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = (n) => {
  const num = Number(n);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)}Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)}L`;
  return `₹${fmt(num)}`;
};
const COLORS = ["#10b981","#3b82f6","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f43f5e","#84cc16","#fb923c"];

// ── Modal Shell ───────────────────────────────────────────────────────────────
function Modal({ onClose, children, width = 460 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)"
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: width,
        margin: "0 16px", padding: 28, position: "relative",
        boxShadow: "0 24px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          width: 28, height: 28, borderRadius: "50%",
          border: "none", background: "#f1f5f9", color: "#64748b",
          cursor: "pointer", fontSize: 14, display: "flex",
          alignItems: "center", justifyContent: "center", fontWeight: 700
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

// ── Sell Modal ────────────────────────────────────────────────────────────────
function SellModal({ holding, company, prices, portfolios, onClose, onDone }) {
  const [step, setStep] = useState("form");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderResponse, setOrderResponse] = useState(null);
  const [error, setError] = useState("");

  const ltp = Number(prices[holding.companyId]?.currentPrice || holding.averageBuyPrice || 0);
  const maxQty = Number(holding.quantityHeld || 0);
  const total = (ltp * quantity).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const portfolioName = portfolios.find((p) => p.id === holding.portfolioId)?.name || "Unknown";

  const handleSell = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosPortfolio.post("/orders", {
        companyId: holding.companyId,
        portfolioId: holding.portfolioId,
        orderType: "SELL",
        quantity: Number(quantity),
      });
      setOrderResponse(res.data);
      setStep("receipt");
      onDone();
    } catch (e) {
      setError(e?.response?.data?.message || "Order failed.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "form") return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }}>{(company?.ticker || "?").slice(0, 2)}</span>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{company?.name}</p>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", background: "#fef2f2", padding: "1px 6px", borderRadius: 4 }}>
              {company?.ticker}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: "#f8fafc", borderRadius: 10, padding: "8px 12px" }}>
            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>LTP</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>₹{fmt(ltp)}</p>
          </div>
          <div style={{ flex: 1, background: "#f8fafc", borderRadius: 10, padding: "8px 12px" }}>
            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>You hold</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{maxQty} shares</p>
          </div>
          <div style={{ flex: 1, background: "#f8fafc", borderRadius: 10, padding: "8px 12px" }}>
            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Portfolio</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{portfolioName}</p>
          </div>
        </div>
      </div>

      {/* Quantity */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quantity to Sell</p>
          <button onClick={() => setQuantity(maxQty)} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Sell All ({maxQty})
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {["-", "+"].map((btn) => (
            <button key={btn} onClick={() => setQuantity((q) => Math.max(1, Math.min(maxQty, btn === "+" ? q + 1 : q - 1)))}
              style={{
                width: 36, height: 36, borderRadius: 10, border: "1px solid #e2e8f0",
                background: "#f8fafc", color: "#475569", fontSize: 18, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>{btn}</button>
          ))}
          <input type="number" min={1} max={maxQty} value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1)))}
            style={{ width: 64, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 0", fontSize: 15, fontWeight: 700, color: "#0f172a", outline: "none" }}
          />
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>You'll receive</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>≈ ₹{total}</p>
          </div>
        </div>
        {/* Qty slider */}
        <input type="range" min={1} max={maxQty} value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          style={{ width: "100%", marginTop: 10, accentColor: "#dc2626" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}>
          <span>1</span><span>{maxQty}</span>
        </div>
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>{error}</p>}

      <button onClick={() => setStep("confirm")} style={{
        width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
        background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer"
      }}>Review Sale →</button>
    </Modal>
  );

  if (step === "confirm") return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: "#0f172a" }}>Confirm Sale</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>This action cannot be undone</p>
      </div>
      <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <InfoRow label="Stock" value={`${company?.name} (${company?.ticker})`} />
        <InfoRow label="Portfolio" value={portfolioName} />
        <InfoRow label="Quantity" value={quantity} />
        <InfoRow label="LTP" value={`₹${fmt(ltp)}`} />
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
          <InfoRow label="You'll receive" value={`₹${total}`} bold color="#dc2626" />
        </div>
      </div>
      {error && <p style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStep("form")} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back</button>
        <button onClick={handleSell} disabled={loading} style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Selling…" : "Confirm Sell"}
        </button>
      </div>
    </Modal>
  );

  const ok = orderResponse?.status === "EXECUTED" || orderResponse?.status === "COMPLETED";
  return (
    <Modal onClose={onClose}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px", background: ok ? "#f0fdf4" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 24, color: ok ? "#10b981" : "#dc2626" }}>{ok ? "✓" : "✕"}</span>
        </div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: "#0f172a" }}>{ok ? "Sold Successfully!" : "Order Rejected"}</p>
        {!ok && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#dc2626" }}>{orderResponse?.rejectionReason}</p>}
      </div>
      <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <InfoRow label="Order ID" value={`#${orderResponse?.orderId}`} />
        <InfoRow label="Quantity sold" value={orderResponse?.quantity} />
        <InfoRow label="Price per share" value={`₹${fmt(orderResponse?.priceAtOrder)}`} />
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
          <InfoRow label="Total received" value={`₹${fmt(orderResponse?.totalValue)}`} bold color="#059669" />
        </div>
      </div>
      <button onClick={onClose} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: "#0f172a", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Done</button>
    </Modal>
  );
}

// ── Delete Portfolio Modal ─────────────────────────────────────────────────────
function DeletePortfolioModal({ portfolio, holdings, portfolios, companies, onClose, onDeleted, transferOnly = false }) {
  const otherPortfolios = portfolios.filter((p) => p.id !== portfolio.id);
  const hasHoldings = holdings.length > 0;
  const [step, setStep] = useState(
    transferOnly ? "transfer" :
    !hasHoldings ? "confirm" :
    otherPortfolios.length > 0 ? "transfer" : "noTransfer"
  );
  const [targetPortfolio, setTargetPortfolio] = useState(otherPortfolios[0] || null);
  const [selectedHoldings, setSelectedHoldings] = useState(new Set(holdings.map((h) => h.id)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleHolding = (id) => {
    setSelectedHoldings((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleTransferAndDelete = async () => {
    if (!targetPortfolio) return;
    setLoading(true);
    setError("");
    try {
      for (const h of holdings) {
        if (!selectedHoldings.has(h.id)) continue;
        await axiosPortfolio.post("/orders", {
          companyId: h.companyId,
          portfolioId: portfolio.id,
          orderType: "SELL",
          quantity: h.quantityHeld,
        });
        await axiosPortfolio.post("/orders", {
          companyId: h.companyId,
          portfolioId: targetPortfolio.id,
          orderType: "BUY",
          quantity: h.quantityHeld,
        });
      }
      if (transferOnly) {
        // Just close — no delete
        onDeleted();
        return;
      }
      setStep("confirm");
    } catch (e) {
      setError(e?.response?.data?.message || "Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axiosPortfolio.delete(`/portfolio/${portfolio.id}`);
      onDeleted();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete portfolio.");
    } finally {
      setLoading(false);
    }
  };

  // ── No holdings — straight confirm ──
  if (step === "confirm") return (
    <Modal onClose={onClose} width={400}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#0f172a" }}>Delete "{portfolio.name}"?</p>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>
          {hasHoldings ? "Unselected stocks will be lost." : "This portfolio is empty and will be permanently deleted."}
        </p>
      </div>
      {error && <p style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={handleDelete} disabled={loading} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );

  // ── No other portfolio to transfer to ──
  if (step === "noTransfer") return (
    <Modal onClose={onClose} width={400}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
        </div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#0f172a" }}>Can't delete yet</p>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
          This portfolio has <strong>{holdings.length} stock{holdings.length > 1 ? "s" : ""}</strong>. You need to either sell them or create another portfolio to transfer them to before deleting.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
        <button onClick={() => { onClose(); }} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Go Sell Stocks
        </button>
      </div>
    </Modal>
  );

  // ── Transfer step ──
  return (
    <Modal onClose={onClose} width={500}>
      <div style={{ marginBottom: 18 }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#0f172a" }}>{transferOnly ? "Transfer Stocks" : "Transfer & Delete Portfolio"}</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>{transferOnly ? `Moving from "${portfolio.name}" → select destination` : "Select stocks to transfer, then choose destination portfolio"}</p>
      </div>

      {/* Stock checkboxes */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Stocks to Transfer</p>
          <button onClick={() => setSelectedHoldings(selectedHoldings.size === holdings.length ? new Set() : new Set(holdings.map((h) => h.id)))}
            style={{ background: "none", border: "none", fontSize: 11, color: "#3b82f6", fontWeight: 600, cursor: "pointer" }}>
            {selectedHoldings.size === holdings.length ? "Deselect all" : "Select all"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
          {holdings.map((h) => {
            const company = companies[h.companyId];
            const checked = selectedHoldings.has(h.id);
            return (
              <button key={h.id} onClick={() => toggleHolding(h.id)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                border: checked ? "1.5px solid #3b82f6" : "1px solid #f1f5f9",
                background: checked ? "#eff6ff" : "#f8fafc",
                transition: "all .15s", textAlign: "left"
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: checked ? "none" : "1.5px solid #cbd5e1",
                  background: checked ? "#3b82f6" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {checked && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{company?.ticker}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{h.quantityHeld} shares · Avg ₹{fmt(h.averageBuyPrice)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target portfolio */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Transfer To</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {otherPortfolios.map((p) => (
            <button key={p.id} onClick={() => setTargetPortfolio(p)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 10, cursor: "pointer",
              border: targetPortfolio?.id === p.id ? "1.5px solid #10b981" : "1px solid #f1f5f9",
              background: targetPortfolio?.id === p.id ? "#f0fdf4" : "#f8fafc",
              transition: "all .15s"
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: targetPortfolio?.id === p.id ? "#059669" : "#475569" }}>{p.name}</span>
              {targetPortfolio?.id === p.id && <span style={{ color: "#10b981", fontSize: 16 }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>{error}</p>}

      {selectedHoldings.size === 0 && (
        <p style={{ fontSize: 12, color: "#f59e0b", background: "#fffbeb", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
          ⚠ No stocks selected — unselected stocks will be lost on delete.
        </p>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={selectedHoldings.size > 0 ? handleTransferAndDelete : () => setStep("confirm")}
          disabled={loading || (selectedHoldings.size > 0 && !targetPortfolio)}
          style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1, background: selectedHoldings.size > 0 ? "#3b82f6" : "#dc2626", color: "#fff" }}>
          {loading ? "Transferring…" : selectedHoldings.size > 0 ? `Transfer ${selectedHoldings.size} stock${selectedHoldings.size > 1 ? "s" : ""}${transferOnly ? "" : " & Delete"}` : transferOnly ? "Cancel" : "Delete without transferring"}
        </button>
      </div>
    </Modal>
  );
}

// ── Donut SVG ─────────────────────────────────────────────────────────────────
function DonutSVG({ slices }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return (
    <svg viewBox="0 0 120 120" width="120" height="120">
      <circle cx="60" cy="60" r="44" fill="none" stroke="#e5e7eb" strokeWidth="18"/>
    </svg>
  );
  const R = 44, IR = 26, CX = 60, CY = 60;
  if (slices.length === 1) return (
    <svg viewBox="0 0 120 120" width="120" height="120" style={{ flexShrink: 0 }}>
      <circle cx={CX} cy={CY} r={R} fill={slices[0].color}/>
      <circle cx={CX} cy={CY} r={IR} fill="white"/>
    </svg>
  );
  let theta = -Math.PI / 2;
  const paths = slices.map((s) => {
    const sweep = (s.value / total) * 2 * Math.PI;
    if (sweep < 0.001) return null;
    const x1 = CX + R * Math.cos(theta), y1 = CY + R * Math.sin(theta);
    theta += sweep;
    const x2 = CX + R * Math.cos(theta), y2 = CY + R * Math.sin(theta);
    const ix1 = CX + IR * Math.cos(theta - sweep), iy1 = CY + IR * Math.sin(theta - sweep);
    const ix2 = CX + IR * Math.cos(theta), iy2 = CY + IR * Math.sin(theta);
    const lg = sweep > Math.PI ? 1 : 0;
    const d = `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${lg} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix2.toFixed(2)},${iy2.toFixed(2)} A${IR},${IR} 0 ${lg} 0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z`;
    return <path key={s.label} d={d} fill={s.color} stroke="white" strokeWidth="1.5"/>;
  });
  return <svg viewBox="0 0 120 120" width="120" height="120" style={{ flexShrink: 0 }}>{paths}</svg>;
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 60, H = 22;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * W).toFixed(1)},${(H - ((v - min) / range) * H).toFixed(1)}`).join(" ");
  return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const PortfolioPage = () => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [selected, setSelected] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [companies, setCompanies] = useState({});
  const [prices, setPrices] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stocks");
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [sellModal, setSellModal] = useState(null);       // holding to sell
  const [deleteModal, setDeleteModal] = useState(null);   // portfolio to delete
  const [transferModal, setTransferModal] = useState(false); // standalone transfer

  useEffect(() => {
    axiosCompany.get("/companies").then((res) => {
      const map = {};
      res.data.forEach((c) => { map[c.id] = c; });
      setCompanies(map);
    });
  }, []);

  const refreshPrices = useCallback(() => {
    axiosExchange.get("/stocks").then((res) => {
      const map = {};
      res.data.forEach((s) => { map[s.companyId] = s; });
      setPrices(map);
      setPriceHistory((prev) => {
        const next = { ...prev };
        res.data.forEach((s) => {
          const hist = prev[s.companyId] || [];
          next[s.companyId] = [...hist, Number(s.currentPrice)].slice(-20);
        });
        return next;
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    refreshPrices();
    const iv = setInterval(refreshPrices, 1000);
    return () => clearInterval(iv);
  }, [refreshPrices]);

  const fetchPortfolios = useCallback(() => {
    axiosPortfolio.get("/portfolio").then((res) => {
      const list = res.data || [];
      setPortfolios(list);
      setSelected((prev) => {
        if (!prev) return list[0] || null;
        return list.find((p) => p.id === prev.id) || list[0] || null;
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPortfolios(); }, []);

  const fetchHoldings = useCallback(() => {
    if (!selected) return;
    axiosPortfolio.get(`/portfolio/holdings/${selected.id}`)
      .then((res) => setHoldings(res.data || []))
      .catch(() => {});
  }, [selected]);

  useEffect(() => {
    fetchHoldings();
    const iv = setInterval(fetchHoldings, 3000);
    return () => clearInterval(iv);
  }, [fetchHoldings]);

  const fetchOrders = useCallback(() => {
    axiosPortfolio.get("/orders/history")
      .then((res) => setOrders(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 5000);
    return () => clearInterval(iv);
  }, [fetchOrders]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await axiosPortfolio.post("/portfolio", { name: newName.trim() });
      setNewName(""); setShowNewInput(false); fetchPortfolios();
    } finally { setCreating(false); }
  };

  // Invested = total BUY spend from order history for this portfolio (not reduced by sells)
  // This gives true cost basis — selling doesn't reduce what you originally invested
  const totalInvested = orders
    .filter((o) => (o.status === "EXECUTED" || o.status === "COMPLETED") && o.orderType === "BUY")
    .reduce((s, o) => s + Number(o.totalValue || 0), 0);

  const totalCurrent = holdings.reduce((s, h) => {
    const p = Number(prices[h.companyId]?.currentPrice || h.averageBuyPrice || 0);
    return s + p * Number(h.quantityHeld || 0);
  }, 0);

  // P&L = current value of holdings - what we paid for the shares we still hold
  const holdingsCostBasis = holdings.reduce((s, h) => s + Number(h.averageBuyPrice || 0) * Number(h.quantityHeld || 0), 0);
  const totalPnl = totalCurrent - holdingsCostBasis;
  const totalPnlPct = holdingsCostBasis > 0 ? ((totalPnl / holdingsCostBasis) * 100) : 0;
  const pnlUp = totalPnl >= 0;

  const donutSlices = holdings.map((h, i) => ({
    label: companies[h.companyId]?.ticker || `#${h.companyId}`,
    value: Number(prices[h.companyId]?.currentPrice || h.averageBuyPrice || 0) * Number(h.quantityHeld || 0),
    color: COLORS[i % COLORS.length],
  })).filter((s) => s.value > 0);
  const donutTotal = donutSlices.reduce((s, x) => s + x.value, 0);

  const filteredHoldings = holdings.filter((h) => {
    const c = companies[h.companyId];
    return !search || c?.name?.toLowerCase().includes(search.toLowerCase()) || c?.ticker?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, border: "2.5px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden", background: "#f8fafc" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* ── TOP BAR ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, background: "#fff", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginRight: 4 }}>Portfolios</span>
          <div style={{ width: 1, height: 18, background: "#e2e8f0" }}/>
          {portfolios.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <button onClick={() => setSelected(p)} style={{
                padding: "4px 12px", borderRadius: selected?.id === p.id ? "8px 0 0 8px" : 8,
                fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", transition: "all .15s",
                background: selected?.id === p.id ? "#10b981" : "#f1f5f9",
                color: selected?.id === p.id ? "#fff" : "#64748b",
              }}>{p.name}</button>
              <button onClick={() => setDeleteModal(p)} style={{
                padding: "4px 7px", borderRadius: "0 8px 8px 0", fontSize: 10,
                border: "none", cursor: "pointer", transition: "all .15s",
                background: selected?.id === p.id ? "#059669" : "#e2e8f0",
                color: selected?.id === p.id ? "#fff" : "#94a3b8",
                borderLeft: selected?.id === p.id ? "1px solid rgba(255,255,255,0.2)" : "1px solid #f1f5f9"
              }} title="Delete portfolio">🗑</button>
            </div>
          ))}
          {showNewInput ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Portfolio name…"
                style={{ border: "1px solid #d1fae5", borderRadius: 8, padding: "4px 10px", fontSize: 12, outline: "none", width: 140 }}
              />
              <button onClick={handleCreate} disabled={creating} style={{ padding: "4px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{creating ? "…" : "Save"}</button>
              <button onClick={() => setShowNewInput(false)} style={{ padding: "4px 8px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setShowNewInput(true)} style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "1.5px dashed #cbd5e1", background: "none", color: "#94a3b8", cursor: "pointer" }}>+ New</button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }}/>
            Live
          </span>
          {holdings.length > 0 && (
            <button onClick={() => {
              if (portfolios.length < 2) {
                alert("Create another portfolio first to transfer stocks.");
                return;
              }
              setTransferModal(true);
            }} style={{
              padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "1.5px solid #3b82f6", background: "#eff6ff", color: "#2563eb",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all .15s"
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              Transfer
            </button>
          )}
          <button onClick={() => navigate("/dashboard")} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", cursor: "pointer" }}>← Markets</button>
        </div>
      </div>

      {selected ? (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ══ LEFT PANEL ══ */}
          <div style={{ width: 288, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12, padding: 16, borderRight: "1px solid #f1f5f9", background: "#fff", overflow: "hidden" }}>
            {/* Hero KPI */}
            <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", borderRadius: 16, padding: "16px 20px", flexShrink: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#d1fae5", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>Current Value</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 4px", fontVariantNumeric: "tabular-nums" }}>{fmtCompact(totalCurrent)}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: pnlUp ? "rgba(255,255,255,0.2)" : "rgba(239,68,68,0.25)", color: pnlUp ? "#ecfdf5" : "#fecaca" }}>
                  {pnlUp ? "▲" : "▼"} {Math.abs(totalPnlPct).toFixed(2)}%
                </span>
                <span style={{ fontSize: 11, color: "#a7f3d0" }}>vs invested</span>
              </div>
            </div>

            {/* 2-col KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 }}>
              {[
                { label: "Invested", value: fmtCompact(totalInvested), color: "#0f172a" },
                { label: "Total P&L", value: `${pnlUp ? "+" : ""}${fmtCompact(totalPnl)}`, color: pnlUp ? "#059669" : "#dc2626" },
              ].map((k) => (
                <div key={k.label} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", border: "1px solid #f1f5f9" }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>{k.label}</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: k.color, margin: 0, fontVariantNumeric: "tabular-nums" }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Holdings count */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>Holdings</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{holdings.length} stocks</span>
            </div>

            {/* Donut */}
            <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", border: "1px solid #f1f5f9", flexShrink: 0 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>Allocation</p>
              {donutSlices.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <DonutSVG slices={donutSlices}/>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
                    {donutSlices.map((s) => (
                      <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }}/>
                        <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                        <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>{donutTotal > 0 ? ((s.value / donutTotal) * 100).toFixed(1) : 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0", color: "#cbd5e1", fontSize: 12 }}>No holdings yet</div>
              )}
            </div>

            {/* Summary strip */}
            <div style={{ marginTop: "auto", padding: "10px 14px", borderRadius: 10, background: pnlUp ? "#f0fdf4" : "#fef2f2", border: `1px solid ${pnlUp ? "#bbf7d0" : "#fecaca"}`, flexShrink: 0 }}>
              <p style={{ fontSize: 10, color: pnlUp ? "#166534" : "#991b1b", fontWeight: 600, margin: "0 0 2px" }}>{pnlUp ? "Portfolio is up today" : "Portfolio is down today"}</p>
              <p style={{ fontSize: 12, color: pnlUp ? "#15803d" : "#b91c1c", fontWeight: 700, margin: 0 }}>
                {pnlUp ? "+" : ""}{fmtCompact(totalPnl)} ({Math.abs(totalPnlPct).toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 16 }}>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

              {/* Tab bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #f8fafc", flexShrink: 0 }}>
                <div style={{ display: "flex", background: "#f8fafc", borderRadius: 10, padding: 3 }}>
                  {["stocks", "orders"].map((t) => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{
                      padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: "none", cursor: "pointer", transition: "all .15s", textTransform: "capitalize",
                      background: activeTab === t ? "#fff" : "transparent",
                      color: activeTab === t ? "#0f172a" : "#94a3b8",
                      boxShadow: activeTab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    }}>{t}</button>
                  ))}
                </div>
                {activeTab === "stocks" && (
                  <input type="text" placeholder="Search stocks…" value={search} onChange={(e) => setSearch(e.target.value)}
                    style={{ border: "1px solid #f1f5f9", borderRadius: 8, padding: "6px 12px", fontSize: 12, outline: "none", width: 160, background: "#f8fafc", color: "#0f172a" }}
                  />
                )}
              </div>

              {/* Scrollable table */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {activeTab === "stocks" && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", position: "sticky", top: 0, zIndex: 1 }}>
                        {["Stock", "Qty", "Avg Cost", "LTP", "Trend", "Invested", "Current", "P&L", ""].map((col) => (
                          <th key={col} style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHoldings.length === 0 ? (
                        <tr><td colSpan={9} style={{ textAlign: "center", padding: "60px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#cbd5e1" }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M11 12h2"/></svg>
                            <span style={{ fontSize: 13 }}>No holdings — go buy some stocks from Markets!</span>
                          </div>
                        </td></tr>
                      ) : filteredHoldings.map((h, idx) => {
                        const company = companies[h.companyId];
                        const ltp = Number(prices[h.companyId]?.currentPrice || h.averageBuyPrice || 0);
                        const avg = Number(h.averageBuyPrice || 0);
                        const qty = Number(h.quantityHeld || 0);
                        const invested = avg * qty, current = ltp * qty, pnl = current - invested;
                        const pnlPct = invested > 0 ? ((pnl / invested) * 100) : 0;
                        const up = pnl >= 0;
                        const color = COLORS[idx % COLORS.length];
                        const hist = priceHistory[h.companyId] || [];
                        return (
                          <tr key={h.id} style={{ borderBottom: "1px solid #f8fafc", transition: "background .1s" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: 10, fontWeight: 800, color }}>{(company?.ticker || "?").slice(0, 2)}</span>
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 12 }}>{company?.ticker || h.companyId}</p>
                                  <p style={{ margin: 0, color: "#94a3b8", fontSize: 10, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company?.name}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", color: "#475569", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{qty}</td>
                            <td style={{ padding: "12px 16px", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>₹{fmt(avg)}</td>
                            <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>₹{fmt(ltp)}</td>
                            <td style={{ padding: "12px 16px" }}><Sparkline data={hist} color={up ? "#10b981" : "#ef4444"}/></td>
                            <td style={{ padding: "12px 16px", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>₹{fmt(invested)}</td>
                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>₹{fmt(current)}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div>
                                <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 12, color: up ? "#059669" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>{up ? "+" : ""}₹{fmt(pnl)}</p>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "1px 6px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: up ? "#f0fdf4" : "#fef2f2", color: up ? "#059669" : "#dc2626" }}>
                                  {up ? "▲" : "▼"} {Math.abs(pnlPct).toFixed(2)}%
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <button onClick={() => setSellModal(h)} style={{
                                padding: "6px 14px", borderRadius: 8, border: "none",
                                background: "#fef2f2", color: "#dc2626",
                                fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "background .15s"
                              }}
                                onMouseEnter={(e) => { e.target.style.background = "#dc2626"; e.target.style.color = "#fff"; }}
                                onMouseLeave={(e) => { e.target.style.background = "#fef2f2"; e.target.style.color = "#dc2626"; }}
                              >Sell</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {activeTab === "orders" && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", position: "sticky", top: 0, zIndex: 1 }}>
                        {["ID", "Stock", "Type", "Qty", "Price", "Total", "Status", "Time"].map((col) => (
                          <th key={col} style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: "center", padding: "60px 16px", color: "#cbd5e1", fontSize: 13 }}>No order history</td></tr>
                      ) : orders.map((o) => {
                        const company = companies[o.companyId];
                        const isBuy = o.orderType === "BUY";
                        const ok = o.status === "EXECUTED" || o.status === "COMPLETED";
                        return (
                          <tr key={o.id} style={{ borderBottom: "1px solid #f8fafc" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "10px 16px", color: "#cbd5e1", fontVariantNumeric: "tabular-nums" }}>#{o.id}</td>
                            <td style={{ padding: "10px 16px", fontWeight: 700, color: "#0f172a" }}>{company?.ticker || o.companyId}</td>
                            <td style={{ padding: "10px 16px" }}>
                              <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: isBuy ? "#f0fdf4" : "#fef2f2", color: isBuy ? "#059669" : "#dc2626" }}>{o.orderType}</span>
                            </td>
                            <td style={{ padding: "10px 16px", color: "#475569", fontVariantNumeric: "tabular-nums" }}>{o.quantity}</td>
                            <td style={{ padding: "10px 16px", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>₹{fmt(o.priceAtOrder)}</td>
                            <td style={{ padding: "10px 16px", fontWeight: 600, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>₹{fmt(o.totalValue)}</td>
                            <td style={{ padding: "10px 16px" }}>
                              <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: ok ? "#f0fdf4" : "#fef2f2", color: ok ? "#059669" : "#dc2626" }}>{o.status}</span>
                            </td>
                            <td style={{ padding: "10px 16px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                              {o.timestamp ? new Date(o.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📂</div>
          <p style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>No portfolio yet</p>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Create one to start tracking</p>
          <button onClick={() => setShowNewInput(true)} style={{ padding: "10px 24px", background: "#10b981", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Create Portfolio</button>
        </div>
      )}

      {/* ── Sell Modal ── */}
      {sellModal && (
        <SellModal
          holding={sellModal}
          company={companies[sellModal.companyId]}
          prices={prices}
          portfolios={portfolios}
          onClose={() => setSellModal(null)}
          onDone={() => { setSellModal(null); fetchHoldings(); fetchOrders(); }}
        />
      )}

      {/* ── Delete Portfolio Modal ── */}
      {deleteModal && (
        <DeletePortfolioModal
          portfolio={deleteModal}
          holdings={holdings}
          portfolios={portfolios}
          companies={companies}
          onClose={() => setDeleteModal(null)}
          onDeleted={() => {
            setDeleteModal(null);
            fetchPortfolios();
          }}
        />
      )}

      {/* ── Standalone Transfer Modal ── */}
      {transferModal && selected && (
        <DeletePortfolioModal
          portfolio={selected}
          holdings={holdings}
          portfolios={portfolios}
          companies={companies}
          transferOnly={true}
          onClose={() => setTransferModal(false)}
          onDeleted={() => {
            setTransferModal(false);
            // Force immediate refetch — setTimeout ensures state has settled
            setTimeout(() => { fetchHoldings(); fetchOrders(); }, 300);
          }}
        />
      )}
    </div>
  );
};

export default PortfolioPage;
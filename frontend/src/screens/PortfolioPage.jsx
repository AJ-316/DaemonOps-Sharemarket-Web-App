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

const SLICE_COLORS = [
  "#10b981","#3b82f6","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f43f5e","#84cc16","#fb923c"
];

// ── Donut SVG (self-contained, correct geometry) ───────────────────────────
function DonutSVG({ slices }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r="44" fill="none" stroke="#e5e7eb" strokeWidth="18"/>
        <text x="60" y="64" textAnchor="middle" fontSize="10" fill="#9ca3af">Empty</text>
      </svg>
    );
  }
  const R = 44, IR = 26, CX = 60, CY = 60;

  // Single slice = full donut ring (arc path is degenerate at 360°)
  if (slices.length === 1) {
    return (
      <svg viewBox="0 0 120 120" width="120" height="120" style={{ flexShrink: 0 }}>
        <circle cx={CX} cy={CY} r={R} fill={slices[0].color} />
        <circle cx={CX} cy={CY} r={IR} fill="white" />
      </svg>
    );
  }

  let theta = -Math.PI / 2;
  const paths = slices.map((s) => {
    const sweep = (s.value / total) * 2 * Math.PI;
    if (sweep < 0.001) return null;
    const x1 = CX + R * Math.cos(theta);
    const y1 = CY + R * Math.sin(theta);
    theta += sweep;
    const x2 = CX + R * Math.cos(theta);
    const y2 = CY + R * Math.sin(theta);
    const ix1 = CX + IR * Math.cos(theta - sweep);
    const iy1 = CY + IR * Math.sin(theta - sweep);
    const ix2 = CX + IR * Math.cos(theta);
    const iy2 = CY + IR * Math.sin(theta);
    const lg = sweep > Math.PI ? 1 : 0;
    const d = [
      `M${x1.toFixed(2)},${y1.toFixed(2)}`,
      `A${R},${R} 0 ${lg} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`,
      `L${ix2.toFixed(2)},${iy2.toFixed(2)}`,
      `A${IR},${IR} 0 ${lg} 0 ${ix1.toFixed(2)},${iy1.toFixed(2)}`,
      "Z"
    ].join(" ");
    return <path key={s.label} d={d} fill={s.color} stroke="white" strokeWidth="1.5"/>;
  });

  return (
    <svg viewBox="0 0 120 120" width="120" height="120" style={{ flexShrink: 0 }}>
      {paths}
    </svg>
  );
}

// ── Sparkline for price history ────────────────────────────────────────────
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 60, H = 22;
  const pts = data.map((v, i) =>
    `${((i / (data.length - 1)) * W).toFixed(1)},${(H - ((v - min) / range) * H).toFixed(1)}`
  ).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
const PortfolioPage = () => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [selected, setSelected] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [companies, setCompanies] = useState({});
  const [prices, setPrices] = useState({});
  const [priceHistory, setPriceHistory] = useState({});  // companyId → [price, ...]
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stocks");
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // companies
  useEffect(() => {
    axiosCompany.get("/companies").then((res) => {
      const map = {};
      res.data.forEach((c) => { map[c.id] = c; });
      setCompanies(map);
    });
  }, []);

  // live prices + sparkline history (silent on 401 — may need auth on exchange service)
  const refreshPrices = useCallback(() => {
    axiosExchange.get("/stocks")
      .then((res) => {
        const map = {};
        res.data.forEach((s) => { map[s.companyId] = s; });
        setPrices(map);
        setPriceHistory((prev) => {
          const next = { ...prev };
          res.data.forEach((s) => {
            const hist = prev[s.companyId] || [];
            const updated = [...hist, Number(s.currentPrice)].slice(-20);
            next[s.companyId] = updated;
          });
          return next;
        });
      })
      .catch(() => {}); // silence 401/network — prices are best-effort
  }, []);

  useEffect(() => {
    refreshPrices();
    const iv = setInterval(refreshPrices, 1000);
    return () => clearInterval(iv);
  }, [refreshPrices]);

  // portfolios
  const fetchPortfolios = useCallback(() => {
    axiosPortfolio.get("/portfolio")
      .then((res) => {
        const list = res.data || [];
        setPortfolios(list);
        setSelected((prev) => prev ?? (list[0] || null));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPortfolios(); }, []);

  // holdings — poll every 3s so new purchases appear without page refresh
  const fetchHoldings = useCallback(() => {
    if (!selected) return;
    axiosPortfolio
      .get(`/portfolio/holdings/${selected.id}`, { params: { portfolioId: selected.id } })
      .then((res) => setHoldings(res.data || []))
      .catch(() => {});
  }, [selected]);

  useEffect(() => {
    fetchHoldings();
    const iv = setInterval(fetchHoldings, 3000);
    return () => clearInterval(iv);
  }, [fetchHoldings]);

  // orders — poll every 5s
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

  // ── derived ──
  const totalInvested = holdings.reduce(
    (s, h) => s + Number(h.averageBuyPrice || 0) * Number(h.quantityHeld || 0), 0);
  const totalCurrent = holdings.reduce((s, h) => {
    const p = Number(prices[h.companyId]?.currentPrice || h.averageBuyPrice || 0);
    return s + p * Number(h.quantityHeld || 0);
  }, 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? ((totalPnl / totalInvested) * 100) : 0;
  const pnlUp = totalPnl >= 0;

  const donutSlices = holdings.map((h, i) => ({
    label: companies[h.companyId]?.ticker || `#${h.companyId}`,
    value: Number(prices[h.companyId]?.currentPrice || h.averageBuyPrice || 0) * Number(h.quantityHeld || 0),
    color: SLICE_COLORS[i % SLICE_COLORS.length],
  })).filter((s) => s.value > 0);

  const donutTotal = donutSlices.reduce((s, x) => s + x.value, 0);

  const filteredHoldings = holdings.filter((h) => {
    const c = companies[h.companyId];
    return !search ||
      c?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c?.ticker?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 28, height: 28, border: "2.5px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Loading portfolios…</p>
      </div>
    </div>
  );

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden", background: "#f8fafc" }}>

      {/* ── TOP BAR ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 52, background: "#fff",
        borderBottom: "1px solid #f1f5f9", flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginRight: 4 }}>Portfolios</span>
          <div style={{ width: 1, height: 18, background: "#e2e8f0" }} />
          {portfolios.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} style={{
              padding: "4px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer", transition: "all .15s",
              background: selected?.id === p.id ? "#10b981" : "#f1f5f9",
              color: selected?.id === p.id ? "#fff" : "#64748b",
            }}>{p.name}</button>
          ))}
          {showNewInput ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Portfolio name…"
                style={{ border: "1px solid #d1fae5", borderRadius: 8, padding: "4px 10px", fontSize: 12, outline: "none", width: 140 }}
              />
              <button onClick={handleCreate} disabled={creating} style={{
                padding: "4px 12px", background: "#10b981", color: "#fff",
                border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}>{creating ? "…" : "Save"}</button>
              <button onClick={() => setShowNewInput(false)} style={{
                padding: "4px 8px", background: "none", border: "none",
                color: "#94a3b8", cursor: "pointer", fontSize: 14
              }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setShowNewInput(true)} style={{
              padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
              border: "1.5px dashed #cbd5e1", background: "none", color: "#94a3b8", cursor: "pointer"
            }}>+ New</button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
            Live
          </span>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
          <button onClick={() => navigate("/dashboard")} style={{
            padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: "1px solid #e2e8f0", background: "#fff", color: "#475569", cursor: "pointer"
          }}>← Markets</button>
        </div>
      </div>

      {selected ? (
        <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: 0 }}>

          {/* ══ LEFT PANEL ══ */}
          <div style={{
            width: 288, flexShrink: 0, display: "flex", flexDirection: "column",
            gap: 12, padding: 16, borderRight: "1px solid #f1f5f9",
            background: "#fff", overflow: "hidden"
          }}>

            {/* Hero KPI */}
            <div style={{
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
              borderRadius: 16, padding: "16px 20px", flexShrink: 0
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#d1fae5", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
                Current Value
              </p>
              <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 4px", fontVariantNumeric: "tabular-nums" }}>
                {fmtCompact(totalCurrent)}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: pnlUp ? "rgba(255,255,255,0.2)" : "rgba(239,68,68,0.25)",
                  color: pnlUp ? "#ecfdf5" : "#fecaca"
                }}>
                  {pnlUp ? "▲" : "▼"} {Math.abs(totalPnlPct).toFixed(2)}%
                </span>
                <span style={{ fontSize: 11, color: "#a7f3d0" }}>vs invested</span>
              </div>
            </div>

            {/* 2-col KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 }}>
              {[
                { label: "Invested", value: fmtCompact(totalInvested), color: "#0f172a" },
                {
                  label: "Total P&L",
                  value: `${pnlUp ? "+" : ""}${fmtCompact(totalPnl)}`,
                  color: pnlUp ? "#059669" : "#dc2626"
                },
              ].map((k) => (
                <div key={k.label} style={{
                  background: "#f8fafc", borderRadius: 12, padding: "12px 14px",
                  border: "1px solid #f1f5f9"
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
                    {k.label}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: k.color, margin: 0, fontVariantNumeric: "tabular-nums" }}>
                    {k.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Holdings count chip */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 14px", background: "#f8fafc", borderRadius: 10,
              border: "1px solid #f1f5f9", flexShrink: 0
            }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>Holdings</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{holdings.length} stocks</span>
            </div>

            {/* Donut section */}
            <div style={{
              background: "#f8fafc", borderRadius: 14, padding: "14px 16px",
              border: "1px solid #f1f5f9", flexShrink: 0
            }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
                Allocation
              </p>
              {donutSlices.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <DonutSVG slices={donutSlices} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
                    {donutSlices.map((s) => (
                      <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.label}
                        </span>
                        <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>
                          {donutTotal > 0 ? ((s.value / donutTotal) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0", color: "#cbd5e1", fontSize: 12 }}>
                  No holdings yet
                </div>
              )}
            </div>

            {/* Today's summary */}
            <div style={{
              marginTop: "auto", padding: "10px 14px", borderRadius: 10,
              background: pnlUp ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${pnlUp ? "#bbf7d0" : "#fecaca"}`,
              flexShrink: 0
            }}>
              <p style={{ fontSize: 10, color: pnlUp ? "#166534" : "#991b1b", fontWeight: 600, margin: "0 0 2px" }}>
                {pnlUp ? "Portfolio is up today" : "Portfolio is down today"}
              </p>
              <p style={{ fontSize: 12, color: pnlUp ? "#15803d" : "#b91c1c", fontWeight: 700, margin: 0 }}>
                {pnlUp ? "+" : ""}{fmtCompact(totalPnl)} ({Math.abs(totalPnlPct).toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 16 }}>
            <div style={{
              background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9",
              display: "flex", flexDirection: "column", height: "100%", overflow: "hidden"
            }}>

              {/* Tab bar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 20px", borderBottom: "1px solid #f8fafc", flexShrink: 0
              }}>
                <div style={{ display: "flex", background: "#f8fafc", borderRadius: 10, padding: 3 }}>
                  {["stocks", "orders"].map((t) => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{
                      padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: "none", cursor: "pointer", transition: "all .15s",
                      textTransform: "capitalize",
                      background: activeTab === t ? "#fff" : "transparent",
                      color: activeTab === t ? "#0f172a" : "#94a3b8",
                      boxShadow: activeTab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    }}>{t}</button>
                  ))}
                </div>
                {activeTab === "stocks" && (
                  <input type="text" placeholder="Search stocks…" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      border: "1px solid #f1f5f9", borderRadius: 8, padding: "6px 12px",
                      fontSize: 12, outline: "none", width: 160, background: "#f8fafc", color: "#0f172a"
                    }}
                  />
                )}
              </div>

              {/* Table */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {activeTab === "stocks" && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", position: "sticky", top: 0, zIndex: 1 }}>
                        {["Stock", "Qty", "Avg Cost", "LTP", "Trend", "Invested", "Current", "P&L"].map((col) => (
                          <th key={col} style={{
                            textAlign: "left", padding: "10px 16px",
                            fontSize: 10, fontWeight: 700, color: "#94a3b8",
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap"
                          }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHoldings.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: "center", padding: "60px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#cbd5e1" }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M11 12h2"/>
                            </svg>
                            <span style={{ fontSize: 13 }}>No holdings yet — buy some stocks!</span>
                          </div>
                        </td></tr>
                      ) : filteredHoldings.map((h, idx) => {
                        const company = companies[h.companyId];
                        const ltp = Number(prices[h.companyId]?.currentPrice || h.averageBuyPrice || 0);
                        const avg = Number(h.averageBuyPrice || 0);
                        const qty = Number(h.quantityHeld || 0);
                        const invested = avg * qty;
                        const current = ltp * qty;
                        const pnl = current - invested;
                        const pnlPct = invested > 0 ? ((pnl / invested) * 100) : 0;
                        const up = pnl >= 0;
                        const color = SLICE_COLORS[idx % SLICE_COLORS.length];
                        const hist = priceHistory[h.companyId] || [];

                        return (
                          <tr key={h.id} style={{ borderBottom: "1px solid #f8fafc", transition: "background .1s" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8,
                                  background: color + "20",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  flexShrink: 0
                                }}>
                                  <span style={{ fontSize: 10, fontWeight: 800, color }}>{(company?.ticker || "?").slice(0, 2)}</span>
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 12 }}>
                                    {company?.ticker || h.companyId}
                                  </p>
                                  <p style={{ margin: 0, color: "#94a3b8", fontSize: 10, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {company?.name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", color: "#475569", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{qty}</td>
                            <td style={{ padding: "12px 16px", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>₹{fmt(avg)}</td>
                            <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>₹{fmt(ltp)}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <Sparkline data={hist} color={up ? "#10b981" : "#ef4444"} />
                            </td>
                            <td style={{ padding: "12px 16px", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>₹{fmt(invested)}</td>
                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>₹{fmt(current)}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div>
                                <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 12, color: up ? "#059669" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                                  {up ? "+" : ""}₹{fmt(pnl)}
                                </p>
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 2,
                                  padding: "1px 6px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                                  background: up ? "#f0fdf4" : "#fef2f2",
                                  color: up ? "#059669" : "#dc2626"
                                }}>
                                  {up ? "▲" : "▼"} {Math.abs(pnlPct).toFixed(2)}%
                                </span>
                              </div>
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
                          <th key={col} style={{
                            textAlign: "left", padding: "10px 16px",
                            fontSize: 10, fontWeight: 700, color: "#94a3b8",
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap"
                          }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: "center", padding: "60px 16px", color: "#cbd5e1", fontSize: 13 }}>
                          No order history
                        </td></tr>
                      ) : orders.map((o) => {
                        const company = companies[o.companyId];
                        const isBuy = o.orderType === "BUY";
                        const ok = o.status === "EXECUTED" || o.status === "COMPLETED";
                        return (
                          <tr key={o.id} style={{ borderBottom: "1px solid #f8fafc" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "10px 16px", color: "#cbd5e1", fontVariantNumeric: "tabular-nums" }}>#{o.id}</td>
                            <td style={{ padding: "10px 16px", fontWeight: 700, color: "#0f172a" }}>
                              {company?.ticker || o.companyId}
                            </td>
                            <td style={{ padding: "10px 16px" }}>
                              <span style={{
                                padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                                background: isBuy ? "#f0fdf4" : "#fef2f2",
                                color: isBuy ? "#059669" : "#dc2626"
                              }}>{o.orderType}</span>
                            </td>
                            <td style={{ padding: "10px 16px", color: "#475569", fontVariantNumeric: "tabular-nums" }}>{o.quantity}</td>
                            <td style={{ padding: "10px 16px", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>₹{fmt(o.priceAtOrder)}</td>
                            <td style={{ padding: "10px 16px", fontWeight: 600, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>₹{fmt(o.totalValue)}</td>
                            <td style={{ padding: "10px 16px" }}>
                              <span style={{
                                padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                                background: ok ? "#f0fdf4" : "#fef2f2",
                                color: ok ? "#059669" : "#dc2626"
                              }}>{o.status}</span>
                            </td>
                            <td style={{ padding: "10px 16px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                              {o.timestamp ? new Date(o.timestamp).toLocaleString("en-IN", {
                                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                              }) : "—"}
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
          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Create one to start tracking your investments</p>
          <button onClick={() => setShowNewInput(true)} style={{
            padding: "10px 24px", background: "#10b981", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer"
          }}>+ Create Portfolio</button>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
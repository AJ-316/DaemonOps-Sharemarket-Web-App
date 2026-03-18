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
  "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f43f5e", "#84cc16", "#fb923c"
];

function DonutSVG({ slices }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r="44" fill="none" stroke="#e5e7eb" strokeWidth="18" />
        <text x="60" y="64" textAnchor="middle" fontSize="10" fill="#9ca3af">Empty</text>
      </svg>
    );
  }
  const R = 44;
  const IR = 26;
  const CX = 60;
  const CY = 60;

  if (slices.length === 1) {
    return (
      <svg viewBox="0 0 120 120" width="120" height="120" style={{ flexShrink: 0 }}>
        <circle cx={CX} cy={CY} r={R} fill={slices[0].color} />
        <circle cx={CX} cy={CY} r={IR} fill="white" />
      </svg>
    );
  }

  const segments = slices.reduce((acc, s) => {
    const start = acc.length ? acc[acc.length - 1].end : -Math.PI / 2;
    const sweep = (s.value / total) * 2 * Math.PI;
    return [...acc, { ...s, start, end: start + sweep, sweep }];
  }, []);

  const paths = segments.map((s) => {
    if (s.sweep < 0.001) return null;
    const x1 = CX + R * Math.cos(s.start);
    const y1 = CY + R * Math.sin(s.start);
    const x2 = CX + R * Math.cos(s.end);
    const y2 = CY + R * Math.sin(s.end);
    const ix1 = CX + IR * Math.cos(s.start);
    const iy1 = CY + IR * Math.sin(s.start);
    const ix2 = CX + IR * Math.cos(s.end);
    const iy2 = CY + IR * Math.sin(s.end);
    const lg = s.sweep > Math.PI ? 1 : 0;
    const d = [
      `M${x1.toFixed(2)},${y1.toFixed(2)}`,
      `A${R},${R} 0 ${lg} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`,
      `L${ix2.toFixed(2)},${iy2.toFixed(2)}`,
      `A${IR},${IR} 0 ${lg} 0 ${ix1.toFixed(2)},${iy1.toFixed(2)}`,
      "Z"
    ].join(" ");
    return <path key={s.label} d={d} fill={s.color} stroke="white" strokeWidth="1.5" />;
  });

  return (
    <svg viewBox="0 0 120 120" width="120" height="120" style={{ flexShrink: 0 }}>
      {paths}
    </svg>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 60;
  const H = 22;
  const pts = data.map((v, i) =>
    `${((i / (data.length - 1)) * W).toFixed(1)},${(H - ((v - min) / range) * H).toFixed(1)}`
  ).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

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

  useEffect(() => {
    axiosCompany.get("/companies").then((res) => {
      const map = {};
      res.data.forEach((c) => { map[c.id] = c; });
      setCompanies(map);
    });
  }, []);

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
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshPrices();
    const iv = setInterval(refreshPrices, 1000);
    return () => clearInterval(iv);
  }, [refreshPrices]);

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

  useEffect(() => { fetchPortfolios(); }, [fetchPortfolios]);

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
      setNewName("");
      setShowNewInput(false);
      fetchPortfolios();
    } finally {
      setCreating(false);
    }
  };

  const totalInvested = holdings.reduce((s, h) => s + Number(h.averageBuyPrice || 0) * Number(h.quantityHeld || 0), 0);
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
    return !search || c?.name?.toLowerCase().includes(search.toLowerCase()) || c?.ticker?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="app-shell flex min-h-[calc(100vh-9rem)] items-center justify-center py-10">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading portfolios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell py-6">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-bold text-slate-900">Portfolios</span>
            {portfolios.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selected?.id === p.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.name}
              </button>
            ))}

            {showNewInput ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Portfolio name..."
                  className="w-40 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {creating ? "..." : "Save"}
                </button>
                <button
                  onClick={() => setShowNewInput(false)}
                  className="rounded-lg bg-slate-100 px-2 py-1.5 text-xs text-slate-500"
                >
                  X
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewInput(true)}
                className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
              >
                + New
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Markets
            </button>
          </div>
        </div>
      </div>

      {selected ? (
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-5 text-white shadow-lg shadow-emerald-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100">Current Value</p>
              <p className="mt-1 text-3xl font-black">{fmtCompact(totalCurrent)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                  {pnlUp ? "▲" : "▼"} {Math.abs(totalPnlPct).toFixed(2)}%
                </span>
                <span className="text-xs text-emerald-100">vs invested</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="panel p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Invested</p>
                <p className="metric-value mt-1 text-sm text-slate-900">{fmtCompact(totalInvested)}</p>
              </div>
              <div className="panel p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Total P&L</p>
                <p className={`metric-value mt-1 text-sm ${pnlUp ? "text-emerald-600" : "text-rose-600"}`}>
                  {pnlUp ? "+" : ""}{fmtCompact(totalPnl)}
                </p>
              </div>
            </div>

            <div className="panel flex items-center justify-between p-4">
              <span className="text-sm text-slate-500">Holdings</span>
              <span className="text-sm font-semibold text-slate-900">{holdings.length} stocks</span>
            </div>

            <div className="panel p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Allocation</p>
              {donutSlices.length > 0 ? (
                <div className="flex items-center gap-3">
                  <DonutSVG slices={donutSlices} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {donutSlices.map((s) => (
                      <div key={s.label} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                        <span className="truncate text-xs font-medium text-slate-600">{s.label}</span>
                        <span className="ml-auto text-[11px] text-slate-400">
                          {donutTotal > 0 ? ((s.value / donutTotal) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-slate-400">No holdings yet</p>
              )}
            </div>

            <div className={`rounded-xl border p-4 ${pnlUp ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
              <p className={`text-xs font-semibold ${pnlUp ? "text-emerald-700" : "text-rose-700"}`}>
                {pnlUp ? "Portfolio is up today" : "Portfolio is down today"}
              </p>
              <p className={`mt-1 text-sm font-bold ${pnlUp ? "text-emerald-700" : "text-rose-700"}`}>
                {pnlUp ? "+" : ""}{fmtCompact(totalPnl)} ({Math.abs(totalPnlPct).toFixed(2)}%)
              </p>
            </div>
          </aside>

          <section className="panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                {["stocks", "orders"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition ${
                      activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {activeTab === "stocks" && (
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-emerald-500 sm:w-44"
                />
              )}
            </div>

            <div className="max-h-[70vh] overflow-auto">
              {activeTab === "stocks" && (
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr>
                      {["Stock", "Qty", "Avg Cost", "LTP", "Trend", "Invested", "Current", "P&L"].map((col) => (
                        <th key={col} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHoldings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center text-sm text-slate-400">No holdings yet - buy some stocks!</td>
                      </tr>
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
                        <tr key={h.id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}20` }}>
                                <span className="text-[10px] font-extrabold" style={{ color }}>{(company?.ticker || "?").slice(0, 2)}</span>
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{company?.ticker || h.companyId}</p>
                                <p className="max-w-[120px] truncate text-[11px] text-slate-400">{company?.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="metric-value px-4 py-3 text-slate-600">{qty}</td>
                          <td className="metric-value px-4 py-3 text-slate-500">₹{fmt(avg)}</td>
                          <td className="metric-value px-4 py-3 text-slate-900">₹{fmt(ltp)}</td>
                          <td className="px-4 py-3"><Sparkline data={hist} color={up ? "#10b981" : "#ef4444"} /></td>
                          <td className="metric-value px-4 py-3 text-slate-500">₹{fmt(invested)}</td>
                          <td className="metric-value px-4 py-3 text-slate-900">₹{fmt(current)}</td>
                          <td className="px-4 py-3">
                            <p className={`metric-value text-sm ${up ? "text-emerald-600" : "text-rose-600"}`}>
                              {up ? "+" : ""}₹{fmt(pnl)}
                            </p>
                            <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                              {up ? "▲" : "▼"} {Math.abs(pnlPct).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {activeTab === "orders" && (
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr>
                      {["ID", "Stock", "Type", "Qty", "Price", "Total", "Status", "Time"].map((col) => (
                        <th key={col} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center text-sm text-slate-400">No order history</td>
                      </tr>
                    ) : orders.map((o) => {
                      const company = companies[o.companyId];
                      const isBuy = o.orderType === "BUY";
                      const ok = o.status === "EXECUTED" || o.status === "COMPLETED";
                      return (
                        <tr key={o.id} className="transition hover:bg-slate-50">
                          <td className="metric-value px-4 py-3 text-slate-400">#{o.id}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{company?.ticker || o.companyId}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isBuy ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                              {o.orderType}
                            </span>
                          </td>
                          <td className="metric-value px-4 py-3 text-slate-600">{o.quantity}</td>
                          <td className="metric-value px-4 py-3 text-slate-500">₹{fmt(o.priceAtOrder)}</td>
                          <td className="metric-value px-4 py-3 text-slate-900">₹{fmt(o.totalValue)}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                            {o.timestamp ? new Date(o.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="panel flex min-h-[420px] flex-col items-center justify-center gap-3 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">📂</div>
          <p className="text-lg font-bold text-slate-900">No portfolio yet</p>
          <p className="text-sm text-slate-500">Create one to start tracking your investments</p>
          <button
            onClick={() => setShowNewInput(true)}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            + Create Portfolio
          </button>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;

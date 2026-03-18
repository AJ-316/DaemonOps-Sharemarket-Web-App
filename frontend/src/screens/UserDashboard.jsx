import React, { useEffect, useState, useCallback } from "react";
import axiosCompany from "../api/axiosCompany";
import axiosExchange from "../api/axiosExchange";
import axiosPortfolio from "../api/axiosPortfolio";

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function BuySellModal({ stock, company, onClose }) {
  const [mode, setMode] = useState("BUY");
  const [step, setStep] = useState("portfolio");
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [showNewPortfolioInput, setShowNewPortfolioInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderResponse, setOrderResponse] = useState(null);
  const [error, setError] = useState("");

  const price = Number(stock.currentPrice);
  const total = (price * quantity).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  useEffect(() => {
    axiosPortfolio
      .get("/portfolio")
      .then((res) => setPortfolios(res.data || []))
      .catch(() => setPortfolios([]));
  }, []);

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;
    setLoading(true);
    setError("");
    const nameToCreate = newPortfolioName.trim();
    try {
      await axiosPortfolio.post("/portfolio", { name: nameToCreate });
      const updated = await axiosPortfolio.get("/portfolio");
      const list = updated.data || [];
      setPortfolios(list);
      setNewPortfolioName("");
      setShowNewPortfolioInput(false);
      const created = list.find((p) => p.name === nameToCreate);
      if (created) setSelectedPortfolio(created);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data ||
        e?.message ||
        "Failed to create portfolio. Check that the portfolio service is running and X-User-Id is set.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedPortfolio) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosPortfolio.post("/orders", {
        companyId: stock.companyId,
        portfolioId: selectedPortfolio.id,
        orderType: mode,
        quantity: Number(quantity),
      });
      setOrderResponse(res.data);
      setStep("receipt");
    } catch (e) {
      setError(e?.response?.data?.message || "Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "portfolio") {
    return (
      <Modal onClose={onClose}>
        <div className="mb-5 flex gap-2 rounded-xl bg-slate-100 p-1">
          {["BUY", "SELL"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mode === m
                  ? m === "BUY"
                    ? "bg-emerald-600 text-white"
                    : "bg-rose-500 text-white"
                  : "text-slate-500"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <h2 className="mb-1 text-lg font-bold text-slate-900">
          {company?.name || "Stock"}
          <span className="ml-2 rounded bg-emerald-50 px-2 py-0.5 text-xs font-mono text-emerald-700">
            {company?.ticker}
          </span>
        </h2>
        <p className="mb-5 text-sm text-slate-500">
          Current Price:{" "}
          <span className="font-semibold text-slate-900">
            ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </p>

        <div className="mb-5">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg font-bold text-slate-700 transition hover:bg-slate-200"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 rounded-lg border border-slate-200 py-2 text-center text-sm font-semibold outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg font-bold text-slate-700 transition hover:bg-slate-200"
            >
              +
            </button>
            <span className="ml-auto text-sm text-slate-500">
              Total <span className="font-semibold text-slate-900">₹{total}</span>
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            {mode === "BUY" ? "Add to Portfolio" : "Sell from Portfolio"}
          </label>
          <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
            {portfolios.length === 0 && !showNewPortfolioInput && (
              <p className="text-xs italic text-slate-400">No portfolios yet.</p>
            )}
            {portfolios.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPortfolio(p)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selectedPortfolio?.id === p.id
                    ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-800"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {showNewPortfolioInput ? (
            <div className="mt-2 flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Portfolio name..."
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePortfolio()}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleCreatePortfolio}
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setShowNewPortfolioInput(false)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewPortfolioInput(true)}
              className="mt-2 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              + Create new portfolio
            </button>
          )}
        </div>

        {error && <p className="mb-3 text-xs text-rose-600">{error}</p>}

        <button
          disabled={!selectedPortfolio || loading}
          onClick={() => setStep("confirm")}
          className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition ${
            mode === "BUY"
              ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200"
              : "bg-rose-500 hover:bg-rose-600 disabled:bg-rose-200"
          } disabled:cursor-not-allowed`}
        >
          Continue to {mode === "BUY" ? "Buy" : "Sell"}
        </button>
      </Modal>
    );
  }

  if (step === "confirm") {
    return (
      <Modal onClose={onClose}>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Confirm {mode === "BUY" ? "Purchase" : "Sale"}</h2>
        <p className="mb-5 text-xs text-slate-400">Review your order before placing</p>

        <div className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <Row label="Stock" value={`${company?.name} (${company?.ticker})`} />
          <Row label="Order Type" value={mode} />
          <Row label="Portfolio" value={selectedPortfolio?.name} />
          <Row label="Quantity" value={quantity} />
          <Row label="Price per Share" value={`₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
          <div className="border-t border-slate-200 pt-3">
            <Row label="Total Amount" value={`₹${total}`} bold color={mode === "BUY" ? "text-emerald-700" : "text-rose-600"} />
          </div>
        </div>

        {error && <p className="mb-3 text-xs text-rose-600">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => setStep("portfolio")}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Back
          </button>
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50 ${
              mode === "BUY" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            {loading ? "Placing..." : `Confirm ${mode === "BUY" ? "Buy" : "Sell"}`}
          </button>
        </div>
      </Modal>
    );
  }

  if (step === "receipt") {
    const isSuccess = orderResponse?.status === "EXECUTED" || orderResponse?.status === "COMPLETED";
    return (
      <Modal onClose={onClose}>
        <div className="mb-5 text-center">
          <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${isSuccess ? "bg-emerald-100" : "bg-rose-100"}`}>
            <span className="text-2xl">{isSuccess ? "✓" : "✕"}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">{isSuccess ? "Order Placed!" : "Order Rejected"}</h2>
          {!isSuccess && orderResponse?.rejectionReason && <p className="mt-1 text-xs text-rose-600">{orderResponse.rejectionReason}</p>}
        </div>

        <div className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <Row label="Order ID" value={`#${orderResponse?.orderId}`} />
          <Row label="Stock" value={`${company?.name} (${company?.ticker})`} />
          <Row label="Type" value={orderResponse?.orderType} />
          <Row label="Quantity" value={orderResponse?.quantity} />
          <Row label="Price per Share" value={`₹${Number(orderResponse?.priceAtOrder).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
          <div className="border-t border-slate-200 pt-3">
            <Row label="Total Value" value={`₹${Number(orderResponse?.totalValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} bold color={mode === "BUY" ? "text-emerald-700" : "text-rose-600"} />
          </div>
          <Row label="Status" value={orderResponse?.status} color={isSuccess ? "text-emerald-600" : "text-rose-600"} />
        </div>

        <button onClick={onClose} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
          Done
        </button>
      </Modal>
    );
  }

  return null;
}

function Row({ label, value, bold, color }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={`${bold ? "text-base font-bold" : "font-medium"} ${color || "text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

const UserDashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    axiosCompany.get("/companies").then((res) => {
      const map = {};
      res.data.forEach((c) => { map[c.id] = c; });
      setCompanies(map);
    });
  }, []);

  const fetchPrices = useCallback(() => {
    axiosExchange
      .get("/stocks")
      .then((res) => {
        const sorted = res.data.sort((a, b) => a.companyId - b.companyId);
        setStocks(sorted);
        setLastUpdate(new Date().toLocaleTimeString());
        setLoading(false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 1000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const getPct = (current, open) => {
    if (!open) return "0.00";
    return (((current - open) / open) * 100).toFixed(2);
  };

  const filtered = stocks.filter((s) => {
    const c = companies[s.companyId];
    if (!c) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) || c.ticker.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="app-shell py-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Live Markets</h1>
          {lastUpdate && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Updated {lastUpdate}
            </p>
          )}
        </div>
        <input
          type="text"
          placeholder="Search by company or ticker"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 md:w-72"
        />
      </div>

      {loading ? (
        <div className="panel py-20 text-center text-sm text-slate-400">Loading prices...</div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  {["Ticker", "Company", "Price", "Open", "High", "Low", "Change", "Actions"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const company = companies[s.companyId];
                  const pct = getPct(s.currentPrice, s.openPriceToday);
                  const isUp = parseFloat(pct) >= 0;

                  return (
                    <tr key={s.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 font-mono text-xs font-semibold text-emerald-700">
                          {company?.ticker || s.companyId}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{company?.name || "-"}</td>
                      <td className="metric-value px-4 py-3 text-slate-900">
                        ₹{Number(s.currentPrice).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="metric-value px-4 py-3 text-slate-500">₹{Number(s.openPriceToday).toFixed(2)}</td>
                      <td className="metric-value px-4 py-3 text-emerald-600">₹{Number(s.highToday).toFixed(2)}</td>
                      <td className="metric-value px-4 py-3 text-rose-600">₹{Number(s.lowToday).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {isUp ? "▲" : "▼"} {Math.abs(pct)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActiveModal({ stock: s, company, defaultMode: "BUY" })}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          >
                            Buy
                          </button>
                          <button
                            onClick={() => setActiveModal({ stock: s, company, defaultMode: "SELL" })}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeModal && (
        <BuySellModal
          stock={activeModal.stock}
          company={activeModal.company}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default UserDashboard;


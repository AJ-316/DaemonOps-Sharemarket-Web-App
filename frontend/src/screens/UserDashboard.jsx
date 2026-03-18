import React, { useEffect, useState, useCallback } from "react";
import axiosCompany from "../api/axiosCompany";
import axiosExchange from "../api/axiosExchange";
import axiosPortfolio from "../api/axiosPortfolio"; // you'll need this axios instance

// ── Mini Modal Shell ──────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// ── BuySell Modal ─────────────────────────────────────────────────────────────
function BuySellModal({ stock, company, onClose }) {
  const [mode, setMode] = useState("BUY"); // "BUY" | "SELL"
  const [step, setStep] = useState("portfolio"); // "portfolio" | "confirm" | "receipt"
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

  // Fetch portfolios on open
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
    const nameToCreate = newPortfolioName.trim(); // capture before clearing
    try {
      await axiosPortfolio.post("/portfolio", { name: nameToCreate });
      // Refresh portfolio list
      const updated = await axiosPortfolio.get("/portfolio");
      const list = updated.data || [];
      setPortfolios(list);
      setNewPortfolioName("");
      setShowNewPortfolioInput(false);
      // Select the newly created portfolio
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

  // ── STEP: Portfolio Selection ──
  if (step === "portfolio") {
    return (
      <Modal onClose={onClose}>
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-5">
          {["BUY", "SELL"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
                mode === m
                  ? m === "BUY"
                    ? "bg-emerald-600 text-white shadow"
                    : "bg-red-500 text-white shadow"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {company?.name || "Stock"}
          <span className="ml-2 text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
            {company?.ticker}
          </span>
        </h2>
        <p className="text-gray-500 text-sm mb-5">
          Current Price:{" "}
          <span className="font-semibold text-gray-900">
            ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </p>

        {/* Quantity */}
        <div className="mb-5">
          <label className="block text-xs text-gray-500 font-medium mb-1">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 font-bold text-lg hover:bg-gray-200"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 text-center border border-gray-200 rounded-lg py-2 text-sm font-semibold focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 font-bold text-lg hover:bg-gray-200"
            >
              +
            </button>
            <span className="text-sm text-gray-500 ml-auto">
              ≈ <span className="font-semibold text-gray-900">₹{total}</span>
            </span>
          </div>
        </div>

        {/* Portfolio Selection */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 font-medium mb-2">
            {mode === "BUY" ? "Add to Portfolio" : "Sell from Portfolio"}
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {portfolios.length === 0 && !showNewPortfolioInput && (
              <p className="text-xs text-gray-400 italic">No portfolios yet.</p>
            )}
            {portfolios.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPortfolio(p)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                  selectedPortfolio?.id === p.id
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold"
                    : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* New Portfolio */}
          {showNewPortfolioInput ? (
            <div className="flex gap-2 mt-2">
              <input
                autoFocus
                type="text"
                placeholder="Portfolio name..."
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePortfolio()}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              />
              <button
                onClick={handleCreatePortfolio}
                disabled={loading}
                className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setShowNewPortfolioInput(false)}
                className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewPortfolioInput(true)}
              className="mt-2 text-xs text-emerald-600 hover:underline font-medium"
            >
              + Create new portfolio
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <button
          disabled={!selectedPortfolio || loading}
          onClick={() => setStep("confirm")}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition ${
            mode === "BUY"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-200"
              : "bg-red-500 hover:bg-red-600 text-white disabled:bg-red-200"
          } disabled:cursor-not-allowed`}
        >
          Continue to {mode === "BUY" ? "Buy" : "Sell"}
        </button>
      </Modal>
    );
  }

  // ── STEP: Confirm ──
  if (step === "confirm") {
    return (
      <Modal onClose={onClose}>
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Confirm {mode === "BUY" ? "Purchase" : "Sale"}
        </h2>
        <p className="text-xs text-gray-400 mb-5">Review your order before placing</p>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-5 text-sm">
          <Row label="Stock" value={`${company?.name} (${company?.ticker})`} />
          <Row label="Order Type" value={mode} />
          <Row label="Portfolio" value={selectedPortfolio?.name} />
          <Row label="Quantity" value={quantity} />
          <Row label="Price per Share" value={`₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
          <div className="border-t border-gray-200 pt-3">
            <Row
              label="Total Amount"
              value={`₹${total}`}
              bold
              color={mode === "BUY" ? "text-emerald-700" : "text-red-600"}
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => setStep("portfolio")}
            className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            ← Back
          </button>
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 ${
              mode === "BUY" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {loading ? "Placing..." : `Confirm ${mode === "BUY" ? "Buy" : "Sell"}`}
          </button>
        </div>
      </Modal>
    );
  }

  // ── STEP: Receipt ──
  if (step === "receipt") {
    const isSuccess = orderResponse?.status === "EXECUTED" || orderResponse?.status === "COMPLETED";
    return (
      <Modal onClose={onClose}>
        <div className="text-center mb-5">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isSuccess ? "bg-emerald-100" : "bg-red-100"
            }`}
          >
            <span className="text-2xl">{isSuccess ? "✓" : "✕"}</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {isSuccess ? "Order Placed!" : "Order Rejected"}
          </h2>
          {!isSuccess && orderResponse?.rejectionReason && (
            <p className="text-xs text-red-500 mt-1">{orderResponse.rejectionReason}</p>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm mb-5">
          <Row label="Order ID" value={`#${orderResponse?.orderId}`} />
          <Row label="Stock" value={`${company?.name} (${company?.ticker})`} />
          <Row label="Type" value={orderResponse?.orderType} />
          <Row label="Quantity" value={orderResponse?.quantity} />
          <Row
            label="Price per Share"
            value={`₹${Number(orderResponse?.priceAtOrder).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}`}
          />
          <div className="border-t border-gray-200 pt-3">
            <Row
              label="Total Value"
              value={`₹${Number(orderResponse?.totalValue).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}`}
              bold
              color={mode === "BUY" ? "text-emerald-700" : "text-red-600"}
            />
          </div>
          <Row
            label="Status"
            value={orderResponse?.status}
            color={isSuccess ? "text-emerald-600" : "text-red-500"}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800"
        >
          Done
        </button>
      </Modal>
    );
  }

  return null;
}

function Row({ label, value, bold, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={`${bold ? "font-bold text-base" : "font-medium"} ${color || "text-gray-900"}`}>
        {value}
      </span>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const UserDashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState(null); // { stock, company }

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
      .catch(() => {}); // silent — 401 means exchange service requires auth header
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
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.ticker.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Markets</h1>
          {lastUpdate && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Updated {lastUpdate}
            </p>
          )}
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 outline-none w-56"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading prices...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Ticker", "Company", "Price", "Open", "High", "Low", "Change", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => {
                const company = companies[s.companyId];
                const pct = getPct(s.currentPrice, s.openPriceToday);
                const isUp = parseFloat(pct) >= 0;

                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                        {company?.ticker || s.companyId}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {company?.name || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold font-mono text-gray-900">
                      ₹{Number(s.currentPrice).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono">
                      ₹{Number(s.openPriceToday).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-emerald-600 font-mono">
                      ₹{Number(s.highToday).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-red-500 font-mono">
                      ₹{Number(s.lowToday).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                          isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {isUp ? "▲" : "▼"} {Math.abs(pct)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveModal({ stock: s, company, defaultMode: "BUY" })}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => setActiveModal({ stock: s, company, defaultMode: "SELL" })}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition"
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
import React, { useEffect, useState, useCallback } from "react";
import axiosCompany from "../api/axiosCompany";
import axiosExchange from "../api/axiosExchange";

const UserDashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axiosCompany.get("/companies").then((res) => {
      const map = {};
      res.data.forEach((c) => { map[c.id] = c; });
      setCompanies(map);
    });
  }, []);

  const fetchPrices = useCallback(() => {
    axiosExchange.get("/stocks")
      .then((res) => {
        const sorted = res.data.sort((a, b) => a.companyId - b.companyId);
        setStocks(sorted);
        setLastUpdate(new Date().toLocaleTimeString());
        setLoading(false);
      })
      .catch(console.error);
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
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm
                     focus:border-emerald-500 outline-none w-56"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading prices...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Ticker", "Company", "Price", "Open", "High", "Low", "Change"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold
                                         text-gray-500 uppercase tracking-wider">
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
                      <span className="font-mono font-semibold text-emerald-700
                                       bg-emerald-50 px-2 py-0.5 rounded text-xs">
                        {company?.ticker || s.companyId}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {company?.name || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold font-mono text-gray-900">
                      ₹{Number(s.currentPrice).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
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
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold
                                        px-2 py-1 rounded-full ${isUp
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                        }`}>
                        {isUp ? "▲" : "▼"} {Math.abs(pct)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as LightweightCharts from "../lib/lightweight-charts.mjs";
import axiosExchange from "../api/axiosExchange";
import axiosCompany from "../api/axiosCompany";
import axiosPortfolio from "../api/axiosPortfolio";

const T = {
    bg: "#0A0A0A",
    surface: "#161616",
    surface2: "#1C1C1C",
    border: "#2A2A2A",
    gold: "#F59E0B",
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

// ── Mini Buy Modal ──────────────────────────────────────────────────────────────
// ── Dedicated Limit Order Modal ───────────────────────────────────────────
function LimitOrderModal({ company, stockPrice, initialPrice, onClose }) {
    const [portfolios, setPortfolios] = useState([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState(null);
    const [limitPrice, setLimitPrice] = useState(Number(initialPrice || 0).toFixed(2));
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [walletBalance, setWalletBalance] = useState(null);

    useEffect(() => {
        axiosPortfolio.get("/wallet").then(r => {
            const bal = Number(r.data.balance);
            console.log("Wallet Balance Loaded:", bal);
            setWalletBalance(bal);
        }).catch(e => console.error("Wallet fetch error:", e));

        axiosPortfolio.get("/portfolio").then(r => {
            const list = r.data || [];
            console.log("Portfolios Loaded:", list);
            setPortfolios(list);
            if (list.length > 0) setSelectedPortfolio(list[0]);
        }).catch(e => console.error("Portfolio fetch error:", e));
    }, []);

    const total = Number(limitPrice) * quantity;

    const handleConfirm = async () => {
        if (!selectedPortfolio) { setError("Select a portfolio"); return; }
        setLoading(true); setError("");
        try {
            const res = await axiosExchange.post("/orders", {
                companyId: company.id,
                portfolioId: selectedPortfolio.id,
                orderType: "BUY",
                priceType: "LIMIT",
                limitPrice: Number(limitPrice),
                quantity,
            });
            setResult(res.data);
        } catch (e) {
            setError(e.response?.data?.message || "Order failed");
        } finally { setLoading(false); }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 300,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)"
        }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: T.surface, borderRadius: 24, width: 420, padding: "36px 28px 28px",
                position: "relative", border: `1px solid ${T.border}`,
                boxShadow: "0 32px 64px rgba(0,0,0,0.7)"
            }}>
                <button onClick={onClose} style={{
                    position: "absolute", top: 16, right: 16, width: 32, height: 32,
                    borderRadius: "50%", border: `1px solid ${T.border}`, background: T.surface2,
                    color: T.textMute, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center"
                }}>✕</button>

                <h2 style={{ margin: "0 0 4px", color: T.text, fontSize: 18, fontWeight: 800 }}>Limit Buy {company?.name}</h2>
                <p style={{ margin: "0 0 24px", color: T.textDim, fontSize: 13 }}>
                    Market price: ₹{Number(stockPrice?.currentPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    {walletBalance !== null && <> · Wallet: ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</>}
                </p>

                {result ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{result.status === "PENDING" ? "⏳" : "❌"}</div>
                        <p style={{ color: result.status === "PENDING" ? T.gold : T.red, fontWeight: 700 }}>{result.status}</p>
                        <p style={{ color: T.textDim, fontSize: 13, margin: "8px 0 16px" }}>Limit order placed at ₹{Number(limitPrice).toLocaleString("en-IN")}</p>
                        <button onClick={onClose} style={{ padding: "10px 32px", borderRadius: 12, border: "none", background: T.gold, color: "#000", fontWeight: 700, cursor: "pointer" }}>Done</button>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>Target Price (₹)</label>
                            <input
                                type="number" step="0.05"
                                value={limitPrice}
                                onChange={e => setLimitPrice(e.target.value)}
                                style={{
                                    width: "100%", padding: "14px", borderRadius: 12, border: `1px solid ${T.border}`,
                                    background: T.surface2, color: T.text, fontSize: 18, fontWeight: 700, outline: "none"
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>Portfolio</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                {portfolios.map((p, idx) => (
                                    <button
                                        key={p.id || idx}
                                        onClick={() => setSelectedPortfolio(p)}
                                        style={{
                                            padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                                            cursor: "pointer",
                                            border: `1px solid ${selectedPortfolio?.id === p.id ? T.gold : T.border}`,
                                            background: selectedPortfolio?.id === p.id ? T.goldGlow : T.surface2,
                                            color: selectedPortfolio?.id === p.id ? T.gold : T.textSub,
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>Quantity</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, fontSize: 20, cursor: "pointer" }}>-</button>
                                    <span style={{ fontSize: 24, fontWeight: 800, color: T.text, minWidth: 40, textAlign: "center" }}>{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, fontSize: 20, cursor: "pointer" }}>+</button>
                                </div>
                                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: "uppercase" }}>Estimated Total</p>
                                    <span style={{ fontSize: 20, fontWeight: 800, color: T.gold }}>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {error && <p style={{ color: T.red, fontSize: 13, marginBottom: 16 }}>{error}</p>}

                        <button onClick={handleConfirm} disabled={loading || !selectedPortfolio} style={{
                            width: "100%", padding: "16px", borderRadius: 16, border: "none",
                            background: loading || !selectedPortfolio ? T.border : `linear-gradient(135deg, ${T.gold}, #D97706)`,
                            color: "#000", fontSize: 16, fontWeight: 800, cursor: loading || !selectedPortfolio ? "not-allowed" : "pointer",
                            boxShadow: "0 8px 16px rgba(0,0,0,0.3)"
                        }}>
                            {loading ? "Placing Order..." : "Confirm Limit Buy"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Standard Buy Modal (Market) ──────────────────────────────────────────────────
function BuyModal({ stockPrice, company, onClose }) {
    const [portfolios, setPortfolios] = useState([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [walletBalance, setWalletBalance] = useState(null);

    useEffect(() => {
        axiosPortfolio.get("/wallet").then(r => setWalletBalance(Number(r.data.balance))).catch(e => console.error("Wallet fetch error:", e));
        axiosPortfolio.get("/portfolio").then(r => {
            const list = r.data || [];
            setPortfolios(list);
            if (list.length > 0) setSelectedPortfolio(list[0]);
        }).catch(e => console.error("Portfolio fetch error:", e));
    }, []);

    const price = Number(stockPrice?.currentPrice || 0);
    const total = price * quantity;

    const handleBuy = async () => {
        if (!selectedPortfolio) { setError("Select a portfolio"); return; }
        setLoading(true); setError("");
        try {
            const res = await axiosExchange.post("/orders", {
                companyId: stockPrice.companyId,
                portfolioId: selectedPortfolio.id,
                orderType: "BUY",
                priceType: "MARKET",
                quantity,
            });
            setResult(res.data);
        } catch (e) {
            setError(e.response?.data?.message || "Order failed");
        } finally { setLoading(false); }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 300,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)"
        }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: T.surface, borderRadius: 24, width: 400, padding: "36px 28px 28px",
                position: "relative", border: `1px solid ${T.border}`,
                boxShadow: "0 32px 64px rgba(0,0,0,0.7)"
            }}>
                <button onClick={onClose} style={{
                    position: "absolute", top: 16, right: 16, width: 32, height: 32,
                    borderRadius: "50%", border: `1px solid ${T.border}`, background: T.surface2,
                    color: T.textMute, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center"
                }}>✕</button>
                <h2 style={{ margin: "0 0 4px", color: T.text, fontSize: 18, fontWeight: 800 }}>Buy {company?.name}</h2>
                <p style={{ margin: "0 0 24px", color: T.textDim, fontSize: 13 }}>
                    ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })} per share
                    {walletBalance !== null && <> · Wallet: ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</>}
                </p>

                {result ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{result.status === "EXECUTED" ? "✅" : "❌"}</div>
                        <p style={{ color: result.status === "EXECUTED" ? T.green : T.red, fontWeight: 700 }}>{result.status}</p>
                        <button onClick={onClose} style={{ marginTop: 16, padding: "10px 32px", borderRadius: 12, border: "none", background: T.gold, color: "#000", fontWeight: 700, cursor: "pointer" }}>Done</button>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>Portfolio</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                {portfolios.map((p, idx) => (
                                    <button key={p.id || idx} onClick={() => setSelectedPortfolio(p)} style={{
                                        padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                                        cursor: "pointer",
                                        border: `1px solid ${selectedPortfolio?.id === p.id ? T.gold : T.border}`,
                                        background: selectedPortfolio?.id === p.id ? T.goldGlow : T.surface2,
                                        color: selectedPortfolio?.id === p.id ? T.gold : T.textSub,
                                    }}>{p.name}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>Quantity</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, fontSize: 20, cursor: "pointer" }}>-</button>
                                    <span style={{ fontSize: 24, fontWeight: 800, color: T.text, minWidth: 40, textAlign: "center" }}>{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface2, color: T.text, fontSize: 20, cursor: "pointer" }}>+</button>
                                </div>
                                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.textDim, textTransform: "uppercase" }}>Total</p>
                                    <span style={{ fontSize: 20, fontWeight: 800, color: T.gold }}>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                        {error && <p style={{ color: T.red, fontSize: 13, marginBottom: 16 }}>{error}</p>}
                        <button onClick={handleBuy} disabled={loading || !selectedPortfolio} style={{
                            width: "100%", padding: "16px", borderRadius: 16, border: "none",
                            background: loading || !selectedPortfolio ? T.border : `linear-gradient(135deg, ${T.gold}, #D97706)`,
                            color: "#000", fontSize: 16, fontWeight: 800, cursor: loading || !selectedPortfolio ? "not-allowed" : "pointer"
                        }}>{loading ? "Processing..." : "Confirm Market Buy"}</button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Main Company Detail Page ────────────────────────────────────────────────────
export default function CompanyDetailPage() {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);

    const [company, setCompany] = useState(null);
    const [stockPrice, setStockPrice] = useState(null);
    const [holdings, setHoldings] = useState(null);
    const [showBuy, setShowBuy] = useState(false);
    const [showLimit, setShowLimit] = useState(false);
    const [limitInitialPrice, setLimitInitialPrice] = useState(0);
    const [pendingOrders, setPendingOrders] = useState([]);

    // ── Load company info
    const fetchHoldingsAndPending = useCallback(() => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        axiosPortfolio.get(`/portfolio/holdings/${userId}`).then(r => {
            const myHolding = r.data.find(h => h.companyId == companyId);
            setHoldings(myHolding);
        }).catch(() => { });

        axiosExchange.get(`/pending-orders?companyId=${companyId}`).then(r => {
            setPendingOrders(r.data || []);
        }).catch(() => { });
    }, [companyId]);

    useEffect(() => {
        axiosCompany.get(`/companies/${companyId}`).then(r => setCompany(r.data)).catch(() => { });
        axiosExchange.get(`/stocks/${companyId}`).then(r => setStockPrice(r.data)).catch(() => { });

        fetchHoldingsAndPending();
    }, [companyId, fetchHoldingsAndPending]);

    // ── Create chart
    useEffect(() => {
        if (!chartContainerRef.current) return;
        const chart = LightweightCharts.createChart(chartContainerRef.current, {
            layout: { background: { color: T.bg }, textColor: T.textDim },
            grid: { vertLines: { color: "#1A1A1A" }, horzLines: { color: "#1A1A1A" } },
            crosshair: { mode: 1 },
            rightPriceScale: {
                borderColor: T.border,
                autoScale: true,
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderColor: T.border,
                timeVisible: true,
                secondsVisible: true,
                rightOffset: 15,
                barSpacing: 12, // Increased spacing
                minBarSpacing: 4,
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
        });
        console.log("Chart object created:", chart);
        let series;
        const openPrice = Number(stockPrice?.openPriceToday || 0);
        // Use Baseline series for a modern "Line" look that changes color relative to Open price
        series = chart.addBaselineSeries({
            baseValue: { price: openPrice, type: 'price' },
            topLineColor: '#22C55E', // Vivid Green
            topFillColor1: 'rgba(34, 197, 94, 0.4)',
            topFillColor2: 'rgba(34, 197, 94, 0.05)',
            bottomLineColor: '#EF4444', // Vivid Red
            bottomFillColor1: 'rgba(239, 68, 68, 0.05)',
            bottomFillColor2: 'rgba(239, 68, 68, 0.4)',
            lineWidth: 2,
            priceLineVisible: true,
            priceLineStyle: 2,
        });

        // Add a permanent "Open Price" line for reference
        if (openPrice > 0) {
            series.createPriceLine({
                price: openPrice,
                color: '#6B7280', // Gray
                lineWidth: 1,
                lineStyle: 3, // Dotted
                axisLabelVisible: true,
                title: 'OPEN',
            });
        }

        chartRef.current = chart;
        seriesRef.current = series;

        const ro = new ResizeObserver(() => {
            if (chartContainerRef.current && chartRef.current) {
                chart.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
            }
        });
        ro.observe(chartContainerRef.current);

        // ── Handle Chart Click to open Limit Order
        chart.subscribeClick((param) => {
            if (!param.point || !param.seriesData || !seriesRef.current || !chartRef.current) return;
            const price = seriesRef.current.coordinateToPrice(param.point.y);
            if (price) {
                setLimitInitialPrice(price);
                setShowLimit(true);
            }
        });

        return () => {
            ro.disconnect();
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, []);

    // ── Update Entry Price line when holdings change
    useEffect(() => {
        if (!seriesRef.current || !chartRef.current || !holdings) return;
        const entryPrice = Number(holdings.averageBuyPrice);
        const currentPrice = Number(stockPrice?.currentPrice || 0);
        const isProfit = currentPrice >= entryPrice;

        const priceLine = seriesRef.current.createPriceLine({
            price: entryPrice,
            color: isProfit ? T.green : T.red,
            lineWidth: 2,
            lineStyle: 1, // Solid
            axisLabelVisible: true,
            title: 'Entry Price',
        });

        return () => { try { seriesRef.current?.removePriceLine(priceLine); } catch (e) { } };
    }, [holdings, stockPrice?.currentPrice]);

    // ── Update Pending Order lines
    useEffect(() => {
        if (!seriesRef.current || !chartRef.current || !pendingOrders) return;

        const lines = pendingOrders.map(p => {
            const isBuy = p.type === "LIMIT_BUY";
            return seriesRef.current.createPriceLine({
                price: Number(p.triggerPrice),
                color: isBuy ? T.gold : T.red,
                lineWidth: 1.5,
                lineStyle: 2, // Dashed
                axisLabelVisible: true,
                title: isBuy ? 'Limit Buy' : 'Stop Loss',
            });
        });

        return () => {
            lines.forEach(l => {
                try { seriesRef.current?.removePriceLine(l); } catch (e) { }
            });
        };
    }, [pendingOrders]);

    // ── Poll candles every 1s and append live to chart
    const fetchCandles = useCallback(() => {
        if (!seriesRef.current || !chartRef.current) return;

        axiosExchange.get(`/stocks/candles/${companyId}`).then(r => {
            const candles = r.data;
            if (!candles || candles.length === 0 || !seriesRef.current || !chartRef.current) return;

            // For Baseline/Line series, we just need { time, value }
            seriesRef.current.setData(candles.map(c => ({
                time: c.time,
                value: c.close,
            })));

            // Update baseline IF it differs significantly or was 0
            const currentBase = seriesRef.current.options().baseValue.price;
            const newBase = Number(stockPrice?.openPriceToday || 0);
            if (newBase > 0 && Math.abs(currentBase - newBase) > 0.01) {
                seriesRef.current.applyOptions({
                    baseValue: { price: newBase, type: 'price' }
                });
            }

            chartRef.current?.timeScale().scrollToRealTime();
        }).catch(() => { });
        // Also refresh live price
        axiosExchange.get(`/stocks/${companyId}`).then(r => setStockPrice(r.data)).catch(() => { });

        // Also refresh holdings and pending orders
        fetchHoldingsAndPending();
    }, [companyId, fetchHoldingsAndPending, stockPrice?.openPriceToday]);

    useEffect(() => {
        fetchCandles();
        const iv = setInterval(fetchCandles, 1000);
        return () => clearInterval(iv);
    }, [fetchCandles]);

    const price = Number(stockPrice?.currentPrice || 0);
    const open = Number(stockPrice?.openPriceToday || 0);
    const high = Number(stockPrice?.highToday || 0);
    const low = Number(stockPrice?.lowToday || 0);
    const pct = open > 0 ? ((price - open) / open) * 100 : 0;
    const isUp = pct >= 0;

    return (
        <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column" }}>
            {/* Top bar */}
            <div style={{
                display: "flex", alignItems: "center", gap: 16, padding: "14px 24px",
                background: T.surface, borderBottom: `1px solid ${T.border}`,
                boxShadow: "0 1px 0 rgba(245,158,11,0.06)"
            }}>
                <button onClick={() => navigate(-1)} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`,
                    background: T.surface2, color: T.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer"
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    Back
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>{company?.name || "Loading…"}</h1>
                    <span style={{ fontSize: 12, color: T.textDim }}>{company?.ticker} · NSE · {company?.sector}</span>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: T.text, fontVariantNumeric: "tabular-nums" }}>
                        ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: isUp ? T.green : T.red,
                    }}>
                        {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Body — Chart left, Info right */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                {/* Chart — 70% */}
                <div style={{ flex: "0 0 70%", padding: "16px", display: "flex", flexDirection: "column" }}>
                    <div style={{ flex: 1, borderRadius: 14, overflow: "hidden", border: `1px solid ${T.border}` }}>
                        <div ref={chartContainerRef} style={{ width: "100%", height: "calc(100vh - 130px)" }} />
                    </div>
                </div>

                {/* Info panel — 30% */}
                <div style={{
                    flex: "0 0 30%", padding: "16px 24px 16px 0",
                    display: "flex", flexDirection: "column", gap: 16
                }}>
                    {/* Stats card */}
                    <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
                        <h3 style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: "0.08em", textTransform: "uppercase" }}>Today's Range</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[
                                { label: "Open", value: `₹${open.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
                                { label: "High", value: `₹${high.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: T.green },
                                { label: "Low", value: `₹${low.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: T.red },
                                { label: "LTP", value: `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, bold: true },
                            ].map(({ label, value, color, bold }) => (
                                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: T.textDim, fontSize: 13 }}>{label}</span>
                                    <span style={{ color: color || T.text, fontWeight: bold ? 800 : 600, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Company info */}
                    <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
                        <h3 style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: "0.08em", textTransform: "uppercase" }}>About</h3>
                        {company ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {[
                                    { label: "Name", value: company.name },
                                    { label: "Ticker", value: company.ticker },
                                    { label: "Sector", value: company.sector },
                                    { label: "CIN", value: company.cin },
                                    { label: "Shares Issued", value: Number(company.sharesIssued || 0).toLocaleString("en-IN") },
                                ].filter(r => r.value).map(({ label, value }) => (
                                    <div key={label} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                                        <span style={{ color: T.textDim, fontSize: 12 }}>{label}</span>
                                        <span style={{ color: T.text, fontSize: 12, fontWeight: 600, textAlign: "right" }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p style={{ color: T.textDim, fontSize: 13 }}>Loading…</p>}
                    </div>

                    {/* Live indicator */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: T.textDim }}>Live · updates every second</span>
                    </div>

                    {/* Buy button */}
                    <button onClick={() => setShowBuy(true)} style={{
                        padding: "16px", borderRadius: 14, border: "none",
                        background: `linear-gradient(135deg, ${T.gold}, #D97706)`,
                        color: "#000", fontSize: 16, fontWeight: 800,
                        cursor: "pointer", boxShadow: "0 6px 20px rgba(245,158,11,0.3)",
                        transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(245,158,11,0.4)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 20px rgba(245,158,11,0.3)"; }}
                    >
                        Buy {company?.name || "Stock"}
                    </button>
                </div>
            </div>

            {showBuy && (
                <BuyModal
                    stockPrice={stockPrice}
                    company={company}
                    onClose={() => setShowBuy(false)}
                />
            )}

            {showLimit && (
                <LimitOrderModal
                    company={company}
                    stockPrice={stockPrice}
                    initialPrice={limitInitialPrice}
                    onClose={() => setShowLimit(false)}
                />
            )}
        </div>
    );
}

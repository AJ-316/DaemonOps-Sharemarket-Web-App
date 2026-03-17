import React, { useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";

// ── TradingView Widget ──
function TradingViewWidget() {
  const container = useRef();
  const scriptAdded = useRef(false);

  useEffect(() => {
    if (scriptAdded.current) return;
    scriptAdded.current = true;
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `{
      "symbols": [["BSE:SENSEX|1D"]],
      "chartOnly": false,
      "width": "100%",
      "height": "100%",
      "locale": "en",
      "colorTheme": "light",
      "autosize": false,
      "showVolume": false,
      "showMA": false,
      "hideDateRanges": false,
      "hideMarketStatus": false,
      "hideSymbolLogo": false,
      "scalePosition": "right",
      "scaleMode": "Normal",
      "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      "fontSize": "10",
      "noTimeScale": false,
      "valuesTracking": "1",
      "changeMode": "price-and-percent",
      "chartType": "area",
      "maLineColor": "#2962FF",
      "maLineWidth": 1,
      "maLength": 9,
      "headerFontSize": "medium",
      "lineWidth": 2,
      "lineType": 0,
      "dateRanges": ["1d|1","1m|30","3m|60","12m|1D","60m|1W","all|1M"]
    }`;
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container w-full h-full" ref={container}>
      <div className="tradingview-widget-container__widget w-full h-full" />
    </div>
  );
}

const TradingViewWidgetMemo = memo(TradingViewWidget);

// ── Features data ──
const features = [
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
    title: "Live Market Data",
    desc: "Real-time NSE & BSE feeds with zero delay.",
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    title: "SEBI Regulated",
    desc: "Fully compliant. Your funds are protected.",
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    title: "Zero Hidden Fees",
    desc: "Flat ₹20 per order. No surprises, ever.",
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    title: "Portfolio Analytics",
    desc: "P&L, tax reports, and insights in one place.",
  },
];

const stats = [
  { value: "2.4M+", label: "Active Traders" },
  { value: "₹840Cr", label: "Daily Volume" },
  { value: "99.9%", label: "Uptime" },
  { value: "₹20", label: "Max Brokerage" },
];

// ── Home ──
const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white font-sans">

      {/* ── Hero ── */}
      <section className="max-w-screen-xl mx-auto px-6 pt-16 pb-12 grid lg:grid-cols-2 gap-12 items-center">

        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100
                          text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            NSE &amp; BSE Live · Market Open
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Invest smarter.<br />
            <span className="text-emerald-600">Trade with confidence.</span>
          </h1>

          <p className="text-gray-500 text-base leading-relaxed max-w-md mb-8">
            Open a free demat account in minutes. Stocks, F&amp;O, IPOs and
            mutual funds - all from one platform built for Indian markets.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/register")}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                         font-semibold rounded-xl transition-all shadow-md shadow-emerald-100
                         active:scale-[0.98]"
            >
              Open Free Account
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-700
                         text-sm font-medium rounded-xl transition hover:bg-gray-50"
            >
              Sign In
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            No charges · Paperless KYC · Takes 5 minutes
          </p>
        </div>

        {/* Right — TradingView */}
        <div className="w-full h-[380px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <TradingViewWidgetMemo />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-emerald-600">
        <div className="max-w-screen-xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-emerald-100 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything you need to trade
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm">
              Powerful tools for first-time investors and seasoned traders alike.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-gray-100
                           hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center
                                justify-center text-emerald-600 mb-4">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth="1.8">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="text-gray-900 font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-slate-950 py-20 text-center px-6">
        <h2 className="text-3xl font-bold text-white mb-4">
          Start investing today.
        </h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
          Join 2.4 million traders who trust Stocko. Open your account in under 5 minutes.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold
                     text-sm rounded-xl transition shadow-lg shadow-emerald-900/30
                     active:scale-[0.98]"
        >
          Open Free Account →
        </button>
        <p className="text-slate-600 text-xs mt-4">
          No credit card · SEBI Registered · 256-bit encrypted
        </p>
      </section>

    </div>
  );
};

export default Home;
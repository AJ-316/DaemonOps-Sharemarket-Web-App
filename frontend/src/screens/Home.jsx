import React, { useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="tradingview-widget-container h-full w-full" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full" />
    </div>
  );
}

const TradingViewWidgetMemo = memo(TradingViewWidget);

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

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-10">
      <section className="app-shell grid gap-10 pb-12 pt-12 lg:grid-cols-2 lg:items-center lg:pt-16">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            NSE &amp; BSE Live · Market Open
          </div>

          <h1 className="text-4xl font-black leading-tight text-slate-900 sm:text-5xl">
            Invest smarter.
            <br />
            <span className="text-emerald-600">Trade with confidence.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
            Open a free demat account in minutes. Stocks, F&amp;O, IPOs and mutual funds - all from one platform built for Indian markets.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/register")}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700"
            >
              Open Free Account
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Sign In
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-400">No charges · Paperless KYC · Takes 5 minutes</p>
        </div>

        <div className="panel h-[390px] overflow-hidden">
          <TradingViewWidgetMemo />
        </div>
      </section>

      <section className="bg-slate-900">
        <div className="app-shell grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-300">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="app-shell py-14">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-3xl font-bold text-slate-900">Everything you need to trade</h2>
          <p className="mt-2 text-sm text-slate-600">Powerful tools for first-time investors and seasoned traders alike.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="panel p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  {f.icon}
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="app-shell">
        <div className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 text-center sm:px-10">
          <h2 className="text-3xl font-bold text-white">Start investing today.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            Join 2.4 million traders who trust Stocko. Open your account in under 5 minutes.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="mt-8 rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
          >
            Open Free Account
          </button>
          <p className="mt-4 text-xs text-slate-500">No credit card · SEBI Registered · 256-bit encrypted</p>
        </div>
      </section>

    </div>
  );
};

export default Home;

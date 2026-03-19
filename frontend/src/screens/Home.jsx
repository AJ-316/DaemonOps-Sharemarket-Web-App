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
      "colorTheme": "dark",
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
      "maLineColor": "#F59E0B",
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
    <div className="tradingview-widget-container" style={{ width: "100%", height: "100%" }} ref={container}>
      <div className="tradingview-widget-container__widget" style={{ width: "100%", height: "100%" }} />
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
    <div style={{ background: "#0A0A0A", fontFamily: "sans-serif" }}>

      {/* Grid texture overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)`,
        backgroundSize: "40px 40px"
      }} />

      {/* ── Hero ── */}
      <section style={{
        maxWidth: "1280px", margin: "0 auto", padding: "72px 24px 56px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px",
        alignItems: "center", position: "relative", zIndex: 1
      }}>

        {/* Left */}
        <div>
          {/* Live badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            color: "#F59E0B", fontSize: "12px", fontWeight: "500",
            padding: "6px 14px", borderRadius: "999px", marginBottom: "24px"
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#F59E0B",
              boxShadow: "0 0 6px #F59E0B",
              animation: "pulse 2s infinite"
            }} />
            NSE &amp; BSE Live · Market Open
          </div>

          <h1 style={{
            fontSize: "48px", fontWeight: "800", lineHeight: 1.15,
            color: "#F5F5F5", marginBottom: "20px", letterSpacing: "-0.02em"
          }}>
            Invest smarter.<br />
            <span style={{
              background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
              Trade with confidence.
            </span>
          </h1>

          <p style={{
            color: "#A3A3A3", fontSize: "15px", lineHeight: 1.7,
            maxWidth: "420px", marginBottom: "32px"
          }}>
            Open a free demat account in minutes. Stocks, F&amp;O, IPOs and
            mutual funds — all from one platform built for Indian markets.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "13px 28px",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#000", fontSize: "14px", fontWeight: "700",
                border: "none", borderRadius: "12px", cursor: "pointer",
                boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
                transition: "box-shadow 0.2s, transform 0.1s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 28px rgba(245,158,11,0.45)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,158,11,0.3)"}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              Open Free Account
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "13px 28px",
                border: "1px solid #2A2A2A", background: "transparent",
                color: "#A3A3A3", fontSize: "14px", fontWeight: "500",
                borderRadius: "12px", cursor: "pointer",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F59E0B"; e.currentTarget.style.color = "#F5F5F5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A2A2A"; e.currentTarget.style.color = "#A3A3A3"; }}
            >
              Sign In
            </button>
          </div>

          <p style={{ fontSize: "12px", color: "#525252", marginTop: "16px" }}>
            No charges · Paperless KYC · Takes 5 minutes
          </p>
        </div>

        {/* Right — TradingView */}
        <div style={{
          width: "100%", height: "380px", borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid #2A2A2A",
          boxShadow: "0 0 0 1px rgba(245,158,11,0.06), 0 24px 48px rgba(0,0,0,0.5)"
        }}>
          <TradingViewWidgetMemo />
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{
        background: "#111111",
        borderTop: "1px solid #1E1E1E",
        borderBottom: "1px solid #1E1E1E",
        position: "relative", zIndex: 1,
      }}>
        {/* Gold top shimmer */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)"
        }} />
        <div style={{
          maxWidth: "1280px", margin: "0 auto", padding: "40px 24px",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px"
        }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{
                fontSize: "32px", fontWeight: "800", letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>{s.value}</p>
              <p style={{ color: "#737373", fontSize: "13px", marginTop: "4px" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{
        background: "#0D0D0D", padding: "80px 24px",
        position: "relative", zIndex: 1
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{
              fontSize: "30px", fontWeight: "800", color: "#F5F5F5",
              marginBottom: "12px", letterSpacing: "-0.02em"
            }}>
              Everything you need to trade
            </h2>
            <p style={{ color: "#737373", maxWidth: "400px", margin: "0 auto", fontSize: "14px", lineHeight: 1.6 }}>
              Powerful tools for first-time investors and seasoned traders alike.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {features.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "#161616",
                  borderRadius: "18px", padding: "24px",
                  border: "1px solid #2A2A2A",
                  transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#2A2A2A";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: "40px", height: "40px",
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: "12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "16px"
                }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"
                    stroke="#F59E0B" strokeWidth="1.8">
                    {f.icon}
                  </svg>
                </div>
                <h3 style={{ color: "#F5F5F5", fontWeight: "600", fontSize: "14px", marginBottom: "6px" }}>
                  {f.title}
                </h3>
                <p style={{ color: "#737373", fontSize: "13px", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: "#0A0A0A", padding: "80px 24px",
        textAlign: "center", position: "relative", zIndex: 1,
        borderTop: "1px solid #1E1E1E",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "500px", height: "200px", pointerEvents: "none",
          background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)"
        }} />

        <h2 style={{
          fontSize: "32px", fontWeight: "800", color: "#F5F5F5",
          marginBottom: "16px", letterSpacing: "-0.02em", position: "relative"
        }}>
          Start investing today.
        </h2>
        <p style={{
          color: "#737373", fontSize: "14px",
          maxWidth: "340px", margin: "0 auto 32px", lineHeight: 1.6, position: "relative"
        }}>
          Join 2.4 million traders who trust Stocko. Open your account in under 5 minutes.
        </p>
        <button
          onClick={() => navigate("/register")}
          style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, #F59E0B, #D97706)",
            color: "#000", fontWeight: "700", fontSize: "14px",
            border: "none", borderRadius: "12px", cursor: "pointer",
            boxShadow: "0 4px 24px rgba(245,158,11,0.35)",
            transition: "box-shadow 0.2s, transform 0.1s",
            position: "relative"
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 32px rgba(245,158,11,0.5)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 24px rgba(245,158,11,0.35)"}
          onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
          onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          Open Free Account →
        </button>
        <p style={{ color: "#3A3A3A", fontSize: "12px", marginTop: "16px", position: "relative" }}>
          No credit card · SEBI Registered · 256-bit encrypted
        </p>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 1024px) {
          section:first-of-type { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          div[style*="repeat(4, 1fr)"] { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;
import React from "react";

const Footer = () => {
  return (
    <footer style={{
      background: "#0A0A0A",
      borderTop: "1px solid #1E1E1E",
      paddingTop: "24px",
      paddingBottom: "24px",
    }}>
      <div style={{
        maxWidth: "1280px", margin: "0 auto", padding: "0 24px",
        display: "flex", flexWrap: "wrap",
        alignItems: "center", justifyContent: "space-between", gap: "12px"
      }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "8px",
            background: "linear-gradient(135deg, #F59E0B, #D97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 10px rgba(245,158,11,0.3)"
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke="#000" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span style={{ color: "#F5F5F5", fontWeight: "600", fontSize: "13px" }}>Stocko</span>
        </div>

        {/* Copyright */}
        <p style={{ color: "#3A3A3A", fontSize: "12px" }}>
          © 2026 Stocko · SEBI Reg. No. INZ000000000
        </p>

        {/* Links */}
        <div style={{ display: "flex", gap: "20px" }}>
          {["Privacy", "Terms", "Support"].map((link) => (
            <a
              key={link}
              href="#"
              style={{ color: "#525252", fontSize: "12px", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.target.style.color = "#F59E0B"}
              onMouseLeave={(e) => e.target.style.color = "#525252"}
            >
              {link}
            </a>
          ))}
        </div>

      </div>
    </footer>
  );
};

export default Footer;
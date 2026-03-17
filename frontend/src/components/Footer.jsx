import React from "react";

const Footer = () => {
  return (
    < footer className="bg-slate-950 border-t border-slate-800 py-6" >
      <div className="max-w-screen-xl mx-auto px-6 flex flex-col sm:flex-row
                        items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">Tradify</span>
        </div>
        <p className="text-slate-600 text-xs">
          © 2026 Tradify · SEBI Reg. No. INZ000000000
        </p>
        <div className="flex gap-5 text-xs text-slate-500">
          <a href="#" className="hover:text-slate-300 transition">Privacy</a>
          <a href="#" className="hover:text-slate-300 transition">Terms</a>
          <a href="#" className="hover:text-slate-300 transition">Support</a>
        </div>
      </div>
    </footer >
  );
};

export default Footer;
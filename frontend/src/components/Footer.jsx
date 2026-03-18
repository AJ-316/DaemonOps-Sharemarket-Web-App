import React from "react";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white/80 backdrop-blur">
      <div className="app-shell py-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 shadow-sm shadow-emerald-200">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Stocko</p>
              <p className="text-[11px] text-slate-500">Smart investing for Indian markets</p>
            </div>
          </div>

          <p className="text-xs text-slate-500">© 2026 Stocko · SEBI Reg. No. INZ000000000</p>

          <div className="flex items-center gap-5 text-xs font-medium text-slate-500">
            <a href="#" className="transition hover:text-slate-900">Privacy</a>
            <a href="#" className="transition hover:text-slate-900">Terms</a>
            <a href="#" className="transition hover:text-slate-900">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
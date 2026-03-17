import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-emerald-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} Tradify. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
import React, { useEffect, useState } from "react";
import axiosCompany from "../api/axiosCompany";
import axiosExchange from "../api/axiosExchange";

const AdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({
    name: "", ticker: "", sector: "",
    description: "", totalSharesIssued: "", initialPrice: ""
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axiosCompany.get("/companies");
      setCompanies(res.data);
    } catch (_err) {
      setError("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: "", ticker: "", sector: "", description: "", totalSharesIssued: "", initialPrice: "" });
    setShowModal(true);
  };

  const openEdit = (company) => {
    setEditTarget(company);
    setForm({
      name: company.name,
      ticker: company.ticker,
      sector: company.sector,
      description: company.description,
      totalSharesIssued: company.totalSharesIssued,
      initialPrice: ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTarget) {
        await axiosCompany.put(`/companies/${editTarget.id}`, form);
      } else {
        const res = await axiosCompany.post("/companies", form);
        await axiosExchange.post(`/stocks/init?companyId=${res.data.id}&initialPrice=${form.initialPrice}`);
      }
      setShowModal(false);
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;
    try {
      await axiosCompany.delete(`/companies/${id}`);
      await axiosExchange.delete(`/stocks/company/${id}`);
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <div className="app-shell py-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Company Listings</h1>
          <p className="mt-1 text-sm text-slate-500">{companies.length} companies listed</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Company
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="panel py-20 text-center text-sm text-slate-400">Loading...</div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  {["Ticker", "Name", "Sector", "Total Shares", "Created At", "Actions"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 font-mono text-xs font-semibold text-emerald-700">
                        {c.ticker}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.sector}</td>
                    <td className="metric-value px-4 py-3 text-slate-600">{Number(c.totalSharesIssued).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center text-sm text-slate-400">No companies found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editTarget ? "Edit Company" : "Add Company"}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Company Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                    placeholder="Reliance Industries"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Ticker *</label>
                  <input
                    type="text"
                    value={form.ticker}
                    onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                    className={inputClass}
                    placeholder="RELIANCE"
                    disabled={!!editTarget}
                    required
                  />
                  {editTarget && <p className="mt-1 text-xs text-slate-400">Ticker cannot be changed</p>}
                </div>
              </div>

              <div>
                <label className={labelClass}>Sector *</label>
                <input
                  type="text"
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  className={inputClass}
                  placeholder="Energy"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Brief company description..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Total Shares Issued *</label>
                  <input
                    type="number"
                    value={form.totalSharesIssued}
                    onChange={(e) => setForm({ ...form, totalSharesIssued: e.target.value })}
                    className={inputClass}
                    placeholder="1000000"
                    required
                  />
                </div>
                {!editTarget && (
                  <div>
                    <label className={labelClass}>Initial Price (₹) *</label>
                    <input
                      type="number"
                      value={form.initialPrice}
                      onChange={(e) => setForm({ ...form, initialPrice: e.target.value })}
                      className={inputClass}
                      placeholder="100.00"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  {editTarget ? "Save Changes" : "Add Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

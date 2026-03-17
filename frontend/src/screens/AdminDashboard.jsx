import React, { useEffect, useState } from "react";
import axiosCompany from "../api/axiosCompany";
import axiosExchange from "../api/axiosExchange";

const AdminDashboard = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null); // null = add, object = edit
    const [form, setForm] = useState({
        name: "", ticker: "", sector: "",
        description: "", totalSharesIssued: "", initialPrice: ""
    });

    // ── Fetch all companies ──
    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await axiosCompany.get("/companies");
            setCompanies(res.data);
        } catch (err) {
            setError("Failed to load companies");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCompanies(); }, []);

    // ── Open modal ──
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

    // ── Submit (add or edit) ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editTarget) {
                await axiosCompany.put(`/companies/${editTarget.id}`, form);
            } else {
                // 1. Add company
                const res = await axiosCompany.post("/companies", form);

                // 2. Init stock in exchange service
                await axiosExchange.post(
                    `/stocks/init?companyId=${res.data.id}&initialPrice=${form.initialPrice}`
                );
            }
            setShowModal(false);
            fetchCompanies();
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        }
    };

    // ── Delete ──
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

    const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition text-sm";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="p-6 max-w-screen-xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
                    <p className="text-sm text-gray-500 mt-1">{companies.length} companies listed</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700
                     text-white text-sm font-semibold rounded-lg transition"
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Company
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading...</div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {["Ticker", "Name", "Sector", "Total Shares", "Created At", "Actions"].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {companies.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3">
                                        <span className="font-mono font-semibold text-emerald-700 bg-emerald-50
                                     px-2 py-0.5 rounded text-xs">
                                            {c.ticker}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{c.sector}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {Number(c.totalSharesIssued).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEdit(c)}
                                                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50
                                   hover:bg-blue-100 rounded-lg transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50
                                   hover:bg-red-100 rounded-lg transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {companies.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400">
                                        No companies found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">

                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editTarget ? "Edit Company" : "Add Company"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                                        disabled={!!editTarget} // ticker is immutable
                                        required
                                    />
                                    {editTarget && (
                                        <p className="text-xs text-gray-400 mt-1">Ticker cannot be changed</p>
                                    )}
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

                            <div className="grid grid-cols-2 gap-4">
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
                                    className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200
                             rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600
                             hover:bg-emerald-700 rounded-lg transition"
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
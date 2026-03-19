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
        } catch (err) {
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

    const inputStyle = {
        width: "100%",
        padding: "10px 14px",
        borderRadius: "10px",
        border: "1px solid #2A2A2A",
        background: "#1C1C1C",
        color: "#F5F5F5",
        fontSize: "13px",
        outline: "none",
        transition: "border 0.2s, box-shadow 0.2s",
        fontFamily: "inherit",
    };

    const handleInputFocus = (e) => {
        e.target.style.border = "1px solid #F59E0B";
        e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.1)";
    };
    const handleInputBlur = (e) => {
        e.target.style.border = "1px solid #2A2A2A";
        e.target.style.boxShadow = "none";
    };

    return (
        <div style={{ padding: "24px", maxWidth: "1280px", margin: "0 auto", minHeight: "100vh", background: "#0A0A0A" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#F5F5F5" }}>Companies</h1>
                    <p style={{ fontSize: "13px", color: "#737373", marginTop: "4px" }}>
                        {companies.length} companies listed
                    </p>
                </div>
                <button
                    onClick={openAdd}
                    style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 18px",
                        background: "linear-gradient(135deg, #F59E0B, #D97706)",
                        color: "#000", fontWeight: "600", fontSize: "13px",
                        border: "none", borderRadius: "10px", cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(245,158,11,0.25)",
                        transition: "box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 20px rgba(245,158,11,0.4)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 14px rgba(245,158,11,0.25)"}
                >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Company
                </button>
            </div>

            {error && (
                <div style={{
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    color: "#FCA5A5", fontSize: "13px", padding: "12px 16px",
                    borderRadius: "10px", marginBottom: "16px"
                }}>
                    {error}
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#525252" }}>Loading...</div>
            ) : (
                <div style={{
                    background: "#161616",
                    border: "1px solid #2A2A2A",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 0 0 1px rgba(245,158,11,0.05)",
                }}>
                    <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#111111", borderBottom: "1px solid #2A2A2A" }}>
                                {["Ticker", "Name", "Sector", "Total Shares", "Created At", "Actions"].map((h) => (
                                    <th key={h} style={{
                                        textAlign: "left", padding: "12px 16px",
                                        fontSize: "11px", fontWeight: "600",
                                        color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.08em"
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((c, i) => (
                                <tr key={c.id}
                                    style={{ borderBottom: "1px solid #1E1E1E", transition: "background 0.15s" }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#1A1A1A"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                >
                                    <td style={{ padding: "12px 16px" }}>
                                        <span style={{
                                            fontFamily: "monospace", fontWeight: "700",
                                            color: "#F59E0B",
                                            background: "rgba(245,158,11,0.1)",
                                            border: "1px solid rgba(245,158,11,0.2)",
                                            padding: "2px 8px", borderRadius: "6px", fontSize: "12px"
                                        }}>
                                            {c.ticker}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px 16px", fontWeight: "500", color: "#F5F5F5" }}>{c.name}</td>
                                    <td style={{ padding: "12px 16px", color: "#F5F5F5" }}>{c.sector}</td>
                                    <td style={{ padding: "12px 16px", color: "#F5F5F5" }}>
                                        {Number(c.totalSharesIssued).toLocaleString()}
                                    </td>
                                    <td style={{ padding: "12px 16px", color: "#A3A3A3", fontSize: "12px" }}>
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                onClick={() => openEdit(c)}
                                                style={{
                                                    padding: "5px 12px", fontSize: "12px", fontWeight: "500",
                                                    color: "#93C5FD",
                                                    background: "rgba(59,130,246,0.1)",
                                                    border: "1px solid rgba(59,130,246,0.2)",
                                                    borderRadius: "8px", cursor: "pointer", transition: "background 0.15s"
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59,130,246,0.18)"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(59,130,246,0.1)"}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                style={{
                                                    padding: "5px 12px", fontSize: "12px", fontWeight: "500",
                                                    color: "#FCA5A5",
                                                    background: "rgba(239,68,68,0.1)",
                                                    border: "1px solid rgba(239,68,68,0.2)",
                                                    borderRadius: "8px", cursor: "pointer", transition: "background 0.15s"
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {companies.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "48px", color: "#525252" }}>
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
                <div style={{
                    position: "fixed", inset: 0,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 50, padding: "16px"
                }}>
                    <div style={{
                        background: "#161616",
                        border: "1px solid #2A2A2A",
                        borderRadius: "20px",
                        width: "100%", maxWidth: "520px",
                        padding: "28px",
                        boxShadow: "0 0 0 1px rgba(245,158,11,0.08), 0 32px 64px rgba(0,0,0,0.7)",
                        position: "relative"
                    }}>
                        {/* Gold top accent */}
                        <div style={{
                            position: "absolute", top: 0, left: "32px", right: "32px", height: "1px",
                            background: "linear-gradient(90deg, transparent, #F59E0B, transparent)",
                            opacity: 0.5, borderRadius: "999px"
                        }} />

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#F5F5F5" }}>
                                {editTarget ? "Edit Company" : "Add Company"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#525252", transition: "color 0.2s" }}
                                onMouseEnter={(e) => e.currentTarget.style.color = "#A3A3A3"}
                                onMouseLeave={(e) => e.currentTarget.style.color = "#525252"}
                            >
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#A3A3A3", marginBottom: "6px" }}>
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        style={inputStyle}
                                        placeholder="Reliance Industries"
                                        onFocus={handleInputFocus}
                                        onBlur={handleInputBlur}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#A3A3A3", marginBottom: "6px" }}>
                                        Ticker *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.ticker}
                                        onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                                        style={{
                                            ...inputStyle,
                                            ...(editTarget ? { color: "#525252", cursor: "not-allowed" } : {})
                                        }}
                                        placeholder="RELIANCE"
                                        disabled={!!editTarget}
                                        onFocus={handleInputFocus}
                                        onBlur={handleInputBlur}
                                        required
                                    />
                                    {editTarget && (
                                        <p style={{ fontSize: "11px", color: "#525252", marginTop: "4px" }}>Ticker cannot be changed</p>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#A3A3A3", marginBottom: "6px" }}>
                                    Sector *
                                </label>
                                <input
                                    type="text"
                                    value={form.sector}
                                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                                    style={inputStyle}
                                    placeholder="Energy"
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#A3A3A3", marginBottom: "6px" }}>
                                    Description
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    style={{ ...inputStyle, resize: "none" }}
                                    rows={3}
                                    placeholder="Brief company description..."
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#A3A3A3", marginBottom: "6px" }}>
                                        Total Shares Issued *
                                    </label>
                                    <input
                                        type="number"
                                        value={form.totalSharesIssued}
                                        onChange={(e) => setForm({ ...form, totalSharesIssued: e.target.value })}
                                        style={inputStyle}
                                        placeholder="1000000"
                                        onFocus={handleInputFocus}
                                        onBlur={handleInputBlur}
                                        required
                                    />
                                </div>
                                {!editTarget && (
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#A3A3A3", marginBottom: "6px" }}>
                                            Initial Price (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            value={form.initialPrice}
                                            onChange={(e) => setForm({ ...form, initialPrice: e.target.value })}
                                            style={inputStyle}
                                            placeholder="100.00"
                                            onFocus={handleInputFocus}
                                            onBlur={handleInputBlur}
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: "10px 20px", fontSize: "13px", fontWeight: "500",
                                        color: "#A3A3A3", background: "transparent",
                                        border: "1px solid #2A2A2A", borderRadius: "10px",
                                        cursor: "pointer", transition: "border-color 0.2s, color 0.2s"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3A3A3A"; e.currentTarget.style.color = "#F5F5F5"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A2A2A"; e.currentTarget.style.color = "#A3A3A3"; }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: "10px 20px", fontSize: "13px", fontWeight: "600",
                                        color: "#000",
                                        background: "linear-gradient(135deg, #F59E0B, #D97706)",
                                        border: "none", borderRadius: "10px", cursor: "pointer",
                                        boxShadow: "0 4px 14px rgba(245,158,11,0.25)",
                                        transition: "box-shadow 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 20px rgba(245,158,11,0.4)"}
                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 14px rgba(245,158,11,0.25)"}
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
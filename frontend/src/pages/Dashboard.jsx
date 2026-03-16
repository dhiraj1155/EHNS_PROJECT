import React, { useState, useEffect, useCallback } from "react";
import LogCard from "../components/LogCard";
import { fetchLogs } from "../services/api";
import "./Dashboard.css";

const LOG_TYPES = ["", "prescription", "diagnosis", "procedure", "lab_result", "discharge", "admission", "note"];

function Dashboard() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState({ patientId: "", doctorId: "", logType: "" });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const loadLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchLogs({ ...search, page, limit: 12 });
            setLogs(data.logs);
            setTotalPages(data.totalPages);
            setTotal(data.total);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    useEffect(() => { loadLogs(); }, [loadLogs]);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearch((prev) => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const handleClear = () => {
        setSearch({ patientId: "", doctorId: "", logType: "" });
        setPage(1);
    };

    return (
        <div className="page dashboard">
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Log Registry</h1>
                    <p className="page-subtitle">
                        {total} record{total !== 1 ? "s" : ""} in the tamper-proof registry
                    </p>
                </div>
                <button className="btn-primary" onClick={loadLogs} disabled={loading}>
                    {loading ? "Loading…" : "↻ Refresh"}
                </button>
            </div>

            {/* ── Filters ── */}
            <div className="filter-bar">
                <input
                    className="filter-input"
                    type="text"
                    name="patientId"
                    placeholder="Filter by Patient ID…"
                    value={search.patientId}
                    onChange={handleSearchChange}
                />
                <input
                    className="filter-input"
                    type="text"
                    name="doctorId"
                    placeholder="Filter by Doctor ID…"
                    value={search.doctorId}
                    onChange={handleSearchChange}
                />
                <select
                    className="filter-input"
                    name="logType"
                    value={search.logType}
                    onChange={handleSearchChange}
                >
                    {LOG_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t ? t.replace("_", " ") : "All Types"}
                        </option>
                    ))}
                </select>
                {(search.patientId || search.doctorId || search.logType) && (
                    <button className="btn-ghost" onClick={handleClear}>✕ Clear</button>
                )}
            </div>

            {/* ── Content ── */}
            {error && (
                <div className="error-banner">
                    ⚠️ {error}
                    <button className="btn-ghost" onClick={loadLogs}>Retry</button>
                </div>
            )}

            {!error && logs.length === 0 && !loading && (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No logs found</h3>
                    <p>Try adjusting your filters, or add the first log record.</p>
                </div>
            )}

            {loading ? (
                <div className="loading-grid">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="log-card-skeleton" />
                    ))}
                </div>
            ) : (
                <div className="log-grid">
                    {logs.map((log) => (
                        <LogCard key={log._id} log={log} />
                    ))}
                </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="btn-ghost"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ← Prev
                    </button>
                    <span className="page-info">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        className="btn-ghost"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}

export default Dashboard;

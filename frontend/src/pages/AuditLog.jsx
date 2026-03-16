import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchLog, verifyLog } from "../services/api";
import "./AuditLog.css";

function AuditLog() {
    const { id } = useParams();
    const [log, setLog] = useState(null);
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchLog(id);
                setLog(data);
            } catch (err) {
                setError(err.response?.data?.error || err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleVerify = async () => {
        setVerifying(true);
        setVerification(null);
        try {
            const result = await verifyLog(id);
            setVerification(result);
        } catch (err) {
            setVerification({ error: err.response?.data?.error || err.message });
        } finally {
            setVerifying(false);
        }
    };

    if (loading) return (
        <div className="page audit-log">
            <div className="audit-skeleton" />
        </div>
    );

    if (error) return (
        <div className="page audit-log">
            <div className="error-banner">⚠️ {error}</div>
            <Link to="/" className="btn-ghost">← Back to Dashboard</Link>
        </div>
    );

    const formattedDate = new Date(log.createdAt).toLocaleString("en-IN", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });

    return (
        <div className="page audit-log">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Audit Record</h1>
                    <p className="page-subtitle">Verify the integrity of this hospital log</p>
                </div>
                <Link to="/" className="btn-ghost">← Back</Link>
            </div>

            {/* ── Log Details ── */}
            <div className="audit-card">
                <div className="audit-section">
                    <h3 className="audit-section-title">📋 Log Details</h3>
                    <div className="audit-grid">
                        <div className="audit-field">
                            <span className="audit-label">Patient ID</span>
                            <span className="audit-value mono">{log.patientId}</span>
                        </div>
                        <div className="audit-field">
                            <span className="audit-label">Doctor ID</span>
                            <span className="audit-value mono">{log.doctorId}</span>
                        </div>
                        <div className="audit-field">
                            <span className="audit-label">Log Type</span>
                            <span className="audit-value capitalize">{log.logType.replace("_", " ")}</span>
                        </div>
                        <div className="audit-field">
                            <span className="audit-label">Timestamp</span>
                            <span className="audit-value">{formattedDate}</span>
                        </div>
                        <div className="audit-field full-width">
                            <span className="audit-label">Description</span>
                            <span className="audit-value">{log.description}</span>
                        </div>
                    </div>
                </div>

                {/* ── Cryptographic Fingerprint ── */}
                <div className="audit-section">
                    <h3 className="audit-section-title">🔐 Cryptographic Fingerprint</h3>
                    <div className="hash-display">
                        <span className="hash-label">SHA-256 Hash</span>
                        <code className="hash-value">{log.hash}</code>
                    </div>
                    {log.txHash && (
                        <div className="hash-display">
                            <span className="hash-label">Transaction Hash</span>
                            <code className="hash-value">{log.txHash}</code>
                        </div>
                    )}
                    {log.blockNumber && (
                        <div className="hash-display">
                            <span className="hash-label">Block Number</span>
                            <code className="hash-value">#{log.blockNumber}</code>
                        </div>
                    )}
                </div>

                {/* ── Blockchain Status ── */}
                <div className="audit-section">
                    <h3 className="audit-section-title">⛓️ Blockchain Status</h3>
                    <div className={`chain-badge ${log.onChain ? "confirmed" : "pending"}`}>
                        {log.onChain ? "✅ Hash Confirmed On-Chain" : "⏳ Pending — Hash Not Yet Anchored"}
                    </div>
                </div>

                {/* ── Verification ── */}
                <div className="audit-section">
                    <h3 className="audit-section-title">🔍 Tamper Check</h3>
                    <p className="audit-hint">
                        Click verify to re-compute the hash from stored fields and compare it against the
                        smart contract. If the record was tampered, the check will fail.
                    </p>
                    <button
                        className="btn-primary verify-btn"
                        onClick={handleVerify}
                        disabled={verifying}
                    >
                        {verifying ? (
                            <><span className="spinner" /> Verifying on chain…</>
                        ) : (
                            "🛡️ Verify Integrity"
                        )}
                    </button>

                    {verification && !verification.error && (
                        <div className={`verification-result ${verification.overall ? "pass" : "fail"}`}>
                            <div className="verify-icon">{verification.overall ? "✅" : "❌"}</div>
                            <div className="verify-details">
                                <strong>
                                    {verification.overall ? "Record is Intact — Not Tampered" : "⚠️ Integrity Failure Detected!"}
                                </strong>
                                <div className="verify-checks">
                                    <div className={`verify-check ${verification.dbIntact ? "pass" : "fail"}`}>
                                        {verification.dbIntact ? "✓" : "✗"} Database hash matches computed hash
                                    </div>
                                    <div className={`verify-check ${verification.chain?.verified ? "pass" : "fail"}`}>
                                        {verification.chain?.verified ? "✓" : "✗"} Hash confirmed on Ethereum (Ganache)
                                    </div>
                                    {verification.chain?.timestamp && (
                                        <div className="verify-check pass">
                                            ✓ Anchored on {new Date(verification.chain.timestamp).toLocaleString()}
                                        </div>
                                    )}
                                    {verification.chain?.error && (
                                        <div className="verify-check fail">
                                            ✗ Chain error: {verification.chain.error}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {verification?.error && (
                        <div className="error-banner">⚠️ {verification.error}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuditLog;

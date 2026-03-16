import React from "react";
import { Link } from "react-router-dom";
import "./LogCard.css";

const LOG_TYPE_ICONS = {
    prescription: "💊",
    diagnosis: "🩺",
    procedure: "🔬",
    lab_result: "🧪",
    discharge: "🚪",
    admission: "🛏️",
    note: "📝",
};

const LOG_TYPE_COLORS = {
    prescription: "#63b3ed",
    diagnosis: "#ed8936",
    procedure: "#9f7aea",
    lab_result: "#48bb78",
    discharge: "#fc8181",
    admission: "#fbd38d",
    note: "#81e6d9",
};

function LogCard({ log }) {
    const icon = LOG_TYPE_ICONS[log.logType] || "📄";
    const color = LOG_TYPE_COLORS[log.logType] || "#94a3b8";

    const formattedDate = new Date(log.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="log-card" style={{ "--accent": color }}>
            <div className="log-card-header">
                <div className="log-type-badge" style={{ background: color + "22", color }}>
                    <span>{icon}</span>
                    <span>{log.logType.replace("_", " ")}</span>
                </div>
                <div className={`chain-status ${log.onChain ? "on-chain" : "pending"}`}>
                    {log.onChain ? (
                        <>
                            <span className="chain-dot"></span>
                            On-Chain
                        </>
                    ) : (
                        <>
                            <span className="chain-dot"></span>
                            Pending
                        </>
                    )}
                </div>
            </div>

            <div className="log-card-body">
                <div className="log-ids">
                    <span className="log-id-item">
                        <span className="log-id-label">Patient</span>
                        <span className="log-id-value">{log.patientId}</span>
                    </span>
                    <span className="log-id-divider">•</span>
                    <span className="log-id-item">
                        <span className="log-id-label">Doctor</span>
                        <span className="log-id-value">{log.doctorId}</span>
                    </span>
                </div>

                <p className="log-description">{log.description}</p>
            </div>

            <div className="log-card-footer">
                <span className="log-date">{formattedDate}</span>
                <div className="log-hash-preview" title={log.hash}>
                    🔒 {log.hash?.slice(0, 8)}…{log.hash?.slice(-6)}
                </div>
                <Link to={`/audit/${log._id}`} className="audit-btn">
                    Audit →
                </Link>
            </div>
        </div>
    );
}

export default LogCard;

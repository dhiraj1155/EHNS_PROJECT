import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLog } from "../services/api";
import "./AddLog.css";

const LOG_TYPES = [
    { value: "prescription", label: "💊 Prescription" },
    { value: "diagnosis", label: "🩺 Diagnosis" },
    { value: "procedure", label: "🔬 Procedure" },
    { value: "lab_result", label: "🧪 Lab Result" },
    { value: "admission", label: "🛏️ Admission" },
    { value: "discharge", label: "🚪 Discharge" },
    { value: "note", label: "📝 Note" },
];

const INITIAL = { patientId: "", doctorId: "", logType: "prescription", description: "" };

function AddLog() {
    const [form, setForm] = useState(INITIAL);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.patientId || !form.doctorId || !form.logType || !form.description) {
            setError("All fields are required.");
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const data = await createLog(form);
            setSuccess(data.log);
            setForm(INITIAL);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page add-log">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Add Log Entry</h1>
                    <p className="page-subtitle">
                        Records are hashed with SHA-256 and anchored to the blockchain.
                    </p>
                </div>
            </div>

            <div className="form-container">
                {success && (
                    <div className="success-banner">
                        <div className="success-icon">✅</div>
                        <div>
                            <strong>Log recorded successfully!</strong>
                            <p>Hash is being written to blockchain (tx may take a few seconds).</p>
                            <p className="success-hash">
                                🔒 {success.hash?.slice(0, 16)}…
                            </p>
                            <div className="success-actions">
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate(`/audit/${success._id}`)}
                                >
                                    View & Audit →
                                </button>
                                <button className="btn-ghost" onClick={() => setSuccess(null)}>
                                    Add Another
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!success && (
                    <form className="log-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-field">
                                <label className="form-label">Patient ID *</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="patientId"
                                    placeholder="e.g. P001"
                                    value={form.patientId}
                                    onChange={handleChange}
                                    autoComplete="off"
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Doctor ID *</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="doctorId"
                                    placeholder="e.g. D001"
                                    value={form.doctorId}
                                    onChange={handleChange}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="form-label">Log Type *</label>
                            <div className="log-type-grid">
                                {LOG_TYPES.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`log-type-btn ${form.logType === value ? "selected" : ""}`}
                                        onClick={() => setForm((prev) => ({ ...prev, logType: value }))}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="form-label">Description *</label>
                            <textarea
                                className="form-input form-textarea"
                                name="description"
                                placeholder="Describe the medical record in detail…"
                                value={form.description}
                                onChange={handleChange}
                                rows={5}
                            />
                        </div>

                        {error && <div className="error-banner">⚠️ {error}</div>}

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={() => navigate("/")}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <span className="spinner" /> Submitting…
                                    </>
                                ) : (
                                    "🔒 Submit & Hash"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default AddLog;

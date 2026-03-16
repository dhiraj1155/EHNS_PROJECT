import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Default role for requests (doctor can create + read; auditor is read-only)
// In a real app, this comes from a logged-in user's JWT claims
let currentRole = localStorage.getItem("hospitalRole") || "doctor";

export function setRole(role) {
    currentRole = role;
    localStorage.setItem("hospitalRole", role);
}

export function getRole() {
    return currentRole;
}

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

// Attach X-Role header to every request
api.interceptors.request.use((config) => {
    config.headers["X-Role"] = currentRole;
    return config;
});

// ── Logs API ──────────────────────────────────────────────────────────────────

export async function createLog(data) {
    const res = await api.post("/logs", data);
    return res.data;
}

export async function fetchLogs({ patientId, doctorId, logType, page = 1, limit = 20 } = {}) {
    const params = { page, limit };
    if (patientId) params.patientId = patientId;
    if (doctorId) params.doctorId = doctorId;
    if (logType) params.logType = logType;
    const res = await api.get("/logs", { params });
    return res.data;
}

export async function fetchLog(id) {
    const res = await api.get(`/logs/${id}`);
    return res.data;
}

export async function verifyLog(id) {
    const res = await api.get(`/logs/${id}/verify`);
    return res.data;
}

export async function checkHealth() {
    const res = await api.get("/health");
    return res.data;
}

export default api;

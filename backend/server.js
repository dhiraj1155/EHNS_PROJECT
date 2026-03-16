require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const logsRouter = require("./routes/logs");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/logs", logsRouter);

// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 catch-all
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
    console.error("❌ Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
});

// ── Database connection ───────────────────────────────────────────────────────
async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "hospitalLogs",
        });
        console.log("✅ MongoDB connected");

        app.listen(PORT, () => {
            console.log(`✅ Backend running at http://localhost:${PORT}`);
            console.log(`   Health: http://localhost:${PORT}/api/health`);
        });
    } catch (err) {
        console.error("❌ Failed to start server:", err.message);
        process.exit(1);
    }
}

startServer();

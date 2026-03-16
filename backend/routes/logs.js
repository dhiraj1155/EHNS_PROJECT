const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Log = require("../models/Log");
const { addLogHash, verifyLogHash } = require("../services/blockchain");
const { doctorOrAdmin, anyValidRole } = require("../middleware/auth");

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Build a deterministic SHA-256 hash from log content fields.
 * NOTE: We intentionally exclude createdAt — it is set by MongoDB at save time
 * and would differ from any pre-save timestamp, breaking re-computation during verify.
 */
function hashLog({ patientId, doctorId, logType, description }) {
    const payload = `${patientId}|${doctorId}|${logType}|${description}`;
    return crypto.createHash("sha256").update(payload).digest("hex");
}

// ── POST /api/logs ─────────────────────────────────────────────────────────────
// Create a new log entry; hash it; write hash to chain.
router.post("/", doctorOrAdmin, async (req, res) => {
    try {
        const { patientId, doctorId, logType, description, metadata } = req.body;

        if (!patientId || !doctorId || !logType || !description) {
            return res.status(400).json({
                error: "Missing required fields: patientId, doctorId, logType, description",
            });
        }

        const hash = hashLog({ patientId, doctorId, logType, description });

        // Save to MongoDB first (fast path — user gets response quickly)
        const log = new Log({
            patientId,
            doctorId,
            logType,
            description,
            hash,
            metadata: metadata || {},
        });

        await log.save();

        // Write hash to blockchain asynchronously (update record after tx confirms)
        addLogHash(hash)
            .then(async ({ txHash, blockNumber }) => {
                await Log.findByIdAndUpdate(log._id, {
                    txHash,
                    blockNumber,
                    onChain: true,
                });
                console.log(`⛓️  Log ${log._id} anchored — tx: ${txHash}`);
            })
            .catch((err) => {
                console.warn(`⚠️  Blockchain write failed for log ${log._id}: ${err.message}`);
            });

        return res.status(201).json({
            message: "Log created. Hash is being written to blockchain.",
            log,
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: "Duplicate log: identical record already exists" });
        }
        console.error("POST /api/logs error:", err);
        return res.status(500).json({ error: err.message });
    }
});

// ── GET /api/logs ──────────────────────────────────────────────────────────────
// List logs, optionally filtered by patientId or doctorId.
router.get("/", anyValidRole, async (req, res) => {
    try {
        const { patientId, doctorId, logType, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (patientId) filter.patientId = patientId;
        if (doctorId) filter.doctorId = doctorId;
        if (logType) filter.logType = logType;

        const skip = (Number(page) - 1) * Number(limit);
        const [logs, total] = await Promise.all([
            Log.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
            Log.countDocuments(filter),
        ]);

        return res.json({
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            logs,
        });
    } catch (err) {
        console.error("GET /api/logs error:", err);
        return res.status(500).json({ error: err.message });
    }
});

// ── GET /api/logs/:id ──────────────────────────────────────────────────────────
// Get a single log by MongoDB _id.
router.get("/:id", anyValidRole, async (req, res) => {
    try {
        const log = await Log.findById(req.params.id).lean();
        if (!log) return res.status(404).json({ error: "Log not found" });
        return res.json(log);
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid log ID format" });
        }
        return res.status(500).json({ error: err.message });
    }
});

// ── GET /api/logs/:id/verify ───────────────────────────────────────────────────
// Re-compute the hash from DB fields and check it against the smart contract.
router.get("/:id/verify", anyValidRole, async (req, res) => {
    try {
        const log = await Log.findById(req.params.id).lean();
        if (!log) return res.status(404).json({ error: "Log not found" });

        // Re-compute the hash from content fields to detect MongoDB-level tampering
        const recomputedHash = hashLog({
            patientId: log.patientId,
            doctorId: log.doctorId,
            logType: log.logType,
            description: log.description,
        });

        const dbIntact = recomputedHash === log.hash;

        // Check on-chain
        let chainResult = { verified: false, timestamp: 0, addedBy: null };
        let chainError = null;
        try {
            chainResult = await verifyLogHash(log.hash);
        } catch (err) {
            chainError = err.message;
        }

        return res.json({
            logId: log._id,
            hash: log.hash,
            dbIntact,
            chain: {
                verified: chainResult.verified,
                timestamp: chainResult.timestamp
                    ? new Date(chainResult.timestamp * 1000).toISOString()
                    : null,
                addedBy: chainResult.addedBy,
                error: chainError,
            },
            overall: dbIntact && chainResult.verified,
        });
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid log ID format" });
        }
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;

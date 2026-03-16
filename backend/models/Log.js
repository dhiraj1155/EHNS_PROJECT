const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
    {
        patientId: {
            type: String,
            required: [true, "patientId is required"],
            trim: true,
            index: true,
        },
        doctorId: {
            type: String,
            required: [true, "doctorId is required"],
            trim: true,
            index: true,
        },
        logType: {
            type: String,
            required: [true, "logType is required"],
            enum: ["prescription", "diagnosis", "procedure", "lab_result", "discharge", "admission", "note"],
            lowercase: true,
        },
        description: {
            type: String,
            required: [true, "description is required"],
            trim: true,
        },
        // SHA-256 hash of (patientId + doctorId + logType + description + createdAt)
        hash: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        // Ethereum transaction hash after writing to chain
        txHash: {
            type: String,
            default: null,
        },
        // Block number where the transaction was mined
        blockNumber: {
            type: Number,
            default: null,
        },
        // Whether the hash was successfully written to the blockchain
        onChain: {
            type: Boolean,
            default: false,
        },
        // Extra metadata (optional)
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true, // adds createdAt & updatedAt
    }
);

// Virtual: short display ID
logSchema.virtual("shortId").get(function () {
    return this._id.toString().slice(-6).toUpperCase();
});

module.exports = mongoose.model("Log", logSchema);

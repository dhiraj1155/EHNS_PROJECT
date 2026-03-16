const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

let provider = null;
let wallet = null;
let contract = null;
let contractAddress = null;

/**
 * Lazy-initialise the Ethers provider, wallet, and contract instance.
 * Called once on first use (or after a connection reset).
 */
function getContract() {
    if (contract) return contract;

    const rpcUrl = process.env.GANACHE_URL || "http://127.0.0.1:7545";
    const privateKey = process.env.PRIVATE_KEY;
    contractAddress = process.env.CONTRACT_ADDRESS;

    if (!privateKey) {
        throw new Error("PRIVATE_KEY not set in environment. Add it to backend/.env");
    }
    if (!contractAddress) {
        throw new Error(
            "CONTRACT_ADDRESS not set in environment. Deploy the smart contract first and paste the address into backend/.env"
        );
    }

    // Load ABI from compiled Hardhat artifact
    const artifactPath = path.join(
        __dirname,
        "..",
        "contract",
        "HospitalLogs.json"
    );

    if (!fs.existsSync(artifactPath)) {
        throw new Error(
            `ABI not found at ${artifactPath}. Please run: npm run copy-abi (or manually copy blockchain/artifacts/contracts/HospitalLogs.sol/HospitalLogs.json to backend/contract/HospitalLogs.json)`
        );
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abi = artifact.abi;

    provider = new ethers.JsonRpcProvider(rpcUrl);
    wallet = new ethers.Wallet(privateKey, provider);
    contract = new ethers.Contract(contractAddress, abi, wallet);

    console.log(`⛓️  Blockchain service connected`);
    console.log(`   RPC           : ${rpcUrl}`);
    console.log(`   Wallet        : ${wallet.address}`);
    console.log(`   Contract      : ${contractAddress}`);

    return contract;
}

/**
 * Write a hex hash string to the smart contract.
 * @param {string} hexHash  0x-prefixed 64-char hex string (SHA-256 output)
 * @returns {{ txHash: string, blockNumber: number }}
 */
async function addLogHash(hexHash) {
    const c = getContract();
    const bytes32Hash = hexHash.startsWith("0x") ? hexHash : "0x" + hexHash;

    const tx = await c.addLog(bytes32Hash);
    const receipt = await tx.wait();

    return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
    };
}

/**
 * Verify a hex hash exists on chain.
 * @param {string} hexHash
 * @returns {{ verified: boolean, timestamp: number, addedBy: string }}
 */
async function verifyLogHash(hexHash) {
    const c = getContract();
    const bytes32Hash = hexHash.startsWith("0x") ? hexHash : "0x" + hexHash;

    const [verified, timestamp, addedBy] = await c.verifyLog(bytes32Hash);

    return {
        verified,
        timestamp: Number(timestamp),
        addedBy,
    };
}

/**
 * Return the total number of on-chain logs recorded.
 */
async function totalOnChainLogs() {
    const c = getContract();
    const total = await c.totalLogs();
    return Number(total);
}

module.exports = { addLogHash, verifyLogHash, totalOnChainLogs };

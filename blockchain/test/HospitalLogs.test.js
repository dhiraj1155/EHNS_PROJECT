const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { ethers } = require("hardhat");
const crypto = require("crypto");

describe("HospitalLogs", function () {
    let contract;
    let owner;
    let other;

    // Helper: create a bytes32 SHA-256 hash from a string
    function sha256Bytes32(data) {
        const hex = crypto.createHash("sha256").update(data).digest("hex");
        return "0x" + hex;
    }

    beforeEach(async function () {
        [owner, other] = await ethers.getSigners();
        const HospitalLogs = await ethers.getContractFactory("HospitalLogs");
        contract = await HospitalLogs.deploy();
        await contract.waitForDeployment();
    });

    // ------------------------------------------------------------------
    describe("Deployment", function () {
        it("Should set the deployer as owner", async function () {
            expect(await contract.owner()).to.equal(owner.address);
        });

        it("Should start with zero logs", async function () {
            expect(await contract.totalLogs()).to.equal(0n);
        });
    });

    // ------------------------------------------------------------------
    describe("addLog", function () {
        it("Should store a valid hash and emit LogAdded event", async function () {
            const hash = sha256Bytes32("patient:P001 | prescription | Amoxicillin 500mg");

            await expect(contract.addLog(hash))
                .to.emit(contract, "LogAdded")
                .withArgs(hash, owner.address, anyValue);

            expect(await contract.totalLogs()).to.equal(1n);
        });

        it("Should reject the zero hash", async function () {
            const zeroHash = ethers.ZeroHash;
            await expect(contract.addLog(zeroHash)).to.be.revertedWith(
                "HospitalLogs: empty hash"
            );
        });

        it("Should reject a duplicate hash", async function () {
            const hash = sha256Bytes32("duplicate-entry");
            await contract.addLog(hash);
            await expect(contract.addLog(hash)).to.be.revertedWith(
                "HospitalLogs: hash already recorded"
            );
        });

        it("Should allow any account to add a log (not restricted to owner)", async function () {
            const hash = sha256Bytes32("other-account-entry");
            await expect(contract.connect(other).addLog(hash)).to.not.be.reverted;
        });
    });

    // ------------------------------------------------------------------
    describe("verifyLog", function () {
        it("Should return verified=true for a recorded hash", async function () {
            const hash = sha256Bytes32("real-record");
            await contract.addLog(hash);

            const [verified, timestamp, addedBy] = await contract.verifyLog(hash);
            expect(verified).to.equal(true);
            expect(timestamp).to.be.gt(0n);
            expect(addedBy).to.equal(owner.address);
        });

        it("Should return verified=false for an unknown / tampered hash", async function () {
            const fakeHash = sha256Bytes32("tampered-record");
            const [verified, timestamp, addedBy] = await contract.verifyLog(fakeHash);
            expect(verified).to.equal(false);
            expect(timestamp).to.equal(0n);
            expect(addedBy).to.equal(ethers.ZeroAddress);
        });
    });

    // ------------------------------------------------------------------
    describe("Enumeration", function () {
        it("hashAt should return the correct hash by index", async function () {
            const hash1 = sha256Bytes32("entry-1");
            const hash2 = sha256Bytes32("entry-2");
            await contract.addLog(hash1);
            await contract.addLog(hash2);

            expect(await contract.hashAt(0)).to.equal(hash1);
            expect(await contract.hashAt(1)).to.equal(hash2);
        });

        it("hashAt should revert for out-of-bounds index", async function () {
            await expect(contract.hashAt(0)).to.be.revertedWith(
                "HospitalLogs: index out of bounds"
            );
        });
    });
});

// Return current block timestamp as bigint  
async function latestTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return BigInt(block.timestamp);
}

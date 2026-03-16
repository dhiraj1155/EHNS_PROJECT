// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title HospitalLogs
 * @dev Tamper-proof hospital log registry. Stores SHA-256 hashes of log records
 *      so that any mutation of the off-chain data can be detected by comparing hashes.
 */
contract HospitalLogs {
    // ----- Data ---------------------------------------------------------------

    struct LogEntry {
        bool exists;
        uint256 timestamp;
        address addedBy;
    }

    // hash (bytes32) → LogEntry
    mapping(bytes32 => LogEntry) private _logs;

    // ordered list of hashes for enumeration
    bytes32[] private _hashList;

    // contract owner (deployer)
    address public owner;

    // ----- Events -------------------------------------------------------------

    event LogAdded(bytes32 indexed hash, address indexed addedBy, uint256 timestamp);

    // ----- Modifiers ----------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "HospitalLogs: caller is not owner");
        _;
    }

    // ----- Constructor --------------------------------------------------------

    constructor() {
        owner = msg.sender;
    }

    // ----- Write --------------------------------------------------------------

    /**
     * @notice Store the SHA-256 hash of a hospital log record on chain.
     * @param hash  bytes32 SHA-256 digest of the log JSON
     */
    function addLog(bytes32 hash) external {
        require(hash != bytes32(0), "HospitalLogs: empty hash");
        require(!_logs[hash].exists, "HospitalLogs: hash already recorded");

        _logs[hash] = LogEntry({
            exists: true,
            timestamp: block.timestamp,
            addedBy: msg.sender
        });
        _hashList.push(hash);

        emit LogAdded(hash, msg.sender, block.timestamp);
    }

    // ----- Read ---------------------------------------------------------------

    /**
     * @notice Check whether a hash is on-chain (i.e. the record has not been tampered with).
     * @param hash  bytes32 SHA-256 digest to verify
     * @return verified  true if the hash exists
     * @return timestamp block timestamp when the hash was recorded (0 if not found)
     * @return addedBy   address that recorded the hash (zero address if not found)
     */
    function verifyLog(bytes32 hash)
        external
        view
        returns (
            bool verified,
            uint256 timestamp,
            address addedBy
        )
    {
        LogEntry storage entry = _logs[hash];
        return (entry.exists, entry.timestamp, entry.addedBy);
    }

    /**
     * @notice Return the total number of recorded hashes.
     */
    function totalLogs() external view returns (uint256) {
        return _hashList.length;
    }

    /**
     * @notice Return the hash at a given index.
     */
    function hashAt(uint256 index) external view returns (bytes32) {
        require(index < _hashList.length, "HospitalLogs: index out of bounds");
        return _hashList[index];
    }
}

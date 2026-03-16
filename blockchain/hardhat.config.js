require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },

    networks: {
        // Local Ganache instance
        ganache: {
            url: process.env.GANACHE_URL || "http://127.0.0.1:7545",
            accounts: process.env.GANACHE_PRIVATE_KEY
                ? [process.env.GANACHE_PRIVATE_KEY]
                : [],
            chainId: 1337,
        },

        // Hardhat's built-in ephemeral network (used by tests)
        hardhat: {
            chainId: 31337,
        },
    },

    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

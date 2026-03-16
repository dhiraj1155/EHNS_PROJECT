# Tamper-Proof Hospital Logs 🏥⛓️

A blockchain-anchored hospital logging system. Every record is stored in **MongoDB Atlas** and its SHA-256 hash is written to an **Ethereum smart contract** (via Ganache), making records tamper-evident.

## Architecture

```
React Frontend  →  Node.js/Express Backend  →  MongoDB Atlas
                         │
                         └──→  HospitalLogs.sol (Ganache/Ethereum)
```

## Project Structure

```
Hospital Logs/
├── blockchain/          # Hardhat project + Solidity contract
│   ├── contracts/HospitalLogs.sol
│   ├── scripts/deploy.js
│   ├── test/HospitalLogs.test.js
│   └── hardhat.config.js
├── backend/             # Express API + Ethers.js
│   ├── server.js
│   ├── routes/logs.js
│   ├── models/Log.js
│   ├── services/blockchain.js
│   ├── middleware/auth.js
│   └── .env             ← fill in PRIVATE_KEY + CONTRACT_ADDRESS
└── frontend/            # React app
    └── src/
        ├── pages/Dashboard.jsx
        ├── pages/AddLog.jsx
        ├── pages/AuditLog.jsx
        └── components/Navbar.jsx, LogCard.jsx
```

## First-Run Guide

### Prerequisites
- [Ganache UI](https://trufflesuite.com/ganache/) running on Mac (`http://127.0.0.1:7545`, port 7545)
- Node.js 18+

### Step 1 — Compile & Deploy Smart Contract

```bash
# Copy your Ganache private key (🔑 icon in Ganache UI) into blockchain/.env
cp blockchain/.env.example blockchain/.env

cd blockchain
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache
# → Copy the printed contract address
```

### Step 2 — Configure Backend

```bash
# Paste the contract address from Step 1
# (backend/.env already has your MongoDB URI pre-filled)
nano backend/.env   # set PRIVATE_KEY and CONTRACT_ADDRESS
```

Then copy the compiled contract ABI to the backend:

```bash
cd backend
npm install
npm run copy-abi
node server.js
# → Backend running at http://localhost:5000
```

### Step 3 — Start Frontend

```bash
cd frontend
npm install
npm start
# → App running at http://localhost:3000
```

### Step 4 — Run Tests

```bash
cd blockchain
npx hardhat test
```

## API Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/logs` | doctor, admin | Create a new log |
| `GET` | `/api/logs` | any | List logs (filter: patientId, doctorId, logType) |
| `GET` | `/api/logs/:id` | any | Get single log |
| `GET` | `/api/logs/:id/verify` | any | Verify hash on-chain |
| `GET` | `/api/health` | — | Health check |

Pass `X-Role: doctor` (or `auditor`/`admin`) header with every request.

## Roles

| Role | Create | Read | Verify |
|------|--------|------|--------|
| `doctor` | ✅ | ✅ | ✅ |
| `auditor` | ❌ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ |

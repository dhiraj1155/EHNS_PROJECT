const { ethers } = require("hardhat");

async function main() {
  console.log("🚀  Deploying HospitalLogs contract to Ganache...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer address : ${deployer.address}`);
  console.log(`   Account balance  : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const HospitalLogs = await ethers.getContractFactory("HospitalLogs");
  const hospitalLogs = await HospitalLogs.deploy();
  await hospitalLogs.waitForDeployment();

  const address = await hospitalLogs.getAddress();

  console.log("✅  HospitalLogs deployed successfully!");
  console.log(`   Contract address : ${address}\n`);
  console.log("📋  Next step:");
  console.log(`   Copy the address above and set CONTRACT_ADDRESS=${address}`);
  console.log("   in your  backend/.env  file.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌  Deployment failed:", error);
    process.exit(1);
  });

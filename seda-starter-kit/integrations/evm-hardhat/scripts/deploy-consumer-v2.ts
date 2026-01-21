import { ethers } from "hardhat";

function requireAddress(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Missing ${label}`);
  }
  if (!ethers.isAddress(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return value;
}

async function main() {
  const oracleProgramId = process.env.ORACLE_PROGRAM_ID;
  if (!oracleProgramId) {
    throw new Error("Missing ORACLE_PROGRAM_ID");
  }
  const relayer = requireAddress(process.env.CONSUMER_RELAYER_ADDRESS, "CONSUMER_RELAYER_ADDRESS");
  const staleSeconds = process.env.CONSUMER_STALE_SECONDS
    ? Number.parseInt(process.env.CONSUMER_STALE_SECONDS, 10)
    : 60;

  const factory = await ethers.getContractFactory("SEDAOracleConsumerV2");
  const consumer = await factory.deploy(oracleProgramId, relayer, staleSeconds);
  await consumer.waitForDeployment();

  const address = await consumer.getAddress();
  console.log("SEDAOracleConsumerV2 deployed:");
  console.log(`- address: ${address}`);
  console.log(`- oracleProgramId: ${oracleProgramId}`);
  console.log(`- relayer: ${relayer}`);
  console.log(`- staleSeconds: ${staleSeconds}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

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
  const [deployer] = await ethers.getSigners();

  const adminEnv = process.env.USX402_ADMIN_ADDRESS;
  const minterEnv = process.env.USX402_MINTER_ADDRESS;

  const admin = adminEnv ? requireAddress(adminEnv, "USX402_ADMIN_ADDRESS") : deployer.address;
  const minter = minterEnv ? requireAddress(minterEnv, "USX402_MINTER_ADDRESS") : deployer.address;

  const factory = await ethers.getContractFactory("USX402");
  const contract = await factory.deploy(admin, minter);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("USX402 deployed:");
  console.log(`- address: ${address}`);
  console.log(`- admin:   ${admin}`);
  console.log(`- minter:  ${minter}`);
  console.log(`- deployer:${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

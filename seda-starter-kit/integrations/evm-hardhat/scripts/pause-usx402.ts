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
  const contractAddress = requireAddress(process.env.USX402_ADDRESS, "USX402_ADDRESS");
  const token = await ethers.getContractAt("USX402", contractAddress);

  const tx = await token.pause();
  await tx.wait();

  console.log("USX402 paused");
  console.log(`- contract: ${contractAddress}`);
  console.log(`- tx: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

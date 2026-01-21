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

function requireAmount(value: string | undefined): bigint {
  if (!value) {
    throw new Error("Missing USX402_AMOUNT");
  }
  return ethers.parseUnits(value, 18);
}

async function main() {
  const contractAddress = requireAddress(process.env.USX402_ADDRESS, "USX402_ADDRESS");
  const from = requireAddress(process.env.USX402_FROM_ADDRESS, "USX402_FROM_ADDRESS");
  const amount = requireAmount(process.env.USX402_AMOUNT);

  const token = await ethers.getContractAt("USX402", contractAddress);
  const tx = await token.burn(from, amount);
  await tx.wait();

  console.log("Burned USX402");
  console.log(`- from: ${from}`);
  console.log(`- amount: ${ethers.formatUnits(amount, 18)}`);
  console.log(`- tx: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

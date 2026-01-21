import { ethers, run } from "hardhat";

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
  const admin = requireAddress(process.env.USX402_ADMIN_ADDRESS, "USX402_ADMIN_ADDRESS");
  const minter = requireAddress(process.env.USX402_MINTER_ADDRESS, "USX402_MINTER_ADDRESS");

  await run("verify:verify", {
    address: contractAddress,
    constructorArguments: [admin, minter],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

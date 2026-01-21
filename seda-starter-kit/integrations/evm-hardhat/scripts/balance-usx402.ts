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
  const account = process.env.USX402_ACCOUNT_ADDRESS
    ? requireAddress(process.env.USX402_ACCOUNT_ADDRESS, "USX402_ACCOUNT_ADDRESS")
    : (await ethers.getSigners())[0].address;

  const token = await ethers.getContractAt("USX402", contractAddress);

  const [name, symbol, decimals, paused, balance] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.paused(),
    token.balanceOf(account),
  ]);

  console.log("USX402 status");
  console.log(`- contract: ${contractAddress}`);
  console.log(`- account:  ${account}`);
  console.log(`- name:     ${name}`);
  console.log(`- symbol:   ${symbol}`);
  console.log(`- decimals: ${decimals}`);
  console.log(`- paused:   ${paused}`);
  console.log(`- balance:  ${ethers.formatUnits(balance, decimals)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

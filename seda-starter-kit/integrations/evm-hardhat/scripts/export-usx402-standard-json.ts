import fs from "node:fs";
import path from "node:path";

function findBuildInfoInput(buildInfoDir: string) {
  const files = fs.readdirSync(buildInfoDir).filter((file) => file.endsWith(".json"));
  for (const file of files) {
    const filePath = path.join(buildInfoDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (data?.input?.sources?.["contracts/USX402.sol"]) {
      return data.input;
    }
  }
  return null;
}

async function main() {
  const buildInfoDir = path.join(__dirname, "../artifacts/build-info");
  if (!fs.existsSync(buildInfoDir)) {
    throw new Error("Missing artifacts/build-info. Run `bun run compile` first.");
  }

  const input = findBuildInfoInput(buildInfoDir);
  if (!input) {
    throw new Error("USX402 build info not found. Recompile and try again.");
  }

  const outPath = path.join(__dirname, "../usx402-standard.json");
  fs.writeFileSync(outPath, JSON.stringify(input, null, 2));
  console.log(`Wrote standard JSON input to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

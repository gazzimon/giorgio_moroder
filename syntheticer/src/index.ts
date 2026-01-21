import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { ethers } from 'ethers';

type PayResult = {
  paymentTx: string;
  payer?: string;
  amountUSDC?: string;
  amountTCRO?: string;
  feeUSDC?: string;
  pair?: string;
};

type MintRequest = {
  payResult?: PayResult;
};

const CRONOS_RPC_URL = process.env.CRONOS_RPC_URL ?? '';
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY ?? '';
const USX402_ADDRESS = process.env.USX402_ADDRESS ?? '';
const SEDA_ORACLE_CONSUMER_ADDRESS = process.env.SEDA_ORACLE_CONSUMER_ADDRESS ?? '';
const USDC_ADDRESS = process.env.USDC_ADDRESS ?? '';
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS ?? '';
const STALE_SECONDS = process.env.STALE_SECONDS ? Number.parseInt(process.env.STALE_SECONDS, 10) : 0;
const PROCESSED_LOG_PATH =
  process.env.PROCESSED_LOG_PATH ?? path.resolve(process.cwd(), 'processed.jsonl');
const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8788;

const USDC_DECIMALS = 6n;
const TCRO_DECIMALS = 18n;
const CONFIDENCE_MIN = 950_000n;
const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');

const consumerAbi = [
  'function getLatest(bytes32 pair) view returns (int256[4])',
  'function getLatestWithMeta(bytes32 pair) view returns (int256[4] values, bytes32 requestId, uint256 updatedAt, uint64 seq)',
  'function isStale(bytes32 pair) view returns (bool)',
  'function staleSeconds() view returns (uint256)',
];

const tokenAbi = ['function mint(address to, uint256 amount)'];

function requireEnv(value: string, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function parseAmount(value: string | undefined, label: string): bigint {
  if (!value) return 0n;
  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return BigInt(value);
}

function loadProcessed(): Set<string> {
  if (!fs.existsSync(PROCESSED_LOG_PATH)) {
    return new Set();
  }
  const lines = fs.readFileSync(PROCESSED_LOG_PATH, 'utf8').split('\n').filter(Boolean);
  const set = new Set<string>();
  for (const line of lines) {
    try {
      const record = JSON.parse(line) as { paymentTx?: string };
      if (record.paymentTx) {
        set.add(record.paymentTx.toLowerCase());
      }
    } catch {
      // Ignore malformed lines.
    }
  }
  return set;
}

function appendProcessed(record: Record<string, unknown>) {
  fs.appendFileSync(PROCESSED_LOG_PATH, `${JSON.stringify(record)}\n`);
}

function normalizePair(pair: string): string {
  return pair.trim().toUpperCase();
}

function readPayerFromTransfer(
  receipt: ethers.TransactionReceipt,
  amountUSDC: bigint,
  tokenAddress: string,
  treasuryAddress: string,
): string | null {
  const token = tokenAddress.toLowerCase();
  const treasury = treasuryAddress.toLowerCase();
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== token) continue;
    if (!log.topics || log.topics.length < 3) continue;
    if (log.topics[0] !== TRANSFER_TOPIC) continue;
    const from = ethers.getAddress(`0x${log.topics[1].slice(26)}`);
    const to = ethers.getAddress(`0x${log.topics[2].slice(26)}`);
    if (to.toLowerCase() !== treasury) continue;
    const value = BigInt(log.data);
    if (value !== amountUSDC) continue;
    return from;
  }
  return null;
}

async function main() {
  requireEnv(CRONOS_RPC_URL, 'CRONOS_RPC_URL');
  requireEnv(RELAYER_PRIVATE_KEY, 'RELAYER_PRIVATE_KEY');
  requireEnv(USX402_ADDRESS, 'USX402_ADDRESS');
  requireEnv(SEDA_ORACLE_CONSUMER_ADDRESS, 'SEDA_ORACLE_CONSUMER_ADDRESS');
  requireEnv(USDC_ADDRESS, 'USDC_ADDRESS');
  requireEnv(TREASURY_ADDRESS, 'TREASURY_ADDRESS');

  const provider = new ethers.JsonRpcProvider(CRONOS_RPC_URL);
  const wallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
  const consumer = new ethers.Contract(SEDA_ORACLE_CONSUMER_ADDRESS, consumerAbi, provider);
  const usx402 = new ethers.Contract(USX402_ADDRESS, tokenAbi, wallet);

  const processed = loadProcessed();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/mint', async (req, res) => {
    try {
      const payload = req.body as MintRequest;
      const pay = payload.payResult;
      if (!pay) {
        return res.status(400).json({ error: 'missing payResult' });
      }

      if (!pay.paymentTx || !/^0x[0-9a-fA-F]{64}$/.test(pay.paymentTx)) {
        return res.status(400).json({ error: 'invalid paymentTx' });
      }

      const pair = normalizePair(pay.pair ?? '');
      if (!pair) {
        return res.status(400).json({ error: 'missing pair' });
      }

      const amountUSDC = parseAmount(pay.amountUSDC, 'amountUSDC');
      const amountTCRO = parseAmount(pay.amountTCRO, 'amountTCRO');
      const feeUSDC = parseAmount(pay.feeUSDC, 'feeUSDC');

      if (amountUSDC <= 0n) {
        return res.status(400).json({ error: 'amountUSDC must be > 0' });
      }

      const key = pay.paymentTx.toLowerCase();
      if (processed.has(key)) {
        return res.status(409).json({ error: 'paymentTx already processed' });
      }

      const receipt = await provider.getTransactionReceipt(pay.paymentTx);
      if (!receipt || receipt.status !== 1) {
        return res.status(400).json({ error: 'paymentTx not confirmed' });
      }
      const payerFromTransfer = readPayerFromTransfer(
        receipt,
        amountUSDC,
        USDC_ADDRESS,
        TREASURY_ADDRESS,
      );
      if (!payerFromTransfer) {
        return res.status(400).json({ error: 'paymentTx missing USDC transfer' });
      }
      if (pay.payer && ethers.isAddress(pay.payer)) {
        if (pay.payer.toLowerCase() !== payerFromTransfer.toLowerCase()) {
          return res.status(400).json({ error: 'paymentTx payer mismatch' });
        }
      }
      const payer = payerFromTransfer;

      const pairHash = ethers.keccak256(ethers.toUtf8Bytes(pair));
      const [values, requestId, updatedAt, seq] = await consumer.getLatestWithMeta(pairHash);
      const isStale = await consumer.isStale(pairHash);

      if (isStale) {
        return res.status(400).json({ error: 'oracle stale' });
      }
      if (STALE_SECONDS > 0 && updatedAt > 0n) {
        const now = BigInt(Math.floor(Date.now() / 1000));
        if (now - updatedAt > BigInt(STALE_SECONDS)) {
          return res.status(400).json({ error: 'oracle stale (local)' });
        }
      }

      const fairPrice = BigInt(values[0]);
      const confidence = BigInt(values[1]);
      const maxSize = BigInt(values[2]);
      const flags = BigInt(values[3]);

      if (flags !== 0n) {
        return res.status(400).json({ error: 'oracle flags' });
      }
      if (confidence <= CONFIDENCE_MIN) {
        return res.status(400).json({ error: 'oracle confidence too low' });
      }
      if (maxSize < 0n) {
        return res.status(400).json({ error: 'oracle max size invalid' });
      }
      if (fairPrice <= 0n) {
        return res.status(400).json({ error: 'oracle price invalid' });
      }

      const usdcFromTcro = (amountTCRO * fairPrice) / 10n ** TCRO_DECIMALS;
      const totalUsdc = amountUSDC + usdcFromTcro;
      if (totalUsdc <= feeUSDC) {
        return res.status(400).json({ error: 'effective input <= 0' });
      }
      const effectiveInput = totalUsdc - feeUSDC;
      if (effectiveInput > maxSize) {
        return res.status(400).json({ error: 'exceeds max safe size' });
      }

      const mintAmount = effectiveInput * 10n ** (TCRO_DECIMALS - USDC_DECIMALS);

      const tx = await usx402.mint(payer, mintAmount);
      const receiptMint = await tx.wait();
      const mintTx = receiptMint?.hash ?? tx.hash;

      processed.add(key);
      appendProcessed({
        paymentTx: pay.paymentTx,
        mintTx,
        payer,
        pair,
        requestId,
        seq: seq.toString(),
        effectiveInput: effectiveInput.toString(),
        at: new Date().toISOString(),
      });

      return res.json({
        payer,
        paymentTx: pay.paymentTx,
        pair,
        total_usdc_equivalent: totalUsdc.toString(),
        fee_usdc: feeUSDC.toString(),
        effective_input_usdc: effectiveInput.toString(),
        minted_usx402: effectiveInput.toString(),
        mintTx,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.listen(PORT, () => {
    console.log(`syntheticer listening on ${PORT}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

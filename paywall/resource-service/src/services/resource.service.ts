import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ethers } from 'ethers';
import { Facilitator, CronosNetwork, PaymentRequirements } from '@crypto.com/facilitator-client';
import { handleX402Payment } from '../lib/middlewares/require.middleware.js';

const NETWORK = (process.env.NETWORK ?? 'cronos-testnet') as CronosNetwork;
const CRONOS_RPC_URL = process.env.CRONOS_RPC_URL ?? '';
const CONSUMER_ADDRESS = process.env.CONSUMER_ADDRESS ?? '';
const SEDA_EXPLORER_BASE = process.env.SEDA_EXPLORER_BASE ?? 'https://testnet.explorer.seda.xyz';
const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ROOT = path.resolve(CURRENT_DIR, '..', '..');
const REPO_ROOT = path.resolve(SERVICE_ROOT, '..', '..');
const DEFAULT_RELAYER_STATE_PATH = path.resolve(
  REPO_ROOT,
  'seda-starter-kit',
  'relayer',
  '.relayer-state.json'
);
const DEFAULT_SEDA_STARTER_KIT_PATH = path.resolve(REPO_ROOT, 'seda-starter-kit');
const RELAYER_STATE_PATH = process.env.RELAYER_STATE_PATH ?? DEFAULT_RELAYER_STATE_PATH;
const SEDA_STARTER_KIT_PATH = process.env.SEDA_STARTER_KIT_PATH ?? DEFAULT_SEDA_STARTER_KIT_PATH;
const PAYMENT_LOG_PATH =
  process.env.PAYMENT_LOG_PATH ?? path.resolve(process.cwd(), 'payment-processed.jsonl');
const SYNTHETICER_URL = process.env.SYNTHETICER_URL ?? '';

const consumerAbi = [
  'function getLatest(bytes32) view returns (int256[4])',
  'function getLatestRequestId(bytes32) view returns (bytes32)',
];

type RelayerState = {
  lastByPair?: Record<
    string,
    {
      requestId?: string;
      drBlockHeight?: number;
      txHash?: string;
      updatedAt?: string;
      values?: {
        fairPriceScaled: string;
        fairPrice: string;
        confidenceScoreScaled: string;
        confidenceScore: string;
        maxSafeExecutionSizeScaled: string;
        maxSafeExecutionSize: string;
        flags: string;
        decimals: number;
      };
    }
  >;
};

function loadRelayerState(): RelayerState {
  if (!fs.existsSync(RELAYER_STATE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(RELAYER_STATE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

type RelayerPairMeta = NonNullable<RelayerState['lastByPair']>[string];

function pickLatestPair(
  state: RelayerState,
  preferredPair: string
): { pair: string; meta: RelayerPairMeta } | null {
  const lastByPair = state.lastByPair ?? {};
  const preferred = lastByPair[preferredPair];
  if (preferred) {
    return { pair: preferredPair, meta: preferred };
  }
  const entries = Object.entries(lastByPair)
    .filter(([, value]) => value)
    .sort(([, left], [, right]) => {
      const leftTime = left?.updatedAt ? Date.parse(left.updatedAt) : 0;
      const rightTime = right?.updatedAt ? Date.parse(right.updatedAt) : 0;
      return rightTime - leftTime;
    });
  if (!entries.length) return null;
  const [pair, meta] = entries[0];
  return { pair, meta };
}

function extractPairFromRequirements(paymentRequirements: PaymentRequirements): string | null {
  const resource = (paymentRequirements as { resource?: string }).resource;
  if (!resource) return null;
  try {
    const url = new URL(resource, 'http://localhost');
    const pair = url.searchParams.get('pair');
    return pair ? pair.toUpperCase() : null;
  } catch {
    return null;
  }
}

function runPostDrRelay(pair: string): Promise<void> {
  const env = { ...process.env, EXEC_INPUTS: JSON.stringify({ pair }) };
  return new Promise((resolve, reject) => {
    console.info('[x402] post-dr-relay start', {
      pair,
      cwd: SEDA_STARTER_KIT_PATH,
      execInputs: env.EXEC_INPUTS,
      relayerStatePath: RELAYER_STATE_PATH,
    });
    const proc = spawn('bun', ['run', 'post-dr-relay'], {
      cwd: SEDA_STARTER_KIT_PATH,
      env,
      stdio: 'inherit',
    });
    proc.on('error', reject);
    proc.on('exit', (code) => {
      console.info('[x402] post-dr-relay exit', { pair, code });
      if (code === 0) resolve();
      else reject(new Error(`post-dr-relay failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

async function triggerSyntheticer(payload: Record<string, unknown>): Promise<void> {
  if (!SYNTHETICER_URL) return;
  try {
    const res = await fetch(SYNTHETICER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payResult: payload }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.warn('[x402] syntheticer rejected', { status: res.status, body });
    } else {
      const body = await res.json().catch(() => ({}));
      console.info('[x402] syntheticer ok', body);
    }
  } catch (error) {
    console.warn('[x402] syntheticer request failed', error);
  }
}

function formatScaled(value: bigint, decimals: number): string {
  const base = BigInt(10 ** decimals);
  const integer = value / base;
  const fraction = (value % base).toString().padStart(decimals, '0');
  return `${integer.toString()}.${fraction}`;
}

/**
 * Service layer for entitlement-gated resources and X402 payment settlement.
 *
 * Responsibilities:
 * - Configure and manage the Facilitator SDK client.
 * - Settle X402 payments and store resulting entitlements.
 * - Produce payloads for entitled (paid) resources.
 *
 * @remarks
 * The Cronos network is resolved from `process.env.NETWORK` and defaults to
 * `"cronos-testnet"`. Ensure this value matches a supported
 * {@link CronosNetwork} at runtime.
 */
export class ResourceService {
  /**
   * Facilitator SDK client configured for the selected Cronos network.
   *
   * @privateRemarks
   * Instantiated eagerly. For improved testability, this may be injected
   * via the constructor instead.
   */
  private facilitator = new Facilitator({ network: NETWORK });
  private provider: ethers.JsonRpcProvider | null = null;
  private consumer: ethers.Contract | null = null;

  private getConsumer(): ethers.Contract {
    if (!CRONOS_RPC_URL || !CONSUMER_ADDRESS) {
      throw new Error('Missing CRONOS_RPC_URL or CONSUMER_ADDRESS');
    }
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(CRONOS_RPC_URL);
    }
    if (!this.consumer) {
      this.consumer = new ethers.Contract(CONSUMER_ADDRESS, consumerAbi, this.provider);
    }
    return this.consumer;
  }

  /**
   * Returns the payload for an entitled user.
   *
   * This method does not perform entitlement checks itself; it assumes
   * payment verification has already been completed upstream.
   *
   * @returns An object representing the unlocked/paid content response.
   */
  async getSecretPayload(pair: string) {
    const state = loadRelayerState();
    const meta = state.lastByPair?.[pair];
    let chainValues: bigint[] | null = null;
    let requestIdOnChain: string | null = null;

    try {
      const consumer = this.getConsumer();
      const pairKey = ethers.keccak256(ethers.toUtf8Bytes(pair));
      const [values, requestId] = await Promise.all([
        consumer.getLatest(pairKey),
        consumer.getLatestRequestId(pairKey),
      ]);
      chainValues = (values as bigint[]).map((value) => BigInt(value.toString()));
      requestIdOnChain = requestId?.toString?.() ?? null;
    } catch (error) {
      if (!meta?.values) {
        throw error;
      }
    }

    const metaValues = meta?.values;
    const decimals = metaValues?.decimals ?? 6;

    const [fairPrice, confidence, maxSize, flags] =
      metaValues && metaValues.fairPriceScaled
        ? [
            BigInt(metaValues.fairPriceScaled),
            BigInt(metaValues.confidenceScoreScaled),
            BigInt(metaValues.maxSafeExecutionSizeScaled),
            BigInt(metaValues.flags),
          ]
        : chainValues ?? [BigInt(0), BigInt(0), BigInt(0), BigInt(0)];

    const drId = meta?.requestId ?? stripHexPrefix(requestIdOnChain ?? '');
    const drBlockHeight = meta?.drBlockHeight ?? null;
    const sedaExplorerUrl =
      drId && drBlockHeight
        ? `${SEDA_EXPLORER_BASE}/data-requests/${drId}/${drBlockHeight}`
        : null;

    return {
      ok: true,
      pair,
      fairPriceScaled: metaValues?.fairPriceScaled ?? fairPrice.toString(),
      fairPrice: metaValues?.fairPrice ?? formatScaled(fairPrice, decimals),
      confidenceScoreScaled: metaValues?.confidenceScoreScaled ?? confidence.toString(),
      confidenceScore: metaValues?.confidenceScore ?? formatScaled(confidence, decimals),
      maxSafeExecutionSizeScaled: metaValues?.maxSafeExecutionSizeScaled ?? maxSize.toString(),
      maxSafeExecutionSize: metaValues?.maxSafeExecutionSize ?? formatScaled(maxSize, decimals),
      flags: metaValues?.flags ?? flags.toString(),
      decimals,
      sedaExplorerUrl,
      sedaRequestId: drId || null,
      cronosTxHash: meta?.txHash ?? null,
      relayedAt: meta?.updatedAt ?? null,
    };
  }

  /**
   * Returns the latest relayed payload without requiring payment.
   */
  async getLatestPayload(pair: string) {
    const state = loadRelayerState();
    const latest = pickLatestPair(state, pair);
    if (!latest) {
      return { ok: false, error: 'no relayer data' };
    }
    const { meta } = latest;
    const metaValues = meta.values;

    let chainValues: bigint[] | null = null;
    let requestIdOnChain: string | null = null;
    if (!metaValues) {
      try {
        const consumer = this.getConsumer();
        const pairKey = ethers.keccak256(ethers.toUtf8Bytes(latest.pair));
        const [values, requestId] = await Promise.all([
          consumer.getLatest(pairKey),
          consumer.getLatestRequestId(pairKey),
        ]);
        chainValues = (values as bigint[]).map((value) => BigInt(value.toString()));
        requestIdOnChain = requestId?.toString?.() ?? null;
      } catch {
        // If chain read fails and no relayer values exist, still return placeholders.
      }
    }

    const decimals = metaValues?.decimals ?? 6;
    const [fairPrice, confidence, maxSize, flags] =
      metaValues && metaValues.fairPriceScaled
        ? [
            BigInt(metaValues.fairPriceScaled),
            BigInt(metaValues.confidenceScoreScaled),
            BigInt(metaValues.maxSafeExecutionSizeScaled),
            BigInt(metaValues.flags),
          ]
        : chainValues ?? [BigInt(0), BigInt(0), BigInt(0), BigInt(0)];

    const drId = meta?.requestId ?? stripHexPrefix(requestIdOnChain ?? '');
    const drBlockHeight = meta?.drBlockHeight ?? null;
    const sedaExplorerUrl =
      drId && drBlockHeight
        ? `${SEDA_EXPLORER_BASE}/data-requests/${drId}/${drBlockHeight}`
        : null;

    return {
      ok: true,
      pair: latest.pair,
      fairPriceScaled: metaValues?.fairPriceScaled ?? fairPrice.toString(),
      fairPrice: metaValues?.fairPrice ?? formatScaled(fairPrice, decimals),
      confidenceScoreScaled: metaValues?.confidenceScoreScaled ?? confidence.toString(),
      confidenceScore: metaValues?.confidenceScore ?? formatScaled(confidence, decimals),
      maxSafeExecutionSizeScaled: metaValues?.maxSafeExecutionSizeScaled ?? maxSize.toString(),
      maxSafeExecutionSize: metaValues?.maxSafeExecutionSize ?? formatScaled(maxSize, decimals),
      flags: metaValues?.flags ?? flags.toString(),
      decimals,
      sedaExplorerUrl,
      sedaRequestId: drId || null,
      cronosTxHash: meta?.txHash ?? null,
      relayedAt: meta?.updatedAt ?? null,
    };
  }

  /**
   * Settles an X402 payment using the Facilitator SDK.
   *
   * This delegates verification and settlement to the shared
   * {@link handleX402Payment} helper.
   *
   * @param params - Payment settlement parameters.
   * @param params.paymentId - Unique identifier for the payment.
   * @param params.paymentHeader - Encoded payment header provided by the client.
   * @param params.paymentRequirements - Requirements returned by a prior 402 challenge.
   * @returns The settlement result as returned by {@link handleX402Payment}.
   * @throws Re-throws any error raised by the underlying settlement helper or SDK.
   */
  async settlePayment(params: {
    paymentId: string;
    paymentHeader: string;
    paymentRequirements: PaymentRequirements;
    amountUSDC?: string;
    amountTCRO?: string;
  }) {
    console.info('[x402] settlePayment start', {
      paymentId: params.paymentId,
      resource: (params.paymentRequirements as { resource?: string }).resource,
      amountUSDC: params.amountUSDC,
      amountTCRO: params.amountTCRO,
    });
    const pair = extractPairFromRequirements(params.paymentRequirements);
    const feeUSDC = extractFeeUSDC(params.paymentRequirements);
    const result = await handleX402Payment({
      facilitator: this.facilitator,
      paymentId: params.paymentId,
      paymentHeader: params.paymentHeader,
      paymentRequirements: params.paymentRequirements,
      amountUSDC: params.amountUSDC,
      amountTCRO: params.amountTCRO,
      feeUSDC,
      pair,
    });
    console.info('[x402] settlePayment result', { ok: result.ok, paymentId: params.paymentId });
      if (result.ok) {
        console.info('[x402] derived pair', { pair });
        const payResult = {
          paymentId: params.paymentId,
          paymentTx: result.txHash ?? null,
          payer: result.payer ?? null,
          amountUSDC: result.amountUSDC ?? null,
          amountTCRO: result.amountTCRO ?? null,
          feeUSDC: result.feeUSDC ?? null,
          pair: result.pair ?? pair ?? null,
          at: new Date().toISOString(),
        };
        appendPaymentLog(payResult);
        if (pair) {
          await runPostDrRelay(pair);
        }
        if (payResult.paymentTx) {
          await triggerSyntheticer(payResult);
        } else {
          console.warn('[x402] syntheticer skipped (missing paymentTx)');
        }
      }
    return result;
  }
}

function stripHexPrefix(value: string): string {
  return value.startsWith('0x') ? value.slice(2) : value;
}

function extractFeeUSDC(paymentRequirements: PaymentRequirements): string | undefined {
  const extra = (paymentRequirements as { extra?: Record<string, unknown> }).extra;
  if (!extra || typeof extra !== 'object') return undefined;
  const value = extra.feeUSDC;
  return typeof value === 'string' ? value : undefined;
}

function appendPaymentLog(record: Record<string, unknown>) {
  try {
    fs.appendFileSync(PAYMENT_LOG_PATH, `${JSON.stringify(record)}\n`);
  } catch (error) {
    console.warn('[x402] payment log append failed', error);
  }
}

# Giorgio Moroder (USX402)

## TL;DR
Giorgio Moroder is a paid, execution-grade oracle and policy engine for liquidity management on Cronos. It uses SEDA for decentralized computation, x402 for pay-per-execution gating, and Cronos for settlement. The system mints USX402, a synthetic execution claim that represents a share in algorithmically managed LP capital, enabling passive users to earn yield while the protocol enforces deterministic risk policies.

## Product Summary
Giorgio Moroder is an algorithmic manager on Cronos that optimizes liquidity ranges on VVS Finance. It uses SEDA oracles and x402 payments to mitigate impermanent loss through dynamic strategies (Steady/Wild). Capital is tokenized into USX402, a liquid and efficient execution derivative. It combines decentralized oracle computation (SEDA), HTTP 402 payment gating (x402), and settlement on Cronos EVM.

## Problem
In traditional finance, people delegate savings to managers and let professionals control risk and returns.

In crypto, earning yield typically requires users to understand and actively manage LP positions, vaults, rebalancing, slippage, liquidity depth, and volatility risk. As a result, many users keep assets idle because they lack the expertise or the time to manage these strategies safely.

## Solution
GIORGIO MORODER introduces a new DeFi primitive:

Execution-Grade Oracles + Paid Execution

This inverted workflow is made possible by x402 payment gating:
- Explicitly charges for execution-grade intelligence
- Computes deterministic risk envelopes
- Mints USX402 synthetic assets
- Manages user capital across one or more selected LP strategies intelligently, so users with limited LP experience can earn yield passively while the system manages actively under strict policies

## User Flow
### 1) Execution Gateway (x402)
- Users or autonomous agents request execution via HTTP.
- Execution is gated by payment using the x402 protocol.
- No payment, no computation, no execution.
- This model prevents spam and enables native economic sustainability.

### 2) Oracle Computation (SEDA Network)
- Payment triggers decentralized recomputation on SEDA.
- An Oracle Program computes a Risk Envelope based on:
  - Spot price
  - Historical price (TWAP / time window)
  - Real liquidity depth
  - Expected slippage
  - Implied volatility
- The result is finalized by SEDA consensus and verifiable in the SEDA Explorer.

### 3) Settlement and Capital Deployment (Cronos EVM)
- The finalized result is anchored on Cronos via a relayer.
- USX402 synthetic assets are minted, representing:
  - A redeemable claim over capital deployed into LP strategies (e.g., WCRO/USDC)
- Capital is managed according to the defined policies.

### 4) Policy Engine (Deterministic)
- Oracle output does not execute anything by itself.
- A deterministic policy engine enforces explicit rules:
  - Minimum confidence thresholds
  - Risk flags
  - Maximum allowed execution size
- Execution is authorized only if all conditions are satisfied.

## Key Feature
x402 is used as the execution gate that turns oracle computation into a paid, demand-driven service:
- Prevents spam and unnecessary recomputations
- Enforces pay-per-execution economics
- Aligns incentives across users, agents, and oracle operators
- Makes the system sustainable without subsidized, always-on feeds

## Target Users
- People new to blockchain who want a simpler way to earn yield
- Users who want automation for yield without learning LP or vault mechanics
- Anyone who wants fewer manual steps and safer guardrails when managing funds

## Key Innovation
### Oracle Output
```json
{
  "fair_price": 1.0234,
  "confidence_score": 0.98,
  "max_safe_execution_size": 150000,
  "flags": 0
}
```

Each field has a clear execution meaning:
- fair_price: reference value for pricing or collateralization
- confidence_score: reliability of the signal under current conditions
- max_safe_execution_size: capital sizing constraint derived from liquidity and slippage
- flags: machine-readable risk conditions

## USX402: Synthetic Execution Claim
USX402 is not a stablecoin and does not promise a fixed peg.

### 1) What Is It, Technically?
USX402 is a Synthetic Execution Derivative implemented as an ERC-20 token. Unlike traditional DEX deposits, where users receive a liquidity position NFT, this token represents a proportional share in an algorithmically managed execution strategy.

### 2) The Three Core Functions of USX402
**A. Fungibilization of Concentrated Liquidity**
In protocols such as VVS Finance or Uniswap V3, liquidity positions are issued as NFTs because each provider selects a different price range. This makes them difficult to reuse or integrate across other protocols.

Why this matters: USX402 transforms these complex, unique positions into a standard, fungible token. All USX402 holders share the same optimized strategy, allowing the asset to remain liquid, transferable, and composable.

**B. Execution-Driven Appreciation (Yield-Bearing)**
USX402 does not have a fixed value of 1 USD and is not a stablecoin.

Why this matters: Its value appreciates relative to the underlying assets (e.g., WCRO/USDC) as the strategy generates swap fees that are automatically reinvested. Yield emerges as a direct consequence of execution quality enforced by the policy engine.

**C. Conditional Redemption Right**
Holding USX402 grants a conditional claim on protocol-managed capital.

Why this matters: It enables users to exit the strategy by burning the token in exchange for the corresponding value in underlying assets. However, redemption is risk-aware: the system evaluates liquidity conditions and risk signals before releasing funds, protecting remaining participants from adverse exits.

## Deployments (Cronos Testnet)
| Component | Address / ID | Notes |
| --- | --- | --- |
| Consumer Contract (Oracle Consumer / PriceFeed) | `0xa72b8114599a108F596A77647b9dC3078CBfF172` | Cronos testnet settlement target used by relayer and paywall |
| USX402 Contract | `0x615bE11687f4de1676D5a0171b8bF9e3d0D55014` | Synthetic execution claim token |
| x402 Merchant (Pay-to Address) | `0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec` | Receives x402 payments |
| SEDA Oracle Program ID | `0x61d26d8e7693b39a4296e1ecba45595bc7cdbbeecb1043c7034c8f99498f1504` | Execution program ID (SEDA testnet) |
| SEDA Core Contract (CosmWasm) | `seda1gg6f95cymcfrfzhpek7cf5wl53t5kng52cd2m0krgdlu8k58vd8qfjmalm` | SEDA testnet core |

Explorer links:
```
Cronos testnet consumer: https://explorer.cronos.org/testnet/address/0xa72b8114599a108F596A77647b9dC3078CBfF172
Cronos testnet merchant: https://explorer.cronos.org/testnet/address/0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec
Cronos testnet USX402:   https://explorer.cronos.org/testnet/address/0x615bE11687f4de1676D5a0171b8bF9e3d0D55014
SEDA Explorer (DR):      https://testnet.explorer.seda.xyz/data-requests/ba65b51684c798468ef9282cf245d96d45942beeec73a0b73c5c607ca768ed15/7299903
```

## Build Status (Hackathon)
- Oracle Program deployed on SEDA testnet
- Results verifiable on the SEDA Explorer
- Consumer Contract deployed on Cronos testnet
- Functional x402 Execution Gateway
- Demonstrable end-to-end flow

## Validation Checklist (Testnet)
SEDA Explorer:
```
https://testnet.explorer.seda.xyz/data-requests/ba65b51684c798468ef9282cf245d96d45942beeec73a0b73c5c607ca768ed15/7299903
```
Relayer Transaction (Cronos testnet):
```
https://explorer.cronos.org/testnet/address/0xe0f946b25e4cce13fef052cc76573fa8df74d9d9
```
Observed values (1e6 scale):
- values[0] = 102308 -> 0.102308 (fair_price)
- values[1] = 943288 -> 0.943288 (confidence_score)
- values[2] = 26581068577 -> 26581.068577 (max_safe_execution_size)
- values[3] = 0 (flags)

## System Overview
This repository contains the core execution infrastructure for Giorgio Moroder. It is responsible for observing market conditions off-chain and deterministically authorizing on-chain actions.

Unlike a standard backend, this is a Policy-Driven Execution System:
- Observe: SEDA oracles compute market volatility and risk.
- Gate: x402 protocol handles payment and authorization for computation.
- Decide: Deterministic policies dictate the execution (e.g., Switch to Wild Strategy).
- Settle: A relayer pushes the validated state to Cronos.

## Architecture Components
### 1) SEDA Oracle Program (/seda-starter-kit)
The brain of the system.
Role: Performs decentralized, deterministic computation over pool data (WCRO/USDC).
Logic: Calculates fair price, volatility (confidence score), and liquidity depth to recommend a strategy (Steady, Wild, or Exit).
Output: Finalized by SEDA consensus and verifiable on the SEDA Explorer.

### 2) Relayer
The bridge.
Role: Monitors SEDA for finalized data requests and pushes the result to the Cronos blockchain.
State: Persists the latest valid payload in .relayer-state.json.
Feed: Provides the freshest proof of market condition to the Paywall UI.

### 3) Resource Service (x402 Paywall)
The gatekeeper.
Role: Monetizes and gates the computation request.
API:
- GET /api/latest: Public endpoint for current status.
- GET /api/data: Paid endpoint (requires x402 settlement).
Function: Ensures that execution requests are economically viable before processing.

### 4) Syntheticer
The execution agent.
Role: Consumes the settled payment metadata and the Oracle decision.
Action: Triggers the conditional logic (e.g., minting USX402 or rebalancing a position) based on the policy flags returned by SEDA.

## Repository Layout
| Directory | Description |
| --- | --- |
| seda-starter-kit/ | SEDA Oracle AssemblyScript program and local relayer |
| paywall/resource-service/ | Backend for x402 payment handling and settlement API |
| paywall/resource-app/ | Execution Console: UI for triggering and viewing oracle requests |
| giorgio-moroder-landing/ | Landing page marketing frontend |
| syntheticer/ | Backend logic for conditional issuance or rebalancing |

## Canonical Output Schema
The on-chain policy receives a fixed int256[4] array (scaled to 1e6) from the Oracle. This dictates the strategy:

```solidity
values[0] = fair_price              // Asset price (1e6)
values[1] = confidence_score        // Volatility metric (low value = high vol)
values[2] = max_safe_execution_size // Liquidity depth available
values[3] = flags                   // Strategy enum (1=Steady, 2=Wild, 3=Exit)
```

## Quick Start (Local Demo)
Follow this sequence to spin up the full execution stack locally.

### 1) Start the Resource Service (Backend)
Handles the API and payment logic.
```bash
cd paywall/resource-service
npm install && npm run build
npm run start
```

### 2) Start the Execution Console (Frontend)
The interface to interact with the paywall.
```bash
cd paywall/resource-app
npm install
npm run dev
```

### 3) Start the Relayer (SEDA)
Connects the oracle network to your local environment.
```bash
cd seda-starter-kit/relayer
bun install
bun run start
```

### 4) (Optional) Run Syntheticer
If you want to simulate the issuance or rebalancing logic.
```bash
cd syntheticer
npm install
npm run start
```

## Deployment (Firebase)
The project is structured to host both the Landing page and the Paywall app under the same domain.

Build the Paywall App:
```bash
cd paywall/resource-app
npm run build
```

Integrate into Landing:
Copy the paywall build into the landing page's build directory (served under /paywall).
```bash
mkdir -p giorgio-moroder-landing/build/paywall
cp -R paywall/resource-app/dist/* giorgio-moroder-landing/build/paywall/
```

Deploy to Hosting:
```bash
firebase deploy --only hosting
```

## Long-Term Vision
GIORGIO MORODER aims to become a foundational execution layer for on-chain capital. It enables paid, oracle-verified, policy-constrained execution where capital is deployed only under validated risk conditions. By combining x402 payments, SEDA computation, and deterministic policies, it unlocks scalable agentic finance, sustainable oracle economics, and programmable on-chain execution funds beyond passive data feeds.

## Old Repo
```
https://github.com/gazzimon/x402-oracle
```

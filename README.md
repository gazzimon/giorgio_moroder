Giorgio Moroder: Oracle & Execution Engine (x402-oracle)
Programmable liquidity intelligence for Cronos.
Powered by SEDA (Computation), x402 (Gated Execution), and Cronos (Settlement).
Created by www.fiui.org.ar

System Overview
This repository contains the core execution infrastructure for Giorgio Moroder. It is responsible for observing market conditions off-chain and deterministically authorizing on-chain actions.

Unlike a standard backend, this is a Policy-Driven Execution System:
- Observe: SEDA oracles compute market volatility and risk.
- Gate: x402 protocol handles payment/authorization for the computation.
- Decide: Deterministic policies dictate the execution (e.g., "Switch to Wild Strategy").
- Settle: A relayer pushes the validated state to Cronos.

Architecture Components
1. SEDA Oracle Program (/seda-starter-kit)
The "Brain" of the system.
Role: Performs decentralized, deterministic computation over pool data (WCRO/USDC).
Logic: Calculates fair price, volatility (confidence score), and liquidity depth to recommend a strategy (Steady, Wild, or Exit).
Output: Finalized by SEDA consensus and verifiable on the SEDA Explorer.

2. Relayer
The "Bridge".
Role: Monitors SEDA for finalized data requests and pushes the result to the Cronos blockchain.
State: Persists the latest valid payload in .relayer-state.json.
Feed: Provides the freshest "proof of market condition" to the Paywall UI.

3. Resource Service (x402 Paywall)
The "Gatekeeper".
Role: Monetizes and gates the computation request.
API:
- GET /api/latest: Public endpoint for current status.
- GET /api/data: Paid endpoint (requires x402 settlement).
Function: Ensures that execution requests are economically viable before processing.

4. Syntheticer
The "Execution Agent".
Role: Consumes the settled payment metadata and the Oracle decision.
Action: Triggers the conditional logic (e.g., minting USX402 or rebalancing a position) based on the policy flags returned by SEDA.

Repository Layout
DirectoryDescription
seda-starter-kit/SEDA Oracle AssemblyScript program & local relayer.
paywall/resource-service/Backend for x402 payment handling & settlement API.
paywall/resource-app/Execution Console: The UI for triggering/viewing oracle requests.
giorgio-moroder-landing/Landing Page: The product marketing frontend.
syntheticer/Backend logic for conditional issuance/rebalancing.

Canonical Output Schema
The On-Chain Policy receives a fixed int256[4] array (scaled to 1e6) from the Oracle. This dictates the strategy:

Solidity
values[0] = fair_price              // Asset price (1e6)
values[1] = confidence_score        // Volatility Metric (Low val = High Vol)
values[2] = max_safe_execution_size // Liquidity Depth available
values[3] = flags                   // Strategy Enum (1=Steady, 2=Wild, 3=Exit)

Quick Start (Local Demo)
Follow this sequence to spin up the full execution stack locally.

1. Start the Resource Service (Backend)
Handles the API and payment logic.
Bash
cd paywall/resource-service
npm install && npm run build
npm run start

2. Start the Execution Console (Frontend)
The interface to interact with the paywall.
Bash
cd paywall/resource-app
npm install
npm run dev

3. Start the Relayer (SEDA)
Connects the oracle network to your local environment.
Bash
cd seda-starter-kit/relayer
bun install
bun run start

4. (Optional) Run Syntheticer
If you want to simulate the issuance/rebalancing logic.
Bash
cd syntheticer
npm install
npm run start

Deployment (Firebase)
The project is structured to host both the Landing page and the Paywall app under the same domain.

Build the Paywall App:
Bash
cd paywall/resource-app
npm run build

Integrate into Landing:
Copy the paywall build into the landing page's build directory (served under /paywall).
Bash
mkdir -p giorgio-moroder-landing/build/paywall
cp -R paywall/resource-app/dist/* giorgio-moroder-landing/build/paywall/

Deploy to Hosting:
Bash
firebase deploy --only hosting

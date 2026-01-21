SEDAOracleConsumerV2 (README)

Overview
- V2 keeps the trusted relayer model (no cryptographic proof), but hardens validation and metadata.
- V2 is a feed contract only; it does not settle funds or mint by itself.

Differences vs V1
- Allowlist of pairs (on-chain gating).
- Replay protection (seenRequest) and duplicate request guard per pair.
- Monotonic sequence per pair (seqByPair).
- On-chain staleness tracking (updatedAtByPair, isStale) with pause control.
- Validation of oracle values (price > 0, confidence 0..1e6, flags mask <= 0x7).
- Safer governance (owner + relayer with events).
- Extended ResultSubmitted event with updatedAt + seq.

How to configure pairs
- Compute pair hash off-chain: keccak256(utf8("WCRO-USDC")).
- Owner calls setPairAllowed(pairHash, true).
- submitResult will revert if pair is not allowlisted.

Stale seconds
- staleSeconds is enforced via isStale(pair).
- Owner can update using setStaleSeconds(newValue).
- Bounds: min 10 seconds, max 1 day.

Pause control
- Owner can pause/unpause the feed (OpenZeppelin Pausable).
- When paused, submitResult always reverts.

Compatibility
- getLatest(bytes32) and getLatestRequestId(bytes32) match V1 signatures.

// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title SEDAOracleConsumerV2
 * @notice Stores relayed oracle results keyed by pair hash (trusted relayer model).
 * @dev No cryptographic proof verification. Relayer is trusted. This contract is a feed, not settlement.
 */
contract SEDAOracleConsumerV2 {
    /// @notice Immutable SEDA oracle program id (bytes32)
    bytes32 public immutable oracleProgramId;

    /// @notice Authorized relayer address
    address public relayer;

    /// @notice Contract owner
    address public owner;

    /// @notice Latest values per pair (int256[4], 1e6 scale)
    mapping(bytes32 => int256[4]) public latestByPair;

    /// @notice Latest request id per pair
    mapping(bytes32 => bytes32) public lastRequestIdByPair;

    /// @notice Timestamp when the pair was last updated (block timestamp)
    mapping(bytes32 => uint256) public updatedAtByPair;

    /// @notice Monotonic sequence per pair
    mapping(bytes32 => uint64) public seqByPair;

    /// @notice Request ids already processed (global replay protection)
    mapping(bytes32 => bool) public seenRequest;

    /// @notice Allowed pair allowlist
    mapping(bytes32 => bool) public allowedPair;

    /// @notice Staleness threshold in seconds
    uint256 public staleSeconds;

    /// @notice Max future drift tolerance (reserved for observedAt use)
    uint256 public maxFutureDriftSeconds;

    uint256 private constant MIN_STALE_SECONDS = 10;
    uint256 private constant MAX_STALE_SECONDS = 1 days;

    error NotOwner();
    error NotRelayer();
    error PairNotAllowed();
    error AlreadyProcessed();
    error InvalidOracleValue();
    error DuplicateRequestForPair();
    error BadParams();

    event ResultSubmitted(
        bytes32 indexed requestId,
        bytes32 indexed pair,
        int256[4] values,
        uint256 updatedAt,
        uint64 seq
    );
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event PairAllowed(bytes32 indexed pair, bool allowed);
    event StaleSecondsUpdated(uint256 oldValue, uint256 newValue);

    constructor(bytes32 _oracleProgramId, address _relayer, uint256 _staleSeconds, uint256 _maxFutureDriftSeconds) {
        if (_relayer == address(0)) revert BadParams();
        if (_staleSeconds < MIN_STALE_SECONDS || _staleSeconds > MAX_STALE_SECONDS) revert BadParams();
        oracleProgramId = _oracleProgramId;
        relayer = _relayer;
        owner = msg.sender;
        staleSeconds = _staleSeconds;
        maxFutureDriftSeconds = _maxFutureDriftSeconds;
    }

    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert NotOwner();
        if (newOwner == address(0)) revert BadParams();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function setRelayer(address newRelayer) external {
        if (msg.sender != owner) revert NotOwner();
        if (newRelayer == address(0)) revert BadParams();
        address oldRelayer = relayer;
        relayer = newRelayer;
        emit RelayerUpdated(oldRelayer, newRelayer);
    }

    function setPairAllowed(bytes32 pair, bool allowed) external {
        if (msg.sender != owner) revert NotOwner();
        allowedPair[pair] = allowed;
        emit PairAllowed(pair, allowed);
    }

    function setStaleSeconds(uint256 newStaleSeconds) external {
        if (msg.sender != owner) revert NotOwner();
        if (newStaleSeconds < MIN_STALE_SECONDS || newStaleSeconds > MAX_STALE_SECONDS) revert BadParams();
        uint256 oldValue = staleSeconds;
        staleSeconds = newStaleSeconds;
        emit StaleSecondsUpdated(oldValue, newStaleSeconds);
    }

    /**
     * @notice Submit a relayed result (trusted relayer model).
     * @dev `sedaProof` is ignored in V2 (placeholder removed).
     */
    /// values[0] = fair_price (1e6)
    /// values[1] = confidence_score (1e6)
    /// values[2] = max_safe_execution_size (1e6)
    /// values[3] = flags (bitmask: bits 0..2)
    function submitResult(
        bytes32 requestId,
        bytes32 pair,
        int256[4] calldata values,
        bytes calldata sedaProof
    ) external {
        if (msg.sender != relayer) revert NotRelayer();
        if (!allowedPair[pair]) revert PairNotAllowed();
        if (lastRequestIdByPair[pair] == requestId) revert DuplicateRequestForPair();
        if (seenRequest[requestId]) revert AlreadyProcessed();

        if (values[0] <= 0) revert InvalidOracleValue();
        if (values[1] < 0 || values[1] > 1_000_000) revert InvalidOracleValue();
        if (values[2] < 0) revert InvalidOracleValue();
        if (values[3] < 0 || uint256(values[3]) > 7) revert InvalidOracleValue();

        seenRequest[requestId] = true;
        latestByPair[pair] = values;
        lastRequestIdByPair[pair] = requestId;
        updatedAtByPair[pair] = block.timestamp;
        seqByPair[pair] += 1;

        emit ResultSubmitted(requestId, pair, values, block.timestamp, seqByPair[pair]);

        sedaProof;
    }

    function getLatest(bytes32 pair) external view returns (int256[4] memory) {
        return latestByPair[pair];
    }

    function getLatestRequestId(bytes32 pair) external view returns (bytes32) {
        return lastRequestIdByPair[pair];
    }

    function getLatestWithMeta(
        bytes32 pair
    ) external view returns (int256[4] memory values, bytes32 requestId, uint256 updatedAt, uint64 seq) {
        return (latestByPair[pair], lastRequestIdByPair[pair], updatedAtByPair[pair], seqByPair[pair]);
    }

    function isStale(bytes32 pair) external view returns (bool) {
        uint256 updatedAt = updatedAtByPair[pair];
        if (updatedAt == 0) return true;
        return block.timestamp - updatedAt > staleSeconds;
    }
}

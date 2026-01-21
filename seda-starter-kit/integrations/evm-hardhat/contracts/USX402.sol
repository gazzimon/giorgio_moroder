// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title USX402
 * @notice Minimal synthetic USD-like ERC20 with a trusted relayer as the sole minter/burner.
 * @dev Peg enforcement and economic checks are handled externally by the relayer/oracle.
 */
contract USX402 is ERC20 {
    // --- Roles ---
    address public owner;
    address public minter;
    bool public paused;

    // --- Events ---
    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event MinterUpdated(address indexed oldMinter, address indexed newMinter);
    event Paused();
    event Unpaused();

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "USX402: not owner");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == minter, "USX402: not minter");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "USX402: paused");
        _;
    }

    constructor(address initialOwner, address initialMinter) ERC20("USX402", "USX402") {
        require(initialOwner != address(0), "USX402: owner zero");
        require(initialMinter != address(0), "USX402: minter zero");
        owner = initialOwner;
        minter = initialMinter;
        emit MinterUpdated(address(0), initialMinter);
    }

    /**
     * @notice Mint new tokens to a user.
     */
    function mint(address to, uint256 amount) external onlyMinter whenNotPaused {
        _mint(to, amount);
        emit Minted(to, amount);
    }

    /**
     * @notice Burn tokens from any account WITHOUT allowance.
     * @dev TRUST ASSUMPTION: The minter is a trusted relayer and may burn tokens
     * from arbitrary accounts as part of protocol-controlled settlement,
     * liquidation, or off-chain redemption flows.
     */
    function burn(address from, uint256 amount) external onlyMinter whenNotPaused {
        _burn(from, amount);
        emit Burned(from, amount);
    }

    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "USX402: minter zero");
        address oldMinter = minter;
        minter = newMinter;
        emit MinterUpdated(oldMinter, newMinter);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }

    function version() external pure returns (string memory) {
        return "USX402-v0.1-x402";
    }

    function _update(address from, address to, uint256 amount) internal override {
        require(!paused, "USX402: paused");
        super._update(from, to, amount);
    }
}

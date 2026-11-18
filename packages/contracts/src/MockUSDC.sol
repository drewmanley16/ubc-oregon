// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC — DEMO TOKEN, NOT USDC. FALLBACK ONLY.
/// @notice Used only if official Arc testnet USDC (0x3600…0000) cannot be used end to end,
///         and in local anvil tests. The UI must label it "Demo USDC" whenever it is active.
contract MockUSDC is ERC20 {
    uint256 public constant FAUCET_CAP = 1_000e6; // $1,000 per call

    error FaucetCapExceeded();

    constructor() ERC20("Sway Demo USDC (not real USDC)", "dUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Open faucet for demo use. Testnet only.
    function faucet(address to, uint256 amount) external {
        if (amount > FAUCET_CAP) revert FaucetCapExceeded();
        _mint(to, amount);
    }
}

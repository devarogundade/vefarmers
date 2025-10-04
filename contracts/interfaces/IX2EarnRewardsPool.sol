// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Interface for VeBetterDAO X2EarnRewardsPool
interface IX2EarnRewardsPool {
    error InsufficientAmount();

    function distributeReward(
        bytes32 appId,
        uint256 amount,
        address receiver,
        string memory proof
    ) external;

    function availableFunds(bytes32 appId) external view returns (uint256);
}

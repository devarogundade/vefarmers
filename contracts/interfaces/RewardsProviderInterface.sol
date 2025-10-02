// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IX2EarnRewardsPool} from "./IX2EarnRewardsPool.sol";

interface RewardsProviderInterface {
    event AppIdChanged(bytes32 appId);
    event RateChanged(uint256 newRate);
    event RewardsPoolChanged(address newRewardsPool);

    function appId() external view returns (bytes32);

    function rate() external view returns (uint256);

    function rewardsPool() external view returns (IX2EarnRewardsPool);
}

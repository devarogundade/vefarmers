// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {RewardsProviderInterface} from "./interfaces/RewardsProviderInterface.sol";
import {IX2EarnRewardsPool} from "./interfaces/IX2EarnRewardsPool.sol";

contract RewardsProvider is RewardsProviderInterface {
    bytes32 public appId;
    uint256 public rate;
    IX2EarnRewardsPool public rewardsPool;

    constructor(
        bytes32 _appId,
        uint256 _rate,
        IX2EarnRewardsPool _rewardsPool
    ) {
        appId = _appId;
        rate = _rate;
        rewardsPool = _rewardsPool;
    }

    function distributeReward(
        address to,
        uint256 amount,
        string memory proof
    ) external {
        // guard: to do
        rewardsPool.distributeReward(appId, amount, to, proof);
    }

    function setAppId(bytes32 newAppId) external {
        appId = newAppId;
        emit AppIdChanged(newAppId);
    }

    function setRate(uint256 newRate) external {
        rate = newRate;
        emit RateChanged(newRate);
    }

    function setRewardsPool(IX2EarnRewardsPool newRewardsPool) external {
        rewardsPool = newRewardsPool;
        emit RewardsPoolChanged(address(newRewardsPool));
    }
}

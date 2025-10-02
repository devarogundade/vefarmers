// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {PledgeManagerInterface} from "./interfaces/PledgeManagerInterface.sol";
import {RewardsProviderInterface} from "./interfaces/RewardsProviderInterface.sol";
import {IX2EarnRewardsPool} from "./interfaces/IX2EarnRewardsPool.sol";

/// @title PledgeManager (per-farmer, LP-token based)
/// @notice Manages pledges of VET for a single farmer via LP tokens.
contract PledgeManager is
    PledgeManagerInterface,
    ReentrancyGuard,
    Ownable,
    ERC20
{
    address public immutable farmer;
    address public immutable pool;
    bool public active = true;

    RewardsProviderInterface provider;

    mapping(address => uint256) public lastClaimedAt;

    constructor(
        RewardsProviderInterface _provider,
        address _farmer,
        address _pool
    ) Ownable(_pool) ERC20("Farmer Pledge LP", "fLP") {
        if (_farmer == address(0) || _pool == address(0)) revert ZeroAddress();
        provider = _provider;
        farmer = _farmer;
        pool = _pool;
    }

    /// @notice Pledge VET -> receive LP tokens
    function pledge(address behalfOf) external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        if (behalfOf == address(0)) revert ZeroAddress();

        _mint(behalfOf, msg.value);
        emit Pledged(behalfOf, msg.value);
    }

    /// @notice Withdraw pledge - only allowed when pledge is inactive
    function withdraw(
        uint256 amount
    ) external nonReentrant returns (uint256 rewardAmount) {
        if (active) revert ActivePledge();
        if (amount == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();

        _burn(msg.sender, amount);

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();

        rewardAmount = harvestable(msg.sender);

        if (rewardAmount > 0) {
            lastClaimedAt[msg.sender] = block.timestamp;

            string memory proof = string(
                abi.encodePacked(
                    '{"type":"harvest","account":"',
                    msg.sender,
                    '","pledgeManager":"',
                    address(this),
                    '"}'
                )
            );

            provider.rewardsPool().distributeReward(
                provider.appId(),
                rewardAmount,
                msg.sender,
                proof
            );
        }

        emit Withdrawn(msg.sender, amount, rewardAmount);
    }

    function harvest() external returns (uint256 rewardAmount) {
        rewardAmount = harvestable(msg.sender);

        if (
            rewardAmount >
            provider.rewardsPool().availableFunds(provider.appId())
        ) {
            revert IX2EarnRewardsPool.InsufficientAmount();
        }

        lastClaimedAt[msg.sender] = block.timestamp;

        string memory proof = string(
            abi.encodePacked(
                '{"type":"harvest","account":"',
                msg.sender,
                '","pledgeManager":"',
                address(this),
                '"}'
            )
        );

        provider.rewardsPool().distributeReward(
            provider.appId(),
            rewardAmount,
            msg.sender,
            proof
        );

        emit RewardHarvested(msg.sender, rewardAmount);
    }

    function harvestable(address account) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - lastClaimedAt[account];
        return (balanceOf(account) * timeElapsed) / provider.rate();
    }

    /// @notice Called by LendingPool after verifying unhealthy LTV
    /// @param liquidator The address that triggered liquidation
    function liquidate(address liquidator) external nonReentrant onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoCollateral();

        if (liquidator == address(0)) revert ZeroAddress();

        _burn(address(this), totalSupply());

        // Transfer all collateral to liquidator
        (bool success, ) = payable(liquidator).call{value: balance}("");
        if (!success) revert TransferFailed();

        // Deactivate the pledge after liquidation
        active = false;

        emit Liquidated(farmer, liquidator, balance);
    }

    /// @notice Set active status (only pool can call this)
    function setActive(bool _active) external onlyOwner {
        active = _active;
        emit ActiveStatusChanged(_active);
    }

    receive() external payable {}

    function decimals() public pure override returns (uint8) {
        return 8;
    }
}

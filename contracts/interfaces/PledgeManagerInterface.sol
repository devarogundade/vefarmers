// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title PledgeManagerInterface
/// @notice Interface for LP-token based pledge managers
interface PledgeManagerInterface is IERC20 {
    error ZeroAddress();
    error ZeroAmount();
    error ActivePledge();
    error TransferFailed();
    error NoCollateral();
    error NotFarmer();
    error InsufficientBalance();

    event Pledged(address indexed pledger, uint256 amount);
    event Withdrawn(
        address indexed withdrawer,
        uint256 amount,
        uint256 rewards
    );
    event Liquidated(
        address indexed farmer,
        address indexed liquidator,
        uint256 amount
    );
    event ActiveStatusChanged(bool active);
    event RewardHarvested(address account, uint256 amount);

    function farmer() external view returns (address);

    function pool() external view returns (address);

    function active() external view returns (bool);

    function pledge(address behalfOf) external payable;

    function withdraw(uint256 amount) external returns (uint256);

    function harvest() external returns (uint256);

    function harvestable(address account) external view returns (uint256);

    function liquidate(address liquidator) external;

    function setActive(bool enabled) external;
}

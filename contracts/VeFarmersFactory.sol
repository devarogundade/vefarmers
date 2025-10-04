// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LendingPool} from "./LendingPool.sol";
import {OracleInterface} from "./interfaces/OracleInterface.sol";
import {FarmerRegistryInterface} from "./interfaces/FarmerRegistryInterface.sol";
import {VeFarmersFactoryInterface} from "./interfaces/VeFarmersFactoryInterface.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title VeFarmersFactory
/// @notice Deploys and manages LendingPool contracts for different fiat tokens.
contract VeFarmersFactory is Ownable, VeFarmersFactoryInterface {
    /// @notice Controller (shared across all pools)
    address public controller;

    /// @notice Oracle (shared across all pools)
    address public oracle;

    /// @notice FarmerRegistry (shared across all pools)
    address public registry;

    /// @notice All pools deployed, indexed by Fiat address
    mapping(address => address) public fiatToPool;

    /// @notice List of deployed pool addresses for iteration
    address[] public allPools;

    constructor(
        address _controller,
        address _oracle,
        address _registry
    ) Ownable(_controller) {
        if (
            _controller == address(0) ||
            _oracle == address(0) ||
            _registry == address(0)
        ) {
            revert InvalidAddress();
        }

        controller = _controller;
        oracle = _oracle;
        registry = _registry;
    }

    /// @notice Create a new LendingPool for a fiat token.
    /// @param fiat Address of the Fiat.
    function createPool(
        address fiat
    ) external onlyOwner returns (address pool) {
        if (fiat == address(0)) revert InvalidAddress();
        if (fiatToPool[fiat] != address(0)) revert PoolAlreadyExists();

        // Basic validation that the fiat address is a contract
        if (fiat.code.length == 0) revert InvalidFiatToken();

        LendingPool lp = new LendingPool(controller, oracle, fiat, registry);
        pool = address(lp);

        fiatToPool[fiat] = pool;
        allPools.push(pool);

        emit PoolCreated(fiat, pool, allPools.length - 1);
    }

    /// @notice Update controller, oracle, and registry for future pools
    function setConfiguration(
        address _controller,
        address _oracle,
        address _registry
    ) external onlyOwner {
        if (
            _controller == address(0) ||
            _oracle == address(0) ||
            _registry == address(0)
        ) {
            revert InvalidAddress();
        }

        controller = _controller;
        oracle = _oracle;
        registry = _registry;
    }
}

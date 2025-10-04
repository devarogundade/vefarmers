// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {FarmerRegistryInterface} from "../interfaces/FarmerRegistryInterface.sol";
import {PledgeManagerInterface} from "../interfaces/PledgeManagerInterface.sol";
import {InterestLib} from "../libs/InterestLib.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library LendingPoolLogic {
    error ZeroAmount();
    error ZeroAccount();
    error InsufficientLiquidity();
    error NoLPSupply();
    error InsufficientLPBalance();
    error InvalidPledgeManager();
    error UnpledgedPool();
    error OracleZero();
    error NoBorrowCapacity();
    error ExceedsBorrowCapacity();
    error PrincipalOverflow();
    error NoOutstandingLoan();
    error OverflowAfterPay();
    error OverflowNewPrincipal();
    error LTVBelowThreshold();
    error NoDebt();
    error InDebt();
    error ZeroAddress();
    error InvalidSignature();
    error SignatureExpired();

    struct BorrowerPosition {
        uint256 principal;
        uint256 borrowedAt;
    }

    function calculateLPTokens(
        uint256 amount,
        uint256 lpTotalSupply,
        uint256 totalSupplied
    ) internal pure returns (uint256 minted) {
        if (amount <= 0) revert ZeroAmount();

        uint256 underlyingPool = totalSupplied;

        if (underlyingPool == 0 || lpTotalSupply == 0) {
            minted = amount;
        } else {
            minted = (amount * lpTotalSupply) / underlyingPool;
            if (minted == 0) revert ZeroAmount();
        }
    }

    function calculateWithdrawal(
        uint256 amount,
        uint256 lpTotalSupply,
        uint256 totalSupplied,
        uint256 totalBorrowed
    ) internal pure returns (uint256 lpToBurn) {
        if (amount <= 0) revert ZeroAmount();

        uint256 freeLiquidity = totalSupplied - totalBorrowed;
        if (freeLiquidity < amount) revert InsufficientLiquidity();

        if (lpTotalSupply == 0) revert NoLPSupply();

        uint256 denominator = totalSupplied;
        if (denominator == 0) revert ZeroAmount();

        lpToBurn = (amount * lpTotalSupply) / denominator;
        if (lpToBurn == 0) revert ZeroAmount();
    }

    function calculateWithdrawalLP(
        uint256 lpAmount,
        uint256 lpTotalSupply,
        uint256 totalSupplied
    ) internal pure returns (uint256 amount) {
        if (lpAmount <= 0) revert ZeroAmount();
        if (lpTotalSupply == 0) revert NoLPSupply();

        uint256 numerator = lpAmount * totalSupplied;
        amount = numerator / lpTotalSupply;

        if (amount == 0) revert ZeroAmount();
    }

    function calculateBorrowable(
        address farmer,
        FarmerRegistryInterface registry,
        OracleInterface oracle,
        IERC20 fiat,
        uint256 loanToValueBp,
        uint256 MAX_BPS
    ) internal view returns (uint256) {
        address pledgeManager = registry.getManager(farmer);
        if (pledgeManager == address(0)) revert InvalidPledgeManager();

        if (!PledgeManagerInterface(pledgeManager).active()) return 0;

        uint256 totalPledged = PledgeManagerInterface(pledgeManager)
            .totalSupply();
        if (totalPledged == 0) return 0;

        uint256 fiatPerVet = oracle.fiatPerVet(address(fiat));
        if (fiatPerVet == 0) return 0;

        uint256 pledgedFiat = (totalPledged * fiatPerVet) / MAX_BPS;
        if (pledgedFiat == 0) return 0;

        return (pledgedFiat * loanToValueBp) / MAX_BPS;
    }

    function validateBorrow(
        uint256 amount,
        uint256 totalSupplied,
        uint256 totalBorrowed,
        uint256 maxBorrowable,
        uint256 outstandingDebt
    ) internal pure {
        if (amount <= 0) revert ZeroAmount();

        uint256 freeLiquidity = totalSupplied - totalBorrowed;
        if (freeLiquidity < amount) revert InsufficientLiquidity();

        if (maxBorrowable == 0) revert NoBorrowCapacity();

        if (outstandingDebt >= maxBorrowable) revert NoBorrowCapacity();

        uint256 remainingCapacity = maxBorrowable - outstandingDebt;
        if (amount > remainingCapacity) revert ExceedsBorrowCapacity();
    }

    function updateBorrowerPosition(
        BorrowerPosition storage position,
        uint256 amount,
        uint256 borrowRateBp,
        uint256 MAX_BPS
    ) internal returns (uint256 newPrincipal) {
        uint256 accrued = InterestLib.accruedInterest(
            position.principal,
            position.borrowedAt,
            borrowRateBp,
            MAX_BPS
        );

        uint256 newPrincipalU256 = position.principal + accrued + amount;

        if (newPrincipalU256 > type(uint64).max) revert PrincipalOverflow();

        newPrincipal = newPrincipalU256;
        position.principal = newPrincipal;
        position.borrowedAt = block.timestamp;
    }

    function processRepayment(
        BorrowerPosition storage position,
        uint256 amount,
        uint256 borrowRateBp,
        uint256 MAX_BPS
    )
        internal
        returns (
            uint256 remainingPrincipal,
            uint256 interestPaid,
            uint256 principalRepaid
        )
    {
        if (amount <= 0) revert ZeroAmount();
        if (position.principal <= 0) revert NoOutstandingLoan();

        // compute interest owed (non-negative)
        uint256 interest = InterestLib.accruedInterest(
            position.principal,
            position.borrowedAt,
            borrowRateBp,
            MAX_BPS
        );

        uint256 pay = amount;
        uint256 principal = position.principal;

        if (pay <= interest) {
            // payment covers partial or all interest only
            // principal remains unchanged (but borrowedAt updated)
            interestPaid = pay;
            remainingPrincipal = position.principal; // principal unchanged
            principalRepaid = 0;
            position.borrowedAt = block.timestamp;
        } else {
            // pay covers interest and some principal
            interestPaid = interest;
            uint256 payLeft = pay - interest;

            if (payLeft >= principal) {
                // full principal repaid
                principalRepaid = principal;
                remainingPrincipal = 0;
                position.principal = 0;
                position.borrowedAt = 0;
            } else {
                // partial principal repaid
                uint256 newPrincipal = principal - payLeft;
                if (newPrincipal > type(uint64).max)
                    revert OverflowNewPrincipal();
                remainingPrincipal = newPrincipal;
                position.principal = remainingPrincipal;
                position.borrowedAt = block.timestamp;
                principalRepaid = payLeft;
            }
        }
    }

    // Example typehash for a Borrow permit:
    // keccak256("Borrow(address farmer,uint256 amount,uint256 nonce,uint256 deadline)")
    bytes32 internal constant BORROW_TYPEHASH =
        keccak256(
            "Borrow(address farmer,uint256 amount,uint256 nonce,uint256 deadline)"
        );

    /// @notice Validates a borrow permit signature
    /// @param domainSeparator Contract-specific domain separator (EIP-712)
    /// @param farmer The farmer’s address (who signed)
    /// @param amount The borrow amount (signed off-chain)
    /// @param nonce Unique nonce to prevent replay
    /// @param deadline Expiry timestamp
    /// @param v,r,s Signature parts
    function validateBorrowPermit(
        bytes32 domainSeparator,
        address farmer,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view {
        if (block.timestamp > deadline) revert SignatureExpired();

        // EIP-712 struct hash
        bytes32 structHash = keccak256(
            abi.encode(BORROW_TYPEHASH, farmer, amount, nonce, deadline)
        );

        // Full digest per EIP-712
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        // Recover signer
        address recovered = ecrecover(digest, v, r, s);
        if (recovered == address(0) || recovered != farmer) {
            revert InvalidSignature();
        }
    }

    function calculateLtvBps(
        address farmer,
        BorrowerPosition storage position,
        FarmerRegistryInterface registry,
        OracleInterface oracle,
        IERC20 fiat,
        uint256 borrowRateBp,
        uint256 MAX_BPS
    ) internal view returns (uint256) {
        uint256 debt = position.principal > 0
            ? position.principal +
                InterestLib.accruedInterest(
                    position.principal,
                    position.borrowedAt,
                    borrowRateBp,
                    MAX_BPS
                )
            : uint256(0);

        if (debt <= 0) return type(uint256).max;

        address pledgeManager = registry.getManager(farmer);
        if (pledgeManager == address(0)) return 0;

        uint256 totalPledged = PledgeManagerInterface(pledgeManager)
            .totalSupply();
        if (totalPledged == 0) return type(uint256).max;

        uint256 fiatPerVet = oracle.fiatPerVet(address(fiat));
        if (fiatPerVet == 0) revert OracleZero();

        uint256 collateralValueFiat = (totalPledged * fiatPerVet) / MAX_BPS;
        if (collateralValueFiat == 0) return type(uint256).max;

        return (debt * MAX_BPS) / collateralValueFiat;
    }

    function validateLiquidation(
        address farmer,
        BorrowerPosition storage position,
        FarmerRegistryInterface registry,
        OracleInterface oracle,
        IERC20 fiat,
        uint256 LIQUIDATION_BPS,
        uint256 borrowRateBp,
        uint256 MAX_BPS
    ) internal view returns (uint256 debt) {
        uint256 ltvBps = calculateLtvBps(
            farmer,
            position,
            registry,
            oracle,
            fiat,
            borrowRateBp,
            MAX_BPS
        );

        // Only liquidate if LTV exceeds (>=) liquidation threshold
        if (ltvBps < LIQUIDATION_BPS) revert LTVBelowThreshold();

        // compute debt (principal + accrued interest at borrowRateBp)
        debt = position.principal > 0
            ? position.principal +
                InterestLib.accruedInterest(
                    position.principal,
                    position.borrowedAt,
                    borrowRateBp,
                    MAX_BPS
                )
            : uint256(0);

        if (debt <= 0) revert NoDebt();

        address pledgeManager = registry.getManager(farmer);
        if (pledgeManager == address(0)) revert InvalidPledgeManager();
    }
}

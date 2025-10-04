// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

library InterestLib {
    error InterestOverflow();
    error InvalidDuration();

    /// @notice Returns accrued interest (in fiat smallest units) for a given principal and timestamp.
    function accruedInterest(
        uint256 principal,
        uint256 fromTimestamp,
        uint256 borrowRateBp,
        uint256 bps
    ) internal view returns (uint256 interest) {
        if (principal <= 0) return uint256(0);
        if (fromTimestamp > block.timestamp) revert InvalidDuration();

        uint256 duration = block.timestamp - fromTimestamp; // seconds
        if (duration == 0) return uint256(0);

        // interest = principal * rateBp * durationSec / (365 days * MAX_BPS)
        uint256 numer = principal * borrowRateBp * duration;
        uint256 denom = 365 days * bps;

        interest = numer / denom;

        if (interest > type(uint256).max) revert InterestOverflow();
        return interest;
    }

    function mulDiv(
        uint256 x,
        uint256 y,
        uint256 denominator
    ) internal pure returns (uint256 result) {
        return (x * y) / denominator;
    }
}

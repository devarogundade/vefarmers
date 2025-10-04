// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface LendingPoolInterface {
    event Supplied(address indexed lp, uint256 amount, uint256 lpMinted);
    event Withdrawn(address indexed lp, uint256 amount, uint256 lpBurned);
    event Borrowed(
        address indexed farmer,
        uint256 amount,
        uint256 newPrincipal
    );
    event Repaid(
        address indexed farmer,
        uint256 amount,
        uint256 remainingPrincipal,
        uint256 interestPaid
    );

    function supply(uint256 amount, address behalfOf) external;

    function withdraw(uint256 amount) external;

    function withdrawable(address account) external view returns (uint256);

    function outstanding(address farmer) external view returns (uint256);

    function borrow(uint256 amount) external returns (bool);

    function borrowWithPermit(
        uint256 amount,
        address farmer,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (bool);

    function borrowable(address farmer) external view returns (uint256);

    function repay(uint256 amount, address behalfOf) external returns (uint256);

    function ltvBps(address farmer) external view returns (uint256);

    function liquidate(address farmer) external;

    function activatePledge() external;

    function deactivatePledge() external;
}

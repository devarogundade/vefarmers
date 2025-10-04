// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {OracleInterface} from "./interfaces/OracleInterface.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Oracle
contract Oracle is OracleInterface, Ownable {
    mapping(address => uint256) public fiatPerVet;

    constructor() Ownable(msg.sender) {}

    function setfiatPerVet(address fiat, uint256 vet) external onlyOwner {
        fiatPerVet[fiat] = vet;
        emit PriceUpdated(fiat, vet, block.timestamp);
    }
}

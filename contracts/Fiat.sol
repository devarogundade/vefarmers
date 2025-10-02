// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Fiat is ERC20 {
    uint8 public fiatDecimals;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _fiatDecimals
    ) ERC20(_name, _symbol) {
        fiatDecimals = _fiatDecimals;
    }

    function decimals() public view override returns (uint8) {
        return fiatDecimals;
    }
}

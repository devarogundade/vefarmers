// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Fiat is ERC20, Ownable {
    uint8 public fiatDecimals;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _fiatDecimals
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        fiatDecimals = _fiatDecimals;
    }

    function decimals() public view override returns (uint8) {
        return fiatDecimals;
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }
}

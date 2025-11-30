// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RealesToken is ERC20, ERC20Burnable, Ownable {
    // Constructor mints 1,000,000 tokens to the deployer immediately
    constructor(address initialOwner) ERC20("Golden Reales", "RLS") Ownable(initialOwner) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
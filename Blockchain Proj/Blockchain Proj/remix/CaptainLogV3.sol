// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RealesToken.sol";
import "./PirateNFT.sol";

contract CaptainLogV3 {
    RealesToken public token;
    PirateNFT public nft;

    // Events (Same as before)
    event TrainingComplete(address indexed user, uint256 tokenId, uint256 newLevel);
    // Added 'roll' to event so you can see what number you rolled
    event PlunderResult(address indexed user, uint256 tokenId, bool victory, uint256 reward, uint256 roll, uint256 winChance);
    event RankPromoted(address indexed user, uint256 tokenId);

    constructor(address _tokenAddress, address _nftAddress) {
        token = RealesToken(_tokenAddress);
        nft = PirateNFT(_nftAddress);
    }

    // --- GAMBLING ENGINE ---
    function _resolveBattle(uint256 tokenId, uint256 enemyPower, uint256 reward) internal {
        require(nft.ownerOf(tokenId) == msg.sender, "Not your pirate!");
        
        PirateNFT.Pirate memory p = nft.getPirateStats(tokenId);
        uint256 piratePower = p.combat + p.sailing;
        
        // 1. Calculate Win Chance (Base 50%)
        uint256 winChance = 50;

        if (piratePower > enemyPower) {
            // Add 1% chance for every point of advantage
            winChance += (piratePower - enemyPower);
        } else {
            // Subtract 1% chance for every point of disadvantage
            uint256 diff = enemyPower - piratePower;
            if (diff >= 40) winChance = 10; // Min cap 10%
            else winChance -= diff;
        }

        // 2. Cap at 85% (The House always has a chance)
        if (winChance > 85) winChance = 85;
        if (winChance < 10) winChance = 10;

        // 3. Roll the Dice (0 - 99)
        uint256 roll = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, tokenId, block.prevrandao))) % 100;

        // 4. Determine Winner
        if (roll < winChance) {
            // WIN
            if (token.balanceOf(address(this)) >= reward * 10**18) {
                token.transfer(msg.sender, reward * 10**18);
            }
            emit PlunderResult(msg.sender, tokenId, true, reward, roll, winChance);
        } else {
            // LOSE
            emit PlunderResult(msg.sender, tokenId, false, 0, roll, winChance);
        }
    }

    // --- MISSIONS (Now with fixed Enemy Difficulty) ---
    
    // NASSAU (Easy): Enemy Power 90
    function raidNassau(uint256 tokenId) external {
        _resolveBattle(tokenId, 90, 20); 
    }

    // KINGSTON (Medium): Enemy Power 140
    function raidKingston(uint256 tokenId) external {
        _resolveBattle(tokenId, 140, 50); 
    }

    // HAVANA (Hard): Enemy Power 180
    function raidHavana(uint256 tokenId) external {
        _resolveBattle(tokenId, 180, 100); 
    }

    // --- STANDARD FUNCTIONS ---
    function trainCrew(uint256 tokenId) external {
        require(nft.ownerOf(tokenId) == msg.sender, "Not your pirate!");
        require(token.balanceOf(msg.sender) >= 50 * 10**18, "Not enough Reales!");
        token.transferFrom(msg.sender, address(this), 50 * 10**18);
        PirateNFT.Pirate memory p = nft.getPirateStats(tokenId);
        nft.updateStats(tokenId, p.combat + 5, p.sailing + 5, p.level + 1);
        emit TrainingComplete(msg.sender, tokenId, p.level + 1);
    }

    function promoteToOfficer(uint256 tokenId) external {
        require(nft.ownerOf(tokenId) == msg.sender, "Not your pirate!");
        PirateNFT.Pirate memory p = nft.getPirateStats(tokenId);
        require(p.level >= 5, "Level 5 required");
        require(p.rank == 0, "Already Officer");
        token.burnFrom(msg.sender, 100 * 10**18);
        nft.promoteRank(tokenId);
        emit RankPromoted(msg.sender, tokenId);
    }
}
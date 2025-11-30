// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PirateNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    address public gameContract;

    struct Pirate {
        string name;
        uint256 level;
        uint8 combat;
        uint8 sailing;
        uint8 rank; // 0 = Swabbie, 1 = Officer
    }

    // Mapping from Token ID to Pirate Stats
    mapping(uint256 => Pirate) public pirateStats;

    event PirateMinted(address owner, uint256 tokenId, uint8 combat, uint8 sailing);
    event StatsUpdated(uint256 tokenId, uint256 newLevel, uint8 newCombat, uint8 newSailing);

    constructor(address initialOwner) ERC721("JackdawCrew", "CREW") Ownable(initialOwner) {}

    // Security Modifier: Only allows the Game Logic contract to change stats
    modifier onlyGameContract() {
        require(msg.sender == gameContract, "Caller is not the Game Contract");
        _;
    }

    // Step 1: Owner must call this to authorize the CaptainLog contract later
    function setGameContract(address _gameContract) external onlyOwner {
        gameContract = _gameContract;
    }

    // Main Mint Function
    function mintPirate(string memory _name) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        // Generate pseudo-random stats between 50 and 90
        uint8 randomCombat = uint8((uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, tokenId))) % 41) + 50);
        uint8 randomSailing = uint8((uint256(keccak256(abi.encodePacked(block.prevrandao, msg.sender, tokenId))) % 41) + 50);

        pirateStats[tokenId] = Pirate({
            name: _name,
            level: 1,
            combat: randomCombat,
            sailing: randomSailing,
            rank: 0
        });

        emit PirateMinted(msg.sender, tokenId, randomCombat, randomSailing);
        return tokenId;
    }

    // Called by CaptainLog to train crew
    function updateStats(uint256 tokenId, uint8 _combat, uint8 _sailing, uint256 _level) external onlyGameContract {
        Pirate storage pirate = pirateStats[tokenId];
        pirate.combat = _combat;
        pirate.sailing = _sailing;
        pirate.level = _level;
        
        emit StatsUpdated(tokenId, _level, _combat, _sailing);
    }

    // Called by CaptainLog to evolve crew
    function promoteRank(uint256 tokenId) external onlyGameContract {
        Pirate storage pirate = pirateStats[tokenId];
        pirate.rank = 1; // Promoted to Officer
    }

    // Helper for frontend to get all stats in one call
    function getPirateStats(uint256 tokenId) external view returns (Pirate memory) {
        return pirateStats[tokenId];
    }
}
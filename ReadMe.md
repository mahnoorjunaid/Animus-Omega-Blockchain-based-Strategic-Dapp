# The Jackdaw's Deck - Animus Protocol V4

### A Decentralized Fleet Management & Gambling Simulation
**Theme:** Assassin's Creed IV: Black Flag
**A Strategic Blockchain DAPP by Taha Haider, Noor e Zahra and Mahnoor Junaid**

---

## Project Overview
**The Jackdaw's Deck** is a full-stack dApp running on the Ethereum Sepolia Testnet. It goes beyond simple token swapping by simulating a high-stakes pirate economy. 

Players act as Fleet Commanders, recruiting crew members (NFTs), training them with Reales (ERC-20), and deploying them on risky expeditions where **on-chain RNG** determines the outcome.

---

## Technical Architecture (The 3-Contract System)
The system utilizes a modular smart contract architecture for security and scalability:

1.  **RealesToken (RLS) - [ERC-20]:**
    *   The in-game currency. Used for training fees and distributed as mission rewards.
    *   Includes `burn` mechanics for the "Promotion" feature.
2.  **PirateNFT (CREW) - [ERC-721]:**
    *   Represents unique crew members.
    *   Stores dynamic on-chain metadata: **Level, Combat, Sailing, Rank**.
    *   Access Control: Only the Game Contract is authorized to modify stats.
3.  **CaptainLogV3 (The Brain) - [Game Logic]:**
    *   **V3 Upgrade:** Implements a Probability Engine.
    *   **RNG Logic:** Unlike basic dApps, winning is not guaranteed. Win chance is calculated based on stats (capped at 85%), creating a true gambling loop.

---

## Gameplay Mechanics
1.  **Recruitment:** Mint unique pirates with randomized stats (CSS Sprites generated based on ID).
2.  **Strategic Map:** Players navigate a Caribbean map with 3 difficulty zones:
    *   **Nassau (Easy):** Low risk, low reward.
    *   **Kingston (Medium):** Strategy required.
    *   **Havana (Deadly):** High stats required.
3.  **The Gambling Loop:**
    *   Sending a pirate to battle triggers a transaction.
    *   The Smart Contract calculates a "Roll" (0-100) vs "Win Chance".
    *   **Victory:** Gold Rain FX + Token Reward.
    *   **Defeat:** Red Screen FX + Gas Fee Loss.
4.  **Permadeath Mechanic:** Players can "Walk the Plank" (Burn) underperforming crew members to clean their roster.

---

## Installation & Setup
1.  **Clone the Repository.**
2.  **Asset Check:** Ensure `logo.png`, `map_bg.jpg`, `bg.mp4`, and sprites (`p1.png`-`p6.png`, `enemy.png`) are in the root folder.
3.  **Run Locally:**
    *   This project requires a local server to inject Web3.
    *   **VS Code:** Right-click `index.html` -> "Open with Live Server".
4.  **Connect:**
    *   Click **Initialize Sequence**.
    *   Connect MetaMask (Sepolia Network).

---

## File Structure
*   `contracts/`: Solidity Smart Contracts.
*   `index.html`: The Animus Interface (DOM Structure).
*   `style.css`: Glassmorphism UI, Sprite Animations, Particle Systems.
*   `script.js`: Ethers.js integration, Audio Logic, Battle Engine.

---

## 👨‍💻 Credits
*   **Developers:** [Taha Haider, Noor e Zahra, Mahnoor Junaid]
*   **Assets:** Ubisoft (Visuals), Brian Tyler (Audio).

*   **Tech Stack:** Solidity, Hardhat/Remix, Ethers.js, HTML5.



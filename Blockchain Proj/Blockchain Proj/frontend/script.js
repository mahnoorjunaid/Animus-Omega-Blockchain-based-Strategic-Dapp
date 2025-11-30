// ==========================================
// 1. CONFIGURATION (PASTE YOUR ADDRESSES)
// ==========================================
const TOKEN_ADDRESS = "0x801faF37E6a1Ad0f79E2E92Feb9f8C0e3c4AD847"; 
const NFT_ADDRESS   = "0xceD3553be0F6Bcadb4580ea79D06f17C294b04ae";
const GAME_ADDRESS  = "0xF5F456391423eca09Fe3E20eFBe9d6aAe84a93A7";

// ==========================================
// 2. ABI DEFINITIONS (UPDATED FOR V2)
// ==========================================
const TOKEN_ABI = ["function approve(address spender, uint256 amount) external returns (bool)", "function balanceOf(address account) external view returns (uint256)", "function decimals() external view returns (uint8)"];

const NFT_ABI = [
    "function mintPirate(string memory _name) public returns (uint256)",
    "function getPirateStats(uint256 tokenId) external view returns (tuple(string name, uint256 level, uint8 combat, uint8 sailing, uint8 rank))",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
    "function transferFrom(address from, address to, uint256 tokenId) external", 
    "event PirateMinted(address owner, uint256 tokenId, uint8 combat, uint8 sailing)"
];

// V2 ABI: Note the new 'raid' functions
const GAME_ABI = [
    "function trainCrew(uint256 tokenId) external",
    "function promoteToOfficer(uint256 tokenId) external",
    "function raidNassau(uint256 tokenId) external",
    "function raidKingston(uint256 tokenId) external",
    "function raidHavana(uint256 tokenId) external",
    "event TrainingComplete(address indexed user, uint256 tokenId, uint256 newLevel)",
    "event PlunderResult(address indexed user, uint256 tokenId, bool victory, uint256 reward, string difficulty)",
    "event RankPromoted(address indexed user, uint256 tokenId)"
];

// ==========================================
// 3. GLOBAL VARIABLES
// ==========================================
let provider, signer, tokenContract, nftContract, gameContract, userAddress;
let selectedCaptainId = null; 
let currentCaptainStats = null;

// ==========================================
// 4. MUSIC & UI LOGIC
// ==========================================
async function enterAnimus() {
    try {
        const introAudio = document.getElementById("intro-music");
        const gameAudio = document.getElementById("game-music");
        introAudio.pause(); introAudio.currentTime = 0; 
        gameAudio.volume = 0.5; await gameAudio.play();
    } catch (e) { console.warn("Audio error:", e); }

    const overlay = document.getElementById("overlay");
    overlay.style.opacity = "0";
    
    setTimeout(() => {
        overlay.style.display = "none";
        document.getElementById("app").classList.remove("hidden");
        document.getElementById("crew-selection").classList.remove("hidden");
        document.getElementById("world-map").classList.add("hidden");
        document.getElementById("battle-overlay").classList.add("hidden");
        connectWallet();
    }, 1000);
    logToConsole("INITIALIZING ANIMUS V4.0...");
}

function logToConsole(msg) {
    const consoleDiv = document.getElementById("game-log");
    const timestamp = new Date().toLocaleTimeString();
    const newEntry = document.createElement("p");
    newEntry.innerHTML = `> [${timestamp}] ${msg}`;
    consoleDiv.appendChild(newEntry);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// ==========================================
// 5. BLOCKCHAIN CONNECTION
// ==========================================
async function connectWallet() {
    if (!window.ethereum) { alert("METAMASK NOT DETECTED!"); return; }
    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
        nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, signer);
        gameContract = new ethers.Contract(GAME_ADDRESS, GAME_ABI, signer);
        document.getElementById("btn-connect").innerText = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
        window.ethereum.on("chainChanged", () => window.location.reload());
        updateBalance();
        loadCrew();
    } catch (error) { console.error(error); logToConsole("ERROR: CONNECTION FAILED"); }
}

async function updateBalance() {
    if (!tokenContract) return;
    try {
        const balance = await tokenContract.balanceOf(userAddress);
        const formatted = ethers.formatUnits(balance, 18);
        document.getElementById("balance-display").innerText = `REALES: ${Math.floor(formatted)} RLS`;
    } catch (e) { console.error("Balance Error:", e); }
}

// ==========================================
// 6. GAME FLOW LOGIC (STRATEGY & SELECTION)
// ==========================================
function selectCaptain(id, level, combat, sailing, rank) {
    selectedCaptainId = id;
    currentCaptainStats = {
        level: Number(level),
        combat: Number(combat),
        sailing: Number(sailing),
        rank: Number(rank)
    };
    document.getElementById("crew-selection").classList.add("hidden");
    document.getElementById("world-map").classList.remove("hidden");
    logToConsole(`CAPTAIN SELECTED (PWR: ${Number(combat) + Number(sailing)}). AWAITING TARGET.`);
}

function showRoster() {
    document.getElementById("world-map").classList.add("hidden");
    document.getElementById("crew-selection").classList.remove("hidden");
    selectedCaptainId = null;
    currentCaptainStats = null;
}

function openMission(locationName) {
    if (selectedCaptainId === null) { alert("ERROR: DATA MISSING. RE-SELECT CAPTAIN."); showRoster(); return; }

    const combat = currentCaptainStats.combat;
    const sailing = currentCaptainStats.sailing;
    
    // --- DETERMINE MISSION TYPE & LOG FLAVOR TEXT ---
    let missionType = "";

    if (locationName === 'Nassau') {
        missionType = "Nassau";
        if (sailing > combat) logToConsole("⚠️ WARNING: SAILOR ATTACKING FORT...");
        else logToConsole("STRATEGY: INFANTRY DEPLOYED.");
    }
    else if (locationName === 'Kingston') {
        missionType = "Kingston";
        if (combat > sailing) logToConsole("⚠️ WARNING: SOLDIER IN SEA CHASE...");
        else logToConsole("STRATEGY: NAVIGATOR DEPLOYED.");
    }
    else if (locationName === 'Havana') {
        missionType = "Havana";
        logToConsole("STRATEGY: ELITE MISSION INITIATED.");
    }

    // Execute the plunder with the specific difficulty
    plunder(selectedCaptainId, missionType);
}

// ==========================================
// 7. CORE FUNCTIONS
// ==========================================
async function recruitPirate() {
    const name = document.getElementById("pirate-name").value;
    if (!name) { alert("ENTER NAME!"); return; }
    try {
        logToConsole(`RECRUITING ${name}...`);
        const tx = await nftContract.mintPirate(name);
        await tx.wait();
        logToConsole(`SUCCESS: ${name} JOINED!`);
        document.getElementById("pirate-name").value = "";
        loadCrew();
    } catch (error) { logToConsole("RECRUITMENT FAILED."); }
}

async function loadCrew() {
    const grid = document.getElementById("crew-grid");
    grid.innerHTML = '<p class="scanning">SCANNING...</p>';
    try {
        grid.innerHTML = "";
        let found = 0;
        for (let i = 0; i < 20; i++) {
            try {
                const owner = await nftContract.ownerOf(i);
                if (owner.toLowerCase() === userAddress.toLowerCase()) {
                    const stats = await nftContract.getPirateStats(i);
                    addCardToGrid(i, stats);
                    found++;
                }
            } catch (e) { break; }
        }
        if (found === 0) grid.innerHTML = '<p>NO CREW FOUND.</p>';
    } catch (error) { grid.innerHTML = '<p>ERROR LOADING CREW.</p>'; }
}

function addCardToGrid(id, stats) {
    const grid = document.getElementById("crew-grid");
    const rankColor = stats.rank == 1 ? "#D4AF37" : "#00ffff"; 
    
    const card = document.createElement("div");
    card.className = "pirate-card";
    
    // Pass stats to selectCaptain logic
    card.innerHTML = `
        <div class="pirate-rank" style="color:${rankColor}">${stats.rank == 1 ? "OFFICER" : "SWABBIE"}</div>
        <div class="pirate-sprite" style="border-color:${rankColor}"></div>
        <h3>${stats.name}</h3>
        <div class="pirate-stats">LVL:${stats.level} | ⚔️:${stats.combat} | ⛵:${stats.sailing}</div>
        <div class="card-actions">
            <button onclick="train(${id})">TRAIN (50 RLS)</button>
            <button onclick="selectCaptain(${id}, ${stats.level}, ${stats.combat}, ${stats.sailing}, ${stats.rank})" 
                    style="background: rgba(255, 0, 0, 0.3); border-color: red; color: white;">
                DEPLOY TO MAP
            </button>
            <button onclick="promote(${id})" style="border-color:${rankColor}">PROMOTE (100 RLS)</button>
            <button onclick="dismissPirate(${id})" style="margin-top:10px; border:1px solid #444; color:#888; font-size:0.6rem;">☠️ WALK THE PLANK</button>
        </div>
    `;
    grid.appendChild(card);
}

// ==========================================
// 8. BATTLE ENGINE (V2 LOGIC)
// ==========================================
async function plunder(id, missionType) {
    try {
        const overlay = document.getElementById("battle-overlay");
        const status = document.getElementById("battle-status");
        const myFighter = document.getElementById("my-fighter");
        
        // 1. SETUP VISUALS
        const imageIndex = (id % 6) + 1;
        myFighter.innerHTML = `<div class="pirate-sprite"></div>`;
        overlay.classList.remove("hidden");
        triggerBattleFX();
        status.innerText = "⚔️ BATTLE IN PROGRESS... (MINING)";
        
        // 2. CALL THE CORRECT V2 FUNCTION
        let tx;
        if (missionType === "Nassau") {
            logToConsole("⚠️ RAIDING NASSAU (Easy)...");
            tx = await gameContract.raidNassau(id);
        } else if (missionType === "Kingston") {
            logToConsole("⚠️ RAIDING KINGSTON (Medium)...");
            tx = await gameContract.raidKingston(id);
        } else if (missionType === "Havana") {
            logToConsole("⚠️ RAIDING HAVANA (Hard)...");
            tx = await gameContract.raidHavana(id);
        }

        // Animation Loop
        const interval = setInterval(() => {
             document.getElementById("enemy-target").classList.toggle("hit");
             try{ document.getElementById("sfx-sword").play(); } catch(e){}
        }, 800);

        await tx.wait();
        clearInterval(interval);
        
        // 3. CHECK RESULT (Balance Check)
        const initialBal = document.getElementById("balance-display").innerText;
        await updateBalance(); 
        const newBal = document.getElementById("balance-display").innerText;
        
        if (initialBal !== newBal) {
            status.innerText = "✅ VICTORY!";
            status.style.color = "#00ff00";
            document.getElementById("enemy-target").classList.add("dead");
            rainGold(40); // Loot shower
            logToConsole("✅ MISSION SUCCESS! REWARD CLAIMED.");
        } else {
            status.innerText = "❌ DEFEAT!";
            status.style.color = "red";
            document.getElementById("my-fighter").classList.add("dead");
            triggerBattleFX();
            logToConsole("❌ MISSION FAILED. ENEMY TOO STRONG.");
        }
        
        setTimeout(() => {
            overlay.classList.add("hidden");
            document.getElementById("enemy-target").classList.remove("dead");
            document.getElementById("my-fighter").classList.remove("dead");
            status.style.color = "white";
            showRoster(); 
        }, 3000);

    } catch (error) {
        document.getElementById("battle-overlay").classList.add("hidden");
        console.error(error);
        logToConsole("❌ TRANSACTION FAILED: " + (error.reason || error.message));
    }
}

async function train(id) {
    try {
        logToConsole(`TRAINING ID ${id}...`);
        const approveTx = await tokenContract.approve(GAME_ADDRESS, ethers.parseUnits("50", 18));
        await approveTx.wait();
        const tx = await gameContract.trainCrew(id);
        await tx.wait();
        logToConsole(`TRAINING COMPLETE! ID ${id} LEVEL UP!`);
        updateBalance(); loadCrew();
    } catch (error) { logToConsole("TRAINING FAILED."); }
}

async function promote(id) {
    try {
        logToConsole(`PROMOTING ID ${id}...`);
        const approveTx = await tokenContract.approve(GAME_ADDRESS, ethers.parseUnits("100", 18));
        await approveTx.wait();
        const tx = await gameContract.promoteToOfficer(id);
        await tx.wait();
        logToConsole(`PROMOTION APPROVED!`); loadCrew();
    } catch (error) { logToConsole("PROMOTION FAILED."); }
}

async function dismissPirate(id) {
    if (!confirm(`⚠️ BURN PIRATE #${id}?`)) return;
    try {
        logToConsole(`DISMISSING ID ${id}...`);
        const tx = await nftContract.transferFrom(userAddress, GAME_ADDRESS, id);
        await tx.wait();
        logToConsole(`ID ${id} DISMISSED.`);
        loadCrew();
    } catch (error) { logToConsole("DISMISSAL FAILED."); }
}

// FX Helpers
function triggerBattleFX() {
    const app = document.getElementById("app");
    app.classList.add("shake");
    document.body.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
    setTimeout(() => { app.classList.remove("shake"); document.body.style.backgroundColor = "transparent"; }, 500);
}

function rainGold(amount) {
    const count = amount || 30;
    for (let i = 0; i < count; i++) {
        const coin = document.createElement("div");
        coin.classList.add("gold-coin");
        coin.style.left = Math.random() * 100 + "vw";
        coin.style.animationDuration = (Math.random() * 2 + 0.5) + "s";
        document.body.appendChild(coin);
        setTimeout(() => coin.remove(), 2500);
    }
}

window.addEventListener('load', () => {
    const introAudio = document.getElementById("intro-music");
    const enableAudio = () => {
        if (introAudio.paused) introAudio.play().catch(e => console.log("Waiting..."));
        document.body.removeEventListener('click', enableAudio);
        document.body.removeEventListener('keydown', enableAudio);
    };
    document.body.addEventListener('click', enableAudio);
    document.body.addEventListener('keydown', enableAudio);
});
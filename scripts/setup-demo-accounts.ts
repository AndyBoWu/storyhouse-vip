#!/usr/bin/env node

/**
 * Setup Demo Accounts for StoryHouse.vip Demo
 * 
 * This script helps prepare demo accounts for Lucy's presentation
 * with pre-configured wallets and test data.
 */

import { ethers } from 'ethers';

// Demo Account Configuration
const DEMO_ACCOUNTS = {
  // Andy - Professional Author
  andy: {
    name: "Andy",
    role: "Professional Author & Platform Pioneer",
    wallet: "0x...", // Add Andy's test wallet address
    books: [
      {
        title: "The Quantum Paradox",
        genre: "Science Fiction",
        chapters: 10,
        freeChapters: 3,
        description: "A mind-bending journey through parallel universes"
      }
    ],
    tipBalance: "1000" // TIP tokens
  },

  // Bob - Free Reader (No MetaMask)
  bob: {
    name: "Bob",
    role: "Free Reader",
    wallet: null, // No wallet - free reader
    readingList: ["The Quantum Paradox - Ch 1-3"],
    notes: "Cannot access Chapter 4+ without wallet"
  },

  // Cecilia - Premium Reader
  cecilia: {
    name: "Cecilia", 
    role: "Premium Reader with MetaMask",
    wallet: "0x...", // Add Cecilia's test wallet address
    tipBalance: "50", // Enough for ~100 chapters
    unlockedChapters: [
      "The Quantum Paradox - Ch 4",
      "The Quantum Paradox - Ch 5"
    ]
  },

  // Daisy - Creative Writer & Remix Artist
  daisy: {
    name: "Daisy",
    role: "Creative Writer & Remix Artist",
    wallet: "0x...", // Add Daisy's test wallet address
    tipBalance: "100",
    derivatives: [
      {
        originalBook: "The Quantum Paradox",
        branchFromChapter: 4,
        title: "The Quantum Paradox: Mirror Universe",
        newChapters: ["Chapter 5 - Alternate Timeline"]
      }
    ]
  }
};

// Test Network Configuration
const STORY_TESTNET_RPC = "https://aeneid.storyrpc.io";
const TIP_TOKEN_ADDRESS = "0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E";
const HYBRID_CONTROLLER_ADDRESS = "0x995c07920fb8eC57cBA8b0E2be8903cB4434f9D6";

async function setupDemoAccounts() {
  console.log("🚀 Setting up demo accounts for StoryHouse.vip presentation\n");

  // Instructions for manual setup
  console.log("📋 Demo Account Setup Instructions:\n");
  
  console.log("1. Andy (Professional Author)");
  console.log("   - Create wallet with test funds");
  console.log("   - Register 'The Quantum Paradox' book");
  console.log("   - Publish 10 chapters (3 free, 7 paid)");
  console.log("   - Ensure book is registered in HybridRevenueController\n");

  console.log("2. Bob (Free Reader)");
  console.log("   - No wallet needed");
  console.log("   - Test reading Chapters 1-3");
  console.log("   - Show paywall at Chapter 4\n");

  console.log("3. Cecilia (Premium Reader)");
  console.log("   - Create wallet with 50 TIP tokens");
  console.log("   - Pre-unlock Chapters 4-5 of Andy's book");
  console.log("   - Show permanent access\n");

  console.log("4. Daisy (Remix Artist)");
  console.log("   - Create wallet with 100 TIP tokens");
  console.log("   - Create derivative from Chapter 4");
  console.log("   - Publish alternate Chapter 5\n");

  console.log("🔗 Important Addresses:");
  console.log(`   - TIP Token: ${TIP_TOKEN_ADDRESS}`);
  console.log(`   - HybridRevenueController: ${HYBRID_CONTROLLER_ADDRESS}`);
  console.log(`   - Story Testnet RPC: ${STORY_TESTNET_RPC}\n`);

  console.log("💡 Demo Flow Tips:");
  console.log("   - Start with Bob to show free access");
  console.log("   - Switch to Andy to show publishing");
  console.log("   - Use Cecilia to demonstrate payments");
  console.log("   - End with Daisy for creative remixing\n");

  // Generate test wallet addresses
  console.log("🔑 Generated Test Wallets (for reference):");
  for (let i = 0; i < 4; i++) {
    const wallet = ethers.Wallet.createRandom();
    const names = ["Andy", "Bob (skip)", "Cecilia", "Daisy"];
    if (i !== 1) { // Skip Bob (no wallet)
      console.log(`   ${names[i]}: ${wallet.address}`);
      console.log(`   Private Key: ${wallet.privateKey}`);
    }
  }

  console.log("\n⚠️  IMPORTANT: Add these wallets to MetaMask on the demo machine!");
  console.log("⚠️  Request test TIP tokens from the faucet or team!");
}

// Run the setup
setupDemoAccounts().catch(console.error);
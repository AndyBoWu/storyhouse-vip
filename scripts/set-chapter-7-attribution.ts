import { createWalletClient, createPublicClient, http, custom, parseEther, keccak256, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// This script sets the attribution for Chapter 7
// You'll need to run this with Andy's private key since only the book curator can set attribution

const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';
const CHAPTER_NUMBER = 7;
const HYBRID_REVENUE_CONTROLLER_V2_ADDRESS = '0x99dA048826Bbb8189FBB6C3e62EaA75d0fB36812';
const ANDY_ADDRESS = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2';

// You need to set this environment variable with Andy's private key
const PRIVATE_KEY = process.env.ANDY_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ Please set ANDY_PRIVATE_KEY environment variable');
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  transport: http('https://aeneid.storyrpc.io')
});

const walletClient = createWalletClient({
  account,
  transport: http('https://aeneid.storyrpc.io')
});

// ABI for setChapterAttribution
const SET_ATTRIBUTION_ABI = [
  {
    name: 'setChapterAttribution',
    type: 'function',
    inputs: [
      { name: 'bookId', type: 'bytes32' },
      { name: 'chapterNumber', type: 'uint256' },
      { name: 'originalAuthor', type: 'address' },
      { name: 'sourceBookId', type: 'bytes32' },
      { name: 'unlockPrice', type: 'uint256' },
      { name: 'isOriginalContent', type: 'bool' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  }
] as const;

async function main() {
  try {
    console.log('🔧 Setting attribution for Chapter 7');
    console.log('📘 Book:', BOOK_ID);
    console.log('📖 Chapter:', CHAPTER_NUMBER);
    console.log('👤 Author:', ANDY_ADDRESS);
    console.log('💰 Price: 0.5 TIP');
    console.log('');
    
    const bytes32Id = keccak256(toBytes(BOOK_ID));
    console.log('📝 BookId as bytes32:', bytes32Id);
    
    // Prepare transaction
    const unlockPrice = parseEther('0.5'); // 0.5 TIP
    
    console.log('📤 Sending transaction...');
    
    const hash = await walletClient.writeContract({
      address: HYBRID_REVENUE_CONTROLLER_V2_ADDRESS as `0x${string}`,
      abi: SET_ATTRIBUTION_ABI,
      functionName: 'setChapterAttribution',
      args: [
        bytes32Id,
        BigInt(CHAPTER_NUMBER),
        ANDY_ADDRESS as `0x${string}`,
        bytes32Id, // sourceBookId is same as bookId for original content
        unlockPrice,
        true // isOriginalContent
      ],
    });
    
    console.log('✅ Transaction submitted:', hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === 'success') {
      console.log('✅ Chapter 7 attribution set successfully!');
      console.log('🎉 Bob can now unlock the chapter');
    } else {
      console.log('❌ Transaction failed');
    }
    
  } catch (error) {
    console.error('❌ Error setting attribution:', error);
  }
}

main();
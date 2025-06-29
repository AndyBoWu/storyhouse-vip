import { keccak256, toBytes } from 'viem';

// From the error logs
const BYTES32_FROM_ERROR = '0xf96670e7a0056d36af8aa0c1d5ab1e7e65e071a759b65df656ae98b2494b96d2';

// Test different book ID formats
const bookIds = [
  '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix4',
  '0x3873C0d1BcFA245773b13b694A49dAc5b3F03cA2/project-phoenix4',
  '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/project-phoenix',
  '0x3873C0d1BcFA245773b13b694A49dAc5b3F03cA2/project-phoenix',
];

console.log('🔍 FINDING WHICH BOOK ID GENERATES THE ERROR BYTES32');
console.log('====================================================');
console.log('Error bytes32:', BYTES32_FROM_ERROR);
console.log('');

for (const bookId of bookIds) {
  const bytes32 = keccak256(toBytes(bookId));
  const matches = bytes32 === BYTES32_FROM_ERROR;
  
  console.log(`Book ID: ${bookId}`);
  console.log(`Bytes32: ${bytes32}`);
  console.log(`Matches: ${matches ? '✅ YES - THIS IS THE ONE!' : '❌ NO'}`);
  console.log('');
}

console.log('💡 INSIGHT:');
console.log('The matching book ID is what the frontend is using.');
console.log('Make sure this exact format has attribution set in the contract.');
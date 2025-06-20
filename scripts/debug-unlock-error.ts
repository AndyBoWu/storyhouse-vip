import { keccak256, toBytes } from 'viem';

const BOOK_ID = '0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2/the-detectives-portal';

console.log('📘 Book ID:', BOOK_ID);
const bytes32Id = keccak256(toBytes(BOOK_ID));
console.log('📝 BookId as bytes32:', bytes32Id);
console.log('');

// Check if this matches the suspicious address from the error
const suspiciousAddress = '0xc5885ddcabef9169393d01be7cf9b842529fb00dc24f696535e301ef3afb8df4';
console.log('🔍 Suspicious address from error:', suspiciousAddress);
console.log('');

// Compare without 0x prefix and case-insensitive
const bytes32IdLower = bytes32Id.toLowerCase().slice(2);
const suspiciousLower = suspiciousAddress.toLowerCase().slice(2);

// Check if they're similar (first part matches)
const firstPart = bytes32IdLower.slice(0, 32);
const suspFirstPart = suspiciousLower.slice(0, 32);

console.log('First 32 chars of bytes32Id:', firstPart);
console.log('First 32 chars of suspicious:', suspFirstPart);
console.log('Match?', firstPart === suspFirstPart);

// The suspicious address looks like it might be the bookId being used as an address!
console.log('\n💡 HYPOTHESIS:');
console.log('The error shows the bookId (bytes32) being used as the contract address!');
console.log('This suggests the arguments might be in the wrong order or wrong types.');
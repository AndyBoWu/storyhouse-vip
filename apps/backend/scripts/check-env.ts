#!/usr/bin/env tsx
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });

console.log('Environment Variables Check:');
console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME);
console.log('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL);
console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT ? 'Set' : 'Not set');
console.log('R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? 'Set' : 'Not set');
console.log('R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
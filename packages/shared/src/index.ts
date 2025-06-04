// Export all types
export * from './types';

// Export all constants
export * from './constants';

// Utility functions
export const formatTokenAmount = (amount: string | number, decimals: number = 18): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (value / Math.pow(10, decimals)).toFixed(4);
};

export const parseTokenAmount = (amount: string, decimals: number = 18): string => {
  const value = parseFloat(amount);
  return (value * Math.pow(10, decimals)).toString();
};

export const calculateReadingTime = (wordCount: number, wordsPerMinute: number = 200): number => {
  return Math.ceil(wordCount / wordsPerMinute);
};

export const generateStoryId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const truncateAddress = (address: string, startLength: number = 6, endLength: number = 4): string => {
  if (!address || address.length < startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const formatTimestamp = (timestamp: Date | string | number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

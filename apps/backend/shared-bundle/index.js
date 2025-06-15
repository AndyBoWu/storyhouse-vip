/**
 * @fileoverview Main entry point for @storyhouse/shared package
 * Exports types, services, and utilities for StoryHouse.vip
 */
// Export enhanced type guards and helpers
export { isEnhancedStory, isEnhancedChapter, isEnhancedUser, enhanceStory, enhanceChapter, enhanceUser } from './types/enhanced';
// Export IP service
export { IPService, createIPService, defaultStoryProtocolConfig } from './services/ipService';
// Export advanced Story Protocol service
export { AdvancedStoryProtocolService, LICENSE_TIERS, ROYALTY_POLICIES, TIPTokenEconomicsCalculator, advancedStoryProtocolService } from './services/advancedStoryProtocolService';
// Export data service
export { DataService, createDataService } from './services/dataService';
// Export all original types
export * from './types';
// Export all constants
export * from './constants';
// Utility functions
export const formatTokenAmount = (amount, decimals = 18) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return (value / Math.pow(10, decimals)).toFixed(4);
};
export const parseTokenAmount = (amount, decimals = 18) => {
    const value = parseFloat(amount);
    return (value * Math.pow(10, decimals)).toString();
};
export const calculateReadingTime = (wordCount, wordsPerMinute = 200) => {
    return Math.ceil(wordCount / wordsPerMinute);
};
export const generateStoryId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
export const truncateAddress = (address, startLength = 6, endLength = 4) => {
    if (!address || address.length < startLength + endLength)
        return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};
export const isValidEthereumAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};
export const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};
// Story Collection utilities
export const calculateCollectionRevenue = (totalRevenue, revenueShare) => {
    return {
        creatorShare: (totalRevenue * revenueShare.creator) / 100,
        collectionShare: (totalRevenue * revenueShare.collection) / 100,
        platformShare: (totalRevenue * revenueShare.platform) / 100
    };
};
// IP operation utilities
export const getOperationDisplayName = (operationType) => {
    const displayNames = {
        register: 'Register IP Asset',
        license: 'Create License',
        derivative: 'Register Derivative',
        royalty: 'Claim Royalties',
        collection: 'Join Collection'
    };
    return displayNames[operationType] || operationType;
};
// License tier utilities
export const getTierByPrice = (price) => {
    if (price === 100)
        return 'standard';
    if (price === 500)
        return 'premium';
    if (price === 2000)
        return 'exclusive';
    return 'custom';
};
// Analytics utilities
export const calculateEngagementScore = (analytics) => {
    const readWeight = 0.3;
    const completionWeight = 0.25;
    const socialWeight = 0.25;
    const revenueWeight = 0.2;
    const normalizedReads = Math.min(analytics.totalReads / 1000, 1);
    const normalizedCompletion = analytics.completionRate / 100;
    const normalizedSocial = Math.min((analytics.likes + analytics.shares + analytics.comments) / 100, 1);
    const normalizedRevenue = Math.min(analytics.totalRewards / 10000, 1);
    return Math.round((normalizedReads * readWeight +
        normalizedCompletion * completionWeight +
        normalizedSocial * socialWeight +
        normalizedRevenue * revenueWeight) * 100);
};
//# sourceMappingURL=index.js.map
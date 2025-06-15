/**
 * @fileoverview Enhanced types that extend existing StoryHouse.vip types with IP functionality
 * Maintains backward compatibility while adding Story Protocol features
 */
// Type guards to check if enhanced features are available
export function isEnhancedStory(story) {
    return 'ipRegistrationStatus' in story;
}
export function isEnhancedChapter(chapter) {
    return 'ipRegistrationStatus' in chapter;
}
export function isEnhancedUser(user) {
    return 'ipAssetsCreated' in user;
}
// Migration helpers for converting existing data
export function enhanceStory(story) {
    return {
        ...story,
        ipRegistrationStatus: 'none',
        licenseStatus: 'none',
        availableLicenseTypes: [],
        royaltyEarnings: 0,
        hasClaimableRoyalties: false,
        collections: []
    };
}
export function enhanceChapter(chapter) {
    return {
        ...chapter,
        ipRegistrationStatus: 'none',
        isPartOfStoryIP: true
    };
}
export function enhanceUser(user) {
    return {
        ...user,
        ipAssetsCreated: 0,
        ipAssetsOwned: 0,
        licensesOwned: 0,
        royaltiesEarned: 0,
        collectionsJoined: [],
        collectionsCreated: []
    };
}
//# sourceMappingURL=enhanced.js.map
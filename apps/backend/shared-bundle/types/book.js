/**
 * Book Registration & Branching System Types
 *
 * This file defines the complete type system for StoryHouse.vip's revolutionary
 * collaborative book ecosystem where books are parent IP assets and chapters
 * are derivatives, enabling seamless branching and revenue sharing.
 */
// ===== CONSTANTS =====
export const BOOK_SYSTEM_CONSTANTS = {
    // Storage
    BOOKS_ROOT_PATH: '/books',
    CHAPTERS_FOLDER_NAME: 'chapters',
    METADATA_FILENAME: 'metadata.json',
    COVER_FILENAME: 'cover.jpg',
    // Validation
    MIN_TITLE_LENGTH: 3,
    MAX_TITLE_LENGTH: 100,
    MIN_DESCRIPTION_LENGTH: 10,
    MAX_DESCRIPTION_LENGTH: 1000,
    MAX_SLUG_LENGTH: 50,
    // Revenue Sharing (default percentages)
    DEFAULT_CHAPTER_AUTHOR_SHARE: 80,
    DEFAULT_BOOK_CURATOR_SHARE: 10,
    DEFAULT_PLATFORM_SHARE: 10,
    // File Upload
    MAX_COVER_SIZE_MB: 5,
    ALLOWED_COVER_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    // Patterns
    SLUG_PATTERN: /^[a-z0-9-]+$/,
    BOOK_ID_PATTERN: /^0x[a-fA-F0-9]{40}-[a-z0-9-]+$/,
};
// Types are exported automatically by the interface declarations above
//# sourceMappingURL=book.js.map
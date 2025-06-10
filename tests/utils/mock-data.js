/**
 * Mock Data for StoryHouse.vip Tests
 * Shared test data across all test suites
 */

/**
 * Mock story content for testing
 */
const mockStory = {
  title: "The Test Adventure",
  content: "Detective Sarah Chen never believed in automated testing until she discovered a mysterious bug that could only be reproduced on Tuesdays. Armed with nothing but her debugging skills and a cup of cold coffee, she embarked on a journey through stack traces and error logs that would change her life forever. Little did she know, this bug was just the beginning of a much larger conspiracy involving race conditions, memory leaks, and the dreaded null pointer exception.",
  genre: "mystery",
  mood: "thrilling",
  authorAddress: "0x1234567890123456789012345678901234567890",
  authorName: "Test Author",
  storyId: "test_story_12345",
  chapterNumber: 1,
};

/**
 * Mock book metadata
 */
const mockBook = {
  bookId: "0x1234-test-adventure",
  title: "The Test Adventure",
  description: "A thrilling story about debugging and discovery",
  authorAddress: "0x1234567890123456789012345678901234567890",
  authorName: "Test Author",
  slug: "test-adventure",
  coverUrl: "https://test-r2-endpoint.com/books/0x1234-test-adventure/cover.jpg",
  ipAssetId: "0xabc123...",
  licenseTermsId: "123",
  chapters: 3,
  derivativeBooks: [],
  chapterMap: {
    "ch1": "0x1234-test-adventure/chapters/ch1",
    "ch2": "0x1234-test-adventure/chapters/ch2",
    "ch3": "0x1234-test-adventure/chapters/ch3"
  },
  originalAuthors: {
    "0x1234567890123456789012345678901234567890": {
      chapters: ["ch1", "ch2", "ch3"],
      revenueShare: 100
    }
  }
};

/**
 * Mock chapter metadata
 */
const mockChapter = {
  chapterNumber: 1,
  title: "The Beginning",
  summary: "Sarah discovers the mysterious bug",
  content: mockStory.content,
  wordCount: 120,
  readingTime: 1,
  unlockPrice: 0,
  readReward: 0.05,
  isUnlocked: true,
  authorAddress: "0x1234567890123456789012345678901234567890",
  authorName: "Test Author",
  metadata: {
    genre: ["mystery", "tech"],
    mood: "thrilling",
    contentRating: "PG-13",
    qualityScore: 85,
    originalityScore: 90,
    generationMethod: "human"
  }
};

/**
 * Mock API responses
 */
const mockApiResponses = {
  healthCheck: {
    success: true,
    message: "StoryHouse API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  },
  
  storiesSuccess: {
    success: true,
    stories: [mockStory],
    count: 1
  },
  
  booksSuccess: {
    success: true,
    books: [mockBook]
  },
  
  generateSuccess: {
    success: true,
    data: {
      title: "Chapter 1: The Discovery",
      content: mockStory.content,
      storyId: "story_test_12345",
      chapterNumber: 1,
      contentUrl: "https://test-r2-endpoint.com/stories/story_test_12345/chapters/1.json",
      metadata: {
        suggestedTags: ["mystery", "debugging", "adventure"],
        suggestedGenre: "Mystery Tech",
        contentRating: "PG-13",
        qualityScore: 87,
        originalityScore: 94,
        commercialViability: 76,
        generatedAt: new Date().toISOString()
      }
    },
    message: "Story generated successfully!"
  },
  
  error: {
    success: false,
    error: "Test error message",
    code: "TEST_ERROR",
    details: {
      field: "test",
      timestamp: new Date().toISOString()
    }
  }
};

/**
 * Mock blockchain data
 */
const mockBlockchain = {
  testnetConfig: {
    chainId: 1315,
    name: "Story Protocol Aeneid Testnet",
    rpcUrl: "https://aeneid.storyrpc.io",
    explorerUrl: "https://aeneid.storyscan.io"
  },
  
  contractAddresses: {
    tipToken: "0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E",
    rewardsManager: "0xf5ae031ba92295c2ae86a99e88f09989339707e5",
    spgNftContract: "0x26b6aa7e7036fc9e8fa2d8184c2cf07ae2e2412d"
  },
  
  transactionHash: "0xdef456789012345678901234567890123456789012345678901234567890abcd",
  ipAssetId: "0xabc123456789012345678901234567890123456789012345678901234567890def",
  gasUsed: "245000",
  blockNumber: "12345678"
};

/**
 * Test user profiles
 */
const testUsers = {
  alice: {
    address: "0x1111111111111111111111111111111111111111",
    name: "Alice",
    role: "author"
  },
  bob: {
    address: "0x2222222222222222222222222222222222222222", 
    name: "Bob",
    role: "reader"
  },
  charlie: {
    address: "0x3333333333333333333333333333333333333333",
    name: "Charlie", 
    role: "remixer"
  }
};

module.exports = {
  mockStory,
  mockBook,
  mockChapter,
  mockApiResponses,
  mockBlockchain,
  testUsers,
};
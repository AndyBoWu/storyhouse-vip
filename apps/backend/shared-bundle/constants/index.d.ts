export declare const STORY_PROTOCOL_TESTNET: {
    readonly id: 1315;
    readonly name: "Story Protocol Testnet";
    readonly nativeCurrency: {
        readonly decimals: 18;
        readonly name: "IP Token";
        readonly symbol: "IP";
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://aeneid.storyrpc.io"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "Story Protocol Explorer";
            readonly url: "https://aeneid.storyscan.xyz";
        };
    };
    readonly testnet: true;
};
export declare const TIP_TOKEN_CONFIG: {
    readonly name: "TIP Token";
    readonly symbol: "TIP";
    readonly decimals: 18;
    readonly initialSupply: "1000000000";
    readonly maxSupply: "10000000000";
};
export declare const REWARDS_CONFIG: {
    readonly readRewardPerChapter: 10;
    readonly creatorRoyaltyBps: 500;
    readonly remixFeeBps: 250;
    readonly maxChaptersPerStory: 50;
    readonly minWordsPerChapter: 500;
};
export declare const STORY_CONFIG: {
    readonly maxPlotDescriptionLength: 500;
    readonly maxTitleLength: 100;
    readonly maxContentLength: 50000;
    readonly defaultReadingWordsPerMinute: 200;
    readonly genres: readonly ["Fantasy", "Science Fiction", "Mystery", "Romance", "Horror", "Adventure", "Drama", "Comedy"];
    readonly moods: readonly ["Dark & Gritty", "Light & Whimsical", "Mysterious", "Romantic", "Epic & Heroic", "Humorous"];
    readonly emojis: readonly ["⚔️", "🏰", "🌟", "💀", "🔮", "👑", "🐉", "🗡️", "🏛️", "🌙", "🔥", "💎", "🦋", "🌺", "⭐", "🎭"];
};
export declare const API_CONFIG: {
    readonly baseUrl: "https://testnet.storyhouse.vip" | "http://localhost:3000";
    readonly endpoints: {
        readonly generateStory: "/api/generate";
        readonly stories: "/api/stories";
        readonly users: "/api/users";
        readonly rewards: "/api/rewards";
        readonly contracts: "/api/contracts";
    };
};
export declare const CONTRACT_ADDRESSES: {
    readonly development: {
        readonly tipToken: "0x0000000000000000000000000000000000000000";
        readonly storyRewards: "0x0000000000000000000000000000000000000000";
        readonly contentNFT: "0x0000000000000000000000000000000000000000";
        readonly remixLicensing: "0x0000000000000000000000000000000000000000";
    };
    readonly testnet: {
        readonly tipToken: "0x0000000000000000000000000000000000000000";
        readonly storyRewards: "0x0000000000000000000000000000000000000000";
        readonly contentNFT: "0x0000000000000000000000000000000000000000";
        readonly remixLicensing: "0x0000000000000000000000000000000000000000";
    };
    readonly production: {
        readonly tipToken: "0x0000000000000000000000000000000000000000";
        readonly storyRewards: "0x0000000000000000000000000000000000000000";
        readonly contentNFT: "0x0000000000000000000000000000000000000000";
        readonly remixLicensing: "0x0000000000000000000000000000000000000000";
    };
};
export declare const VALIDATION_PATTERNS: {
    readonly ethereumAddress: RegExp;
    readonly transactionHash: RegExp;
    readonly email: RegExp;
    readonly username: RegExp;
};
export declare const ERROR_MESSAGES: {
    readonly invalidAddress: "Invalid Ethereum address";
    readonly invalidTransactionHash: "Invalid transaction hash";
    readonly invalidEmail: "Invalid email address";
    readonly invalidUsername: "Username must be 3-20 characters, alphanumeric and underscores only";
    readonly walletNotConnected: "Please connect your wallet";
    readonly networkNotSupported: "Please switch to Story Protocol testnet";
    readonly insufficientBalance: "Insufficient token balance";
    readonly rewardAlreadyClaimed: "Reward already claimed for this chapter";
    readonly storyNotFound: "Story not found";
    readonly chapterNotFound: "Chapter not found";
    readonly unauthorized: "Unauthorized access";
    readonly serverError: "Server error, please try again";
};
export declare const SUCCESS_MESSAGES: {
    readonly storyCreated: "Story created successfully";
    readonly rewardClaimed: "Reward claimed successfully";
    readonly storyPublished: "Story published successfully";
    readonly walletConnected: "Wallet connected successfully";
    readonly transactionConfirmed: "Transaction confirmed";
};
//# sourceMappingURL=index.d.ts.map
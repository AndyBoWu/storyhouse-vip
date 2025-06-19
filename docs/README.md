# StoryHouse V2 Documentation

Welcome to StoryHouse V2 - A Story Protocol native multi-language publishing platform.

## 🌍 What's New in V2

StoryHouse V2 is a complete reimagining of our platform, built from the ground up to fully embrace Story Protocol's parent-child IP architecture:

- **Chapter-Level IPs**: Each chapter is its own intellectual property
- **Multi-Language Support**: Translations as derivative IPs with automatic royalty flows
- **Author-Owned Translations**: Authors retain ownership of all language versions
- **AI-Powered Quality**: Fraud detection and translation verification
- **Story Protocol Native**: No custom contracts - pure Story Protocol implementation

## 📚 Documentation Structure

- [Architecture Overview](./architecture/README.md) - System design and technical decisions
- [Getting Started](./getting-started/README.md) - Setup and development guide
- [API Reference](./api/README.md) - Backend API documentation
- [Smart Contracts](./contracts/README.md) - Story Protocol integration
- [Translation System](./translation/README.md) - Multi-language implementation
- [Royalty Flows](./royalties/README.md) - Revenue distribution model

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/AndyBoWu/storyhouse-vip.git
cd storyhouse-vip
git checkout v2-story-protocol-native

# Install dependencies
npm install

# Start development
npm run dev
```

## 🎯 Key Concepts

### IP Hierarchy
```
📚 Book (Metadata Collection)
  └── 📄 Chapter IP (Original Language)
      ├── 🌍 Translation IP (Owned by Author)
      ├── 🌍 Translation IP (Owned by Author)
      └── 🎧 Audio Version IP (Sub-derivative)
```

### Revenue Model
- **Original Author**: Receives 100% of original chapter revenue + 25% from all translations
- **Translators**: Receive 75% of their translation's revenue (as service providers)
- **Sub-derivatives**: Pay 20% to their parent translation

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](../LICENSE) for details.
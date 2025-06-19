# StoryHouse.vip

Web3 storytelling platform built on Story Protocol Layer 1 blockchain with chapter-level IP management.

## Features

- **Chapter Access**: Unlock premium chapters with $TIP tokens
- **Content Protection**: AI-powered fraud detection and quality assurance
- **Derivative Works**: Create licensed derivatives and earn through revenue sharing
- **Progressive Paywall**: First 3 chapters free, chapter 4+ require $TIP tokens
- **MetaMask Integration**: Seamless Web3 wallet connection for token transactions

## Live Demo

- **Production**: [https://testnet.storyhouse.vip](https://testnet.storyhouse.vip)
- **Creator Interface**: [/create](https://testnet.storyhouse.vip/create)

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS, Framer Motion
- **AI**: OpenAI GPT-4o for story generation
- **Blockchain**: Story Protocol Layer 1 (planned)
- **Deployment**: Vercel with custom domain
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (for AI story generation)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/AndyBoWu/storyhouse-vip.git
cd storyhouse-vip
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Create .env.local file
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env.local
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

The following environment variables are required:

- `OPENAI_API_KEY`: Your OpenAI API key for story generation
  - Get it from: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
  - Add billing information to your OpenAI account
  - The app uses GPT-4o model for high-quality story generation

## API Endpoints

### POST `/api/generate`

Generate a story chapter using AI.

**Request Body:**

```json
{
  "plotDescription": "A young detective discovers a hidden portal...",
  "genres": ["Mystery", "Fantasy"],
  "moods": ["Suspenseful", "Epic Adventure"],
  "emojis": ["🔍", "✨", "🚪"],
  "chapterNumber": 1,
  "previousContent": "Previous chapter summary..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "title": "The Discovery",
    "content": "Detective Sarah Chen had always found comfort...",
    "wordCount": 1247,
    "readingTime": 6,
    "themes": ["mystery", "portal", "adventure", "discovery"]
  }
}
```

## Project Structure

```
src/
├── app/
│   ├── api/generate/          # AI story generation API
│   ├── create/                # Story creation interface
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── lib/
│   └── ai/
│       └── openai.ts         # OpenAI integration
└── components/               # Reusable UI components (planned)
```

## Deployment

The app is automatically deployed to Vercel via GitHub integration:

1. Push changes to the `main` branch
2. Vercel automatically builds and deploys
3. Set environment variables in Vercel dashboard
4. Custom domain configured at `testnet.storyhouse.vip`

### Vercel Environment Variables

In your Vercel dashboard, add:

- `OPENAI_API_KEY`: Your OpenAI API key

## Story Creation Workflow

1. **Plot Input**: Authors describe their story concept (500 char limit)
2. **Creative Elements**: Optional genre, mood, and emoji selection
3. **AI Generation**: GPT-4o creates engaging chapters with:
   - Compelling hooks and cliffhangers
   - Rich sensory details and character development
   - Platform-optimized length (800-1500 words)
   - Monetization-aware structure
4. **Preview & Edit**: Authors can regenerate, edit, or publish
5. **Publication**: Stories go live with tokenized access model

## AI Prompt Engineering

The story generation uses carefully crafted prompts that:

- Emphasize reader engagement and monetization context
- Create platform-specific content (free chapters 1-3, paid 4+)
- Include cliffhangers to drive continued reading
- Optimize for $TIP token earning mechanics
- Adapt to user-selected genres, moods, and themes

## Future Roadmap

- [ ] Story Protocol blockchain integration
- [ ] $TIP token smart contracts
- [ ] MetaMask wallet connection
- [ ] User authentication and story management
- [ ] Advanced AI features (image generation, voice narration)
- [ ] Community features and story remixing
- [ ] Revenue sharing and creator analytics

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

- GitHub: [@AndyBoWu](https://github.com/AndyBoWu)
- Project: [StoryHouse.vip](https://testnet.storyhouse.vip)
# Deployment Test - Thu Jun 12 11:58:41 PDT 2025

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
- **AI**: OpenAI GPT-4 for content protection, translation, and recommendations
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

- `OPENAI_API_KEY`: Your OpenAI API key for AI services
  - Get it from: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
  - Add billing information to your OpenAI account
  - The app uses GPT-4 for fraud detection, translation, and recommendations

## API Endpoints

### POST `/api/content/validate`

Validate content for fraud detection and quality.

**Request Body:**

```json
{
  "content": "Detective Sarah Chen had always found comfort...",
  "language": "en",
  "services": ["fraud", "quality"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "fraudDetection": {
      "isPotentialFraud": false,
      "similarityScore": 0.12,
      "analysis": "Content appears to be original"
    },
    "qualityScore": 85,
    "readability": "Grade 8",
    "suggestions": ["Consider adding more dialogue", "Strong opening hook"]
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
3. **Content Creation**: Authors write original content with:
   - AI-powered fraud detection for originality
   - Quality analysis and improvement suggestions
   - Platform-optimized length (800-1500 words)
   - Clear monetization structure
4. **Preview & Edit**: Authors can regenerate, edit, or publish
5. **Publication**: Stories go live with tokenized access model

## AI Services

The platform uses AI to enhance content quality and accessibility:

- **Fraud Detection**: Verify content originality and prevent plagiarism
- **Translation Services**: Automatically translate content to multiple languages
- **Text-to-Audio**: Generate audiobook versions of chapters
- **Smart Recommendations**: Personalized content suggestions based on reading history
- **Quality Analysis**: Provide feedback on readability and engagement

## Future Roadmap

- [ ] Story Protocol blockchain integration
- [ ] $TIP token smart contracts
- [ ] MetaMask wallet connection
- [ ] User authentication and story management
- [ ] Advanced AI features (enhanced fraud detection, multi-language support)
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

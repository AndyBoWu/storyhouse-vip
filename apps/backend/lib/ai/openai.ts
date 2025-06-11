import OpenAI from 'openai'

let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openai
}

export interface StoryGenerationRequest {
  plotDescription: string
  genres?: string[]
  moods?: string[]
  emojis?: string[]
  chapterNumber?: number
  previousContent?: string
  storyId?: string
  bookId?: string
}

export interface StoryGenerationResponse {
  title: string
  content: string
  wordCount: number
  readingTime: number
  themes: string[]
  storyId?: string
  bookId?: string
  chapterNumber: number
}

export async function generateStoryChapter(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
  const {
    plotDescription,
    genres = [],
    moods = [],
    emojis = [],
    chapterNumber = 1,
    previousContent = '',
    storyId,
    bookId
  } = request

  // Build context from selections
  const genreContext = genres.length > 0 ? `Genres: ${genres.join(', ')}` : ''
  const moodContext = moods.length > 0 ? `Mood/Style: ${moods.join(', ')}` : ''
  const emojiContext = emojis.length > 0 ? `Emotional elements: ${emojis.join(' ')}` : ''

  const contextualPrompt = [genreContext, moodContext, emojiContext]
    .filter(Boolean)
    .join('\n')

  const systemPrompt = `You are an expert storyteller and author for StoryHouse.vip, a platform where readers earn tokens for engaging content. Your goal is to create compelling, immersive stories that keep readers hooked and wanting to continue.

WRITING GUIDELINES:
- Create vivid, engaging scenes that pull readers in immediately
- Use rich sensory details and emotional depth
- Build tension and intrigue to encourage continued reading
- Write in a style that's accessible yet sophisticated
- Include cliffhangers and hooks to drive engagement
- Each chapter should be 800-1500 words for optimal reading experience
- Focus on character development and world-building

STORY MONETIZATION CONTEXT:
- Chapters 1-3 are free to hook readers
- Chapter 4+ require $TIP tokens to unlock
- Readers earn $TIP tokens for completing chapters
- Stories should be compelling enough that readers want to spend tokens to continue
- Each chapter should end with enough intrigue to justify the next chapter purchase

OUTPUT FORMAT:
- Provide a compelling chapter title
- Write engaging chapter content
- Ensure the chapter ends with a hook for the next chapter
- Content should be publication-ready for the platform

${contextualPrompt ? `\nCONTEXT FOR THIS STORY:\n${contextualPrompt}` : ''}`

  const userPrompt = chapterNumber === 1
    ? `Write Chapter 1 based on this plot: "${plotDescription}"

Create an engaging opening that establishes the world, introduces key characters, and sets up the central conflict or mystery. End with a hook that makes readers want to continue to Chapter 2.`
    : `Continue the story with Chapter ${chapterNumber}.

Previous content summary: ${previousContent}

Plot context: "${plotDescription}"

Build on the established story while advancing the plot and deepening character development. End with a compelling cliffhanger or revelation.`

  try {
    const openaiClient = getOpenAIClient()
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8, // Creative but not too random
      max_tokens: 2000,
      presence_penalty: 0.3, // Encourage new ideas
      frequency_penalty: 0.3, // Reduce repetition
    })

    const content = completion.choices[0]?.message?.content || ''

    // Extract title from content (assume first line is title)
    const lines = content.split('\n').filter(line => line.trim())
    const title = lines[0]?.replace(/^Chapter \d+:?\s*/, '') || `Chapter ${chapterNumber}: Untitled`
    const actualContent = lines.slice(1).join('\n').trim()

    // Calculate metrics
    const wordCount = actualContent.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200) // 200 words per minute average

    // Extract themes from the content for metadata
    const themes = extractThemes(actualContent, genres, moods)

    return {
      title,
      content: actualContent,
      wordCount,
      readingTime,
      themes,
      storyId,
      bookId,
      chapterNumber
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate story content. Please try again.')
  }
}

function extractThemes(content: string, genres: string[], moods: string[]): string[] {
  const themes = new Set<string>()

  // Add explicit genres and moods
  genres.forEach(genre => themes.add(genre.toLowerCase()))
  moods.forEach(mood => themes.add(mood.toLowerCase()))

  // Extract common themes from content
  const commonThemes = [
    'adventure', 'mystery', 'romance', 'friendship', 'family',
    'betrayal', 'discovery', 'magic', 'technology', 'nature',
    'power', 'love', 'loss', 'hope', 'courage', 'sacrifice'
  ]

  const lowerContent = content.toLowerCase()
  commonThemes.forEach(theme => {
    if (lowerContent.includes(theme)) {
      themes.add(theme)
    }
  })

  return Array.from(themes).slice(0, 5) // Limit to 5 themes
}

export async function generateStoryTitle(plotDescription: string, genres: string[]): Promise<string> {
  const systemPrompt = `You are a creative title generator for StoryHouse.vip. Create compelling, marketable titles that would attract readers and encourage them to start reading.

GUIDELINES:
- Titles should be 2-6 words
- Make them intriguing and memorable
- Avoid clichés unless they're cleverly subverted
- Consider the target audience for the genre
- Make titles that would look good on a book cover or story listing`

  const userPrompt = `Generate a compelling title for a ${genres.join(', ')} story with this plot: "${plotDescription}"`

  try {
    const openaiClient = getOpenAIClient()
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 50,
    })

    return completion.choices[0]?.message?.content?.replace(/["']/g, '').trim() || 'Untitled Story'
  } catch (error) {
    console.error('Title generation error:', error)
    return 'Untitled Story'
  }
}

// =============================================================================
// CONTENT SIMILARITY ANALYSIS - Phase 3.1.1 Implementation
// =============================================================================

export interface ContentEmbedding {
  vector: number[]
  model: string
  dimensions: number
  createdAt: string
}

export interface SimilarityAnalysisResult {
  similarityScore: number
  confidence: number
  analysisType: 'content' | 'structure' | 'theme' | 'comprehensive'
  factors: {
    contentSimilarity: number
    structuralSimilarity: number
    themeSimilarity: number
    styleSimilarity: number
  }
  metadata: {
    originalWordCount: number
    derivativeWordCount: number
    analysisTimestamp: string
  }
}

/**
 * Generate content embedding using OpenAI's text-embedding-3-small model
 * Cost-effective choice for similarity analysis with good performance
 */
export async function generateContentEmbedding(content: string): Promise<ContentEmbedding> {
  try {
    const openaiClient = getOpenAIClient()
    
    // Prepare content for embedding - remove excessive whitespace and limit length
    const cleanContent = content
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000) // Stay within token limits
    
    if (!cleanContent) {
      throw new Error('Content is empty or too short for embedding generation')
    }

    const embedding = await openaiClient.embeddings.create({
      model: "text-embedding-3-small",
      input: cleanContent,
      dimensions: 1536 // Using standard dimensions for good performance/cost balance
    })

    const vector = embedding.data[0]?.embedding
    if (!vector || vector.length === 0) {
      throw new Error('Failed to generate embedding vector')
    }

    return {
      vector,
      model: "text-embedding-3-small",
      dimensions: vector.length,
      createdAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Embedding generation error:', error)
    throw new Error(`Failed to generate content embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns similarity score between -1 and 1 (higher = more similar)
 */
export function calculateSimilarityScore(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embedding vectors must have the same dimensions')
  }

  if (embedding1.length === 0) {
    throw new Error('Embedding vectors cannot be empty')
  }

  // Calculate dot product
  let dotProduct = 0
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i]
  }

  // Calculate magnitudes
  let magnitude1 = 0
  let magnitude2 = 0
  for (let i = 0; i < embedding1.length; i++) {
    magnitude1 += embedding1[i] * embedding1[i]
    magnitude2 += embedding2[i] * embedding2[i]
  }

  magnitude1 = Math.sqrt(magnitude1)
  magnitude2 = Math.sqrt(magnitude2)

  // Avoid division by zero
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0
  }

  // Calculate cosine similarity
  const similarity = dotProduct / (magnitude1 * magnitude2)
  
  // Ensure result is within [-1, 1] range due to floating point precision
  return Math.max(-1, Math.min(1, similarity))
}

/**
 * Comprehensive content similarity analysis with multi-factor scoring
 */
export async function analyzeContentSimilarity(
  originalContent: string,
  derivativeContent: string
): Promise<SimilarityAnalysisResult> {
  try {
    // Generate embeddings for both contents
    const [originalEmbedding, derivativeEmbedding] = await Promise.all([
      generateContentEmbedding(originalContent),
      generateContentEmbedding(derivativeContent)
    ])

    // Calculate base similarity score
    const baseSimilarity = calculateSimilarityScore(
      originalEmbedding.vector,
      derivativeEmbedding.vector
    )

    // Analyze structural similarity (paragraph structure, length patterns)
    const structuralSimilarity = analyzeStructuralSimilarity(originalContent, derivativeContent)

    // Analyze theme similarity using theme extraction
    const originalThemes = extractThemes(originalContent, [], [])
    const derivativeThemes = extractThemes(derivativeContent, [], [])
    const themeSimilarity = calculateThemeSimilarity(originalThemes, derivativeThemes)

    // Analyze style similarity (sentence length, complexity patterns)
    const styleSimilarity = analyzeStyleSimilarity(originalContent, derivativeContent)

    // Calculate comprehensive similarity with weighted factors
    const weights = {
      content: 0.4,      // 40% - primary content similarity
      structural: 0.2,   // 20% - structure and organization
      theme: 0.25,       // 25% - thematic content
      style: 0.15        // 15% - writing style
    }

    const comprehensiveSimilarity = 
      (baseSimilarity * weights.content) +
      (structuralSimilarity * weights.structural) +
      (themeSimilarity * weights.theme) +
      (styleSimilarity * weights.style)

    // Calculate confidence based on content length and quality
    const confidence = calculateAnalysisConfidence(originalContent, derivativeContent, baseSimilarity)

    return {
      similarityScore: Math.max(0, Math.min(1, comprehensiveSimilarity)),
      confidence,
      analysisType: 'comprehensive',
      factors: {
        contentSimilarity: Math.max(0, Math.min(1, baseSimilarity)),
        structuralSimilarity: Math.max(0, Math.min(1, structuralSimilarity)),
        themeSimilarity: Math.max(0, Math.min(1, themeSimilarity)),
        styleSimilarity: Math.max(0, Math.min(1, styleSimilarity))
      },
      metadata: {
        originalWordCount: originalContent.split(/\s+/).length,
        derivativeWordCount: derivativeContent.split(/\s+/).length,
        analysisTimestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Content similarity analysis error:', error)
    throw new Error(`Failed to analyze content similarity: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Analyze structural similarity between two pieces of content
 */
function analyzeStructuralSimilarity(content1: string, content2: string): number {
  const paragraphs1 = content1.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const paragraphs2 = content2.split(/\n\s*\n/).filter(p => p.trim().length > 0)

  // Compare paragraph count similarity
  const paragraphCountSimilarity = 1 - Math.abs(paragraphs1.length - paragraphs2.length) / Math.max(paragraphs1.length, paragraphs2.length)

  // Compare average paragraph length similarity
  const avgLength1 = paragraphs1.reduce((sum, p) => sum + p.length, 0) / paragraphs1.length
  const avgLength2 = paragraphs2.reduce((sum, p) => sum + p.length, 0) / paragraphs2.length
  const lengthSimilarity = 1 - Math.abs(avgLength1 - avgLength2) / Math.max(avgLength1, avgLength2)

  // Compare sentence structure patterns
  const sentences1 = content1.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentences2 = content2.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCountSimilarity = 1 - Math.abs(sentences1.length - sentences2.length) / Math.max(sentences1.length, sentences2.length)

  return (paragraphCountSimilarity + lengthSimilarity + sentenceCountSimilarity) / 3
}

/**
 * Calculate theme similarity between two sets of themes
 */
function calculateThemeSimilarity(themes1: string[], themes2: string[]): number {
  if (themes1.length === 0 && themes2.length === 0) return 1
  if (themes1.length === 0 || themes2.length === 0) return 0

  const set1 = new Set(themes1.map(t => t.toLowerCase()))
  const set2 = new Set(themes2.map(t => t.toLowerCase()))
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return intersection.size / union.size // Jaccard similarity
}

/**
 * Analyze writing style similarity
 */
function analyzeStyleSimilarity(content1: string, content2: string): number {
  const sentences1 = content1.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentences2 = content2.split(/[.!?]+/).filter(s => s.trim().length > 0)

  // Average sentence length similarity
  const avgSentenceLength1 = sentences1.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences1.length
  const avgSentenceLength2 = sentences2.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences2.length
  const sentenceLengthSimilarity = 1 - Math.abs(avgSentenceLength1 - avgSentenceLength2) / Math.max(avgSentenceLength1, avgSentenceLength2)

  // Vocabulary complexity similarity (unique words ratio)
  const words1 = content1.toLowerCase().split(/\s+/)
  const words2 = content2.toLowerCase().split(/\s+/)
  const uniqueRatio1 = new Set(words1).size / words1.length
  const uniqueRatio2 = new Set(words2).size / words2.length
  const vocabularySimilarity = 1 - Math.abs(uniqueRatio1 - uniqueRatio2)

  return (sentenceLengthSimilarity + vocabularySimilarity) / 2
}

/**
 * Calculate analysis confidence based on content quality and length
 */
function calculateAnalysisConfidence(content1: string, content2: string, baseSimilarity: number): number {
  const minLength = Math.min(content1.length, content2.length)
  const maxLength = Math.max(content1.length, content2.length)
  
  // Confidence decreases with very short content or extreme length differences
  const lengthConfidence = Math.min(minLength / 500, 1) * Math.min(minLength / maxLength, 1)
  
  // Confidence increases with more definitive similarity scores (closer to 0 or 1)
  const scoreConfidence = Math.abs(baseSimilarity - 0.5) * 2
  
  return Math.min((lengthConfidence + scoreConfidence) / 2, 1)
}

/**
 * Generate content fingerprint - a shorter embedding for quick comparisons
 * Useful for batch processing and similarity caching
 */
export async function generateContentFingerprint(content: string): Promise<string> {
  try {
    const embedding = await generateContentEmbedding(content)
    
    // Create a hash-like fingerprint from the embedding
    // Take first 32 dimensions and create a compact representation
    const fingerprint = embedding.vector
      .slice(0, 32)
      .map(val => Math.round(val * 1000).toString(36))
      .join('')
    
    return fingerprint.substring(0, 32) // Ensure consistent length
  } catch (error) {
    console.error('Fingerprint generation error:', error)
    throw new Error(`Failed to generate content fingerprint: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

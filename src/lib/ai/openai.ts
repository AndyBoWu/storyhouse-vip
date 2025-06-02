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
}

export interface StoryGenerationResponse {
  title: string
  content: string
  wordCount: number
  readingTime: number
  themes: string[]
}

export async function generateStoryChapter(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
  const {
    plotDescription,
    genres = [],
    moods = [],
    emojis = [],
    chapterNumber = 1,
    previousContent = ''
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
      themes
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

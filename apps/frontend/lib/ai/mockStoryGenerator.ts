/**
 * Mock Story Generator for Development/Testing
 * Use this when OpenAI API key is not available
 */

import type { StoryGenerationRequest, StoryGenerationResponse } from './openai'

const sampleStories = {
  mystery: {
    title: "The Portal's Secret",
    content: `Chapter 1: The Discovery

Detective Sarah Chen had seen many strange things in her fifteen-year career, but nothing had prepared her for what she found in her grandmother's attic. The old Victorian house had been left to her in the will, along with all its mysterious contents.

As she climbed the creaking stairs with a flashlight in hand, dust motes danced in the golden beam. The attic smelled of lavender and old memories. Boxes lined the walls, filled with decades of collected treasures and forgotten photographs.

But it was the mirror that caught her attention – an ornate, silver-framed piece that seemed to shimmer with its own inner light. As Sarah approached, she noticed something impossible: her reflection was moving independently, beckoning her closer.

"This can't be real," she whispered, reaching out to touch the glass.

The moment her fingers made contact, the mirror's surface rippled like water. Through it, she could see another version of her grandmother's attic – but this one was different. Newer. And there was someone else there, someone who looked exactly like her grandmother, but decades younger.

The young woman in the mirror turned and spoke, though no sound reached Sarah's ears. She was pointing urgently at something behind Sarah – something that made her blood run cold.

Sarah spun around, but the attic was empty. When she turned back to the mirror, the young woman was gone. In her place was a message, written in what looked like fresh blood on the mirror's surface:

"The murders haven't stopped. They've just moved to your world."

Sarah's phone buzzed. A text from the precinct: "New homicide. Same M.O. as the cold cases from 1953. We need you here now."

As she stumbled toward the attic stairs, Sarah realized her grandmother's death might not have been natural after all. And somehow, this mirror was the key to crimes that had been committed seventy years ago – crimes that were apparently still happening.

She paused at the top of the stairs, looking back at the mirror. It was just an ordinary mirror now, reflecting nothing but her own frightened face.

But she could swear she heard her grandmother's voice whispering: "Be careful, Sarah. Some doors, once opened, can never be closed."`,
    wordCount: 387,
    readingTime: 2,
    themes: ['mystery', 'supernatural', 'family secrets', 'parallel worlds', 'time travel']
  },

  scifi: {
    title: "The Quantum Detective",
    content: `Chapter 1: Dimensional Crime

The quantum scanner beeped insistently as Detective Sarah Chen examined the crime scene that shouldn't exist. According to the city's dimensional monitoring system, this apartment had been empty for three months. Yet here lay a body that had died exactly 47 minutes ago.

"Another quantum displacement murder," her partner, Detective Mike Torres, said grimly. "That's the third one this week."

Sarah knelt beside the victim, careful not to disturb the shimmering energy field that surrounded the body. The quantum residue was still fresh – whoever had done this had access to technology that was supposed to be classified at the highest levels.

"The killer is using a dimensional displacement device," she observed, scanning the energy patterns with her quantum analyzer. "But look at these readings, Mike. This isn't random. The displacement pattern shows they're targeting specific individuals across multiple realities."

Her grandmother's antique mirror caught her eye – the same one from the old family estate. What was it doing here in this modern apartment? As she approached it, the mirror's surface began to ripple with quantum energy.

"Sarah, step back!" Mike shouted, but it was too late.

The mirror pulled her in.

She found herself standing in the same apartment, but everything was different. The walls were a different color, the furniture was arranged differently, and most disturbing of all – there was another version of herself sitting at the desk, working on the same case files.

The other Sarah looked up, unsurprised. "You're finally here. I've been waiting for you to figure out how to follow the killer's trail between dimensions."

"Who are you?" Sarah asked, though she already knew the answer.

"I'm you. From Earth-247. And I have bad news – the killer isn't just targeting random victims. They're killing specific people across multiple realities to change the outcome of a single event. An event that's going to happen in your dimension in exactly 72 hours."

"What event?"

The other Sarah stood, revealing a photograph on the desk. It was a picture of their grandmother, but she looked exactly as she had in 1953.

"Our grandmother didn't die of natural causes last month. She was murdered. And if we don't stop this killer, they're going to use her death to collapse the barriers between all dimensions. Every reality where she ever existed will merge into one, creating a paradox that will unravel the universe itself."

Sarah's phone buzzed. Another body had been found. Another impossible crime scene.

But now she understood: she wasn't just hunting a killer. She was racing against time to save reality itself.`,
    wordCount: 423,
    readingTime: 3,
    themes: ['science fiction', 'quantum physics', 'parallel universes', 'time paradox', 'family mystery']
  },

  fantasy: {
    title: "The Guardian's Portal",
    content: `Chapter 1: The Inheritance of Magic

Detective Sarah Chen had always prided herself on believing only in what she could see and prove. Magic was for fairy tales, not for crime scenes. But as she stood in her grandmother's candlelit attic, watching the ancient mirror pulse with ethereal light, her rational worldview began to crumble.

The mirror was definitely not reflecting the room around her. Instead, it showed a medieval great hall where her grandmother – looking no older than thirty – sat upon a throne carved from a single piece of moonstone.

"You're finally here, my dear," came her grandmother's voice, though not from the mirror. Sarah spun around to find the elderly woman she remembered, but now she wore robes that shimmered with starlight.

"Grandmother? But you're... you died last month."

"Death is merely another doorway, child. And you have inherited more than just this house." Her grandmother gestured toward the mirror. "You are the last of the Chen bloodline. The last Guardian of the Threshold."

"Guardian of what?"

"The barrier between our world and the realm of the Fae. For three hundred years, our family has kept the ancient compact, preventing the dark fae from crossing over and preventing humans from stumbling into their realm. But the compact is failing."

As if summoned by her words, a figure emerged from the mirror. Tall and impossibly beautiful, with eyes like chips of winter sky and hair that moved in a wind Sarah couldn't feel. The creature's smile revealed teeth too sharp to be human.

"The Guardian is dead," the fae lord spoke, his voice like silk over steel. "The threshold is ours now."

"Not yet," Sarah's grandmother said firmly. "Sarah, you must choose. Take up the mantle of Guardian, or watch as both worlds fall to chaos. The fae you see before you is Lord Malachar. He has been murdering people in both realms, feeding on their life force to break down the barriers between worlds."

Sarah's phone buzzed. The precinct. Another impossible murder – a body drained of life in a locked room, with no signs of forced entry.

"The murders in our world," Sarah breathed. "It's him."

Lord Malachar's laugh was like breaking glass. "Clever detective. Yes, I have been feeding in your realm. Soon, I will have enough power to tear down the threshold entirely. Then my armies will pour through, and both worlds will kneel before the Court of Winter."

Her grandmother extended a hand toward Sarah. In her palm lay an amulet that pulsed with the same light as the mirror. "Take it, and accept your destiny. Refuse, and watch everything you've sworn to protect turn to ash."

Sarah reached for the amulet, feeling its power sing through her bones. As her fingers closed around it, knowledge flooded her mind – spells, ancient laws, the true names of creatures that went bump in the night.

She was no longer just Detective Sarah Chen. She was the Guardian, and she had a war to fight.

But first, she had a fae lord to arrest for murder. In two dimensions.`,
    wordCount: 481,
    readingTime: 3,
    themes: ['fantasy', 'urban fantasy', 'magic', 'family legacy', 'supernatural crime']
  }
}

export async function generateMockStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Determine story type based on genres
  const genres = request.genres || []
  let storyType: keyof typeof sampleStories = 'mystery'

  if (genres.includes('Sci-Fi') || genres.includes('Science Fiction')) {
    storyType = 'scifi'
  } else if (genres.includes('Fantasy')) {
    storyType = 'fantasy'
  }

  const baseStory = sampleStories[storyType]

  // Customize the story based on the request
  const customTitle = request.plotDescription.includes('portal')
    ? baseStory.title
    : `${request.plotDescription.split(' ').slice(0, 2).join(' ')}: ${baseStory.title}`

  // Add chapter number if specified
  const chapterTitle = request.chapterNumber && request.chapterNumber > 1
    ? `Chapter ${request.chapterNumber}: ${customTitle}`
    : customTitle

  return {
    title: chapterTitle,
    content: baseStory.content,
    wordCount: baseStory.wordCount,
    readingTime: baseStory.readingTime,
    themes: baseStory.themes
  }
}

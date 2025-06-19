/**
 * Genre utilities for consistent color-coded genre display
 */

// Predefined genres with color schemes
export const GENRE_COLORS = {
  Mystery: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  Romance: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200'
  },
  Adventure: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  'Sci-Fi': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  Fantasy: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  Horror: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  Drama: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-200'
  },
  Comedy: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200'
  },
  Thriller: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200'
  }
} as const;

export type GenreType = keyof typeof GENRE_COLORS;

/**
 * Get 3 hardcoded genres for any book
 * Returns exactly the same 3 genres for every book as requested
 */
export function getHardcodedGenres(): GenreType[] {
  return ['Mystery', 'Adventure', 'Romance'];
}

/**
 * Get color classes for a genre
 */
export function getGenreColors(genre: GenreType) {
  return GENRE_COLORS[genre] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200'
  };
}

/**
 * Generate genre badge className
 */
export function getGenreBadgeClass(genre: GenreType, size: 'sm' | 'md' | 'lg' = 'md') {
  const colors = getGenreColors(genre);
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  return `${colors.bg} ${colors.text} ${sizeClasses[size]} rounded-full font-medium`;
}
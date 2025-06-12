'use client';

import { useState } from 'react';
import { Share2, X } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
}

export default function ShareButton({ title, description, url, imageUrl }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedImage = imageUrl ? encodeURIComponent(imageUrl) : '';

  const shareToTwitter = () => {
    const twitterText = `📚 "${title}"

${description.slice(0, 120)}${description.length > 120 ? '...' : ''}

🔗 Read on StoryHouse.vip`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodedUrl}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    setIsOpen(false);
  };


  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share menu */}
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <button
                onClick={shareToTwitter}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
                Share on X (Twitter)
              </button>
              
              
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
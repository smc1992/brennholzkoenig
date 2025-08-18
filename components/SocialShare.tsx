'use client';

import { useState } from 'react';

interface SocialShareProps {
  url: string;
  title: string;
  compact?: boolean;
}

export default function SocialShare({ url, title, compact = false }: SocialShareProps) {
  const [showTooltip, setShowTooltip] = useState('');

  const shareLinks = [
    {
      name: 'Facebook',
      icon: 'ri-facebook-fill',
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: 'Twitter',
      icon: 'ri-twitter-x-fill',
      color: 'bg-black hover:bg-gray-800',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      name: 'LinkedIn',
      icon: 'ri-linkedin-fill',
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    {
      name: 'WhatsApp',
      icon: 'ri-whatsapp-fill',
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
    },
    {
      name: 'Email',
      icon: 'ri-mail-fill',
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Schauen Sie sich diesen interessanten Artikel an: ' + url)}`
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setShowTooltip('copied');
      setTimeout(() => setShowTooltip(''), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleShare = (shareUrl: string, platform: string) => {
    // Track social sharing
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'share', {
        method: platform,
        content_type: 'article',
        item_id: url
      });
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <button
          onClick={copyToClipboard}
          onMouseEnter={() => setShowTooltip('copy')}
          onMouseLeave={() => setShowTooltip('')}
          className="relative w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          <i className="ri-share-line text-sm"></i>
          
          {showTooltip === 'copy' && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Link kopieren
            </div>
          )}
          
          {showTooltip === 'copied' && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Kopiert!
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {shareLinks.map((platform) => (
        <button
          key={platform.name}
          onClick={() => handleShare(platform.url, platform.name.toLowerCase())}
          className={`w-10 h-10 flex items-center justify-center ${platform.color} text-white rounded-full transition-colors cursor-pointer`}
          title={`Auf ${platform.name} teilen`}
        >
          <i className={`${platform.icon} text-lg`}></i>
        </button>
      ))}
      
      <button
        onClick={copyToClipboard}
        onMouseEnter={() => setShowTooltip('copy')}
        onMouseLeave={() => setShowTooltip('')}
        className="relative w-10 h-10 flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors cursor-pointer"
        title="Link kopieren"
      >
        <i className="ri-link text-lg"></i>
        
        {showTooltip === 'copied' && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-2 rounded whitespace-nowrap">
            Link kopiert!
          </div>
        )}
      </button>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DynamicImageProps {
  usageType: string;
  fallbackUrl: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function DynamicImage({ 
  usageType, 
  fallbackUrl, 
  alt, 
  className,
  style 
}: DynamicImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(fallbackUrl);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDynamicImage = async () => {
      try {
        const { data, error } = await supabase
          .from('media_files')
          .select('file_url, alt_text')
          .eq('usage_type', usageType)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          setImageUrl(data.file_url);
        }
      } catch (error) {
        console.log('Verwende Fallback-Bild für:', usageType);
        // Fallback-URL wird bereits als Standard gesetzt
      } finally {
        setLoading(false);
      }
    };

    loadDynamicImage();
  }, [usageType, fallbackUrl]);

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className}`} style={style}>
        <div className="w-full h-full flex items-center justify-center">
          <i className="ri-image-line text-gray-400 text-4xl"></i>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      onError={() => setImageUrl(fallbackUrl)}
    />
  );
}
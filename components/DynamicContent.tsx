
'use client';

import { useState, useEffect } from 'react';
import { contentManager } from '@/lib/contentManager';

interface DynamicContentProps {
  page: string;
  section: string;
  contentType?: string;
  key?: string;
  fallback: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

// Cache für bereits geladene Inhalte
const contentCache = new Map<string, { content: string; timestamp: number; version: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 Minuten
let globalVersion = 1;

// Event-System für Cache-Updates vom Backend
if (typeof window !== 'undefined') {
  window.addEventListener('content-updated', ((event: CustomEvent) => {
    globalVersion++;
    contentCache.clear();
  }) as EventListener);
}

export default function DynamicContent({ 
  page, 
  section, 
  contentType,
  key,
  fallback, 
  className = '',
  tag: Tag = 'span'
}: DynamicContentProps) {
  const [content, setContent] = useState(fallback);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      // Parameter-Validierung
      if (!page?.trim() || !section?.trim()) {
        if (mounted) setContent(fallback);
        return;
      }

      const effectiveContentType = contentType || key;
      if (!effectiveContentType?.trim()) {
        if (mounted) setContent(fallback);
        return;
      }

      const cacheKey = `${page}-${section}-${effectiveContentType}`;
      const now = Date.now();
      
      // Prüfe Cache
      const cached = contentCache.get(cacheKey);
      if (cached && 
          (now - cached.timestamp < CACHE_DURATION) && 
          cached.version === globalVersion) {
        if (mounted) setContent(cached.content);
        return;
      }

      // Nur laden wenn nicht im Cache
      try {
        setLoading(true);
        
        // Verwende die contentManager-Instanz und die vorhandene getPageContent-Methode
        const contents = await contentManager.getPageContent(page.trim());
        const dynamicContent = contents.find(
          item => item.content_key === section.trim() && 
                 (item.content_type === effectiveContentType.trim() || !effectiveContentType.trim())
        )?.content_value;
        
        if (!mounted) return;
        
        const finalContent = dynamicContent?.trim() || fallback;
        
        // In Cache speichern
        contentCache.set(cacheKey, {
          content: finalContent,
          timestamp: now,
          version: globalVersion
        });
        
        setContent(finalContent);
      } catch (error) {
        console.warn('DynamicContent Fehler:', error);
        if (mounted) setContent(fallback);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadContent();

    return () => {
      mounted = false;
    };
  }, [page, section, contentType, key, fallback]);

  if (loading) {
    return (
      <Tag className={`${className} animate-pulse bg-gray-200 rounded min-h-[1em] inline-block`}>
        &nbsp;
      </Tag>
    );
  }

  return <Tag className={className}>{content}</Tag>;
}

// Funktion für Backend um Cache zu invalidieren
export const invalidateContentCache = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('content-updated'));
  }
};

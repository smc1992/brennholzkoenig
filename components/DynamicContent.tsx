
'use client';

import { useState, useEffect, useRef } from 'react';
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

// Globaler Cache für bereits geladene Inhalte mit persistentem Storage
const contentCache = new Map<string, { content: string; timestamp: number; version: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 Stunde Cache-Dauer
let globalVersion = 1;

// Rate-Limiting-Schutz
const API_REQUESTS = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 50; // Maximale Anfragen pro Minute
const REQUEST_WINDOW = 60 * 1000; // 1 Minute Fenster

// Laden des Caches aus localStorage beim Start
if (typeof window !== 'undefined') {
  try {
    const savedCache = localStorage.getItem('dynamicContentCache');
    const savedVersion = localStorage.getItem('dynamicContentVersion');
    
    if (savedCache) {
      const parsedCache = JSON.parse(savedCache);
      Object.entries(parsedCache).forEach(([key, value]) => {
        contentCache.set(key, value as { content: string; timestamp: number; version: number });
      });
    }
    
    if (savedVersion) {
      globalVersion = parseInt(savedVersion, 10);
    }
  } catch (e) {
    console.warn('Fehler beim Laden des Content-Caches:', e);
  }
  
  // Event-System für Cache-Updates vom Backend
  window.addEventListener('content-updated', ((event: CustomEvent) => {
    globalVersion++;
    contentCache.clear();
    try {
      localStorage.setItem('dynamicContentVersion', globalVersion.toString());
      localStorage.removeItem('dynamicContentCache');
    } catch (e) {
      console.warn('Fehler beim Aktualisieren des Cache-Status:', e);
    }
  }) as EventListener);
}

// Hilfsfunktion zum Speichern des Caches
const saveCache = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheObject: Record<string, { content: string; timestamp: number; version: number }> = {};
    contentCache.forEach((value, key) => {
      cacheObject[key] = value;
    });
    
    localStorage.setItem('dynamicContentCache', JSON.stringify(cacheObject));
    localStorage.setItem('dynamicContentVersion', globalVersion.toString());
  } catch (e) {
    console.warn('Fehler beim Speichern des Content-Caches:', e);
  }
};

// Drosselung der Speichervorgänge
let saveCacheTimeout: NodeJS.Timeout | null = null;
const debouncedSaveCache = () => {
  if (saveCacheTimeout) clearTimeout(saveCacheTimeout);
  saveCacheTimeout = setTimeout(saveCache, 1000);
};

// Gemeinsamer Loader für alle DynamicContent-Komponenten
const pageContentLoaders = new Map<string, Promise<any>>();

// Rate-Limiting-Prüfung
const checkRateLimit = (key: string): boolean => {
  const now = Date.now();
  const requests = API_REQUESTS.get(key) || [];
  
  // Alte Anfragen entfernen (älter als 1 Minute)
  const recentRequests = requests.filter(time => now - time < REQUEST_WINDOW);
  
  // Prüfen, ob wir das Limit überschreiten würden
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    console.warn(`Rate-Limit erreicht für ${key}: ${recentRequests.length} Anfragen in der letzten Minute`);
    return false;
  }
  
  // Neue Anfrage hinzufügen
  recentRequests.push(now);
  API_REQUESTS.set(key, recentRequests);
  return true;
};

export default function DynamicContent({ 
  page, 
  section, 
  contentType,
  key,
  fallback, 
  className = '',
  tag: Tag = 'span'
}: DynamicContentProps) {
  // Verwende Fallback als initialen Wert um Blinken zu vermeiden
  const [content, setContent] = useState(fallback);
  const [isHydrated, setIsHydrated] = useState(false);
  const retryCount = useRef(0);
  const maxRetries = 2;

  useEffect(() => {
    let mounted = true;
    setIsHydrated(true);

    const loadContent = async () => {
      // Parameter-Validierung
      if (!page?.trim() || !section?.trim()) {
        return; // Behalte Fallback
      }

      const effectiveContentType = contentType || key;
      if (!effectiveContentType?.trim()) {
        return; // Behalte Fallback
      }

      const cacheKey = `${page}-${section}-${effectiveContentType}`;
      const now = Date.now();
      
      // Prüfe Cache
      const cached = contentCache.get(cacheKey);
      if (cached && 
          (now - cached.timestamp < CACHE_DURATION) && 
          cached.version === globalVersion) {
        if (mounted && cached.content !== fallback) {
          setContent(cached.content);
        }
        return;
      }

      // Lade Content nur wenn nicht bereits der Fallback verwendet wird
      
      // Nur laden wenn nicht im Cache
      try {
        // Content wird geladen
        
        // Gemeinsamer Loader für alle Komponenten, die die gleiche Seite abfragen
        const pageKey = `page-${page}`;
        let pageContentPromise = pageContentLoaders.get(pageKey);
        
        if (!pageContentPromise) {
          // Rate-Limiting-Prüfung
          const apiKey = 'supabase-content-api';
          const canMakeRequest = checkRateLimit(apiKey);
          
          if (!canMakeRequest) {
            console.warn(`Rate-Limit überschritten für ${page}, verwende Cache oder Fallback`);
            // Wenn Rate-Limit erreicht, verwenden wir den abgelaufenen Cache oder Fallback
            const expiredCache = contentCache.get(cacheKey);
            if (expiredCache) {
              if (mounted) setContent(expiredCache.content);
              return;
            }
            // Sonst bei Fallback bleiben
            return;
          }
          
          pageContentPromise = contentManager.getPageContent(page.trim());
          pageContentLoaders.set(pageKey, pageContentPromise);
          
          // Nach Abschluss aus Map entfernen
          pageContentPromise.finally(() => {
            pageContentLoaders.delete(pageKey);
          });
        }
        
        const contents = await pageContentPromise;
        
        if (!mounted) return;
        
        // Typdefinition für die Inhalte aus der Datenbank
        interface ContentItem {
          content_key: string;
          content_type: string;
          content_value: string;
        }
        
        const dynamicContent = contents.find(
          (item: ContentItem) => item.content_key === section.trim() && 
                 (item.content_type === effectiveContentType.trim() || !effectiveContentType.trim())
        )?.content_value;
        
        const finalContent = dynamicContent?.trim() || fallback;
        
        // In Cache speichern
        contentCache.set(cacheKey, {
          content: finalContent,
          timestamp: now,
          version: globalVersion
        });
        
        // Cache periodisch speichern
        debouncedSaveCache();
        
        if (mounted) setContent(finalContent);
        retryCount.current = 0; // Zurücksetzen bei Erfolg
      } catch (error) {
        console.warn(`DynamicContent Fehler (${page}/${section}):`, error);
        
        // Exponentielles Backoff für Wiederholungsversuche
        if (retryCount.current < maxRetries && mounted) {
          const delay = Math.pow(2, retryCount.current) * 1000; // 1s, 2s, 4s...
          retryCount.current++;
          
          setTimeout(loadContent, delay);
        }
      } finally {
        // Content geladen
      }
    };

    loadContent();

    return () => {
      mounted = false;
    };
  }, [page, section, contentType, key, fallback]);

  return <Tag className={className}>{content}</Tag>;
}

// Funktion für Backend um Cache zu invalidieren
export const invalidateContentCache = (specificPage?: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    if (specificPage) {
      // Nur einen bestimmten Seiteninhalt invalidieren
      const cacheEntries: string[] = [];
      contentCache.forEach((value, key) => {
        if (key.startsWith(`${specificPage}-`)) {
          cacheEntries.push(key);
        }
      });
      
      // Selektives Löschen
      cacheEntries.forEach(key => contentCache.delete(key));
      console.info(`Cache für Seite '${specificPage}' wurde invalidiert`);
      
      // Aktualisierte Cache-Daten speichern
      debouncedSaveCache();
      return true;
    } else {
      // Kompletten Cache invalidieren
      globalVersion++;
      contentCache.clear();
      
      try {
        localStorage.setItem('dynamicContentVersion', globalVersion.toString());
        localStorage.removeItem('dynamicContentCache');
      } catch (e) {
        console.warn('Fehler beim Aktualisieren des Cache-Status:', e);
      }
      
      window.dispatchEvent(new CustomEvent('content-updated'));
      console.info('Gesamter Content-Cache wurde invalidiert');
      return true;
    }
  } catch (error) {
    console.error('Fehler bei der Cache-Invalidierung:', error);
    return false;
  }
};

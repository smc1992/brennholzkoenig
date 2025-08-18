
'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AnalyticsTracker() {
  useEffect(() => {
    // Prüfe ob Supabase verfügbar ist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Prüfe Cookie-Einstellungen
    const cookieConsent = localStorage.getItem('cookie-consent');
    const cookieSettings = localStorage.getItem('cookie-settings');
    
    if (!cookieConsent || cookieConsent !== 'accepted') {
      return;
    }

    let analyticsEnabled = true;
    if (cookieSettings) {
      try {
        const settings = JSON.parse(cookieSettings);
        analyticsEnabled = settings.analytics === true;
      } catch (e) {
        // Fehler beim Parsen ignorieren
      }
    }

    if (!analyticsEnabled) {
      return;
    }

    // Session ID generieren oder abrufen
    let sessionId = sessionStorage.getItem('analytics-session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics-session-id', sessionId);
    }

    // Track Page View
    const trackPageView = async () => {
      try {
        const { error } = await supabase.from('analytics_events').insert({
          event_type: 'page_view',
          page_url: window.location.pathname,
          page_title: document.title,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          session_id: sessionId,
          timestamp: new Date().toISOString()
        });
        
        if (error && error.code !== 'PGRST116') {
          console.warn('Analytics tracking error:', error);
        }
      } catch (error) {
        // Fehler stumm ignorieren
      }
    };

    // Track Click Events
    const trackClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
        try {
          const { error } = await supabase.from('analytics_events').insert({
            event_type: 'click',
            page_url: window.location.pathname,
            element_type: target.tagName.toLowerCase(),
            element_text: target.textContent?.slice(0, 100) || null,
            session_id: sessionId,
            timestamp: new Date().toISOString()
          });
          
          if (error && error.code !== 'PGRST116') {
            console.warn('Click tracking error:', error);
          }
        } catch (error) {
          // Fehler stumm ignorieren
        }
      }
    };

    // Track Scroll Depth
    let maxScrollDepth = 0;
    const trackScrollDepth = async () => {
      const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      
      if (scrollPercent > maxScrollDepth && scrollPercent % 25 === 0) {
        maxScrollDepth = scrollPercent;
        try {
          const { error } = await supabase.from('analytics_events').insert({
            event_type: 'scroll_depth',
            page_url: window.location.pathname,
            scroll_depth: scrollPercent,
            session_id: sessionId,
            timestamp: new Date().toISOString()
          });
          
          if (error && error.code !== 'PGRST116') {
            console.warn('Scroll tracking error:', error);
          }
        } catch (error) {
          // Fehler stumm ignorieren
        }
      }
    };

    // Track Time on Page
    const startTime = Date.now();
    const trackTimeOnPage = async () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent > 10) {
        try {
          const { error } = await supabase.from('analytics_events').insert({
            event_type: 'time_on_page',
            page_url: window.location.pathname,
            time_spent: timeSpent,
            session_id: sessionId,
            timestamp: new Date().toISOString()
          });
          
          if (error && error.code !== 'PGRST116') {
            console.warn('Time tracking error:', error);
          }
        } catch (error) {
          // Fehler stumm ignorieren
        }
      }
    };

    // Event Listeners
    trackPageView();
    document.addEventListener('click', trackClick);
    window.addEventListener('scroll', trackScrollDepth);
    window.addEventListener('beforeunload', trackTimeOnPage);

    // Cleanup
    return () => {
      document.removeEventListener('click', trackClick);
      window.removeEventListener('scroll', trackScrollDepth);
      window.removeEventListener('beforeunload', trackTimeOnPage);
    };
  }, []);

  return null;
}

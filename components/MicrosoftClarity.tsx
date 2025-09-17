'use client';

import { useEffect } from 'react';

interface MicrosoftClarityProps {
  clarityId?: string;
}

export default function MicrosoftClarity({ clarityId = 'tc4t2f2cxr' }: MicrosoftClarityProps) {
  useEffect(() => {
    // Only load in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_CLARITY) {
      console.log('Microsoft Clarity disabled in development');
      return;
    }

    // Check if Clarity is already loaded
    if (typeof window !== 'undefined' && (window as any).clarity) {
      console.log('Microsoft Clarity already loaded');
      return;
    }

    try {
      // Microsoft Clarity tracking code
      (function(c: any, l: any, a: any, r: any, i: any, t: any, y: any) {
        c[a] = c[a] || function() {
          (c[a].q = c[a].q || []).push(arguments);
        };
        t = l.createElement(r);
        t.async = 1;
        t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
      })(window, document, "clarity", "script", clarityId, undefined, undefined);

      console.log('✅ Microsoft Clarity initialized with ID:', clarityId);
    } catch (error) {
      console.error('❌ Failed to initialize Microsoft Clarity:', error);
    }
  }, [clarityId]);

  return null;
}

// Export tracking functions for use in other components
export const clarityTrack = {
  // Track custom events
  event: (eventName: string, customData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).clarity) {
      try {
        (window as any).clarity('event', eventName, customData);
        console.log('📊 Clarity event tracked:', eventName, customData);
      } catch (error) {
        console.error('Failed to track Clarity event:', error);
      }
    }
  },

  // Set custom tags
  setTag: (key: string, value: string) => {
    if (typeof window !== 'undefined' && (window as any).clarity) {
      try {
        (window as any).clarity('set', key, value);
        console.log('🏷️ Clarity tag set:', key, value);
      } catch (error) {
        console.error('Failed to set Clarity tag:', error);
      }
    }
  },

  // Identify user
  identify: (userId: string, sessionId?: string, pageId?: string, friendlyName?: string) => {
    if (typeof window !== 'undefined' && (window as any).clarity) {
      try {
        (window as any).clarity('identify', userId, sessionId, pageId, friendlyName);
        console.log('👤 Clarity user identified:', userId);
      } catch (error) {
        console.error('Failed to identify user in Clarity:', error);
      }
    }
  }
};
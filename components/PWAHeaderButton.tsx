
'use client';

import { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAHeaderButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    setIsClient(true);
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current || typeof window === 'undefined') return;
    
    const installed = localStorage.getItem('pwa-installed') === 'true';
    const dismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    
    if (isMountedRef.current) {
      setIsInstalled(installed);
      
      if (!installed && !dismissed) {
        setShowButton(true);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !isMountedRef.current) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      if (isMountedRef.current) {
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        
        const dismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
        if (!isInstalled && !dismissed) {
          setShowButton(true);
        }
      }
    };

    const handleAppInstalled = () => {
      if (isMountedRef.current) {
        setIsInstalled(true);
        setShowButton(false);
        setDeferredPrompt(null);
        localStorage.setItem('pwa-installed', 'true');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isClient, isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt || !isMountedRef.current) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted' && isMountedRef.current) {
        setIsInstalled(true);
        localStorage.setItem('pwa-installed', 'true');
        setShowButton(false);
      }
    } catch (error) {
      console.log('Install prompt failed:', error);
    }
    
    if (isMountedRef.current) {
      setDeferredPrompt(null);
    }
  };

  if (!isClient || !showButton || isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      className="hidden md:flex items-center space-x-2 bg-[#C04020] hover:bg-[#A03318] text-white px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm font-medium whitespace-nowrap"
      title="App installieren für schnellen Zugriff"
    >
      <div className="w-4 h-4 flex items-center justify-center">
        <i className="ri-smartphone-line text-sm"></i>
      </div>
      <span>App installieren</span>
    </button>
  );
}

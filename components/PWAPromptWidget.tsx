
'use client';

import { useState, useEffect } from 'react';

export default function PWAPromptWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Check if already dismissed
    try {
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (dismissed === 'true') {
        setIsVisible(false);
        return;
      }
    } catch (error) {
      // localStorage not available, continue without error
    }

    // Check if already installed
    const checkInstalled = () => {
      try {
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
          setIsInstalled(true);
          return;
        }
        if ((window.navigator as any).standalone) {
          setIsInstalled(true);
          return;
        }
        if (document.referrer.includes('android-app://')) {
          setIsInstalled(true);
          return;
        }
      } catch (error) {
        // Browser API not available, assume not installed
      }
    };

    checkInstalled();

    if (isInstalled) return;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      try {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsVisible(true);
      } catch (error) {
        // Event handling failed, show fallback
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show widget after 3 seconds if no install prompt
    const timer = setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        setIsVisible(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [isClient, deferredPrompt, isInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsVisible(false);
        }
        setDeferredPrompt(null);
      } catch (error) {
        // Install prompt failed, show fallback instructions
        showInstallInstructions();
      }
    } else {
      showInstallInstructions();
    }
  };

  const showInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      instructions = 'Safari: Teilen → Zum Home-Bildschirm hinzufügen';
    } else if (userAgent.includes('chrome')) {
      instructions = 'Chrome: Menü (⋮) → App installieren';
    } else if (userAgent.includes('firefox')) {
      instructions = 'Firefox: Menü → Seite installieren';
    } else {
      instructions = 'Fügen Sie diese Seite zu Ihrem Startbildschirm hinzu';
    }
    
    alert(`App Installation:\n\n${instructions}`);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (isClient) {
      try {
        localStorage.setItem('pwa-prompt-dismissed', 'true');
      } catch (error) {
        // Cannot save to localStorage, continue without error
      }
    }
  };

  if (!isClient || !isVisible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#C04020] p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#C04020] rounded-full flex items-center justify-center flex-shrink-0">
            <i className="ri-smartphone-line text-white text-lg"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              App installieren
            </h3>
            <p className="text-gray-600 text-xs mb-3">
              Schneller Zugriff direkt vom Startbildschirm
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="bg-[#C04020] text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-[#A03018] transition-colors whitespace-nowrap"
              >
                Installieren
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-500 px-2 py-1.5 text-xs hover:text-gray-700 transition-colors whitespace-nowrap"
              >
                Später
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <i className="ri-close-line text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

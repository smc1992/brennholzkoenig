'use client';

import { useEffect, useState, useRef } from 'react';

interface PushNotificationConfig {
  enabled: boolean;
  vapidPublicKey: string;
  apiEndpoint: string;
}

interface NotificationState {
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  supported: boolean;
}

export default function PushNotifications() {
  const [config, setConfig] = useState<PushNotificationConfig>({
    enabled: false,
    vapidPublicKey: '',
    apiEndpoint: '/api/push-notifications'
  });
  const [notificationState, setNotificationState] = useState<NotificationState>({
    permission: 'default',
    subscription: null,
    supported: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const serviceWorkerRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Prüfe Browser-Support
      const supported = checkBrowserSupport();
      if (!supported) {
        setNotificationState(prev => ({ ...prev, supported: false }));
        setIsLoading(false);
        return;
      }

      // Lade Konfiguration
      await loadConfig();
      
      // Registriere Service Worker
      await registerServiceWorker();
      
      // Prüfe aktuelle Permission und Subscription
      await checkNotificationStatus();
      
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      setError('Fehler beim Initialisieren der Push-Benachrichtigungen');
    } finally {
      setIsLoading(false);
    }
  };

  const checkBrowserSupport = (): boolean => {
    const supported = (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
    
    setNotificationState(prev => ({ ...prev, supported }));
    return supported;
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/push-config');
      if (response.ok) {
        const configData = await response.json();
        setConfig(configData);
      }
    } catch (error) {
      console.error('Error loading push config:', error);
    }
  };

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered:', registration);
      serviceWorkerRef.current = registration;
      
      // Warte auf Service Worker Ready
      await navigator.serviceWorker.ready;
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  };

  const checkNotificationStatus = async () => {
    if (!('Notification' in window)) return;
    
    const permission = Notification.permission;
    let subscription: PushSubscription | null = null;
    
    if (serviceWorkerRef.current && permission === 'granted') {
      subscription = await serviceWorkerRef.current.pushManager.getSubscription();
    }
    
    setNotificationState({
      permission,
      subscription,
      supported: true
    });
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      setError('Benachrichtigungen werden von diesem Browser nicht unterstützt');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      setNotificationState(prev => ({
        ...prev,
        permission
      }));
      
      if (permission === 'granted') {
        await subscribeToPushNotifications();
        return true;
      } else if (permission === 'denied') {
        setError('Benachrichtigungen wurden blockiert. Bitte aktivieren Sie diese in den Browser-Einstellungen.');
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setError('Fehler beim Anfordern der Benachrichtigungsberechtigung');
      return false;
    }
  };

  const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
    if (!serviceWorkerRef.current || !config.vapidPublicKey) {
      console.error('Service Worker or VAPID key not available');
      return null;
    }

    try {
      const subscription = await serviceWorkerRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
      });
      
      console.log('Push subscription created:', subscription);
      
      // Sende Subscription an Server
      await sendSubscriptionToServer(subscription);
      
      setNotificationState(prev => ({
        ...prev,
        subscription
      }));
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setError('Fehler beim Abonnieren der Push-Benachrichtigungen');
      return null;
    }
  };

  const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
    if (!notificationState.subscription) {
      return true;
    }

    try {
      // Entferne Subscription vom Server
      await removeSubscriptionFromServer(notificationState.subscription);
      
      // Entferne lokale Subscription
      const success = await notificationState.subscription.unsubscribe();
      
      if (success) {
        setNotificationState(prev => ({
          ...prev,
          subscription: null
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setError('Fehler beim Abmelden der Push-Benachrichtigungen');
      return false;
    }
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
      
      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  };

  const removeSubscriptionFromServer = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/push-unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }
      
      console.log('Subscription removed from server successfully');
    } catch (error) {
      console.error('Error removing subscription from server:', error);
      throw error;
    }
  };

  const sendTestNotification = async () => {
    if (!notificationState.subscription) {
      setError('Keine aktive Subscription vorhanden');
      return;
    }

    try {
      const response = await fetch('/api/push-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: notificationState.subscription.toJSON(),
          title: 'Test-Benachrichtigung',
          body: 'Dies ist eine Test-Benachrichtigung von Brennholzkönig.',
          url: window.location.origin
        }),
      });
      
      if (response.ok) {
        console.log('Test notification sent successfully');
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setError('Fehler beim Senden der Test-Benachrichtigung');
    }
  };

  // Utility function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  // Render nothing if loading or not supported
  if (isLoading) {
    return null;
  }

  if (!notificationState.supported) {
    return null;
  }

  if (!config.enabled) {
    return null;
  }

  return (
    <div className="push-notifications">
      {/* Notification Permission Banner */}
      {notificationState.permission === 'default' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
              <i className="ri-notification-line text-blue-600"></i>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">Benachrichtigungen aktivieren</h4>
              <p className="text-sm text-blue-700 mt-1">
                Erhalten Sie wichtige Updates zu Ihren Bestellungen und Angeboten.
              </p>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Aktivieren
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <i className="ri-error-warning-line text-red-600"></i>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        </div>
      )}

      {/* Notification Status */}
      {notificationState.permission === 'granted' && notificationState.subscription && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-lg">
                <i className="ri-notification-3-line text-green-600"></i>
              </div>
              <div>
                <h4 className="font-medium text-green-900">Benachrichtigungen aktiv</h4>
                <p className="text-sm text-green-700">Sie erhalten Push-Benachrichtigungen.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={sendTestNotification}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Test senden
              </button>
              <button
                onClick={unsubscribeFromPushNotifications}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Deaktivieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked State */}
      {notificationState.permission === 'denied' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg">
              <i className="ri-notification-off-line text-gray-600"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Benachrichtigungen blockiert</h4>
              <p className="text-sm text-gray-600">
                Benachrichtigungen wurden blockiert. Sie können diese in den Browser-Einstellungen aktivieren.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export utility functions for external use
export const PushNotificationUtils = {
  checkSupport: () => {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },
  
  getPermissionStatus: (): NotificationPermission | 'unsupported' => {
    return 'Notification' in window ? Notification.permission : 'unsupported';
  },
  
  urlBase64ToUint8Array: (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
};
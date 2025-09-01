// Service Worker für Push Notifications
// Brennholzkönig Web Push Service

const CACHE_NAME = 'brennholzkoenig-v1';
const urlsToCache = [
  '/',
  '/offline',
  '/manifest.json'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch Event Handler (für Offline-Funktionalität)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Push Event Handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received', event);
  
  let notificationData = {
    title: 'Brennholzkönig',
    body: 'Sie haben eine neue Nachricht erhalten.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    image: null,
    tag: 'brennholzkoenig-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Öffnen',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Schließen'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  // Parse Push-Daten wenn vorhanden
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
        data: {
          ...notificationData.data,
          ...pushData.data
        }
      };
    } catch (error) {
      console.error('Service Worker: Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Notification anzeigen
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      timestamp: notificationData.data.timestamp
    })
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/';
  
  if (action === 'close') {
    // Notification schließen - keine weitere Aktion
    return;
  }
  
  // Öffne die entsprechende URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Prüfe ob bereits ein Tab mit der URL offen ist
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Öffne neuen Tab wenn keiner gefunden wurde
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Notification Close Handler
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed', event);
  
  // Optional: Analytics-Event senden
  const notificationData = event.notification.data || {};
  
  // Hier könnte ein Analytics-Event gesendet werden
  // fetch('/api/analytics/notification-closed', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     tag: event.notification.tag,
  //     timestamp: Date.now(),
  //     data: notificationData
  //   })
  // });
});

// Background Sync (für Offline-Funktionalität)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Hier können Offline-Aktionen synchronisiert werden
      Promise.resolve()
    );
  }
});

// Message Handler (für Kommunikation mit der Hauptanwendung)
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event);
  
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('Service Worker: Unknown message type:', type);
  }
});

// Error Handler
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error occurred:', event);
});

// Unhandled Rejection Handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection:', event);
});
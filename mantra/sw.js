// Sacred Chanting Service Worker
// Version: 2.0.0

const CACHE_NAME = 'sacred-chanting-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap',
  'https://fonts.gstatic.com/s/cinzel/v23/8vIJ7wMr0my-WxlCxLjy.woff2',
  'https://fonts.gstatic.com/s/notosansdevanagari/v25/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlXQly_A.woff2'
];

// Install Service Worker and cache files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache.map(url => new Request(url, {
          cache: 'reload'
        })));
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate Service Worker and clean old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
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

// Fetch event - Cache-first strategy for static assets, network-first for API calls
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request.url)) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request));
  } else if (isGoogleFonts(request.url)) {
    // Special handling for Google Fonts
    event.respondWith(googleFontsStrategy(request));
  } else {
    // Network-first for other requests
    event.respondWith(networkFirst(request));
  }
});

// Cache-first strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Cache-first failed', error);
    // Return offline fallback if available
    return await caches.match('/index.html');
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network-first fallback to cache', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await caches.match('/index.html');
    }
    throw error;
  }
}

// Google Fonts strategy
async function googleFontsStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request, {
      cache: 'immutable'
    });
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Google Fonts failed', error);
    // Fallback to cached version or continue without fonts
    return await caches.match(request) || new Response('', { status: 200 });
  }
}

// Helper functions
function isStaticAsset(url) {
  const staticExtensions = ['.html', '.css', '.js', '.json', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff2', '.woff', '.ttf'];
  return staticExtensions.some(ext => url.includes(ext)) || url.endsWith('/');
}

function isGoogleFonts(url) {
  return url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com');
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'chant-sync') {
    event.waitUntil(syncChantData());
  }
});

// Sync chant data when back online
async function syncChantData() {
  try {
    console.log('Service Worker: Syncing chant data');
    // Get pending chants from IndexedDB or localStorage
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_CHANTS',
        message: 'Syncing your chant data...'
      });
    });
  } catch (error) {
    console.error('Service Worker: Sync failed', error);
  }
}

// Push notifications (for future milestone celebrations)
self.addEventListener('push', event => {
  console.log('Service Worker: Push message received', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Keep up your spiritual practice!',
      icon: '/apple-touch-icon.png',
      badge: '/favicon-32x32.png',
      tag: 'sacred-chanting',
      requireInteraction: false,
      actions: [
        {
          action: 'open',
          title: 'Continue Chanting',
          icon: '/apple-touch-icon.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Sacred Chanting',
        options
      )
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click', event);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker: Error', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
});

// Update available notification
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Skipping waiting');
    self.skipWaiting();
  }
});

console.log('Service Worker: Loaded successfully');

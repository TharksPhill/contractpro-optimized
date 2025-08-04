// Service Worker para ContractPRO
const CACHE_NAME = 'contractpro-v1';
const STATIC_CACHE = 'contractpro-static-v1';

// Recursos críticos para cache
const CRITICAL_RESOURCES = [
  '/',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/pages/DashboardOptimized.tsx',
  '/favicon.ico'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  // Skip para requests não GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip para requests externos (APIs, etc)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrar
        if (response) {
          return response;
        }

        // Senão, faz fetch da rede
        return fetch(event.request).then((response) => {
          // Não cachear se não for resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta para cachear
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Fallback offline para páginas
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});
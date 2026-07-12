const CACHE_NAME = "coinzy-offline-cache-v1";

// Core assets to pre-cache immediately on installation
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
];

// Service Worker Install Event
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing service worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching core offline assets");
      return cache.addAll(PRECACHE_ASSETS).then(() => self.skipWaiting());
    })
  );
});

// Service Worker Activate Event - clean up obsolete caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating and sweeping legacy caches...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log(`[Service Worker] Expiring legacy cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper to determine strategy based on request URL
function isApiRoute(url) {
  return url.pathname.startsWith("/api/");
}

function isGetRequest(request) {
  return request.method === "GET";
}

// Fetch interception and routing
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // We only cache and handle GET requests
  if (!isGetRequest(event.request)) {
    return;
  }

  // Handle dynamic API GET endpoints (Network-First)
  if (isApiRoute(requestUrl)) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If successful response, clone and save in cache
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, fall back to matching cached API data
          console.log(`[Service Worker] Offline fallback triggered for: ${event.request.url}`);
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If API not cached and offline, return a friendly custom offline JSON structure
            return new Response(
              JSON.stringify({ 
                error: "Offline", 
                message: "You are currently offline. Viewing previously cached local records.",
                offline: true,
                transactions: [],
                budgets: [],
                accounts: [],
                recurringBills: [],
                chartData: [],
                stats: { totalBalance: 0, totalIncome: 0, totalExpense: 0 }
              }),
              { 
                status: 200, 
                headers: { "Content-Type": "application/json" } 
              }
            );
          });
        })
    );
    return;
  }

  // Handle Static Assets (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failure and no cache - return generic fallback for HTML if applicable
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html") || caches.match("/");
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});

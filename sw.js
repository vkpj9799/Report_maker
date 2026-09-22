// Downtime Log — minimal offline app shell cache.
// Shift-floor wifi is unreliable; this keeps the form usable without a signal.
var CACHE = 'downtime-log-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE)
      .then(function(cache){ return cache.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Network-first for the app shell (so a deployed fix shows up promptly),
// falling back to cache when offline; cache-only for everything else it
// doesn't recognize is out of scope (e.g. the Google Fonts CSS/woff2).
self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  var isShell = ASSETS.some(function(path){
    return event.request.url.indexOf(path.replace('./', '')) !== -1;
  });
  if (!isShell) return;

  event.respondWith(
    fetch(event.request)
      .then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(cache){ cache.put(event.request, copy); });
        return res;
      })
      .catch(function(){ return caches.match(event.request); })
  );
});

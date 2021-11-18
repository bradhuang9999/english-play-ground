//2021-11-18
var FILE_STATIC_CACHE_KEY = 'staticFile';
var staticFileArr = [
  './', // Alias for index.html
  'index.html',
  'css/style.css',
  'js/common.js',
  'js/googleSheet.js',
  'js/index.js',

  'libs/bootstrap/5.0.2/css/bootstrap.min.css',
  'libs/bootstrap-dark-5/1.1.0/css/bootstrap-nightfall.css',
  'libs/fontawesome/5.15.4/css/all.min.css',
  
  'libs/jquery/3.6.0/jquery-3.6.0.min.js',
  'libs/NoSleep/0.12.0/NoSleep.min.js',
  'libs/date-fns/1.30.1/date_fns.min.js',
  'libs/bootstrap/5.0.2/js/bootstrap.bundle.min.js',
  'libs/handlebars/4.7.7/handlebars.min.js',
  'libs/dexie/3.0.3/dexie.min.js', 
  
]

const RUNTIME = 'runtime';

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil((async () => {
    const cacheStatic = await caches.open(FILE_STATIC_CACHE_KEY);
    await cacheStatic.addAll(staticFileArr);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  //只清除filesMayChange
  /*
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if(key!==FILE_STATIC_CACHE_KEY) {
          return caches.delete(key);
        }
      })
    )).then(() => {
      console.log('V2 now ready to handle fetches!');
    })
  );
  */

  event.waitUntil((async () => {
    var keys = await caches.keys();
    keys.map(key => {
      if(key!==FILE_STATIC_CACHE_KEY) {
        caches.delete(key);
      }
    });
    console.log('V2 now ready to handle fetches!');
  })());
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
  // Skip cross-origin requests, like those for Google Analytics.
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RUNTIME).then(cache => {
          return fetch(event.request).then(response => {
            // Put a copy of the response in the runtime cache.
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  }
});
var fileMayChangeCacheKey = 'filesMayChange';//0924
var filesMayChange = [
  'index.html',
  'css/style.css',
  'js/common.js',
  'js/googleSheet.js',
  'js/index.js',
];
var staticFileCacheKey = 'staticFile';
var staticFile = [
  'libs/bootstrap/5.0.2/css/bootstrap.min.css',
  'libs/bootstrap-dark-5/1.1.0/css/bootstrap-nightfall.css',
  'libs/jquery/3.6.0/jquery-3.6.0.min.js',
  'libs/NoSleep/0.12.0/NoSleep.min.js',
  'libs/date-fns/1.30.1/date_fns.min.js',
  'libs/bootstrap/5.0.2/js/bootstrap.bundle.min.js',
  'libs/handlebars/4.7.7/handlebars.min.js',
]

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil((async () => {
    const cacheMayChange = await caches.open(fileMayChangeCacheKey);
    await cacheMayChange.addAll(filesMayChange);

    const cacheStatic = await caches.open(staticFileCacheKey);
    await cacheStatic.addAll(staticFile);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  //只清除filesMayChange
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if(key===fileMayChangeCacheKey) {
          return caches.delete(key);
        }
      })
    )).then(() => {
      console.log('V2 now ready to handle fetches!');
    })
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});

self.addEventListener('sync', function(event) {
  if (event.tag == 'syncMoneyWatcher') {
    debugger;
    event.waitUntil(syncData());
  }
});

function syncData() {
  var spendDataArrStr = localStorage.setItem('spendDataArr');
  console.log("spendDataArrStr:"+spendDataArrStr);
  if(spendDataArrStr==''||spendDataArrStr==null) {
    return;
  }

  var spendDataArr = JSON.parse(spendDataArrStr);
  appendSpendData(spendDataArr);
}
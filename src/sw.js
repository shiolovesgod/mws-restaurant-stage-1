/**
 * Global vars
 */

//Define cache variables
const CACHED_DIRS = ['/', '/js/', '/css/', '/css/third-party/', '/img/*', '/img/icon/*','/icon/'];
const rCACHED_DIRS = CACHED_DIRS.map(dir => {
  return new RegExp(`^${dir.split('*').join('.*')}$`)
});
const rFilename = new RegExp('[^\\/:*?"<>|\r\n]+$'); 

const EXT_CACHED = ['https://fonts.gstatic.com/s/lato/v14/S6uyw4BMUTPHjx4wXiWtFCc.woff2',
  'https://fonts.gstatic.com/s/vidaloka/v9/7cHrv4c3ipenMKlEavs7wH8Dnzcj.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://maps.googleapis.com/maps-api-v3/api/js/33/3/stats.js',
];

const CORE_CACHE_NAME = 'restreviews-static-v3';
const IMG_CACHE_NAME = 'restreviews-imgs-v2';
var allCaches = [CORE_CACHE_NAME, IMG_CACHE_NAME];

/**
 * SW Event Listeners
 */

// Install Event
self.addEventListener('install', (event) => {
  console.log('sw installing...');

  // Initialize cache with base files: css, js, html 
  //TO DO: make grunt automatically build this list
  const initCacheURLs = ['/', '/restaurant.html',
    '/js/main.js', '/js/restaurant_info.js', '/js/library.js',
    '/css/styles.css', '/css/inner_styles.css',
    '/css/third-party/google-fonts.css',
    '/img/icons/map-icon-favorite.png','/img/icons/map-icon-regular.png',
  ];
  event.waitUntil(caches.open(CORE_CACHE_NAME).then(cache => {
    return cache.addAll(initCacheURLs);
  }));
});


// Activate Event
self.addEventListener('activate', (event) => {
  console.log('sw activating...');
});


// Fetch Event
self.addEventListener('fetch', (fetchEvent) => {
  return fetchEvent.respondWith(fetchRequestCallback(fetchEvent.request));
});

function fetchRequestCallback(req) {
  //1. Parse the request
  var reqParsed = parseRequest(req)

  //2. If no cache, return
  if (!reqParsed.isCache && !reqParsed.isIDB) return networkFetchHandler(req);

  let cachedURL = reqParsed.cachedURL || req.url;

  //3. Send back cached response if exists, otherwise cache
  return caches.open(reqParsed.cacheName).then(cache => {
    return cache.match(reqParsed.cachedURL || req.url).then(cacheRes => {
      if (cacheRes && !reqParsed.forceRefresh) return cacheRes;

      //add to cache
      return networkFetchHandler(req).then(netRes => {
        if (netRes.ok) cache.put(cachedURL, netRes.clone());
        return cacheRes || netRes;
      })
    })
  })
}

function parseRequest(req) {
  //1. Check to see if the request should be cached
  const filetype = req.url.split('.').pop(); //reference: uncertain
  const reqURL = new URL(req.url);
  let cacheFlag = false;
  let fileDir = reqURL.pathname.replace(rFilename, '');
  let cachedURL = ''; //not always necessary
  let cacheName = CORE_CACHE_NAME;
  let forceRefresh = false;

  if (reqURL.origin === location.origin) {

    //compare to the cached directories
    cacheFlag = testDir(fileDir);

  } else if (reqURL.origin === 'https://maps.googleapis.com') {
    //cache map api js files?? (maybe against terms and services)
    // cacheFlag = ['js'].indexOf(filetype) > -1;
  } else {
    //compare to external directories
    cacheFlag = EXT_CACHED.indexOf(reqURL.href) > -1 || EXT_CACHED.indexOf(req.referrer) > -1;
  }

  if (!cacheFlag && ['css', 'js'].indexOf(filetype) > 0) {
    // console.log(`You're not caching: ${reqURL}`); //just to make sure i'm caching the important stuff
  }

  //2. Serve appropriate cache URL for images
  switch (fileDir) {
    case '/':
      if (reqURL.pathname == '/restaurant.html') {
        cachedURL = req.url.replace(/(?:\?).+$/, '');
      } 
      break;
    case '/img/':
      cachedURL = req.url.replace(/-\d+w.jpg$/, '');
      cacheName = IMG_CACHE_NAME;
      break;
    default:
  }

  //Output results
  return {
    isCache: cacheFlag,
    cachedURL,
    cacheName,
    forceRefresh
  };

}

//This function returns true if the cached directory exists
function testDir(str, rules = rCACHED_DIRS) {
  for (let rExp of rules) {
    if (rExp.test(str)) return true;
  }
  return false;
} //idea based on user:spen @ stack overflow


function networkFetchHandler(req) {

  return fetch(req).then((res) => {
    
    
    if (res.status === 200 || res.type == 'opaque') { // fetch ok
      return res;
    } else {
      //TO DO: Add custom Response handlers
      //new Response("I need a custom handler");
      return res;
    }

  }).catch((err) => {
    //something is really wrong
    return new Response(err, {
      status: 410,
      statusText: err
    });
  });

}

/**
 * TO DO: Features
 * 
 * 1. Switch from json to serve data to IndexedDb
 */


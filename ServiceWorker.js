const cacheName = "DefaultCompany-WhatQuizSDK-1.0";
const contentToCache = [
    "Build/488fa2001e99cb3a5658f84c2164fb4e.loader.js",
    "Build/1678a157067e2292d53ce0bffc7ea155.framework.js",
    "Build/682679f4243efc5e592a86b5c12ee87b.data",
    "Build/e6572084eab69348230f429a1e26e085.wasm",
    "TemplateData/style.css"

];

self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    
    e.waitUntil((async function () {
      const cache = await caches.open(cacheName);
      console.log('[Service Worker] Caching all: app shell and content');
      await cache.addAll(contentToCache);
    })());
});

self.addEventListener('fetch', function (e) {
    e.respondWith((async function () {
      let response = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (response) { return response; }

      response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    })());
});

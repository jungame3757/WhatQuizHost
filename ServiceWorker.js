const cacheName = "DefaultCompany-WhatQuizSDK-1.0";
const contentToCache = [
    "Build/6831d549f49b90ae95cef97ca792fb94.loader.js",
    "Build/1678a157067e2292d53ce0bffc7ea155.framework.js",
    "Build/243b51e318896b2bed70bbd7ca97e35c.data",
    "Build/a8ea4e28e6a0bbb766d57a0bd889f0f4.wasm",
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

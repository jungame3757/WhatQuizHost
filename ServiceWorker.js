const cacheName = "DefaultCompany-WhatQuizSDK-1.0";
const contentToCache = [
    "Build/b8259b2cb014421fb7f4a6a68a990269.loader.js",
    "Build/c1b34f83e828a53b2a437f2d278f9cd4.framework.js",
    "Build/ef829840041ecfe340b479aa0e0796d5.data",
    "Build/a9cdd43f5c9c99f7e9b930e761fcd476.wasm",
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

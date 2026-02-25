const CACHE_NAME = 'astro-v1';

// Instalação do Service Worker
self.addEventListener('install', event => {
    console.log('[Astro PWA] Service Worker Instalado com Sucesso!');
    self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    console.log('[Astro PWA] Service Worker Ativado!');
    event.waitUntil(clients.claim());
});

// Interceptador de rede (mantém o app funcionando liso sem quebrar o banco de dados)
self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
});

// Service Worker do StatPro — TargetPro Co.
// Estratégia: cache apenas dos recursos estáticos do próprio app (mesma origem).
// Chamadas a APIs externas (Caixa, Firebase, loterias) sempre passam direto pela rede,
// nunca são interceptadas, para garantir dados sempre atualizados e login funcional.

const CACHE_NAME = "statpro-cache-v1";
const ASSETS_TO_CACHE = [
  "/app/",
  "/app/index.html",
  "/app/manifest.json",
  "/app/icons/icon-192.png",
  "/app/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Só intercepta requisições da mesma origem (o próprio site).
  // Tudo que for para outro domínio (Firebase, Caixa, Resend, etc.) passa direto pela rede.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Apenas GET pode ser cacheado.
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Network-first: tenta buscar atualizado; se falhar (offline), usa o cache.
      return fetch(event.request)
        .then((response) => {
          // Só armazena respostas válidas.
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});

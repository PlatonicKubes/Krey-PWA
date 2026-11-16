// Service worker de Krey Confecciones.
// Si cambias index.html, sube el número de VERSION para que los teléfonos descarguen la versión nueva.
const VERSION = 'krey-v6';
const SHELL = ['./', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  // Cada archivo se guarda por separado: si uno falla, los demás igual se guardan.
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Páginas: primero internet (para ver siempre la versión nueva); sin internet, la guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => {
          if (r && r.ok && !r.redirected) {
            const copy = r.clone();
            caches.open(VERSION).then(c => c.put('./', copy));
          }
          return r;
        })
        .catch(() => caches.match('./'))
    );
    return;
  }

  // Resto (íconos, tipografías): primero lo guardado, y se actualiza en segundo plano.
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req)
        .then(r => {
          if (r && (r.ok || r.type === 'opaque')) {
            const copy = r.clone();
            caches.open(VERSION).then(c => c.put(req, copy));
          }
          return r;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(l => (l.length ? l[0].focus() : clients.openWindow('./')))
  );
});

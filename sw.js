/* Carnet PEV : service worker. © 2026 AKE Ange Eloi a.k.a Joker. Tous droits réservés.
   Garde l'application en mémoire pour qu'elle s'ouvre sans connexion.
   Les fiches ne passent jamais par ici : elles restent dans le navigateur du téléphone. */
const VERSION = 'a155b6485b';
const CACHE = 'carnet-pev-' + VERSION;
const COEUR = ["index.html","style.css","app.js","boot.js","manifest.webmanifest","favicon.svg","icon-192.png","icon-512.png","icon-maskable-512.png","apple-touch-icon.png"];
const ACCUEIL = new URL('index.html', self.location).href;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(COEUR)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k.startsWith('carnet-pev-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* la page : copie en mémoire tout de suite, puis mise à jour en arrière-plan pour la prochaine ouverture */
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(ACCUEIL).then((copie) => {
          const maj = fetch(req).then((rep) => { if (rep && rep.ok) c.put(ACCUEIL, rep.clone()); return rep; });
          if (copie) { e.waitUntil(maj.catch(() => {})); return copie; }
          return maj;
        })
      )
    );
    return;
  }

  /* polices Google : gardées après le premier chargement en ligne */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then((copie) => {
          const reseau = fetch(req)
            .then((rep) => { if (rep && rep.ok) c.put(req, rep.clone()); return rep; })
            .catch(() => copie || Response.error());
          return copie || reseau;
        })
      )
    );
    return;
  }

  /* fichiers du site : mémoire d'abord */
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((copie) =>
        copie || fetch(req).then((rep) => {
          if (rep && rep.ok) { const c2 = rep.clone(); caches.open(CACHE).then((c) => c.put(req, c2)); }
          return rep;
        })
      )
    );
  }
});

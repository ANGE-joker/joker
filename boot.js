/* Carnet PEV : démarrage. © 2026 AKE Ange Eloi a.k.a Joker. Tous droits réservés.
   1. Le site ne s'affiche que s'il est ouvert directement, jamais dans une iframe d'un autre site (détournement de clic).
   2. Le service worker garde l'application en mémoire pour l'ouvrir sans connexion. */
(function () {
  var direct = false;
  try { direct = window.top === window.self; } catch (e) { direct = false; }
  if (!direct) return;
  document.documentElement.classList.add('ok');
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* l'application marche aussi sans */ });
    });
  }
})();

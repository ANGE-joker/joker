/* Carnet PEV : calendriers, registre et espace parent.
   © 2026 AKE Ange Eloi a.k.a Joker. Tous droits réservés. */
/* ==== MOTEUR : calendriers PEV (nourrisson) et Td (femme enceinte) ==== */
var MS_JOUR = 86400000;
function parseISO(s) { var p = String(s).split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }
function toISO(t) {
  var d = new Date(t);
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}
function ajouterJours(t, n) { return t + n * MS_JOUR; }
function ajouterMois(t, n) {
  var d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth() + n, j = d.getUTCDate();
  var dernier = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return Date.UTC(y, m, Math.min(j, dernier));
}
function aujourdhui() { var n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()); }
function moisEntre(a, b) {
  var da = new Date(a), db = new Date(b);
  var m = (db.getUTCFullYear() - da.getUTCFullYear()) * 12 + db.getUTCMonth() - da.getUTCMonth();
  if (db.getUTCDate() < da.getUTCDate()) m--;
  return m;
}

var CONTACTS_ENFANT = [
  { k: 'c1', num: '1', label: 'À la naissance', rang: '1er', off: { d: 0 }, v: ['DN HépB', 'BCG', 'VPO 0'] },
  { k: 'c2', num: '2', label: '6 semaines', sub: '1 mois et demi', rang: '2ème', off: { d: 42 }, v: ['DTC-HépB-Hib 1', 'VPO 1', 'PCV13-1', 'Rota 1', 'VPI 1'] },
  { k: 'c3', num: '3', label: '10 semaines', sub: '2 mois et demi', rang: '3ème', off: { d: 70 }, v: ['DTC-HépB-Hib 2', 'VPO 2', 'PCV13-2', 'Rota 2'] },
  { k: 'c4', num: '4', label: '14 semaines', sub: '3 mois et demi', rang: '4ème', off: { d: 98 }, v: ['DTC-HépB-Hib 3', 'VPO 3', 'PCV13-3', 'VPI 2'] },
  { k: 'c5', num: '5', label: '24 semaines', sub: '6 mois', rang: '5ème', off: { d: 168 }, v: ['VAP 1'] },
  { k: 'c6', num: '6', label: '32 semaines', sub: '8 mois', rang: '6ème', off: { d: 224 }, v: ['VAP 2'] },
  { k: 'c7', num: '7', label: '9 mois', rang: '7ème', off: { m: 9 }, v: ['RR 1', 'VAA', 'MenA', 'VAP 3'] },
  { k: 'c8', num: '8', label: '15 mois', rang: '8ème', off: { m: 15 }, v: ['RR 2', 'VAP 4'] },
  { k: 'c9', num: 'H', label: '9 ans', sub: 'filles', rang: '1er', off: { m: 108 }, v: ['HPV'], seulement: 'F' }
];
var CONTACTS_TD = [
  { k: 'td1', num: '1', label: 'Td 1', sub: 'À la 1ère CPN', v: ['Td 1'], note: 'Protection après cette dose : aucune' },
  { k: 'td2', num: '2', label: 'Td 2', sub: '4 semaines après le Td 1 (2ème CPN)', v: ['Td 2'], after: { d: 28 }, note: 'Protection après cette dose : 3 ans' },
  { k: 'td3', num: '3', label: 'Td 3', sub: '6 mois après le Td 2', v: ['Td 3'], after: { m: 6 }, note: 'Protection après cette dose : 5 ans' },
  { k: 'td4', num: '4', label: 'Td 4', sub: '1 an après le Td 3', v: ['Td 4'], after: { m: 12 }, note: 'Protection après cette dose : 10 ans' },
  { k: 'td5', num: '5', label: 'Td 5', sub: '1 an après le Td 4', v: ['Td 5'], after: { m: 12 }, note: 'Protection après cette dose : à vie' }
];
var VACCINS = [
  [/^DN HépB/, 'Hépatite B'],
  [/^BCG/, 'Tuberculose'],
  [/^VPO/, 'Poliomyélite'],
  [/^VPI/, 'Poliomyélite'],
  [/^DTC-HépB-Hib/, 'Diphtérie, tétanos, coqueluche, hépatite B, méningite à Hib'],
  [/^PCV13/, 'Méningite à pneumocoque et infections respiratoires aiguës'],
  [/^Rota/, 'Diarrhées à rotavirus'],
  [/^VAP/, 'Paludisme'],
  [/^RR/, 'Rougeole, rubéole'],
  [/^VAA/, 'Fièvre jaune'],
  [/^MenA/, 'Méningite A'],
  [/^HPV/, 'Cancer du col de l’utérus'],
  [/^Td/, 'Tétanos et diphtérie']
];
function infoVaccin(code) {
  for (var i = 0; i < VACCINS.length; i++) if (VACCINS[i][0].test(code)) return VACCINS[i][1];
  return '';
}

/* Renvoie la liste des contacts avec leur date prévue et la date de vaccination si elle est faite. */
function planifier(rec) {
  var faits = rec.faits || {};
  var out = [];
  if (rec.type === 'enfant') {
    var n = parseISO(rec.naissance);
    CONTACTS_ENFANT.forEach(function (c) {
      if (c.seulement && c.seulement !== rec.sexe) return;
      var date = c.off.d != null ? ajouterJours(n, c.off.d) : ajouterMois(n, c.off.m);
      out.push(Object.assign({}, c, { date: date, fait: faits[c.k] || null }));
    });
  } else {
    var prev = null;
    CONTACTS_TD.forEach(function (c) {
      var date;
      if (!prev) date = parseISO(rec.cpn1);
      else {
        var base = prev.fait ? parseISO(prev.fait) : prev.date;
        date = c.after.d != null ? ajouterJours(base, c.after.d) : ajouterMois(base, c.after.m);
      }
      var it = Object.assign({}, c, { date: date, fait: faits[c.k] || null });
      out.push(it);
      prev = it;
    });
  }
  return out;
}
function statutDe(item, auj) {
  if (item.fait) return { t: 'fait', jours: 0 };
  var diff = Math.round((item.date - auj) / MS_JOUR);
  if (diff < 0) return { t: 'retard', jours: -diff };
  if (diff === 0) return { t: 'aujourdhui', jours: 0 };
  return { t: 'avenir', jours: diff };
}
function prochainDe(items) {
  for (var i = 0; i < items.length; i++) if (!items[i].fait) return items[i];
  return null;
}
function dureeTexte(n) {
  if (n < 14) return n + ' jour' + (n > 1 ? 's' : '');
  if (n < 60) { var s = Math.round(n / 7); return s + ' semaines'; }
  if (n < 730) { var m = Math.round(n / 30.44); return m + ' mois'; }
  var a = Math.floor(n / 365.25);
  return a + ' an' + (a > 1 ? 's' : '');
}
function statutTexte(st) {
  if (st.t === 'fait') return 'Fait';
  if (st.t === 'retard') return 'En retard de ' + dureeTexte(st.jours);
  if (st.t === 'aujourdhui') return 'Aujourd’hui';
  return st.jours === 1 ? 'Demain' : 'Dans ' + dureeTexte(st.jours);
}
function ageTexte(naissance, auj) {
  var jours = Math.floor((auj - naissance) / MS_JOUR);
  if (jours <= 0) return 'né(e) aujourd’hui';
  if (jours < 14) return jours + ' jour' + (jours > 1 ? 's' : '');
  if (jours < 120) return Math.floor(jours / 7) + ' semaines';
  var mois = moisEntre(naissance, auj);
  if (mois < 24) return mois + ' mois';
  return Math.floor(mois / 12) + ' ans';
}
/* ---- Rappels pour le calendrier du téléphone (fichier .ics) ---- */
function icsTexte(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
/* Les lignes d'un fichier .ics ne dépassent pas 75 octets : la suite commence par une espace. */
function icsPlier(ligne) {
  var out = [], cur = '', n = 0;
  Array.from(ligne).forEach(function (c) {
    var p = c.codePointAt(0), o = p < 0x80 ? 1 : p < 0x800 ? 2 : p < 0x10000 ? 3 : 4;
    if (n + o > 75) { out.push(cur); cur = ' '; n = 1; }
    cur += c; n += o;
  });
  out.push(cur);
  return out;
}
/* Un rendez-vous par vaccin à venir, à 8 h (heure indicative). Alertes : la veille à 8 h et le jour même à 7 h.
   Le rendez-vous le plus proche, s'il est en retard, devient un rappel pour le lendemain. */
function fabriquerICS(rec, items, auj, maintenant) {
  var stamp = new Date(maintenant).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  var seq = Math.floor(maintenant / 60000);
  var prochain = prochainDe(items), lignes = [], n = 0;
  lignes.push('BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AKE Ange Eloi a.k.a Joker//Carnet PEV//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH');
  items.forEach(function (it) {
    if (it.fait) return;
    var jour = it.date, retard = false;
    if (jour < auj) {
      if (it !== prochain) return;
      jour = ajouterJours(auj, 1); retard = true;
    }
    var j = toISO(jour).replace(/-/g, '');
    var titre = rec.type === 'enfant'
      ? 'Vaccination de ' + rec.nom + ' : ' + it.label
      : 'Vaccin ' + it.label + ' : ' + rec.nom;
    if (retard) titre = 'En retard : ' + titre;
    var desc = 'Vaccins prévus : ' + it.v.join(', ') + '.\n' +
      (retard ? 'Le rendez-vous prévu n’a pas encore eu lieu : passez au centre de santé dès que possible.\n' : '') +
      'Pensez à apporter le carnet de santé.\n' +
      'Date et heure indicatives (calendrier PEV de Côte d’Ivoire) : confirmez-les avec l’agent de santé.\n' +
      'Carnet PEV';
    lignes.push('BEGIN:VEVENT',
      'UID:' + rec.id + '-' + it.k + '@carnet-pev',
      'DTSTAMP:' + stamp,
      'SEQUENCE:' + seq,
      'SUMMARY:' + icsTexte(titre),
      'DTSTART:' + j + 'T080000',
      'DTEND:' + j + 'T090000',
      'DESCRIPTION:' + icsTexte(desc),
      'TRANSP:TRANSPARENT');
    if (jour >= ajouterJours(auj, 2)) lignes.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsTexte(titre), 'TRIGGER:-P1D', 'END:VALARM');
    if (jour > auj) lignes.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsTexte(titre), 'TRIGGER:-PT1H', 'END:VALARM');
    lignes.push('END:VEVENT');
    n++;
  });
  lignes.push('END:VCALENDAR');
  var texte = lignes.reduce(function (acc, l) { return acc.concat(icsPlier(l)); }, []).join('\r\n') + '\r\n';
  return { texte: texte, n: n };
}
/* ==== FIN MOTEUR ==== */

(function () {
  'use strict';

  var CLES = { agent: 'carnetpev.agent.v1', parent: 'carnetpev.parent.v1' };
  var memo = {};
  var stockageOk = true;

  function lire(k) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }
    catch (e) { return memo[k] != null ? memo[k] : null; }
  }
  function ecrire(k, v) {
    memo[k] = v;
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { return false; }
  }
  function effacer(k) {
    delete memo[k];
    try { localStorage.removeItem(k); } catch (e) { /* sans effet */ }
  }
  function uid() {
    try {
      var a = new Uint8Array(9); window.crypto.getRandomValues(a);
      return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(36)).slice(-2); }).join('') + Date.now().toString(36);
    } catch (e) { return Math.random().toString(36).slice(2, 11) + Date.now().toString(36); }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function maj(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function up(s) { return String(s == null ? '' : s).toLocaleUpperCase('fr-FR'); }
  function sansAccent(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function initiales(nom) {
    var m = String(nom).trim().split(/\s+/).filter(Boolean);
    if (!m.length) return '?';
    return (m[0].charAt(0) + (m.length > 1 ? m[1].charAt(0) : '')).toUpperCase();
  }
  function couleurAvatar(nom) {
    var h = 0, s = String(nom);
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 5;
    return 'av' + h;
  }

  var fmtLong = function (t) { return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(t); };
  var fmtJour = function (t) { return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(t); };
  var fmtCourt = function (t) { return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(t); };
  var fmtMois = function (t) { return new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' }).format(t).replace('.', '').toUpperCase(); };

  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var ICON_CHEVRON = '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  var ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var ICON_CLOCHE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7"/><path d="M10 20a2 2 0 004 0"/></svg>';
  var ICON_CADENAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  var LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="13" stroke-dasharray="4 3"/><path d="M10.5 16.5l4 4 7-8.5"/></svg>';
  var ART = '<svg class="hero-art" viewBox="0 0 96 96" aria-hidden="true"><path d="M48 8l32 12v22c0 22-14 38-32 46C30 80 16 64 16 42V20z" fill="#FFFFFF" fill-opacity="0.94"/><path d="M33 47l11 11 21-23" fill="none" stroke="#FF7A1A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="82" cy="12" r="5" fill="#FFFFFF" fill-opacity="0.75"/><circle cx="10" cy="72" r="3.5" fill="#FFFFFF" fill-opacity="0.65"/></svg>';

  /* ---------- données ---------- */
  var DATA = { agent: [], parent: [] };
  var ignorees = { agent: 0, parent: 0 };

  /* Tout ce qui vient du stockage est traité comme non fiable : forme, dates et textes sont revérifiés. */
  function dateOk(d) { return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && toISO(parseISO(d)) === d; }
  var CLES_ENFANT = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'];
  var CLES_MERE = ['td1', 'td2', 'td3', 'td4', 'td5'];
  function valider(r) {
    if (!r || typeof r !== 'object') return null;
    if (r.type !== 'enfant' && r.type !== 'mere') return null;
    var id = String(r.id == null ? '' : r.id);
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return null;
    var nom = up(String(r.nom == null ? '' : r.nom)).slice(0, 80);
    if (!nom) return null;
    var out = { id: id, type: r.type, nom: nom, tel: String(r.tel == null ? '' : r.tel).slice(0, 30), faits: {} };
    var cles;
    if (r.exemple === true) out.exemple = true;
    if (r.type === 'enfant') {
      if ((r.sexe !== 'F' && r.sexe !== 'M') || !dateOk(r.naissance)) return null;
      out.sexe = r.sexe; out.naissance = r.naissance; out.parent = up(String(r.parent == null ? '' : r.parent)).slice(0, 80);
      cles = CLES_ENFANT;
    } else {
      if (!dateOk(r.cpn1)) return null;
      out.cpn1 = r.cpn1;
      cles = CLES_MERE;
    }
    if (r.faits && typeof r.faits === 'object') {
      cles.forEach(function (k) { if (dateOk(r.faits[k])) out.faits[k] = r.faits[k]; });
    }
    return out;
  }

  function exemples(role) {
    var a = aujourdhui();
    var iso = function (n) { return toISO(ajouterJours(a, -n)); };
    if (role === 'parent') {
      return [{ id: uid(), type: 'enfant', nom: 'AYA', sexe: 'F', naissance: iso(37), faits: { c1: iso(37) }, exemple: true }];
    }
    return [
      { id: uid(), type: 'enfant', nom: 'YAO K.', sexe: 'M', naissance: iso(100), parent: 'MME KOUASSI', tel: '', faits: { c1: iso(100), c2: iso(58) }, exemple: true },
      { id: uid(), type: 'enfant', nom: 'AYA K.', sexe: 'F', naissance: iso(37), parent: 'MME KONÉ', tel: '', faits: { c1: iso(37) }, exemple: true },
      { id: uid(), type: 'mere', nom: 'MME ADJOUA T.', cpn1: iso(20), tel: '', faits: { td1: iso(20) }, exemple: true }
    ];
  }
  function charger(role) {
    var brut = lire(CLES[role]);
    if (brut && Array.isArray(brut.items)) {
      var propres = brut.items.map(valider).filter(Boolean);
      ignorees[role] = brut.items.length - propres.length;
      return propres;
    }
    var ex = exemples(role);
    if (!ecrire(CLES[role], { v: 1, items: ex })) stockageOk = false;
    return ex;
  }
  function sauver(role) {
    ignorees[role] = 0;
    if (!ecrire(CLES[role], { v: 1, items: DATA[role] })) stockageOk = false;
  }
  function enrichir(rec) {
    var items = planifier(rec), p = prochainDe(items);
    return { rec: rec, items: items, p: p, st: p ? statutDe(p, aujourdhui()) : null };
  }

  /* ---------- état de l'écran ---------- */
  var S = { tab: 'agent', ecran: 'liste', id: null, recherche: '', ouvertFait: null, confirmSuppr: false, pinMode: 'creer', oubli: false };
  function reinit() { S.ouvertFait = null; S.confirmSuppr = false; }

  /* ---------- sécurité : un code à 4 chiffres par espace ---------- */
  /* Le code garde les curieux à distance sur un téléphone partagé. Il ne chiffre pas les données. */
  var PINCLE = { agent: 'carnetpev.pin.agent', parent: 'carnetpev.pin.parent' };
  var deverrouille = { agent: false, parent: false };
  var ESSAICLE = { agent: 'carnetpev.essais.agent', parent: 'carnetpev.essais.parent' };
  var TOURS = 150000;
  var absentDepuis = 0;

  function pinExiste(role) { var p = lire(PINCLE[role]); return !!(p && p.h); }
  function estVerrouille(role) { return pinExiste(role) && !deverrouille[role]; }
  function octetsHex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  function selAleatoire() {
    try { var a = new Uint8Array(16); window.crypto.getRandomValues(a); return octetsHex(a); }
    catch (e) { return uid() + uid(); }
  }
  function lentDispo() { return !!(window.crypto && window.crypto.subtle && window.TextEncoder); }
  /* ancien format (SHA-256 simple), gardé pour relire les codes déjà créés */
  function hacherSimple(pin, sel) {
    var texte = 'carnetpev:' + sel + ':' + pin;
    try {
      if (lentDispo()) return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte)).then(octetsHex);
    } catch (e) { /* repli ci-dessous */ }
    var h1 = 5381, h2 = 52711;
    for (var i = 0; i < texte.length; i++) { var c = texte.charCodeAt(i); h1 = (h1 * 33) ^ c; h2 = (h2 * 31) ^ c; }
    return Promise.resolve('x' + (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16));
  }
  /* format actuel : PBKDF2-SHA-256 à 150 000 tours, qui ralentit toute attaque par essais répétés */
  function hacherLent(pin, sel, tours) {
    var enc = new TextEncoder();
    return window.crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits'])
      .then(function (cle) { return window.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(sel), iterations: tours }, cle, 256); })
      .then(octetsHex);
  }
  function nouveauCode(pin) {
    var sel = selAleatoire();
    if (lentDispo()) return hacherLent(pin, sel, TOURS).then(function (h) { return { s: sel, h: h, a: 'p2', n: TOURS }; });
    return hacherSimple(pin, sel).then(function (h) { return { s: sel, h: h }; });
  }
  function verifierPin(role, pin) {
    var p = lire(PINCLE[role]);
    if (!p || !p.h) return Promise.resolve(false);
    var calcul = (p.a === 'p2' && lentDispo()) ? hacherLent(pin, p.s, p.n || TOURS) : hacherSimple(pin, p.s);
    return calcul.then(function (h) {
      var bon = h === p.h;
      if (bon && p.a !== 'p2' && lentDispo()) {
        /* un ancien code passe au nouveau format dès qu'il est saisi correctement */
        nouveauCode(pin).then(function (n) { ecrire(PINCLE[role], n); }).catch(function () { /* sans effet */ });
      }
      return bon;
    }).catch(function () { return false; });
  }
  /* essais ratés : compteur gardé dans le stockage, donc le blocage survit au rechargement de la page */
  function essaisLire(role) { var e = lire(ESSAICLE[role]) || {}; return { n: Number(e.n) || 0, jusqua: Number(e.jusqua) || 0 }; }
  function essaisEcrire(role, n, jusqua) { ecrire(ESSAICLE[role], { n: n, jusqua: jusqua }); }
  function dureeLongue(sec) {
    if (sec < 90) return sec + ' seconde' + (sec > 1 ? 's' : '');
    if (sec < 5400) return Math.ceil(sec / 60) + ' minutes';
    var h = Math.ceil(sec / 3600);
    return h + ' heure' + (h > 1 ? 's' : '');
  }
  function champPin(id, libelle) {
    return '<label class="champ"><span>' + libelle + '</span><input class="pin" id="' + id + '" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off"></label>';
  }
  function vueVerrou() {
    var role = S.tab;
    var h = entete('Espace verrouillé', role === 'agent' ? 'Entrez votre code pour ouvrir le registre' : 'Entrez votre code pour voir vos rendez-vous', true);
    h += '<form id="form-verrou" class="carte-form" novalidate>' + champPin('pin-saisie', 'Code à 4 chiffres') +
      '<p class="erreur" id="erreur" role="alert"></p><button type="submit" class="btn primary bloc">Ouvrir</button>';
    if (S.oubli) {
      h += '<p class="erreur">Effacer toutes les fiches de cet espace et retirer le code ? Cette action est définitive.</p>' +
        '<div class="actions"><button type="button" class="btn danger bloc" data-act="pin-oubli-oui">Oui, tout effacer</button>' +
        '<button type="button" class="btn bloc" data-act="pin-oubli-non">Non, annuler</button></div>';
    } else {
      h += '<button type="button" class="lien gris" data-act="pin-oubli">Code oublié ?</button>';
    }
    return h + '</form>';
  }
  function vuePin() {
    var creer = S.pinMode === 'creer';
    var h = entete(creer ? 'Créer un code' : 'Retirer le code', creer ? 'Ce code sera demandé à chaque ouverture de cet espace' : 'Entrez le code actuel pour le retirer', false);
    h += '<form id="form-pin" class="carte-form" novalidate>' +
      (creer ? champPin('pin-1', 'Choisissez un code à 4 chiffres') + champPin('pin-2', 'Confirmez le code') : champPin('pin-1', 'Code actuel')) +
      '<p class="erreur" id="erreur" role="alert"></p><div class="actions"><button type="submit" class="btn primary bloc">' + (creer ? 'Enregistrer le code' : 'Retirer le code') + '</button>' +
      '<button type="button" class="btn bloc" data-act="retour">Annuler</button></div></form>';
    return h;
  }
  function securiteHTML(role) {
    var a = pinExiste(role);
    return '<section class="securite" aria-label="Sécurité"><div class="etat">' + ICON_CADENAS + (a ? 'Cet espace est protégé par un code' : 'Cet espace n’est pas protégé') + '</div>' +
      '<p>' + (a ? 'Le code est demandé à chaque ouverture et après 2 minutes d’absence.' : 'Ajoutez un code à 4 chiffres pour que personne d’autre ne puisse ouvrir cet espace sur ce téléphone.') + '</p>' +
      '<div class="actions">' + (a
        ? '<button type="button" class="btn bloc" data-act="verrouiller">Verrouiller maintenant</button><button type="button" class="lien gris" data-act="pin-retirer">Retirer le code</button>'
        : '<button type="button" class="btn bloc" data-act="pin-creer">Créer un code</button>') + '</div></section>';
  }
  function soumettreVerrou() {
    var role = S.tab, e = essaisLire(role), maintenant = Date.now();
    if (maintenant < e.jusqua) return afficherErreur('Trop d’essais. Réessayez dans ' + dureeLongue(Math.ceil((e.jusqua - maintenant) / 1000)) + '.');
    var pin = val('pin-saisie');
    if (!/^\d{4}$/.test(pin)) return afficherErreur('Entrez les 4 chiffres du code.');
    verifierPin(role, pin).then(function (ok) {
      if (ok) { effacer(ESSAICLE[role]); deverrouille[role] = true; render(true); return; }
      var n = essaisLire(role).n + 1;
      if (n % 5 === 0) {
        var palier = n / 5, delai = palier === 1 ? 30 : (palier === 2 ? 300 : 3600);
        essaisEcrire(role, n, Date.now() + delai * 1000);
        afficherErreur('Code incorrect. Patientez ' + dureeLongue(delai) + ' avant de réessayer.');
      } else {
        var reste = 5 - (n % 5);
        essaisEcrire(role, n, 0);
        afficherErreur('Code incorrect. Il reste ' + reste + ' essai' + (reste > 1 ? 's' : '') + '.');
      }
      var f = document.getElementById('pin-saisie'); if (f) { f.value = ''; f.focus(); }
    });
  }
  function soumettrePin() {
    var role = S.tab, creer = S.pinMode === 'creer', p1 = val('pin-1');
    if (!/^\d{4}$/.test(p1)) return afficherErreur(creer ? 'Choisissez un code de 4 chiffres.' : 'Entrez les 4 chiffres du code actuel.');
    if (creer) {
      if (p1 !== val('pin-2')) return afficherErreur('Les deux codes ne sont pas identiques.');
      nouveauCode(p1).then(function (c) {
        ecrire(PINCLE[role], c); effacer(ESSAICLE[role]);
        deverrouille[role] = true; S.ecran = 'liste'; render(true);
      });
    } else {
      verifierPin(role, p1).then(function (ok) {
        if (!ok) return afficherErreur('Code incorrect.');
        effacer(PINCLE[role]); effacer(ESSAICLE[role]); deverrouille[role] = false; S.ecran = 'liste'; render(true);
      });
    }
  }
  /* après 2 minutes hors de la page, les deux espaces se verrouillent à nouveau */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { absentDepuis = Date.now(); return; }
    if (absentDepuis && Date.now() - absentDepuis > 120000) {
      deverrouille.agent = false; deverrouille.parent = false;
      if (estVerrouille(S.tab)) render(true);
    }
    absentDepuis = 0;
  });

  /* ---------- messages de rappel ---------- */
  function numeroWA(tel) {
    var d = String(tel || '').replace(/\D/g, '').replace(/^00/, '');
    if (!d) return '';
    return d.length >= 11 ? d : '225' + d;
  }
  function messageRappel(rec, p, st, role) {
    var date = fmtLong(p.date), vacc = p.v.join(', ');
    if (rec.type === 'enfant') {
      var intro = role === 'agent' ? 'Bonjour' + (rec.parent ? ' ' + rec.parent : '') + ', ' : '';
      var corps = st.t === 'retard'
        ? 'rappel de vaccination : le rendez-vous de ' + rec.nom + ' prévu le ' + date + ' (' + p.label + ') n’a pas encore eu lieu. Merci de passer au centre de santé dès que possible. Vaccins prévus : ' + vacc + '. Pensez à apporter le carnet de santé.'
        : 'rappel de vaccination : ' + rec.nom + ' a rendez-vous le ' + date + ' (' + p.label + '). Vaccins prévus : ' + vacc + '. Pensez à apporter le carnet de santé.';
      return maj(intro + corps);
    }
    if (role === 'agent') {
      return 'Bonjour ' + rec.nom + ', rappel : votre dose ' + p.label + ' (vaccin contre le tétanos et la diphtérie) est prévue le ' + date + '. Pensez à apporter votre carnet de santé.';
    }
    return 'Rappel : ma dose ' + p.label + ' (tétanos et diphtérie) est prévue le ' + date + '.';
  }

  /* ---------- vues ---------- */
  function entete(titre, sous, hero, stats) {
    var marque = '<div class="marque">' + LOGO + '<div><b>Carnet PEV</b><small>Programme élargi de vaccination · Côte d’Ivoire</small></div></div>';
    var h1 = '<h1 id="titre" tabindex="-1">' + esc(titre) + '</h1>';
    var s = sous ? '<p class="' + (hero ? 'sous-titre' : 'muted') + '">' + esc(sous) + '</p>' : '';
    if (hero) return '<header class="hero">' + ART + marque + h1 + s + (stats || '') + '</header>';
    return '<header class="entete">' + marque + h1 + s + '</header>';
  }
  function pastille(e) {
    if (!e.p) return '<span class="pastille ok">Calendrier complet</span>';
    var st = e.st, t = esc(statutTexte(st));
    if (st.t === 'retard') return '<span class="pastille late">' + t + '</span>';
    if (st.t === 'aujourdhui' || st.jours <= 7) return '<span class="pastille soon">' + t + '</span>';
    return '<span class="pastille calm">' + t + '</span>';
  }
  function ligne(e) {
    var r = e.rec, auj = aujourdhui();
    var sous = r.type === 'enfant'
      ? (r.sexe === 'F' ? 'Fille' : 'Garçon') + ' · ' + ageTexte(parseISO(r.naissance), auj)
      : 'Femme enceinte · vaccin Td';
    var prochain = e.p ? 'Prochain : ' + e.p.label + ' · ' + fmtCourt(e.p.date) : 'Tous les vaccins sont faits';
    return '<button type="button" class="ligne" data-act="ouvrir" data-id="' + esc(r.id) + '">' +
      '<span class="avatar ' + couleurAvatar(r.nom) + '" aria-hidden="true">' + esc(initiales(r.nom)) + '</span>' +
      '<span class="corps"><span class="nom">' + esc(r.nom) + (r.exemple ? '<em class="tag">Exemple</em>' : '') + '</span>' +
      '<span class="sous">' + esc(sous) + '</span>' + pastille(e) +
      '<span class="sous">' + esc(prochain) + '</span></span>' + ICON_CHEVRON + '</button>';
  }
  function trier(liste) {
    var cle = function (e) { return e.p ? e.p.date : 8.64e15; };
    return liste.sort(function (a, b) { return cle(a) - cle(b); });
  }
  function listeHTML() {
    var role = S.tab;
    var tout = trier(DATA[role].map(enrichir));
    var q = sansAccent(S.recherche.trim());
    var vus = q ? tout.filter(function (e) { return sansAccent(e.rec.nom + ' ' + (e.rec.parent || '')).indexOf(q) !== -1; }) : tout;
    if (!tout.length) {
      return '<div class="vide"><h2>Aucune fiche pour le moment</h2><p class="muted">' +
        (role === 'agent' ? 'Enregistrez une naissance ou une femme enceinte pour voir ses rendez-vous.' : 'Ajoutez votre enfant avec sa date de naissance pour voir ses rendez-vous.') + '</p></div>';
    }
    if (!vus.length) return '<div class="vide"><h2>Aucun résultat</h2><p class="muted">Vérifiez l’orthographe du nom.</p></div>';
    return vus.map(ligne).join('');
  }
  function vueListe() {
    var role = S.tab, tout = DATA[role].map(enrichir);
    var retard = tout.filter(function (e) { return e.st && e.st.t === 'retard'; }).length;
    var semaine = tout.filter(function (e) { return e.st && (e.st.t === 'aujourdhui' || (e.st.t === 'avenir' && e.st.jours <= 7)); }).length;
    var aDesExemples = DATA[role].some(function (r) { return r.exemple; });
    var h = '';
    if (role === 'agent') {
      var stats = tout.length
        ? '<div class="hero-stats"><span class="chip-h' + (retard ? ' late' : '') + '">' + retard + ' en retard</span>' +
          '<span class="chip-h">' + semaine + ' cette semaine</span>' +
          '<span class="chip-h">' + tout.length + ' fiche' + (tout.length > 1 ? 's' : '') + '</span></div>'
        : '';
      h += entete('Registre', 'Enfants et femmes enceintes suivis', true, stats);
      h += '<button type="button" class="btn primary bloc" data-act="nouveau">' + ICON_PLUS + 'Nouvelle fiche</button>';
      if (tout.length) {
        h += '<label class="champ"><span>Chercher un nom</span><input class="recherche" id="recherche" type="search" autocomplete="off" value="' + esc(S.recherche) + '"></label>';
      }
    } else {
      h += entete('Mes rendez-vous', 'Les vaccins de mes enfants, avec les prochaines dates', true);
      var alertes = trier(tout.slice()).filter(function (e) { return e.st && (e.st.t === 'retard' || e.st.t === 'aujourdhui' || e.st.jours <= 7); });
      if (alertes.length) {
        h += '<div class="alertes" role="status">' + alertes.map(function (e) {
          var late = e.st.t === 'retard';
          return '<div class="alerte' + (late ? ' late' : '') + '"><span class="ico">' + ICON_CLOCHE + '</span><span><b>' + esc(e.rec.nom) + '</b> · ' + esc(statutTexte(e.st)) + ' · ' + esc(fmtJour(e.p.date)) +
            '<br>Vaccins : ' + esc(e.p.v.join(', ')) + '</span></div>';
        }).join('') + '</div>';
      }
      h += '<button type="button" class="btn primary bloc" data-act="nouveau">' + ICON_PLUS + 'Ajouter mon enfant</button>';
    }
    h += '<div class="liste" id="liste">' + listeHTML() + '</div>';
    if (aDesExemples) h += '<button type="button" class="lien gris" data-act="suppr-exemples">Supprimer les fiches d’exemple</button>';
    h += securiteHTML(role);
    if (ignorees[role] > 0) h += '<p class="note" role="status">' + ignorees[role] + (ignorees[role] > 1 ? ' fiches illisibles ont été ignorées.' : ' fiche illisible a été ignorée.') + '</p>';
    if (!stockageOk) h += '<p class="note" role="alert">Ce navigateur n’enregistre pas les données. Les fiches seront perdues quand vous fermerez la page.</p>';
    h += '<p class="note">Les fiches restent sur ce téléphone et ne sont envoyées nulle part. Les dates sont calculées d’après les calendriers PEV (nourrisson) et Td (femme enceinte). Le carnet de santé et l’agent de santé font foi.</p>';
    return h;
  }

  function vueNouveau() {
    var role = S.tab, auj = toISO(aujourdhui());
    var h = entete(role === 'agent' ? 'Nouvelle fiche' : 'Ajouter', role === 'agent' ? 'Choisissez le type de fiche' : 'Dites-nous qui vous voulez suivre', false);
    h += '<form id="form" class="carte-form" novalidate>';
    h += '<fieldset class="seg" role="radiogroup" aria-label="Type de fiche">' +
      '<label><input class="sr" type="radio" name="type" id="type-enfant" value="enfant" checked><span>' + (role === 'agent' ? 'Enfant' : 'Mon enfant') + '</span></label>' +
      '<label><input class="sr" type="radio" name="type" id="type-mere" value="mere"><span>' + (role === 'agent' ? 'Femme enceinte' : 'Je suis enceinte') + '</span></label></fieldset>';

    h += '<fieldset id="g-enfant">' +
      '<label class="champ"><span>' + (role === 'agent' ? 'Nom et prénoms de l’enfant' : 'Prénom de l’enfant') + '</span><input type="text" id="f-nom" class="maj" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="80"></label>' +
      '<fieldset class="sexe" role="radiogroup" aria-label="Sexe de l’enfant">' +
      '<label><input class="sr" type="radio" name="sexe" id="sexe-f" value="F"><span>Fille</span></label>' +
      '<label><input class="sr" type="radio" name="sexe" id="sexe-m" value="M"><span>Garçon</span></label></fieldset>' +
      '<label class="champ"><span>Date de naissance</span><input type="date" id="f-naiss" max="' + auj + '"></label>' +
      '<label class="case"><input type="checkbox" id="f-naiss-fait" checked><span>Les vaccins de la naissance (DN HépB, BCG, VPO 0) sont déjà faits</span></label>';
    if (role === 'agent') {
      h += '<label class="champ"><span>Parent ou tuteur</span><input type="text" id="f-parent" class="maj" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="80"></label>' +
        '<label class="champ"><span>Téléphone du parent</span><input type="tel" id="f-tel" inputmode="tel" autocomplete="off" placeholder="07 00 00 00 00"><span class="aide">Sert à envoyer le rappel par WhatsApp.</span></label>';
    }
    h += '</fieldset>';

    h += '<fieldset id="g-mere" hidden disabled>' +
      '<label class="champ"><span>' + (role === 'agent' ? 'Nom et prénoms' : 'Mon prénom') + '</span><input type="text" id="m-nom" class="maj" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="80"></label>' +
      '<label class="champ"><span>Date de la 1ère CPN (Td 1)</span><input type="date" id="m-cpn" value="' + auj + '"></label>' +
      '<label class="case"><input type="checkbox" id="m-td1" checked><span>Le Td 1 a déjà été donné ce jour-là</span></label>';
    if (role === 'agent') {
      h += '<label class="champ"><span>Téléphone</span><input type="tel" id="m-tel" inputmode="tel" autocomplete="off" placeholder="07 00 00 00 00"></label>';
    }
    h += '</fieldset>';

    h += '<p class="erreur" id="erreur" role="alert"></p>' +
      '<div class="actions"><button type="submit" class="btn primary bloc">Enregistrer</button>' +
      '<button type="button" class="btn bloc" data-act="retour">Annuler</button></div></form>';
    return h;
  }

  function blocFait(cle, minISO) {
    if (S.ouvertFait !== cle) return '';
    var auj = toISO(aujourdhui());
    return '<div class="fait-form"><label class="champ"><span>Date de vaccination</span>' +
      '<input type="date" id="fait-date" value="' + auj + '" max="' + auj + '" min="' + esc(minISO) + '"></label>' +
      '<p class="erreur" id="erreur" role="alert"></p>' +
      '<div class="rang-btn"><button type="button" class="btn primary" data-act="valider-fait" data-k="' + esc(cle) + '">Valider</button>' +
      '<button type="button" class="btn" data-act="annuler-fait">Annuler</button></div></div>';
  }

  function vueFiche() {
    var role = S.tab;
    var rec = DATA[role].filter(function (r) { return r.id === S.id; })[0];
    if (!rec) { S.ecran = 'liste'; return vueListe(); }
    var e = enrichir(rec), auj = aujourdhui();
    var minISO = rec.type === 'enfant' ? rec.naissance : rec.cpn1;
    var h = '<button type="button" class="retour" data-act="retour">' + ICON_CHEVRON + 'Retour</button>';

    var meta;
    if (rec.type === 'enfant') {
      meta = (rec.sexe === 'F' ? 'Fille' : 'Garçon') + ' · ' + (rec.sexe === 'F' ? 'née' : 'né') + ' le ' + fmtCourt(parseISO(rec.naissance)) + ' · ' + ageTexte(parseISO(rec.naissance), auj);
    } else {
      meta = 'Femme enceinte · 1ère CPN le ' + fmtCourt(parseISO(rec.cpn1));
    }
    h += '<header class="identite"><h1 id="titre" tabindex="-1">' + esc(rec.nom) + (rec.exemple ? '<em class="tag">Exemple</em>' : '') + '</h1><p>' + esc(meta) + '</p>' +
      (role === 'agent' && (rec.parent || rec.tel) ? '<p>' + esc([rec.parent ? 'Parent : ' + rec.parent : '', rec.tel ? 'Tél. : ' + rec.tel : ''].filter(Boolean).join(' · ')) + '</p>' : '') + '</header>';

    if (e.p) {
      var p = e.p, st = e.st, etat = st.t === 'retard' ? 'retard' : 'avenir';
      var msg = messageRappel(rec, p, st, role);
      var num = role === 'agent' ? numeroWA(rec.tel) : '';
      var wa = 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
      var sousl = p.rang ? (p.sub ? p.sub + ' · ' : '') + p.rang + ' contact' : p.sub;
      h += '<section class="prochain" data-etat="' + etat + '" aria-label="Prochain rendez-vous">' +
        '<p class="eyebrow">Prochain rendez-vous</p>' +
        '<div class="prochain-ligne"><div class="feuille"><span class="mois">' + esc(fmtMois(p.date)) + '</span><span class="jour">' + new Date(p.date).getUTCDate() + '</span><span class="an">' + new Date(p.date).getUTCFullYear() + '</span></div>' +
        '<div><p class="quand">' + esc(maj(fmtJour(p.date))) + '</p><p class="rel">' + esc(statutTexte(st)) + '</p><p class="sous">' + esc(p.label + (sousl ? ' · ' + sousl : '')) + '</p></div></div>' +
        '<ul class="vaccins">' + p.v.map(function (v) { return '<li><b>' + esc(v) + '</b><span>Protège contre : ' + esc(infoVaccin(v)) + '</span></li>'; }).join('') + '</ul>' +
        (p.note ? '<p class="sous">' + esc(p.note) + '</p>' : '') +
        blocFait(p.k, minISO) +
        '<div class="actions">' +
        (S.ouvertFait === p.k ? '' : '<button type="button" class="btn primary bloc" data-act="fait" data-k="' + esc(p.k) + '">Marquer comme fait</button>') +
        '<a class="btn bloc" href="' + esc(wa) + '" target="_blank" rel="noopener noreferrer">' + (role === 'agent' ? 'Rappel WhatsApp' : 'Partager par WhatsApp') + '</a>' +
        (role === 'agent' && !num ? '<p class="sous">Ajoutez le numéro du parent pour envoyer le rappel directement.</p>' : '') +
        '<details class="msg" id="det-msg"><summary>Voir le message de rappel</summary><textarea id="msg-txt" readonly rows="5">' + esc(msg) + '</textarea></details>' +
        '<button type="button" class="btn bloc" data-act="copier" id="btn-copier">Copier le message</button>' +
        '</div></section>';
      if (role === 'parent') {
        h += '<section class="rappel-cal" aria-label="Alertes sur ce téléphone"><h2>' + ICON_CLOCHE + 'Être alerté sur ce téléphone</h2>' +
          '<p>Ajoutez tous les rendez-vous à venir au calendrier du téléphone. Vous recevrez une alerte la veille à 8 h et le jour même à 7 h, même sans internet.</p>' +
          '<button type="button" class="btn primary bloc" data-act="calendrier">Ajouter les rappels au calendrier</button>' +
          '<p class="muted petit" id="cal-info" role="status" aria-live="polite"></p>' +
          '<p class="muted petit">Les rappels portent le nom inscrit sur la fiche et restent dans le calendrier de ce téléphone. Si votre calendrier est synchronisé avec Google ou iCloud, ils y seront aussi.</p></section>';
      }
    } else {
      h += '<section class="prochain" data-etat="complet"><p class="eyebrow">Calendrier</p><h2>Tous les vaccins du calendrier sont faits.</h2>' +
        '<p class="sous">Vérifiez toujours le carnet de santé avec l’agent de santé.</p></section>';
    }

    h += '<section class="section-frise"><h2>Calendrier complet</h2><ol class="frise">' + e.items.map(function (it) {
      var s = statutDe(it, auj), estP = e.p && it.k === e.p.k;
      var cls = it.fait ? 'fait' : (s.t === 'retard' ? 'retard' : (estP ? 'courant' : ''));
      var txt;
      if (it.fait) txt = '<span class="st-fait">Fait le ' + esc(fmtCourt(parseISO(it.fait))) + '</span>';
      else if (s.t === 'retard') txt = '<span class="st-retard">' + esc(statutTexte(s)) + '</span>';
      else if (estP) txt = '<span class="st-courant">Prochain rendez-vous</span>';
      else txt = '<span class="muted">' + esc(statutTexte(s)) + '</span>';
      var sousl = it.rang ? (it.sub ? it.sub + ' · ' : '') + it.rang + ' contact' : it.sub;
      var action = '';
      if (it.fait) action = '<button type="button" class="lien gris" data-act="defaire" data-k="' + esc(it.k) + '">Retirer la date</button>';
      else if (!estP) action = S.ouvertFait === it.k ? blocFait(it.k, minISO) : '<button type="button" class="lien" data-act="fait" data-k="' + esc(it.k) + '">Marquer comme fait</button>';
      return '<li class="' + cls + '"><span class="marqueur" aria-hidden="true">' + (it.fait ? ICON_CHECK : esc(it.num)) + '</span>' +
        '<div class="titre-ligne"><b>' + esc(it.label) + '</b><span class="muted petit">' + esc(sousl || '') + '</span></div>' +
        '<p class="date">' + esc(fmtCourt(it.date)) + ' · ' + txt + '</p>' +
        '<p class="vlist">' + esc(it.note ? it.note : it.v.join(' · ')) + '</p>' + action + '</li>';
    }).join('') + '</ol></section>';

    h += '<div class="zone-suppr">' + (S.confirmSuppr
      ? '<p class="erreur">Supprimer cette fiche ? Cette action est définitive.</p><div class="actions"><button type="button" class="btn danger bloc" data-act="suppr-oui">Oui, supprimer</button><button type="button" class="btn bloc" data-act="suppr-non">Non, garder</button></div>'
      : '<button type="button" class="lien gris" data-act="suppr">' + (role === 'agent' ? 'Supprimer cette fiche' : 'Retirer de ma liste') + '</button>') + '</div>';
    return h;
  }

  /* ---------- rendu ---------- */
  var $app = document.getElementById('app');
  function vueErreur() {
    return '<div class="vide"><h2>Un problème est survenu</h2><p class="muted">Cette page n’a pas pu s’afficher. Vos fiches n’ont pas été effacées.</p>' +
      '<button type="button" class="btn primary bloc" data-act="retour">Revenir à la liste</button></div>';
  }
  function render(haut) {
    var verrou = estVerrouille(S.tab), page;
    try {
      page = verrou ? vueVerrou() : (S.ecran === 'pin' ? vuePin() : (S.ecran === 'nouveau' ? vueNouveau() : (S.ecran === 'fiche' ? vueFiche() : vueListe())));
    } catch (e) {
      page = vueErreur(); verrou = false;
    }
    $app.innerHTML = page;
    ['agent', 'parent'].forEach(function (r) {
      var b = document.getElementById('tab-' + r);
      if (S.tab === r) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (haut) {
      window.scrollTo(0, 0);
      var t = document.getElementById('titre');
      if (t) { try { t.focus({ preventScroll: true }); } catch (e) { /* sans effet */ } }
    }
    if (verrou) { var fp = document.getElementById('pin-saisie'); if (fp) { try { fp.focus({ preventScroll: true }); } catch (e) { /* sans effet */ } } }
  }
  function recCourante() { return DATA[S.tab].filter(function (r) { return r.id === S.id; })[0]; }
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function afficherErreur(m) { var el = document.getElementById('erreur'); if (el) el.textContent = m; }

  function soumettre() {
    var role = S.tab, auj = aujourdhui();
    var type = document.querySelector('input[name="type"]:checked').value;
    var rec;
    if (type === 'enfant') {
      var nom = up(val('f-nom')), naiss = val('f-naiss');
      var sx = document.querySelector('input[name="sexe"]:checked');
      if (!nom) return afficherErreur('Écrivez le nom de l’enfant.');
      if (!sx) return afficherErreur('Choisissez fille ou garçon.');
      if (!naiss) return afficherErreur('Choisissez la date de naissance.');
      var tn = parseISO(naiss);
      if (tn > auj) return afficherErreur('La date de naissance ne peut pas être dans le futur.');
      if (tn < ajouterMois(auj, -216)) return afficherErreur('Cette date semble trop ancienne pour un enfant.');
      var fait = document.getElementById('f-naiss-fait').checked;
      rec = { id: uid(), type: 'enfant', nom: nom, sexe: sx.value, naissance: naiss, faits: fait ? { c1: naiss } : {} };
      if (role === 'agent') { rec.parent = up(val('f-parent')); rec.tel = val('f-tel'); }
    } else {
      var nm = up(val('m-nom')), cpn = val('m-cpn');
      if (!nm) return afficherErreur('Écrivez le nom.');
      if (!cpn) return afficherErreur('Choisissez la date de la 1ère CPN.');
      var tc = parseISO(cpn);
      if (tc > ajouterMois(auj, 12) || tc < ajouterMois(auj, -12)) return afficherErreur('Cette date semble incorrecte. Vérifiez l’année.');
      rec = { id: uid(), type: 'mere', nom: nm, cpn1: cpn, faits: {} };
      if (document.getElementById('m-td1').checked) {
        if (tc > auj) return afficherErreur('Le Td 1 ne peut pas être déjà donné à une date future.');
        rec.faits.td1 = cpn;
      }
      if (role === 'agent') rec.tel = val('m-tel');
    }
    DATA[role].push(rec);
    sauver(role);
    S.id = rec.id; S.ecran = 'fiche'; reinit();
    render(true);
  }

  /* ---------- événements ---------- */
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act]');
    if (!b) return;
    var a = b.dataset.act, role = S.tab, rec;
    if (a === 'tab') { S.tab = b.dataset.tab; S.ecran = 'liste'; S.recherche = ''; S.oubli = false; reinit(); render(true); }
    else if (a === 'nouveau') { S.ecran = 'nouveau'; render(true); }
    else if (a === 'retour') { S.ecran = 'liste'; reinit(); render(true); }
    else if (a === 'ouvrir') { S.id = b.dataset.id; S.ecran = 'fiche'; reinit(); render(true); }
    else if (a === 'fait') { S.ouvertFait = b.dataset.k; render(false); var d = document.getElementById('fait-date'); if (d) d.focus({ preventScroll: false }); }
    else if (a === 'annuler-fait') { S.ouvertFait = null; render(false); }
    else if (a === 'valider-fait') {
      rec = recCourante(); if (!rec) return;
      var dv = val('fait-date');
      if (!dv) return afficherErreur('Choisissez la date.');
      var t = parseISO(dv), min = parseISO(rec.type === 'enfant' ? rec.naissance : rec.cpn1);
      if (t > aujourdhui()) return afficherErreur('La date ne peut pas être dans le futur.');
      if (t < min) return afficherErreur('La date ne peut pas être avant ' + (rec.type === 'enfant' ? 'la naissance.' : 'la 1ère CPN.'));
      rec.faits = rec.faits || {}; rec.faits[b.dataset.k] = dv;
      sauver(role); S.ouvertFait = null; render(false);
    }
    else if (a === 'defaire') { rec = recCourante(); if (!rec) return; delete rec.faits[b.dataset.k]; sauver(role); render(false); }
    else if (a === 'copier') {
      var txt = document.getElementById('msg-txt'); if (!txt) return;
      var fin = function () { b.textContent = 'Message copié'; setTimeout(function () { if (b.isConnected) b.textContent = 'Copier le message'; }, 2000); };
      var secours = function () { var det = document.getElementById('det-msg'); if (det) det.open = true; txt.focus(); txt.select(); b.textContent = 'Appuyez longuement pour copier'; };
      try { navigator.clipboard.writeText(txt.value).then(fin, secours); } catch (e) { secours(); }
    }
    else if (a === 'calendrier') {
      rec = recCourante(); if (!rec) return;
      var info = document.getElementById('cal-info'), ics = fabriquerICS(rec, planifier(rec), aujourdhui(), Date.now());
      if (!ics.n) { if (info) info.textContent = 'Aucun vaccin à venir : rien à ajouter.'; return; }
      try {
        var url = URL.createObjectURL(new Blob([ics.texte], { type: 'text/calendar;charset=utf-8' }));
        var lien = document.createElement('a');
        lien.href = url; lien.download = 'rappels-carnet-pev.ics';
        document.body.appendChild(lien); lien.click(); lien.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
        if (info) info.textContent = ics.n + ' rappel' + (ics.n > 1 ? 's' : '') + ' prêt' + (ics.n > 1 ? 's' : '') + '. Ouvrez le fichier téléchargé puis choisissez « Ajouter au calendrier ». Si rien ne s’ouvre, ouvrez le site dans Safari ou Chrome (pas depuis l’icône) et réessayez.';
      } catch (e) { if (info) info.textContent = 'Impossible de créer le fichier sur ce téléphone.'; }
    }
    else if (a === 'suppr') { S.confirmSuppr = true; render(false); }
    else if (a === 'suppr-non') { S.confirmSuppr = false; render(false); }
    else if (a === 'suppr-oui') {
      DATA[role] = DATA[role].filter(function (r) { return r.id !== S.id; });
      sauver(role); S.ecran = 'liste'; reinit(); render(true);
    }
    else if (a === 'suppr-exemples') {
      DATA[role] = DATA[role].filter(function (r) { return !r.exemple; });
      sauver(role); render(false);
    }
    else if (a === 'pin-creer') { S.ecran = 'pin'; S.pinMode = 'creer'; render(true); }
    else if (a === 'pin-retirer') { S.ecran = 'pin'; S.pinMode = 'retirer'; render(true); }
    else if (a === 'verrouiller') { deverrouille[role] = false; S.ecran = 'liste'; reinit(); render(true); }
    else if (a === 'pin-oubli') { S.oubli = true; render(false); }
    else if (a === 'pin-oubli-non') { S.oubli = false; render(false); }
    else if (a === 'pin-oubli-oui') {
      DATA[role] = []; sauver(role); effacer(PINCLE[role]); effacer(ESSAICLE[role]);
      deverrouille[role] = true; S.oubli = false; S.ecran = 'liste'; render(true);
    }
  });
  document.addEventListener('submit', function (ev) {
    var id = ev.target.id;
    if (id === 'form') { ev.preventDefault(); soumettre(); }
    else if (id === 'form-verrou') { ev.preventDefault(); soumettreVerrou(); }
    else if (id === 'form-pin') { ev.preventDefault(); soumettrePin(); }
  });
  document.addEventListener('input', function (ev) {
    var cible = ev.target;
    if (cible.classList && cible.classList.contains('maj') && !ev.isComposing) {
      var debut = cible.selectionStart, fin = cible.selectionEnd, majuscule = up(cible.value);
      if (majuscule !== cible.value) {
        cible.value = majuscule;
        try { cible.setSelectionRange(debut, fin); } catch (e) { /* sans effet */ }
      }
    }
    if (ev.target.id === 'recherche') {
      S.recherche = ev.target.value;
      var l = document.getElementById('liste'); if (l) l.innerHTML = listeHTML();
    }
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.name === 'type') {
      var enfant = ev.target.value === 'enfant';
      var ge = document.getElementById('g-enfant'), gm = document.getElementById('g-mere');
      ge.hidden = !enfant; ge.disabled = !enfant; gm.hidden = enfant; gm.disabled = enfant;
      afficherErreur('');
    }
  });

  DATA.agent = charger('agent');
  DATA.parent = charger('parent');
  render(false);
})();

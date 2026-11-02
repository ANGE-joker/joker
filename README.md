# Carnet PEV

Calendrier de vaccination du Programme élargi de vaccination (PEV) de Côte d'Ivoire, pensé pour le téléphone.

- **Agent de santé** : registre des enfants et des femmes enceintes, prochain rendez-vous, vaccins du contact, rappel WhatsApp au parent.
- **Espace parent** : le parent ajoute son enfant et voit les prochains rendez-vous.
- **Calendriers** : PEV du nourrisson (naissance, 6, 10, 14 semaines, 6, 8, 9 et 15 mois, HPV à 9 ans pour les filles) et Td de la femme enceinte (Td 1 à Td 5).
- **Hors connexion** : après une première ouverture en ligne, l'application s'ouvre sans internet.

## Confidentialité et sécurité

- Il n'y a pas de serveur. Les fiches sont enregistrées uniquement dans le navigateur de chaque téléphone et ne sont envoyées nulle part.
- Chaque espace peut être protégé par un code à 4 chiffres (haché avec PBKDF2, essais limités, blocage qui résiste au rechargement). Ce code garde les curieux à distance, il ne chiffre pas les données.
- Politique de sécurité du contenu (CSP) stricte : aucun script ni style en ligne, aucune ressource externe hormis les polices Google.
- Le site refuse de s'afficher dans une iframe d'un autre site.
- Toutes les données lues dans le stockage sont revérifiées avant affichage.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | La page |
| `app.js` | Le code de l'application |
| `style.css` | Le style |
| `boot.js` | Démarrage : protection anti-cadre et service worker |
| `sw.js` | Fonctionnement hors connexion |
| `manifest.webmanifest` | Installation sur l'écran d'accueil |
| `icon-*.png`, `apple-touch-icon.png`, `favicon.svg` | Icônes |

## Mettre à jour

Remplacer les fichiers dans le dépôt (Add file, puis Upload files). GitHub Pages republie le site en une à deux minutes. Les téléphones reçoivent la nouvelle version à la deuxième ouverture.

## Recommandations pour le dépôt

- Activer la double authentification (ou une clé d'accès) sur le compte GitHub : qui contrôle le dépôt contrôle le code qui manipule les fiches.
- Dans Settings, Pages, garder « Enforce HTTPS » coché.
- Ne pas publier d'autres sites sur le même compte tant que l'application manipule de vraies données : tous les sites d'un même compte partagent la même origine, donc le même stockage. Un nom de domaine à soi règle ce point.

## Avertissement

Les dates sont calculées d'après les calendriers PEV et Td. Le carnet de santé et l'agent de santé font foi.

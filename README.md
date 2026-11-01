# Carnet PEV

Calendrier de vaccination du Programme élargi de vaccination (PEV) de Côte d'Ivoire, pensé pour le téléphone.

- **Agent de santé** : registre des enfants et des femmes enceintes, prochain rendez-vous, vaccins du contact, rappel WhatsApp au parent.
- **Espace parent** : le parent ajoute son enfant et voit les prochains rendez-vous.
- **Calendriers** : PEV du nourrisson (naissance, 6, 10, 14 semaines, 6, 8, 9 et 15 mois, HPV à 9 ans pour les filles) et Td de la femme enceinte (Td 1 à Td 5).
- **Hors connexion** : après une première ouverture en ligne, l'application s'ouvre sans internet.

## Confidentialité

Il n'y a pas de serveur. Les fiches sont enregistrées uniquement dans le navigateur de chaque téléphone et ne sont envoyées nulle part. Chaque espace peut être protégé par un code à 4 chiffres. Ce code garde les curieux à distance, il ne chiffre pas les données.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | L'application (page, style et code) |
| `sw.js` | Fonctionnement hors connexion |
| `manifest.webmanifest` | Installation sur l'écran d'accueil |
| `icon-*.png`, `apple-touch-icon.png`, `favicon.svg` | Icônes |

## Mettre à jour

Remplacer les fichiers dans le dépôt (Add file, puis Upload files). GitHub Pages republie le site en une à deux minutes. Les téléphones reçoivent la nouvelle version à la deuxième ouverture.

## Avertissement

Les dates sont calculées d'après les calendriers PEV et Td. Le carnet de santé et l'agent de santé font foi.

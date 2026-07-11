# ✝ LA VOIE — L'Éveil du Disciple

> « Je suis le chemin, la vérité et la vie. » — Jean 14:6

**LA VOIE** est un jeu 3D en monde ouvert, jouable entièrement dans le navigateur, où le joueur
incarne un disciple qui traverse les 5 étapes de la maturité chrétienne dans la ville de
**Théopolis** — du nouveau-né dans la foi jusqu'au père spirituel qui forme d'autres disciples.

*Pourquoi ce nom ? « La Voie » est le tout premier nom du christianisme dans les Écritures
(Actes 9:2 ; 24:14) — avant même qu'on parle de « chrétiens », les disciples étaient
« ceux de la Voie ». Un jeu sur le chemin du disciple ne pouvait pas mieux s'appeler.*

## 🎮 Lancer le jeu

**Aucune installation, aucun serveur.** Deux options :

1. **Double-clic** : ouvrez simplement `index.html` dans un navigateur récent (Chrome, Edge, Firefox).
2. **Serveur statique local** (optionnel) : `python -m http.server` puis http://localhost:8000

Le jeu est 100 % statique (HTML/CSS/JS + Three.js embarqué) : il s'héberge tel quel sur
GitHub Pages, Netlify ou n'importe quel hébergement gratuit.

La progression est **sauvegardée automatiquement** dans le navigateur (localStorage).

## ⌨ Commandes

| Touche | Action |
|---|---|
| **Z Q S D** / W A S D / flèches | Se déplacer |
| **Souris** (cliquer-glisser) | Caméra orbitale · molette : zoom |
| **Maj** | Courir |
| **Espace** | Sauter |
| **E** | Interagir / parler / prier |
| **F** | Monter / descendre d'un véhicule (vélo ou voiture) |
| **J** | Journal du disciple (quêtes, fruit de l'Esprit, armure, versets) |
| **M** | Carte de Théopolis |
| **H** | Aide |
| **V** | Couper / remettre le son |

## 🌾 Le jeu

- **Personnage réaliste** : un humain 3D riggé (squelette de 49 os) avec de vraies animations
  squelettiques de marche, course et repos, embarqué dans le jeu (aucun téléchargement).
- **Monde ouvert 3D au rendu cinématographique** (tone mapping ACES, matériaux PBR, textures
  procédurales) : une ville de 49 pâtés de maisons — église, place et fontaine, grand parc,
  Colline de la Prière, champ du Semeur, marché, auberge, bibliothèque, entrepôts, quartiers
  résidentiels et commerciaux — avec cycle jour/nuit (les fenêtres des immeubles s'allument
  le soir), nuages, oiseaux, cloches d'église, circulation et passants.
- **Véhicules conduisibles** : un vélo et trois voitures dispersées dans la ville (touche F).
- **Lieux de prière** : devant l'église et au pied de la croix de la colline (touche E) —
  un temps de recueillement qui fait grandir la paix et la joie.
- **15 quêtes principales** inspirées des paraboles : la brebis perdue, le Semeur, le Bon
  Samaritain, le fils prodigue, les talents, le pardon (70×7), et l'envoi en mission.
- **5 étapes de maturité** : Nouveau-né → Enfant de Dieu → Jeune dans la foi → Adulte → Père
  spirituel, chacune guidée par un mentor (Frère Étienne, Sœur Marie, l'Ancien David, la
  Docteure Priscille, l'Apôtre Jean).
- **Fruit de l'Esprit** (Galates 5:22-23) : 9 statistiques qui mûrissent selon vos actes.
- **Armure de Dieu** (Éphésiens 6) : 6 pièces d'équipement à gagner, visibles sur le personnage,
  avec des effets de jeu réels.
- **5 mini-jeux** : semailles chronométrées, traits enflammés à bloquer au bouclier, course de la
  persévérance (rejouable, avec record à battre), versets à reconstituer, grand quiz biblique
  (rejouable en mode révision à la bibliothèque).
- **10 parchemins de versets cachés** à découvrir en explorant.

## 🛠 Technique

- **Three.js r147** (WebGL) + GLTFLoader, embarqués dans `lib/` — aucune dépendance réseau.
- Le personnage jouable est un modèle GLB riggé (rig Mixamo, animations squelettiques),
  **embarqué en base64** dans `assets/soldier-data.js` pour fonctionner même en `file://`.
- Le reste est 100 % procédural : ville, PNJ, véhicules et props générés par code.
- Tout tourne côté client ; sauvegarde en localStorage.
- Structure : `js/data.js` (contenu narratif), `js/city.js` (génération du monde),
  `js/quests.js` (moteur de quêtes), `js/minigames.js`, `js/player.js`, `js/npc.js`,
  `js/hud.js`, `js/dialogue.js`, `js/main.js`.

Voir [RAPPORT.md](RAPPORT.md) pour l'état honnête du projet : ce qui est réellement jouable,
ce qui est simplifié, et les pistes d'extension.

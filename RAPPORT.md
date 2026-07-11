# RAPPORT DE DÉVELOPPEMENT — KAIROS : Le Chemin du Disciple

*Rapport honnête et technique. Objectif : que vous sachiez exactement ce qui existe, ce qui fonctionne, ce qui est simplifié, et ce que coûterait la suite.*

---

## 1. Ce qui a été construit et qui FONCTIONNE réellement

Tout ce qui suit a été **vérifié en jouant dans un vrai navigateur Chromium** (tests automatisés Playwright : les 15 quêtes jouées de bout en bout, zéro erreur console, fin du jeu atteinte).

### Monde 3D
- **Ville ouverte d'environ 520 × 520 m** (Théopolis) : 49 blocs urbains, 5 quartiers distincts (Vieux Port avec eau/pontons/barques, Jardins avec parcs, Grand Marché avec étals colorés, Colline du Temple avec temple à colonnades, quartiers résidentiels et d'immeubles), une chapelle, une arène, une place avec fontaine, ~150 bâtiments, ~120 arbres, lampadaires, bancs, caisses, nuages animés.
- **Vraie 3D** : caméra orbitale à la 3ème personne (souris + pointer lock), profondeur, ombres portées dynamiques (shadow map suivant le joueur), brouillard atmosphérique.
- **Cycle jour/nuit complet** (8 min) : soleil et lune visibles, aube/crépuscule colorés, étoiles, lampadaires qui s'allument la nuit.
- **Collisions** : cercle-vs-AABB sur tous les bâtiments, arbres, lampadaires, murets, limites de ville — testées.
- **Trafic** : 12 voitures autonomes circulent sur le réseau routier (conduite à droite, choix de direction aux intersections, freinage devant obstacles) + **5 voitures conduisibles par le joueur** (E pour entrer/sortir, accélération/freinage/braquage, collisions).
- ~48 piétons ambiants qui déambulent sur les trottoirs.

### Personnage et progression
- Héros **métis** (peau brune intermédiaire, cheveux noirs bouclés), animation procédurale de marche/course/saut/idle.
- **6 étapes spirituelles** (Nouveau-né → Disciple accompli), chacune avec verset, icône, couleur d'aura.
- **9 fruits de l'Esprit** comme statistiques, augmentés/diminués par les quêtes et les choix de dialogue.
- **Armure de Dieu : 6 pièces réellement visibles sur le corps du personnage** (ceinture dorée, sur-chaussures, cuirasse, bouclier avec croix au bras gauche, casque à cimier, épée lumineuse en main droite), débloquées au fil des étapes.
- Jauges : grâce (XP), esprit (endurance de course), pièces.

### Quêtes et contenu
- **15 quêtes-paraboles complètes et jouables**, dialogues écrits en entier (~120 répliques), avec 12 types de mécaniques : dialogue à choix moraux (affectant les fruits), brebis qui vous suivent physiquement, semailles avec vraie distinction bonne terre/pierres/épines, chasse au trésor à indices, livraison chronométrée (course ou voiture), collecte d'objets, allumage d'autels de nuit, escorte du fils prodigue, mentorat de 3 PNJ, cinématique finale du phare.
- **4 mini-jeux** : quiz biblique (15 questions, tirage aléatoire), parabole des Talents (choix d'investissement avec l'issue « enterrer » fidèle au texte), livraison des 5 pains contre la montre, **arène du combat spirituel** (mini-jeu d'action 3D : collecter 10 flammes de prière en esquivant des ombres qui chargent).
- **21 versets cachés** à collectionner dans toute la ville (+grâce).
- 5 mentors (André, Marthe, Lydia, Élie, Siméon) + PNJ de quête (blessé, voisines, Josias, Nathan et son père, 3 futurs disciples, marchands).
- **Fin de jeu** : cérémonie du phare, écran de fin avec bilan, puis monde libre.

### Interface et systèmes
- HUD complet : étape + barre de grâce, pièces, versets, endurance, objectif courant, chrono, notifications, invites d'interaction.
- **Minimap circulaire temps réel** + grande carte nommée (M), marqueur d'objectif 3D (colonne de lumière dorée) + point sur la minimap + **flèche d'écran quand l'objectif est hors champ**.
- Journal de quêtes (J), fiche du disciple (C) avec barres de fruits et armure, menu pause avec verset, écrans de passage d'étape avec rayons animés.
- **Sauvegarde automatique** (localStorage) toutes les 12 s + à chaque étape de quête ; bouton « Continuer » au menu. Testée après rechargement de page.
- **Musique générative** WebAudio (nappes d'accords paisibles + carillons) et effets sonores synthétisés — aucun fichier audio.
- Clavier **AZERTY et QWERTY** gérés automatiquement (event.code).

### Performance et livraison
- ~105 draw calls, ~16 000 triangles à l'écran (bâtiments/arbres/lampadaires instanciés) → 60 fps sans effort sur un GPU normal, y compris portables.
- **Deux formats livrés** : dossier de fichiers statiques (`index.html` + `js/` + `css/` + `vendor/`) hébergeable partout, et **`KAIROS-standalone.html`** : le jeu entier en un seul fichier de 644 Ko, double-cliquable, testé en `file://`.

## 2. Ce qui est SIMPLIFIÉ ou placeholder — en toute transparence

- **Graphismes** : géométrie procédurale low-poly « boîtes et cônes » (esprit Crossy Road / Kenney), pas de modèles 3D sculptés, pas de mains à doigts, pas de squelette d'animation (les membres pivotent, c'est lisible et charmant mais pas du motion capture). Les visages sont deux yeux sur un cube.
- **Ce n'est pas GTA 5** : l'échelle (une ville de 520 m de côté, pas 80 km²), la physique des véhicules (cinématique simple : pas de suspension, de dérapage ni de dégâts), l'IA (piétons en boucle autour de leur bloc, pas d'agenda de vie) sont d'un ordre de grandeur plus modestes. C'est l'*esprit* d'un monde ouvert urbain, à l'échelle d'un jeu web solo.
- **Intérieurs** : aucun bâtiment n'est visitable (portes décoratives).
- **Audio** : la musique générative est atmosphérique mais répétitive à la longue ; pas de voix, pas de bruits de pas.
- **Sauvegarde en cours de quête** : une quête active reprend à sa première étape après rechargement (les quêtes sont courtes, rien n'est perdu d'important) ; c'est un choix de simplicité assumé.
- **Mini-jeu de l'arène** : les ombres ont des motifs simples (orbite + charge) ; un joueur attentif gagne dès le premier ou deuxième essai.
- **Équilibrage** : les seuils de grâce sont calés pour que la trame principale suffise ; les versets cachés sont un bonus, pas une nécessité — peu de vraie difficulté globale (choix assumé pour un jeu d'édification).
- **Pathfinding** : les PNJ qui vous suivent (brebis, Nathan) vont en ligne droite vers vous et peuvent frôler/traverser des obstacles fins.
- Testé sur Chromium ; Firefox/Safari devraient fonctionner (APIs standard) mais n'ont pas été vérifiés ici.

## 3. Estimation réaliste pour aller plus loin

| Extension | Effort estimé (avec moi) | Remarques |
|---|---|---|
| +15 quêtes secondaires / actes 2-3 | quelques heures par lot | Le moteur de quêtes est data-driven : une quête = ~40 lignes de données |
| Ville 4× plus grande, nouveaux quartiers | 1-2 sessions | La génération est paramétrique ; le coût est surtout le placement du contenu |
| Intérieurs (chapelle, maisons) | 1 session | Nouveau système de portes/téléportation + scènes intérieures |
| PNJ avec routines jour/nuit | 1 session | Horaires, trajets domicile-travail-chapelle |
| Meilleurs modèles 3D (persos, voitures) | **artiste 3D humain requis** | Ou intégration d'assets libres (Quaternius/Kenney glTF) : 1 session pour le pipeline |
| Vraies animations squelettales | artiste + 1-2 sessions | glTF + AnimationMixer de Three.js |
| Musique/voix de qualité | compositeur / comédiens | Le code d'intégration est trivial ensuite |
| Multijoueur | hors périmètre « sans serveur » | Contredirait la contrainte de départ |

## 4. Recommandation sur la suite

**À développer avec moi (fort rendement)** : tout ce qui est *logique, contenu et systèmes* — nouvelles quêtes et dialogues (le format data-driven rend ça très rapide), nouveaux mini-jeux, équilibrage, nouveaux quartiers, système d'intérieurs, journal enrichi, accessibilité, traductions, intégration d'assets glTF libres de droits.

**Où un humain est nécessaire** : direction artistique et modèles 3D de qualité (personnages expressifs, animations squelettales), composition musicale originale, doublage voix, et surtout **play-tests humains** — le ressenti spirituel et pédagogique du jeu (justesse des dialogues, ton pastoral) mérite une relecture par un responsable d'église ou un catéchète.

**Prochaine étape au meilleur rapport valeur/effort**, à mon avis : remplacer les personnages-cubes par des modèles glTF animés de Quaternius (gratuits, CC0) — c'est ce qui transformerait le plus la perception de qualité, pour un effort modéré.

---

*15/15 quêtes vérifiées jouables par tests automatisés dans Chromium, 0 erreur console, fin du jeu atteinte, sauvegarde/rechargement validés.*

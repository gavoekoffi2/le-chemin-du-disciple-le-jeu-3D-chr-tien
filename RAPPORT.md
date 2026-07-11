# RAPPORT HONNÊTE — LA VOIE : L'Éveil du Disciple

Ce document décrit précisément ce qui a été construit, ce qui fonctionne réellement,
ce qui est simplifié, et ce qu'il faudrait pour aller plus loin. Il est volontairement
non commercial.

## 1. Ce qui est réellement jouable et vérifié

Tout ce qui suit a été **testé automatiquement de bout en bout** dans un navigateur Chromium
(traversée complète des 15 quêtes par script, zéro erreur JavaScript) :

- **Boucle complète du jeu** : écran titre → chargement → nouvelle partie → 15 quêtes →
  écran final, puis monde libre. Les 5 étapes de maturité s'enchaînent avec leurs écrans de passage.
- **Personnage jouable réaliste** : humain 3D riggé (squelette Mixamo, 49 os) avec animations
  squelettiques réelles (idle/marche/course, fondu-enchaîné entre clips). Le modèle GLB (2,1 Mo)
  est embarqué en base64 dans le code pour rester compatible `file://`. L'armure de Dieu se
  fixe sur les os du squelette (casque sur la tête, bouclier à l'avant-bras, épée dans le dos…).
  Si le décodage échoue, un personnage stylisé de secours prend le relais automatiquement.
- **Monde 3D réel** : ville de ~500 m × 500 m (49 blocs), vraie 3D WebGL avec caméra orbitale,
  profondeur, ombres portées, relief (colline), cycle jour/nuit de 10 minutes avec lampadaires
  qui s'allument, étoiles, aube/crépuscule.
- **Personnage 3e personne** : marche, course, saut, animations procédurales des membres,
  collisions contre ~230 obstacles (bâtiments, arbres, fontaine, caisses, voitures garées).
- **Véhicules conduisibles** (touche F) : un vélo (le joueur pédale dessus, penché sur le
  guidon) et trois voitures (conduite arcade : accélération, freinage, marche arrière,
  inclinaison en virage, collisions avec la ville).
- **19 PNJ nommés** (corps humanisés : têtes rondes, visages, mains, chaussures) +
  22 passants ambulants + 6 voitures de circulation décorative.
- **Ambiance vivante** : nuages qui dérivent (assombris la nuit), vols d'oiseaux en journée,
  cloches de l'église à 8h/12h/18h, lieux de prière interactifs (église et croix de la colline),
  distance vers l'objectif affichée dans le HUD, touche muet (V).
- **Moteur de quêtes** data-driven : étapes parler/aller/collecter/mini-jeu, marqueur
  d'objectif 3D (colonne de lumière), suivi HUD, journal.
- **Dialogues** : boîte de dialogue avec effet machine à écrire, choix à embranchements
  (fils prodigue, réconciliation, mentorat) avec bonus pour la « parole juste ».
- **Systèmes RPG** : 9 fruits de l'Esprit qui progressent, 6 pièces d'armure de Dieu avec
  effets réels (vitesse, mini-jeu du bouclier) **et visibles sur le personnage**.
- **5 mini-jeux fonctionnels** : Semeur (chrono), traits enflammés (esquive/blocage),
  course d'anneaux (rejouable, record sauvegardé — l'élément compétitif), versets à
  reconstituer, quiz biblique (8 questions, 6 requises).
- **10 parchemins cachés** à collecter (exploration récompensée).
- **Sauvegarde/reprise** localStorage vérifiée, y compris en plein milieu de quête.
- **Mode `file://` vérifié** : le jeu marche en double-cliquant `index.html`, sans serveur.
- Contrôles tactiles basiques (deux pouces) présents mais peu testés.

## 2. Ce qui est simplifié ou placeholder

Transparence totale :

- **Le joueur est réaliste, mais son costume est militaire** : le seul modèle humain riggé
  librement redistribuable et assez léger pour être embarqué (Soldier, rig Mixamo, utilisé par
  les exemples officiels de Three.js) porte une tenue de soldat. Vu le thème de « l'armure de
  Dieu » et du « bon soldat de Jésus-Christ » (2 Timothée 2:3), c'est cohérent — mais si vous
  voulez une tenue civile, il faudra un autre modèle GLB (je peux l'intégrer si vous en
  fournissez un, ou en télécharger un si l'accès réseau le permet).
- **Les PNJ restent stylisés** (corps procéduraux améliorés, pas riggés) : cloner 19 modèles
  squelettiques identiques aurait donné une ville d'hommes identiques et pesé sur les
  performances. Le contraste joueur réaliste / PNJ stylisés est un compromis assumé.
- **Bâtiments en boîtes texturées par canvas** : lisible et cohérent, mais pas du photoréalisme
  GTA 5 — aucun outil ne produit une ville AAA dans un fichier HTML statique en une session.
- Sur le vélo, le modèle réaliste joue une animation de marche penchée (pas de vraie animation
  de pédalage) ; en voiture, le joueur est masqué (vitres teintées) plutôt qu'assis.
- **Audio synthétisé** (WebAudio) : nappe d'ambiance, pas, carillons. Pas de musique composée
  ni de voix.
- **Intérieurs non modélisés** : on ne rentre pas dans les bâtiments ; l'église, l'auberge,
  la bibliothèque sont des décors extérieurs où les scènes se jouent sur le parvis.
- **PNJ sans routine de vie** : les passants marchent en ligne sur les trottoirs, les mentors
  sont statiques ; pas d'agenda jour/nuit ni de dialogue systémique hors quêtes (une phrase
  d'ambiance par PNJ).
- **Circulation décorative** : les voitures du trafic roulent en boucle (seules les 3 voitures
  garées + le vélo se conduisent) ; pas de collision voiture-joueur (choix : pas de
  « game over » dans ce jeu).
- **Physique simple** : collisions cercle-rectangle en 2D + gravité verticale. Pas de moteur
  physique complet, pas de grimpe/nage.
- **Le suiveur (Timothée)** marche vers le joueur en ligne droite : il peut frôler des murs
  (pas de pathfinding A*).
- **Quêtes linéaires** : une trame principale unique ; pas de quêtes annexes à embranchements
  multiples (la course et les parchemins sont les activités libres).
- Performance : ~700 draw calls. Fluide sur un PC/portable correct avec GPU ; sur une très
  vieille machine intégrée, la fenêtre peut descendre sous 30 fps.

## 3. Estimation réaliste pour étendre vers la vision complète

Avec le même socle (Three.js statique, pas de serveur) :

| Extension | Effort estimé (avec IA) | Remarques |
|---|---|---|
| Doubler la ville, nouveaux quartiers (port, stade…) | 1-2 sessions | La génération est paramétrique, c'est surtout du réglage |
| 15 quêtes annexes supplémentaires | 2-3 sessions | Le moteur existe ; c'est de l'écriture + placement |
| Intérieurs (église, maison du joueur) | 1-2 sessions | Nouveau système de « cellules » intérieures |
| PNJ riggés variés (plusieurs modèles GLTF animés) | 2-4 sessions | Faisable, mais ajoute ~10-30 Mo d'assets binaires |
| Trafic intelligent (feux, priorités, piétons qui traversent) | 1-2 sessions | Les voitures conduisibles existent déjà |
| Musique composée, doublages | Humain requis | Hors de portée d'un livrable statique généré |
| Multijoueur | Change l'architecture | Contredit la contrainte « aucun serveur » |

## 4. Recommandation : quoi développer avec l'IA vs avec des humains

**À développer avec moi (fort rapport qualité/effort)** :
- Toute la **logique de jeu** (moteur de quêtes, systèmes RPG, mini-jeux, sauvegarde) — c'est
  déjà le cœur de ce livrable et ça s'étend très bien.
- L'**écriture** : dialogues, paraboles, textes bibliques contextualisés, équilibrage.
- La **génération procédurale** du monde et ses variations.
- L'**intégration** d'assets 3D libres (GLTF) si vous acceptez un dossier plus lourd.

**À confier à des humains si vous visez un niveau commercial** :
- **Direction artistique et modèles 3D sur mesure** (personnages expressifs, visages).
- **Musique et sound design** composés.
- **Playtests réels** avec le public cible (jeunesse d'église, écoles du dimanche) pour
  calibrer difficulté et rythme spirituel.
- La **théologie/pédagogie** : faire relire les textes par un pasteur/enseignant.

## 5. Vérifications effectuées (méthode)

- `node --check` sur tous les fichiers JS.
- Test Playwright/Chromium n°1 : démarrage, rendu (34 000 triangles), HUD, dialogue,
  journal, carte, nuit, captures d'écran.
- Test Playwright/Chromium n°2 : **traversée automatisée des 15 quêtes** (dialogues, choix,
  collectes, 5 mini-jeux joués via l'état interne, écrans d'étape) → 15/15 accomplies,
  6/6 pièces d'armure, fruits crédités, finale affichée, **0 erreur JS**.
- Test n°3 : rechargement + « Continuer » (sauvegarde), et lancement en `file://` pur.

Limite de la méthode : les tests automatiques valident la **logique**, pas le « feel »
manette-en-main (vitesse de course, caméra, lisibilité). Ces réglages méritent une passe
de playtest humain — dites-moi ce qui accroche et j'ajuste.

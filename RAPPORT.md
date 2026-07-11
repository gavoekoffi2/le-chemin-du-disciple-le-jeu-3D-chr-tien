# RAPPORT HONNÊTE — LA VOIE : L'Éveil du Disciple

Ce document décrit précisément ce qui a été construit, ce qui fonctionne réellement,
ce qui est simplifié, et ce qu'il faudrait pour aller plus loin. Il est volontairement
non commercial.

## 1. Ce qui est réellement jouable et vérifié

Tout ce qui suit a été **testé automatiquement de bout en bout** dans un navigateur Chromium
(traversée complète des 15 quêtes par script, zéro erreur JavaScript) :

- **Boucle complète du jeu** : écran titre → nouvelle partie → 15 quêtes → écran final,
  puis monde libre. Les 5 étapes de maturité s'enchaînent avec leurs écrans de passage.
- **Monde 3D réel** : ville de ~500 m × 500 m (49 blocs), vraie 3D WebGL avec caméra orbitale,
  profondeur, ombres portées, relief (colline), cycle jour/nuit de 10 minutes avec lampadaires
  qui s'allument, étoiles, aube/crépuscule.
- **Personnage 3e personne** : marche, course, saut, animations procédurales des membres,
  collisions contre ~230 obstacles (bâtiments, arbres, fontaine, caisses, voitures garées).
- **Vélo jouable** (touche F) : accélération, freinage, inclinaison dans les virages.
- **19 PNJ nommés** + 22 passants ambulants + 6 voitures en circulation.
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

- **Graphismes low-poly procéduraux** : personnages en boîtes (style Crossy Road/Minecraft),
  bâtiments en boîtes texturées par canvas. C'est un choix assumé (contrainte : pas d'assets
  binaires, pas de réseau) — c'est cohérent et lisible, mais ce n'est **pas** du niveau visuel
  GTA 5, et aucun outil au monde ne produit ça en une session dans un fichier HTML statique.
- **Pas d'animations squelettiques** : les animations sont procédurales (balancement des
  membres). Pas de capture de mouvement, pas de visages animés.
- **Audio synthétisé** (WebAudio) : nappe d'ambiance, pas, carillons. Pas de musique composée
  ni de voix.
- **Intérieurs non modélisés** : on ne rentre pas dans les bâtiments ; l'église, l'auberge,
  la bibliothèque sont des décors extérieurs où les scènes se jouent sur le parvis.
- **PNJ sans routine de vie** : les passants marchent en ligne sur les trottoirs, les mentors
  sont statiques ; pas d'agenda jour/nuit ni de dialogue systémique hors quêtes (une phrase
  d'ambiance par PNJ).
- **Circulation décorative** : les voitures roulent en boucle et ne sont pas conductibles ;
  pas de collision voiture-joueur (choix : pas de « game over » dans ce jeu).
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
| Assets 3D pro (personnages GLTF animés Quaternius/Kenney) | 2-4 sessions | Faisable, mais ajoute ~10-30 Mo d'assets binaires |
| Voitures conduisibles + trafic intelligent | 1-2 sessions | Le vélo fournit déjà la base du contrôleur |
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

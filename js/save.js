/* LA VOIE — état du jeu + sauvegarde locale (localStorage) */
GAME.SAVE_KEY = 'lavoie_save_v1';

GAME.newState = function () {
  const fruits = {};
  GAME.DATA.fruits.forEach(f => fruits[f.id] = 0);
  return {
    stage: 0,                 // index d'étape de maturité (0..4)
    questIndex: 0,            // index de la quête courante dans GAME.DATA.quests
    stepIndex: 0,             // étape courante de la quête
    stepProgress: 0,          // compteur pour les étapes collect
    fruits,                   // points du fruit de l'Esprit
    armor: [],                // ids des pièces d'armure obtenues
    versesFound: [],          // refs des parchemins trouvés
    bestRace: null,           // meilleur chrono de course (secondes)
    pos: [0, 0, 130],         // position du joueur
    timeOfDay: 8.5,           // heure du monde (0..24)
    flags: {},                // drapeaux divers de quêtes
    completed: []             // ids de quêtes terminées
  };
};

GAME.save = function () {
  try {
    const s = GAME.state;
    if (GAME.player) s.pos = [GAME.player.pos.x, GAME.player.pos.y, GAME.player.pos.z];
    if (GAME.world) s.timeOfDay = GAME.world.timeOfDay;
    localStorage.setItem(GAME.SAVE_KEY, JSON.stringify(s));
  } catch (e) { /* stockage indisponible : le jeu reste jouable sans sauvegarde */ }
};

GAME.loadSave = function () {
  try {
    const raw = localStorage.getItem(GAME.SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const base = GAME.newState();
    // fusion défensive (tolère les anciennes sauvegardes)
    for (const k in base) if (s[k] === undefined) s[k] = base[k];
    for (const f in base.fruits) if (s.fruits[f] === undefined) s.fruits[f] = 0;
    return s;
  } catch (e) { return null; }
};

GAME.hasSave = function () {
  try { return !!localStorage.getItem(GAME.SAVE_KEY); } catch (e) { return false; }
};

GAME.clearSave = function () {
  try { localStorage.removeItem(GAME.SAVE_KEY); } catch (e) {}
};

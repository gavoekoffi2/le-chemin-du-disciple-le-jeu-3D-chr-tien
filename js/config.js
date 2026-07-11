// ==== KAIROS — Configuration globale ====

export const CONFIG = {
  // Ville : grille de blocs
  GRID: 7,             // 7x7 blocs
  BLOCK: 60,           // taille d'un bloc
  ROAD: 12,            // largeur d'une rue
  get CITY_SIZE() { return this.GRID * this.BLOCK + (this.GRID + 1) * this.ROAD; },

  // Joueur
  WALK_SPEED: 6.5,
  RUN_SPEED: 12.5,
  JUMP_VELOCITY: 8.5,
  GRAVITY: 24,
  PLAYER_RADIUS: 0.55,
  SPIRIT_MAX: 100,          // endurance
  SPIRIT_DRAIN: 14,         // par seconde en courant
  SPIRIT_REGEN: 18,

  // Véhicule
  CAR_MAX_SPEED: 26,
  CAR_ACCEL: 14,
  CAR_BRAKE: 30,
  CAR_TURN: 1.9,

  // Caméra
  CAM_DIST: 7.5,
  CAM_HEIGHT: 3.0,
  CAM_MIN_PITCH: -0.25,
  CAM_MAX_PITCH: 1.15,

  // Cycle jour/nuit (secondes pour 24h)
  DAY_LENGTH: 480,

  // Progression
  VERSE_COUNT: 21,
  SAVE_KEY: 'kairos_save_v1',
};

// Fruits de l'Esprit — Galates 5:22-23
export const FRUITS = [
  { id: 'amour',    name: 'Amour',           icon: '❤' },
  { id: 'joie',     name: 'Joie',            icon: '☀' },
  { id: 'paix',     name: 'Paix',            icon: '🕊' },
  { id: 'patience', name: 'Patience',        icon: '⏳' },
  { id: 'bonte',    name: 'Bonté',           icon: '🤲' },
  { id: 'bienveillance', name: 'Bienveillance', icon: '🌿' },
  { id: 'fidelite', name: 'Fidélité',        icon: '⚓' },
  { id: 'douceur',  name: 'Douceur',         icon: '🌸' },
  { id: 'maitrise', name: 'Maîtrise de soi', icon: '🛡' },
];

// Armure de Dieu — Éphésiens 6:13-17
export const ARMOR = [
  { id: 'ceinture',  name: 'Ceinture de la Vérité',      icon: '🎗', verse: 'Ayez à vos reins la vérité pour ceinture. — Éph 6:14', stage: 1 },
  { id: 'chaussures',name: 'Chaussures de l\'Évangile',  icon: '👟', verse: 'Mettez pour chaussures à vos pieds le zèle que donne l\'Évangile de paix. — Éph 6:15', stage: 2 },
  { id: 'cuirasse',  name: 'Cuirasse de la Justice',     icon: '🦺', verse: 'Revêtez la cuirasse de la justice. — Éph 6:14', stage: 3 },
  { id: 'bouclier',  name: 'Bouclier de la Foi',         icon: '🛡', verse: 'Prenez par-dessus tout cela le bouclier de la foi. — Éph 6:16', stage: 4 },
  { id: 'casque',    name: 'Casque du Salut',            icon: '⛑', verse: 'Prenez aussi le casque du salut. — Éph 6:17', stage: 4 },
  { id: 'epee',      name: 'Épée de l\'Esprit',          icon: '⚔', verse: 'Et l\'épée de l\'Esprit, qui est la parole de Dieu. — Éph 6:17', stage: 5 },
];

// Étapes de maturité spirituelle
export const STAGES = [
  {
    id: 0, name: 'Nouveau-né dans la foi', icon: '🕊', graceNeeded: 100,
    desc: '« Désirez, comme des enfants nouveau-nés, le lait spirituel et pur, afin que par lui vous croissiez. » — 1 Pierre 2:2',
    color: 0xbfd9f2,
  },
  {
    id: 1, name: 'Enfant de la foi', icon: '🌱', graceNeeded: 220,
    desc: '« Je vous ai écrit, petits enfants, parce que vous avez connu le Père. » — 1 Jean 2:13',
    color: 0x9fe0a8,
  },
  {
    id: 2, name: 'Serviteur fidèle', icon: '🤝', graceNeeded: 380,
    desc: '« C\'est bien, bon et fidèle serviteur ; tu as été fidèle en peu de chose, je te confierai beaucoup. » — Matthieu 25:21',
    color: 0xe8c454,
  },
  {
    id: 3, name: 'Adulte dans la foi', icon: '🗻', graceNeeded: 580,
    desc: '« La nourriture solide est pour les hommes faits, pour ceux dont le jugement est exercé. » — Hébreux 5:14',
    color: 0xd98e5f,
  },
  {
    id: 4, name: 'Père spirituel', icon: '✝', graceNeeded: 800,
    desc: '« Allez, faites de toutes les nations des disciples. » — Matthieu 28:19',
    color: 0xf2ead7,
  },
  {
    id: 5, name: 'Disciple accompli', icon: '👑', graceNeeded: Infinity,
    desc: '« J\'ai combattu le bon combat, j\'ai achevé la course, j\'ai gardé la foi. » — 2 Timothée 4:7',
    color: 0xffffff,
  },
];

// Districts de Théopolis
export const DISTRICTS = {
  PORT:    { name: 'Le Vieux Port',        color: '#4a6a8a' },
  JARDINS: { name: 'Les Jardins',          color: '#5a8a5a' },
  MARCHE:  { name: 'Le Grand Marché',      color: '#a8823a' },
  TEMPLE:  { name: 'La Colline du Temple', color: '#b0a890' },
  VILLE:   { name: 'Les Quartiers',        color: '#7a7a8a' },
};

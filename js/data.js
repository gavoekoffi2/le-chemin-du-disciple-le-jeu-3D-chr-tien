/* ============================================================
   LA VOIE — L'Éveil du Disciple
   Données du jeu : étapes, fruits, armure, PNJ, quêtes, versets
   ============================================================ */
window.GAME = window.GAME || {};
GAME.DATA = {};

/* ---------- Les 5 étapes de la maturité ---------- */
GAME.DATA.stages = [
  {
    id: 'nouveau-ne', icon: '🌱', name: 'Nouveau-né dans la foi',
    desc: "Tu viens de rencontrer le Christ. Tout est nouveau : apprends à marcher, à écouter, à recevoir.",
    verse: "« Désirez, comme des enfants nouveau-nés, le lait spirituel et pur. » — 1 Pierre 2:2"
  },
  {
    id: 'enfant', icon: '🌿', name: 'Enfant de Dieu',
    desc: "Tu connais ton Père. Il est temps d'apprendre à aimer concrètement ceux qui t'entourent.",
    verse: "« Voyez quel amour le Père nous a témoigné, pour que nous soyons appelés enfants de Dieu ! » — 1 Jean 3:1"
  },
  {
    id: 'jeune', icon: '🌾', name: 'Jeune dans la foi',
    desc: "Tu es fort, la Parole demeure en toi. Apprends à vaincre le malin et à persévérer.",
    verse: "« Je vous ai écrit, jeunes gens, parce que vous êtes forts, et que vous avez vaincu le malin. » — 1 Jean 2:14"
  },
  {
    id: 'adulte', icon: '🌳', name: 'Adulte dans la foi',
    desc: "Ta foi porte du fruit qui demeure : gère fidèlement ce qui t'est confié, pardonne, enseigne.",
    verse: "« Que le Christ habite dans vos cœurs par la foi ; soyez enracinés et fondés dans l'amour. » — Éphésiens 3:17"
  },
  {
    id: 'pere', icon: '✨', name: 'Père spirituel — Faiseur de disciples',
    desc: "La maturité n'est pas un sommet mais un débordement : forme à ton tour des disciples.",
    verse: "« Allez, faites de toutes les nations des disciples. » — Matthieu 28:19"
  }
];

/* ---------- Le fruit de l'Esprit (Galates 5:22-23) ---------- */
GAME.DATA.fruits = [
  { id: 'amour',    name: 'Amour',           icon: '❤' },
  { id: 'joie',     name: 'Joie',            icon: '☀' },
  { id: 'paix',     name: 'Paix',            icon: '🕊' },
  { id: 'patience', name: 'Patience',        icon: '⏳' },
  { id: 'bonte',    name: 'Bonté',           icon: '🤲' },
  { id: 'bienveillance', name: 'Bienveillance', icon: '🌸' },
  { id: 'fidelite', name: 'Fidélité',        icon: '⚓' },
  { id: 'douceur',  name: 'Douceur',         icon: '🍃' },
  { id: 'maitrise', name: 'Maîtrise de soi', icon: '🛡' }
];

/* ---------- L'armure de Dieu (Éphésiens 6:13-17) ---------- */
GAME.DATA.armor = [
  { id: 'ceinture',  icon: '🎗', name: 'Ceinture de la Vérité',
    desc: "« Ayez à vos reins la vérité pour ceinture. » Tiens ferme dans ce qui est vrai.",
    effet: "La vérité t'affermit : +5% de vitesse de marche." },
  { id: 'chaussures', icon: '👟', name: "Chaussures du zèle de l'Évangile",
    desc: "« Mettez pour chaussures à vos pieds le zèle que donne l'Évangile de paix. »",
    effet: "Prêt à annoncer la paix : +10% de vitesse de course." },
  { id: 'cuirasse',  icon: '🦺', name: 'Cuirasse de la Justice',
    desc: "« Revêtez la cuirasse de la justice. » Ton cœur est gardé.",
    effet: "Protège ton cœur dans les épreuves de tentation." },
  { id: 'bouclier',  icon: '🛡', name: 'Bouclier de la Foi',
    desc: "« Prenez par-dessus tout cela le bouclier de la foi, avec lequel vous pourrez éteindre tous les traits enflammés du malin. »",
    effet: "Permet de bloquer les flèches enflammées (défi du bouclier)." },
  { id: 'casque',    icon: '⛑', name: 'Casque du Salut',
    desc: "« Prenez aussi le casque du salut. » Tes pensées sont protégées.",
    effet: "L'assurance du salut : les doutes ne te ralentissent plus." },
  { id: 'epee',      icon: '⚔', name: "Épée de l'Esprit",
    desc: "« … et l'épée de l'Esprit, qui est la Parole de Dieu. » L'arme offensive du disciple.",
    effet: "La Parole en toi : bonus de temps dans les quiz bibliques." }
];

/* ---------- PNJ (mentors et personnages de quête) ---------- */
/* pos = [x, z] dans la ville. minStage / maxStage : visibilité (index d'étape). */
GAME.DATA.npcs = {
  etienne:   { name: 'Frère Étienne', portrait: '🧔', pos: [0, 30], color: 0x6b4f2a, mentor: true,
    idle: "Que la paix soit avec toi, disciple. Reviens me voir si tu cherches ton chemin." },
  marie:     { name: 'Sœur Marie', portrait: '👩', pos: [150, -138], color: 0x8a3a6b, mentor: true,
    idle: "Le parc est si paisible… C'est ici que j'ai appris à écouter Dieu." },
  david:     { name: 'Ancien David', portrait: '👴', pos: [218, -218], color: 0x3a5a8a, mentor: true, onHill: true,
    idle: "De cette colline, on voit toute la ville. Et Dieu, lui, voit tous les cœurs." },
  priscille: { name: 'Docteure Priscille', portrait: '👩‍🏫', pos: [72, 22], color: 0x2a6b5a, mentor: true,
    idle: "La bibliothèque est ouverte à tous ceux qui ont faim de la Parole." },
  jean:      { name: 'Apôtre Jean', portrait: '🧙', pos: [-14, 30], color: 0xd8d8e8, mentor: true, minStage: 4,
    idle: "Petits enfants, aimez-vous les uns les autres." },

  epicier:   { name: 'Samuel l\'épicier', portrait: '🧑‍🌾', pos: [-72, 26], color: 0x7a6b2a,
    idle: "Bienvenue au marché de Théopolis ! Huile, vin, pain frais…" },
  blesse:    { name: 'L\'homme blessé', portrait: '🤕', pos: [-146, 108], color: 0x777777, hidden: true },
  aubergiste:{ name: 'Rachel l\'aubergiste', portrait: '👩‍🍳', pos: [-72, 96], color: 0x9a4a2a,
    idle: "L'Auberge de la Colombe accueille tous les voyageurs." },
  leo:       { name: 'Léo', portrait: '🧒', pos: [186, 186], color: 0x4a7a9a, hidden: true },
  pereleo:   { name: 'Monsieur Elias', portrait: '👨‍🦳', pos: [72, 174], color: 0x555577,
    idle: "Mon fils Léo est parti depuis des semaines… Je scrute la rue chaque soir." },
  voisin1:   { name: 'Marc', portrait: '😠', pos: [-150, -140], color: 0x8a5a3a, minStage: 3,
    idle: "Ne me parle pas de mon voisin Paul !" },
  voisin2:   { name: 'Paul', portrait: '😔', pos: [-150, -166], color: 0x3a8a5a, minStage: 3,
    idle: "Marc et moi étions amis, autrefois…" },
  timothee:  { name: 'Timothée', portrait: '🧑', pos: [4, 150], color: 0x4a9a7a, minStage: 4,
    idle: "On m'a dit qu'ici, quelqu'un pourrait me parler de Dieu…" },

  /* Les 5 personnes à aider (parabole des talents) */
  aide1: { name: 'Mamie Ruth', portrait: '👵', pos: [-216, -80], color: 0x9a7a9a, minStage: 3,
    idle: "Mes vieux os n'arrivent plus à porter grand-chose…" },
  aide2: { name: 'Jonas le pêcheur', portrait: '🎣', pos: [216, 100], color: 0x3a6a9a, minStage: 3,
    idle: "La pêche a été mauvaise cette semaine." },
  aide3: { name: 'Déborah', portrait: '👩‍🔧', pos: [-40, -216], color: 0x6a3a9a, minStage: 3,
    idle: "Cette lampe cassée me désole." },
  aide4: { name: 'Petit Noé', portrait: '👦', pos: [140, 60], color: 0x9a3a3a, minStage: 3,
    idle: "J'ai perdu mon ballon… snif." },
  aide5: { name: 'Vieux Siméon', portrait: '🧓', pos: [-100, 216], color: 0x4a4a6a, minStage: 3,
    idle: "Personne ne vient plus me parler, tu sais." },

  /* Les 3 chercheurs de Dieu (étape 5) */
  cherch1: { name: 'Anna', portrait: '👧', pos: [-180, 40], color: 0xaa6a8a, minStage: 4,
    idle: "Je me demande souvent s'il y a plus que tout ça…" },
  cherch2: { name: 'Karim', portrait: '👨', pos: [100, -60], color: 0x6a8aaa, minStage: 4,
    idle: "J'ai tout essayé, mais ce vide en moi ne part pas." },
  cherch3: { name: 'Sofia', portrait: '👩‍🦰', pos: [30, -180], color: 0xaa8a4a, minStage: 4,
    idle: "Quelqu'un m'a parlé d'un Dieu qui aime. Ça existe vraiment ?" }
};

/* ---------- Versets cachés (parchemins à collecter) ---------- */
GAME.DATA.hiddenVerses = [
  { ref: 'Psaume 119:105', text: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.", pos: [40, 90] },
  { ref: 'Jean 3:16', text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique…", pos: [-200, -200] },
  { ref: 'Philippiens 4:13', text: "Je puis tout par celui qui me fortifie.", pos: [216, -100] },
  { ref: 'Proverbes 3:5', text: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.", pos: [-120, 216] },
  { ref: 'Ésaïe 40:31', text: "Ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles.", pos: [190, -190] },
  { ref: 'Matthieu 5:14', text: "Vous êtes la lumière du monde. Une ville située sur une montagne ne peut être cachée.", pos: [250, -250] },
  { ref: 'Romains 8:28', text: "Toutes choses concourent au bien de ceux qui aiment Dieu.", pos: [-250, 100] },
  { ref: 'Psaume 23:1', text: "L'Éternel est mon berger : je ne manquerai de rien.", pos: [120, 250] },
  { ref: 'Josué 1:9', text: "Fortifie-toi et prends courage. Ne t'effraie point, car l'Éternel ton Dieu est avec toi.", pos: [-60, -120] },
  { ref: 'Galates 5:22', text: "Le fruit de l'Esprit, c'est l'amour, la joie, la paix, la patience, la bonté…", pos: [0, -250] }
];

/* ---------- Quiz biblique ---------- */
GAME.DATA.quiz = [
  { q: "Combien de brebis le berger laisse-t-il pour chercher celle qui est perdue ?",
    opts: ["99", "12", "70", "40"], a: 0, ref: "Luc 15:4" },
  { q: "Dans la parabole du semeur, que représente la semence ?",
    opts: ["La Parole de Dieu", "L'argent", "Les bonnes œuvres", "La foi des anciens"], a: 0, ref: "Luc 8:11" },
  { q: "Qui s'est arrêté pour aider l'homme blessé sur la route de Jéricho ?",
    opts: ["Un Samaritain", "Un prêtre", "Un lévite", "Un soldat romain"], a: 0, ref: "Luc 10:33" },
  { q: "Combien de fois faut-il pardonner à son frère, selon Jésus ?",
    opts: ["70 fois 7 fois", "7 fois", "3 fois", "12 fois"], a: 0, ref: "Matthieu 18:22" },
  { q: "Qu'a fait le père quand le fils prodigue est revenu ?",
    opts: ["Il a couru l'embrasser", "Il l'a puni", "Il a refusé de le voir", "Il l'a fait serviteur"], a: 0, ref: "Luc 15:20" },
  { q: "Quelle pièce de l'armure de Dieu éteint les traits enflammés du malin ?",
    opts: ["Le bouclier de la foi", "Le casque du salut", "La ceinture de la vérité", "L'épée de l'Esprit"], a: 0, ref: "Éphésiens 6:16" },
  { q: "Qu'est-ce que « l'épée de l'Esprit » ?",
    opts: ["La Parole de Dieu", "La prière", "Le jeûne", "La louange"], a: 0, ref: "Éphésiens 6:17" },
  { q: "Que fit le serviteur qui avait reçu un seul talent ?",
    opts: ["Il l'enterra", "Il le doubla", "Il le donna aux pauvres", "Il le perdit au jeu"], a: 0, ref: "Matthieu 25:18" },
  { q: "Le fruit de l'Esprit compte combien de qualités (Galates 5) ?",
    opts: ["9", "7", "12", "3"], a: 0, ref: "Galates 5:22-23" },
  { q: "Sur quoi le sage bâtit-il sa maison ?",
    opts: ["Sur le roc", "Sur le sable", "Sur une colline", "Près du fleuve"], a: 0, ref: "Matthieu 7:24" },
  { q: "« Je suis le cep, vous êtes… »",
    opts: ["les sarments", "les racines", "les fruits", "les feuilles"], a: 0, ref: "Jean 15:5" },
  { q: "Que dit Jésus être, dans Jean 14:6 ?",
    opts: ["Le chemin, la vérité et la vie", "Le roi des rois", "Le bon berger", "La porte des brebis"], a: 0, ref: "Jean 14:6" }
];

/* ---------- Versets à reconstituer (mémorisation) ---------- */
GAME.DATA.memoryVerses = [
  { ref: 'Psaume 119:11', words: ["Je", "serre", "ta", "parole", "dans", "mon", "cœur"] },
  { ref: 'Jean 8:32', words: ["Vous", "connaîtrez", "la", "vérité", "et", "la", "vérité", "vous", "affranchira"] },
  { ref: 'Matthieu 6:33', words: ["Cherchez", "premièrement", "le", "royaume", "et", "la", "justice", "de", "Dieu"] },
  { ref: 'Philippiens 4:4', words: ["Réjouissez-vous", "toujours", "dans", "le", "Seigneur"] }
];

/* ============================================================
   LES QUÊTES — la trame principale (15 quêtes, 5 étapes)
   Types d'étapes : talk / goto / collect / minigame
   ============================================================ */
GAME.DATA.quests = [

  /* ================== ÉTAPE 1 : NOUVEAU-NÉ ================== */
  {
    id: 'q01', stage: 0, title: "Le premier pas",
    desc: "Tout chemin commence par un pas. Rejoins Frère Étienne devant l'église de la Grâce.",
    steps: [
      { type: 'goto', pos: [0, 44], radius: 10, objective: "Rejoins le parvis de l'église de la Grâce (suis le marqueur doré)." },
      { type: 'talk', npc: 'etienne', objective: "Parle à Frère Étienne (appuie sur E).",
        lines: [
          { s: 'Frère Étienne', t: "Te voilà enfin ! Bienvenue à Théopolis, ami. J'ai su qu'un cœur nouveau venait de s'ouvrir à la lumière… c'est donc toi." },
          { s: 'Frère Étienne', t: "Tu es comme un nouveau-né dans la foi : tout est à apprendre, et c'est une joie. Cette ville sera ton école, et ses habitants tes frères." },
          { s: 'Frère Étienne', t: "Marcher avec Dieu, cela s'apprend pas à pas. Je serai ton premier guide. Quand tu seras prêt, d'autres mentors t'attendront ailleurs dans la ville." },
          { s: 'Frère Étienne', t: "Commençons simplement. Va boire à la fontaine de la place — et souviens-toi : « Celui qui boira de l'eau que je lui donnerai n'aura jamais soif. »" }
        ] },
      { type: 'goto', pos: [0, 96], radius: 7, objective: "Va à la fontaine de la place centrale." },
      { type: 'talk', npc: 'etienne', objective: "Retourne voir Frère Étienne.",
        lines: [
          { s: 'Frère Étienne', t: "Bien ! Tu sais maintenant te déplacer dans Théopolis. Ouvre ton Journal du Disciple (touche J) : tu y verras grandir le fruit de l'Esprit en toi." },
          { s: 'Frère Étienne', t: "Chaque acte d'amour, de patience ou de fidélité fera mûrir ce fruit. C'est ainsi que se mesure la vraie croissance — pas en force, mais en caractère." }
        ] }
    ],
    rewards: { fruits: { joie: 8, paix: 5 } }
  },

  {
    id: 'q02', stage: 0, title: "La brebis perdue",
    parable: "Luc 15:4-7",
    desc: "Trois brebis du berger Ézéchias se sont échappées dans le parc. Ramène-les en les touchant.",
    steps: [
      { type: 'talk', npc: 'etienne', objective: "Parle à Frère Étienne.",
        lines: [
          { s: 'Frère Étienne', t: "Le berger Ézéchias a un souci : trois de ses brebis se sont enfuies vers le grand parc, au nord-est de la ville." },
          { s: 'Frère Étienne', t: "Jésus disait : « Quel homme d'entre vous, s'il a cent brebis et qu'il en perde une, ne laisse les quatre-vingt-dix-neuf autres pour aller après celle qui est perdue ? »" },
          { s: 'Frère Étienne', t: "Va chercher ces brebis, une par une. Tu comprendras ce que ressent le Père pour chacun de nous. Approche-toi doucement et touche-les (E)." }
        ] },
      { type: 'collect', tag: 'sheep', count: 3, spawn: 'sheep',
        objective: "Retrouve les 3 brebis perdues dans le parc (approche-toi et appuie sur E)." },
      { type: 'talk', npc: 'etienne', objective: "Annonce la bonne nouvelle à Frère Étienne.",
        lines: [
          { s: 'Frère Étienne', t: "Les trois brebis sont rentrées ! « Il y aura plus de joie dans le ciel pour un seul pécheur qui se repent, que pour quatre-vingt-dix-neuf justes. »" },
          { s: 'Frère Étienne', t: "Tu as cherché ce qui était perdu : c'est le cœur même de Dieu que tu viens d'imiter. Reçois ta première pièce d'armure : la Ceinture de la Vérité." }
        ] }
    ],
    rewards: { fruits: { amour: 10, patience: 6 }, armor: 'ceinture' }
  },

  {
    id: 'q03', stage: 0, title: "Le Semeur",
    parable: "Luc 8:5-15",
    desc: "Au champ du sud-ouest, apprends la parabole du Semeur en semant toi-même le bon grain.",
    steps: [
      { type: 'talk', npc: 'etienne', objective: "Parle à Frère Étienne.",
        lines: [
          { s: 'Frère Étienne', t: "Dernière leçon de cette saison, petit arbre : la parabole du Semeur. Un champ t'attend au sud-ouest de la ville." },
          { s: 'Frère Étienne', t: "« Un semeur sortit pour semer. Une partie tomba le long du chemin… une autre sur le roc… une autre parmi les épines… une autre dans la bonne terre. »" },
          { s: 'Frère Étienne', t: "Va au champ et sème dans la bonne terre — elle brille d'une lueur dorée. Évite le chemin, les rochers et les épines. Tu as peu de temps : la Parole se sème avec zèle !" }
        ] },
      { type: 'goto', pos: [-216, 216], radius: 14, objective: "Rends-toi au champ du Semeur, au sud-ouest de Théopolis." },
      { type: 'minigame', game: 'sower', objective: "Sème 10 graines dans la bonne terre (parcelles dorées) avant la fin du temps." },
      { type: 'talk', npc: 'etienne', objective: "Retourne voir Frère Étienne à l'église.",
        lines: [
          { s: 'Frère Étienne', t: "Tu as semé dans la bonne terre ! Retiens ceci : la bonne terre, « ce sont ceux qui, ayant entendu la Parole avec un cœur honnête et bon, la retiennent et portent du fruit avec persévérance »." },
          { s: 'Frère Étienne', t: "Ton cœur est cette terre. Tu n'es plus un nouveau-né, mon ami. Il est temps pour toi de rencontrer Sœur Marie, au parc. Elle t'apprendra à aimer comme un enfant de Dieu." }
        ] }
    ],
    rewards: { fruits: { fidelite: 8, joie: 6 } }
  },

  /* ================== ÉTAPE 2 : ENFANT DE DIEU ================== */
  {
    id: 'q04', stage: 1, title: "Le Bon Samaritain",
    parable: "Luc 10:25-37",
    desc: "Un homme a été agressé au bord de la route. Deviens son prochain.",
    steps: [
      { type: 'talk', npc: 'marie', objective: "Rencontre Sœur Marie au parc, au nord-est.",
        lines: [
          { s: 'Sœur Marie', t: "Te voilà ! Étienne m'a parlé de toi. Tu sais marcher — maintenant, apprends à t'arrêter. C'est en s'arrêtant pour les autres qu'on devient un enfant de Dieu." },
          { s: 'Sœur Marie', t: "On m'a signalé qu'un homme a été agressé sur la route du sud-ouest, près de l'auberge. Un prêtre est passé sans s'arrêter. Un notable aussi." },
          { s: 'Sœur Marie', t: "« Va, et toi, fais de même » : c'est toi qui seras son prochain. Il aura besoin d'huile et de vin pour ses plaies — Samuel l'épicier en vend au marché." }
        ] },
      { type: 'talk', npc: 'blesse', spawn: 'blesse', objective: "Trouve l'homme blessé au bord de la route, au sud-ouest (marqueur).",
        lines: [
          { s: "L'homme blessé", t: "… De l'aide… s'il vous plaît… Des brigands m'ont tout pris et m'ont laissé là… Personne ne s'arrête…" },
          { s: 'Toi', t: "Tiens bon, ami. Je vais chercher de l'huile et du vin au marché, et je reviens te chercher. Je ne t'abandonne pas." }
        ] },
      { type: 'talk', npc: 'epicier', objective: "Achète de l'huile et du vin chez Samuel, au marché.",
        lines: [
          { s: "Samuel l'épicier", t: "De l'huile et du vin pour soigner un blessé ? Prends, c'est la maison qui offre — on ne fait pas payer la miséricorde." },
          { s: "Samuel l'épicier", t: "Tu fais ce que le Samaritain a fait. Cours vite, il t'attend !" }
        ], flag: 'hasOilWine' },
      { type: 'talk', npc: 'blesse', objective: "Retourne soigner l'homme blessé.",
        lines: [
          { s: 'Toi', t: "Me voilà ! Laisse-moi verser l'huile et le vin sur tes plaies… Doucement. Maintenant, appuie-toi sur moi : l'Auberge de la Colombe n'est pas loin." },
          { s: "L'homme blessé", t: "Pourquoi… pourquoi t'arrêtes-tu pour moi ? Tu ne me connais même pas…" },
          { s: 'Toi', t: "Parce que quelqu'un s'est arrêté pour moi un jour. Viens, je te porte." }
        ] },
      { type: 'talk', npc: 'aubergiste', objective: "Conduis le blessé à l'Auberge de la Colombe.",
        lines: [
          { s: "Rachel l'aubergiste", t: "Mon Dieu ! Posez-le ici, vite. Je vais m'occuper de lui, ne t'inquiète pas — il est entre de bonnes mains." },
          { s: "Rachel l'aubergiste", t: "Tu sais, beaucoup passent devant l'auberge. Peu y entrent en portant quelqu'un d'autre. Ce que tu as fait là, c'est l'Évangile en actes." }
        ] },
      { type: 'talk', npc: 'marie', objective: "Retourne voir Sœur Marie au parc.",
        lines: [
          { s: 'Sœur Marie', t: "J'ai su ce que tu as fait. « Lequel de ces trois te semble avoir été le prochain de celui qui était tombé au milieu des brigands ? » — Celui qui a exercé la miséricorde." },
          { s: 'Sœur Marie', t: "Reçois les Chaussures du zèle de l'Évangile de paix : que tes pieds soient toujours prompts à courir vers ceux qui souffrent." }
        ] }
    ],
    rewards: { fruits: { bonte: 12, amour: 8, bienveillance: 6 }, armor: 'chaussures' }
  },

  {
    id: 'q05', stage: 1, title: "La lumière du monde",
    parable: "Matthieu 5:14-16",
    desc: "Cinq lampadaires de la ville sont éteints. Rallume-les : que ta lumière luise devant les hommes.",
    steps: [
      { type: 'talk', npc: 'marie', objective: "Parle à Sœur Marie.",
        lines: [
          { s: 'Sœur Marie', t: "« Vous êtes la lumière du monde… On n'allume pas une lampe pour la mettre sous le boisseau. » Ce soir, Théopolis va comprendre ce verset !" },
          { s: 'Sœur Marie', t: "Cinq lampadaires sont éteints dans les rues. Va les rallumer un à un (E). Regarde bien ta minicarte : ils y brillent en orange." }
        ] },
      { type: 'collect', tag: 'lamp', count: 5, spawn: 'lamps', keep: true,
        objective: "Rallume les 5 lampadaires éteints (marqués en orange sur la carte)." },
      { type: 'talk', npc: 'marie', objective: "Retourne voir Sœur Marie.",
        lines: [
          { s: 'Sœur Marie', t: "Regarde la ville : elle brille ! « Que votre lumière luise ainsi devant les hommes, afin qu'ils voient vos bonnes œuvres, et qu'ils glorifient votre Père qui est dans les cieux. »" },
          { s: 'Sœur Marie', t: "Chaque lampe que tu as rallumée, c'est une image de ce que Dieu veut faire de toi dans cette ville." }
        ] }
    ],
    rewards: { fruits: { joie: 10, fidelite: 6 } }
  },

  {
    id: 'q06', stage: 1, title: "La Parole dans le cœur",
    parable: "Psaume 119:11",
    desc: "Sœur Marie t'apprend à mémoriser la Parole : reconstitue les versets mélangés.",
    steps: [
      { type: 'talk', npc: 'marie', objective: "Parle à Sœur Marie.",
        lines: [
          { s: 'Sœur Marie', t: "Un enfant de Dieu apprend à connaître la voix de son Père. « Je serre ta parole dans mon cœur, afin de ne pas pécher contre toi. »" },
          { s: 'Sœur Marie', t: "Voici mon défi : je vais te donner des versets aux mots mélangés. Remets-les dans l'ordre. Prêt ? La Parole se grave en la manipulant !" }
        ] },
      { type: 'minigame', game: 'verses', objective: "Reconstitue les 3 versets mélangés." },
      { type: 'talk', npc: 'marie', objective: "Parle à Sœur Marie.",
        lines: [
          { s: 'Sœur Marie', t: "Magnifique ! La Parole habite en toi. Tu n'es plus un simple enfant : il est temps de devenir fort." },
          { s: 'Sœur Marie', t: "Monte à la Colline de la Prière, tout au nord-est, au-dessus du parc. L'Ancien David t'y attend. Il a formé des générations de disciples — et il ne fait pas de cadeaux !" }
        ] }
    ],
    rewards: { fruits: { fidelite: 10, maitrise: 5 } }
  },

  /* ================== ÉTAPE 3 : JEUNE DANS LA FOI ================== */
  {
    id: 'q07', stage: 2, title: "Les traits enflammés",
    parable: "Éphésiens 6:16",
    desc: "L'Ancien David t'entraîne au combat spirituel : bloque les traits enflammés avec le bouclier de la foi.",
    steps: [
      { type: 'talk', npc: 'david', objective: "Monte à la Colline de la Prière et parle à l'Ancien David.",
        lines: [
          { s: 'Ancien David', t: "Ainsi te voilà. Étienne t'a appris à marcher, Marie t'a appris à aimer. Moi, je vais t'apprendre à tenir debout quand tout s'effondre." },
          { s: 'Ancien David', t: "Le disciple qui grandit devient une cible. Doutes, accusations, tentations : les traits enflammés du malin. Une seule défense : « le bouclier de la foi »." },
          { s: 'Ancien David', t: "Prends ce bouclier — il est à toi désormais. Et maintenant, en garde ! Des traits vont pleuvoir sur cette colline. Déplace-toi et intercepte-les : chaque trait bloqué fortifie ta foi. En bloquer 12 suffira." }
        ], armor: 'bouclier' },
      { type: 'minigame', game: 'shield', objective: "Bloque 12 traits enflammés avec ton bouclier (place-toi sur leur point d'impact)." },
      { type: 'talk', npc: 'david', objective: "Parle à l'Ancien David.",
        lines: [
          { s: 'Ancien David', t: "Bien combattu ! Retiens : la foi n'est pas un sentiment, c'est un bouclier qu'on LÈVE. On choisit de croire la promesse plutôt que la peur." },
          { s: 'Ancien David', t: "Reçois aussi la Cuirasse de la Justice. Ton cœur est précieux : garde-le plus que toute autre chose." }
        ] }
    ],
    rewards: { fruits: { maitrise: 12, paix: 8 }, armor: 'cuirasse' }
  },

  {
    id: 'q08', stage: 2, title: "Le fils prodigue",
    parable: "Luc 15:11-32",
    desc: "Léo, le fils de Monsieur Elias, a fui la maison. Retrouve-le et aide-le à revenir vers son père.",
    steps: [
      { type: 'talk', npc: 'david', objective: "Parle à l'Ancien David.",
        lines: [
          { s: 'Ancien David', t: "En ville, un père a le cœur brisé : son fils Léo est parti en claquant la porte, avec ses économies. Cela te rappelle une histoire, n'est-ce pas ?" },
          { s: 'Ancien David', t: "Va d'abord voir le père, Monsieur Elias, au quartier sud. Puis retrouve le garçon — on dit qu'il traîne du côté des entrepôts, au sud-est. Ramène-le. Pas de force : la douceur seule ramène les cœurs." }
        ] },
      { type: 'talk', npc: 'pereleo', objective: "Parle à Monsieur Elias, le père de Léo (quartier sud).",
        lines: [
          { s: 'Monsieur Elias', t: "Léo… il a pris son héritage et il est parti. Il criait que je ne comprenais rien, que la vraie vie était ailleurs…" },
          { s: 'Monsieur Elias', t: "Dis-lui… dis-lui seulement que la porte n'a jamais été fermée. Que je laisse la lampe allumée chaque nuit. Qu'il n'a rien à rembourser." }
        ] },
      { type: 'talk', npc: 'leo', spawn: 'leo', objective: "Retrouve Léo près des entrepôts, au sud-est.",
        choice: {
          prompt: "Léo est là, assis contre un mur, le regard vide. « Quoi ? Mon père t'envoie ? J'ai tout dépensé. Tout. Il ne voudra plus jamais de moi. »",
          options: [
            { t: "« Ton père laisse la lampe allumée chaque nuit. Il n'attend qu'une chose : te serrer dans ses bras. »", good: true,
              reply: "« La lampe… allumée ? Encore ?… Tu sais quoi, même être serviteur chez lui vaudrait mieux qu'ici. Je… je crois que je veux rentrer. Tu m'accompagnes ? »" },
            { t: "« Tu as fait n'importe quoi, mais bon, tout le monde fait des erreurs. »", good: false,
              reply: "« Merci de me rappeler que j'ai tout raté… » Léo se ferme. Essaie encore — avec le cœur du père, pas un jugement. « …Attends. Redis-moi juste : il pense encore à moi ? » (Il n'attend qu'un mot de grâce.)" }
          ],
          after: "« Il laisse la lampe allumée pour toi, Léo. Chaque nuit. » — Léo se lève, des larmes aux yeux : « Alors rentrons. »"
        } },
      { type: 'talk', npc: 'pereleo', objective: "Ramène Léo à son père.",
        lines: [
          { s: 'Monsieur Elias', t: "LÉO ! Mon fils ! *Il court, le serre dans ses bras, pleure sans retenue.* Tu étais perdu, et te voilà retrouvé !" },
          { s: 'Léo', t: "Papa, j'ai péché contre le ciel et contre toi, je ne mérite plus d'être…" },
          { s: 'Monsieur Elias', t: "Chut. Ce soir, c'est fête à la maison. — Et toi, l'ami… merci. Tu as porté le cœur du Père jusqu'à mon fils." }
        ] },
      { type: 'talk', npc: 'david', objective: "Retourne voir l'Ancien David sur la colline.",
        lines: [
          { s: 'Ancien David', t: "« Son père le vit et fut ému de compassion ; il courut se jeter à son cou et le couvrit de baisers. » Tu viens de voir ce verset prendre chair." },
          { s: 'Ancien David', t: "Dieu court, disciple. C'est le seul endroit des Écritures où l'on voit le Père courir — et c'est vers un enfant perdu." }
        ] }
    ],
    rewards: { fruits: { douceur: 12, amour: 8, bienveillance: 8 } }
  },

  {
    id: 'q09', stage: 2, title: "La course de la persévérance",
    parable: "Hébreux 12:1",
    desc: "« Courons avec persévérance l'épreuve qui nous est proposée. » Passe tous les anneaux avant la fin du chrono.",
    steps: [
      { type: 'talk', npc: 'david', objective: "Parle à l'Ancien David.",
        lines: [
          { s: 'Ancien David', t: "Dernière leçon de ma part : la persévérance. La foi n'est pas un sprint d'émotion, c'est une course de fond. « Courons avec persévérance l'épreuve qui nous est proposée. »" },
          { s: 'Ancien David', t: "J'ai fait installer un parcours d'anneaux dorés à travers la ville, en partant du pied de la colline. Passe-les TOUS avant la fin du temps. Rate, recommence — c'est ça, la persévérance." }
        ] },
      { type: 'minigame', game: 'race', objective: "Franchis tous les anneaux dorés avant la fin du chrono (cours avec Maj !)." },
      { type: 'talk', npc: 'david', objective: "Parle à l'Ancien David.",
        lines: [
          { s: 'Ancien David', t: "Tu as couru jusqu'au bout ! « J'ai combattu le bon combat, j'ai achevé la course, j'ai gardé la foi. » Puisses-tu dire ces mots toute ta vie." },
          { s: 'Ancien David', t: "Je n'ai plus rien à t'apprendre que tu ne doives vivre. Va voir la Docteure Priscille à la bibliothèque, près de la place. L'âge adulte de la foi t'attend. (Tu pourras revenir courir ici quand tu veux : bats ton record !)" }
        ] }
    ],
    rewards: { fruits: { patience: 12, maitrise: 8 } }
  },

  /* ================== ÉTAPE 4 : ADULTE DANS LA FOI ================== */
  {
    id: 'q10', stage: 3, title: "Les talents",
    parable: "Matthieu 25:14-30",
    desc: "Cinq habitants ont besoin d'aide. Fais fructifier ce qui t'a été confié.",
    steps: [
      { type: 'talk', npc: 'priscille', objective: "Rencontre la Docteure Priscille à la bibliothèque.",
        lines: [
          { s: 'Docteure Priscille', t: "Bienvenue, disciple. David m'a dit que tu tenais bon dans la course. L'adulte dans la foi ne se demande plus « que puis-je recevoir ? » mais « que puis-je donner ? »." },
          { s: 'Docteure Priscille', t: "Souviens-toi des talents : le maître confia ses biens à ses serviteurs, « à chacun selon sa capacité ». Deux les firent fructifier. Un les enterra." },
          { s: 'Docteure Priscille', t: "Ton talent aujourd'hui, c'est du temps et deux mains. Cinq habitants de Théopolis ont besoin d'aide — ils sont marqués sur ta carte. Va, et ne reviens pas avant d'avoir servi les cinq." }
        ] },
      { type: 'collect', tag: 'help', count: 5, spawn: 'helpers', keep: true,
        objective: "Aide les 5 habitants marqués sur la carte (parle-leur et rends-leur service)." },
      { type: 'talk', npc: 'priscille', objective: "Retourne voir la Docteure Priscille.",
        lines: [
          { s: 'Docteure Priscille', t: "Cinq personnes servies ! « C'est bien, bon et fidèle serviteur ; tu as été fidèle en peu de chose, je te confierai beaucoup. »" },
          { s: 'Docteure Priscille', t: "Reçois le Casque du Salut : que la certitude d'appartenir à Dieu protège tes pensées quand tu sers sans être vu ni remercié." }
        ] }
    ],
    rewards: { fruits: { bonte: 10, fidelite: 10, bienveillance: 6 }, armor: 'casque' }
  },

  {
    id: 'q11', stage: 3, title: "Soixante-dix fois sept fois",
    parable: "Matthieu 18:21-22",
    desc: "Marc et Paul, deux voisins du quartier nord-ouest, sont fâchés depuis des années. Réconcilie-les.",
    steps: [
      { type: 'talk', npc: 'priscille', objective: "Parle à la Docteure Priscille.",
        lines: [
          { s: 'Docteure Priscille', t: "Au nord-ouest vivent Marc et Paul. Amis d'enfance, voisins… et fâchés à mort depuis une histoire de clôture. Des années de silence." },
          { s: 'Docteure Priscille', t: "Pierre demanda : « Combien de fois pardonnerai-je ? Jusqu'à sept fois ? » Jésus répondit : « Jusqu'à soixante-dix fois sept fois. » Va. Sois artisan de paix — écoute chacun, puis ramène-les l'un vers l'autre." }
        ] },
      { type: 'talk', npc: 'voisin1', objective: "Écoute Marc (quartier nord-ouest).",
        choice: {
          prompt: "Marc croise les bras : « Paul a construit sa clôture SUR mon terrain. Et il n'a jamais dit pardon. Pourquoi je ferais le premier pas, hein ? »",
          options: [
            { t: "« Parce que le premier pas n'est pas une défaite. C'est ce que Dieu a fait pour nous. »", good: true,
              reply: "« … Tu parles comme mon grand-père. Bon. S'il vient, je l'écouterai. Mais qu'il vienne. »" },
            { t: "« T'as raison, c'est à lui de s'excuser d'abord. »", good: false,
              reply: "« Exactement ! » — Tu réalises que tu viens d'épaissir le mur au lieu de l'abattre. Reprends : le pardon ne cherche pas qui a raison… « …ou alors, peut-être que quelqu'un doit faire le premier pas. Peut-être moi », souffle Marc." }
          ],
          after: "Marc soupire : « S'il vient, je l'écouterai. »"
        } },
      { type: 'talk', npc: 'voisin2', objective: "Parle à Paul, de l'autre côté de la rue.",
        lines: [
          { s: 'Paul', t: "Marc ? Il t'a parlé de la clôture, hein… La vérité, c'est que cette clôture, je l'ai mal placée. Je le sais depuis le début. Mais l'orgueil, tu sais…" },
          { s: 'Paul', t: "Il accepterait de me voir ? Vraiment ? Alors dis-lui que j'arrive — et que je démonte cette clôture dès demain. Dix ans de silence pour trois mètres de bois, quel gâchis…" }
        ] },
      { type: 'talk', npc: 'voisin1', objective: "Retourne voir Marc pour la réconciliation.",
        lines: [
          { s: 'Marc', t: "Il a dit ça ? Qu'il la démonte ? … *Marc regarde longuement la maison d'en face.* Non. Dis-lui de la laisser, cette clôture. On la repeindra ensemble. Comme avant." },
          { s: 'Marc', t: "*Paul traverse la rue. Les deux hommes se regardent, puis s'étreignent maladroitement.* — Merci, l'ami. Tu as fait ce que dix ans n'avaient pas fait." }
        ] },
      { type: 'talk', npc: 'priscille', objective: "Rapporte la bonne nouvelle à Priscille.",
        lines: [
          { s: 'Docteure Priscille', t: "« Heureux les artisans de paix, car ils seront appelés fils de Dieu. » Tu viens de gagner ce titre-là, disciple." },
          { s: 'Docteure Priscille', t: "Le pardon est la plus adulte des forces. N'importe qui peut se venger ; il faut être grand pour pardonner." }
        ] }
    ],
    rewards: { fruits: { paix: 14, douceur: 8, patience: 6 } }
  },

  {
    id: 'q12', stage: 3, title: "L'Épée de l'Esprit",
    parable: "Éphésiens 6:17",
    desc: "L'examen de la Parole : réponds au grand quiz biblique de la Docteure Priscille.",
    steps: [
      { type: 'talk', npc: 'priscille', objective: "Parle à la Docteure Priscille.",
        lines: [
          { s: 'Docteure Priscille', t: "Voici ta dernière épreuve chez moi : le grand examen de la Parole. « L'épée de l'Esprit, c'est la Parole de Dieu » — encore faut-il savoir la dégainer." },
          { s: 'Docteure Priscille', t: "Huit questions. Réponds juste à six au moins. Jésus lui-même a répondu au tentateur par « Il est écrit » — trois fois. Montre-moi que tu sauras faire de même." }
        ] },
      { type: 'minigame', game: 'quiz', objective: "Réussis le grand quiz biblique (6 bonnes réponses sur 8 minimum)." },
      { type: 'talk', npc: 'priscille', objective: "Parle à la Docteure Priscille.",
        lines: [
          { s: 'Docteure Priscille', t: "Reçois l'Épée de l'Esprit, disciple. Ton armure est complète : vérité, justice, zèle, foi, salut, Parole. « Tenez donc ferme. »" },
          { s: 'Docteure Priscille', t: "Il ne te reste qu'un maître à rencontrer — le plus doux de tous. L'Apôtre Jean t'attend à l'église. Ce qu'il va te confier dépasse tout ce que tu as appris ici." }
        ] }
    ],
    rewards: { fruits: { fidelite: 10, maitrise: 8 }, armor: 'epee' }
  },

  /* ============ ÉTAPE 5 : PÈRE SPIRITUEL — FAISEUR DE DISCIPLES ============ */
  {
    id: 'q13', stage: 4, title: "La moisson est grande",
    parable: "Matthieu 9:37 · Matthieu 28:19",
    desc: "Trois habitants de Théopolis cherchent Dieu sans le savoir. Va vers eux.",
    steps: [
      { type: 'talk', npc: 'jean', objective: "Rencontre l'Apôtre Jean à l'église.",
        lines: [
          { s: 'Apôtre Jean', t: "Approche, mon enfant. J'ai suivi ton chemin depuis le premier jour — du nouveau-né au disciple revêtu de toute l'armure. Il te reste l'essentiel." },
          { s: 'Apôtre Jean', t: "La maturité chrétienne n'est pas un diplôme qu'on garde : c'est une source qui déborde. « La moisson est grande, mais il y a peu d'ouvriers. »" },
          { s: 'Apôtre Jean', t: "Trois personnes, dans cette ville, cherchent Dieu sans savoir Le nommer : Anna, Karim et Sofia. Va vers eux. N'apporte pas des arguments — apporte ce que tu as vécu." }
        ] },
      { type: 'collect', tag: 'seeker', count: 3, spawn: 'seekers', keep: true,
        objective: "Parle aux 3 chercheurs de Dieu : Anna, Karim et Sofia (marqués sur la carte)." },
      { type: 'talk', npc: 'jean', objective: "Retourne voir l'Apôtre Jean.",
        lines: [
          { s: 'Apôtre Jean', t: "Anna, Karim et Sofia sont venus à l'église ce matin. Trois cœurs ouverts, parce qu'un disciple a osé parler simplement de ce qu'il a vu et entendu." },
          { s: 'Apôtre Jean', t: "« Ce que nous avons vu et entendu, nous vous l'annonçons. » L'évangélisation n'est pas un talent, c'est un témoignage. Tu l'as compris." }
        ] }
    ],
    rewards: { fruits: { amour: 10, joie: 10 } }
  },

  {
    id: 'q14', stage: 4, title: "Forme un disciple",
    parable: "2 Timothée 2:2",
    desc: "Timothée, un jeune converti, a besoin d'un guide. Deviens pour lui ce que tes mentors furent pour toi.",
    steps: [
      { type: 'talk', npc: 'jean', objective: "Parle à l'Apôtre Jean.",
        lines: [
          { s: 'Apôtre Jean', t: "Un jeune homme nommé Timothée vient de donner sa vie au Christ. Il est comme tu étais au premier jour : émerveillé et perdu à la fois." },
          { s: 'Apôtre Jean', t: "« Ce que tu as entendu de moi, confie-le à des hommes fidèles, qui soient capables de l'enseigner aussi à d'autres. » C'est la chaîne des disciples — à ton tour d'en forger un maillon." },
          { s: 'Apôtre Jean', t: "Il t'attend au sud de la place. Enseigne-lui les trois leçons que tu as reçues : chercher ce qui est perdu, semer la Parole, tenir bon dans l'épreuve." }
        ] },
      { type: 'talk', npc: 'timothee', objective: "Rencontre Timothée, au sud de la place.",
        lines: [
          { s: 'Timothée', t: "C'est toi ? On m'a dit que tu avais commencé exactement comme moi… Je ne sais pas par où commencer. Tout est si nouveau." },
          { s: 'Toi', t: "Je connais ce vertige. Viens, marchons. Première leçon : Dieu cherche ce qui est perdu — c'est même par ça que tout commence. Allons au parc, je vais te montrer quelque chose." }
        ] },
      { type: 'goto', pos: [150, -138], radius: 12, follower: 'timothee',
        objective: "Conduis Timothée au parc (il te suit) et montre-lui où tout a commencé pour toi." },
      { type: 'talk', npc: 'timothee', objective: "Enseigne les trois leçons à Timothée.",
        choice: {
          prompt: "Timothée écoute, assis dans l'herbe : « Alors dis-moi… c'est quoi le plus important, pour commencer ? »",
          options: [
            { t: "« Rester aimé : tu es un enfant cherché et retrouvé. Le reste — la Parole, le combat — pousse sur cette racine-là. »", good: true,
              reply: "« Un enfant retrouvé… Alors je n'ai pas à mériter ma place. Je crois que je comprends. Tu seras mon mentor, pas vrai ? »" },
            { t: "« Apprends vite les règles : prière matin et soir, lecture quotidienne, et surtout ne rate aucun culte. »", good: false,
              reply: "Timothée pâlit : « Encore des règles ?… J'en viens, des règles. » — Tu te souviens de Frère Étienne : la croissance, pas la performance. Reprends avec le cœur… « …ou plutôt non, Timothée. Avant tout : tu es un enfant retrouvé. » Il sourit enfin." }
          ],
          after: "Timothée se lève, les yeux brillants : « Un enfant retrouvé. Je m'en souviendrai toute ma vie. »"
        } },
      { type: 'talk', npc: 'jean', objective: "Retourne voir l'Apôtre Jean.",
        lines: [
          { s: 'Apôtre Jean', t: "Timothée parle de toi comme tu parlais d'Étienne. Voilà : tu n'es plus seulement un disciple — tu es devenu un faiseur de disciples." },
          { s: 'Apôtre Jean', t: "Une dernière chose t'attend. Monte à la Colline de la Prière au coucher du soleil. Toute la ville sera là." }
        ] }
    ],
    rewards: { fruits: { patience: 10, bienveillance: 10, douceur: 6 } }
  },

  {
    id: 'q15', stage: 4, title: "La moisson — Célébration",
    parable: "Jean 15:16",
    desc: "Monte à la Colline de la Prière : Théopolis célèbre ce que Dieu a fait.",
    steps: [
      { type: 'goto', pos: [218, -218], radius: 12, objective: "Monte à la Colline de la Prière pour la célébration." },
      { type: 'talk', npc: 'david', objective: "Parle à l'Ancien David au sommet.",
        lines: [
          { s: 'Ancien David', t: "Regarde en bas, disciple. L'homme que tu as relevé sur la route. Léo et son père. Marc et Paul côte à côte. Anna, Karim, Sofia. Et le jeune Timothée, qui déjà parle de former quelqu'un." },
          { s: 'Ancien David', t: "« Je vous ai choisis afin que vous alliez, que vous portiez du fruit, et que votre fruit demeure. » Ton fruit demeure, et il se multiplie." },
          { s: 'Ancien David', t: "La maturité n'est pas la fin du chemin — il n'y a pas de fin au chemin. Mais désormais, tu ne marches plus seul : tu ouvres la route." }
        ] }
    ],
    rewards: { fruits: { joie: 15, amour: 15, paix: 10 } },
    final: true
  }
];

/* ---------- Textes de passage d'étape ---------- */
GAME.DATA.stageUpTexts = [
  null,
  "Tu n'es plus un nouveau-né : te voici ENFANT DE DIEU.\n\nTu as appris à marcher, à chercher ce qui est perdu et à semer la Parole. Maintenant, apprends à aimer concrètement.\n\nSœur Marie t'attend au grand parc, au nord-est de la ville.",
  "Te voici JEUNE DANS LA FOI.\n\nTu as secouru, éclairé, mémorisé la Parole. Il est temps d'apprendre le combat spirituel et la persévérance.\n\nL'Ancien David t'attend au sommet de la Colline de la Prière.",
  "Te voici ADULTE DANS LA FOI.\n\nTu as vaincu les traits enflammés, ramené un fils à son père, couru sans abandonner. Apprends maintenant la fidélité, le pardon et la Parole affûtée.\n\nLa Docteure Priscille t'attend à la bibliothèque.",
  "Te voici PÈRE SPIRITUEL — un disciple qui forme des disciples.\n\nTon armure est complète. Ta dernière leçon est la plus belle : transmettre.\n\nL'Apôtre Jean t'attend à l'église de la Grâce."
];

/* ---------- Petites phrases des passants ---------- */
GAME.DATA.ambientLines = [
  "Belle journée à Théopolis !", "Que la paix soit avec toi.", "Tu as vu la fontaine ? L'eau y est si claire.",
  "On dit qu'un nouveau disciple parcourt la ville…", "J'aime venir marcher près de l'église.",
  "Le marché de Samuel a reçu du bon pain ce matin.", "La vue depuis la colline est magnifique.",
  "Bonjour ! Dieu te bénisse.", "Il paraît que quelqu'un a réconcilié Marc et Paul. Incroyable !",
  "Le soir, les lampadaires rendent la ville si belle."
];

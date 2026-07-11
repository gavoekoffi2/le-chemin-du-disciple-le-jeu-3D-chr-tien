// ==== Les 15 quêtes du Chemin du Disciple (paraboles bibliques) ====
// Types d'étapes : dialogue, goto, interact, collect, sheep, sow, minigame,
// timedDelivery, prayAltars, escort, choice

const A = { name: 'Frère André', portrait: '🎣' };   // mentor du Port
const M = { name: 'Sœur Marthe', portrait: '🌾' };   // mentor des Jardins
const L = { name: 'Maître Lydia', portrait: '🧕' };  // mentor du Marché
const E = { name: 'Pasteur Élie', portrait: '🧔' };  // mentor du Temple
const S = { name: 'L\'Ancien Siméon', portrait: '👴' };
const P = { name: 'Vous', portrait: '🙂' };

// PNJ permanents du monde
export const WORLD_NPCS = [
  { id: 'andre',  name: 'Frère André',  x: -8,   z: 250,  look: { cloth: 0x3a5a7a, hair: 0x8a8a8a }, portrait: '🎣' },
  { id: 'marthe', name: 'Sœur Marthe',  x: -216, z: 0,    look: { cloth: 0x8a6a3a, hair: 0x6a5030 }, portrait: '🌾' },
  { id: 'lydia',  name: 'Maître Lydia', x: 0,    z: 0,    look: { cloth: 0x8a3a6a, hair: 0x1a1a1a }, portrait: '🧕' },
  { id: 'elie',   name: 'Pasteur Élie', x: 216,  z: -192, look: { cloth: 0x2a2a3a, hair: 0x8a8a8a }, portrait: '🧔' },
  { id: 'simeon', name: 'L\'Ancien Siméon', x: 12, z: -132, look: { cloth: 0xe8e0d0, hair: 0xcccccc }, portrait: '👴' },
  { id: 'benjamin', name: 'Benjamin le marchand', x: -14, z: 14, look: { cloth: 0x4a8a5a }, portrait: '🧑‍🌾' },
  { id: 'thomas', name: 'Thomas le boulanger', x: 14, z: -14, look: { cloth: 0xd8d0c0 }, portrait: '🧑‍🍳' },
];

export const QUESTS = [
  // ======= ÉTAPE 1 : NOUVEAU-NÉ DANS LA FOI =======
  {
    id: 'q1', title: 'L\'Appel', parable: 'Matthieu 4:19', giver: 'andre',
    desc: 'Un vieux pêcheur du port dit avoir quelque chose à vous confier. Tout chemin commence par un premier pas.',
    steps: [
      { type: 'dialogue', lines: [
        { ...A, text: 'Te voilà enfin. Je t\'ai vu errer dans Théopolis, le cœur en quête de sens. Moi aussi, autrefois, je ne connaissais que mes filets.' },
        { ...A, text: 'Puis une voix m\'a dit : « Suis-moi, et je te ferai pêcheur d\'hommes. » Ce jour-là, tout a changé. Aujourd\'hui, c\'est ton kairos — ton moment favorable.' },
        { ...A, text: 'Tu es un nouveau-né dans la foi. Ne brûle pas les étapes : le lait avant la viande ! Commence par visiter la Chapelle de l\'Aube, au nord d\'ici. Prie devant sa porte.' },
      ]},
      { type: 'goto', x: -72, z: 161, radius: 4, label: 'Allez prier à la Chapelle de l\'Aube (suivez le halo doré)' },
      { type: 'dialogue', lines: [
        { name: 'Une paix profonde', portrait: '🕊', text: 'Vous vous agenouillez devant la chapelle. Une paix que vous n\'aviez jamais connue vous envahit. Le chemin du disciple s\'ouvre devant vous.' },
        { ...P, text: '(Je sens que ma vie ne sera plus jamais la même. Retournons voir Frère André.)' },
      ]},
      { type: 'interact', npc: 'andre', label: 'Retourner voir Frère André', lines: [
        { ...A, text: 'Je vois une lumière nouvelle dans tes yeux ! C\'est le début du chemin. Presse la touche C pour contempler ton âme : les neuf fruits de l\'Esprit y grandiront.' },
        { ...A, text: 'Et la touche J tiendra ton journal. Va, grandis — et reviens me voir : j\'ai déjà une tâche pour toi.' },
      ]},
    ],
    reward: { grace: 20, fruits: { paix: 3 } },
  },
  {
    id: 'q2', title: 'La Brebis Perdue', parable: 'Luc 15:4-7', giver: 'andre',
    desc: 'Trois brebis du berger Jonas se sont égarées dans le port. Qui laisse les quatre-vingt-dix-neuf pour aller chercher celle qui est perdue ?',
    steps: [
      { type: 'dialogue', lines: [
        { ...A, text: 'Mon ami Jonas est désespéré : trois de ses brebis se sont égarées parmi les caisses et les entrepôts du port.' },
        { ...A, text: '« Quel homme d\'entre vous, s\'il a cent brebis et qu\'il en perde une, ne laisse les quatre-vingt-dix-neuf autres pour aller après celle qui est perdue ? »' },
        { ...A, text: 'Approche-toi de chaque brebis : elle te suivra. Ramène-les-moi toutes les trois !' },
      ]},
      { type: 'sheep', positions: [ { x: -180, z: 222 }, { x: 84, z: 234 }, { x: 168, z: 218 } ],
        deliverX: -8, deliverZ: 250, deliverRadius: 7,
        label: 'Retrouvez les 3 brebis égarées dans le port et ramenez-les à André' },
      { type: 'dialogue', lines: [
        { ...A, text: 'Les voilà toutes ! Jonas va pleurer de joie. « Il y aura plus de joie dans le ciel pour un seul pécheur qui se repent, que pour quatre-vingt-dix-neuf justes. »' },
        { ...A, text: 'Retiens ceci : chaque personne compte. Aucune n\'est de trop pour le Berger.' },
      ]},
    ],
    reward: { grace: 35, fruits: { bonte: 3, amour: 2 }, coins: 10 },
  },
  {
    id: 'q3', title: 'Le Lait de la Parole', parable: '1 Pierre 2:2', giver: 'andre',
    desc: 'Avant de marcher, il faut se nourrir. André vous met à l\'épreuve sur la Parole.',
    steps: [
      { type: 'dialogue', lines: [
        { ...A, text: 'Un disciple sans la Parole est comme une barque sans gouvernail. Voyons ce que tu as déjà appris !' },
        { ...A, text: 'Réponds à mes questions. Ne crains pas l\'erreur : c\'est ainsi qu\'on apprend.' },
      ]},
      { type: 'minigame', kind: 'quiz', count: 5, needed: 3, label: 'Répondez au quiz de la Parole' },
      { type: 'dialogue', lines: [
        { ...A, text: 'Bien ! La Parole prend racine en toi. Tu n\'es plus un étranger sur ce chemin.' },
        { ...A, text: 'Mon rôle s\'achève ici, petit. Va voir Sœur Marthe au Parc des Oliviers, à l\'ouest de la ville. Elle t\'apprendra à semer.' },
      ]},
    ],
    reward: { grace: 45, fruits: { fidelite: 3 } },
    advanceStage: true,
  },

  // ======= ÉTAPE 2 : ENFANT DE LA FOI =======
  {
    id: 'q4', title: 'Le Semeur', parable: 'Matthieu 13:3-9', giver: 'marthe',
    desc: 'Marthe enseigne par la terre : toute graine ne lève pas, tout dépend du sol qui la reçoit.',
    steps: [
      { type: 'dialogue', lines: [
        { ...M, text: 'Bienvenue, jeune pousse ! André m\'a parlé de toi. Ici, on apprend avec les mains dans la terre.' },
        { ...M, text: '« Un semeur sortit pour semer. Une partie tomba le long du chemin… une autre dans les endroits pierreux… une autre parmi les épines… une autre dans la bonne terre. »' },
        { ...M, text: 'Va au Jardin de la Vigne, au nord de ce parc. Tu y trouveras neuf parcelles. Sème dans les trois BONNES terres — et seulement là. Observe avant de semer !' },
      ]},
      { type: 'sow', label: 'Semez dans les 3 parcelles de bonne terre au Jardin de la Vigne' },
      { type: 'interact', npc: 'marthe', label: 'Retournez voir Sœur Marthe', lines: [
        { ...M, text: 'Tu as su reconnaître la bonne terre ! Il en va de même pour ton cœur : arrache les pierres du doute et les épines des soucis, et la Parole y portera du fruit — cent pour un.' },
      ]},
    ],
    reward: { grace: 40, fruits: { patience: 3 } },
  },
  {
    id: 'q5', title: 'Le Bon Samaritain', parable: 'Luc 10:30-37', giver: 'marthe',
    desc: 'Un voyageur blessé gît au bord de la route. Beaucoup passent. Qui s\'arrêtera ?',
    steps: [
      { type: 'dialogue', lines: [
        { ...M, text: 'On m\'a rapporté qu\'un voyageur a été détroussé sur la route à l\'est d\'ici. Les passants détournent le regard…' },
        { ...M, text: 'Benjamin, au Grand Marché, vend de l\'huile et des bandages. Achète-les (il te les fera au juste prix) et va soigner cet homme. Fais vite !' },
      ]},
      { type: 'interact', npc: 'benjamin', label: 'Achetez de l\'huile et des bandages chez Benjamin (Grand Marché)', lines: [
        { name: 'Benjamin le marchand', portrait: '🧑‍🌾', text: 'De l\'huile et du lin propre ? Pour une bonne œuvre, je te les laisse à 5 pièces. Que le Seigneur bénisse tes mains.' },
      ], cost: 5 },
      { type: 'goto', x: -108, z: -30, radius: 4, label: 'Portez secours au voyageur blessé (route à l\'ouest du marché)', spawnNPC: { id: 'blesse', name: 'Le voyageur blessé', x: -108, z: -30, look: { cloth: 0x6a5a4a }, lying: true } },
      { type: 'dialogue', lines: [
        { name: 'Le voyageur blessé', portrait: '🤕', text: 'Vous… vous vous êtes arrêté ? Tous les autres ont passé outre… Merci. Que Dieu vous le rende au centuple.' },
        { ...P, text: '(Vous versez l\'huile, bandez ses plaies, et l\'aidez à se relever.) « Va, et toi, fais de même. »' },
      ], despawnNPC: 'blesse' },
      { type: 'interact', npc: 'marthe', label: 'Retournez voir Sœur Marthe', lines: [
        { ...M, text: 'Tu ne t\'es pas demandé QUI était ton prochain — tu t\'es FAIT le prochain de cet homme. Voilà le cœur de l\'Évangile, mon enfant.' },
      ]},
    ],
    reward: { grace: 45, fruits: { amour: 4, bonte: 3 } },
  },
  {
    id: 'q6', title: 'Soixante-dix fois sept', parable: 'Matthieu 18:21-22', giver: 'marthe',
    desc: 'Deux voisines des Jardins ne se parlent plus. La rancune est un poison que l\'on boit soi-même.',
    steps: [
      { type: 'dialogue', lines: [
        { ...M, text: 'Rachel et Deborah, deux voisines, se disputent depuis des semaines pour un figuier planté sur la limite de leurs jardins. Va les aider à se réconcilier.' },
        { ...M, text: 'Souviens-toi : « Je ne te dis pas jusqu\'à sept fois, mais jusqu\'à soixante-dix fois sept fois. »' },
      ]},
      { type: 'goto', x: -146, z: 74, radius: 5, label: 'Trouvez Rachel et Deborah aux Jardins',
        spawnNPC: { id: 'rachel', name: 'Rachel', x: -150, z: 72, look: { cloth: 0x9a4a4a } },
        spawnNPC2: { id: 'deborah', name: 'Deborah', x: -142, z: 72, look: { cloth: 0x4a6a9a } } },
      { type: 'choice',
        lines: [
          { name: 'Rachel', portrait: '😠', text: 'Ce figuier est à MOI ! Mon père l\'a planté ! Deborah en cueille les fruits comme une voleuse !' },
          { name: 'Deborah', portrait: '😤', text: 'Les branches penchent chez moi ! Et qui l\'arrose depuis dix ans, hein ? Dis-lui, toi, le disciple !' },
        ],
        choices: [
          { text: '« Et si ce figuier devenait votre arbre de paix ? Partagez ses fruits, et plantez-en un second ensemble. »', hint: '(Douceur)',
            effects: { douceur: 3, paix: 4 }, result: { name: 'Rachel', portrait: '😊', text: 'Un arbre… ensemble ? Personne ne nous avait proposé cela. Deborah… pardonne-moi. — Et toi la mienne, Rachel.' } },
          { text: '« Rachel, il est à toi. Deborah n\'a qu\'à planter le sien. »', hint: '(Tranché, mais dur)',
            effects: { patience: -2 }, result: { name: 'Deborah', portrait: '😢', text: 'Voilà donc la justice de ton Dieu ? Trancher sans écouter ?… (La blessure demeure. Vous auriez pu faire mieux.)' } },
          { text: '« Réglez ça entre vous, je n\'ai pas le temps. »', hint: '(Fuite)',
            effects: { amour: -2 }, result: { name: 'Rachel', portrait: '😠', text: 'Passe ton chemin, alors ! (Le conflit s\'envenime. Un disciple ne détourne pas le regard…)' } },
        ],
        despawnNPCs: ['rachel', 'deborah'],
        label: 'Réconciliez Rachel et Deborah' },
      { type: 'interact', npc: 'marthe', label: 'Racontez tout à Sœur Marthe', lines: [
        { ...M, text: 'La paix se sème comme une graine, et le pardon est son eau. Tu grandis, mon enfant. Il est temps : Maître Lydia t\'attend au Grand Marché. Elle fera de toi un serviteur.' },
      ]},
    ],
    reward: { grace: 35, fruits: { paix: 2 } },
    advanceStage: true,
  },

  // ======= ÉTAPE 3 : SERVITEUR FIDÈLE =======
  {
    id: 'q7', title: 'Les Talents', parable: 'Matthieu 25:14-30', giver: 'lydia',
    desc: 'Lydia confie cinq talents. Les enterrer est le seul mauvais choix.',
    steps: [
      { type: 'dialogue', lines: [
        { ...L, text: 'Ainsi te voilà, le disciple dont toute la ville parle. Chez moi, on ne grandit pas en écoutant : on grandit en SERVANT.' },
        { ...L, text: '« Un homme, partant pour un voyage, appela ses serviteurs et leur remit ses biens : à l\'un cinq talents, à l\'autre deux, à l\'autre un. »' },
        { ...L, text: 'Voici cinq talents d\'argent. Fais-les fructifier au marché comme tu l\'entends. Reviens me voir quand tu auras choisi.' },
      ]},
      { type: 'minigame', kind: 'talents', label: 'Faites fructifier les 5 talents (parlez aux marchands ou décidez)' },
      { type: 'dialogue', lines: [
        { ...L, text: '« C\'est bien, bon et fidèle serviteur ; tu as été fidèle en peu de chose, je te confierai beaucoup ; entre dans la joie de ton maître. »' },
      ]},
    ],
    reward: { grace: 45, fruits: { fidelite: 4 } },
  },
  {
    id: 'q8', title: 'Le Pain Partagé', parable: 'Jean 6:9-13', giver: 'lydia',
    desc: 'Cinq affamés dans la ville, cinq pains chauds, et un soleil qui les refroidit vite. Courez !',
    steps: [
      { type: 'dialogue', lines: [
        { ...L, text: 'Thomas le boulanger a cuit cinq pains pour les affamés de la ville — mais ses jambes ne sont plus ce qu\'elles étaient.' },
        { ...L, text: 'Prends sa besace et cours : cinq personnes attendent, du port jusqu\'à la fontaine. Livre tous les pains avant qu\'ils ne refroidissent ! (Astuce : Maj pour courir, ou prends une voiture !)' },
      ]},
      { type: 'timedDelivery', time: 150,
        targets: [
          { x: -40, z: 150, name: 'la veuve près de la chapelle' },
          { x: -180, z: 240, name: 'le docker du port ouest' },
          { x: -216, z: 30, name: 'l\'orphelin du Parc des Oliviers' },
          { x: 144, z: 76, name: 'le vieillard du quartier est' },
          { x: 20, z: -150, name: 'la mendiante de la fontaine' },
        ],
        label: 'Livrez les 5 pains avant la fin du temps' },
      { type: 'dialogue', lines: [
        { ...L, text: 'Tous nourris, et le pain encore chaud ! « Ils mangèrent tous et furent rassasiés. » Cinq pains ont encore fait un miracle aujourd\'hui — grâce à tes jambes.' },
      ]},
    ],
    reward: { grace: 50, fruits: { bonte: 4, joie: 2 }, coins: 10 },
  },
  {
    id: 'q9', title: 'La Perle de Grand Prix', parable: 'Matthieu 13:45-46', giver: 'lydia',
    desc: 'Une chasse au trésor à travers Théopolis. Le Royaume vaut qu\'on vende tout pour lui.',
    steps: [
      { type: 'dialogue', lines: [
        { ...L, text: '« Le royaume des cieux est semblable à un marchand qui cherche de belles perles. Il a trouvé une perle de grand prix, et il a vendu tout ce qu\'il avait pour l\'acheter. »' },
        { ...L, text: 'J\'ai caché pour toi une perle quelque part dans la ville, avec trois indices. Premier indice : « Là où l\'aube t\'a donné la paix, cherche au pied de la porte. »' },
      ]},
      { type: 'goto', x: -72, z: 161, radius: 4, label: 'Indice 1 : « Là où l\'aube t\'a donné la paix… » (réfléchissez !)' },
      { type: 'dialogue', lines: [
        { name: 'Indice trouvé', portrait: '📜', text: 'Un billet est glissé sous la porte de la chapelle : « Bien. Marche maintenant jusqu\'au bout du bois qui flotte sur l\'eau, là où les barques dorment. »' },
      ]},
      { type: 'goto', x: 0, z: 284, radius: 5, label: 'Indice 2 : « le bout du bois qui flotte sur l\'eau »' },
      { type: 'dialogue', lines: [
        { name: 'Indice trouvé', portrait: '📜', text: 'Au bout du ponton central, un second billet : « Dernier pas : la perle repose devant la pierre du milieu, au jardin qui regarde le Temple. »' },
      ]},
      { type: 'goto', x: 144, z: -212, radius: 5, label: 'Indice 3 : « la pierre du milieu, au jardin qui regarde le Temple »' },
      { type: 'dialogue', lines: [
        { name: 'La Perle', portrait: '🦪', text: 'Au pied de la stèle centrale, vous déterrez un coffret. À l\'intérieur : une perle nacrée d\'une beauté irréelle… et un mot : « Ce qui a du prix se cherche de tout son cœur. »' },
      ]},
      { type: 'interact', npc: 'lydia', label: 'Rapportez la perle à Lydia', lines: [
        { ...L, text: 'Tu l\'as trouvée ! Garde-la : qu\'elle te rappelle que le Royaume vaut TOUT. Tu n\'es plus un enfant, disciple. Le Pasteur Élie t\'attend sur la Colline du Temple.' },
      ]},
    ],
    reward: { grace: 60, fruits: { joie: 4 }, coins: 20 },
    advanceStage: true,
  },

  // ======= ÉTAPE 4 : ADULTE DANS LA FOI =======
  {
    id: 'q10', title: 'Le Combat Spirituel', parable: 'Éphésiens 6:10-18', giver: 'elie',
    desc: 'À l\'Arène, Élie enseigne le combat invisible : saisir la prière, esquiver la tentation.',
    steps: [
      { type: 'dialogue', lines: [
        { ...E, text: 'Bienvenue sur la Colline, disciple. Ici, on ne combat ni la chair ni le sang, mais les puissances invisibles. Ta cuirasse te servira enfin.' },
        { ...E, text: 'Rends-toi à l\'Arène, à l\'ouest de la colline. Recueille dix flammes de prière SANS te laisser toucher trois fois par les ombres de la tentation. Va !' },
      ]},
      { type: 'minigame', kind: 'arena', needed: 10, maxHits: 3, label: 'À l\'Arène : 10 flammes de prière, max 2 ombres' },
      { type: 'interact', npc: 'elie', label: 'Retournez voir le Pasteur Élie', lines: [
        { ...E, text: 'Tu as tenu bon ! « Revêtez-vous de toutes les armes de Dieu, afin de pouvoir tenir ferme contre les ruses du diable. » La prière est ton souffle, disciple. Ne l\'oublie jamais.' },
      ]},
    ],
    reward: { grace: 60, fruits: { maitrise: 5 } },
  },
  {
    id: 'q11', title: 'La Maison sur le Roc', parable: 'Matthieu 7:24-27', giver: 'elie',
    desc: 'Quatre pierres, deux terrains, une tempête à venir. Où bâtirez-vous ?',
    steps: [
      { type: 'dialogue', lines: [
        { ...E, text: 'Le jeune Josias veut bâtir sa première maison. Aide-le : rassemble quatre pierres de taille dispersées dans le jardin du Temple.' },
      ]},
      { type: 'collect', itemType: 'stone', label: 'Ramassez les 4 pierres de taille (jardin du Temple)',
        items: [ { x: 122, z: -240 }, { x: 168, z: -190 }, { x: 130, z: -186 }, { x: 166, z: -244 } ] },
      { type: 'goto', x: 216, z: -130, radius: 6, label: 'Portez les pierres au chantier de Josias (sud de la colline)',
        spawnNPC: { id: 'josias', name: 'Josias', x: 216, z: -128, look: { cloth: 0xc8a848 } } },
      { type: 'choice',
        lines: [
          { name: 'Josias', portrait: '👷', text: 'Merci pour les pierres ! Bon… le terrain sablonneux près de la rive est plus FACILE à creuser, le roc de la colline est plus DUR. La pluie arrive bientôt. Je bâtis où ?' },
        ],
        choices: [
          { text: '« Sur le roc. Ce qui coûte aujourd\'hui tiendra demain. »', hint: '(Sagesse)',
            effects: { fidelite: 3, patience: 3 }, result: { name: 'Josias', portrait: '😃', text: 'Sur le roc, donc ! « La pluie est tombée, les torrents sont venus… elle n\'est point tombée, parce qu\'elle était fondée sur le roc. » Merci, disciple !' } },
          { text: '« Sur le sable, c\'est plus rapide et la vue est belle. »', hint: '(Facilité)',
            effects: { maitrise: -2 }, result: { name: 'Josias', portrait: '😰', text: 'Si tu le dis… (Trois jours plus tard, la première pluie fissure les fondations. Josias devra tout recommencer — sur le roc.)' } },
        ],
        despawnNPCs: ['josias'],
        label: 'Conseillez Josias sur les fondations' },
      { type: 'interact', npc: 'elie', label: 'Retournez voir le Pasteur Élie', lines: [
        { ...E, text: '« Quiconque entend ces paroles que je dis et les met en PRATIQUE sera semblable à un homme prudent qui a bâti sa maison sur le roc. » Entendre ne suffit jamais, disciple.' },
      ]},
    ],
    reward: { grace: 60, fruits: { fidelite: 2, patience: 2 } },
  },
  {
    id: 'q12', title: 'Veillez et Priez', parable: 'Matthieu 26:40-41', giver: 'elie',
    desc: 'Une nuit de veille. Quatre autels autour du Temple attendent leur flamme avant l\'aube.',
    steps: [
      { type: 'dialogue', lines: [
        { ...E, text: '« Vous n\'avez donc pu veiller une heure avec moi ? Veillez et priez, afin que vous ne tombiez pas dans la tentation. »' },
        { ...E, text: 'Cette nuit, tu veilleras. Quatre autels entourent la colline du Temple. Allume-les tous les quatre avant l\'aube. La nuit tombe… maintenant.' },
      ], setHour: 21.5 },
      { type: 'prayAltars', label: 'Allumez les 4 autels de prière avant l\'aube (E devant chaque autel)' },
      { type: 'dialogue', lines: [
        { ...E, text: 'L\'aube se lève et les quatre flammes brûlent encore. Tu as veillé quand d\'autres dormaient. Te voilà adulte dans la foi — mais le plus grand pas reste à venir.' },
        { ...E, text: 'L\'Ancien Siméon t\'attend à la Place de la Fontaine. Ce qu\'il va te demander changera d\'autres vies que la tienne.' },
      ], setHour: 7 },
    ],
    reward: { grace: 80, fruits: { paix: 5, maitrise: 2 } },
    advanceStage: true,
  },

  // ======= ÉTAPE 5 : PÈRE SPIRITUEL =======
  {
    id: 'q13', title: 'Le Fils Prodigue', parable: 'Luc 15:11-32', giver: 'simeon',
    desc: 'Nathan a dilapidé son héritage et n\'ose plus rentrer. Son père scrute la route chaque soir.',
    steps: [
      { type: 'dialogue', lines: [
        { ...S, text: 'Approche, disciple. Mes yeux ont vu passer bien des générations sur cette place… Je connais un père qui, chaque soir, regarde la route en espérant un fils.' },
        { ...S, text: 'Nathan a réclamé son héritage, l\'a dilapidé au port, et vit maintenant dans la honte près des tavernes. Va le trouver. Ramène-le — non par la force, mais par l\'amour.' },
      ]},
      { type: 'goto', x: 60, z: 240, radius: 5, label: 'Trouvez Nathan près des tavernes du port',
        spawnNPC: { id: 'nathan', name: 'Nathan', x: 60, z: 240, look: { cloth: 0x5a5248, hair: 0x4a3520 } } },
      { type: 'choice',
        lines: [
          { name: 'Nathan', portrait: '😞', text: 'Laisse-moi. J\'ai tout gaspillé — l\'argent de mon père, son nom, sa confiance. Même ses serviteurs valent mieux que moi. Je n\'ai plus le droit de rentrer.' },
        ],
        choices: [
          { text: '« Ton père ne guette pas un serviteur sur la route. Il guette un FILS. Chaque soir. Viens, je marche avec toi. »', hint: '(Amour)',
            effects: { amour: 4 }, result: { name: 'Nathan', portrait: '😭', text: 'Chaque soir ?… Il m\'attend ? Alors… oui. Marche avec moi, disciple. Seul, je n\'aurai jamais le courage.' } },
          { text: '« C\'est vrai, tu as tout gâché. Mais viens quand même, on verra bien. »', hint: '(Maladroit)',
            effects: {}, result: { name: 'Nathan', portrait: '😔', text: '« On verra bien »… Ce n\'est pas très rassurant. Mais tout vaut mieux que cette taverne. Allons-y…' } },
        ],
        label: 'Convainquez Nathan de rentrer' },
      { type: 'escort', npc: 'nathan', x: -144, z: 4, radius: 6, label: 'Raccompagnez Nathan chez son père (Les Jardins)',
        spawnNPC: { id: 'pere_nathan', name: 'Le père de Nathan', x: -144, z: 0, look: { cloth: 0x7a5a3a, hair: 0xcccccc } } },
      { type: 'dialogue', lines: [
        { name: 'Le père de Nathan', portrait: '🥹', text: '(Le vieil homme vous voit de loin — et COURT.) Mon fils ! Mon fils que voilà était mort, et il est revenu à la vie ; il était perdu, et il est retrouvé !' },
        { name: 'Nathan', portrait: '😭', text: 'Père, j\'ai péché contre le ciel et contre toi… — Vite ! La plus belle robe ! Un festin ! (Il vous serre la main :) Et toi, disciple… merci. Tu m\'as ramené à la vie.' },
      ], despawnNPCs: ['nathan', 'pere_nathan'] },
      { type: 'interact', npc: 'simeon', label: 'Retournez voir Siméon', lines: [
        { ...S, text: 'Tu n\'as pas seulement grandi, disciple : tu fais maintenant grandir les autres. C\'est le signe des pères spirituels. Une dernière moisson t\'attend.' },
      ]},
    ],
    reward: { grace: 70, fruits: { amour: 5, joie: 3 } },
  },
  {
    id: 'q14', title: 'Va, fais des disciples', parable: 'Matthieu 28:19-20', giver: 'simeon',
    desc: 'Trois habitants de Théopolis cherchent Dieu sans le savoir. Devenez pour eux ce qu\'André fut pour vous.',
    steps: [
      { type: 'dialogue', lines: [
        { ...S, text: '« Allez, faites de toutes les nations des disciples. » Trois personnes, dans cette ville, ont le cœur ouvert : Clara la couturière, Élias le docker, et la petite Noémie.' },
        { ...S, text: 'Va vers chacun. Écoute d\'abord. Réponds ensuite. Tu sauras quoi dire : tout ton chemin t\'y a préparé.' },
      ]},
      { type: 'disciples',
        targets: [
          { id: 'clara', name: 'Clara la couturière', x: 76, z: 148, look: { cloth: 0x9a6aa0 }, portrait: '🧵',
            question: 'On dit que tu as changé… Moi, je couds du matin au soir et ma vie me semble vide. À quoi bon tout cela ?',
            answers: [
              { text: '« Ta vie n\'est pas vide, elle est en attente. Cherche premièrement le Royaume — le reste te sera donné par-dessus. Viens à la chapelle dimanche : je t\'y accompagnerai. »', good: true },
              { text: '« Travaille moins, tu seras moins fatiguée. »', good: false },
            ],
            reaction: 'Le Royaume, d\'abord ?… Personne ne m\'avait jamais dit que je comptais pour Dieu. Oui — dimanche. J\'y serai.' },
          { id: 'elias', name: 'Élias le docker', x: -72, z: -140, look: { cloth: 0x4a5a6a }, portrait: '💪',
            question: 'J\'ai fait trop de mal dans ma vie, disciple. Ton Dieu ne voudrait pas d\'un type comme moi. Pas vrai ?',
            answers: [
              { text: '« Un berger laisse 99 brebis pour aller chercher UNE seule perdue. Je le sais : j\'ai été cette brebis. Et Il t\'attend, toi aussi. »', good: true },
              { text: '« C\'est vrai que ton cas est compliqué… »', good: false },
            ],
            reaction: 'Une brebis… perdue puis retrouvée. Si toi tu as changé, alors peut-être que moi aussi… Parle-moi de ce Berger.' },
          { id: 'noemie', name: 'Noémie', x: 216, z: 76, look: { cloth: 0xd88ab0 }, portrait: '👧',
            question: 'Grand-mère dit que Dieu voit tout. Alors pourquoi il ne répare pas tout de suite les choses tristes ?',
            answers: [
              { text: '« Il a déjà commencé, Noémie — souvent à travers des mains comme les tiennes et les miennes. Veux-tu qu\'on porte du pain à la mendiante, ensemble ? »', good: true },
              { text: '« C\'est trop compliqué pour toi, tu comprendras plus tard. »', good: false },
            ],
            reaction: 'Alors mes mains aussi peuvent réparer des choses tristes ? Oui ! Allons-y ! (Vous venez de semer une graine qui portera du fruit trente, soixante, cent pour un.)' },
        ],
        label: 'Guidez Clara, Élias et Noémie (3 rencontres)' },
      { type: 'interact', npc: 'simeon', label: 'Retournez voir Siméon', lines: [
        { ...S, text: 'Trois cœurs ouverts en un jour… Le disciple est devenu semeur. Il reste un dernier geste, le plus beau de tous. Es-tu prêt ?' },
      ]},
    ],
    reward: { grace: 80, fruits: { amour: 2, joie: 2, paix: 2, patience: 2, bonte: 2, bienveillance: 2, fidelite: 2, douceur: 2, maitrise: 2 } },
  },
  {
    id: 'q15', title: 'La Course Achevée', parable: '2 Timothée 4:7', giver: 'simeon',
    desc: 'Allumer le grand phare de la fontaine : que Théopolis tout entière voie la Lumière.',
    steps: [
      { type: 'dialogue', lines: [
        { ...S, text: 'Depuis des années, la vasque de cette fontaine attend une flamme digne d\'elle. « Vous êtes la lumière du monde. Une ville située sur une montagne ne peut être cachée. »' },
        { ...S, text: 'Monte à la fontaine et allume le phare de Théopolis. Que ta lumière luise devant les hommes — pour la gloire du Père.' },
      ]},
      { type: 'goto', x: 0, z: -136, radius: 4.5, label: 'Allumez le phare de la fontaine (E)', interactLabel: 'Allumer le phare' },
      { type: 'beacon' },
    ],
    reward: { grace: 70 },
    advanceStage: true,
    ending: true,
  },
];

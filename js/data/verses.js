// ==== Versets cachés (collectibles) + questions du quiz de l'Épée de l'Esprit ====

export const HIDDEN_VERSES = [
  { text: 'Je puis tout par celui qui me fortifie.', ref: 'Philippiens 4:13' },
  { text: 'L\'Éternel est mon berger : je ne manquerai de rien.', ref: 'Psaume 23:1' },
  { text: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique.', ref: 'Jean 3:16' },
  { text: 'Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.', ref: 'Psaume 119:105' },
  { text: 'Cherchez premièrement le royaume et la justice de Dieu.', ref: 'Matthieu 6:33' },
  { text: 'Je suis le chemin, la vérité, et la vie.', ref: 'Jean 14:6' },
  { text: 'Fortifie-toi et prends courage. Ne t\'effraie point et ne t\'épouvante point.', ref: 'Josué 1:9' },
  { text: 'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.', ref: 'Matthieu 11:28' },
  { text: 'Si Dieu est pour nous, qui sera contre nous ?', ref: 'Romains 8:31' },
  { text: 'Le fruit de l\'Esprit, c\'est l\'amour, la joie, la paix, la patience, la bonté…', ref: 'Galates 5:22' },
  { text: 'Confie-toi en l\'Éternel de tout ton cœur, et ne t\'appuie pas sur ta sagesse.', ref: 'Proverbes 3:5' },
  { text: 'Vous êtes la lumière du monde. Une ville située sur une montagne ne peut être cachée.', ref: 'Matthieu 5:14' },
  { text: 'Ne vous inquiétez de rien ; mais en toute chose faites connaître vos besoins à Dieu.', ref: 'Philippiens 4:6' },
  { text: 'Aimez-vous les uns les autres, comme je vous ai aimés.', ref: 'Jean 13:34' },
  { text: 'La foi est une ferme assurance des choses qu\'on espère.', ref: 'Hébreux 11:1' },
  { text: 'Ceux qui se confient en l\'Éternel renouvellent leur force. Ils prennent le vol comme les aigles.', ref: 'Ésaïe 40:31' },
  { text: 'Que votre lumière luise ainsi devant les hommes, afin qu\'ils voient vos bonnes œuvres.', ref: 'Matthieu 5:16' },
  { text: 'Il y a plus de bonheur à donner qu\'à recevoir.', ref: 'Actes 20:35' },
  { text: 'Toutes choses concourent au bien de ceux qui aiment Dieu.', ref: 'Romains 8:28' },
  { text: 'Approchez-vous de Dieu, et il s\'approchera de vous.', ref: 'Jacques 4:8' },
  { text: 'Voici, je me tiens à la porte, et je frappe.', ref: 'Apocalypse 3:20' },
];

// Questions à choix multiples — la bonne réponse est toujours à l'index 0 (mélangée à l'affichage)
export const QUIZ_QUESTIONS = [
  { q: '« Je puis tout par celui qui me ______. »', a: ['fortifie', 'console', 'guide', 'porte'], ref: 'Philippiens 4:13' },
  { q: 'Complète : « L\'Éternel est mon ______, je ne manquerai de rien. »', a: ['berger', 'rocher', 'bouclier', 'refuge'], ref: 'Psaume 23:1' },
  { q: 'Qui a dit : « Je suis le chemin, la vérité et la vie » ?', a: ['Jésus', 'Moïse', 'Pierre', 'Élie'], ref: 'Jean 14:6' },
  { q: 'Combien de fois faut-il pardonner selon Jésus ?', a: ['70 fois 7 fois', '7 fois', '12 fois', '100 fois'], ref: 'Matthieu 18:22' },
  { q: 'Dans la parabole du semeur, quelle terre porte du fruit ?', a: ['La bonne terre', 'Le chemin', 'Les endroits pierreux', 'Les épines'], ref: 'Matthieu 13:8' },
  { q: '« Cherchez premièrement… »', a: ['le royaume et la justice de Dieu', 'la sagesse des anciens', 'la paix avec tous', 'votre pain quotidien'], ref: 'Matthieu 6:33' },
  { q: 'Le fruit de l\'Esprit compte combien de vertus (Galates 5) ?', a: ['9', '7', '10', '12'], ref: 'Galates 5:22-23' },
  { q: 'Quelle pièce de l\'armure de Dieu est « la parole de Dieu » ?', a: ['L\'épée de l\'Esprit', 'Le bouclier de la foi', 'Le casque du salut', 'La ceinture de la vérité'], ref: 'Éphésiens 6:17' },
  { q: 'Le bon Samaritain a versé sur les plaies…', a: ['de l\'huile et du vin', 'de l\'eau pure', 'du miel', 'du baume de Galaad'], ref: 'Luc 10:34' },
  { q: 'L\'homme prudent bâtit sa maison sur…', a: ['le roc', 'le sable', 'la colline', 'l\'argile'], ref: 'Matthieu 7:24' },
  { q: 'Combien de brebis le berger laisse-t-il pour chercher celle qui est perdue ?', a: ['99', '100', '50', '12'], ref: 'Luc 15:4' },
  { q: '« Vous êtes la ______ du monde. »', a: ['lumière', 'force', 'joie', 'espérance'], ref: 'Matthieu 5:14' },
  { q: 'Que reçoit le serviteur fidèle dans la parabole des talents ?', a: ['On lui confie davantage', 'Un repos éternel', 'Une couronne d\'or', 'Un champ'], ref: 'Matthieu 25:21' },
  { q: '« La foi est une ferme ______ des choses qu\'on espère. »', a: ['assurance', 'promesse', 'vision', 'attente'], ref: 'Hébreux 11:1' },
  { q: 'Le père du fils prodigue, en le voyant revenir…', a: ['courut se jeter à son cou', 'ferma sa porte', 'envoya un serviteur', 'attendit qu\'il s\'excuse'], ref: 'Luc 15:20' },
];

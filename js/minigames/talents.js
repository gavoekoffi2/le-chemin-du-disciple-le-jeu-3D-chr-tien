// ==== Mini-jeu : la parabole des Talents — choix d'investissement ====
const $ = (id) => document.getElementById(id);

const OPTIONS = [
  {
    id: 'veuve', icon: '🧺',
    title: 'Financer l\'étal de la veuve Anne (2 talents)',
    desc: 'Elle tisse des paniers mais n\'a plus de quoi acheter l\'osier.',
    cost: 2, result: 4,
    story: 'L\'osier acheté, la veuve Anne remplit son étal en trois jours. Elle vous rend 4 talents, les larmes aux yeux — et embauche l\'orphelin du parc.',
  },
  {
    id: 'pecheur', icon: '🐟',
    title: 'Réparer le filet du jeune pêcheur (2 talents)',
    desc: 'Son filet déchiré le laisse rentrer bredouille chaque soir.',
    cost: 2, result: 3,
    story: 'Filet réparé, la pêche du jeune homme nourrit tout son quartier. Il vous rapporte 3 talents et donne le surplus aux affamés.',
  },
  {
    id: 'graines', icon: '🌾',
    title: 'Acheter des semences pour Marthe (1 talent)',
    desc: 'Un talent de semences, semé en bonne terre…',
    cost: 1, result: 3,
    story: 'Les semences de Marthe lèvent « trente, soixante, cent pour un ». Récolte vendue : 3 talents.',
  },
  {
    id: 'enterrer', icon: '🕳',
    title: 'Enterrer les talents restants (sécurité ?)',
    desc: '« J\'ai eu peur, et je suis allé cacher ton talent dans la terre. »',
    cost: 0, result: 0,
    story: null,
  },
];

export class TalentsGame {
  constructor(game) {
    this.game = game;
    this.panel = $('talents-panel');
  }

  start(onDone) {
    this.onDone = onDone;
    this.talents = 5;
    this.invested = [];
    this.game.uiLock = true;
    this.game.input.releasePointer();
    this.panel.classList.remove('hidden');
    $('talents-result').classList.add('hidden');
    $('talents-result').innerHTML = '';
    this._render();
  }

  _render() {
    $('talents-intro').textContent = `Talents en main : ${this.talents} — Choisissez où investir. Quand vous avez terminé, validez.`;
    const el = $('talents-options');
    el.innerHTML = '';
    for (const opt of OPTIONS) {
      if (opt.id === 'enterrer') continue;
      if (this.invested.includes(opt.id)) continue;
      const btn = document.createElement('button');
      btn.className = 'quiz-answer';
      btn.disabled = this.talents < opt.cost;
      btn.innerHTML = `${opt.icon} <strong>${opt.title}</strong><br><small>${opt.desc}</small>`;
      btn.addEventListener('click', () => {
        this.talents -= opt.cost;
        this.invested.push(opt.id);
        this.game.audio.pickup();
        this._render();
      });
      el.appendChild(btn);
    }
    // Valider / enterrer
    const doneBtn = document.createElement('button');
    doneBtn.className = 'quiz-answer';
    if (this.invested.length === 0) {
      doneBtn.innerHTML = `🕳 <strong>Enterrer les 5 talents et les rendre tels quels</strong><br><small>« J'ai eu peur… »</small>`;
    } else {
      doneBtn.innerHTML = `✅ <strong>Valider mes choix</strong> (${this.talents} talent(s) non investi(s))`;
    }
    doneBtn.addEventListener('click', () => this._resolve());
    el.appendChild(doneBtn);
  }

  _resolve() {
    const el = $('talents-result');
    el.classList.remove('hidden');
    $('talents-options').innerHTML = '';

    if (this.invested.length === 0) {
      // Le mauvais serviteur
      this.game.audio.bad();
      $('talents-intro').textContent = '';
      el.innerHTML = `<p>😔 <em>« Serviteur méchant et paresseux… tu aurais dû au moins placer mon argent chez les banquiers. »</em> (Matthieu 25:26-27)</p>
        <p>Lydia reprend ses talents. La peur n'est pas la fidélité. <strong>Recommencez — osez semer !</strong></p>`;
      const retry = document.createElement('button');
      retry.className = 'menu-btn';
      retry.textContent = 'Recommencer';
      retry.addEventListener('click', () => this.start(this.onDone));
      el.appendChild(retry);
      return;
    }

    let total = this.talents;
    let html = '';
    for (const id of this.invested) {
      const opt = OPTIONS.find(o => o.id === id);
      total += opt.result;
      html += `<p>${opt.icon} ${opt.story} <strong>(+${opt.result} talents)</strong></p>`;
    }
    html += `<p style="color:var(--gold)"><strong>Bilan : 5 talents confiés → ${total} talents rendus.</strong></p>`;
    el.innerHTML = html;
    this.game.audio.questDone();
    this.game.progression.addCoins(total * 2);
    const ok = document.createElement('button');
    ok.className = 'menu-btn';
    ok.textContent = `Rendre les ${total} talents à Lydia (+${total * 2} pièces de gratitude)`;
    ok.addEventListener('click', () => {
      this.panel.classList.add('hidden');
      this.game.uiLock = false;
      this.onDone?.(true);
    });
    el.appendChild(ok);
  }
}

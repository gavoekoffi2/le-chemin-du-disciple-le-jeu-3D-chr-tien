/* LA VOIE — GAME.UI : dialogues, choix, notifications, panneaux, étapes */
GAME.UI = (function () {
  const $ = id => document.getElementById(id);
  let dlgQueue = [], dlgOnDone = null, dlgSpeakerDef = null, busy = false;
  let typeTimer = null, curLineText = '';

  function isBusy() { return busy; }

  /* ---------- Dialogue linéaire ---------- */
  function dialogue(npcDef, lines, onDone) {
    dlgQueue = lines.slice();
    dlgOnDone = onDone || null;
    dlgSpeakerDef = npcDef;
    busy = true;
    GAME.Player.player.frozen = true;
    GAME.Player.enterDialogueCam();
    $('dialogue-box').style.display = 'flex';
    $('dialogue-choices').innerHTML = '';
    nextLine();
  }

  function typeText(el, text) {
    if (typeTimer) clearInterval(typeTimer);
    curLineText = text;
    let i = 0;
    el.textContent = '';
    typeTimer = setInterval(() => {
      i += 2;
      el.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(typeTimer); typeTimer = null; }
    }, 14);
  }

  function nextLine() {
    if (!dlgQueue.length) { closeDialogue(); return; }
    const line = dlgQueue.shift();
    $('dialogue-speaker').textContent = line.s;
    $('dialogue-portrait').textContent =
      line.s === 'Toi' ? '🙂' : (dlgSpeakerDef ? dlgSpeakerDef.portrait : '💬');
    typeText($('dialogue-text'), line.t);
    $('dialogue-next').style.display = 'block';
    GAME.audio.ui();
  }

  function advance() {
    if (!busy) return;
    // si le texte est en cours de frappe : l'afficher entièrement
    if (typeTimer) {
      clearInterval(typeTimer);
      typeTimer = null;
      $('dialogue-text').textContent = curLineText;
      return;
    }
    if ($('dialogue-choices').children.length > 0) return; // un choix attend
    if (dlgQueue.length) nextLine();
    else closeDialogue();
  }

  function closeDialogue() {
    $('dialogue-box').style.display = 'none';
    busy = false;
    GAME.Player.player.frozen = false;
    GAME.Player.exitDialogueCam();
    const cb = dlgOnDone;
    dlgOnDone = null;
    if (cb) cb();
  }

  /* ---------- Dialogue à choix ---------- */
  function dialogueChoice(npcDef, choiceDef, onDone) {
    busy = true;
    GAME.Player.player.frozen = true;
    GAME.Player.enterDialogueCam();
    dlgSpeakerDef = npcDef;
    $('dialogue-box').style.display = 'flex';
    $('dialogue-speaker').textContent = npcDef.name;
    $('dialogue-portrait').textContent = npcDef.portrait;
    typeText($('dialogue-text'), choiceDef.prompt);
    $('dialogue-next').style.display = 'none';
    const chDiv = $('dialogue-choices');
    chDiv.innerHTML = '';
    choiceDef.options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'dchoice';
      b.textContent = opt.t;
      b.onclick = () => {
        GAME.audio.ui();
        chDiv.innerHTML = '';
        if (opt.good) {
          // bonus de sagesse : +3 sur le premier fruit de la quête
          const q = GAME.Quests.currentQuest();
          if (q && q.rewards && q.rewards.fruits) {
            const f = Object.keys(q.rewards.fruits)[0];
            GAME.state.fruits[f] = Math.min(100, GAME.state.fruits[f] + 3);
            const fd = GAME.DATA.fruits.find(x => x.id === f);
            notify(`${fd.icon} Parole juste ! ${fd.name} +3`, 'fruit');
          }
        }
        const lines = [{ s: npcDef.name, t: opt.reply }];
        if (choiceDef.after && !opt.good) lines.push({ s: 'Toi', t: choiceDef.after });
        dlgQueue = lines;
        dlgOnDone = onDone;
        $('dialogue-next').style.display = 'block';
        nextLine();
      };
      chDiv.appendChild(b);
    });
  }

  /* ---------- Notifications ---------- */
  function notify(msg, cls) {
    const n = document.createElement('div');
    n.className = 'notif' + (cls ? ' ' + cls : '');
    n.textContent = msg;
    $('notifications').appendChild(n);
    setTimeout(() => n.classList.add('out'), 3400);
    setTimeout(() => n.remove(), 4100);
  }
  let lastToast = 0;
  function toast(msg) { notify(msg); }
  function toastQuick(msg) {
    const now = performance.now();
    if (now - lastToast < 500) return;
    lastToast = now;
    notify(msg);
  }

  /* ---------- Panneau mini-jeu (UI) ---------- */
  function openPanel() {
    busy = true;
    GAME.Player.player.frozen = true;
    $('minigame-panel').style.display = 'flex';
  }
  function closePanel() {
    $('minigame-panel').style.display = 'none';
    busy = false;
    GAME.Player.player.frozen = false;
  }

  /* ---------- Passage d'étape ---------- */
  function showStageUp(stageIdx) {
    const st = GAME.DATA.stages[stageIdx];
    busy = true;
    GAME.Player.player.frozen = true;
    $('stageup-icon').textContent = st.icon;
    $('stageup-title').textContent = st.name;
    $('stageup-text').textContent = GAME.DATA.stageUpTexts[stageIdx] + '\n\n' + st.verse;
    $('stage-up-screen').style.display = 'flex';
    GAME.audio.stageUp();
    GAME.HUD.updateStage();
  }

  function showFinale() {
    busy = true;
    GAME.Player.player.frozen = true;
    $('stageup-icon').textContent = '👑';
    $('stageup-title').textContent = 'Disciple accompli';
    $('stageup-text').textContent =
      "Tu as parcouru LA VOIE : du nouveau-né dans la foi jusqu'au père spirituel qui forme des disciples.\n\n" +
      "Ton armure est complète. Le fruit de l'Esprit mûrit en toi. Et Théopolis est transformée : un blessé relevé, un fils revenu, des voisins réconciliés, trois cœurs ouverts, un disciple formé.\n\n" +
      "« C'est bien, bon et fidèle serviteur… entre dans la joie de ton maître. » — Matthieu 25:21\n\n" +
      "Le monde reste ouvert : explore, cours, trouve les parchemins cachés, bats ton record de course. Le chemin continue.";
    $('stageup-btn').textContent = '✨ Continuer à explorer';
    $('stage-up-screen').style.display = 'flex';
    GAME.audio.stageUp();
  }

  function hideStageUp() {
    $('stage-up-screen').style.display = 'none';
    busy = false;
    GAME.Player.player.frozen = false;
  }

  /* ---------- Événements ---------- */
  function init() {
    $('dialogue-box').addEventListener('click', advance);
    window.addEventListener('keydown', e => {
      if ((e.code === 'Space' || e.code === 'Enter') && busy &&
          $('dialogue-box').style.display !== 'none') {
        advance();
        e.preventDefault();
      }
    });
    $('stageup-btn').addEventListener('click', () => { GAME.audio.ui(); hideStageUp(); });
  }

  return {
    init, dialogue, dialogueChoice, notify, toast, toastQuick,
    openPanel, closePanel, showStageUp, showFinale, isBusy, advance
  };
})();

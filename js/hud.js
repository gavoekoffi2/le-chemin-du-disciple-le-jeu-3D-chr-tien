/* LA VOIE — HUD : minimap, grande carte, journal, horloge, suivi de quête */
GAME.HUD = (function () {
  const $ = id => document.getElementById(id);
  const U = GAME.U;

  /* ---------- Suivi de quête ---------- */
  function updateQuest() {
    const q = GAME.Quests.currentQuest();
    const step = GAME.Quests.currentStep();
    if (!q) {
      $('quest-title').textContent = '🕊 Monde libre';
      $('quest-objective').textContent = 'Explore Théopolis, trouve les parchemins, bats ton record de course.';
      return;
    }
    $('quest-title').textContent = `${q.title}` + (q.parable ? ` · ${q.parable}` : '');
    let obj = step ? step.objective : '';
    if (step && step.type === 'collect') {
      obj += ` (${GAME.state.stepProgress}/${step.count})`;
    }
    $('quest-objective').textContent = obj;
  }

  /* ---------- Étape de maturité ---------- */
  function updateStage() {
    const st = GAME.DATA.stages[GAME.state.stage];
    $('stage-icon').textContent = st.icon;
    $('stage-name').textContent = st.name;
    // progression = quêtes faites dans l'étape courante / total de l'étape
    const inStage = GAME.DATA.quests.filter(q => q.stage === GAME.state.stage);
    const doneCnt = inStage.filter(q => GAME.state.completed.includes(q.id)).length;
    $('stage-progress-fill').style.width = (doneCnt / inStage.length * 100) + '%';
  }

  /* ---------- Horloge ---------- */
  function updateClock() {
    const h = GAME.world.timeOfDay;
    const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    const icon = (h >= 6 && h < 20) ? '☀' : '🌙';
    $('clock').textContent = `${icon} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  /* ---------- Cartes ---------- */
  const MAP_EXTENT = 280;

  function drawMap(ctx, size, centerOn, zoom, rotate) {
    const w = GAME.world;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    // fond
    ctx.fillStyle = '#22301f';
    ctx.fillRect(0, 0, size, size);
    ctx.translate(size / 2, size / 2);
    const s = size / (2 * MAP_EXTENT) * zoom;
    if (rotate !== undefined) ctx.rotate(rotate);
    ctx.scale(s, s);
    if (centerOn) ctx.translate(-centerOn.x, -centerOn.z);

    // parc / champ / eau
    w.mapData.park.forEach(p => { ctx.fillStyle = '#3f6f36'; ctx.fillRect(p.x, p.z, p.w, p.d); });
    w.mapData.field.forEach(p => { ctx.fillStyle = '#6a4a28'; ctx.fillRect(p.x, p.z, p.w, p.d); });
    // routes
    ctx.fillStyle = '#4a4f58';
    w.mapData.roads.forEach(r => ctx.fillRect(r.x, r.z, r.w, r.d));
    // bâtiments
    w.mapData.buildings.forEach(b => {
      ctx.fillStyle = b.color || '#7a828f';
      ctx.fillRect(b.x, b.z, b.w, b.d);
    });
    // eau
    w.mapData.water.forEach(wa => {
      ctx.fillStyle = '#4fa3d7';
      ctx.beginPath(); ctx.arc(wa.x, wa.z, wa.r, 0, 7); ctx.fill();
    });
    // église en surbrillance
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(-9, -23, 18, 30);
    ctx.fillStyle = '#ffd977';
    ctx.font = 'bold 22px serif'; ctx.textAlign = 'center';
    ctx.fillText('✝', 0, -4);

    // lampadaires de quête éteints (orange)
    const step = GAME.Quests.currentStep();
    if (step && step.type === 'collect') {
      GAME.Quests.questEntities().forEach(e => {
        if (e.collected) return;
        ctx.fillStyle = '#ff9933';
        ctx.beginPath(); ctx.arc(e.pos.x, e.pos.z, 5, 0, 7); ctx.fill();
      });
    }

    // objectif courant (étoile dorée clignotante)
    const target = GAME.Quests.getTargetPos && GAME.Quests.getTargetPos();
    if (target) {
      const blink = Math.sin(performance.now() * 0.006) > -0.3;
      if (blink) {
        ctx.fillStyle = '#ffd977';
        ctx.beginPath(); ctx.arc(target.x, target.z, 7, 0, 7); ctx.fill();
        ctx.strokeStyle = '#ffd977'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(target.x, target.z, 12, 0, 7); ctx.stroke();
      }
    }

    // mentors (croix dorées)
    for (const id in GAME.NPCManager.npcs) {
      const npc = GAME.NPCManager.npcs[id];
      if (!npc.visible || !npc.def.mentor) continue;
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath(); ctx.arc(npc.pos.x, npc.pos.z, 4, 0, 7); ctx.fill();
    }

    // joueur (flèche blanche)
    const p = GAME.Player.player;
    ctx.save();
    ctx.translate(p.pos.x, p.pos.z);
    ctx.rotate(-p.yaw + Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(5, 6); ctx.lineTo(-5, 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  let minimapCtx = null, bigmapCtx = null;
  function updateMinimap() {
    if (!minimapCtx) minimapCtx = $('minimap').getContext('2d');
    const p = GAME.Player.player;
    drawMap(minimapCtx, 200, p.pos, 3.2);
  }
  function drawBigMap() {
    if (!bigmapCtx) bigmapCtx = $('bigmap').getContext('2d');
    drawMap(bigmapCtx, 560, { x: 0, z: 0 }, 0.98);
  }

  /* ---------- Journal ---------- */
  function renderJournal() {
    // Quêtes
    const jq = $('jt-quests');
    let html = '';
    GAME.DATA.quests.forEach((q, i) => {
      const doneQ = GAME.state.completed.includes(q.id);
      const activeQ = i === GAME.state.questIndex;
      if (!doneQ && !activeQ && q.stage > GAME.state.stage) return; // pas de spoiler
      const cls = doneQ ? 'done-q' : (activeQ ? 'active-q' : '');
      const stage = GAME.DATA.stages[q.stage];
      html += `<div class="quest-entry ${cls}">
        <h4>${doneQ ? '✅' : (activeQ ? '⭐' : '· ')} ${q.title}${q.parable ? ' <span style="font-weight:normal;font-size:12px;color:#8fa1cf">(' + q.parable + ')</span>' : ''}</h4>
        <p>${q.desc}</p>
        <div class="q-status">${stage.icon} ${stage.name} — ${doneQ ? 'Accomplie' : (activeQ ? 'En cours : ' + (GAME.Quests.currentStep() ? GAME.Quests.currentStep().objective : '') : 'À venir')}</div>
      </div>`;
    });
    jq.innerHTML = html || '<p>Aucune quête pour l\'instant.</p>';

    // Fruits
    const jf = $('jt-fruits');
    let fh = '<p class="fruits-verse">« Le fruit de l\'Esprit, c\'est l\'amour, la joie, la paix, la patience, la bonté, la bienveillance, la fidélité, la douceur, la maîtrise de soi. » — Galates 5:22-23</p>';
    GAME.DATA.fruits.forEach(f => {
      const v = GAME.state.fruits[f.id] || 0;
      fh += `<div class="fruit-row">
        <div class="f-name">${f.icon} ${f.name}</div>
        <div class="f-bar"><div class="f-fill" style="width:${v}%"></div></div>
        <div class="f-val">${v}</div>
      </div>`;
    });
    const total = GAME.DATA.fruits.reduce((a, f) => a + (GAME.state.fruits[f.id] || 0), 0);
    fh += `<p style="text-align:center;margin-top:14px;color:#ffe9b8">Maturité du fruit : <b>${total}</b> / 900</p>`;
    jf.innerHTML = fh;

    // Armure
    const ja = $('jt-armor');
    let ah = '<div class="armor-grid">';
    GAME.DATA.armor.forEach(a => {
      const has = GAME.state.armor.includes(a.id);
      ah += `<div class="armor-item ${has ? '' : 'locked'}">
        <div class="a-icon">${a.icon}</div>
        <div><h4>${a.name}</h4><p>${has ? a.desc + ' ' + a.effet : '??? — Continue ton chemin pour la recevoir.'}</p></div>
      </div>`;
    });
    ah += '</div><p style="text-align:center;margin-top:12px;color:#8fa1cf;font-style:italic">« Revêtez-vous de toutes les armes de Dieu. » — Éphésiens 6:11</p>';
    ja.innerHTML = ah;

    // Versets
    const jv = $('jt-verses');
    if (!GAME.state.versesFound.length) {
      jv.innerHTML = '<p style="color:#8fa1cf">Dix parchemins lumineux sont cachés dans Théopolis. Explore pour les trouver ! (+2 points de fruit chacun)</p>';
    } else {
      let vh = `<p style="color:#8fa1cf;margin-bottom:10px">${GAME.state.versesFound.length} / ${GAME.DATA.hiddenVerses.length} parchemins trouvés</p>`;
      GAME.DATA.hiddenVerses.forEach(v => {
        if (GAME.state.versesFound.includes(v.ref)) {
          vh += `<div class="verse-scroll"><span class="v-ref">📜 ${v.ref}</span> — <span class="v-text">« ${v.text} »</span></div>`;
        }
      });
      jv.innerHTML = vh;
    }
  }

  /* ---------- Panneaux ---------- */
  let journalOpen = false, mapOpen = false;

  function toggleJournal() {
    journalOpen = !journalOpen;
    $('journal').style.display = journalOpen ? 'flex' : 'none';
    GAME.Player.player.frozen = journalOpen || mapOpen;
    if (journalOpen) { renderJournal(); GAME.audio.ui(); }
  }
  function toggleMap() {
    mapOpen = !mapOpen;
    $('map-overlay').style.display = mapOpen ? 'flex' : 'none';
    GAME.Player.player.frozen = journalOpen || mapOpen;
    if (mapOpen) { drawBigMap(); GAME.audio.ui(); }
  }
  function closeAll() {
    journalOpen = mapOpen = false;
    $('journal').style.display = 'none';
    $('map-overlay').style.display = 'none';
    $('controls-screen').style.display = 'none';
    GAME.Player.player.frozen = false;
  }

  function init() {
    // onglets du journal
    document.querySelectorAll('.jtab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.jtab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.jtab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        $(tab.dataset.tab).classList.add('active');
        GAME.audio.ui();
      });
    });
    document.querySelectorAll('.btn-close-panel').forEach(b => {
      b.addEventListener('click', () => { closeAll(); GAME.audio.ui(); });
    });
    window.addEventListener('keydown', e => {
      if (GAME.UI.isBusy()) return;
      if (e.code === 'KeyJ' || e.code === 'Tab') { toggleJournal(); e.preventDefault(); }
      else if (e.code === 'KeyM') toggleMap();
      else if (e.code === 'KeyH') {
        const cs = $('controls-screen');
        cs.style.display = cs.style.display === 'none' ? 'flex' : 'none';
      }
      else if (e.code === 'Escape') closeAll();
      else if (e.code === 'KeyV') {
        const on = GAME.audio.toggle();
        GAME.UI.toast(on ? '🔊 Son activé' : '🔇 Son coupé');
      }
    });
    let mapTimer = 0;
    setInterval(() => { if (mapOpen) drawBigMap(); }, 300);
  }

  return { init, updateQuest, updateStage, updateClock, updateMinimap, toggleJournal, toggleMap, closeAll, renderJournal };
})();

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

    // repère personnalisé (losange violet)
    if (GAME.state.waypoint) {
      const [wx, wz] = GAME.state.waypoint;
      ctx.fillStyle = '#b877ff';
      ctx.save();
      ctx.translate(wx, wz);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();
    }

    // passant à aider (point vert clignotant)
    const kw = GAME.NPCManager.getKindWalker && GAME.NPCManager.getKindWalker();
    if (kw && Math.sin(performance.now() * 0.008) > -0.4) {
      ctx.fillStyle = '#8ed07a';
      ctx.beginPath(); ctx.arc(kw.group.position.x, kw.group.position.z, 5, 0, 7); ctx.fill();
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

    // Carrière
    const jc = $('jt-career');
    const st = GAME.state.stats || {};
    const fmtTime = s => {
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      return h > 0 ? `${h} h ${m} min` : `${m} min`;
    };
    const questsDone = GAME.state.completed.length;
    const armorCount = GAME.state.armor.length;
    const fruitTotal = GAME.DATA.fruits.reduce((a, f) => a + (GAME.state.fruits[f.id] || 0), 0);
    // trophées : conditions simples et lisibles
    const trophies = [
      { icon: '🐑', name: 'Bon berger', done: GAME.state.completed.includes('q02'), desc: 'Ramener les brebis perdues' },
      { icon: '🤝', name: 'Bon Samaritain', done: GAME.state.completed.includes('q04'), desc: 'Secourir l\'homme blessé' },
      { icon: '🛡', name: 'Combattant de la foi', done: armorCount >= 6, desc: 'Réunir toute l\'armure de Dieu' },
      { icon: '📜', name: 'Chercheur de trésors', done: (st.versesFound || 0) >= 5, desc: 'Trouver 5 parchemins cachés' },
      { icon: '💛', name: 'Cœur généreux', done: (st.kindActs || 0) >= 10, desc: 'Accomplir 10 actes de bonté' },
      { icon: '🙏', name: 'Homme de prière', done: (st.prayers || 0) >= 5, desc: 'Prier 5 fois' },
      { icon: '🏃', name: 'Marathonien de la Voie', done: (st.distance || 0) >= 3000, desc: 'Parcourir 3 km à pied' },
      { icon: '👑', name: 'Disciple accompli', done: GAME.state.completed.includes('q15'), desc: 'Terminer le chemin' }
    ];
    const wonCount = trophies.filter(t => t.done).length;
    let ch = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-bottom:18px">
      <div class="career-stat"><span>⏱ Temps de jeu</span><b>${fmtTime(st.playTime || 0)}</b></div>
      <div class="career-stat"><span>🏃 Distance à pied</span><b>${((st.distance || 0) / 1000).toFixed(2)} km</b></div>
      <div class="career-stat"><span>📖 Quêtes accomplies</span><b>${questsDone} / ${GAME.DATA.quests.length}</b></div>
      <div class="career-stat"><span>🛡 Armure de Dieu</span><b>${armorCount} / 6</b></div>
      <div class="career-stat"><span>🤝 Actes de bonté</span><b>${st.kindActs || 0}</b></div>
      <div class="career-stat"><span>🙏 Prières</span><b>${st.prayers || 0}</b></div>
      <div class="career-stat"><span>📜 Parchemins</span><b>${st.versesFound || 0} / ${GAME.DATA.hiddenVerses.length}</b></div>
      <div class="career-stat"><span>🌱 Fruit de l'Esprit</span><b>${fruitTotal} / 900</b></div>
      <div class="career-stat"><span>🏁 Record de course</span><b>${GAME.state.bestRace ? GAME.U.formatTime(GAME.state.bestRace) : '—'}</b></div>
      <div class="career-stat"><span>🏆 Trophées</span><b>${wonCount} / ${trophies.length}</b></div>
    </div>
    <h4 style="color:#ffd987;margin:10px 0 8px;text-align:center">🏆 Trophées</h4>
    <div class="trophy-grid">`;
    trophies.forEach(t => {
      ch += `<div class="trophy ${t.done ? 'won' : ''}">
        <div class="t-icon">${t.done ? t.icon : '🔒'}</div>
        <div><h4>${t.name}</h4><p>${t.desc}</p></div>
      </div>`;
    });
    ch += '</div>';
    jc.innerHTML = ch;
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
    // clic sur la grande carte : pose / retire un repère personnalisé
    $('bigmap').addEventListener('click', e => {
      const rect = $('bigmap').getBoundingClientRect();
      const px = (e.clientX - rect.left) * 560 / rect.width;
      const pz = (e.clientY - rect.top) * 560 / rect.height;
      const s = 560 / (2 * MAP_EXTENT) * 0.98;
      const wx = (px - 280) / s, wz = (pz - 280) / s;
      if (Math.abs(wx) > MAP_EXTENT || Math.abs(wz) > MAP_EXTENT) return;
      if (GAME.state.waypoint && Math.hypot(GAME.state.waypoint[0] - wx, GAME.state.waypoint[1] - wz) < 25) {
        GAME.state.waypoint = null;
        GAME.UI.toast('📍 Repère retiré.');
      } else {
        GAME.state.waypoint = [wx, wz];
        GAME.UI.toast('📍 Repère posé — suis la colonne violette !');
      }
      GAME.audio.ui();
      GAME.save();
      drawBigMap();
    });

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

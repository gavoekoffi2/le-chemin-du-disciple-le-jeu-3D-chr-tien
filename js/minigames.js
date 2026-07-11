/* ============================================================
   LA VOIE — mini-jeux
   3D : sower (le Semeur), shield (traits enflammés), race (persévérance)
   UI : verses (versets à reconstituer), quiz (grand quiz biblique)
   ============================================================ */
GAME.Minigames = (function () {
  const U = GAME.U;
  let scene = null, world = null;
  let active = null;       // { game, ... }
  const hud = () => document.getElementById('minigame-hud');

  function init(sc, w) { scene = sc; world = w; }

  function showHud(html) { const h = hud(); h.style.display = 'block'; h.innerHTML = html; }
  function hideHud() { hud().style.display = 'none'; }

  function start(game, freeMode) {
    stop();
    if (game === 'sower') startSower();
    else if (game === 'shield') startShield();
    else if (game === 'race') startRace(freeMode);
    else if (game === 'verses') startVerses();
    else if (game === 'quiz') startQuiz(freeMode);
  }

  function stop() {
    if (active && active.objects) active.objects.forEach(o => scene.remove(o));
    active = null;
    hideHud();
  }

  function done(game, success) {
    const free = active && active.freeMode;
    stop();
    if (!free) GAME.Quests.onMinigameDone(game, success);
  }

  /* ================= LE SEMEUR ================= */
  function startSower() {
    const FX = -216, FZ = 216, R = 26;
    const objects = [];
    const patches = [];
    // 10 bonnes terres + 5 épines
    const taken = [];
    function spot() {
      for (let k = 0; k < 40; k++) {
        const x = FX + U.rand(-R, R), z = FZ + U.rand(-R, R);
        if (taken.every(p => Math.hypot(p[0] - x, p[1] - z) > 6)) { taken.push([x, z]); return [x, z]; }
      }
      return [FX + U.rand(-R, R), FZ + U.rand(-R, R)];
    }
    for (let i = 0; i < 10; i++) {
      const [x, z] = spot();
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 14),
        new THREE.MeshBasicMaterial({ color: 0xffd977, transparent: true, opacity: 0.75 }));
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(x, 0.3, z);
      scene.add(disc); objects.push(disc);
      patches.push({ x, z, good: true, mesh: disc, done: false });
    }
    for (let i = 0; i < 5; i++) {
      const [x, z] = spot();
      const g = new THREE.Group();
      for (let s = 0; s < 5; s++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.1, 5), GAME.mat(0x3a4a2a));
        spike.position.set(U.rand(-0.8, 0.8), 0.55, U.rand(-0.8, 0.8));
        g.add(spike);
      }
      g.position.set(x, 0.2, z);
      scene.add(g); objects.push(g);
      patches.push({ x, z, good: false, mesh: g, done: false });
    }
    active = { game: 'sower', objects, patches, sown: 0, need: 10, time: 90, slowUntil: 0 };
    GAME.UI.toast('🌾 Marche sur les parcelles DORÉES pour y semer. Évite les épines !');
  }

  function updateSower(dt) {
    const a = active;
    a.time -= dt;
    const p = GAME.Player.player.pos;
    a.patches.forEach(pt => {
      if (pt.done) return;
      if (U.dist2D(p.x, p.z, pt.x, pt.z) < 1.7) {
        pt.done = true;
        if (pt.good) {
          a.sown++;
          pt.mesh.material.color.setHex(0x6bc36b);
          GAME.audio.pickup();
          // pousse instantanée : petite tige de blé
          const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.6, 6), GAME.mat(0xd8c060));
          stalk.position.set(pt.x, 0.9, pt.z);
          scene.add(stalk); a.objects.push(stalk);
        } else {
          GAME.audio.fail();
          GAME.UI.toast('🌵 Épines ! « Les soucis étouffent la Parole… » Continue !');
          setTimeout(() => { pt.done = false; }, 2500);
        }
      }
    });
    showHud(`🌾 Semées : <b>${a.sown} / ${a.need}</b> &nbsp;·&nbsp; ⏱ ${Math.max(0, a.time).toFixed(0)}s
      <div class="mg-sub">Marche sur les parcelles dorées — évite les épines</div>`);
    if (a.sown >= a.need) { GAME.UI.notify('🌾 Bonne terre ensemencée !'); done('sower', true); }
    else if (a.time <= 0) {
      GAME.UI.toast('⏱ Le soir tombe… On recommence : la persévérance fait partie de la leçon !');
      GAME.audio.fail();
      startSower();
    }
  }

  /* ================= TRAITS ENFLAMMÉS ================= */
  function startShield() {
    const CX = 216, CZ = -216, R = 13;
    active = {
      game: 'shield', objects: [], darts: [], blocked: 0, need: 12,
      nextIn: 1.2, cx: CX, cz: CZ, r: R
    };
    GAME.UI.toast('🛡 Place-toi sur les cercles rouges pour bloquer les traits avec ton bouclier !');
  }

  function updateShield(dt, t) {
    const a = active;
    const p = GAME.Player.player.pos;
    a.nextIn -= dt;
    if (a.nextIn <= 0) {
      a.nextIn = U.rand(1.3, 2.0);
      // point d'impact près du joueur mais dans l'arène
      const ang = Math.random() * Math.PI * 2;
      const dist = U.rand(2, 6);
      let ix = p.x + Math.cos(ang) * dist, iz = p.z + Math.sin(ang) * dist;
      const dc = Math.hypot(ix - a.cx, iz - a.cz);
      if (dc > a.r) { ix = a.cx + (ix - a.cx) / dc * a.r; iz = a.cz + (iz - a.cz) / dc * a.r; }
      const iy = world.groundHeight(ix, iz);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.5, 18),
        new THREE.MeshBasicMaterial({ color: 0xff5533, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(ix, iy + 0.15, iz);
      scene.add(ring);
      const dart = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.6, 6),
        new THREE.MeshBasicMaterial({ color: 0xff8833 }));
      dart.rotation.x = Math.PI;
      dart.position.set(ix, iy + 26, iz);
      scene.add(dart);
      a.objects.push(ring, dart);
      a.darts.push({ ring, dart, x: ix, y: iy, z: iz, fall: 1.6 });
    }
    for (let i = a.darts.length - 1; i >= 0; i--) {
      const d = a.darts[i];
      d.fall -= dt;
      d.dart.position.y = d.y + Math.max(0, d.fall / 1.6) * 26;
      d.ring.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(t * 6));
      if (d.fall <= 0) {
        const hit = U.dist2D(p.x, p.z, d.x, d.z) < 1.8;
        if (hit) {
          a.blocked++;
          GAME.audio.block();
          GAME.UI.toastQuick('🛡 Bloqué ! (' + a.blocked + '/' + a.need + ')');
        }
        scene.remove(d.ring); scene.remove(d.dart);
        a.darts.splice(i, 1);
      }
    }
    showHud(`🛡 Traits bloqués : <b>${a.blocked} / ${a.need}</b>
      <div class="mg-sub">Cours sur le cercle rouge avant l'impact — « le bouclier de la foi » (Éph. 6:16)</div>`);
    if (a.blocked >= a.need) { GAME.UI.notify('🛡 Ta foi a tenu bon !'); done('shield', true); }
  }

  /* ================= COURSE DE LA PERSÉVÉRANCE ================= */
  const RACE_PATH = [
    [186, -186], [150, -181], [110, -172], [108, -130], [108, -80],
    [104, -38], [72, -36], [38, -34], [36, 6], [36, 48], [14, 72], [0, 92]
  ];
  function startRace(freeMode) {
    const objects = [];
    const rings = [];
    RACE_PATH.forEach((pt, i) => {
      const next = RACE_PATH[Math.min(i + 1, RACE_PATH.length - 1)];
      const yaw = Math.atan2(next[0] - pt[0], next[1] - pt[1]);
      const torus = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.18, 8, 22),
        new THREE.MeshBasicMaterial({ color: i === 0 ? 0x6bc3ff : 0xffd977, transparent: true, opacity: 0.9 }));
      const y = world.groundHeight(pt[0], pt[1]);
      torus.position.set(pt[0], y + 2.2, pt[1]);
      torus.rotation.y = yaw;
      scene.add(torus);
      objects.push(torus);
      rings.push({ x: pt[0], z: pt[1], mesh: torus, passed: false });
    });
    active = { game: 'race', objects, rings, idx: 0, time: 95, elapsed: 0, freeMode: !!freeMode };
    GAME.UI.toast('🏁 Franchis tous les anneaux avant la fin du chrono ! (Maj pour courir)');
  }

  function updateRace(dt) {
    const a = active;
    a.time -= dt; a.elapsed += dt;
    const p = GAME.Player.player.pos;
    const cur = a.rings[a.idx];
    if (cur) {
      cur.mesh.material.color.setHex(0x6bc3ff);
      cur.mesh.rotation.z += dt * 2;
      if (U.dist2D(p.x, p.z, cur.x, cur.z) < 3.0) {
        cur.passed = true;
        cur.mesh.material.color.setHex(0x6bc36b);
        cur.mesh.material.opacity = 0.25;
        GAME.audio.pickup();
        a.idx++;
      }
    }
    showHud(`🏁 Anneaux : <b>${a.idx} / ${a.rings.length}</b> &nbsp;·&nbsp; ⏱ ${Math.max(0, a.time).toFixed(1)}s
      <div class="mg-sub">« Courons avec persévérance » — Hébreux 12:1${GAME.state.bestRace ? ' · Record : ' + U.formatTime(GAME.state.bestRace) : ''}</div>`);
    if (a.idx >= a.rings.length) {
      const tt = a.elapsed;
      if (!GAME.state.bestRace || tt < GAME.state.bestRace) {
        GAME.state.bestRace = tt;
        GAME.UI.notify(`🏆 NOUVEAU RECORD : ${U.formatTime(tt)} !`);
      } else {
        GAME.UI.notify(`🏁 Course terminée en ${U.formatTime(tt)} !`);
      }
      GAME.save();
      done('race', true);
    } else if (a.time <= 0) {
      GAME.UI.toast('⏱ Trop tard… mais la persévérance, c\'est repartir ! Nouvelle tentative.');
      GAME.audio.fail();
      const wasFree = a.freeMode;
      startRace(wasFree);
    }
  }

  /* ================= VERSETS À RECONSTITUER (UI) ================= */
  function startVerses() {
    active = { game: 'verses', objects: [], round: 0, verses: U.shuffle(GAME.DATA.memoryVerses).slice(0, 3) };
    GAME.UI.openPanel();
    renderVerseRound();
  }

  function renderVerseRound() {
    const a = active;
    const v = a.verses[a.round];
    const box = document.getElementById('minigame-panel-box');
    const shuffled = U.shuffle(v.words.map((w, i) => ({ w, i })));
    let placed = [];
    box.innerHTML = `<h2>📜 La Parole dans le cœur — ${a.round + 1}/3</h2>
      <p class="mg-question">Remets le verset dans l'ordre <i>(${v.ref})</i> :</p>
      <div class="mg-slots" id="mg-slots">…</div>
      <div class="mg-words" id="mg-words"></div>
      <div class="mg-feedback" id="mg-feedback"></div>
      <button class="btn-main btn-secondary" id="mg-reset" style="min-width:140px;font-size:14px">↺ Recommencer</button>`;
    const wordsDiv = box.querySelector('#mg-words');
    const slotsDiv = box.querySelector('#mg-slots');
    const feedback = box.querySelector('#mg-feedback');

    function render() {
      slotsDiv.textContent = placed.length ? placed.map(p => p.w).join(' ') : '…';
    }
    shuffled.forEach(item => {
      const b = document.createElement('button');
      b.className = 'mg-word';
      b.textContent = item.w;
      b.onclick = () => {
        if (b.classList.contains('placed')) return;
        b.classList.add('placed');
        placed.push(item);
        render();
        GAME.audio.ui();
        if (placed.length === v.words.length) {
          // comparaison par mot (robuste quand un même mot apparaît deux fois)
          const ok = placed.every((p, idx) => p.w === v.words[idx]);
          if (ok) {
            feedback.innerHTML = '✅ <b>Parfait !</b> « ' + v.words.join(' ') + ' » — ' + v.ref;
            GAME.audio.success();
            setTimeout(() => {
              a.round++;
              if (a.round >= 3) { GAME.UI.closePanel(); done('verses', true); }
              else renderVerseRound();
            }, 1600);
          } else {
            feedback.textContent = '❌ Ce n\'est pas tout à fait ça… Recommence !';
            GAME.audio.fail();
            setTimeout(() => { placed = []; render(); box.querySelectorAll('.mg-word').forEach(x => x.classList.remove('placed')); feedback.textContent = ''; }, 1200);
          }
        }
      };
      wordsDiv.appendChild(b);
    });
    box.querySelector('#mg-reset').onclick = () => {
      placed = []; render();
      box.querySelectorAll('.mg-word').forEach(x => x.classList.remove('placed'));
    };
    render();
  }

  /* ================= GRAND QUIZ BIBLIQUE (UI) ================= */
  function startQuiz(freeMode) {
    active = { game: 'quiz', objects: [], qs: U.shuffle(GAME.DATA.quiz).slice(0, 8), idx: 0, score: 0, freeMode: !!freeMode };
    GAME.UI.openPanel();
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const a = active;
    const box = document.getElementById('minigame-panel-box');
    if (a.idx >= a.qs.length) {
      const ok = a.score >= 6;
      const free = a.freeMode;
      box.innerHTML = `<h2>${ok ? '🎉 ' + (free ? 'Belle révision !' : 'Examen réussi !') : '📚 Presque…'}</h2>
        <p class="mg-question">Score : <b>${a.score} / ${a.qs.length}</b> ${ok ? '— « Tu as bien manié l\'épée de l\'Esprit ! »' : '— il faut 6 bonnes réponses. « Étudie, et reviens ! »'}</p>
        <div class="mg-options"><button class="btn-main" id="mg-quiz-end">${ok ? (free ? 'Fermer' : 'Recevoir l\'Épée de l\'Esprit') : (free ? 'Fermer' : 'Réessayer')}</button></div>`;
      box.querySelector('#mg-quiz-end').onclick = () => {
        if (ok && free) {
          // récompense de révision : fidélité +1
          GAME.state.fruits.fidelite = Math.min(100, GAME.state.fruits.fidelite + 1);
          GAME.UI.notify('⚓ Fidélité +1 — la Parole se garde en la révisant !', 'fruit');
          GAME.save();
        }
        if (ok || free) { GAME.UI.closePanel(); done('quiz', ok); }
        else startQuiz(false);
      };
      if (ok) GAME.audio.success(); else GAME.audio.fail();
      return;
    }
    const q = a.qs[a.idx];
    // mélange des options en gardant la bonne réponse traçée
    const opts = U.shuffle(q.opts.map((t, i) => ({ t, correct: i === q.a })));
    box.innerHTML = `<h2>⚔ Grand quiz biblique — ${a.idx + 1}/${a.qs.length}</h2>
      <p class="mg-question">${q.q}</p>
      <div class="mg-options" id="mg-opts"></div>
      <div class="mg-score">Score : ${a.score} · Référence : ${q.ref}</div>`;
    const optsDiv = box.querySelector('#mg-opts');
    let answered = false;
    opts.forEach(o => {
      const b = document.createElement('button');
      b.className = 'mg-opt';
      b.textContent = o.t;
      b.onclick = () => {
        if (answered) return;
        answered = true;
        if (o.correct) { b.classList.add('correct'); a.score++; GAME.audio.pickup(); }
        else {
          b.classList.add('wrong');
          GAME.audio.fail();
          optsDiv.querySelectorAll('.mg-opt').forEach((x, xi) => { if (opts[xi].correct) x.classList.add('correct'); });
        }
        setTimeout(() => { a.idx++; renderQuizQuestion(); }, 1100);
      };
      optsDiv.appendChild(b);
    });
  }

  /* ================= boucle ================= */
  function update(dt, t) {
    if (!active) return;
    if (active.game === 'sower') updateSower(dt);
    else if (active.game === 'shield') updateShield(dt, t);
    else if (active.game === 'race') updateRace(dt);
  }

  function isRunning3D() {
    return active && ['sower', 'shield', 'race'].includes(active.game);
  }

  return { init, start, stop, update, isRunning3D, activeGame: () => active && active.game, _debug: () => active };
})();

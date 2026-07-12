/* ============================================================
   LA VOIE — L'Éveil du Disciple : point d'entrée
   ============================================================ */
(function () {
  const U = GAME.U;
  const $ = id => document.getElementById(id);
  let renderer, scene, camera, clock;
  let started = false;
  let saveTimer = 0, promptEl, promptLabel;

  function viewportSize() {
    const vv = window.visualViewport;
    return {
      w: Math.max(window.innerWidth || 0, vv ? vv.width : 0),
      h: Math.max(window.innerHeight || 0, vv ? vv.height : 0)
    };
  }

  function syncViewportSize() {
    const size = viewportSize();
    document.documentElement.style.setProperty('--app-width', size.w + 'px');
    document.documentElement.style.setProperty('--app-height', size.h + 'px');
    return size;
  }

  /* ---------- Écran titre ---------- */
  function initTitle() {
    if (GAME.hasSave()) $('btn-continue').style.display = 'inline-block';
    $('btn-new-game').addEventListener('click', () => {
      GAME.clearSave();
      GAME.state = GAME.newState();
      launch();
    });
    $('btn-continue').addEventListener('click', () => {
      GAME.state = GAME.loadSave() || GAME.newState();
      launch();
    });
    $('btn-controls').addEventListener('click', () => {
      $('controls-screen').style.display = 'flex';
      GAME.audio.ui();
    });
  }

  function isMobileDevice() {
    return window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 720;
  }

  function hideLoadingScreen() {
    const loading = $('loading-screen');
    if (loading) loading.style.display = 'none';
  }

  function createRenderer(canvas, mobile) {
    const attempts = [
      { antialias: !mobile, powerPreference: mobile ? 'default' : 'high-performance' },
      { antialias: false, powerPreference: 'default', failIfMajorPerformanceCaveat: false },
      { antialias: false, alpha: false, stencil: false, depth: true, preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: false }
    ];
    let lastErr = null;
    for (const opts of attempts) {
      try {
        return new THREE.WebGLRenderer(Object.assign({ canvas }, opts));
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('WebGL indisponible');
  }

  function startLiteMode(err) {
    console.error('Démarrage en mode léger mobile', err);
    hideLoadingScreen();
    $('game-container').style.display = 'block';
    $('quest-title').textContent = 'Le premier pas';
    $('quest-objective').textContent = "Rejoins le parvis de l'église de la Grâce (suis le marqueur doré).";
    $('quest-distance').textContent = '➤ à 86 m';
    $('stage-name').textContent = 'Nouveau-né dans la foi';
    $('clock').textContent = '☀ 08:00';

    let canvas = $('game-canvas');
    let ctx = canvas.getContext('2d');
    if (!ctx) {
      const fresh = document.createElement('canvas');
      fresh.id = 'game-canvas';
      fresh.style.width = canvas.style.width;
      fresh.style.height = canvas.style.height;
      canvas.replaceWith(fresh);
      canvas = fresh;
      ctx = canvas.getContext('2d');
    }
    if (!ctx) return;
    const size = syncViewportSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.floor(size.w * dpr));
    canvas.height = Math.max(1, Math.floor(size.h * dpr));
    canvas.style.width = size.w + 'px';
    canvas.style.height = size.h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let px = size.w * 0.5, py = size.h * 0.76;
    let targetX = size.w * 0.5, targetY = size.h * 0.28;
    function draw() {
      const w = size.w, h = size.h;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1d2947'); grad.addColorStop(0.55, '#253d2c'); grad.addColorStop(1, '#101722');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#3e4650'; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.moveTo(0, h*0.55); ctx.lineTo(w, h*0.55); ctx.stroke();
      ctx.strokeStyle = '#d8c47a'; ctx.lineWidth = 2; ctx.setLineDash([16, 16]);
      ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#d8a93e'; ctx.beginPath(); ctx.arc(targetX, targetY, 18 + Math.sin(Date.now()/220)*4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff1b8'; ctx.font = 'bold 15px Georgia'; ctx.textAlign = 'center'; ctx.fillText('Église de la Grâce', targetX, targetY - 28);
      ctx.fillStyle = '#77c36b'; ctx.beginPath(); ctx.arc(px, py, 15, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = '13px Arial'; ctx.fillText('Théophilis', px, py - 22);
      ctx.fillStyle = 'rgba(10,14,28,.72)'; ctx.fillRect(18, h - 86, w - 36, 56);
      ctx.fillStyle = '#ffe9b8'; ctx.font = '14px Georgia'; ctx.textAlign = 'left';
      ctx.fillText('Mode mobile léger : touche l’écran vers la lumière dorée.', 30, h - 52);
      requestAnimationFrame(draw);
    }
    function moveToward(x, y) {
      px += (x - px) * 0.18;
      py += (y - py) * 0.18;
      const dist = Math.hypot(px - targetX, py - targetY);
      $('quest-distance').textContent = dist < 34 ? '➤ tu y es !' : '➤ à ' + Math.max(1, Math.round(dist / 6)) + ' m';
      if (dist < 34) $('quest-objective').textContent = 'Tu es arrivé au parvis. La suite arrive dans la version 3D.';
    }
    canvas.addEventListener('pointerdown', e => moveToward(e.clientX, e.clientY));
    canvas.addEventListener('pointermove', e => { if (e.buttons || e.pressure) moveToward(e.clientX, e.clientY); });
    draw();
    if (GAME.UI && GAME.UI.notify) GAME.UI.notify('🕊 Mode mobile léger activé. Avance vers la lumière dorée.');
  }

  function launch() {
    $('title-screen').style.display = 'none';
    GAME.audio.startAmbient();
    if (!started) {
      started = true;
      // laisse le navigateur peindre l'écran de chargement avant la construction du monde
      $('loading-screen').style.display = 'flex';

      // Sécurité mobile : sur certains téléphones WebGL prend plus de temps ou saute une frame.
      // On ne laisse jamais l'utilisateur prisonnier de l'écran "Théopolis s'éveille…".
      const loadingWatchdog = setTimeout(() => {
        if ($('game-container').style.display !== 'none') {
          hideLoadingScreen();
          if (GAME.UI && GAME.UI.notify) GAME.UI.notify('🕊 Théopolis est prête. Avance vers la lumière dorée.');
        }
      }, isMobileDevice() ? 4500 : 7000);

      setTimeout(() => {
        $('game-container').style.display = 'block';
        try {
          initGame();
        } catch (err) {
          clearTimeout(loadingWatchdog);
          startLiteMode(err);
        }
      }, 60);
    } else {
      $('game-container').style.display = 'block';
      hideLoadingScreen();
    }
  }

  /* ---------- Initialisation 3D ---------- */
  function initGame() {
    const canvas = $('game-canvas');
    const initialSize = syncViewportSize();
    const mobile = isMobileDevice();
    renderer = createRenderer(canvas, mobile);
    renderer.setSize(initialSize.w, initialSize.h, false);
    renderer.setPixelRatio(mobile ? Math.min(window.devicePixelRatio || 1, 1.25) : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !mobile;
    if (!mobile) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // rendu cinématographique : couleurs sRGB + tone mapping filmique
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    GAME.renderer = renderer;

    scene = new THREE.Scene();
    GAME.scene = scene;
    camera = new THREE.PerspectiveCamera(60, initialSize.w / initialSize.h, 0.1, 900);

    const handleResize = () => {
      const size = syncViewportSize();
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
      renderer.setSize(size.w, size.h);
    };
    window.addEventListener('resize', handleResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', handleResize);

    // monde
    GAME.world = GAME.buildCity(scene);
    GAME.world.timeOfDay = GAME.state.timeOfDay || 8.5;

    // acteurs
    GAME.NPCManager.spawnAll(scene, GAME.world);
    GAME.NPCManager.updateVisibility();
    GAME.Player.init(scene, camera, canvas);
    GAME.Bike.build(scene, GAME.world);

    // systèmes
    GAME.UI.init();
    GAME.HUD.init();
    GAME.Minigames.init(scene, GAME.world);
    GAME.Quests.init(scene, GAME.world);
    GAME.HUD.updateStage();
    GAME.HUD.updateQuest();

    promptEl = $('interact-prompt');
    promptLabel = $('interact-label');

    // touches d'action
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyE' && !GAME.UI.isBusy()) doInteract();
      if (e.code === 'KeyF' && !GAME.UI.isBusy()) GAME.Bike.toggle(GAME.Player.player);
    });

    clock = new THREE.Clock();
    loop();

    // message d'accueil
    if (GAME.state.questIndex === 0 && GAME.state.stepIndex === 0) {
      setTimeout(() => {
        GAME.UI.notify('🕊 Bienvenue à Théopolis. Suis la colonne de lumière dorée !');
      }, 1200);
    } else {
      GAME.UI.notify('↻ Partie reprise. Bon chemin, disciple !');
    }
  }

  /* ---------- Lieux de prière ---------- */
  const PRAYER_SPOTS = [
    { x: 0, z: 16, label: "Prier devant l'église", cd: 0,
      verse: "« Demandez, et l'on vous donnera ; cherchez, et vous trouverez. » — Matthieu 7:7" },
    { x: 216, z: -224, label: 'Prier au pied de la croix', cd: 0,
      verse: "« Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos. » — Matthieu 11:28" }
  ];

  function pray(spot) {
    const p = GAME.Player.player;
    p.frozen = true;
    GAME.audio.bell();
    GAME.UI.notify('🙏 ' + spot.verse);
    spot.cd = performance.now() + 90000; // 90 s de recueillement entre deux prières
    setTimeout(() => {
      p.frozen = false;
      ['paix', 'joie'].forEach(f => {
        GAME.state.fruits[f] = Math.min(100, GAME.state.fruits[f] + 1);
      });
      GAME.UI.notify('🕊 Paix +1 · ☀ Joie +1', 'fruit');
      GAME.save();
    }, 2200);
  }

  /* ---------- Interactions (E) ---------- */
  // renvoie la meilleure interaction disponible { label, action }
  function findInteraction() {
    const p = GAME.Player.player;
    if (p.onBike) return null;
    const ppos = p.pos;

    // 1. PNJ cible de l'étape "talk" en cours
    const step = GAME.Quests.currentStep();
    if (step && step.type === 'talk') {
      const npc = GAME.NPCManager.get(step.npc);
      if (npc && npc.visible && npc.pos.distanceTo(ppos) < 3.2) {
        return { label: 'Parler à ' + npc.def.name, action: () => GAME.Quests.handleNpcInteract(step.npc) };
      }
    }
    // 2. entité de quête (brebis, lampadaire, personne à aider…)
    const ent = GAME.Quests.nearestEntity(ppos, 2.6);
    if (ent) return { label: ent.label, action: () => GAME.Quests.handleEntityInteract(ent) };

    // 3. reprise de la course (défi compétitif) après l'avoir débloquée
    if (GAME.state.completed.includes('q09') && !GAME.Minigames.isRunning3D() &&
        U.dist2D(ppos.x, ppos.z, 186, -186) < 4) {
      return { label: 'Relancer la course de la persévérance', action: () => GAME.Minigames.start('race', true) };
    }

    // 3 bis. lieux de prière
    for (const spot of PRAYER_SPOTS) {
      if (performance.now() < spot.cd) continue;
      if (U.dist2D(ppos.x, ppos.z, spot.x, spot.z) < 4) {
        return { label: spot.label, action: () => pray(spot) };
      }
    }

    // 4. véhicules (vélo / voiture)
    if (GAME.Bike.getBike()) {
      const vt = GAME.Bike.nearestType(ppos);
      return {
        label: vt === 'car' ? 'Monter dans la voiture (touche F)' : 'Monter sur le vélo (touche F)',
        action: () => GAME.Bike.toggle(p)
      };
    }

    // 4 bis. réviser la Parole : quiz libre à la bibliothèque (après la quête de l'Épée)
    if (GAME.state.completed.includes('q12') && !GAME.Minigames.activeGame() &&
        U.dist2D(ppos.x, ppos.z, 78, 12) < 5) {
      return { label: 'Réviser la Parole (quiz libre)', action: () => GAME.Minigames.start('quiz', true) };
    }

    // 5. n'importe quel PNJ visible : petite phrase
    let bestNpc = null, bd = 3;
    for (const id in GAME.NPCManager.npcs) {
      const npc = GAME.NPCManager.npcs[id];
      if (!npc.visible || !npc.def.idle) continue;
      const d = npc.pos.distanceTo(ppos);
      if (d < bd) { bd = d; bestNpc = npc; }
    }
    if (bestNpc) {
      return {
        label: 'Parler à ' + bestNpc.def.name,
        action: () => GAME.UI.dialogue(bestNpc.def, [{ s: bestNpc.def.name, t: bestNpc.def.idle }])
      };
    }

    // 6. passant ambiant
    const w = GAME.NPCManager.nearestWalker(ppos, 2.4);
    if (w) {
      return {
        label: 'Saluer',
        action: () => GAME.UI.toast('💬 « ' + U.pick(GAME.DATA.ambientLines) + ' »')
      };
    }
    return null;
  }

  function doInteract() {
    const it = findInteraction();
    if (it) it.action();
  }

  // API publique utilisée par les contrôles tactiles mobiles.
  // Les fonctions clavier restent inchangées pour ordinateur.
  GAME.controls = {
    interact: doInteract,
    vehicle: () => GAME.Bike.toggle(GAME.Player.player)
  };

  /* ---------- Parchemins (ramassage automatique) ---------- */
  function checkScrolls() {
    const ppos = GAME.Player.player.pos;
    GAME.world.scrolls.forEach(s => {
      if (s.taken) return;
      if (U.dist2D(s.pos.x, s.pos.z, ppos.x, ppos.z) < 2.2) {
        s.taken = true;
        scene.remove(s.mesh);
        GAME.state.versesFound.push(s.ref);
        // +2 sur deux fruits aléatoires
        for (let i = 0; i < 2; i++) {
          const f = U.pick(GAME.DATA.fruits);
          GAME.state.fruits[f.id] = Math.min(100, GAME.state.fruits[f.id] + 2);
        }
        GAME.audio.bell();
        GAME.UI.notify(`📜 Parchemin trouvé : ${s.ref} — « ${s.text} »`, 'armor');
        GAME.save();
      }
    });
    // masque les parchemins déjà pris lors d'une reprise de sauvegarde
  }

  function applySavedScrolls() {
    GAME.world.scrolls.forEach(s => {
      if (GAME.state.versesFound.includes(s.ref)) {
        s.taken = true;
        scene.remove(s.mesh);
      }
    });
  }

  /* ---------- Boucle ---------- */
  let scrollsApplied = false, minimapCd = 0, frameNo = 0, lastHour = -1;
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!scrollsApplied) { applySavedScrolls(); scrollsApplied = true; }

    // masque l'écran de chargement dès que le monde tourne
    frameNo++;
    if (frameNo === 3) $('loading-screen').style.display = 'none';

    // cloches de l'église à 8h, 12h et 18h
    const hour = Math.floor(GAME.world.timeOfDay);
    if (hour !== lastHour) {
      lastHour = hour;
      if (hour === 8 || hour === 12 || hour === 18) {
        GAME.audio.bell();
        setTimeout(() => GAME.audio.bell(), 900);
        GAME.UI.toastQuick('🔔 Les cloches de l\'église de la Grâce sonnent…');
      }
    }

    GAME.Player.update(dt, t);
    GAME.NPCManager.update(dt, t, GAME.Player.player.pos);
    GAME.Quests.update(dt, t);
    GAME.Minigames.update(dt, t);
    GAME.world.updateTraffic(dt);
    GAME.world.updateDayNight(dt, GAME.Player.player.pos);
    GAME.world.dynamic.forEach(fn => fn(t));
    checkScrolls();

    // invite d'interaction
    if (!GAME.UI.isBusy()) {
      const it = findInteraction();
      if (it) {
        promptEl.style.display = 'block';
        promptLabel.textContent = it.label;
      } else promptEl.style.display = 'none';
    } else promptEl.style.display = 'none';

    // HUD
    minimapCd -= dt;
    if (minimapCd <= 0) {
      minimapCd = 0.12;
      GAME.HUD.updateMinimap();
      GAME.HUD.updateClock();
      // distance vers l'objectif
      const target = GAME.Quests.getTargetPos();
      const distEl = $('quest-distance');
      if (target) {
        const d = U.dist2D(target.x, target.z, GAME.Player.player.pos.x, GAME.Player.player.pos.z);
        distEl.textContent = d > 8 ? '➤ à ' + Math.round(d) + ' m' : '➤ tu y es !';
      } else distEl.textContent = '';
    }

    // sauvegarde périodique
    saveTimer += dt;
    if (saveTimer > 8) { saveTimer = 0; GAME.save(); }

    renderer.render(scene, camera);
  }

  /* ---------- Démarrage ---------- */
  window.addEventListener('DOMContentLoaded', initTitle);
})();

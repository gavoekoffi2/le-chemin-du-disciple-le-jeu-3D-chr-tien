/* ============================================================
   LA VOIE — L'Éveil du Disciple : point d'entrée
   ============================================================ */
(function () {
  const U = GAME.U;
  const $ = id => document.getElementById(id);
  let renderer, scene, camera, clock;
  let started = false;
  let saveTimer = 0, promptEl, promptLabel;

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

  function launch() {
    $('title-screen').style.display = 'none';
    $('game-container').style.display = 'block';
    GAME.audio.startAmbient();
    if (!started) { started = true; initGame(); }
  }

  /* ---------- Initialisation 3D ---------- */
  function initGame() {
    const canvas = $('game-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    GAME.renderer = renderer;

    scene = new THREE.Scene();
    GAME.scene = scene;
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 900);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

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

    // 4. vélo
    const bike = GAME.Bike.getBike();
    if (bike && U.dist2D(bike.position.x, bike.position.z, ppos.x, ppos.z) < 3) {
      return { label: 'Monter sur le vélo (touche F)', action: () => GAME.Bike.toggle(p) };
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
  let scrollsApplied = false, minimapCd = 0;
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!scrollsApplied) { applySavedScrolls(); scrollsApplied = true; }

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
    }

    // sauvegarde périodique
    saveTimer += dt;
    if (saveTimer > 8) { saveTimer = 0; GAME.save(); }

    renderer.render(scene, camera);
  }

  /* ---------- Démarrage ---------- */
  window.addEventListener('DOMContentLoaded', initTitle);
})();

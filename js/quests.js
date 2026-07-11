/* ============================================================
   LA VOIE — moteur de quêtes
   Étapes gérées : talk / goto / collect / minigame
   ============================================================ */
GAME.Quests = (function () {
  const U = GAME.U;
  let scene = null, world = null;
  let marker = null;              // balise d'objectif (colonne de lumière)
  let questEntities = [];         // objets 3D temporaires de la quête (brebis…)
  let follower = null;            // PNJ qui suit le joueur (Timothée)

  /* Dialogues courts des "personnes à aider" (talents) et des chercheurs */
  const helpDialogues = {
    aide1: [{ s: 'Mamie Ruth', t: "Oh, merci de t'arrêter ! Peux-tu porter ce panier jusqu'à ma porte ? Voilà… que Dieu te le rende au centuple !" }],
    aide2: [{ s: 'Jonas le pêcheur', t: "Tu m'aides à démêler ces filets ? À deux, c'est l'affaire d'un instant… Et voilà ! La prochaine pêche sera pour toi aussi, l'ami." }],
    aide3: [{ s: 'Déborah', t: "Cette lampe me résiste depuis ce matin… Tiens-la droite pendant que je serre. Parfait ! Tu as des mains d'artisan, toi." }],
    aide4: [{ s: 'Petit Noé', t: "Mon ballon était coincé sous le banc ! Tu l'as eu ! Merci m'sieur-dame ! Tu joues avec moi une minute ? … C'était le meilleur moment de ma journée !" }],
    aide5: [{ s: 'Vieux Siméon', t: "Assieds-toi un peu… Tu sais, le plus grand service, c'est d'écouter. *Il raconte sa jeunesse, les yeux brillants.* Merci d'avoir donné ton temps. C'est le seul trésor qu'on ne récupère jamais." }]
  };
  const seekerDialogues = {
    cherch1: [
      { s: 'Anna', t: "Toi… tu as quelque chose de différent. Une paix. D'où ça vient ?" },
      { s: 'Toi', t: "J'étais comme toi, Anna : je cherchais sans savoir quoi. Puis j'ai découvert que quelqu'un me cherchait, moi. Viens à l'église de la Grâce dimanche — viens juste voir." },
      { s: 'Anna', t: "Quelqu'un qui ME cherchait ?… D'accord. Je viendrai voir." }
    ],
    cherch2: [
      { s: 'Karim', t: "J'ai la maison, le travail, tout ce qu'on m'a dit d'avoir. Alors pourquoi ce vide ?" },
      { s: 'Toi', t: "Parce que le vide a la forme de Dieu, Karim. Rien d'autre n'a la bonne forme. Je peux te présenter quelqu'un qui l'a comblé chez moi ?" },
      { s: 'Karim', t: "« La forme de Dieu »… personne ne m'avait jamais dit ça. Oui. Présente-moi." }
    ],
    cherch3: [
      { s: 'Sofia', t: "Un Dieu qui aime… avec tout ce que j'ai fait ? Impossible." },
      { s: 'Toi', t: "Sofia, j'ai connu un fils qui avait tout gâché. Son père l'a vu de loin et a COURU vers lui. Dieu court, Sofia. Même vers toi. Surtout vers toi." },
      { s: 'Sofia', t: "*Elle essuie une larme.* Personne n'a jamais couru vers moi… Où est-elle, ton église ?" }
    ]
  };

  function init(sc, w) {
    scene = sc; world = w;
    buildMarker();
    resumeStep(true);
  }

  function currentQuest() { return GAME.DATA.quests[GAME.state.questIndex] || null; }
  function currentStep() {
    const q = currentQuest();
    return q ? q.steps[GAME.state.stepIndex] : null;
  }

  /* ---------- Balise d'objectif ---------- */
  function buildMarker() {
    marker = new THREE.Group();
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.9, 26, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd977, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
    );
    beam.position.y = 13;
    marker.add(beam);
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.4, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd977 })
    );
    arrow.rotation.x = Math.PI;
    arrow.position.y = 3.6;
    marker.add(arrow);
    marker.userData.arrow = arrow;
    scene.add(marker);
  }

  function getTargetPos() {
    const step = currentStep();
    if (!step) return null;
    if (step.type === 'talk') {
      const npc = GAME.NPCManager.get(step.npc);
      return npc ? npc.pos : null;
    }
    if (step.type === 'goto') return new THREE.Vector3(step.pos[0], world.groundHeight(step.pos[0], step.pos[1]), step.pos[1]);
    if (step.type === 'collect') {
      // pointe vers la cible non collectée la plus proche
      let best = null, bd = Infinity;
      questEntities.forEach(e => {
        if (e.collected) return;
        const d = e.pos.distanceTo(GAME.Player.player.pos);
        if (d < bd) { bd = d; best = e.pos; }
      });
      return best;
    }
    return null; // minijeux : gérés par minigames.js
  }

  /* ---------- Spawns scriptés ---------- */
  function clearEntities() {
    questEntities.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
    questEntities = [];
  }

  function doSpawn(step) {
    clearEntities();
    if (!step.spawn) return;

    if (step.spawn === 'sheep') {
      const spots = [[128, -168], [168, -118], [204, -158]];
      spots.forEach((s, i) => {
        const mesh = GAME.Character.createSheep();
        const y = world.groundHeight(s[0], s[1]);
        mesh.position.set(s[0], y, s[1]);
        scene.add(mesh);
        questEntities.push({
          tag: 'sheep', mesh, baseAng: Math.random() * 6,
          pos: new THREE.Vector3(s[0], y, s[1]),
          label: 'Ramener la brebis', collected: false
        });
      });
    } else if (step.spawn === 'lamps') {
      // 5 lampadaires éteints répartis dans la ville
      const picks = [];
      const wanted = [[-108, -36], [36, -108], [108, 108], [-36, 180], [180, 36]];
      wanted.forEach(wpt => {
        let best = null, bd = Infinity;
        world.lampPosts.forEach(lp => {
          if (picks.includes(lp)) return;
          const d = U.dist2D(lp.pos.x, lp.pos.z, wpt[0], wpt[1]);
          if (d < bd) { bd = d; best = lp; }
        });
        if (best) picks.push(best);
      });
      picks.forEach(lp => {
        lp.lit = false;
        questEntities.push({ tag: 'lamp', lamp: lp, pos: lp.pos, label: 'Rallumer le lampadaire', collected: false, keep: true });
      });
    } else if (step.spawn === 'helpers') {
      ['aide1', 'aide2', 'aide3', 'aide4', 'aide5'].forEach(id => {
        const npc = GAME.NPCManager.get(id);
        questEntities.push({ tag: 'help', npcId: id, pos: npc.pos, label: 'Aider ' + npc.def.name, collected: false, keep: true });
      });
    } else if (step.spawn === 'seekers') {
      ['cherch1', 'cherch2', 'cherch3'].forEach(id => {
        const npc = GAME.NPCManager.get(id);
        questEntities.push({ tag: 'seeker', npcId: id, pos: npc.pos, label: 'Parler à ' + npc.def.name, collected: false, keep: true });
      });
    } else if (step.spawn === 'blesse') {
      GAME.NPCManager.reveal('blesse');
    } else if (step.spawn === 'leo') {
      GAME.NPCManager.reveal('leo');
    }
  }

  /* ---------- Progression ---------- */
  function resumeStep(silent) {
    const q = currentQuest();
    if (!q) { marker.visible = false; GAME.HUD.updateQuest(); return; }
    const step = q.steps[GAME.state.stepIndex];
    // reprise de sauvegarde : ré-applique les révélations des étapes déjà franchies
    for (let i = 0; i < GAME.state.stepIndex; i++) {
      const s = q.steps[i];
      if (s.spawn === 'blesse' || s.spawn === 'leo') GAME.NPCManager.reveal(s.spawn);
    }
    // les collectes en cours repartent de zéro (on ne sait pas lesquelles étaient faites)
    if (step.type === 'collect' && silent) GAME.state.stepProgress = 0;
    doSpawn(step);
    if (step.follower) startFollower(step.follower);
    if (step.type === 'minigame' && !silent) {
      GAME.Minigames.start(step.game);
    } else if (step.type === 'minigame' && silent) {
      // reprise de sauvegarde en plein minijeu : on le relance à l'approche
      GAME.Minigames.start(step.game);
    }
    GAME.HUD.updateQuest();
  }

  function advanceStep() {
    const q = currentQuest();
    if (!q) return;
    GAME.state.stepIndex++;
    GAME.state.stepProgress = 0;
    stopFollower();
    if (GAME.state.stepIndex >= q.steps.length) {
      completeQuest(q);
    } else {
      const step = q.steps[GAME.state.stepIndex];
      doSpawn(step);
      if (step.follower) startFollower(step.follower);
      if (step.type === 'minigame') GAME.Minigames.start(step.game);
    }
    GAME.HUD.updateQuest();
    GAME.save();
  }

  function giveArmor(id) {
    if (!GAME.state.armor.includes(id)) {
      GAME.state.armor.push(id);
      GAME.Character.addArmorPiece(GAME.Player.player.ch, id);
      const a = GAME.DATA.armor.find(x => x.id === id);
      GAME.UI.notify(`${a.icon} Armure de Dieu : ${a.name} obtenue !`, 'armor');
      GAME.audio.success();
    }
  }

  function completeQuest(q) {
    GAME.state.completed.push(q.id);
    // personnages « guéris » : ils quittent la scène
    if (q.id === 'q04') GAME.NPCManager.hide('blesse');   // soigné à l'auberge
    if (q.id === 'q08') GAME.NPCManager.hide('leo');      // rentré chez son père
    // récompenses
    if (q.rewards) {
      if (q.rewards.fruits) {
        for (const f in q.rewards.fruits) {
          GAME.state.fruits[f] = Math.min(100, (GAME.state.fruits[f] || 0) + q.rewards.fruits[f]);
          const fd = GAME.DATA.fruits.find(x => x.id === f);
          GAME.UI.notify(`${fd.icon} ${fd.name} +${q.rewards.fruits[f]}`, 'fruit');
        }
      }
      if (q.rewards.armor) giveArmor(q.rewards.armor);
    }
    GAME.UI.notify(`✅ Quête accomplie : ${q.title}`);
    GAME.audio.success();

    GAME.state.questIndex++;
    GAME.state.stepIndex = 0;
    GAME.state.stepProgress = 0;
    clearEntities();

    const next = currentQuest();
    if (q.final) {
      // fin du parcours : écran de célébration
      setTimeout(() => GAME.UI.showFinale(), 1200);
    } else if (next && next.stage > GAME.state.stage) {
      GAME.state.stage = next.stage;
      GAME.NPCManager.updateVisibility();
      setTimeout(() => GAME.UI.showStageUp(next.stage), 900);
    }
    if (next) resumeStep(false);
    GAME.HUD.updateQuest();
    GAME.HUD.updateStage();
    GAME.save();
  }

  /* ---------- Interactions ---------- */
  // Le joueur parle à un PNJ : la quête consomme-t-elle l'interaction ?
  function handleNpcInteract(npcId) {
    const step = currentStep();
    if (step && step.type === 'talk' && step.npc === npcId) {
      const npc = GAME.NPCManager.get(npcId);
      if (step.armor) giveArmor(step.armor);
      if (step.flag) GAME.state.flags[step.flag] = true;
      if (step.choice) {
        GAME.UI.dialogueChoice(npc.def, step.choice, () => advanceStep());
      } else {
        GAME.UI.dialogue(npc.def, step.lines, () => advanceStep());
      }
      return true;
    }
    return false;
  }

  // Interaction avec une entité de quête (brebis, lampadaire, personne à aider…)
  function handleEntityInteract(ent) {
    const step = currentStep();
    if (!step || step.type !== 'collect' || ent.collected) return;

    const finish = () => {
      ent.collected = true;
      GAME.state.stepProgress++;
      if (ent.tag === 'sheep') {
        scene.remove(ent.mesh);
        GAME.UI.notify(`🐑 Brebis ramenée au berger (${GAME.state.stepProgress}/${step.count})`);
        GAME.audio.pickup();
      } else if (ent.tag === 'lamp') {
        ent.lamp.lit = true;
        GAME.UI.notify(`💡 Lampadaire rallumé (${GAME.state.stepProgress}/${step.count})`);
        GAME.audio.pickup();
      } else {
        GAME.audio.pickup();
        GAME.UI.notify(`✅ ${ent.label} (${GAME.state.stepProgress}/${step.count})`);
      }
      if (GAME.state.stepProgress >= step.count) advanceStep();
      else GAME.HUD.updateQuest();
      GAME.save();
    };

    if (ent.tag === 'help') {
      const npc = GAME.NPCManager.get(ent.npcId);
      GAME.UI.dialogue(npc.def, helpDialogues[ent.npcId], finish);
    } else if (ent.tag === 'seeker') {
      const npc = GAME.NPCManager.get(ent.npcId);
      GAME.UI.dialogue(npc.def, seekerDialogues[ent.npcId], finish);
    } else {
      finish();
    }
  }

  function onMinigameDone(game, success) {
    const step = currentStep();
    if (step && step.type === 'minigame' && step.game === game && success) {
      advanceStep();
    }
  }

  /* ---------- Suiveur (Timothée) ---------- */
  function startFollower(npcId) {
    follower = GAME.NPCManager.get(npcId);
  }
  function stopFollower() {
    if (follower) {
      // le PNJ reste là où il est (sa position logique est mise à jour)
      follower = null;
    }
  }

  /* ---------- Update par frame ---------- */
  function update(dt, t) {
    const step = currentStep();
    const ppos = GAME.Player.player.pos;

    // balise d'objectif
    const target = step ? getTargetPos() : null;
    if (target && (!step.type || step.type !== 'minigame')) {
      marker.visible = true;
      marker.position.set(target.x, world.groundHeight(target.x, target.z), target.z);
      marker.userData.arrow.position.y = 3.6 + Math.sin(t * 3) * 0.25;
      marker.rotation.y = t * 1.2;
    } else {
      marker.visible = false;
    }

    // objectif goto : test de proximité
    if (step && step.type === 'goto' && !GAME.UI.isBusy()) {
      const d = U.dist2D(ppos.x, ppos.z, step.pos[0], step.pos[1]);
      if (d < (step.radius || 6)) advanceStep();
    }

    // brebis : petite animation de broutage + fuite légère
    questEntities.forEach(e => {
      if (e.tag === 'sheep' && !e.collected && e.mesh) {
        e.mesh.rotation.y = Math.sin(t * 0.7 + e.baseAng) * 0.6;
        e.mesh.position.y = e.pos.y + Math.abs(Math.sin(t * 3 + e.baseAng)) * 0.04;
      }
    });

    // suiveur
    if (follower) {
      const fp = follower.group.position;
      const d = U.dist2D(fp.x, fp.z, ppos.x, ppos.z);
      if (d > 2.6) {
        const ang = Math.atan2(ppos.x - fp.x, ppos.z - fp.z);
        const sp = Math.min(d * 1.4, 8);
        fp.x += Math.sin(ang) * sp * dt;
        fp.z += Math.cos(ang) * sp * dt;
        fp.y = world.groundHeight(fp.x, fp.z);
        follower.group.rotation.y = ang;
        GAME.Character.animate(follower.ch, t, sp > 6 ? 'run' : 'walk');
        follower.pos.copy(fp);
      }
    }
  }

  // Entité de quête la plus proche (pour l'invite d'interaction)
  function nearestEntity(ppos, maxDist) {
    let best = null, bd = maxDist;
    questEntities.forEach(e => {
      if (e.collected) return;
      const d = U.dist2D(e.pos.x, e.pos.z, ppos.x, ppos.z);
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }

  return {
    init, update, currentQuest, currentStep, getTargetPos,
    handleNpcInteract, handleEntityInteract, onMinigameDone,
    nearestEntity, advanceStep, questEntities: () => questEntities
  };
})();

// ==== Moteur de quêtes : interprète les définitions de data/quests.js ====
import * as THREE from 'three';
import { QUESTS } from '../data/quests.js';
import { buildSheep, animateSheep } from '../entities/character.js';
import { dist2D, lerpAngle } from '../utils.js';

const ITEM_COLORS = { stone: 0xb0b0a8, bread: 0xd8a858, scroll: 0xe8d8a0 };

export class QuestEngine {
  constructor(game) {
    this.game = game;
    this.defs = QUESTS;
    this.activeQuest = null;   // { def, stepIndex, state }
    this.markerMesh = this._makeObjectiveMarker();
    game.scene.add(this.markerMesh);
    this.tempObjects = [];     // meshes/NPCs à nettoyer par étape
  }

  _makeObjectiveMarker() {
    const g = new THREE.Group();
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 26, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd870, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
    );
    pillar.position.y = 13;
    g.add(pillar);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 2.0, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd870, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    g.add(ring);
    g.visible = false;
    return g;
  }

  // ---------- Chaîne de quêtes ----------
  nextQuestDef() {
    const done = this.game.progression.completedQuests;
    return this.defs.find(d => !done.includes(d.id)) || null;
  }

  currentGiverNPC() {
    if (this.activeQuest) return null;
    const next = this.nextQuestDef();
    if (!next) return null;
    return this.game.npcs.get(next.giver);
  }

  updateGiverMarkers() {
    const next = this.nextQuestDef();
    for (const [id, npc] of this.game.npcs.questNPCs) {
      npc.setMarker(!this.activeQuest && next && next.giver === id);
    }
  }

  startQuest(def) {
    this.activeQuest = { def, stepIndex: -1, state: {} };
    this.game.hud.notify(`📖 Nouvelle quête : <strong>${def.title}</strong> <em>(${def.parable})</em>`);
    this._nextStep();
  }

  _nextStep() {
    this._cleanupStep();
    const q = this.activeQuest;
    q.stepIndex++;
    if (q.stepIndex >= q.def.steps.length) { this._completeQuest(); return; }
    q.state = {};
    const step = q.def.steps[q.stepIndex];
    this._enterStep(step);
    this.game.hud.setObjective(this.currentObjectiveText());
    this.game.save();
  }

  _completeQuest() {
    const def = this.activeQuest.def;
    const prog = this.game.progression;
    prog.completedQuests.push(def.id);
    this.activeQuest = null;
    this.game.audio.questDone();
    // Récompenses
    const r = def.reward || {};
    if (r.grace) prog.addGrace(r.grace);
    if (r.coins) prog.addCoins(r.coins);
    if (r.fruits) for (const [fid, amt] of Object.entries(r.fruits)) prog.addFruit(fid, amt);
    this.game.hud.notify(`✅ Quête accomplie : <strong>${def.title}</strong> (+${r.grace || 0} grâce)`);
    this.game.hud.updateStage(prog);

    const finish = () => {
      this.updateGiverMarkers();
      const next = this.nextQuestDef();
      this.game.hud.setObjective(next
        ? `Allez voir ${this.game.npcs.get(next.giver)?.name || '…'} (marqueur « ! »)`
        : 'Explorez Théopolis en homme/femme accompli(e) — trouvez les 21 versets cachés !');
      this.game.save();
    };

    if (def.advanceStage) {
      const res = prog.advanceStage();
      if (res) {
        this.game.audio.stageUp();
        this.game.player.applyArmor(prog.armor);
        this.game.player.applyStage(prog.stage);
        this.game.panels.showStageUp(res.stage, res.unlocked, () => {
          if (def.ending) this._showEnding();
          finish();
        });
        this.game.hud.updateStage(prog);
        return;
      }
    }
    finish();
  }

  _showEnding() {
    const prog = this.game.progression;
    const versets = prog.versesFound.length;
    this.game.panels.showEnding(
      `« J'ai combattu le bon combat, j'ai achevé la course, j'ai gardé la foi. » — 2 Timothée 4:7\n\n` +
      `Du nouveau-né dans la foi au père spirituel, vous avez parcouru tout le chemin du disciple.\n` +
      `Vous avez cherché la brebis perdue, secouru l'homme blessé, fait fructifier les talents, bâti sur le roc, veillé dans la nuit, ramené le fils prodigue — et formé trois nouveaux disciples qui, à leur tour, en formeront d'autres.\n\n` +
      `Grâce accumulée : ${Math.round(prog.grace)} · Versets trouvés : ${versets}/21\n\n` +
      `Théopolis brille maintenant de votre lumière. Le monde reste ouvert : les versets cachés vous attendent encore.\n\n` +
      `« Allez, faites de toutes les nations des disciples. » — Matthieu 28:19`,
      () => {}
    );
  }

  // ---------- Étapes ----------
  _enterStep(step) {
    const g = this.game;
    if (step.setHour !== undefined) g.sky.setHour(step.setHour);
    if (step.spawnNPC) this._spawnTempNPC(step.spawnNPC);
    if (step.spawnNPC2) this._spawnTempNPC(step.spawnNPC2);

    switch (step.type) {
      case 'dialogue':
        this._playDialogue(step);
        break;
      case 'choice':
        this._playChoice(step);
        break;
      case 'collect':
        step._items = step.items.map(p => this._spawnItem(p.x, p.z, step.itemType));
        break;
      case 'sheep':
        step._sheep = step.positions.map(p => {
          const s = buildSheep();
          s.group.position.set(p.x, 0, p.z);
          g.scene.add(s.group);
          this.tempObjects.push(s.group);
          return { entity: s, x: p.x, z: p.z, following: false, wanderT: 0, heading: Math.random() * 6 };
        });
        break;
      case 'sow':
        step._planted = 0;
        break;
      case 'timedDelivery':
        step._timer = step.time;
        step._delivered = new Set();
        step._npcs = step.targets.map((t, i) => this._spawnTempNPC({
          id: `hungry_${i}`, name: t.name, x: t.x, z: t.z, look: { cloth: 0x6a6a5a },
        }));
        break;
      case 'prayAltars':
        step._lit = new Set();
        break;
      case 'escort':
        break;
      case 'disciples':
        step._done = new Set();
        step._npcs = step.targets.map(t => this._spawnTempNPC(t));
        break;
      case 'minigame':
        this._startMinigame(step);
        break;
      case 'beacon':
        this._playBeacon(step);
        break;
    }
  }

  _spawnTempNPC(def) {
    const npc = this.game.npcs.addQuestNPC(def);
    if (def.lying) {
      npc.human.group.rotation.z = Math.PI / 2;
      npc.human.group.position.y = 0.4;
    }
    npc._temp = true;
    return npc;
  }

  _spawnItem(x, z, type) {
    const color = ITEM_COLORS[type] || 0xffd870;
    const mesh = new THREE.Group();
    let core;
    if (type === 'stone') core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), new THREE.MeshLambertMaterial({ color }));
    else if (type === 'bread') core = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.6, 4, 8), new THREE.MeshLambertMaterial({ color }));
    else core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.8, 8), new THREE.MeshLambertMaterial({ color }));
    core.position.y = 0.8;
    core.castShadow = true;
    mesh.add(core);
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 5, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe8a0, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false })
    );
    glow.position.y = 2.5;
    mesh.add(glow);
    mesh.position.set(x, 0, z);
    this.game.scene.add(mesh);
    this.tempObjects.push(mesh);
    return { mesh, x, z, taken: false, core };
  }

  _playDialogue(step) {
    this.game.uiLock = true;
    this.game.input.releasePointer();
    this.game.dialogue.start(step.lines, () => {
      this.game.uiLock = false;
      if (step.despawnNPC) this.game.npcs.removeQuestNPC(step.despawnNPC);
      if (step.despawnNPCs) step.despawnNPCs.forEach(id => this.game.npcs.removeQuestNPC(id));
      this._nextStep();
    });
  }

  _playChoice(step) {
    this.game.uiLock = true;
    this.game.input.releasePointer();
    const choices = step.choices.map(c => ({
      text: c.text, hint: c.hint,
      onPick: () => {
        // Effets sur les fruits
        for (const [fid, amt] of Object.entries(c.effects || {})) {
          this.game.progression.addFruit(fid, amt);
        }
        // Ligne de résultat
        this.game.dialogue.start([c.result], () => {
          this.game.uiLock = false;
          if (step.despawnNPCs) step.despawnNPCs.forEach(id => this.game.npcs.removeQuestNPC(id));
          this._nextStep();
        });
      },
    }));
    this.game.dialogue.start(step.lines, null, choices);
  }

  _startMinigame(step) {
    const g = this.game;
    const done = (success) => {
      if (success) this._nextStep();
      else {
        g.hud.notify('Réessayez ! La persévérance produit la victoire.', 'fruit');
        setTimeout(() => this._startMinigame(step), 600);
      }
    };
    if (step.kind === 'quiz') g.quiz.start(step.count, step.needed, done);
    else if (step.kind === 'talents') g.talents.start(done);
    else if (step.kind === 'arena') g.arena.start(step.needed, step.maxHits, done);
  }

  _playBeacon(step) {
    // Cinématique : colonne de lumière géante à la fontaine
    const g = this.game;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 5, 220, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    beam.position.set(0, 110, -144);
    g.scene.add(beam);
    g.beaconBeam = beam; // persiste après la quête
    g.audio.bell();
    g.uiLock = true;
    const start = performance.now();
    const animate = () => {
      const t = (performance.now() - start) / 1000;
      beam.material.opacity = Math.min(0.5, t * 0.25);
      beam.rotation.y += 0.01;
      if (t < 2.4) requestAnimationFrame(animate);
      else { g.uiLock = false; this._nextStep(); }
    };
    animate();
  }

  _cleanupStep() {
    for (const obj of this.tempObjects) this.game.scene.remove(obj);
    this.tempObjects = [];
    // PNJ temporaires restants marqués par étape (ceux à despawn explicite restent)
    this.game.npcs.questNPCs.forEach((npc, id) => {
      if (npc._temp && npc._autoClean) this.game.npcs.removeQuestNPC(id);
    });
    this.game.hud.setTimer(null);
  }

  // ---------- Objectif courant ----------
  currentStep() {
    return this.activeQuest ? this.activeQuest.def.steps[this.activeQuest.stepIndex] : null;
  }

  currentObjectiveText() {
    const step = this.currentStep();
    if (!step) return null;
    return step.label || 'Suivez le dialogue…';
  }

  currentObjectivePos() {
    const step = this.currentStep();
    const g = this.game;
    if (!step) {
      const giver = this.currentGiverNPC();
      return giver ? { x: giver.x, z: giver.z } : null;
    }
    switch (step.type) {
      case 'goto': return { x: step.x, z: step.z };
      case 'interact': {
        const npc = g.npcs.get(step.npc);
        return npc ? { x: npc.x, z: npc.z } : null;
      }
      case 'collect': {
        const left = step._items?.find(i => !i.taken);
        return left ? { x: left.x, z: left.z } : null;
      }
      case 'sheep': {
        const notFollowing = step._sheep?.find(s => !s.following);
        if (notFollowing) return { x: notFollowing.entity.group.position.x, z: notFollowing.entity.group.position.z };
        return { x: step.deliverX, z: step.deliverZ };
      }
      case 'sow': return { x: -144, z: -72 };
      case 'timedDelivery': {
        const left = step.targets.find((t, i) => !step._delivered.has(i));
        return left ? { x: left.x, z: left.z } : null;
      }
      case 'prayAltars': {
        const left = g.city.altarPositions.find((a, i) => !step._lit.has(i));
        return left ? { x: left.x, z: left.z } : null;
      }
      case 'escort': return { x: step.x, z: step.z };
      case 'disciples': {
        const left = step.targets.find(t => !step._done.has(t.id));
        return left ? { x: left.x, z: left.z } : null;
      }
      case 'minigame':
        if (step.kind === 'arena' && !g.arena.active) return g.city.arenaCenter;
        return null;
      default: return null;
    }
  }

  // ---------- Interactions disponibles ----------
  getInteractables() {
    const list = [];
    const g = this.game;
    const step = this.currentStep();

    // Donneur de quête suivant
    const giver = this.currentGiverNPC();
    if (giver) {
      const def = this.nextQuestDef();
      list.push({
        x: giver.x, z: giver.z, radius: 4.5,
        label: `Parler à ${giver.name}`,
        action: () => this.startQuest(def),
      });
    }

    if (!step) return list;

    if (step.type === 'interact') {
      const npc = g.npcs.get(step.npc);
      if (npc) {
        list.push({
          x: npc.x, z: npc.z, radius: 4.5,
          label: `Parler à ${npc.name}`,
          action: () => {
            if (step.cost) g.progression.addCoins(-step.cost);
            this._playDialogue({ type: 'dialogue', lines: step.lines });
          },
        });
      }
    }

    if (step.type === 'goto' && step.interactLabel) {
      list.push({
        x: step.x, z: step.z, radius: step.radius,
        label: step.interactLabel,
        action: () => this._nextStep(),
      });
    }

    if (step.type === 'sow') {
      const plots = g.city.gardenPlots || [];
      for (const p of plots) {
        if (p._planted) continue;
        list.push({
          x: p.x, z: p.z, radius: 5.5,
          label: 'Semer ici',
          action: () => this._sowAt(step, p),
        });
      }
    }

    if (step.type === 'prayAltars') {
      g.city.altarPositions.forEach((a, i) => {
        if (step._lit.has(i)) return;
        list.push({
          x: a.x, z: a.z, radius: 4.5,
          label: 'Prier à l\'autel',
          action: () => {
            step._lit.add(i);
            a.flame.visible = true;
            g.audio.verse();
            g.hud.notify(`🕯 Autel allumé (${step._lit.size}/4)`);
            if (step._lit.size >= 4) this._nextStep();
            else g.hud.setObjective(this.currentObjectiveText());
          },
        });
      });
    }

    if (step.type === 'disciples') {
      for (const t of step.targets) {
        if (step._done.has(t.id)) continue;
        list.push({
          x: t.x, z: t.z, radius: 4.5,
          label: `Parler à ${t.name}`,
          action: () => this._discipleTalk(step, t),
        });
      }
    }

    return list;
  }

  _sowAt(step, plot) {
    const g = this.game;
    if (plot.type === 'good') {
      plot._planted = true;
      step._planted++;
      // Pousse verte
      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 6), new THREE.MeshLambertMaterial({ color: 0x5ac86a }));
      sprout.position.set(plot.x, 0.9, plot.z);
      g.scene.add(sprout);
      this.tempObjects.push(sprout);
      g.audio.pickup();
      g.hud.notify(`🌱 Bonne terre ! (${step._planted}/3)`);
      if (step._planted >= 3) this._nextStep();
    } else {
      g.audio.bad();
      const msg = plot.type === 'rocky'
        ? 'Terre pierreuse : la graine lèverait vite… puis sécherait sans racines.'
        : plot.type === 'thorny'
          ? 'Des épines : elles étoufferaient la jeune pousse.'
          : 'Le chemin : les oiseaux mangeraient la semence.';
      g.hud.notify(`🥀 ${msg}`);
    }
  }

  _discipleTalk(step, target) {
    const g = this.game;
    g.uiLock = true;
    g.input.releasePointer();
    const choices = target.answers.map(a => ({
      text: a.text,
      onPick: () => {
        if (a.good) {
          g.dialogue.start([{ name: target.name, portrait: target.portrait, text: target.reaction }], () => {
            g.uiLock = false;
            step._done.add(target.id);
            g.npcs.removeQuestNPC(target.id);
            g.audio.verse();
            g.hud.notify(`🕊 ${target.name} a ouvert son cœur (${step._done.size}/3)`);
            if (step._done.size >= step.targets.length) this._nextStep();
            else g.hud.setObjective(this.currentObjectiveText());
          });
        } else {
          g.dialogue.start([
            { name: target.name, portrait: '😕', text: 'Hm… ce n\'est pas ce que j\'espérais entendre. (Cherchez une parole qui vienne du cœur du chemin que vous avez parcouru.)' },
          ], () => { g.uiLock = false; });
        }
      },
    }));
    g.dialogue.start([{ name: target.name, portrait: target.portrait, text: target.question }], null, choices);
  }

  // ---------- Mise à jour par frame ----------
  update(dt) {
    const g = this.game;
    const step = this.currentStep();

    // Marqueur d'objectif
    const pos = this.currentObjectivePos();
    if (pos && !g.uiLock) {
      this.markerMesh.visible = true;
      this.markerMesh.position.set(pos.x, 0, pos.z);
      this.markerMesh.children[1].rotation.z += dt * 1.5;
    } else {
      this.markerMesh.visible = false;
    }

    if (!step) return;
    const p = g.player.pos;

    // goto sans interaction : arrivée = validation
    if (step.type === 'goto' && !step.interactLabel && !g.uiLock) {
      if (dist2D(p.x, p.z, step.x, step.z) < step.radius) this._nextStep();
    }

    // Objets à ramasser (contact)
    if (step.type === 'collect') {
      let allTaken = true;
      for (const item of step._items) {
        if (item.taken) continue;
        item.core.rotation.y += dt * 2;
        item.core.position.y = 0.8 + Math.sin(performance.now() * 0.003 + item.x) * 0.15;
        if (dist2D(p.x, p.z, item.x, item.z) < 1.6) {
          item.taken = true;
          item.mesh.visible = false;
          g.audio.pickup();
          const left = step._items.filter(i => !i.taken).length;
          g.hud.notify(`✦ Ramassé (${step._items.length - left}/${step._items.length})`);
        }
        if (!item.taken) allTaken = false;
      }
      if (allTaken) this._nextStep();
    }

    // Brebis
    if (step.type === 'sheep') {
      let followers = 0;
      step._sheep.forEach((s, idx) => {
        const grp = s.entity.group;
        const d = dist2D(p.x, p.z, grp.position.x, grp.position.z);
        if (!s.following && d < 2.2) {
          s.following = true;
          g.audio.pickup();
          g.hud.notify(`🐑 Une brebis vous suit ! (${step._sheep.filter(x => x.following).length}/3)`);
        }
        if (s.following) {
          followers++;
          // Suit le joueur en file
          const targetD = 2 + idx * 1.3;
          if (d > targetD) {
            const ang = Math.atan2(p.x - grp.position.x, p.z - grp.position.z);
            s.heading = lerpAngle(s.heading, ang, Math.min(1, dt * 5));
            const speed = Math.min(9, (d - targetD) * 3);
            grp.position.x += Math.sin(s.heading) * speed * dt;
            grp.position.z += Math.cos(s.heading) * speed * dt;
            grp.rotation.y = s.heading;
            animateSheep(s.entity, dt, speed);
          } else animateSheep(s.entity, dt, 0);
        } else {
          // Broute en errant doucement
          s.wanderT -= dt;
          if (s.wanderT <= 0) { s.wanderT = 2 + Math.random() * 3; s.heading = Math.random() * Math.PI * 2; }
          grp.position.x += Math.sin(s.heading) * 0.5 * dt;
          grp.position.z += Math.cos(s.heading) * 0.5 * dt;
          grp.rotation.y = s.heading;
          animateSheep(s.entity, dt, 0.5);
        }
      });
      if (followers === step._sheep.length &&
          dist2D(p.x, p.z, step.deliverX, step.deliverZ) < step.deliverRadius) {
        this._nextStep();
      }
    }

    // Livraison chronométrée
    if (step.type === 'timedDelivery' && !g.uiLock) {
      step._timer -= dt;
      g.hud.setTimer(step._timer);
      step.targets.forEach((t, i) => {
        if (step._delivered.has(i)) return;
        if (dist2D(p.x, p.z, t.x, t.z) < 3) {
          step._delivered.add(i);
          g.npcs.removeQuestNPC(`hungry_${i}`);
          g.audio.pickup();
          g.hud.notify(`🍞 Pain livré à ${t.name} (${step._delivered.size}/5)`);
          g.hud.setObjective(this.currentObjectiveText());
        }
      });
      if (step._delivered.size >= step.targets.length) {
        g.hud.setTimer(null);
        this._nextStep();
      } else if (step._timer <= 0) {
        g.hud.setTimer(null);
        g.audio.bad();
        g.hud.notify('⏳ Les pains ont refroidi… On recommence — courage !');
        // Réinitialiser l'étape
        step.targets.forEach((t, i) => { if (!step._delivered.has(i)) g.npcs.removeQuestNPC(`hungry_${i}`); });
        this._cleanupStep();
        this._enterStep(step);
      }
    }

    // Escorte
    if (step.type === 'escort') {
      const npc = g.npcs.get(step.npc);
      if (npc) {
        const grp = npc.human.group;
        const d = dist2D(p.x, p.z, grp.position.x, grp.position.z);
        if (d > 2.6) {
          const ang = Math.atan2(p.x - grp.position.x, p.z - grp.position.z);
          grp.rotation.y = ang;
          const speed = Math.min(11, (d - 2.6) * 3);
          grp.position.x += Math.sin(ang) * speed * dt;
          grp.position.z += Math.cos(ang) * speed * dt;
          npc.x = grp.position.x; npc.z = grp.position.z;
          npc.marker.position.x = npc.x; npc.marker.position.z = npc.z;
        }
        if (dist2D(p.x, p.z, step.x, step.z) < step.radius &&
            dist2D(npc.x, npc.z, step.x, step.z) < step.radius + 4) {
          this._nextStep();
        }
      }
    }
  }

  // ---------- Sauvegarde ----------
  serialize() {
    return {
      activeQuestId: this.activeQuest?.def.id || null,
    };
  }

  deserialize(data) {
    // Une quête active reprend depuis son début (les étapes sont courtes)
    if (data?.activeQuestId) {
      const def = this.defs.find(d => d.id === data.activeQuestId);
      if (def && !this.game.progression.completedQuests.includes(def.id)) {
        this.startQuest(def);
        return;
      }
    }
    this.updateGiverMarkers();
    const next = this.nextQuestDef();
    if (next) {
      this.game.hud.setObjective(`Allez voir ${this.game.npcs.get(next.giver)?.name || '…'} (marqueur « ! »)`);
    }
  }
}

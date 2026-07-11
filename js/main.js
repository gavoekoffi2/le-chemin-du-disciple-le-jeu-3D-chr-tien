// ==== KAIROS — Le Chemin du Disciple — point d'entrée ====
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { clamp, dist2D } from './utils.js';
import { City } from './world/city.js';
import { Sky } from './world/sky.js';
import { Player } from './entities/player.js';
import { NPCManager } from './entities/npc.js';
import { Traffic } from './entities/traffic.js';
import { Input } from './systems/input.js';
import { Progression } from './systems/progression.js';
import { QuestEngine } from './systems/quests.js';
import { Collectibles } from './systems/collectibles.js';
import { Save } from './systems/save.js';
import { AudioSystem } from './systems/audio.js';
import { HUD } from './ui/hud.js';
import { DialogueSystem } from './ui/dialogue.js';
import { Panels } from './ui/panels.js';
import { Minimap } from './ui/minimap.js';
import { QuizGame } from './minigames/quiz.js';
import { TalentsGame } from './minigames/talents.js';
import { ArenaGame } from './minigames/arena.js';
import { WORLD_NPCS } from './data/quests.js';

const $ = (id) => document.getElementById(id);

class Game {
  constructor() {
    this.canvas = $('game-canvas');
    this.running = false;
    this.paused = false;
    this.uiLock = false;
    this.started = false;
  }

  async init() {
    const setProgress = (pct, text) => {
      $('loading-bar').style.width = `${pct}%`;
      $('loading-text').textContent = text;
      return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    };

    await setProgress(5, 'Allumage des étoiles…');

    // Rendu
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1600);
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    await setProgress(20, 'Fondation de Théopolis…');
    this.city = new City(this.scene);

    await setProgress(45, 'Lever du soleil…');
    this.sky = new Sky(this.scene, this.renderer);

    await setProgress(55, 'Les habitants s\'éveillent…');
    this.input = new Input(this.canvas);
    this.player = new Player(this.scene, this.input);
    this.npcs = new NPCManager(this.scene);
    for (const def of WORLD_NPCS) this.npcs.addQuestNPC(def);
    this.traffic = new Traffic(this.scene);

    await setProgress(75, 'Les paraboles prennent vie…');
    this.audio = new AudioSystem();
    this.hud = new HUD();
    this.dialogue = new DialogueSystem(this.audio);
    this.panels = new Panels(this);
    this.progression = new Progression({
      onGraceGain: (amt) => { this.hud.updateStage(this.progression); },
      onFruitGain: (fruit, amt) => {
        if (amt > 0) this.hud.notify(`${fruit.icon} ${fruit.name} +${amt}`, 'fruit');
        else this.hud.notify(`${fruit.icon} ${fruit.name} ${amt}…`, '');
      },
      onCoinsChange: () => this.hud.updateStage(this.progression),
      onArmorUnlock: (piece) => this.hud.notify(`${piece.icon} <strong>${piece.name}</strong> reçue !<br><small>${piece.verse}</small>`),
    });
    this.quests = new QuestEngine(this);
    this.collectibles = new Collectibles(this);
    this.minimap = new Minimap(this.city);
    this.quiz = new QuizGame(this);
    this.talents = new TalentsGame(this);
    this.arena = new ArenaGame(this);

    await setProgress(95, 'Le kairos approche…');
    this._bindUI();
    this.clock = new THREE.Clock();
    window.__kairos = this;

    await setProgress(100, 'Prêt.');
    $('loading-screen').classList.add('hidden');
    this._showMenu();

    // Boucle de rendu (tourne aussi derrière le menu)
    this.renderer.setAnimationLoop(() => this._frame());
  }

  _showMenu() {
    $('main-menu').classList.remove('hidden');
    $('btn-continue').classList.toggle('hidden', !Save.exists());
    // Caméra de menu : vue panoramique
    this.menuCam = true;
  }

  _bindUI() {
    $('btn-newgame').addEventListener('click', () => {
      Save.clear();
      this._startGame(null);
    });
    $('btn-continue').addEventListener('click', () => this._startGame(Save.read()));
    $('btn-controls').addEventListener('click', () => $('controls-panel').classList.remove('hidden'));
    $('btn-close-controls').addEventListener('click', () => $('controls-panel').classList.add('hidden'));
    $('btn-resume').addEventListener('click', () => this._togglePause(false));
    $('btn-pause-controls').addEventListener('click', () => $('controls-panel').classList.remove('hidden'));
    $('btn-save-quit').addEventListener('click', () => {
      this.save();
      this._togglePause(false);
      this.started = false;
      this.hud.hide();
      this._showMenu();
    });
  }

  _startGame(saveData) {
    $('main-menu').classList.add('hidden');
    this.menuCam = false;
    this.started = true;
    this.audio.init();
    this.hud.show();

    if (saveData) {
      this.progression.deserialize(saveData.progression || {});
      this.player.teleport(saveData.player?.x ?? -72, saveData.player?.z ?? 168, saveData.player?.heading ?? Math.PI);
      this.sky.time = saveData.time ?? this.sky.time;
      this.collectibles.applyTaken(saveData.collectedVerses || []);
      this.player.applyArmor(this.progression.armor);
      this.player.applyStage(this.progression.stage);
      this.quests.deserialize(saveData.quests);
      this.hud.notify('💾 Partie chargée. Bon retour à Théopolis !');
      if (this.progression.completedQuests.length >= this.quests.defs.length) {
        this.hud.setObjective('Explorez Théopolis — trouvez les 21 versets cachés !');
      }
    } else {
      this.player.teleport(-72, 168, Math.PI);
      this.quests.updateGiverMarkers();
      this.hud.setObjective('Trouvez Frère André au Vieux Port, au sud (suivez le « ! » sur la carte)');
      this.hud.notify('✝ Bienvenue à Théopolis. Cliquez sur l\'écran pour capturer la souris, puis Z/W pour avancer.');
    }
    this.hud.updateStage(this.progression);
    this.input.enabled = true;

    // Sauvegarde automatique
    clearInterval(this._autosave);
    this._autosave = setInterval(() => { if (this.started && !this.paused) this.save(); }, 12000);
  }

  save() {
    if (!this.started) return;
    Save.write(this);
  }

  _togglePause(force) {
    this.paused = force !== undefined ? force : !this.paused;
    if (this.paused) this.panels.toggle('pause-panel');
    else this.panels.close();
  }

  // ---------- Interactions ----------
  _updateInteractions() {
    if (this.uiLock || this.panels.anyOpen) { this.hud.hideInteract(); return; }
    const p = this.player.pos;
    let best = null, bestD = Infinity;

    // Véhicule
    if (this.traffic.driving) {
      best = { label: 'Sortir du véhicule', action: () => this._exitVehicle() };
    } else {
      const car = this.traffic.nearestCar(p.x, p.z);
      if (car) {
        best = { label: 'Conduire', action: () => this._enterVehicle(car) };
        bestD = dist2D(p.x, p.z, car.x, car.z);
      }
      for (const it of this.quests.getInteractables()) {
        const d = dist2D(p.x, p.z, it.x, it.z);
        if (d < it.radius && d < bestD) { best = { label: it.label, action: it.action }; bestD = d; }
      }
    }

    if (best) {
      this.hud.showInteract(best.label);
      if (this.input.justPressed('KeyE')) best.action();
    } else {
      this.hud.hideInteract();
    }
  }

  _enterVehicle(car) {
    this.traffic.enter(car);
    this.player.mesh.visible = false;
    this.audio.pickup();
  }

  _exitVehicle() {
    const car = this.traffic.exit();
    const side = car.heading + Math.PI / 2;
    const x = car.x + Math.sin(side) * 2.4;
    const z = car.z + Math.cos(side) * 2.4;
    this.player.teleport(x, z, car.heading);
    this.player.mesh.visible = true;
  }

  // ---------- Caméra ----------
  _updateCamera(dt) {
    if (this.menuCam) {
      // Panoramique lent au-dessus de la ville
      const t = performance.now() * 0.00006;
      this.camera.position.set(Math.cos(t) * 260, 130, Math.sin(t) * 260);
      this.camera.lookAt(0, 0, 0);
      return;
    }
    const driving = this.traffic.driving;
    const target = driving
      ? new THREE.Vector3(driving.x, 1.2, driving.z)
      : new THREE.Vector3(this.player.pos.x, this.player.pos.y + 1.7, this.player.pos.z);
    const dist = driving ? 11 : CONFIG.CAM_DIST;
    const yaw = this.input.yaw;
    const pitch = this.input.pitch;
    const cx = target.x - Math.sin(yaw) * Math.cos(pitch) * dist;
    const cy = target.y + Math.sin(pitch) * dist;
    const cz = target.z - Math.cos(yaw) * Math.cos(pitch) * dist;
    // Lissage
    const k = Math.min(1, dt * 9);
    this.camera.position.lerp(new THREE.Vector3(cx, Math.max(cy, 0.6), cz), k);
    this.camera.lookAt(target);
  }

  // ---------- Flèche d'objectif hors écran ----------
  _updateObjectiveArrow() {
    const pos = this.quests.currentObjectivePos?.();
    if (!pos || !this.started || this.uiLock) { this.hud.updateArrow(null); return; }
    const v = new THREE.Vector3(pos.x, 2, pos.z).project(this.camera);
    const onScreen = v.z < 1 && Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.9;
    if (onScreen) { this.hud.updateArrow(null); return; }
    // Direction 2D vers l'objectif
    let ax = v.x, ay = -v.y;
    if (v.z > 1) { ax = -ax; ay = -ay; } // derrière la caméra
    const len = Math.sqrt(ax * ax + ay * ay) || 1;
    ax /= len; ay /= len;
    const W = window.innerWidth, H = window.innerHeight;
    const margin = 50;
    const x = clamp(W / 2 + ax * (W / 2 - margin), margin, W - margin);
    const y = clamp(H / 2 + ay * (H / 2 - margin), margin, H - margin);
    this.hud.updateArrow({ x, y, angle: Math.atan2(ay, ax) });
  }

  // ---------- Touches globales ----------
  _handleKeys() {
    const inp = this.input;
    if (!this.started) { inp.endFrame(); return; }
    if (inp.justPressed('KeyJ') && !this.uiLock) this.panels.toggle('journal-panel');
    if (inp.justPressed('KeyC') && !this.uiLock) this.panels.toggle('character-panel');
    if (inp.justPressed('KeyM') && !this.uiLock) this.panels.toggle('bigmap-panel');
    if (inp.justPressed('KeyK')) {
      const on = this.audio.toggle();
      this.hud.notify(on ? '🎵 Musique activée' : '🔇 Musique coupée');
    }
    if (inp.justPressed('KeyE') && this.dialogue.active) this.dialogue.advance();
    if (inp.justPressed('Escape')) {
      if (this.panels.anyOpen && this.panels.openPanel !== 'pause-panel') this.panels.close();
      else if (!this.uiLock) this._togglePause();
    }
  }

  // ---------- Boucle ----------
  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.started && !this.paused) {
      const blocked = this.uiLock || this.panels.anyOpen || this.dialogue.active;

      // Monde vivant
      this.city.update(dt);
      const nightChanged = this.sky.update(dt, this.player.pos);
      if (nightChanged) this.city.setNight(this.sky.isNight);
      this.npcs.update(dt, this.player.pos);
      this.traffic.update(blocked ? 0.0001 : dt, blocked ? { forward: false, back: false, left: false, right: false } : this.input, this.city.colliders, this.player.pos);

      // Joueur
      if (!blocked) {
        this.player.update(dt, this.city.colliders, this.input.yaw);
        if (this.traffic.driving) {
          // Synchronise la position du joueur sur le véhicule
          this.player.pos.x = this.traffic.driving.x;
          this.player.pos.z = this.traffic.driving.z;
          this.player.heading = this.traffic.driving.heading;
        }
      }
      this.hud.updateSpirit(this.player.spirit);

      // Systèmes
      this.quests.update(dt);
      this.collectibles.update(dt);
      this.arena.update(blocked ? 0 : dt);
      this._updateInteractions();
      this._updateObjectiveArrow();
      this.minimap.render(this.player, this.quests.currentObjectivePos?.(),
        [...this.npcs.questNPCs.values()].filter(n => n.marker.visible));
    } else if (this.menuCam) {
      this.city.update(dt);
      this.sky.update(dt * 0.3, { x: 0, z: 0 });
      this.npcs.update(dt, { x: 0, z: 0 });
      this.traffic.update(dt, { forward: false, back: false, left: false, right: false }, this.city.colliders, { x: 9999, z: 9999 });
    }

    this._handleKeys();
    this.input.endFrame();
    this._updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }
}

// Lancement
const game = new Game();
game.init().catch(err => {
  console.error(err);
  $('loading-text').textContent = `Erreur : ${err.message}`;
});

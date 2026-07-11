// ==== Versets cachés : 21 parchemins lumineux disséminés dans Théopolis ====
import * as THREE from 'three';
import { HIDDEN_VERSES } from '../data/verses.js';
import { dist2D } from '../utils.js';

// Emplacements choisis à la main (recoins, toits de quais, parcs, arène…)
const SPOTS = [
  { x: -72, z: 130 },    // derrière la chapelle
  { x: 0, z: 286 },      // bout du ponton central
  { x: -72, z: 284 },    // ponton ouest
  { x: 72, z: 284 },     // ponton est
  { x: -216, z: -12 },   // parc des Oliviers
  { x: -144, z: -94 },   // jardin de la Vigne
  { x: 0, z: -160 },     // derrière la fontaine
  { x: 72, z: -144 },    // centre de l'arène
  { x: 216, z: -160 },   // pied de la colline du Temple
  { x: 144, z: -216 },   // jardin du Temple
  { x: -246, z: -246 },  // coin nord-ouest de la ville
  { x: 246, z: 246 },    // coin sud-est (port)
  { x: -246, z: 246 },   // coin sud-ouest
  { x: 246, z: -246 },   // coin nord-est
  { x: 0, z: 108 },      // rue au nord de la chapelle
  { x: -108, z: 0 },     // route ouest du marché
  { x: 108, z: 72 },     // quartier est
  { x: -180, z: 144 },   // jardins sud
  { x: 216, z: 0 },      // quartier est central
  { x: -36, z: -72 },    // rue nord du marché
  { x: 36, z: 216 },     // port central
];

export class Collectibles {
  constructor(game) {
    this.game = game;
    this.items = SPOTS.map((s, i) => {
      const mesh = new THREE.Group();
      const scroll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.7, 8),
        new THREE.MeshLambertMaterial({ color: 0xf0e0b0, emissive: 0x554510 })
      );
      scroll.rotation.z = Math.PI / 2.4;
      scroll.position.y = 0.9;
      mesh.add(scroll);
      const halo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 3.2, 8, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xd8e8ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
      );
      halo.position.y = 1.6;
      mesh.add(halo);
      mesh.position.set(s.x, 0, s.z);
      game.scene.add(mesh);
      return { mesh, scroll, x: s.x, z: s.z, index: i, taken: false };
    });
  }

  applyTaken(takenIndices) {
    for (const i of takenIndices) {
      const item = this.items[i];
      if (item) { item.taken = true; item.mesh.visible = false; }
    }
  }

  serialize() {
    return this.items.filter(i => i.taken).map(i => i.index);
  }

  update(dt) {
    const g = this.game;
    const p = g.player.pos;
    const t = performance.now() * 0.002;
    for (const item of this.items) {
      if (item.taken) continue;
      if (Math.abs(item.x - p.x) > 40 || Math.abs(item.z - p.z) > 40) continue;
      item.scroll.rotation.y = t + item.index;
      item.scroll.position.y = 0.9 + Math.sin(t * 2 + item.index) * 0.15;
      if (dist2D(p.x, p.z, item.x, item.z) < 1.7) {
        item.taken = true;
        item.mesh.visible = false;
        if (g.progression.foundVerse(item.index)) {
          const verse = HIDDEN_VERSES[item.index % HIDDEN_VERSES.length];
          g.audio.verse();
          g.hud.showVerse(verse);
          g.progression.addGrace(8, true);
          g.hud.notify(`📜 Verset caché trouvé (${g.progression.versesFound.length}/21) — +8 grâce`);
          g.hud.updateStage(g.progression);
          g.save();
        }
      }
    }
  }
}

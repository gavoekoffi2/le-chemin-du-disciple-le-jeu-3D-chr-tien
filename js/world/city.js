// ==== Théopolis — génération procédurale de la ville ====
import * as THREE from 'three';
import { CONFIG, DISTRICTS } from '../config.js';
import { makeRNG, pick, makeWindowTexture, makeRoadTexture, makeWaterTexture, mergeGeometries, transformed } from '../utils.js';

const B = CONFIG.BLOCK, R = CONFIG.ROAD, G = CONFIG.GRID;
const CITY = CONFIG.CITY_SIZE, HALF = CITY / 2;

export function blockOrigin(i, j) {
  return { x: -HALF + R + i * (B + R), z: -HALF + R + j * (B + R) };
}
export function blockCenter(i, j) {
  const o = blockOrigin(i, j);
  return { x: o.x + B / 2, z: o.z + B / 2 };
}

function districtOf(i, j) {
  if (j === 6) return 'PORT';
  if (i <= 1 && j >= 2 && j <= 5) return 'JARDINS';
  if (i >= 2 && i <= 4 && j >= 3 && j <= 4) return 'MARCHE';
  if (i >= 5 && j <= 1) return 'TEMPLE';
  return 'VILLE';
}

// Blocs spéciaux (pas de bâtiments génériques)
const SPECIAL = {
  '2,5': 'CHAPEL',   // Chapelle de l'Aube
  '3,1': 'PLAZA',    // Place de la Fontaine
  '0,3': 'PARK',     // Parc des Oliviers
  '1,2': 'PARK2',    // Jardin de la Vigne
  '3,3': 'MARKET',   // Halles du Grand Marché
  '6,0': 'TEMPLE',   // Le Temple
  '5,0': 'TEMPLEGARDEN',
  '4,1': 'STADIUM',  // Arène du Combat Spirituel
};

export class City {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];        // AABB { minX, maxX, minZ, maxZ }
    this.lampPositions = [];    // pour lumières nocturnes
    this.minimapData = { blocks: [], water: null, pois: [] };
    this.rng = makeRNG(20260711);
    this.group = new THREE.Group();
    scene.add(this.group);
    this._build();
  }

  addCollider(minX, maxX, minZ, maxZ) {
    this.colliders.push({ minX, maxX, minZ, maxZ });
  }
  addColliderBox(cx, cz, w, d) {
    this.addCollider(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2);
  }

  _build() {
    this._buildGround();
    this._buildRoadsAndSidewalks();
    this._buildBorders();
    this._buildBlocks();
    this._buildWaterAndPort();
    this._buildProps();
  }

  // ---------- Sol ----------
  _buildGround() {
    const geo = new THREE.PlaneGeometry(CITY + 400, CITY + 400);
    const mat = new THREE.MeshLambertMaterial({ color: 0x5a6a52 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  // ---------- Rues + trottoirs ----------
  _buildRoadsAndSidewalks() {
    const roadTex = makeRoadTexture();
    const roadGeoms = [];
    const sideGeoms = [];
    const plane = new THREE.PlaneGeometry(1, 1);
    plane.rotateX(-Math.PI / 2);

    // Rues verticales et horizontales
    for (let k = 0; k <= G; k++) {
      const c = -HALF + R / 2 + k * (B + R);
      roadGeoms.push(transformed(plane, c, 0.0, 0, 0, R, 1, CITY));            // verticale (le long de z)
      roadGeoms.push(transformed(plane, 0, 0.001, c, Math.PI / 2, R, 1, CITY)); // horizontale
    }
    const roadGeo = mergeGeometries(roadGeoms);
    const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
    roadTex.repeat.set(1, 24);
    const roads = new THREE.Mesh(roadGeo, roadMat);
    roads.receiveShadow = true;
    this.group.add(roads);

    // Trottoirs : anneau de 3 m autour de chaque bloc
    const SW = 3;
    for (let i = 0; i < G; i++) {
      for (let j = 0; j < G; j++) {
        const o = blockOrigin(i, j);
        const cx = o.x + B / 2, cz = o.z + B / 2;
        sideGeoms.push(transformed(plane, cx, 0.02, o.z + SW / 2, 0, B, 1, SW));
        sideGeoms.push(transformed(plane, cx, 0.02, o.z + B - SW / 2, 0, B, 1, SW));
        sideGeoms.push(transformed(plane, o.x + SW / 2, 0.02, cz, 0, SW, 1, B));
        sideGeoms.push(transformed(plane, o.x + B - SW / 2, 0.02, cz, 0, SW, 1, B));
      }
    }
    const sideMat = new THREE.MeshLambertMaterial({ color: 0x9a9a92 });
    const sides = new THREE.Mesh(mergeGeometries(sideGeoms), sideMat);
    sides.receiveShadow = true;
    this.group.add(sides);
  }

  // ---------- Limites de la ville ----------
  _buildBorders() {
    const t = 4;
    this.addCollider(-HALF - t, -HALF, -HALF - t, HALF + t); // ouest
    this.addCollider(HALF, HALF + t, -HALF - t, HALF + t);   // est
    this.addCollider(-HALF - t, HALF + t, -HALF - t, -HALF); // nord
    // Sud : quai (l'eau) — mur sauf au niveau des pontons
    const pierXs = [-72, 0, 72];
    const pierW = 8;
    let x = -HALF;
    for (const px of pierXs) {
      this.addCollider(x, px - pierW / 2, HALF, HALF + t);
      x = px + pierW / 2;
    }
    this.addCollider(x, HALF + t, HALF, HALF + t);
    // Murets décoratifs le long du quai
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x6a6a62 });
    const wallGeoms = [];
    const box = new THREE.BoxGeometry(1, 1, 1);
    let wx = -HALF;
    for (const px of pierXs) {
      const w = (px - pierW / 2) - wx;
      wallGeoms.push(transformed(box, wx + w / 2, 0.5, HALF - 0.4, 0, w, 1, 0.8));
      wx = px + pierW / 2;
    }
    wallGeoms.push(transformed(box, wx + (HALF - wx) / 2, 0.5, HALF - 0.4, 0, HALF - wx, 1, 0.8));
    const walls = new THREE.Mesh(mergeGeometries(wallGeoms), wallMat);
    walls.castShadow = true;
    this.group.add(walls);
  }

  // ---------- Blocs ----------
  _buildBlocks() {
    this.windowTex = makeWindowTexture();
    this.buildingInstances = []; // { x, z, w, h, d, color }
    this.roofInstances = [];     // toits pentus { x, y, z, s, color }
    this.treeSpots = [];
    this.benchSpots = [];

    for (let i = 0; i < G; i++) {
      for (let j = 0; j < G; j++) {
        const key = `${i},${j}`;
        const special = SPECIAL[key];
        const district = districtOf(i, j);
        const o = blockOrigin(i, j);
        this.minimapData.blocks.push({ x: o.x, z: o.z, size: B, district, special });

        if (special === 'CHAPEL') this._buildChapel(i, j);
        else if (special === 'PLAZA') this._buildPlaza(i, j);
        else if (special === 'PARK' || special === 'PARK2') this._buildPark(i, j);
        else if (special === 'MARKET') this._buildMarket(i, j);
        else if (special === 'TEMPLE') this._buildTemple(i, j);
        else if (special === 'TEMPLEGARDEN') this._buildTempleGarden(i, j);
        else if (special === 'STADIUM') this._buildStadium(i, j);
        else if (district === 'PORT') this._buildPortBlock(i, j);
        else if (district === 'JARDINS') this._buildResidentialBlock(i, j);
        else this._buildCityBlock(i, j, district);
      }
    }
    this._commitBuildings();
  }

  _buildCityBlock(i, j, district) {
    const rng = this.rng;
    const o = blockOrigin(i, j);
    const inner = 6; // marge trottoir
    const palette = district === 'MARCHE'
      ? [0xc8a878, 0xd8b890, 0xb89868, 0xcfae82]
      : [0x8a94a8, 0xa8b0c0, 0x94a0b4, 0x7f8aa0, 0xb0a8a0, 0x9a8f9c];
    // 2x2 ou 3x3 parcelles par bloc
    const n = rng() < 0.5 ? 2 : 3;
    const cell = (B - inner * 2) / n;
    for (let a = 0; a < n; a++) {
      for (let b = 0; b < n; b++) {
        if (rng() < 0.14) { // parcelle vide → arbre / banc
          const x = o.x + inner + a * cell + cell / 2;
          const z = o.z + inner + b * cell + cell / 2;
          this.treeSpots.push({ x, z });
          continue;
        }
        const w = cell * (0.55 + rng() * 0.3);
        const d = cell * (0.55 + rng() * 0.3);
        const h = district === 'MARCHE' ? 6 + rng() * 8 : 8 + rng() * 22;
        const x = o.x + inner + a * cell + cell / 2;
        const z = o.z + inner + b * cell + cell / 2;
        this.buildingInstances.push({ x, z, w, h, d, color: pick(rng, palette) });
        this.addColliderBox(x, z, w, d);
      }
    }
  }

  _buildResidentialBlock(i, j) {
    const rng = this.rng;
    const o = blockOrigin(i, j);
    const inner = 7;
    const palette = [0xd8c8a8, 0xe0d0b0, 0xc8b898, 0xd0c0a8, 0xe8d8b8];
    const roofPal = [0x9a4a3a, 0x7a3a2f, 0xa85a42];
    const n = 3;
    const cell = (B - inner * 2) / n;
    for (let a = 0; a < n; a++) {
      for (let b = 0; b < n; b++) {
        if (rng() < 0.3) {
          const x = o.x + inner + a * cell + cell / 2;
          const z = o.z + inner + b * cell + cell / 2;
          this.treeSpots.push({ x, z });
          if (rng() < 0.4) this.benchSpots.push({ x: x + 3, z, ry: rng() * Math.PI });
          continue;
        }
        const w = cell * 0.62, d = cell * 0.62;
        const h = 4 + rng() * 3.5;
        const x = o.x + inner + a * cell + cell / 2;
        const z = o.z + inner + b * cell + cell / 2;
        this.buildingInstances.push({ x, z, w, h, d, color: pick(rng, palette), plain: true });
        this.roofInstances.push({ x, y: h, z, sx: w * 0.85, sy: 2.6, sz: d * 0.85, color: pick(rng, roofPal) });
        this.addColliderBox(x, z, w, d);
      }
    }
  }

  _buildPortBlock(i, j) {
    const rng = this.rng;
    const o = blockOrigin(i, j);
    const palette = [0x7a6a55, 0x6a5f50, 0x8a7a62];
    // Entrepôts bas allongés
    const n = 2;
    for (let a = 0; a < n; a++) {
      if (rng() < 0.25) continue;
      const w = 18 + rng() * 8, d = 12 + rng() * 4, h = 5 + rng() * 3;
      const x = o.x + 14 + a * 30;
      const z = o.z + 14 + rng() * 20;
      this.buildingInstances.push({ x, z, w, h, d, color: pick(rng, palette), plain: true });
      this.roofInstances.push({ x, y: h, z, sx: w * 0.9, sy: 2, sz: d * 0.9, color: 0x9aa2aa });
      this.addColliderBox(x, z, w, d);
    }
    // Caisses
    for (let c = 0; c < 5; c++) {
      const x = o.x + 6 + rng() * (B - 12);
      const z = o.z + 40 + rng() * 14;
      this.crateSpots = this.crateSpots || [];
      this.crateSpots.push({ x, z, s: 1 + rng() * 0.8 });
    }
  }

  // ---------- Lieux spéciaux ----------
  _buildChapel(i, j) {
    const c = blockCenter(i, j);
    const g = new THREE.Group();
    const stone = new THREE.MeshLambertMaterial({ color: 0xe8e0d0 });
    const roofM = new THREE.MeshLambertMaterial({ color: 0x8a4a3a });
    const goldM = new THREE.MeshLambertMaterial({ color: 0xe8c454, emissive: 0x8a6a20 });

    // Nef
    const nave = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 24), stone);
    nave.position.set(c.x, 4, c.z);
    nave.castShadow = nave.receiveShadow = true;
    g.add(nave);
    // Toit
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0, 8.4, 5, 4), roofM);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.42, 1, 2.15);
    roof.position.set(c.x, 10.5, c.z);
    roof.castShadow = true;
    g.add(roof);
    // Clocher
    const tower = new THREE.Mesh(new THREE.BoxGeometry(6, 16, 6), stone);
    tower.position.set(c.x, 8, c.z + 12);
    tower.castShadow = true;
    g.add(tower);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0, 4.4, 5, 4), roofM);
    spire.rotation.y = Math.PI / 4;
    spire.position.set(c.x, 18.5, c.z + 12);
    g.add(spire);
    // Croix dorée
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), goldM);
    crossV.position.set(c.x, 23, c.z + 12);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.5), goldM);
    crossH.position.set(c.x, 23.6, c.z + 12);
    g.add(crossV, crossH);
    // Porte
    const door = new THREE.Mesh(new THREE.BoxGeometry(3, 4.5, 0.4), new THREE.MeshLambertMaterial({ color: 0x5a3a22 }));
    door.position.set(c.x, 2.25, c.z + 15.2);
    g.add(door);
    // Vitraux simples
    const glassM = new THREE.MeshLambertMaterial({ color: 0x4a7ac8, emissive: 0x223a66 });
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 1.4), glassM);
        win.position.set(c.x + s * 8.05, 4.5, c.z - 7 + k * 7);
        g.add(win);
      }
    }
    this.group.add(g);
    this.addColliderBox(c.x, c.z, 16, 24);
    this.addColliderBox(c.x, c.z + 12, 6, 6);
    this.minimapData.pois.push({ x: c.x, z: c.z, icon: '⛪', name: 'Chapelle de l\'Aube' });
    // Arbres autour
    this.treeSpots.push({ x: c.x - 14, z: c.z - 10 }, { x: c.x + 14, z: c.z - 10 }, { x: c.x - 14, z: c.z + 18 });
  }

  _buildPlaza(i, j) {
    const c = blockCenter(i, j);
    const g = new THREE.Group();
    // Dalle claire
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(26, 26, 0.3, 24), new THREE.MeshLambertMaterial({ color: 0xd8d0c0 }));
    slab.position.set(c.x, 0.1, c.z);
    slab.receiveShadow = true;
    g.add(slab);
    // Fontaine
    const stone = new THREE.MeshLambertMaterial({ color: 0xc8c0b0 });
    const water = new THREE.MeshLambertMaterial({ color: 0x5a9ad8, emissive: 0x1a3a5a });
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 1.4, 18), stone);
    basin.position.set(c.x, 0.7, c.z);
    basin.castShadow = true;
    g.add(basin);
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 0.3, 18), water);
    pool.position.set(c.x, 1.35, c.z);
    g.add(pool);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 4, 10), stone);
    pillar.position.set(c.x, 3, c.z);
    g.add(pillar);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.5, 14), stone);
    top.position.set(c.x, 5.1, c.z);
    g.add(top);
    this.fountainPos = { x: c.x, z: c.z };
    this.addColliderBox(c.x, c.z, 13, 13);
    // Bancs en cercle
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      this.benchSpots.push({ x: c.x + Math.cos(a) * 18, z: c.z + Math.sin(a) * 18, ry: -a + Math.PI / 2 });
    }
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.4;
      this.treeSpots.push({ x: c.x + Math.cos(a) * 25, z: c.z + Math.sin(a) * 25 });
    }
    this.group.add(g);
    this.minimapData.pois.push({ x: c.x, z: c.z, icon: '⛲', name: 'Place de la Fontaine' });
  }

  _buildPark(i, j) {
    const rng = this.rng;
    const o = blockOrigin(i, j);
    const c = blockCenter(i, j);
    // Pelouse
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(B - 6, B - 6), new THREE.MeshLambertMaterial({ color: 0x4f7a42 }));
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(c.x, 0.03, c.z);
    lawn.receiveShadow = true;
    this.group.add(lawn);
    // Arbres nombreux
    for (let k = 0; k < 14; k++) {
      this.treeSpots.push({ x: o.x + 8 + rng() * (B - 16), z: o.z + 8 + rng() * (B - 16) });
    }
    for (let k = 0; k < 4; k++) {
      this.benchSpots.push({ x: o.x + 10 + rng() * (B - 20), z: o.z + 10 + rng() * (B - 20), ry: rng() * Math.PI * 2 });
    }
    this.minimapData.pois.push({ x: c.x, z: c.z, icon: '🌳', name: i === 0 ? 'Parc des Oliviers' : 'Jardin de la Vigne' });
    // Parcelles de terre pour la quête du Semeur (Jardin de la Vigne)
    if (SPECIAL[`${i},${j}`] === 'PARK2') {
      this.gardenPlots = [];
      const soil = new THREE.MeshLambertMaterial({ color: 0x5a4232 });
      const rocky = new THREE.MeshLambertMaterial({ color: 0x8a8a82 });
      const thorny = new THREE.MeshLambertMaterial({ color: 0x3a4a2a });
      const types = ['good', 'rocky', 'thorny', 'good', 'path', 'good', 'rocky', 'thorny', 'good'];
      for (let k = 0; k < 9; k++) {
        const px = c.x - 18 + (k % 3) * 18;
        const pz = c.z - 18 + Math.floor(k / 3) * 18;
        const type = types[k];
        const mat = type === 'good' ? soil : type === 'rocky' ? rocky : type === 'thorny' ? thorny : new THREE.MeshLambertMaterial({ color: 0xb0a080 });
        const plot = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 10), mat);
        plot.position.set(px, 0.2, pz);
        plot.receiveShadow = true;
        this.group.add(plot);
        if (type === 'rocky') {
          for (let r = 0; r < 3; r++) {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), rocky);
            rock.position.set(px - 3 + r * 3, 0.7, pz + (r % 2 ? 2 : -2));
            this.group.add(rock);
          }
        }
        if (type === 'thorny') {
          for (let t = 0; t < 3; t++) {
            const thorn = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 5), thorny);
            thorn.position.set(px - 3 + t * 3, 1, pz + (t % 2 ? -2 : 2));
            this.group.add(thorn);
          }
        }
        this.gardenPlots.push({ x: px, z: pz, type });
      }
    }
  }

  _buildMarket(i, j) {
    const rng = this.rng;
    const c = blockCenter(i, j);
    // Pavage
    const slab = new THREE.Mesh(new THREE.PlaneGeometry(B - 4, B - 4), new THREE.MeshLambertMaterial({ color: 0xc0a880 }));
    slab.rotation.x = -Math.PI / 2;
    slab.position.set(c.x, 0.03, c.z);
    slab.receiveShadow = true;
    this.group.add(slab);
    // Étals : structure bois + auvent coloré
    const woodM = new THREE.MeshLambertMaterial({ color: 0x7a5a38 });
    const awningColors = [0xc84a3a, 0x3a7ac8, 0xd8a83a, 0x4a9a5a, 0xa85ac8, 0xc87a3a];
    this.stallPositions = [];
    const geoms = [];
    const awnGeoms = {};
    const box = new THREE.BoxGeometry(1, 1, 1);
    let idx = 0;
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        if (a === 1 && b === 1) continue; // centre libre (Lydia)
        const x = c.x - 18 + a * 18, z = c.z - 18 + b * 18;
        const ry = rng() < 0.5 ? 0 : Math.PI / 2;
        // Comptoir
        geoms.push(transformed(box, x, 0.6, z, ry, 4.4, 1.2, 2));
        // Poteaux
        for (const [sx, sz] of [[-2, -1], [2, -1], [-2, 1], [2, 1]]) {
          const px = ry === 0 ? x + sx : x + sz, pz = ry === 0 ? z + sz : z + sx;
          geoms.push(transformed(box, px, 1.4, pz, 0, 0.25, 2.8, 0.25));
        }
        const color = awningColors[idx % awningColors.length];
        if (!awnGeoms[color]) awnGeoms[color] = [];
        awnGeoms[color].push(transformed(box, x, 3, z, ry, 5.2, 0.3, 2.8));
        this.addColliderBox(x, z, ry === 0 ? 4.4 : 2, ry === 0 ? 2 : 4.4);
        this.stallPositions.push({ x, z });
        idx++;
      }
    }
    const stalls = new THREE.Mesh(mergeGeometries(geoms), woodM);
    stalls.castShadow = true;
    this.group.add(stalls);
    for (const color of Object.keys(awnGeoms)) {
      const m = new THREE.Mesh(mergeGeometries(awnGeoms[color]), new THREE.MeshLambertMaterial({ color: parseInt(color) }));
      m.castShadow = true;
      this.group.add(m);
    }
    this.minimapData.pois.push({ x: c.x, z: c.z, icon: '🪙', name: 'Grand Marché' });
  }

  _buildTemple(i, j) {
    const c = blockCenter(i, j);
    const g = new THREE.Group();
    const stone = new THREE.MeshLambertMaterial({ color: 0xf0e8d8 });
    const goldM = new THREE.MeshLambertMaterial({ color: 0xe8c454, emissive: 0x6a5218 });

    // Plateforme à degrés
    for (let s = 0; s < 3; s++) {
      const size = 52 - s * 8;
      const step = new THREE.Mesh(new THREE.BoxGeometry(size, 1.2, size), stone);
      step.position.set(c.x, 0.6 + s * 1.2, c.z);
      step.receiveShadow = step.castShadow = true;
      g.add(step);
    }
    const platH = 3.6;
    // Corps du temple
    const body = new THREE.Mesh(new THREE.BoxGeometry(26, 12, 30), stone);
    body.position.set(c.x, platH + 6, c.z - 2);
    body.castShadow = body.receiveShadow = true;
    g.add(body);
    // Colonnade avant
    for (let k = 0; k < 6; k++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 11, 10), stone);
      col.position.set(c.x - 12.5 + k * 5, platH + 5.5, c.z + 15);
      col.castShadow = true;
      g.add(col);
    }
    // Fronton
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0, 20, 5, 3), stone);
    ped.rotation.z = Math.PI / 2;
    ped.rotation.y = Math.PI / 2;
    ped.scale.set(1, 0.18, 4.2);
    ped.position.set(c.x, platH + 14.4, c.z + 6);
    g.add(ped);
    // Croix dorée au sommet
    const cv = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 0.8), goldM);
    cv.position.set(c.x, platH + 20, c.z - 2);
    const ch = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.8, 0.8), goldM);
    ch.position.set(c.x, platH + 21, c.z - 2);
    g.add(cv, ch);
    this.group.add(g);
    // Collision : plateforme est franchissable ? Non — on bloque le corps et les degrés hauts, l'accès se fait devant
    this.addColliderBox(c.x, c.z - 2, 26, 30);
    // marches latérales bloquées (simplification : muret bas invisible sur 3 côtés de la plateforme)
    this.addCollider(c.x - 26, c.x - 22, c.z - 26, c.z + 26);
    this.addCollider(c.x + 22, c.x + 26, c.z - 26, c.z + 26);
    this.addCollider(c.x - 26, c.x + 26, c.z - 26, c.z - 22);
    this.templeFront = { x: c.x, z: c.z + 20 };
    this.minimapData.pois.push({ x: c.x, z: c.z, icon: '✝', name: 'Le Temple' });
    // Autels de prière pour la quête "Veillez et priez" (4 coins de la colline)
    this.altarPositions = [
      { x: c.x - 30, z: c.z + 30 }, { x: c.x + 20, z: c.z + 32 },
      { x: c.x - 32, z: c.z - 30 }, { x: c.x + 30, z: c.z - 28 },
    ];
    const altarM = new THREE.MeshLambertMaterial({ color: 0xb8b0a0 });
    for (const p of this.altarPositions) {
      const alt = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 1.6, 8), altarM);
      alt.position.set(p.x, 0.8, p.z);
      alt.castShadow = true;
      this.group.add(alt);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 6),
        new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: 0.9 }));
      flame.position.set(p.x, 2.2, p.z);
      flame.visible = false;
      p.flame = flame;
      this.group.add(flame);
      this.addColliderBox(p.x, p.z, 2.6, 2.6);
    }
  }

  _buildTempleGarden(i, j) {
    const rng = this.rng;
    const o = blockOrigin(i, j);
    const c = blockCenter(i, j);
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(B - 6, B - 6), new THREE.MeshLambertMaterial({ color: 0x6a8a52 }));
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(c.x, 0.03, c.z);
    lawn.receiveShadow = true;
    this.group.add(lawn);
    // Oliviers et stèles
    for (let k = 0; k < 10; k++) {
      this.treeSpots.push({ x: o.x + 8 + rng() * (B - 16), z: o.z + 8 + rng() * (B - 16) });
    }
    const stone = new THREE.MeshLambertMaterial({ color: 0xd0c8b8 });
    for (let k = 0; k < 3; k++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 0.6), stone);
      st.position.set(c.x - 12 + k * 12, 1.5, c.z);
      st.castShadow = true;
      this.group.add(st);
      this.addColliderBox(st.position.x, c.z, 1.6, 0.6);
    }
  }

  _buildStadium(i, j) {
    const c = blockCenter(i, j);
    // Arène circulaire ouverte (pour le mini-jeu du Combat Spirituel)
    const sandM = new THREE.MeshLambertMaterial({ color: 0xd8c088 });
    const wallM = new THREE.MeshLambertMaterial({ color: 0xa89878 });
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 0.3, 28), sandM);
    floor.position.set(c.x, 0.12, c.z);
    floor.receiveShadow = true;
    this.group.add(floor);
    // Anneau de gradins (tore bas) — entrée au sud
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      if (a > Math.PI * 0.35 && a < Math.PI * 0.65) continue; // entrée
      const x = c.x + Math.cos(a) * 25.5, z = c.z + Math.sin(a) * 25.5;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 3), wallM);
      seg.position.set(x, 1.7, z);
      seg.rotation.y = -a + Math.PI / 2;
      seg.castShadow = true;
      this.group.add(seg);
      this.addColliderBox(x, z, 6, 6);
    }
    this.arenaCenter = { x: c.x, z: c.z };
    this.minimapData.pois.push({ x: c.x, z: c.z, icon: '⚔', name: 'Arène' });
  }

  // ---------- Eau + port ----------
  _buildWaterAndPort() {
    const waterTex = makeWaterTexture();
    waterTex.repeat.set(30, 8);
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(CITY + 400, 200),
      new THREE.MeshLambertMaterial({ map: waterTex })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.6, HALF + 100);
    this.group.add(water);
    this.waterMesh = water;
    this.minimapData.water = { z: HALF };

    // Pontons
    const woodM = new THREE.MeshLambertMaterial({ color: 0x8a6a45 });
    for (const px of [-72, 0, 72]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(7, 0.6, 32), woodM);
      pier.position.set(px, 0.05, HALF + 16);
      pier.castShadow = pier.receiveShadow = true;
      this.group.add(pier);
      // garde-corps de collision (côtés + bout)
      this.addCollider(px - 4.5, px - 3.5, HALF, HALF + 32);
      this.addCollider(px + 3.5, px + 4.5, HALF, HALF + 32);
      this.addCollider(px - 4.5, px + 4.5, HALF + 32, HALF + 33);
      // Barque amarrée
      const boat = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.2, 8, 8, 1, false, 0, Math.PI), new THREE.MeshLambertMaterial({ color: 0x6a4a30 }));
      hull.rotation.z = Math.PI / 2;
      hull.rotation.y = Math.PI / 2;
      boat.add(hull);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 7), woodM);
      mast.position.y = 3;
      boat.add(mast);
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.4), new THREE.MeshLambertMaterial({ color: 0xf0ead8, side: THREE.DoubleSide }));
      sail.position.set(0, 3.6, 0.1);
      boat.add(sail);
      boat.position.set(px + 8, 0.1, HALF + 22);
      boat.rotation.y = Math.PI / 2 + (px / 200);
      this.group.add(boat);
    }
    this.pierEnd = { x: 0, z: HALF + 28 };
  }

  // ---------- Props instanciés ----------
  _commitBuildings() {
    // Immeubles avec fenêtres (instanciés)
    const withWin = this.buildingInstances.filter(b => !b.plain);
    const plain = this.buildingInstances.filter(b => b.plain);
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    const makeInstanced = (list, material) => {
      if (!list.length) return null;
      const mesh = new THREE.InstancedMesh(boxGeo, material, list.length);
      const m = new THREE.Matrix4();
      const color = new THREE.Color();
      list.forEach((b, idx) => {
        m.makeScale(b.w, b.h, b.d);
        m.setPosition(b.x, b.h / 2, b.z);
        mesh.setMatrixAt(idx, m);
        mesh.setColorAt(idx, color.setHex(b.color));
      });
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      this.group.add(mesh);
      return mesh;
    };
    makeInstanced(withWin, new THREE.MeshLambertMaterial({ map: this.windowTex }));
    makeInstanced(plain, new THREE.MeshLambertMaterial({ color: 0xffffff }));

    // Toits pentus instanciés
    if (this.roofInstances.length) {
      const roofGeo = new THREE.ConeGeometry(0.72, 1, 4);
      roofGeo.rotateY(Math.PI / 4);
      const mesh = new THREE.InstancedMesh(roofGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), this.roofInstances.length);
      const m = new THREE.Matrix4();
      const color = new THREE.Color();
      this.roofInstances.forEach((r, idx) => {
        m.makeScale(r.sx * 1.4, r.sy, r.sz * 1.4);
        m.setPosition(r.x, r.y + r.sy / 2, r.z);
        mesh.setMatrixAt(idx, m);
        mesh.setColorAt(idx, color.setHex(r.color));
      });
      mesh.castShadow = true;
      this.group.add(mesh);
    }
  }

  _buildProps() {
    const rng = this.rng;
    // Lampadaires le long des rues (coins de blocs)
    for (let i = 0; i < G; i++) {
      for (let j = 0; j < G; j++) {
        const o = blockOrigin(i, j);
        this.lampPositions.push({ x: o.x + 1.2, z: o.z + 1.2 });
        if (i === G - 1) this.lampPositions.push({ x: o.x + B - 1.2, z: o.z + 1.2 });
        if (j === G - 1) this.lampPositions.push({ x: o.x + 1.2, z: o.z + B - 1.2 });
      }
    }
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 5.4, 6);
    const poleMesh = new THREE.InstancedMesh(poleGeo, new THREE.MeshLambertMaterial({ color: 0x3a3f47 }), this.lampPositions.length);
    const headGeo = new THREE.SphereGeometry(0.42, 8, 6);
    this.lampHeadMat = new THREE.MeshLambertMaterial({ color: 0xfff2c0, emissive: 0x000000 });
    const headMesh = new THREE.InstancedMesh(headGeo, this.lampHeadMat, this.lampPositions.length);
    const m = new THREE.Matrix4();
    this.lampPositions.forEach((p, idx) => {
      m.identity().setPosition(p.x, 2.7, p.z);
      poleMesh.setMatrixAt(idx, m);
      m.identity().setPosition(p.x, 5.6, p.z);
      headMesh.setMatrixAt(idx, m);
      this.addColliderBox(p.x, p.z, 0.5, 0.5);
    });
    poleMesh.castShadow = true;
    this.group.add(poleMesh, headMesh);

    // Arbres instanciés
    const trees = this.treeSpots;
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 2.4, 6);
    const folGeo = new THREE.IcosahedronGeometry(1.9, 0);
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: 0x6a4a30 }), trees.length);
    const folMesh = new THREE.InstancedMesh(folGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), trees.length);
    const folColors = [0x3f7a38, 0x4a8a3a, 0x568a46, 0x6a9a4a, 0x3a6a42];
    const color = new THREE.Color();
    trees.forEach((t, idx) => {
      const s = 0.8 + rng() * 0.7;
      m.makeScale(s, s, s).setPosition(t.x, 1.2 * s, t.z);
      trunkMesh.setMatrixAt(idx, m);
      m.makeScale(s, s * (0.9 + rng() * 0.4), s).setPosition(t.x, (2.4 + 1.4) * s, t.z);
      folMesh.setMatrixAt(idx, m);
      folMesh.setColorAt(idx, color.setHex(pick(rng, folColors)));
      this.addColliderBox(t.x, t.z, 0.8, 0.8);
    });
    trunkMesh.castShadow = folMesh.castShadow = true;
    this.group.add(trunkMesh, folMesh);

    // Bancs
    const benches = this.benchSpots || [];
    if (benches.length) {
      const benchGeo = new THREE.BoxGeometry(2.4, 0.5, 0.8);
      const benchMesh = new THREE.InstancedMesh(benchGeo, new THREE.MeshLambertMaterial({ color: 0x7a5a38 }), benches.length);
      benches.forEach((b, idx) => {
        m.makeRotationY(b.ry || 0).setPosition(b.x, 0.35, b.z);
        benchMesh.setMatrixAt(idx, m);
      });
      benchMesh.castShadow = true;
      this.group.add(benchMesh);
    }

    // Caisses du port
    const crates = this.crateSpots || [];
    if (crates.length) {
      const crateGeo = new THREE.BoxGeometry(1, 1, 1);
      const crateMesh = new THREE.InstancedMesh(crateGeo, new THREE.MeshLambertMaterial({ color: 0x9a7a4a }), crates.length);
      crates.forEach((cr, idx) => {
        m.makeRotationY(rng() * Math.PI).scale(new THREE.Vector3(cr.s, cr.s, cr.s)).setPosition(cr.x, cr.s / 2, cr.z);
        crateMesh.setMatrixAt(idx, m);
        this.addColliderBox(cr.x, cr.z, cr.s, cr.s);
      });
      crateMesh.castShadow = true;
      this.group.add(crateMesh);
    }

    // Nuages décoratifs
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    this.clouds = [];
    for (let k = 0; k < 14; k++) {
      const cg = new THREE.Group();
      for (let p = 0; p < 4; p++) {
        const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(6 + rng() * 6, 0), cloudMat);
        puff.position.set(p * 8 - 12 + rng() * 4, rng() * 3, rng() * 6 - 3);
        cg.add(puff);
      }
      cg.position.set((rng() - 0.5) * (CITY + 200), 90 + rng() * 40, (rng() - 0.5) * (CITY + 200));
      this.clouds.push({ mesh: cg, speed: 1 + rng() * 2 });
      this.group.add(cg);
    }
  }

  update(dt) {
    // Nuages qui dérivent
    for (const c of this.clouds) {
      c.mesh.position.x += c.speed * dt;
      if (c.mesh.position.x > HALF + 200) c.mesh.position.x = -HALF - 200;
    }
    if (this.waterMesh) {
      this.waterMesh.material.map.offset.x += dt * 0.008;
    }
  }

  setNight(isNight) {
    this.lampHeadMat.emissive.setHex(isNight ? 0xffd870 : 0x000000);
  }
}

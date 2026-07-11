// ==== Constructeur de personnages low-poly (géométrie procédurale) ====
import * as THREE from 'three';

const SKIN_TONES = [0xe8b890, 0xc89068, 0xa87048, 0x8a5838, 0x6a4428, 0xf0c8a0];
const CLOTH_COLORS = [0x4a6a9a, 0x9a4a4a, 0x4a8a5a, 0x8a6aa0, 0xa88a3a, 0x5a7a8a, 0x7a5a4a, 0x3a5a7a];

function lam(color) { return new THREE.MeshLambertMaterial({ color }); }

// Humanoïde articulé simplement : groupes pivots pour bras/jambes/tête
export function buildHumanoid(opts = {}) {
  const skin = opts.skin ?? SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
  const cloth = opts.cloth ?? CLOTH_COLORS[Math.floor(Math.random() * CLOTH_COLORS.length)];
  const pants = opts.pants ?? 0x3a4050;
  const hairC = opts.hair ?? [0x2a2018, 0x4a3520, 0x6a5030, 0x1a1a1a, 0x8a8a8a][Math.floor(Math.random() * 5)];

  const g = new THREE.Group();
  const skinM = lam(skin), clothM = lam(cloth), pantsM = lam(pants), hairM = lam(hairC);

  // Torse (0.9 x 1.1 x 0.5), bassin à y=0.85
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), clothM);
  torso.position.y = 1.4;
  torso.castShadow = true;
  g.add(torso);

  // Tête + pivot cou
  const headPivot = new THREE.Group();
  headPivot.position.y = 2.0;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), skinM);
  head.position.y = 0.32;
  head.castShadow = true;
  headPivot.add(head);
  // Cheveux (bouclés/afro si demandé : calotte arrondie)
  if (opts.curly) {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), hairM);
    hair.scale.set(1.05, 0.75, 1.05);
    hair.position.y = 0.6;
    headPivot.add(hair);
  } else {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.6), hairM);
    hair.position.y = 0.58;
    headPivot.add(hair);
  }
  // Yeux
  const eyeM = lam(0x1a1a22);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), eyeM);
    eye.position.set(s * 0.13, 0.36, 0.28);
    headPivot.add(eye);
  }
  g.add(headPivot);

  // Bras : pivot épaule
  const makeArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.58, 1.85, 0);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.24), clothM);
    upper.position.y = -0.42;
    upper.castShadow = true;
    pivot.add(upper);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.2), skinM);
    hand.position.y = -0.95;
    pivot.add(hand);
    g.add(pivot);
    return pivot;
  };
  const armL = makeArm(-1), armR = makeArm(1);

  // Jambes : pivot hanche
  const makeLeg = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.24, 0.9, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.3), pantsM);
    leg.position.y = -0.45;
    leg.castShadow = true;
    pivot.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.45), lam(0x2a2a30));
    foot.position.set(0, -0.86, 0.06);
    pivot.add(foot);
    g.add(pivot);
    return pivot;
  };
  const legL = makeLeg(-1), legR = makeLeg(1);

  return {
    group: g,
    parts: { torso, headPivot, armL, armR, legL, legR },
    mats: { clothM, skinM },
    animT: Math.random() * 10,
  };
}

// Animation de marche procédurale
export function animateHumanoid(h, dt, speed, grounded = true) {
  h.animT += dt * (2 + speed * 1.1);
  const t = h.animT;
  const amp = Math.min(speed / 6, 1) * 0.65;
  if (speed > 0.2 && grounded) {
    h.parts.armL.rotation.x = Math.sin(t) * amp;
    h.parts.armR.rotation.x = -Math.sin(t) * amp;
    h.parts.legL.rotation.x = -Math.sin(t) * amp * 1.1;
    h.parts.legR.rotation.x = Math.sin(t) * amp * 1.1;
    h.group.position.y = Math.abs(Math.sin(t)) * 0.06;
  } else if (!grounded) {
    // Saut : bras levés
    h.parts.armL.rotation.x = -2.4;
    h.parts.armR.rotation.x = -2.4;
    h.parts.legL.rotation.x = 0.5;
    h.parts.legR.rotation.x = -0.3;
  } else {
    // Idle : respiration
    const breathe = Math.sin(t * 0.4) * 0.03;
    h.parts.armL.rotation.x *= 0.85;
    h.parts.armR.rotation.x *= 0.85;
    h.parts.legL.rotation.x *= 0.85;
    h.parts.legR.rotation.x *= 0.85;
    h.parts.torso.position.y = 1.4 + breathe;
    h.group.position.y = 0;
  }
}

// Brebis (pour la parabole de la brebis perdue)
export function buildSheep() {
  const g = new THREE.Group();
  const woolM = lam(0xf0ede4);
  const faceM = lam(0x3a3230);
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), woolM);
  body.scale.set(1.3, 1, 1);
  body.position.y = 0.62;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.4), faceM);
  head.position.set(0, 0.75, 0.62);
  g.add(head);
  const woolTop = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), woolM);
  woolTop.position.set(0, 0.95, 0.55);
  g.add(woolTop);
  const legs = [];
  for (const [sx, sz] of [[-0.25, 0.3], [0.25, 0.3], [-0.25, -0.3], [0.25, -0.3]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), faceM);
    leg.position.set(sx, 0.2, sz);
    g.add(leg);
    legs.push(leg);
  }
  return { group: g, legs, animT: Math.random() * 10 };
}

export function animateSheep(s, dt, speed) {
  s.animT += dt * (3 + speed * 2);
  const amp = Math.min(speed / 3, 1) * 0.5;
  s.legs.forEach((leg, i) => {
    leg.rotation.x = Math.sin(s.animT + (i % 2) * Math.PI) * amp;
  });
}

// Voiture low-poly
export function buildCar(color) {
  const g = new THREE.Group();
  const bodyM = lam(color ?? [0xc84a3a, 0x3a6ac8, 0xd8b83a, 0x4a9a5a, 0xe8e8e8, 0x3a3a44][Math.floor(Math.random() * 6)]);
  const glassM = lam(0x9ac8e0);
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.7, 4.2), bodyM);
  body.position.y = 0.75;
  body.castShadow = true;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 2.2), glassM);
  cabin.position.set(0, 1.35, -0.2);
  cabin.castShadow = true;
  g.add(cabin);
  const wheelM = lam(0x1a1a1e);
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const [sx, sz] of [[-1, 1.3], [1, 1.3], [-1, -1.3], [1, -1.3]]) {
    const w = new THREE.Mesh(wheelGeo, wheelM);
    w.position.set(sx * 1.02, 0.38, sz);
    g.add(w);
  }
  // Phares
  const lightM = new THREE.MeshLambertMaterial({ color: 0xfff8d0, emissive: 0x555030 });
  for (const s of [-1, 1]) {
    const lt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), lightM);
    lt.position.set(s * 0.6, 0.75, 2.15);
    g.add(lt);
  }
  return g;
}

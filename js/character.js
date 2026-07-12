/* LA VOIE — personnages
   - Joueur : modèle humain RÉALISTE riggé (GLB embarqué, squelette Mixamo,
     animations Idle/Walk/Run avec fondu-enchaîné)
   - PNJ : humanoïdes stylisés procéduraux (têtes rondes, visage, mains)     */
GAME.Character = (function () {
  const U = GAME.U;

  /* ================================================================
     JOUEUR RÉALISTE (GLB riggé)
     ================================================================ */
  function loadRealPlayer(cb) {
    if (typeof THREE.GLTFLoader === 'undefined' || !GAME.SOLDIER_B64) { cb(null); return; }
    try {
      const bin = atob(GAME.SOLDIER_B64);
      const buf = new ArrayBuffer(bin.length);
      const u8 = new Uint8Array(buf);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      new THREE.GLTFLoader().parse(buf, '', gltf => {
        const model = gltf.scene;
        const bones = {};
        model.traverse(o => {
          // le corps militaire du modèle sert uniquement de SQUELETTE animé :
          // on le masque et on habille ses os de vrais vêtements + un visage naturel
          if (o.isMesh || o.isSkinnedMesh) { o.visible = false; o.frustumCulled = false; }
          if (o.isBone) bones[o.name] = o;
        });
        // grande stature de héros (~2,05 m) et orientation vers +Z (convention du jeu)
        const TAILLE = 2.05;
        const box = new THREE.Box3().setFromObject(model);
        const h = Math.max(0.1, box.max.y - box.min.y);
        const group = new THREE.Group();
        const inner = new THREE.Group();
        inner.add(model);
        inner.scale.setScalar(TAILLE / h);
        inner.position.y = -box.min.y * (TAILLE / h);
        inner.rotation.y = Math.PI;
        group.add(inner);

        const mixer = new THREE.AnimationMixer(model);
        const actions = {};
        gltf.animations.forEach(clip => {
          const n = clip.name.toLowerCase();
          if (n.includes('idle')) actions.idle = mixer.clipAction(clip);
          else if (n.includes('walk')) actions.walk = mixer.clipAction(clip);
          else if (n.includes('run')) actions.run = mixer.clipAction(clip);
        });
        const ch = { group, inner, model, mixer, actions, bones, isReal: true, current: null, lastT: null, parts: {}, outfitMeshes: [] };
        setAction(ch, 'idle');
        applyOutfit(ch, (GAME.state && GAME.state.outfit) || 'casual');
        cb(ch);
      }, err => { console.warn('GLB parse:', err); cb(null); });
    } catch (e) { console.warn('GLB decode:', e); cb(null); }
  }

  function setAction(ch, name) {
    if (ch.current === name || !ch.actions[name]) return;
    const prev = ch.actions[ch.current];
    const next = ch.actions[name];
    next.enabled = true;
    next.reset().fadeIn(0.22).play();
    if (prev) prev.fadeOut(0.22);
    ch.current = name;
  }

  function findBone(ch, part) {
    for (const n in ch.bones) if (n.indexOf(part) !== -1) return ch.bones[n];
    return null;
  }

  // attache un mesh d'armure à un os du squelette (compense l'échelle du rig)
  function attachToBone(ch, bonePart, mesh, pos, rot) {
    const bone = findBone(ch, bonePart);
    const target = bone || ch.group;
    ch.group.updateMatrixWorld(true);
    const ws = new THREE.Vector3(1, 1, 1);
    target.getWorldScale(ws);
    const k = 1 / Math.max(1e-6, ws.x);
    mesh.scale.multiplyScalar(k);
    if (pos) mesh.position.set(pos[0] * k, pos[1] * k, pos[2] * k);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    target.add(mesh);
    return mesh;
  }

  /* ================================================================
     GARDE-ROBE — vêtements montés sur le squelette animé
     ================================================================ */
  const SKIN = 0xc98e5a, HAIR = 0x241a10;

  // segment de membre : cylindre tendu entre un os et son enfant (suit l'animation)
  function boneSegment(ch, boneName, childName, radiusM, color, taper) {
    const bone = findBone(ch, boneName);
    const child = findBone(ch, childName);
    if (!bone || !child || child.parent !== bone) return null;
    ch.group.updateMatrixWorld(true);
    const ws = new THREE.Vector3(1, 1, 1);
    bone.getWorldScale(ws);
    const k = 1 / Math.max(1e-6, ws.x);
    const v = child.position.clone();
    const len = v.length();
    if (len < 1e-6) return null;
    const r = radiusM * k;
    const geo = new THREE.CylinderGeometry(r * (taper || 1), r, len * 1.12, 10);
    const mesh = new THREE.Mesh(geo, GAME.mat(color));
    mesh.castShadow = true;
    mesh.position.copy(v).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
    bone.add(mesh);
    ch.outfitMeshes.push(mesh);
    return mesh;
  }

  // pièce simple attachée à un os (boîte/sphère), comptée comme vêtement
  function bonePiece(ch, boneName, mesh, pos, rot) {
    attachToBone(ch, boneName, mesh, pos, rot);
    ch.outfitMeshes.push(mesh);
    return mesh;
  }

  // tête naturelle : peau, yeux, sourcils, nez, bouche, oreilles, cheveux
  function buildNaturalHead(ch) {
    const g = new THREE.Group();
    const skinMat = GAME.mat(SKIN);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.108, 16, 14), skinMat);
    head.scale.y = 1.18;
    head.castShadow = true;
    g.add(head);
    // cheveux : calotte haute + arrière
    const hairMat = GAME.mat(HAIR);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.112, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
    hair.scale.y = 1.18;
    hair.position.y = 0.012;
    g.add(hair);
    const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.108, 12, 10, 0, Math.PI, Math.PI * 0.3, Math.PI * 0.45), hairMat);
    hairBack.scale.y = 1.18;
    hairBack.rotation.y = Math.PI;
    hairBack.position.set(0, 0.005, -0.012);
    g.add(hairBack);
    // yeux : blanc + pupille
    [-1, 1].forEach(s => {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), GAME.mat(0xf5f5f0));
      white.position.set(s * 0.042, 0.012, 0.093);
      g.add(white);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 5), GAME.mat(0x241a14));
      pupil.position.set(s * 0.042, 0.012, 0.108);
      g.add(pupil);
      // sourcil
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.008, 0.012), hairMat);
      brow.position.set(s * 0.042, 0.045, 0.096);
      brow.rotation.z = -s * 0.12;
      g.add(brow);
      // oreille
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), skinMat);
      ear.position.set(s * 0.105, 0, 0.005);
      ear.scale.set(0.5, 1, 0.7);
      g.add(ear);
    });
    // nez
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.036, 0.024), skinMat);
    nose.position.set(0, -0.012, 0.104);
    g.add(nose);
    // bouche
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.008, 0.01), GAME.mat(0x8a4a3a));
    mouth.position.set(0, -0.055, 0.093);
    g.add(mouth);
    return g;
  }

  /* Habille le personnage réaliste avec une tenue de la garde-robe */
  function applyOutfit(ch, outfitId) {
    if (!ch.isReal) return;
    const def = (GAME.DATA.outfits || []).find(o => o.id === outfitId) || GAME.DATA.outfits[0];
    // retire l'ancienne tenue (l'armure, elle, reste en place)
    (ch.outfitMeshes || []).forEach(m => { if (m.parent) m.parent.remove(m); });
    ch.outfitMeshes = [];
    ch.currentOutfit = def.id;

    const shirt = def.shirt, pants = def.pants, shoes = def.shoes;
    const foreColor = def.sleeves === 'long' ? shirt : SKIN;

    // bassin (jean)
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.22, 0.22), GAME.mat(pants));
    pelvis.castShadow = true;
    bonePiece(ch, 'Hips', pelvis, [0, 0.03, 0]);
    // torse (t-shirt / chemise)
    boneSegment(ch, 'Spine', 'Spine1', 0.165, shirt, 1.08);
    boneSegment(ch, 'Spine1', 'Spine2', 0.175, shirt, 1.06);
    boneSegment(ch, 'Spine2', 'Neck', 0.165, shirt, 0.78);
    // épaules + bras
    ['Left', 'Right'].forEach(side => {
      boneSegment(ch, side + 'Shoulder', side + 'Arm', 0.065, shirt);
      boneSegment(ch, side + 'Arm', side + 'ForeArm', 0.052, def.sleeves === 'long' ? shirt : shirt); // manche courte couvre le haut du bras
      boneSegment(ch, side + 'ForeArm', side + 'Hand', 0.042, foreColor, 0.85);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), GAME.mat(SKIN));
      hand.castShadow = true;
      bonePiece(ch, side + 'Hand', hand, [0, 0.04, 0]);
      // jambes
      boneSegment(ch, side + 'UpLeg', side + 'Leg', 0.082, pants, 0.85);
      boneSegment(ch, side + 'Leg', side + 'Foot', 0.062, pants, 0.8);
      // chaussures
      const shoe = boneSegment(ch, side + 'Foot', side + 'ToeBase', 0.055, shoes, 1.1);
      if (!shoe) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.2), GAME.mat(shoes));
        bonePiece(ch, side + 'Foot', s, [0, 0.04, 0.05]);
      } else {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), GAME.mat(shoes));
        bonePiece(ch, side + 'ToeBase', cap, [0, 0.01, 0]);
      }
    });
    // cou + tête naturelle
    boneSegment(ch, 'Neck', 'Head', 0.042, SKIN);
    const headG = buildNaturalHead(ch);
    bonePiece(ch, 'Head', headG, [0, 0.1, 0.012]);
  }

  /* ================================================================
     PNJ PROCÉDURAUX (améliorés : tête ronde, visage, mains, chaussures)
     ================================================================ */
  function create(opts) {
    opts = opts || {};
    const shirt = opts.shirt !== undefined ? opts.shirt : 0x3a6ea5;
    const pants = opts.pants !== undefined ? opts.pants : 0x2f3550;
    const skin  = opts.skin  !== undefined ? opts.skin  : 0xd9a679;
    const hair  = opts.hair  !== undefined ? opts.hair  : 0x3a2a1a;
    const scale = opts.scale || 1;

    const g = new THREE.Group();
    const parts = {};

    // Torse (légèrement trapézoïdal) + épaules
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.19, 0.6, 10), GAME.mat(shirt));
    torso.position.y = 1.05;
    torso.castShadow = true;
    g.add(torso); parts.torso = torso;
    const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), GAME.mat(shirt));
    shoulders.position.y = 1.32;
    shoulders.scale.set(1.15, 0.55, 0.8);
    g.add(shoulders);

    // Cou + tête ronde avec visage
    const headG = new THREE.Group();
    headG.position.y = 1.42;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), GAME.mat(skin));
    neck.position.y = 0.02;
    headG.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.175, 12, 10), GAME.mat(skin));
    head.position.y = 0.22;
    head.scale.y = 1.12;
    head.castShadow = true;
    headG.add(head);
    // cheveux : calotte
    const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), GAME.mat(hair));
    hairM.position.y = 0.25;
    hairM.scale.y = 1.12;
    headG.add(hairM);
    // yeux + nez
    const eyeGeo = new THREE.SphereGeometry(0.022, 6, 5);
    const eyeMat = GAME.mat(0x1a1a2a);
    const e1 = new THREE.Mesh(eyeGeo, eyeMat); e1.position.set(-0.06, 0.24, 0.155); headG.add(e1);
    const e2 = new THREE.Mesh(eyeGeo, eyeMat); e2.position.set(0.06, 0.24, 0.155); headG.add(e2);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.035), GAME.mat(skin));
    nose.position.set(0, 0.2, 0.17);
    headG.add(nose);
    g.add(headG); parts.head = headG;

    // Membres : pivot épaule/hanche ; bras = manche + avant-bras peau + main
    function arm(px) {
      const pivot = new THREE.Group();
      pivot.position.set(px, 1.3, 0);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.26, 8), GAME.mat(shirt));
      sleeve.position.y = -0.12;
      pivot.add(sleeve);
      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.24, 8), GAME.mat(skin));
      fore.position.y = -0.36;
      pivot.add(fore);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), GAME.mat(skin));
      hand.position.y = -0.5;
      pivot.add(hand);
      pivot.children.forEach(c => c.castShadow = true);
      g.add(pivot);
      return pivot;
    }
    function leg(px) {
      const pivot = new THREE.Group();
      pivot.position.set(px, 0.76, 0);
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.36, 8), GAME.mat(pants));
      thigh.position.y = -0.17;
      pivot.add(thigh);
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.32, 8), GAME.mat(pants));
      calf.position.y = -0.5;
      pivot.add(calf);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.2), GAME.mat(0x2a2320));
      shoe.position.set(0, -0.7, 0.04);
      pivot.add(shoe);
      pivot.children.forEach(c => c.castShadow = true);
      g.add(pivot);
      return pivot;
    }
    parts.armL = arm(-0.28);
    parts.armR = arm(0.28);
    parts.legL = leg(-0.11);
    parts.legR = leg(0.11);

    // Auréole de mentor
    if (opts.hasHalo) {
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.035, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd977 })
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 1.95;
      g.add(halo); parts.halo = halo;
    }

    g.scale.setScalar(scale);
    return { group: g, parts, opts, isReal: false };
  }

  /* ================================================================
     ANIMATION — un seul point d'entrée pour les deux types
     ================================================================ */
  function animate(ch, t, state, speedRatio) {
    if (ch.isReal) {
      // modèle riggé : fondu entre clips + avance du mixer
      if (ch.lastT === null) ch.lastT = t;
      const dt = U.clamp(t - ch.lastT, 0, 0.1);
      ch.lastT = t;
      let target = 'idle';
      if (state === 'walk') target = 'walk';
      else if (state === 'run') target = 'run';
      else if (state === 'jump') target = ch.actions.run ? 'run' : 'idle';
      setAction(ch, target);
      ch.mixer.update(dt);
      return;
    }
    const p = ch.parts;
    if (state === 'walk' || state === 'run') {
      const freq = state === 'run' ? 11 : 7;
      const amp = state === 'run' ? 1.0 : 0.55;
      const s = Math.sin(t * freq) * amp;
      p.armL.rotation.x = s; p.armR.rotation.x = -s;
      p.legL.rotation.x = -s; p.legR.rotation.x = s;
      p.torso.position.y = 1.05 + Math.abs(Math.cos(t * freq)) * 0.035;
      p.head.rotation.x = 0;
    } else if (state === 'jump') {
      p.armL.rotation.x = -2.4; p.armR.rotation.x = -2.4;
      p.legL.rotation.x = 0.5; p.legR.rotation.x = -0.3;
    } else { // idle
      const b = Math.sin(t * 1.6) * 0.03;
      p.armL.rotation.x = U.lerp(p.armL.rotation.x, b, 0.15);
      p.armR.rotation.x = U.lerp(p.armR.rotation.x, -b, 0.15);
      p.legL.rotation.x = U.lerp(p.legL.rotation.x, 0, 0.2);
      p.legR.rotation.x = U.lerp(p.legR.rotation.x, 0, 0.2);
      p.torso.position.y = 1.05 + b * 0.4;
      p.head.rotation.x = Math.sin(t * 0.8) * 0.04;
    }
    if (p.halo) { p.halo.position.y = 1.95 + Math.sin(t * 2) * 0.03; p.halo.rotation.z = t * 0.8; }
  }

  /* ================================================================
     ARMURE DE DIEU — visible sur le personnage
     ================================================================ */
  function addArmorPiece(ch, id) {
    if (ch.parts['armor_' + id]) return;

    if (ch.isReal) {
      // fixation sur le squelette du modèle réaliste
      let m = null;
      if (id === 'ceinture') {
        m = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.09, 12, 1, true), GAME.mat(0xc9a227));
        attachToBone(ch, 'Hips', m, [0, 0.02, 0]);
      } else if (id === 'chaussures') {
        const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.24), GAME.mat(0xc9a227));
        attachToBone(ch, 'LeftFoot', s1, [0, 0.05, 0.04]);
        const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.24), GAME.mat(0xc9a227));
        attachToBone(ch, 'RightFoot', s2, [0, 0.05, 0.04]);
        m = s1;
      } else if (id === 'cuirasse') {
        m = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.205, 0.26, 14, 1, true),
          new THREE.MeshLambertMaterial({ color: 0x707890, emissive: 0x0c0e16, side: THREE.DoubleSide }));
        attachToBone(ch, 'Spine1', m, [0, -0.03, 0]);
      } else if (id === 'bouclier') {
        m = new THREE.Group();
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.045, 18), GAME.mat(0x8a6d1f));
        const boss = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), GAME.mat(0xd8b840));
        boss.position.y = 0.035;
        m.add(disc); m.add(boss);
        m.rotation.z = Math.PI / 2;
        attachToBone(ch, 'LeftForeArm', m, [0, 0.12, 0], [0, 0, Math.PI / 2]);
      } else if (id === 'casque') {
        m = new THREE.Mesh(new THREE.SphereGeometry(0.128, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), GAME.mat(0xc9a227));
        attachToBone(ch, 'Head', m, [0, 0.155, 0.012]);
      } else if (id === 'epee') {
        m = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.62, 0.02), GAME.mat(0xe8e8f8));
        blade.position.y = -0.3;
        const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.045, 0.045), GAME.mat(0xc9a227));
        m.add(blade); m.add(hilt);
        m.rotation.z = 0.35;
        // le modèle est retourné de 180° : +z local = dos du personnage
        attachToBone(ch, 'Spine2', m, [0.05, 0.1, 0.16]);
      }
      if (m) ch.parts['armor_' + id] = m;
      return;
    }

    // version PNJ procédural (utilisée si le modèle réaliste n'a pas pu se charger)
    const g = ch.group, parts = ch.parts;
    let m = null;
    if (id === 'ceinture') {
      m = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.09, 10, 1, true), GAME.mat(0xc9a227));
      m.position.y = 0.78;
    } else if (id === 'chaussures') {
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.24), GAME.mat(0xc9a227));
      s1.position.set(0, -0.7, 0.04);
      const s2 = s1.clone();
      parts.legL.add(s1); parts.legR.add(s2);
      parts['armor_' + id] = s1;
      return;
    } else if (id === 'cuirasse') {
      m = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.5, 10), GAME.mat(0xb8b8c8));
      m.position.y = 1.1;
    } else if (id === 'bouclier') {
      m = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 16), GAME.mat(0x8a6d1f));
      m.rotation.z = Math.PI / 2;
      m.position.set(-0.1, -0.38, 0);
      parts.armL.add(m);
      parts['armor_' + id] = m;
      return;
    } else if (id === 'casque') {
      m = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), GAME.mat(0xc9a227));
      m.position.y = 0.25;
      m.scale.y = 1.15;
      parts.head.add(m);
      parts['armor_' + id] = m;
      return;
    } else if (id === 'epee') {
      m = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.02), GAME.mat(0xe8e8f8));
      blade.position.y = -0.75;
      const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), GAME.mat(0xc9a227));
      hilt.position.y = -0.48;
      m.add(blade); m.add(hilt);
      m.position.set(0.05, 1.35, -0.24);
      m.rotation.x = 0.4;
    }
    if (m) { g.add(m); parts['armor_' + id] = m; }
  }

  /* Une brebis low-poly */
  function createSheep() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 1.0), GAME.mat(0xf2eee4));
    body.position.y = 0.55; body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.34), GAME.mat(0x333333));
    head.position.set(0, 0.72, 0.6);
    g.add(head);
    const legGeo = new THREE.BoxGeometry(0.1, 0.35, 0.1);
    const legMat = GAME.mat(0x333333);
    [[-0.22, 0.35], [0.22, 0.35], [-0.22, -0.35], [0.22, -0.35]].forEach(([x, z]) => {
      const l = new THREE.Mesh(legGeo, legMat);
      l.position.set(x, 0.18, z);
      g.add(l);
    });
    return g;
  }

  return { create, animate, addArmorPiece, createSheep, loadRealPlayer, applyOutfit };
})();

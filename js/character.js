/* LA VOIE — fabrique d'humanoïdes low-poly + animation procédurale */
GAME.Character = (function () {
  const U = GAME.U;

  /* Construit un humanoïde stylisé à partir de boîtes.
     opts: { shirt, pants, skin, hair, scale, hasHalo } */
  function create(opts) {
    opts = opts || {};
    const shirt = opts.shirt !== undefined ? opts.shirt : 0x3a6ea5;
    const pants = opts.pants !== undefined ? opts.pants : 0x2f3550;
    const skin  = opts.skin  !== undefined ? opts.skin  : 0xd9a679;
    const hair  = opts.hair  !== undefined ? opts.hair  : 0x3a2a1a;
    const scale = opts.scale || 1;

    const g = new THREE.Group();
    const parts = {};

    // Torse
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.28), GAME.mat(shirt));
    torso.position.y = 1.06;
    torso.castShadow = true;
    g.add(torso); parts.torso = torso;

    // Tête (pivot au cou)
    const headG = new THREE.Group();
    headG.position.y = 1.45;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.32), GAME.mat(skin));
    head.position.y = 0.2;
    head.castShadow = true;
    headG.add(head);
    const hairM = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.14, 0.35), GAME.mat(hair));
    hairM.position.y = 0.35;
    headG.add(hairM);
    // Yeux
    const eyeGeo = new THREE.BoxGeometry(0.05, 0.05, 0.02);
    const eyeMat = GAME.mat(0x1a1a2a);
    const e1 = new THREE.Mesh(eyeGeo, eyeMat); e1.position.set(-0.08, 0.22, 0.17); headG.add(e1);
    const e2 = new THREE.Mesh(eyeGeo, eyeMat); e2.position.set(0.08, 0.22, 0.17); headG.add(e2);
    g.add(headG); parts.head = headG;

    // Bras : pivot à l'épaule
    function limb(w, h, d, color, px, py, downLen) {
      const pivot = new THREE.Group();
      pivot.position.set(px, py, 0);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), GAME.mat(color));
      mesh.position.y = -h / 2 + 0.02;
      mesh.castShadow = true;
      pivot.add(mesh);
      g.add(pivot);
      return pivot;
    }
    parts.armL = limb(0.14, 0.55, 0.14, shirt, -0.33, 1.32);
    parts.armR = limb(0.14, 0.55, 0.14, shirt, 0.33, 1.32);
    parts.legL = limb(0.17, 0.62, 0.18, pants, -0.14, 0.74);
    parts.legR = limb(0.17, 0.62, 0.18, pants, 0.14, 0.74);

    // Auréole de mentor (anneau doré flottant)
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
    return { group: g, parts, opts };
  }

  /* Anime l'humanoïde. state: 'idle' | 'walk' | 'run' | 'jump' ; t = temps global */
  function animate(ch, t, state, speedRatio) {
    const p = ch.parts;
    if (state === 'walk' || state === 'run') {
      const freq = state === 'run' ? 11 : 7;
      const amp = state === 'run' ? 1.0 : 0.55;
      const s = Math.sin(t * freq) * amp;
      p.armL.rotation.x = s; p.armR.rotation.x = -s;
      p.legL.rotation.x = -s; p.legR.rotation.x = s;
      p.torso.position.y = 1.06 + Math.abs(Math.cos(t * freq)) * 0.035;
      p.head.rotation.x = 0;
    } else if (state === 'jump') {
      p.armL.rotation.x = -2.4; p.armR.rotation.x = -2.4;
      p.legL.rotation.x = 0.5; p.legR.rotation.x = -0.3;
    } else { // idle : respiration lente
      const b = Math.sin(t * 1.6) * 0.03;
      p.armL.rotation.x = U.lerp(p.armL.rotation.x, b, 0.15);
      p.armR.rotation.x = U.lerp(p.armR.rotation.x, -b, 0.15);
      p.legL.rotation.x = U.lerp(p.legL.rotation.x, 0, 0.2);
      p.legR.rotation.x = U.lerp(p.legR.rotation.x, 0, 0.2);
      p.torso.position.y = 1.06 + b * 0.4;
      p.head.rotation.x = Math.sin(t * 0.8) * 0.04;
    }
    if (p.halo) { p.halo.position.y = 1.95 + Math.sin(t * 2) * 0.03; p.halo.rotation.z = t * 0.8; }
  }

  /* Pièces d'armure visibles sur le joueur */
  function addArmorPiece(ch, id) {
    const g = ch.group, parts = ch.parts;
    if (parts['armor_' + id]) return;
    let m = null;
    if (id === 'ceinture') {
      m = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.32), GAME.mat(0xc9a227));
      m.position.y = 0.78;
    } else if (id === 'chaussures') {
      m = new THREE.Group();
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.1, 0.26), GAME.mat(0xc9a227));
      s1.position.set(0, -0.58, 0.03);
      const s2 = s1.clone();
      parts.legL.add(s1); parts.legR.add(s2);
      parts['armor_' + id] = s1;
      return;
    } else if (id === 'cuirasse') {
      m = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.5, 0.34), GAME.mat(0xb8b8c8));
      m.position.y = 1.12;
    } else if (id === 'bouclier') {
      m = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 16), GAME.mat(0x8a6d1f));
      m.rotation.z = Math.PI / 2;
      m.position.set(-0.12, -0.4, 0);
      parts.armL.add(m);
      parts['armor_' + id] = m;
      return;
    } else if (id === 'casque') {
      m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.38), GAME.mat(0xc9a227));
      m.position.y = 0.42;
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
      m.position.set(0.05, -0.05, -0.18);
      m.rotation.x = 0.4;
      parts.torso.add(m);
      parts['armor_' + id] = m;
      return;
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

  return { create, animate, addArmorPiece, createSheep };
})();

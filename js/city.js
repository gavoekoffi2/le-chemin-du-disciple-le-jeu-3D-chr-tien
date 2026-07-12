/* ============================================================
   LA VOIE — Théopolis : génération procédurale de la ville
   Grille 7x7 de pâtés de maisons (60 m) séparés par des rues (12 m).
   Quartiers spéciaux : église, place & fontaine, parc + colline,
   champ du Semeur, marché, auberge, bibliothèque, entrepôts.
   ============================================================ */
GAME.buildCity = function (scene) {
  const U = GAME.U;
  const BLOCK = 60, ROAD = 12, PITCH = BLOCK + ROAD, N = 7;
  const HALF = (N * PITCH - ROAD) / 2;   // ≈ 246+? demi-étendue des blocs
  const LIMIT = HALF + 30;               // murs invisibles

  const world = {
    colliders: [],        // AABB {x1,z1,x2,z2}
    interactables: [],    // {id, tag, pos:Vector3, radius, label, onInteract, marker}
    lampPosts: [],        // {mesh, bulb, glow, pos}
    trafficCars: [],
    mapData: { roads: [], buildings: [], park: [], water: [], field: [] },
    timeOfDay: 8.5,
    limit: LIMIT,
    dynamic: []           // objets à animer (fontaine, drapeaux…)
  };

  // Points réservés (PNJ, quêtes, parchemins) : aucune construction dessus
  const reserved = [];
  for (const id in GAME.DATA.npcs) reserved.push(GAME.DATA.npcs[id].pos);
  GAME.DATA.hiddenVerses.forEach(v => reserved.push(v.pos));
  GAME.DATA.quests.forEach(q => q.steps.forEach(s => { if (s.pos) reserved.push(s.pos); }));
  reserved.push([0, 130]); // spawn joueur
  function isReserved(x, z, margin) {
    for (const p of reserved) if (Math.hypot(p[0] - x, p[1] - z) < margin) return true;
    return false;
  }

  function addCollider(x, z, w, d) {
    world.colliders.push({ x1: x - w / 2, z1: z - d / 2, x2: x + w / 2, z2: z + d / 2 });
  }

  /* ---------- Sol, relief ---------- */
  const HILL = { x: 216, z: -216, r: 34, h: 11 };
  world.groundHeight = function (x, z) {
    const d = Math.hypot(x - HILL.x, z - HILL.z);
    if (d < HILL.r) {
      const t = 1 - d / HILL.r;
      return HILL.h * t * t * (3 - 2 * t); // smoothstep
    }
    return 0;
  };

  // Grand sol herbeux (relief de la colline sculpté dans la géométrie)
  const groundGeo = new THREE.PlaneGeometry(720, 720, 90, 90);
  groundGeo.rotateX(-Math.PI / 2);
  const gpos = groundGeo.attributes.position;
  for (let i = 0; i < gpos.count; i++) {
    gpos.setY(i, world.groundHeight(gpos.getX(i), gpos.getZ(i)) - 0.05);
  }
  groundGeo.computeVertexNormals();
  const grassNoise = GAME.makeNoiseTexture(200, 90);
  grassNoise.repeat.set(90, 90);
  const ground = new THREE.Mesh(groundGeo,
    new THREE.MeshStandardMaterial({ color: 0x59854c, map: grassNoise, roughness: 0.95 }));
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---------- Rues ---------- */
  const asphaltNoise = GAME.makeNoiseTexture(120, 55);
  asphaltNoise.repeat.set(40, 1.5);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x3c4048, map: asphaltNoise, roughness: 0.98 });
  const sideNoise = GAME.makeNoiseTexture(190, 40);
  sideNoise.repeat.set(24, 1);
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x9a9aa2, map: sideNoise, roughness: 0.95 });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xd8d8b0 });
  const roadGroup = new THREE.Group();
  const center = i => (i - (N - 1) / 2) * PITCH;

  for (let i = 0; i <= N; i++) {
    const c = (i - N / 2) * PITCH; // axe des rues
    if (i === 0 || i === N) continue; // pas de rue périphérique extérieure
    // rue horizontale (est-ouest) et verticale (nord-sud)
    const h = new THREE.Mesh(new THREE.PlaneGeometry(N * PITCH, ROAD), roadMat);
    h.rotation.x = -Math.PI / 2; h.position.set(0, 0.02, c);
    roadGroup.add(h);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(ROAD, N * PITCH), roadMat);
    v.rotation.x = -Math.PI / 2; v.position.set(c, 0.02, 0);
    roadGroup.add(v);
    world.mapData.roads.push({ x: -HALF, z: c - ROAD / 2, w: 2 * HALF, d: ROAD });
    world.mapData.roads.push({ x: c - ROAD / 2, z: -HALF, w: ROAD, d: 2 * HALF });
  }
  scene.add(roadGroup);

  // lignes médianes : un seul InstancedMesh pour toutes les rues (économie de draw calls)
  {
    const dashGeo = new THREE.PlaneGeometry(6, 0.4);
    dashGeo.rotateX(-Math.PI / 2);
    const dashes = [];
    for (let i = 1; i < N; i++) {
      const c = (i - N / 2) * PITCH;
      for (let s = -HALF; s < HALF; s += 14) {
        dashes.push([s + 3, c, 0]);            // rue est-ouest
        dashes.push([c, s + 3, Math.PI / 2]);  // rue nord-sud
      }
    }
    const inst = new THREE.InstancedMesh(dashGeo, lineMat, dashes.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    dashes.forEach((d, i) => {
      q.setFromAxisAngle(up, d[2]);
      m4.compose(new THREE.Vector3(d[0], 0.03, d[1]), q, new THREE.Vector3(1, 1, 1));
      inst.setMatrixAt(i, m4);
    });
    scene.add(inst);
  }

  // trottoirs : bandes claires autour des blocs (un seul InstancedMesh)
  {
    const stripGeo = new THREE.PlaneGeometry(BLOCK + 6, 2.6);
    stripGeo.rotateX(-Math.PI / 2);
    const strips = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (r === 0 && c === 6) continue; // pas de trottoir sur la colline (relief)
        const bx = center(c), bz = center(r);
        strips.push([bx, bz - BLOCK / 2 - 1.3, 0]);
        strips.push([bx, bz + BLOCK / 2 + 1.3, 0]);
        strips.push([bx - BLOCK / 2 - 1.3, bz, Math.PI / 2]);
        strips.push([bx + BLOCK / 2 + 1.3, bz, Math.PI / 2]);
      }
    }
    const inst2 = new THREE.InstancedMesh(stripGeo, sideMat, strips.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    strips.forEach((s, i) => {
      q.setFromAxisAngle(up, s[2]);
      m4.compose(new THREE.Vector3(s[0], 0.045, s[1]), q, new THREE.Vector3(1, 1, 1));
      inst2.setMatrixAt(i, m4);
    });
    inst2.receiveShadow = true;
    scene.add(inst2);
  }

  /* ---------- Types de blocs ---------- */
  //  P = parc, H = colline, C = église, Z = place, F = champ, M = marché,
  //  A = auberge, B = bibliothèque, W = entrepôts, r = résidentiel, c = commercial
  const layout = [
    // col:   0    1    2    3    4    5    6        (x de -216 à +216)
    /*z=-216*/['r', 'r', 'c', 'c', 'c', 'P', 'H'],
    /*z=-144*/['r', 'r', 'c', 'c', 'c', 'P', 'P'],
    /*z=-72 */['r', 'r', 'c', 'c', 'c', 'r', 'r'],
    /*z=0   */['r', 'c', 'M', 'C', 'B', 'c', 'r'],
    /*z=72  */['r', 'r', 'A', 'Z', 'r', 'r', 'r'],
    /*z=144 */['r', 'r', 'r', 'r', 'r', 'W', 'W'],
    /*z=216 */['F', 'F', 'r', 'r', 'r', 'W', 'W']
  ];

  /* ---------- Géométries partagées ---------- */
  const treeTrunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 1.6, 6);
  const treeLeafGeo = new THREE.ConeGeometry(1.6, 3.2, 7);
  const treeLeafGeo2 = new THREE.SphereGeometry(1.7, 7, 6);
  const bushGeo = new THREE.SphereGeometry(0.8, 6, 5);
  const trunkMat = GAME.mat(0x6b4a2a);
  const leafMats = [GAME.mat(0x2e6b34), GAME.mat(0x3a7a3a), GAME.mat(0x4a8a3a), GAME.mat(0x7a9a3a)];

  function addTree(x, z, big) {
    if (isReserved(x, z, 4)) return;
    const g = new THREE.Group();
    const y = world.groundHeight(x, z);
    const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
    trunk.position.y = 0.8;
    trunk.castShadow = true;
    g.add(trunk);
    const leaf = new THREE.Mesh(Math.random() < 0.5 ? treeLeafGeo : treeLeafGeo2, U.pick(leafMats));
    leaf.position.y = big ? 3.2 : 2.6;
    leaf.castShadow = true;
    g.add(leaf);
    const s = big ? U.rand(1.2, 1.8) : U.rand(0.8, 1.2);
    g.scale.setScalar(s);
    g.position.set(x, y, z);
    g.rotation.y = Math.random() * Math.PI;
    scene.add(g);
    addCollider(x, z, 0.9 * s, 0.9 * s);
  }

  function addBush(x, z) {
    if (isReserved(x, z, 3)) return;
    const b = new THREE.Mesh(bushGeo, U.pick(leafMats));
    b.position.set(x, world.groundHeight(x, z) + 0.5, z);
    b.scale.set(U.rand(0.8, 1.4), U.rand(0.6, 1), U.rand(0.8, 1.4));
    scene.add(b);
  }

  /* ---------- Lampadaires ---------- */
  const lampPoleGeo = new THREE.CylinderGeometry(0.08, 0.12, 4.6, 6);
  const lampHeadGeo = new THREE.SphereGeometry(0.28, 8, 6);
  const poleMat = GAME.mat(0x2a2f3a);
  const glowTexCache = (function () {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grd.addColorStop(0, 'rgba(255,220,140,0.9)');
    grd.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  function addLamp(x, z) {
    if (isReserved(x, z, 2.5)) return null;
    const g = new THREE.Group();
    const pole = new THREE.Mesh(lampPoleGeo, poleMat);
    pole.position.y = 2.3;
    g.add(pole);
    const bulbMat = new THREE.MeshLambertMaterial({ color: 0x888877, emissive: 0x000000 });
    const bulb = new THREE.Mesh(lampHeadGeo, bulbMat);
    bulb.position.y = 4.7;
    g.add(bulb);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexCache, color: 0xffdd88, transparent: true, opacity: 0, depthWrite: false
    }));
    glow.scale.setScalar(5);
    glow.position.y = 4.7;
    g.add(glow);
    g.position.set(x, world.groundHeight(x, z), z);
    scene.add(g);
    const lamp = { mesh: g, bulb, bulbMat, glow, pos: new THREE.Vector3(x, 0, z), lit: true };
    world.lampPosts.push(lamp);
    return lamp;
  }

  // Lampadaires aux coins des blocs
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const bx = center(c), bz = center(r);
      if ((r + c) % 2 === 0) addLamp(bx - BLOCK / 2 - 2, bz - BLOCK / 2 - 2);
      if ((r * c + r) % 3 === 0) addLamp(bx + BLOCK / 2 + 2, bz + BLOCK / 2 + 2);
    }
  }

  /* ---------- Mobilier urbain : bancs et abribus ---------- */
  function addStreetBench(x, z, yaw) {
    if (isReserved(x, z, 3)) return;
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.6), GAME.mat(0x7a5a3a));
    seat.position.y = 0.5;
    g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 0.1), GAME.mat(0x7a5a3a));
    back.position.set(0, 0.85, -0.28);
    g.add(back);
    [[-0.9], [0.9]].forEach(([ox]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.55), GAME.mat(0x3a3f4a));
      leg.position.set(ox, 0.25, 0);
      g.add(leg);
    });
    g.position.set(x, world.groundHeight(x, z), z);
    g.rotation.y = yaw;
    scene.add(g);
    addCollider(x, z, 2.2, 0.8);
  }

  function addBusStop(x, z, yaw) {
    if (isReserved(x, z, 4)) return;
    const g = new THREE.Group();
    // poteaux + toit vitré
    [[-1.6, 0], [1.6, 0]].forEach(([ox, oz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), GAME.mat(0x2a2f3a));
      pole.position.set(ox, 1.3, oz - 0.5);
      g.add(pole);
    });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x88aacc, transparent: true, opacity: 0.7, roughness: 0.3 }));
    roof.position.set(0, 2.6, -0.2);
    g.add(roof);
    // panneau
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.06), GAME.mat(0x3a76c4));
    sign.position.set(-1.6, 2.1, -0.5);
    g.add(sign);
    // banc intégré
    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.5), GAME.mat(0x8a8a92));
    seat.position.set(0, 0.55, -0.7);
    g.add(seat);
    g.position.set(x, world.groundHeight(x, z), z);
    g.rotation.y = yaw;
    scene.add(g);
    addCollider(x, z - 0.5, 4, 1.6);
  }

  // bancs le long des trottoirs (dispersés)
  for (let i = 0; i < 22; i++) {
    const roadIdx = U.randInt(1, N - 1);
    const c = (roadIdx - N / 2) * PITCH;
    const along = U.rand(-HALF + 24, HALF - 24);
    const side = Math.random() < 0.5 ? -1 : 1;
    const horiz = Math.random() < 0.5;
    if (horiz) addStreetBench(along, c + side * 8.8, side > 0 ? Math.PI : 0);
    else addStreetBench(c + side * 8.8, along, side > 0 ? -Math.PI / 2 : Math.PI / 2);
  }
  // abribus près des grands axes
  addBusStop(20, -44.5, 0);
  addBusStop(-20, 44.5, Math.PI);
  addBusStop(116.5, 20, Math.PI / 2);
  addBusStop(-116.5, -20, -Math.PI / 2);

  /* ---------- Immeubles ---------- */
  // paire de textures : façade (jour) + masque émissif (fenêtres qui s'allument la nuit)
  function makeFacadeTextures(baseColor) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 128;
    const ctx = c.getContext('2d');
    const e = document.createElement('canvas');
    e.width = 64; e.height = 128;
    const ectx = e.getContext('2d');
    ctx.fillStyle = baseColor; ctx.fillRect(0, 0, 64, 128);
    ectx.fillStyle = '#000000'; ectx.fillRect(0, 0, 64, 128);
    for (let y = 6; y < 122; y += 14) {
      for (let x = 6; x < 58; x += 14) {
        const lit = Math.random() < 0.4; // fenêtres qui s'allumeront la nuit
        ctx.fillStyle = '#1c2333';
        ctx.fillRect(x, y, 8, 9);
        if (lit) { ectx.fillStyle = '#ffd98c'; ectx.fillRect(x, y, 8, 9); }
      }
    }
    const map = new THREE.CanvasTexture(c);
    const emissiveMap = new THREE.CanvasTexture(e);
    map.magFilter = emissiveMap.magFilter = THREE.NearestFilter;
    map.encoding = emissiveMap.encoding = THREE.sRGBEncoding;
    return { map, emissiveMap };
  }
  const facades = [makeFacadeTextures('#4a5568'), makeFacadeTextures('#5a4a48'),
                   makeFacadeTextures('#3a4a5a'), makeFacadeTextures('#6a625a')];
  world.buildingMats = [];
  const buildingPalette = [0x8a94a8, 0xa89a8a, 0x7a8a9a, 0x9a8aa0, 0xb0a890, 0x8898a0];
  const housePalette = [0xd8c8a8, 0xc8b098, 0xe0d0b0, 0xb8c0a8, 0xd0b8a0, 0xc0a890];
  const roofPalette = [0x8a3a2a, 0x6a3a4a, 0x4a3a6a, 0x7a4a2a];

  function addBuilding(x, z, w, d, floors, isTower) {
    if (isReserved(x, z, Math.max(w, d) / 2 + 3)) return;
    const h = floors * 3.2;
    const fac = U.pick(facades);
    const mat = new THREE.MeshStandardMaterial({
      map: fac.map.clone(), emissiveMap: fac.emissiveMap.clone(),
      emissive: 0xffcc77, emissiveIntensity: 0, roughness: 0.85
    });
    const rx = Math.max(1, Math.round(w / 6)), ry = Math.max(1, Math.round(floors / 2.2));
    [mat.map, mat.emissiveMap].forEach(tx => {
      tx.needsUpdate = true;
      tx.repeat.set(rx, ry);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    });
    world.buildingMats.push(mat);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    body.position.set(x, h / 2, z);
    body.castShadow = true; body.receiveShadow = true;
    scene.add(body);
    // toit
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.5, d + 0.6), GAME.mat(0x3a3f4a));
    roof.position.set(x, h + 0.25, z);
    scene.add(roof);
    addCollider(x, z, w, d);
    world.mapData.buildings.push({ x: x - w / 2, z: z - d / 2, w, d });
  }

  function addHouse(x, z, w, d) {
    if (isReserved(x, z, Math.max(w, d) / 2 + 3)) return;
    const h = U.rand(3, 4.2);
    const wall = GAME.mat(U.pick(housePalette));
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall);
    body.position.set(x, h / 2, z);
    body.castShadow = true; body.receiveShadow = true;
    scene.add(body);
    // toit pointu
    const roofH = U.rand(1.6, 2.6);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.75, roofH, 4), GAME.mat(U.pick(roofPalette)));
    roof.position.set(x, h + roofH / 2, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    scene.add(roof);
    // porte
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.12), GAME.mat(0x5a3a22));
    door.position.set(x, 0.85, z + d / 2 + 0.05);
    scene.add(door);
    addCollider(x, z, w, d);
    world.mapData.buildings.push({ x: x - w / 2, z: z - d / 2, w, d });
  }

  function addWarehouse(x, z) {
    if (isReserved(x, z, 14)) return;
    const w = U.rand(18, 24), d = U.rand(14, 20), h = U.rand(6, 8);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), GAME.mat(U.pick([0x8a7a6a, 0x7a7a72, 0x6a7a7a])));
    body.position.set(x, h / 2, z);
    body.castShadow = true;
    scene.add(body);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(d / 2, d / 2, w, 10, 1, false, 0, Math.PI), GAME.mat(0x5a626a));
    roof.rotation.z = Math.PI / 2;
    roof.position.set(x, h, z);
    scene.add(roof);
    addCollider(x, z, w, d);
    world.mapData.buildings.push({ x: x - w / 2, z: z - d / 2, w, d });
  }

  /* ---------- Blocs spéciaux ---------- */
  const stoneNoise = GAME.makeNoiseTexture(205, 22, 128, 6);
  stoneNoise.repeat.set(10, 10);
  function pavedMat(color) {
    return new THREE.MeshStandardMaterial({ color, map: stoneNoise, roughness: 0.92 });
  }
  function buildChurch(bx, bz) {
    // parvis
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(BLOCK, BLOCK), pavedMat(0xa39b8d));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(bx, 0.03, bz);
    plaza.receiveShadow = true;
    scene.add(plaza);
    // nef
    const nave = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 30), GAME.mat(0xe8e0d0));
    nave.position.set(bx, 6, bz - 8);
    nave.castShadow = true;
    scene.add(nave);
    addCollider(bx, bz - 8, 18, 30);
    // toit
    const naveRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 12, 7, 4, 1), GAME.mat(0x7a2a2a));
    naveRoof.rotation.y = Math.PI / 4;
    naveRoof.scale.set(1, 1, 1.8);
    naveRoof.position.set(bx, 15.5, bz - 8);
    scene.add(naveRoof);
    // clocher
    const tower = new THREE.Mesh(new THREE.BoxGeometry(7, 24, 7), GAME.mat(0xe8e0d0));
    tower.position.set(bx, 12, bz + 10);
    tower.castShadow = true;
    scene.add(tower);
    addCollider(bx, bz + 10, 7, 7);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(5, 8, 4), GAME.mat(0x7a2a2a));
    spire.rotation.y = Math.PI / 4;
    spire.position.set(bx, 28, bz + 10);
    scene.add(spire);
    // croix dorée
    const crossMat = new THREE.MeshLambertMaterial({ color: 0xf0c040, emissive: 0x664400 });
    const cv = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), crossMat);
    cv.position.set(bx, 34, bz + 10);
    scene.add(cv);
    const chz = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.5), crossMat);
    chz.position.set(bx, 34.8, bz + 10);
    scene.add(chz);
    // portail
    const dr = new THREE.Mesh(new THREE.BoxGeometry(3, 4.6, 0.3), GAME.mat(0x5a3a22));
    dr.position.set(bx, 2.3, bz + 13.6);
    scene.add(dr);
    // vitraux (plans émissifs colorés)
    [-6, 0, 6].forEach(off => {
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(2, 4),
        new THREE.MeshBasicMaterial({ color: U.pick([0x4488cc, 0xcc6688, 0x66aa66]) }));
      glass.position.set(bx + 9.06, 7, bz - 8 + off);
      glass.rotation.y = Math.PI / 2;
      scene.add(glass);
      const glass2 = glass.clone();
      glass2.position.x = bx - 9.06;
      glass2.rotation.y = -Math.PI / 2;
      scene.add(glass2);
    });
    world.mapData.buildings.push({ x: bx - 9, z: bz - 23, w: 18, d: 30, color: '#e8e0d0' });
  }

  function buildPlaza(bx, bz) {
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(BLOCK, BLOCK), pavedMat(0xa08e6f));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(bx, 0.03, bz);
    plaza.receiveShadow = true;
    scene.add(plaza);
    // fontaine (0, 96) — bassin + jet
    const fx = 0, fz = 96;
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.8, 1, 16), GAME.mat(0x9a9aa8));
    basin.position.set(fx, 0.5, fz);
    scene.add(basin);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.3, 16),
      new THREE.MeshLambertMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.85 }));
    water.position.set(fx, 0.95, fz);
    scene.add(water);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.6, 10), GAME.mat(0x9a9aa8));
    pillar.position.set(fx, 1.8, fz);
    scene.add(pillar);
    const jet = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x9fdcf7, transparent: true, opacity: 0.7 }));
    jet.position.set(fx, 3.4, fz);
    scene.add(jet);
    world.dynamic.push(t => { jet.scale.setScalar(1 + Math.sin(t * 5) * 0.15); });
    addCollider(fx, fz, 9, 9);
    // bancs autour
    for (let a = 0; a < 6; a++) {
      const ang = a / 6 * Math.PI * 2;
      const px = fx + Math.cos(ang) * 9, pz = fz + Math.sin(ang) * 9;
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.7), GAME.mat(0x7a5a3a));
      bench.position.set(px, 0.35, pz);
      bench.rotation.y = -ang + Math.PI / 2;
      scene.add(bench);
    }
    [-24, 24].forEach(off => { addTree(bx + off, bz + 22, false); addTree(bx + off, bz - 22, false); });
  }

  const parkNoise = GAME.makeNoiseTexture(205, 70);
  parkNoise.repeat.set(14, 14);
  const parkMat = new THREE.MeshStandardMaterial({ color: 0x63975a, map: parkNoise, roughness: 0.95 });
  function buildPark(bx, bz, hasHill) {
    // herbe plus claire
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(BLOCK + 6, BLOCK + 6, 8, 8), parkMat);
    grass.rotation.x = -Math.PI / 2;
    const gp = grass.geometry.attributes.position;
    // épouse le relief (attention : plane tournée => y local = -z monde… on sculpte via world pos)
    grass.position.set(bx, 0.06, bz);
    grass.updateMatrixWorld();
    for (let i = 0; i < gp.count; i++) {
      const wx = gp.getX(i) + bx, wz = -gp.getY(i) + bz;
      gp.setZ(i, world.groundHeight(wx, wz));
    }
    grass.geometry.computeVertexNormals();
    scene.add(grass);
    world.mapData.park.push({ x: bx - BLOCK / 2, z: bz - BLOCK / 2, w: BLOCK, d: BLOCK });

    if (hasHill) {
      // croix au sommet de la colline
      const cy = world.groundHeight(HILL.x, HILL.z);
      const crossMat = new THREE.MeshLambertMaterial({ color: 0xe8d8b0, emissive: 0x332200 });
      const cv = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7, 0.8), crossMat);
      cv.position.set(HILL.x, cy + 3.5, HILL.z - 6);
      cv.castShadow = true;
      scene.add(cv);
      const ch = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.8, 0.8), crossMat);
      ch.position.set(HILL.x, cy + 5.2, HILL.z - 6);
      scene.add(ch);
      addCollider(HILL.x, HILL.z - 6, 1.2, 1.2);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        addTree(HILL.x + Math.cos(a) * 26, HILL.z + Math.sin(a) * 26, true);
      }
    } else {
      // étang
      if (Math.abs(bx - 144) < 5 && Math.abs(bz + 144) < 5) {
        const pond = new THREE.Mesh(new THREE.CircleGeometry(10, 20),
          new THREE.MeshLambertMaterial({ color: 0x4fa3d7, transparent: true, opacity: 0.9 }));
        pond.rotation.x = -Math.PI / 2;
        pond.position.set(bx + 8, 0.1, bz + 8);
        scene.add(pond);
        world.mapData.water.push({ x: bx + 8, z: bz + 8, r: 10 });
        addCollider(bx + 8, bz + 8, 16, 16);
      }
      for (let i = 0; i < 9; i++) addTree(bx + U.rand(-26, 26), bz + U.rand(-26, 26), Math.random() < 0.4);
      for (let i = 0; i < 5; i++) addBush(bx + U.rand(-26, 26), bz + U.rand(-26, 26));
    }
  }

  const soilNoise = GAME.makeNoiseTexture(150, 80);
  soilNoise.repeat.set(10, 10);
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x7a5a34, map: soilNoise, roughness: 1 });
  function buildField(bx, bz) {
    const soil = new THREE.Mesh(new THREE.PlaneGeometry(BLOCK, BLOCK), soilMat);
    soil.rotation.x = -Math.PI / 2;
    soil.position.set(bx, 0.05, bz);
    soil.receiveShadow = true;
    scene.add(soil);
    world.mapData.field.push({ x: bx - BLOCK / 2, z: bz - BLOCK / 2, w: BLOCK, d: BLOCK });
    // sillons
    for (let i = -4; i <= 4; i++) {
      const row = new THREE.Mesh(new THREE.BoxGeometry(BLOCK - 8, 0.3, 1.2), GAME.mat(0x6a4a28));
      row.position.set(bx, 0.2, bz + i * 6);
      scene.add(row);
    }
    // clôture
    const fenceMat = GAME.mat(0x8a6a4a);
    for (let s = -BLOCK / 2; s <= BLOCK / 2; s += 6) {
      [[bx + s, bz - BLOCK / 2], [bx + s, bz + BLOCK / 2]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 0.3), fenceMat);
        post.position.set(px, 0.7, pz);
        scene.add(post);
      });
    }
    // petite grange
    if (bx < -200) {
      const barn = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 6), GAME.mat(0x9a3a2a));
      barn.position.set(bx - 20, 2.5, bz - 20);
      barn.castShadow = true;
      scene.add(barn);
      addCollider(bx - 20, bz - 20, 8, 6);
    }
  }

  function buildMarket(bx, bz) {
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(BLOCK, BLOCK), pavedMat(0xb0a088));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(bx, 0.03, bz);
    scene.add(plaza);
    // étals colorés
    const awningColors = [0xcc4444, 0x44aa66, 0xddaa33, 0x4477cc];
    for (let i = 0; i < 4; i++) {
      const sx = bx - 15 + (i % 2) * 30, sz = bz - 12 + Math.floor(i / 2) * 24;
      if (isReserved(sx, sz, 4)) continue;
      const table = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 2), GAME.mat(0x7a5a3a));
      table.position.set(sx, 0.5, sz);
      scene.add(table);
      const awn = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.2, 2.8), GAME.mat(awningColors[i]));
      awn.position.set(sx, 2.6, sz);
      scene.add(awn);
      [[-2, -1], [2, -1], [-2, 1], [2, 1]].forEach(([ox, oz]) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5), GAME.mat(0x5a4a3a));
        pole.position.set(sx + ox, 1.3, sz + oz * 1.2);
        scene.add(pole);
      });
      addCollider(sx, sz, 4, 2);
    }
    // boutique de Samuel
    addHouse(bx, bz - 20, 12, 8);
  }

  function buildInn(bx, bz) {
    if (!isReserved(bx, bz - 6, 0)) { /* l'auberge occupe le centre du bloc */ }
    const h = 7;
    const body = new THREE.Mesh(new THREE.BoxGeometry(20, h, 14), GAME.mat(0xc8a878));
    body.position.set(bx, h / 2, bz - 8);
    body.castShadow = true;
    scene.add(body);
    addCollider(bx, bz - 8, 20, 14);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(15, 4, 4), GAME.mat(0x8a3a2a));
    roof.rotation.y = Math.PI / 4;
    roof.position.set(bx, h + 2, bz - 8);
    scene.add(roof);
    // enseigne « colombe »
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.2, 0.2), GAME.mat(0xf0e8d0));
    sign.position.set(bx, 5, bz - 0.8);
    scene.add(sign);
    world.mapData.buildings.push({ x: bx - 10, z: bz - 15, w: 20, d: 14 });
    addTree(bx - 16, bz + 14, false);
    addTree(bx + 16, bz + 14, false);
  }

  function buildLibrary(bx, bz) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(24, 1.2, 18), GAME.mat(0xb8b8b0));
    base.position.set(bx, 0.6, bz - 6);
    scene.add(base);
    const body = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 14), GAME.mat(0xd8d0c0));
    body.position.set(bx, 5.2, bz - 6);
    body.castShadow = true;
    scene.add(body);
    addCollider(bx, bz - 6, 24, 18);
    // colonnes
    for (let i = -2; i <= 2; i++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 8, 8), GAME.mat(0xe8e0d0));
      col.position.set(bx + i * 4.4, 5.2, bz + 1.6);
      scene.add(col);
    }
    const pediment = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 11, 3, 3, 1), GAME.mat(0xc8c0b0));
    pediment.rotation.y = Math.PI / 2;
    pediment.scale.set(1, 1, 0.4);
    pediment.position.set(bx, 10.7, bz - 6);
    scene.add(pediment);
    world.mapData.buildings.push({ x: bx - 10, z: bz - 13, w: 20, d: 14 });
  }

  function buildResidential(bx, bz) {
    const slots = [[-18, -18], [18, -18], [-18, 18], [18, 18]];
    slots.forEach(([ox, oz]) => {
      if (Math.random() < 0.85) addHouse(bx + ox, bz + oz, U.rand(8, 12), U.rand(7, 10));
      else addTree(bx + ox, bz + oz, true);
    });
    addBush(bx, bz + U.rand(-8, 8));
    if (Math.random() < 0.5) addTree(bx + U.rand(-6, 6), bz, false);
  }

  function buildCommercial(bx, bz) {
    const slots = [[-16, -16], [16, -16], [-16, 16], [16, 16]];
    slots.forEach(([ox, oz]) => {
      if (Math.random() < 0.9) addBuilding(bx + ox, bz + oz, U.rand(14, 20), U.rand(12, 18), U.randInt(3, 9), true);
    });
  }

  function buildWarehouses(bx, bz) {
    addWarehouse(bx - 14, bz - 14);
    addWarehouse(bx + 14, bz + 14);
    // caisses
    for (let i = 0; i < 4; i++) {
      const cx = bx + U.rand(-24, 24), cz = bz + U.rand(-24, 24);
      if (isReserved(cx, cz, 3)) continue;
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), GAME.mat(0x9a7a4a));
      crate.position.set(cx, 0.8, cz);
      crate.rotation.y = Math.random();
      scene.add(crate);
      addCollider(cx, cz, 1.8, 1.8);
    }
  }

  /* ---------- Construction des blocs ---------- */
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const bx = center(c), bz = center(r);
      const t = layout[r][c];
      if (t === 'C') buildChurch(bx, bz);
      else if (t === 'Z') buildPlaza(bx, bz);
      else if (t === 'P') buildPark(bx, bz, false);
      else if (t === 'H') buildPark(bx, bz, true);
      else if (t === 'F') buildField(bx, bz);
      else if (t === 'M') buildMarket(bx, bz);
      else if (t === 'A') buildInn(bx, bz);
      else if (t === 'B') buildLibrary(bx, bz);
      else if (t === 'W') buildWarehouses(bx, bz);
      else if (t === 'c') buildCommercial(bx, bz);
      else buildResidential(bx, bz);
    }
  }

  /* ---------- Voitures (décor + circulation simple) ---------- */
  const carColors = [0xc0392b, 0x2980b9, 0xf1c40f, 0x7f8c8d, 0x27ae60, 0x8e44ad];
  function makeCar(color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 4.2), GAME.mat(color));
    body.position.y = 0.7;
    body.castShadow = true;
    g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2.2), GAME.mat(0x222833));
    cab.position.set(0, 1.4, -0.2);
    g.add(cab);
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 10);
    const wheelMat = GAME.mat(0x1a1a1a);
    [[-1, 1.3], [1, 1.3], [-1, -1.3], [1, -1.3]].forEach(([x, z]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.35, z);
      g.add(w);
    });
    return g;
  }

  // voitures garées
  for (let i = 0; i < 14; i++) {
    const roadIdx = U.randInt(1, N - 1);
    const c = (roadIdx - N / 2) * PITCH;
    const along = U.rand(-HALF + 20, HALF - 20);
    const horiz = Math.random() < 0.5;
    const x = horiz ? along : c + (Math.random() < 0.5 ? -4 : 4);
    const z = horiz ? c + (Math.random() < 0.5 ? -4 : 4) : along;
    if (isReserved(x, z, 5)) continue;
    const car = makeCar(U.pick(carColors));
    car.position.set(x, 0, z);
    car.rotation.y = horiz ? Math.PI / 2 : 0;
    scene.add(car);
    addCollider(x, z, horiz ? 4.4 : 2.2, horiz ? 2.2 : 4.4);
  }

  // circulation : voitures qui font des boucles sur les avenues
  const loops = [
    { axis: 'x', c: -36, dir: 1 }, { axis: 'x', c: 36, dir: -1 },
    { axis: 'z', c: -108, dir: 1 }, { axis: 'z', c: 108, dir: -1 },
    { axis: 'x', c: -180, dir: -1 }, { axis: 'z', c: 180, dir: 1 }
  ];
  loops.forEach((lp, i) => {
    const car = makeCar(carColors[i % carColors.length]);
    scene.add(car);
    world.trafficCars.push({
      mesh: car, axis: lp.axis, c: lp.c + (lp.dir > 0 ? -3 : 3), dir: lp.dir,
      t: U.rand(-HALF + 10, HALF - 10), speed: U.rand(8, 13)
    });
  });

  world.updateTraffic = function (dt) {
    world.trafficCars.forEach(tc => {
      tc.t += tc.dir * tc.speed * dt;
      if (tc.t > HALF - 6) { tc.t = HALF - 6; tc.dir = -1; }
      if (tc.t < -HALF + 6) { tc.t = -HALF + 6; tc.dir = 1; }
      if (tc.axis === 'x') {
        tc.mesh.position.set(tc.t, 0, tc.c);
        tc.mesh.rotation.y = tc.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        tc.mesh.position.set(tc.c, 0, tc.t);
        tc.mesh.rotation.y = tc.dir > 0 ? 0 : Math.PI;
      }
    });
  };

  /* ---------- Panneaux indicateurs des lieux ---------- */
  function addSign(x, z, text) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2a2f3a'; ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, 252, 60);
    ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 26px Georgia';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 33);
    const tex = new THREE.CanvasTexture(c);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false }));
    sprite.scale.set(10, 2.5, 1);
    sprite.position.set(x, 7 + world.groundHeight(x, z), z);
    scene.add(sprite);
  }
  addSign(0, 20, '⛪ Église de la Grâce');
  addSign(-72, 24, '🍞 Marché');
  addSign(-94, 2, '🧵 Chez Tabitha');
  addSign(72, 32, '📚 Bibliothèque');
  addSign(-72, 88, '🕊 Auberge de la Colombe');
  addSign(180, -180, '🌳 Grand Parc');
  addSign(216, -196, '✝ Colline de la Prière');
  addSign(-216, 186, '🌾 Champ du Semeur');

  /* ---------- Ciel, lumières, cycle jour/nuit ---------- */
  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x6a5a44, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.1);
  sun.position.set(120, 180, 80);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -140; sun.shadow.camera.right = 140;
  sun.shadow.camera.top = 140; sun.shadow.camera.bottom = -140;
  sun.shadow.camera.far = 600;
  scene.add(sun);
  scene.add(sun.target);
  const moonLight = new THREE.DirectionalLight(0x8899cc, 0);
  moonLight.position.set(-100, 120, -60);
  scene.add(moonLight);

  // soleil / lune visibles
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(8, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
  scene.add(sunMesh);
  const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xd8e0f0 }));
  scene.add(moonMesh);

  // étoiles
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 400; i++) {
    const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI * 0.45;
    const r = 500;
    starPos.push(Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r + 40, Math.sin(a) * Math.cos(b) * r);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, transparent: true, opacity: 0 }));
  scene.add(stars);

  /* ---------- Nuages ---------- */
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  const clouds = [];
  for (let i = 0; i < 13; i++) {
    const cg = new THREE.Group();
    const n = U.randInt(3, 5);
    for (let k = 0; k < n; k++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(U.rand(5, 10), 8, 6), cloudMat);
      puff.position.set(U.rand(-12, 12), U.rand(-2, 2), U.rand(-6, 6));
      puff.scale.y = 0.55;
      cg.add(puff);
    }
    cg.position.set(U.rand(-330, 330), U.rand(62, 100), U.rand(-330, 330));
    scene.add(cg);
    clouds.push({ g: cg, speed: U.rand(1.2, 2.8) });
  }

  /* ---------- Oiseaux ---------- */
  const birdMat = GAME.mat(0x2a2f38);
  const flocks = [];
  for (let f = 0; f < 3; f++) {
    const flock = { cx: U.rand(-150, 150), cz: U.rand(-150, 150), r: U.rand(30, 55), h: U.rand(30, 45), w: U.rand(0.15, 0.3), birds: [] };
    for (let b = 0; b < 4; b++) {
      const bird = new THREE.Group();
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.22), birdMat);
      w1.rotation.z = 0.4; w1.position.x = -0.4;
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.22), birdMat);
      w2.rotation.z = -0.4; w2.position.x = 0.4;
      bird.add(w1); bird.add(w2);
      bird.userData = { off: b * 0.6, w1, w2 };
      scene.add(bird);
      flock.birds.push(bird);
    }
    flocks.push(flock);
  }

  scene.fog = new THREE.Fog(0xbfd8ee, 150, 520);

  const skyDay = new THREE.Color(0x87b8e8), skyNight = new THREE.Color(0x0a1026),
        skyDawn = new THREE.Color(0xe8a86a);
  const tmpCol = new THREE.Color();

  world.updateDayNight = function (dt, playerPos) {
    world.timeOfDay = (world.timeOfDay + dt * 24 / 600) % 24; // 1 journée = 10 min
    const h = world.timeOfDay;
    const tnow = performance.now() * 0.001;

    // nuages qui dérivent
    clouds.forEach(c => {
      c.g.position.x += c.speed * dt;
      if (c.g.position.x > 360) c.g.position.x = -360;
    });

    // vols d'oiseaux circulaires (le jour seulement)
    const birdDay = h > 6 && h < 20;
    flocks.forEach(fl => {
      fl.birds.forEach(bird => {
        bird.visible = birdDay;
        if (!birdDay) return;
        const a = tnow * fl.w + bird.userData.off;
        bird.position.set(fl.cx + Math.cos(a) * fl.r, fl.h + Math.sin(a * 2) * 2, fl.cz + Math.sin(a) * fl.r);
        bird.rotation.y = -a - Math.PI / 2;
        const flap = Math.sin(tnow * 7 + bird.userData.off) * 0.5;
        bird.userData.w1.rotation.z = 0.35 + flap;
        bird.userData.w2.rotation.z = -0.35 - flap;
      });
    });
    // luminosité du jour : 0 la nuit, 1 en plein jour
    let dayness;
    if (h < 5 || h >= 21) dayness = 0;
    else if (h < 7) dayness = (h - 5) / 2;
    else if (h < 19) dayness = 1;
    else dayness = 1 - (h - 19) / 2;
    const dawn = Math.max(0, 1 - Math.abs(h - 6.5)) + Math.max(0, 1 - Math.abs(h - 19.5));

    tmpCol.copy(skyNight).lerp(skyDay, dayness);
    if (dawn > 0) tmpCol.lerp(skyDawn, dawn * 0.5);
    if (GAME.renderer) GAME.renderer.setClearColor(tmpCol);
    scene.fog.color.copy(tmpCol);

    // intensités adaptées au tone mapping filmique (ACES)
    sun.intensity = 1.3 * dayness;
    hemi.intensity = 0.32 + 0.5 * dayness;
    moonLight.intensity = 0.38 * (1 - dayness);
    stars.material.opacity = (1 - dayness) * 0.9;
    cloudMat.color.setScalar(0.35 + 0.65 * dayness);
    cloudMat.opacity = 0.5 + 0.42 * dayness;

    // les fenêtres des immeubles s'allument à la tombée de la nuit
    const glow = Math.pow(1 - dayness, 1.5) * 1.4;
    world.buildingMats.forEach(m => { m.emissiveIntensity = glow; });

    // position du soleil (angle selon l'heure)
    const ang = ((h - 6) / 12) * Math.PI; // 6h = lever, 18h = coucher
    const sr = 380;
    const sx = Math.cos(ang) * sr, sy = Math.sin(ang) * sr * 0.7, sz = 120;
    sun.position.set(playerPos.x + sx * 0.5, Math.max(30, sy * 0.6), playerPos.z + sz * 0.5);
    sun.target.position.set(playerPos.x, 0, playerPos.z);
    sunMesh.position.set(playerPos.x + sx, Math.max(-30, sy), playerPos.z + sz);
    moonMesh.position.set(playerPos.x - sx, Math.max(10, -sy * 0.8 + 60), playerPos.z - sz * 0.8);
    sunMesh.visible = sy > -20;

    // lampadaires
    const night = dayness < 0.5;
    world.lampPosts.forEach(lp => {
      const on = night && lp.lit;
      lp.bulbMat.emissive.setHex(on ? 0xffcc66 : 0x000000);
      lp.bulbMat.color.setHex(on ? 0xffee99 : 0x888877);
      lp.glow.material.opacity = on ? 0.85 : 0;
    });
    return dayness;
  };

  /* ---------- Parchemins de versets cachés ---------- */
  world.scrolls = [];
  GAME.DATA.hiddenVerses.forEach(v => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 8),
      new THREE.MeshLambertMaterial({ color: 0xf0e0b8, emissive: 0x554411 }));
    body.rotation.z = Math.PI / 2.4;
    g.add(body);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexCache, color: 0xffe9a8, transparent: true, opacity: 0.8, depthWrite: false }));
    glow.scale.setScalar(2.4);
    g.add(glow);
    const y = world.groundHeight(v.pos[0], v.pos[1]);
    g.position.set(v.pos[0], y + 1, v.pos[1]);
    scene.add(g);
    world.scrolls.push({ ref: v.ref, text: v.text, mesh: g, pos: new THREE.Vector3(v.pos[0], y, v.pos[1]) });
  });

  return world;
};

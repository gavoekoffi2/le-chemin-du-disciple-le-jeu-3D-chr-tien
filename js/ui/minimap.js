// ==== Minimap circulaire + grande carte ====
import { CONFIG, DISTRICTS } from '../config.js';

const CITY = CONFIG.CITY_SIZE, HALF = CITY / 2;

export class Minimap {
  constructor(city) {
    this.city = city;
    this.canvas = document.getElementById('minimap');
    this.ctx = this.canvas.getContext('2d');
    this.big = document.getElementById('bigmap');
    this.bigCtx = this.big.getContext('2d');
    // Pré-rendu de la ville sur un canvas offscreen
    this.base = document.createElement('canvas');
    this.base.width = this.base.height = 560;
    this._renderBase(this.base.getContext('2d'), 560);
  }

  _renderBase(g, size) {
    const s = size / (CITY + 80); // échelle monde→pixels
    const ox = size / 2, oy = size / 2;
    const wx = (x) => ox + x * s;
    const wz = (z) => oy + z * s;
    // Fond (routes = couleur de fond)
    g.fillStyle = '#2e3540';
    g.fillRect(0, 0, size, size);
    // Eau au sud
    g.fillStyle = '#2a5a8a';
    g.fillRect(0, wz(HALF), size, size - wz(HALF));
    // Blocs par district
    for (const b of this.city.minimapData.blocks) {
      g.fillStyle = DISTRICTS[b.district]?.color || '#666';
      g.fillRect(wx(b.x), wz(b.z), b.size * s, b.size * s);
    }
    // POI
    g.font = '16px serif';
    g.textAlign = 'center';
    for (const p of this.city.minimapData.pois) {
      g.fillText(p.icon, wx(p.x), wz(p.z) + 6);
    }
    this.scale = s;
    this.origin = size / 2;
  }

  worldToBase(x, z) {
    return { x: this.origin + x * this.scale, y: this.origin + z * this.scale };
  }

  // Minimap circulaire centrée sur le joueur
  render(player, objective, npcsWithMarkers = []) {
    const g = this.ctx;
    const W = this.canvas.width;
    g.clearRect(0, 0, W, W);
    g.save();
    // Masque circulaire
    g.beginPath();
    g.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2);
    g.clip();
    // Zoom : 1 px minimap = zoomFactor px du base canvas
    const zoom = 2.2;
    const p = this.worldToBase(player.pos.x, player.pos.z);
    g.drawImage(
      this.base,
      p.x - (W / 2) / zoom, p.y - (W / 2) / zoom, W / zoom, W / zoom,
      0, 0, W, W
    );
    // Marqueurs de PNJ à quête
    for (const n of npcsWithMarkers) {
      const q = this.worldToBase(n.x, n.z);
      const sx = (q.x - p.x) * zoom + W / 2;
      const sy = (q.y - p.y) * zoom + W / 2;
      g.fillStyle = '#e8c454';
      g.font = 'bold 16px Georgia';
      g.textAlign = 'center';
      g.fillText('!', sx, sy + 5);
    }
    // Objectif
    if (objective) {
      const o = this.worldToBase(objective.x, objective.z);
      let sx = (o.x - p.x) * zoom + W / 2;
      let sy = (o.y - p.y) * zoom + W / 2;
      // Clamp au bord du cercle
      const dx = sx - W / 2, dy = sy - W / 2;
      const d = Math.sqrt(dx * dx + dy * dy);
      const maxR = W / 2 - 12;
      if (d > maxR) { sx = W / 2 + (dx / d) * maxR; sy = W / 2 + (dy / d) * maxR; }
      g.fillStyle = '#ffd870';
      g.beginPath();
      g.arc(sx, sy, 5, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#fff';
      g.stroke();
    }
    // Joueur (flèche orientée)
    g.translate(W / 2, W / 2);
    g.rotate(-player.heading + Math.PI);
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(0, -8);
    g.lineTo(5.5, 6);
    g.lineTo(-5.5, 6);
    g.closePath();
    g.fill();
    g.restore();
  }

  renderBig(player, objective) {
    const g = this.bigCtx;
    g.clearRect(0, 0, 560, 560);
    g.drawImage(this.base, 0, 0);
    // Noms des lieux
    g.font = 'bold 13px Georgia';
    g.textAlign = 'center';
    g.fillStyle = '#fff';
    g.strokeStyle = 'rgba(0,0,0,0.7)';
    g.lineWidth = 3;
    for (const p of this.city.minimapData.pois) {
      const q = this.worldToBase(p.x, p.z);
      g.strokeText(p.name, q.x, q.y + 22);
      g.fillText(p.name, q.x, q.y + 22);
    }
    const game = window.__kairos;
    if (game?.player) {
      const p = this.worldToBase(game.player.pos.x, game.player.pos.z);
      g.fillStyle = '#7ed0ff';
      g.beginPath();
      g.arc(p.x, p.y, 6, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#fff';
      g.lineWidth = 2;
      g.stroke();
    }
    const obj = game?.quests?.currentObjectivePos?.();
    if (obj) {
      const o = this.worldToBase(obj.x, obj.z);
      g.fillStyle = '#ffd870';
      g.beginPath();
      g.arc(o.x, o.y, 7, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#fff';
      g.stroke();
    }
  }
}

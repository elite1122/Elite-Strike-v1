import { MAPS } from './maps';
import { ArenaMap, MatchWorld, SoldierEntity } from './types';

export type MinimapContactRelation = 'self' | 'ally' | 'enemy';

export interface MinimapContact {
  id: string;
  name: string;
  x: number;
  y: number;
  aimAngle: number;
  relation: MinimapContactRelation;
  jetpackActive: boolean;
}

export interface MinimapRect {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'ground' | 'bunker' | 'crate' | 'rock' | 'platform';
}

export interface MinimapSnapshotData {
  mapName: string;
  mapWidth: number;
  mapHeight: number;
  hostileCount: number;
  allyCount: number;
  playerCoords: { x: number; y: number } | null;
  currentZone?: string | null;
  strategySummary?: string;
}

export function clampMinimapCoord(val: number, max: number): number {
  return Math.max(0, Math.min(max, val));
}

export function projectWorldPoint(
  wx: number,
  wy: number,
  mapWidth: number,
  mapHeight: number,
  miniW: number,
  miniH: number,
): { x: number; y: number } {
  const safeW = Math.max(1, mapWidth);
  const safeH = Math.max(1, mapHeight);
  return {
    x: clampMinimapCoord((wx / safeW) * miniW, miniW),
    y: clampMinimapCoord((wy / safeH) * miniH, miniH),
  };
}

export function classifySoldierRelation(
  soldier: SoldierEntity,
  localPlayer: SoldierEntity | undefined,
  localPlayerId: string,
): MinimapContactRelation {
  if (soldier.id === localPlayerId) return 'self';
  if (
    localPlayer &&
    localPlayer.team !== 'ffa' &&
    soldier.team === localPlayer.team
  ) {
    return 'ally';
  }
  return 'enemy';
}

export function buildMinimapGeometry(
  map: ArenaMap,
  miniW: number,
  miniH: number,
): MinimapRect[] {
  const scaleX = miniW / Math.max(1, map.width);
  const scaleY = miniH / Math.max(1, map.height);
  const rects: MinimapRect[] = [];

  for (const s of map.solids) {
    if (s.kind === 'wall') continue;
    rects.push({
      x: s.x * scaleX,
      y: s.y * scaleY,
      w: Math.max(2, s.w * scaleX),
      h: Math.max(2, s.h * scaleY),
      kind: s.kind ?? 'ground',
    });
  }

  for (const p of map.platforms) {
    rects.push({
      x: p.x * scaleX,
      y: p.y * scaleY,
      w: Math.max(2, p.w * scaleX),
      h: Math.max(1.5, 12 * scaleY),
      kind: 'platform',
    });
  }

  return rects;
}

export function buildMinimapContacts(
  world: MatchWorld,
  localPlayerId: string,
  miniW: number,
  miniH: number,
): MinimapContact[] {
  const map = MAPS[world.mapId];
  const localPlayer = world.soldiers.find((s) => s.id === localPlayerId);
  const contacts: MinimapContact[] = [];

  for (const s of world.soldiers) {
    if (!s.alive) continue;
    const pt = projectWorldPoint(
      s.x + s.w / 2,
      s.y + s.h / 2,
      map.width,
      map.height,
      miniW,
      miniH,
    );
    contacts.push({
      id: s.id,
      name: s.name,
      x: pt.x,
      y: pt.y,
      aimAngle: s.aimAngle,
      relation: classifySoldierRelation(s, localPlayer, localPlayerId),
      jetpackActive: s.jetpackActive,
    });
  }

  return contacts;
}

export function getMinimapSummary(
  world: MatchWorld,
  localPlayerId: string,
): MinimapSnapshotData {
  const map = MAPS[world.mapId];
  const localPlayer = world.soldiers.find((s) => s.id === localPlayerId);
  let hostileCount = 0;
  let allyCount = 0;

  for (const s of world.soldiers) {
    if (!s.alive || s.id === localPlayerId) continue;
    const rel = classifySoldierRelation(s, localPlayer, localPlayerId);
    if (rel === 'ally') allyCount += 1;
    else hostileCount += 1;
  }

  let currentZone: string | null = null;
  if (localPlayer && map.buildings) {
    const px = localPlayer.x + localPlayer.w / 2;
    const py = localPlayer.y + localPlayer.h / 2;
    for (const b of map.buildings) {
      if (
        px >= b.x - 40 &&
        px <= b.x + b.w + 40 &&
        py >= b.y - 80 &&
        py <= b.y + b.h + 60
      ) {
        currentZone = b.name;
        break;
      }
    }
  }

  return {
    mapName: map.name,
    mapWidth: map.width,
    mapHeight: map.height,
    hostileCount,
    allyCount,
    playerCoords: localPlayer
      ? {
          x: Math.round(localPlayer.x + localPlayer.w / 2),
          y: Math.round(localPlayer.y + localPlayer.h / 2),
        }
      : null,
    currentZone,
    strategySummary: map.strategySummary,
  };
}

export function renderMinimapCanvas(
  ctx: CanvasRenderingContext2D,
  world: MatchWorld,
  localPlayerId: string,
  camRect: { x: number; y: number; w: number; h: number },
  miniW: number,
  miniH: number,
  zoomed = false,
): void {
  const map = MAPS[world.mapId];
  const localPlayer = world.soldiers.find((s) => s.id === localPlayerId);

  ctx.save();
  ctx.clearRect(0, 0, miniW, miniH);

  // Dark tactical background with subtle grid
  ctx.fillStyle = '#0A0E14';
  ctx.fillRect(0, 0, miniW, miniH);

  // If zoomed, center view around player (2.0x zoom)
  if (zoomed && localPlayer) {
    const scaleX = miniW / map.width;
    const scaleY = miniH / map.height;
    const px = (localPlayer.x + localPlayer.w / 2) * scaleX;
    const py = (localPlayer.y + localPlayer.h / 2) * scaleY;
    const zoom = 1.85;
    ctx.translate(miniW / 2, miniH / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(
      -Math.max(miniW / (2 * zoom), Math.min(miniW - miniW / (2 * zoom), px)),
      -Math.max(miniH / (2 * zoom), Math.min(miniH - miniH / (2 * zoom), py)),
    );
  }

  // Subtle tactical grid lines
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = miniW / 4; gx < miniW; gx += miniW / 4) {
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, miniH);
  }
  for (let gy = miniH / 3; gy < miniH; gy += miniH / 3) {
    ctx.moveTo(0, gy);
    ctx.lineTo(miniW, gy);
  }
  ctx.stroke();

  const scaleX = miniW / Math.max(1, map.width);
  const scaleY = miniH / Math.max(1, map.height);

  // 0. Tactical Building Footprints on Radar (color-coded per landmark)
  for (const b of map.buildings ?? []) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.strokeStyle = b.accentColor ?? 'rgba(250, 204, 21, 0.42)';
    ctx.lineWidth = 0.9;
    ctx.fillRect(b.x * scaleX, b.y * scaleY, b.w * scaleX, b.h * scaleY);
    ctx.strokeRect(b.x * scaleX, b.y * scaleY, b.w * scaleX, b.h * scaleY);
  }

  // 1. Map Layout Geometry (Ground, Bunkers, Crates, Rocks, One-Way Platforms)
  const rects = buildMinimapGeometry(map, miniW, miniH);
  for (const r of rects) {
    if (r.kind === 'platform') {
      ctx.fillStyle = '#B45309';
      ctx.fillRect(r.x, r.y, r.w, Math.max(1.5, r.h));
    } else if (r.kind === 'bunker') {
      ctx.fillStyle = '#64748B';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    } else if (r.kind === 'crate') {
      ctx.fillStyle = '#D97706';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    } else {
      ctx.fillStyle = '#334155';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = map.palette.accent;
      ctx.fillRect(r.x, r.y, r.w, 1.5);
    }
  }

  // 1b. Interactive Map Zones (Oasis healing pool, Conveyor belts, Jump pads, Vault switch, Fire hazard)
  for (const z of map.zones ?? []) {
    ctx.fillStyle =
      z.kind === 'oasis_heal'
        ? 'rgba(45, 212, 191, 0.65)'
        : z.kind === 'jump_pad'
          ? 'rgba(56, 189, 248, 0.75)'
          : z.kind === 'vault_switch'
            ? world.hangarVaultOpen
              ? '#22C55E'
              : '#EF4444'
            : z.kind === 'fire_hazard'
              ? 'rgba(249, 115, 22, 0.75)'
              : 'rgba(250, 204, 21, 0.45)';
    ctx.fillRect(
      z.x * scaleX,
      z.y * scaleY,
      Math.max(2.5, z.w * scaleX),
      Math.max(2, z.h * scaleY),
    );
  }

  // 1c. Active Destructible Walls, Explosive Barrels & Armory Vault Doors
  for (const d of world.destructibles ?? []) {
    if (!d.active) continue;
    ctx.fillStyle =
      d.kind === 'explosive_barrel'
        ? '#EF4444'
        : d.kind === 'vault_door'
          ? '#F59E0B'
          : '#A8A29E';
    ctx.fillRect(
      d.x * scaleX,
      d.y * scaleY,
      Math.max(2, d.w * scaleX),
      Math.max(2, d.h * scaleY),
    );
  }

  // 1d. Island Fortress Dynamic Tidal Ocean Water Line
  if (world.mapId === 'island') {
    const waterY = (world.mapMechanic?.waterY ?? 1155) * scaleY;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
    ctx.fillRect(0, waterY, miniW, Math.max(0, miniH - waterY));
  }

  // 2. Active Pickups (small diamond/square markers)
  for (const p of world.pickups) {
    if (!p.active) continue;
    const px = p.x * scaleX;
    const py = p.y * scaleY;
    ctx.fillStyle =
      p.kind === 'medkit'
        ? '#10B981'
        : p.kind === 'armor'
          ? '#38BDF8'
          : '#F59E0B';
    ctx.fillRect(px - 1.2, py - 1.2, 2.4, 2.4);
  }

  // 3. Active Camera Viewport Frame
  if (camRect.w > 0 && camRect.h > 0) {
    const vx = Math.max(0, camRect.x * scaleX);
    const vy = Math.max(0, camRect.y * scaleY);
    const vw = Math.min(miniW - vx, camRect.w * scaleX);
    const vh = Math.min(miniH - vy, camRect.h * scaleY);
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.42)';
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, vw, vh);
  }

  // 4. Player & Combatant Positions
  const contacts = buildMinimapContacts(world, localPlayerId, miniW, miniH);
  for (const c of contacts) {
    if (c.relation === 'self') continue; // Draw self on top last
    ctx.fillStyle = c.relation === 'ally' ? '#38BDF8' : '#EF4444';
    ctx.strokeStyle = '#090D16';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Draw local player on top with directional aim cone + bright gold pip
  const selfContact = contacts.find((c) => c.relation === 'self');
  if (selfContact) {
    // Aim direction wedge
    ctx.fillStyle = 'rgba(250, 204, 21, 0.28)';
    ctx.beginPath();
    ctx.moveTo(selfContact.x, selfContact.y);
    ctx.arc(
      selfContact.x,
      selfContact.y,
      12,
      selfContact.aimAngle - 0.38,
      selfContact.aimAngle + 0.38,
    );
    ctx.closePath();
    ctx.fill();

    // Outer halo ring
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(selfContact.x, selfContact.y, 5.2, 0, Math.PI * 2);
    ctx.stroke();

    // Center self pip
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(selfContact.x, selfContact.y, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

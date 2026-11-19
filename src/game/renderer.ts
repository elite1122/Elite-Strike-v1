import { MAPS } from './maps';
import { getProjectileColliders, segmentIntersectsRect } from './physics';
import {
  ArenaMap,
  MapBuilding,
  MatchWorld,
  PickupEntity,
  Rect,
  SoldierEntity,
  WeaponId,
  WorldEvent,
} from './types';
import {
  ARMOR_PALETTES,
  getScopeZoomProfile,
  JETPACK_STYLES,
  ScopeZoomProfile,
  SKIN_TONES,
  WEAPONS,
} from './weapons';
import {
  getMapWeatherVisualConfig,
  getWeatherStateForMap,
} from './weather';

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
  isSmoke?: boolean;
}

interface FloatingNumber {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface WeatherDrop {
  x: number; // 0..1 normalized screen x
  y: number; // 0..1 normalized screen y
  speed: number;
  size: number;
  length: number;
  driftPhase: number;
  layer: 0 | 1;
}

const PARTICLE_POOL_SIZE = 340;
const FLOAT_NUM_POOL_SIZE = 32;
const WEATHER_DROP_POOL_SIZE = 135;

function hash2d(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

export class ArenaRenderer {
  private particles: Particle[] = Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 3,
    life: 0,
    maxLife: 1,
    color: '#FFF',
    gravity: 0,
    isSmoke: false,
  }));
  private particleCursor = 0;

  private floatNums: FloatingNumber[] = Array.from({ length: FLOAT_NUM_POOL_SIZE }, () => ({
    active: false,
    x: 0,
    y: 0,
    vy: 0,
    text: '',
    color: '#FFF',
    life: 0,
    maxLife: 0.7,
  }));
  private floatCursor = 0;

  private weatherDrops: WeatherDrop[] = Array.from(
    { length: WEATHER_DROP_POOL_SIZE },
    (_, i) => ({
      x: hash2d(i * 1.7, 3.1),
      y: hash2d(i * 2.3, 9.7),
      speed: 0.55 + hash2d(i, 5.4) * 0.65,
      size: 1.6 + hash2d(i, 7.2) * 2.6,
      length: 14 + hash2d(i, 11.3) * 16,
      driftPhase: hash2d(i, 13.7) * Math.PI * 2,
      layer: i % 3 === 0 ? 0 : 1,
    }),
  );

  public camX = 600;
  public camY = 500;
  public camScale = 1.0;

  public clearEffects(): void {
    for (const p of this.particles) p.active = false;
    for (const f of this.floatNums) f.active = false;
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    maxLife: number,
    color: string,
    gravity = 0,
    isSmoke = false,
  ): void {
    const p = this.particles[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % PARTICLE_POOL_SIZE;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.life = maxLife;
    p.maxLife = maxLife;
    p.color = color;
    p.gravity = gravity;
    p.isSmoke = isSmoke;
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string): void {
    const f = this.floatNums[this.floatCursor];
    this.floatCursor = (this.floatCursor + 1) % FLOAT_NUM_POOL_SIZE;
    f.active = true;
    f.x = x;
    f.y = y;
    f.vy = -52;
    f.text = text;
    f.color = color;
    f.life = 0.72;
    f.maxLife = 0.72;
  }

  public ingestEvents(events: WorldEvent[]): void {
    for (const ev of events) {
      if (ev.type === 'shot') {
        const a = ev.angle ?? 0;
        for (let i = 0; i < 4; i++) {
          const spread = (Math.random() - 0.5) * 0.6;
          const spd = 140 + Math.random() * 180;
          this.spawnParticle(
            ev.x,
            ev.y,
            Math.cos(a + spread) * spd,
            Math.sin(a + spread) * spd,
            3 + Math.random() * 2,
            0.14,
            '#FDE047',
          );
        }
        // Gunpowder smoke puff
        this.spawnParticle(
          ev.x + Math.cos(a) * 6,
          ev.y + Math.sin(a) * 6,
          Math.cos(a) * 35 + (Math.random() - 0.5) * 20,
          -25 + (Math.random() - 0.5) * 20,
          7 + Math.random() * 5,
          0.38,
          'rgba(226, 232, 240, 0.55)',
          -20,
          true,
        );
        // Brass casing eject
        this.spawnParticle(
          ev.x - Math.cos(a) * 14,
          ev.y - Math.sin(a) * 14,
          -Math.cos(a) * 55 + (Math.random() - 0.5) * 30,
          -110 - Math.random() * 50,
          2.6,
          0.55,
          '#F59E0B',
          560,
        );
      } else if (ev.type === 'hit') {
        const isArmorOrFlesh = (ev.damage ?? 0) > 0;
        const count = isArmorOrFlesh ? 8 : 6;
        const color = isArmorOrFlesh ? '#DC2626' : '#A8A29E';
        for (let i = 0; i < count; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 80 + Math.random() * 170;
          this.spawnParticle(
            ev.x,
            ev.y,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd - 40,
            2.5 + Math.random() * 2.5,
            0.28,
            color,
            420,
          );
        }
        if (isArmorOrFlesh && ev.damage) {
          this.spawnFloatingText(ev.x, ev.y - 12, `-${ev.damage}`, '#EF4444');
        }
      } else if (ev.type === 'explosion') {
        // Dark smoke cloud like the reference screenshot
        for (let i = 0; i < 14; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 25 + Math.random() * 110;
          this.spawnParticle(
            ev.x + (Math.random() - 0.5) * 18,
            ev.y + (Math.random() - 0.5) * 18,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd - 35,
            16 + Math.random() * 18,
            0.75 + Math.random() * 0.45,
            i % 2 === 0 ? 'rgba(55, 53, 47, 0.65)' : 'rgba(87, 83, 78, 0.55)',
            -18,
            true,
          );
        }
        for (let i = 0; i < 24; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 90 + Math.random() * 340;
          const colors = ['#F97316', '#FACC15', '#EF4444', '#78716C'];
          this.spawnParticle(
            ev.x,
            ev.y,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd - 70,
            4 + Math.random() * 6,
            0.35 + Math.random() * 0.3,
            colors[i % colors.length],
            240,
          );
        }
      } else if (ev.type === 'ko') {
        for (let i = 0; i < 16; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 70 + Math.random() * 210;
          this.spawnParticle(
            ev.x,
            ev.y,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd - 90,
            4 + Math.random() * 3,
            0.45,
            i % 2 === 0 ? '#DC2626' : '#FBBF24',
            380,
          );
        }
      } else if (ev.type === 'land' || ev.type === 'jump') {
        for (let i = 0; i < 5; i++) {
          this.spawnParticle(
            ev.x + (Math.random() - 0.5) * 16,
            ev.y - 2,
            (Math.random() - 0.5) * 90,
            -25 - Math.random() * 45,
            4.5,
            0.28,
            'rgba(168, 162, 158, 0.65)',
            60,
            true,
          );
        }
      } else if (ev.type === 'pickup') {
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2;
          this.spawnParticle(
            ev.x,
            ev.y,
            Math.cos(ang) * 95,
            Math.sin(ang) * 95,
            3.5,
            0.35,
            '#22C55E',
          );
        }
      }
    }
  }

  public stepEffects(world: MatchWorld, dt: number): void {
    // Jetpack white smoke ribbon + flame sparks (like Mini Militia reference)
    for (const s of world.soldiers) {
      if (s.alive && s.jetpackActive) {
        const jpStyle = JETPACK_STYLES[s.jetpackStyle ?? 'amber'] ?? JETPACK_STYLES.amber;
        const backX = s.x + s.w / 2 - s.facing * 12;
        const backY = s.y + s.h * 0.62;
        // White-grey smoke puff trail
        this.spawnParticle(
          backX + (Math.random() - 0.5) * 4,
          backY + 6,
          -s.vx * 0.25 + (Math.random() - 0.5) * 24,
          95 + Math.random() * 55,
          5.5 + Math.random() * 4,
          0.36,
          'rgba(241, 245, 249, 0.72)',
          -30,
          true,
        );
        // Flame spark
        if (Math.random() < 0.85) {
          this.spawnParticle(
            backX + (Math.random() - 0.5) * 4,
            backY,
            -s.facing * (25 + Math.random() * 30),
            135 + Math.random() * 80,
            3.2 + Math.random() * 2.5,
            0.18,
            Math.random() > 0.35 ? jpStyle.particle : jpStyle.core,
          );
        }
      }
    }

    // Smoke trail for flying rockets
    for (const b of world.bullets) {
      if (b.projectileKind === 'rocket' && Math.random() < 0.9) {
        this.spawnParticle(
          b.x - b.vx * 0.012,
          b.y - b.vy * 0.012,
          (Math.random() - 0.5) * 28,
          (Math.random() - 0.5) * 28,
          6 + Math.random() * 4,
          0.34,
          'rgba(226, 232, 240, 0.75)',
          -15,
          true,
        );
      }
    }

    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.isSmoke) {
        p.size += dt * 12;
      }
    }

    for (const f of this.floatNums) {
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) {
        f.active = false;
        continue;
      }
      f.y += f.vy * dt;
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    world: MatchWorld,
    focusSoldierId: string | null,
    viewW: number,
    viewH: number,
    dt: number,
    tourMode = false,
    scopeZoomLevel = 1,
  ): { camX: number; camY: number; viewW: number; viewH: number; scale: number } {
    const map = MAPS[world.mapId];
    const focus =
      !tourMode && focusSoldierId
        ? world.soldiers.find((s) => s.id === focusSoldierId) ?? null
        : null;

    const zoomProfile = tourMode
      ? getScopeZoomProfile(2)
      : getScopeZoomProfile(scopeZoomLevel);

    // Smooth camera scale transition per weapon scope zoom (1X..5X)
    const damp = 1 - Math.exp(-8.5 * Math.min(dt, 0.05));
    this.camScale += (zoomProfile.cameraScale - this.camScale) * damp;
    const scale = Math.max(0.55, Math.min(1.3, this.camScale));

    // Camera target calculation with scope directional look-ahead
    let targetX = map.width / 2;
    let targetY = map.height * 0.65;
    if (tourMode) {
      targetX = map.width * 0.5 + Math.sin(world.elapsed * 0.22) * (map.width * 0.25);
      targetY = map.height * 0.68 + Math.cos(world.elapsed * 0.31) * 55;
    } else if (focus) {
      const lookAhead = focus.alive ? zoomProfile.lookAheadPx : 0;
      targetX = focus.x + focus.w / 2 + Math.cos(focus.aimAngle) * lookAhead;
      targetY = focus.y + focus.h / 2 + Math.sin(focus.aimAngle) * (lookAhead * 0.62);
    }

    this.camX += (targetX - this.camX) * damp;
    this.camY += (targetY - this.camY) * damp;

    const worldViewW = viewW / scale;
    const worldViewH = viewH / scale;

    const minCamX = Math.min(map.width / 2, worldViewW / 2);
    const maxCamX = Math.max(minCamX, map.width - worldViewW / 2);
    const minCamY = Math.min(map.height / 2, worldViewH / 2);
    const maxCamY = Math.max(minCamY, map.height - worldViewH / 2);

    const clampedCamX = Math.max(minCamX, Math.min(maxCamX, this.camX));
    const clampedCamY = Math.max(minCamY, Math.min(maxCamY, this.camY));

    const shake = world.cameraTrauma * world.cameraTrauma * 14;
    const shakeX = (Math.random() - 0.5) * 2 * shake;
    const shakeY = (Math.random() - 0.5) * 2 * shake;

    const offsetX = clampedCamX - worldViewW / 2 + shakeX;
    const offsetY = clampedCamY - worldViewH / 2 + shakeY;

    // 1. Biome Sky + Parallax Mountains + Lush Silhouette Foliage/Structures
    this.drawBackground(ctx, map, world, offsetX, offsetY, viewW, viewH);

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-offsetX, -offsetY);

    // 2. Organic Rock/Terrain Islands, Faceted Boulders, Grass & Biome Props
    this.drawMapGeometry(ctx, map, world, offsetX, offsetY, worldViewW, worldViewH);

    // 2b. Interactive Map Zones (Oasis Water Pool, Conveyor Belts, Jump Pads, Vault Switch, Fuel Fire Hazard)
    this.drawMapZones(ctx, map, world);

    // 2c. Destructible Cover Walls, Explosive Fuel Barrels & Armory Vault Blast Doors
    this.drawDestructibles(ctx, world);

    // 3. Pooled Smoke & Explosion Clouds behind/around soldiers
    for (const p of this.particles) {
      if (!p.active || !p.isSmoke) continue;
      ctx.globalAlpha = Math.max(0, (p.life / p.maxLife) * 0.65);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 4. Realistic Pickups resting on terrain
    for (const p of world.pickups) {
      if (p.active) this.drawPickup(ctx, p);
    }

    // 5. Sniper / Heavy telegraphs & Player Active Scope Laser Sightline
    for (const s of world.soldiers) {
      if (s.alive && s.telegraphTimer > 0) {
        this.drawTelegraph(ctx, s);
      }
    }
    if (focus && focus.alive && !tourMode) {
      this.drawScopeSightline(ctx, world, map, focus, zoomProfile);
    }

    // 6. Soldiers
    for (const s of world.soldiers) {
      if (s.alive || s.koTimer > 0) {
        this.drawSoldier(ctx, s, s.id === focusSoldierId, tourMode);
      }
    }

    // 6b. Island Fortress Dynamic Tidal Ocean Water & Urban Metro Dark Tunnel Flashlight Overlay
    this.drawWorldForegroundMechanics(ctx, map, world, focus, offsetX, offsetY, worldViewW, worldViewH);

    // 7. Bullets, Dashed Tracer Streaks, Rockets, Grenade Shells & Spinning Sawblades
    for (const b of world.bullets) {
      ctx.save();
      if (b.projectileKind === 'saw') {
        ctx.translate(b.x, b.y);
        ctx.rotate(b.spinAngle ?? world.elapsed * 25);
        ctx.fillStyle = '#E2E8F0';
        ctx.strokeStyle = '#0D1117';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        const teeth = 10;
        for (let i = 0; i < teeth * 2; i++) {
          const r = i % 2 === 0 ? 9.5 : 6;
          const a = (i * Math.PI) / teeth;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.projectileKind === 'rocket') {
        const ang = Math.atan2(b.vy, b.vx);
        ctx.translate(b.x, b.y);
        ctx.rotate(ang);
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.moveTo(-9, -3.5);
        ctx.lineTo(-19 - Math.random() * 6, 0);
        ctx.lineTo(-9, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#57534E';
        ctx.strokeStyle = '#0D1117';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-9, -3.8, 14, 7.6, 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.moveTo(5, -3.8);
        ctx.lineTo(11, 0);
        ctx.lineTo(5, 3.8);
        ctx.closePath();
        ctx.fill();
      } else if (b.projectileKind === 'grenade_shell') {
        const ang = Math.atan2(b.vy, b.vx);
        ctx.translate(b.x, b.y);
        ctx.rotate(ang);
        ctx.fillStyle = '#4D7C0F';
        ctx.strokeStyle = '#0D1117';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-5, -3.5, 10, 7, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(2, -2.5, 2.5, 5);
      } else {
        // Long dashed white/yellow Mini Militia ballistic smoke-tracer line + bright tip
        const dx = b.x - b.prevX;
        const dy = b.y - b.prevY;
        const dist = Math.hypot(dx, dy) || 1;
        const tailLen = Math.min(75, dist * 3.2);
        const tx = b.x - (dx / dist) * tailLen;
        const ty = b.y - (dy / dist) * tailLen;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.weaponId === 'sniper' ? 3.5 : 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(b.prevX, b.prevY);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.weaponId === 'sniper' ? 2.6 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 8. Pineapple Frag Grenades
    for (const g of world.grenades) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.fuse * 6);
      ctx.fillStyle = '#4D7C0F';
      ctx.strokeStyle = '#1A2E05';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, g.radius, g.radius * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Pineapple segmentation lines
      ctx.strokeStyle = '#1A2E05';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-g.radius, 0);
      ctx.lineTo(g.radius, 0);
      ctx.moveTo(0, -g.radius);
      ctx.lineTo(0, g.radius);
      ctx.stroke();

      // Fuse lever & blinking spark
      const blink = Math.floor(g.fuse * 10) % 2 === 0;
      ctx.fillStyle = blink ? '#EF4444' : '#FACC15';
      ctx.beginPath();
      ctx.arc(0, -g.radius - 1, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. Crisp Non-Smoke Spark Particles
    for (const p of this.particles) {
      if (!p.active || p.isSmoke) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 10. Floating damage numbers
    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (const f of this.floatNums) {
      if (!f.active) continue;
      ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
      ctx.strokeStyle = '#0D1117';
      ctx.lineWidth = 3;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // 11. Dynamic Map-Specific Weather Overlay (Light Rain, Fog, Snow)
    this.drawWeatherOverlay(ctx, world, map, offsetX, offsetY, viewW, viewH, dt);

    // 12. Desert Base Special Mechanic: Periodic 2-Minute Sandstorm Whiteout (Close-Range Visibility Only)
    this.drawDesertSandstormOverlay(ctx, world, focus, offsetX, offsetY, viewW, viewH, scale);

    return { camX: offsetX, camY: offsetY, viewW: worldViewW, viewH: worldViewH, scale };
  }

  private drawWeatherOverlay(
    ctx: CanvasRenderingContext2D,
    world: MatchWorld,
    map: ArenaMap,
    offsetX: number,
    offsetY: number,
    viewW: number,
    viewH: number,
    dt: number,
  ): void {
    const weather =
      world.weather ?? getWeatherStateForMap(world.mapId, world.elapsed);
    if (weather.type === 'clear' || weather.intensity <= 0.01) return;

    const cfg = getMapWeatherVisualConfig(map.id, weather.type);
    const alpha = Math.max(0, Math.min(1, weather.intensity));

    ctx.save();

    // 1. Subtle map-tuned atmospheric color grade tint
    if (cfg.skyTint) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = cfg.skyTint;
      ctx.fillRect(0, 0, viewW, viewH);
    }

    // 2. Rolling volumetric fog bands (active for 'fog' and subtle mist for 'light_rain' / 'snow')
    const fogStrength =
      weather.type === 'fog' ? cfg.fogMaxOpacity * alpha : cfg.fogMaxOpacity * alpha * 0.55;
    if (fogStrength > 0.02) {
      ctx.globalAlpha = Math.min(0.75, fogStrength);
      const bandGrad = ctx.createLinearGradient(0, viewH * 0.18, 0, viewH);
      bandGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      bandGrad.addColorStop(0.42, cfg.fogColorOuter);
      bandGrad.addColorStop(0.76, cfg.fogColorInner);
      bandGrad.addColorStop(1, cfg.fogColorOuter);
      ctx.fillStyle = bandGrad;
      ctx.fillRect(0, 0, viewW, viewH);

      // Drifting layered sinusoidal mist plumes across the viewport
      const numPlumes = weather.type === 'fog' ? 7 : 3;
      for (let i = 0; i < numPlumes; i++) {
        const speed = (i % 2 === 0 ? 32 : -26) * (0.7 + i * 0.12);
        const span = viewW + 520;
        const rawX =
          ((i * 290 + world.elapsed * speed - offsetX * (0.18 + i * 0.04)) % span + span) %
            span -
          260;
        const py =
          viewH * (0.28 + (i / numPlumes) * 0.58) +
          Math.sin(world.elapsed * 0.7 + i * 1.4) * 18;
        const rx = 210 + (i % 3) * 65;
        const ry = 48 + (i % 2) * 24;

        const radGrad = ctx.createRadialGradient(rawX, py, 10, rawX, py, rx);
        radGrad.addColorStop(0, cfg.fogColorInner);
        radGrad.addColorStop(0.6, cfg.fogColorOuter);
        radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.ellipse(rawX, py, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Light Rain Streaks + Surface Splash Ripples
    if (weather.type === 'light_rain') {
      ctx.strokeStyle = cfg.rainStroke;
      ctx.lineCap = 'round';

      const windDx = (cfg.rainWindX / 900) * 18;
      const stepDt = Math.min(Math.max(dt, 0.008), 0.04);

      for (let i = 0; i < this.weatherDrops.length; i++) {
        const d = this.weatherDrops[i];
        // Advance rain drop in normalized viewport coordinates
        d.y = (d.y + stepDt * (0.95 + d.speed * 0.65)) % 1;
        d.x = (d.x + stepDt * (cfg.rainWindX / 1200) + 1) % 1;

        const parallax = d.layer === 1 ? 0.35 : 0.18;
        const sx =
          ((d.x * viewW - offsetX * parallax) % viewW + viewW) % viewW;
        const sy =
          ((d.y * viewH - offsetY * (parallax * 0.5)) % viewH + viewH) % viewH;

        const streakLen = d.layer === 1 ? d.length * 1.15 : d.length * 0.75;
        ctx.globalAlpha = alpha * (d.layer === 1 ? 0.75 : 0.45);
        ctx.lineWidth = d.layer === 1 ? 1.7 : 1.15;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + windDx, sy + streakLen);
        ctx.stroke();

        // Subtle raindrop splash ripple near bottom/midground ledges
        if (i % 6 === 0 && d.y > 0.72) {
          const splashProgress = (d.y - 0.72) / 0.28;
          ctx.strokeStyle = cfg.rainSplashColor;
          ctx.globalAlpha = alpha * (1 - splashProgress) * 0.55;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(
            sx + windDx,
            sy + streakLen,
            2 + splashProgress * 7,
            0.8 + splashProgress * 2.2,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
          ctx.strokeStyle = cfg.rainStroke;
        }
      }
    }

    // 4. Tumbling Wind-Drifted Snowflakes
    if (weather.type === 'snow') {
      ctx.fillStyle = cfg.snowFill;
      const stepDt = Math.min(Math.max(dt, 0.008), 0.04);

      for (let i = 0; i < this.weatherDrops.length; i++) {
        const d = this.weatherDrops[i];
        d.y = (d.y + stepDt * (0.16 + d.speed * 0.18)) % 1;
        d.x =
          (d.x +
            stepDt *
              (cfg.snowWindX / 1800 +
                Math.sin(world.elapsed * 1.9 + d.driftPhase) * 0.025) +
            1) %
          1;

        const parallax = d.layer === 1 ? 0.32 : 0.16;
        const sx =
          ((d.x * viewW - offsetX * parallax) % viewW + viewW) % viewW +
          Math.sin(world.elapsed * 2.4 + d.driftPhase) * 6;
        const sy =
          ((d.y * viewH - offsetY * (parallax * 0.45)) % viewH + viewH) % viewH;

        const r = d.layer === 1 ? d.size * 1.05 : d.size * 0.68;
        ctx.globalAlpha = alpha * (d.layer === 1 ? 0.88 : 0.54);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawDesertSandstormOverlay(
    ctx: CanvasRenderingContext2D,
    world: MatchWorld,
    focus: SoldierEntity | null,
    offsetX: number,
    offsetY: number,
    viewW: number,
    viewH: number,
    scale: number,
  ): void {
    if (world.mapId !== 'desert') return;
    const intensity = world.mapMechanic?.sandstormIntensity ?? 0;
    if (intensity <= 0.01) return;

    ctx.save();
    // Swirling desert dust streaks across screen
    ctx.strokeStyle = 'rgba(245, 198, 120, 0.55)';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 42; i++) {
      const y = ((i * 31 + world.elapsed * 95) % viewH + viewH) % viewH;
      const x = ((i * 97 - world.elapsed * 680) % (viewW + 180) + (viewW + 180)) % (viewW + 180) - 90;
      ctx.globalAlpha = intensity * (0.35 + (i % 3) * 0.18);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 75 + (i % 4) * 22, y + 6);
      ctx.stroke();
    }

    // Close-range visibility mask around the active player ("Sandstorm event: visibility kome jay, shudhu close range fight kora jay")
    const centerScreenX = focus
      ? (focus.x + focus.w / 2 - offsetX) * scale
      : viewW / 2;
    const centerScreenY = focus
      ? (focus.y + focus.h / 2 - offsetY) * scale
      : viewH / 2;
    const innerR = Math.max(115, 220 - intensity * 85);
    const outerR = Math.max(245, 420 - intensity * 135);

    const vignette = ctx.createRadialGradient(
      centerScreenX,
      centerScreenY,
      innerR,
      centerScreenX,
      centerScreenY,
      outerR,
    );
    vignette.addColorStop(0, `rgba(217, 160, 91, ${0.12 * intensity})`);
    vignette.addColorStop(0.55, `rgba(194, 133, 66, ${0.68 * intensity})`);
    vignette.addColorStop(1, `rgba(146, 92, 38, ${0.93 * intensity})`);

    ctx.globalAlpha = 1;
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.restore();
  }

  private drawScopeSightline(
    ctx: CanvasRenderingContext2D,
    world: MatchWorld,
    map: ArenaMap,
    s: SoldierEntity,
    zoomProfile: ScopeZoomProfile,
  ): void {
    const activeSlot = s.slots[s.activeSlot];
    const weapon = WEAPONS[activeSlot.weaponId] ?? WEAPONS.rifle;
    const shoulderX = s.x + s.w / 2;
    const shoulderY = s.y + s.h * 0.36;
    const startX = shoulderX + Math.cos(s.aimAngle) * weapon.muzzleLength;
    const startY = shoulderY + Math.sin(s.aimAngle) * weapon.muzzleLength;
    const maxLen = zoomProfile.laserLengthPx;
    let endX = startX + Math.cos(s.aimAngle) * maxLen;
    let endY = startY + Math.sin(s.aimAngle) * maxLen;

    let closestT = 1;
    let hitEnemy = false;
    const colliders = getProjectileColliders(map, world);
    // Check if the barrel itself is blocked between shoulder and muzzle
    for (const col of colliders) {
      const res = segmentIntersectsRect(shoulderX, shoulderY, endX, endY, col);
      if (res.hit && res.t < closestT) {
        closestT = res.t;
        endX = res.x;
        endY = res.y;
      }
    }

    for (const other of world.soldiers) {
      if (!other.alive || other.id === s.id) continue;
      if (s.team !== 'ffa' && other.team === s.team) continue;
      const res = segmentIntersectsRect(shoulderX, shoulderY, endX, endY, {
        x: other.x,
        y: other.y,
        w: other.w,
        h: other.h,
      });
      if (res.hit && res.t <= 1) {
        endX = res.x;
        endY = res.y;
        hitEnemy = true;
      }
    }

    ctx.save();
    const isHighScope = zoomProfile.level >= 3;
    const beamColor = hitEnemy
      ? '#EF4444'
      : zoomProfile.level >= 5
        ? '#38BDF8'
        : zoomProfile.level >= 3
          ? '#4ADE80'
          : 'rgba(250, 204, 21, 0.75)';

    ctx.strokeStyle = beamColor;
    ctx.globalAlpha = isHighScope ? 0.62 : 0.38;
    ctx.lineWidth = zoomProfile.level >= 5 ? 2.2 : 1.6;
    if (zoomProfile.level <= 2) {
      ctx.setLineDash([8, 6]);
    }
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Impact laser dot / rangefinder lock ring at end of sightline
    if (zoomProfile.level >= 2 || hitEnemy) {
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = beamColor;
      ctx.beginPath();
      ctx.arc(endX, endY, hitEnemy ? 4.2 : 3, 0, Math.PI * 2);
      ctx.fill();

      if (isHighScope || hitEnemy) {
        ctx.strokeStyle = beamColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(endX, endY, hitEnemy ? 9 : 6.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    map: ArenaMap,
    world: MatchWorld,
    offsetX: number,
    offsetY: number,
    viewW: number,
    viewH: number,
  ): void {
    const skyThemes: Record<
      ArenaMap['id'],
      { top: string; bottom: string; hillFar: string; hillNear: string; foliage: string }
    > = {
      forest: {
        top: '#D4E7E3',
        bottom: '#EFF7F5',
        hillFar: '#B7D4C3',
        hillNear: '#94BD7B',
        foliage: '#84B067',
      },
      desert: {
        top: '#EAB364',
        bottom: '#FDE6B8',
        hillFar: '#D99B52',
        hillNear: '#C07D38',
        foliage: '#9B6127',
      },
      urban: {
        top: '#475569',
        bottom: '#94A3B8',
        hillFar: '#334155',
        hillNear: '#1E293B',
        foliage: '#0F172A',
      },
      hangar: {
        top: '#0B111E',
        bottom: '#1E293B',
        hillFar: '#111827',
        hillNear: '#1E2533',
        foliage: '#273244',
      },
      island: {
        top: '#38BDF8',
        bottom: '#E0F2FE',
        hillFar: '#7DD3FC',
        hillNear: '#2DD4BF',
        foliage: '#0D9488',
      },
    };

    const theme = skyThemes[map.id] ?? skyThemes.forest;
    const grad = ctx.createLinearGradient(0, 0, 0, viewH);
    grad.addColorStop(0, theme.top);
    grad.addColorStop(1, theme.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewW, viewH);

    // Desert Base: Scorching Blazing Sun with Heat Halo
    if (map.id === 'desert') {
      const sunX = viewW * 0.76 - offsetX * 0.04;
      const sunY = viewH * 0.22 - offsetY * 0.03;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 135);
      sunGlow.addColorStop(0, 'rgba(254, 249, 195, 0.96)');
      sunGlow.addColorStop(0.32, 'rgba(251, 191, 36, 0.65)');
      sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 135, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
      ctx.fill();
    }

    // Military Hangar: Enclosed Steel Roof Trusses & Overhead Halogen Spotlights
    if (map.id === 'hangar') {
      ctx.save();
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.55)';
      ctx.lineWidth = 3;
      const baySpan = 220;
      for (let sx = -((offsetX * 0.25) % baySpan); sx < viewW + baySpan; sx += baySpan) {
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, viewH);
        ctx.moveTo(sx, 70);
        ctx.lineTo(sx + baySpan, 0);
        ctx.stroke();

        // Overhead hangar spotlight cone
        const cone = ctx.createLinearGradient(sx + baySpan * 0.5, 15, sx + baySpan * 0.5, viewH * 0.78);
        cone.addColorStop(0, 'rgba(253, 224, 71, 0.14)');
        cone.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(sx + baySpan * 0.5 - 16, 15);
        ctx.lineTo(sx + baySpan * 0.5 + 16, 15);
        ctx.lineTo(sx + baySpan * 0.5 + 95, viewH * 0.78);
        ctx.lineTo(sx + baySpan * 0.5 - 95, viewH * 0.78);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // Distant horizon ridge (Sand Dunes on Desert, Broken Skyscrapers on Urban, Sea Atolls on Island, Jungle Hills on Forest)
    ctx.fillStyle = theme.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    if (map.id === 'urban') {
      for (let sx = -120; sx <= viewW + 140; sx += 85) {
        const wx = Math.floor((sx + offsetX * 0.16) / 85);
        const bH = 90 + ((Math.abs(wx * 53) % 7) * 26);
        const topY = viewH * 0.58 - bH - offsetY * 0.07;
        ctx.lineTo(sx, topY);
        ctx.lineTo(sx + 68, topY + ((wx % 2 === 0 ? 14 : -8)));
        ctx.lineTo(sx + 68, viewH * 0.58 - offsetY * 0.07);
      }
    } else {
      for (let sx = -100; sx <= viewW + 120; sx += 90) {
        const wx = sx + offsetX * 0.14;
        const h =
          map.id === 'desert'
            ? Math.sin(wx * 0.0022) * 95 + Math.abs(Math.cos(wx * 0.004)) * 45
            : Math.sin(wx * 0.0025) * 85 + Math.cos(wx * 0.0055) * 40;
        ctx.lineTo(sx, viewH * 0.56 - h - offsetY * 0.07);
      }
    }
    ctx.lineTo(viewW, viewH);
    ctx.closePath();
    ctx.fill();

    // Midground silhouette band
    ctx.fillStyle = theme.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    for (let sx = -60; sx <= viewW + 80; sx += 36) {
      const wx = sx + offsetX * 0.28;
      if (map.id === 'urban') {
        const stepH = ((Math.abs(Math.floor(wx / 95)) * 43) % 120) + 55;
        ctx.lineTo(sx, viewH * 0.68 - stepH - offsetY * 0.14);
      } else if (map.id === 'desert') {
        // Sweeping wind-carved sand dune wave
        const dune = Math.sin(wx * 0.0045) * 58 + Math.cos(wx * 0.009) * 24;
        ctx.lineTo(sx, viewH * 0.66 - dune - offsetY * 0.14);
      } else if (map.id === 'island') {
        // Distant island sea stacks & fortress silhouettes
        const atoll = Math.max(0, Math.sin(wx * 0.005) * 72);
        ctx.lineTo(sx, viewH * 0.72 - atoll - offsetY * 0.12);
      } else {
        // Forest Outpost: Jagged tropical bush / palm silhouette peaks (UNCHANGED)
        const spike = Math.sin(wx * 0.018) * 34 + Math.cos(wx * 0.045) * 22;
        ctx.lineTo(sx, viewH * 0.65 - spike - offsetY * 0.14);
      }
    }
    ctx.lineTo(viewW, viewH);
    ctx.closePath();
    ctx.fill();

    // Foreground silhouette props along horizon
    ctx.fillStyle = theme.foliage;
    const span = viewW + 300;
    for (let i = 0; i < 12; i++) {
      const worldX = i * 260 + 80;
      const raw = (worldX - offsetX * 0.38) % span;
      const sx = (raw < 0 ? raw + span : raw) - 150;
      const sy = viewH * 0.72 - offsetY * 0.16;

      if (map.id === 'forest') {
        // Forest Outpost: Spiky tropical bush + palm silhouette (UNCHANGED)
        ctx.beginPath();
        for (let b = -5; b <= 5; b++) {
          const ang = (b / 5) * 1.25 - Math.PI / 2;
          const r = b % 2 === 0 ? 78 : 42;
          ctx.lineTo(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.fill();
      } else if (map.id === 'desert') {
        // Desert radar towers & Saguaro cacti
        if (i % 3 === 0) {
          ctx.fillRect(sx - 12, sy - 95, 24, 95);
          ctx.beginPath();
          ctx.arc(sx, sy - 102, 22, Math.PI * 0.85, Math.PI * 0.15, true);
          ctx.fill();
        } else {
          ctx.fillRect(sx - 7, sy - 85, 14, 90);
          ctx.fillRect(sx - 24, sy - 60, 18, 9);
          ctx.fillRect(sx - 24, sy - 78, 9, 22);
          ctx.fillRect(sx + 6, sy - 50, 18, 9);
          ctx.fillRect(sx + 15, sy - 72, 9, 25);
        }
      } else if (map.id === 'urban') {
        // Shattered skyscraper skeleton with window cutouts & crane boom
        ctx.fillRect(sx - 24, sy - 135, 48, 140);
        for (let wy = sy - 120; wy < sy - 20; wy += 24) {
          ctx.clearRect(sx - 15, wy, 10, 14);
          ctx.clearRect(sx + 5, wy, 10, 14);
        }
      } else if (map.id === 'island') {
        // Distant sailing ships & sea fort watchtowers on the ocean horizon
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(sx - 28, sy - 10);
          ctx.lineTo(sx + 28, sy - 10);
          ctx.lineTo(sx + 18, sy + 4);
          ctx.lineTo(sx - 18, sy + 4);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(sx - 2, sy - 46, 4, 36);
        }
      }
    }

    // Island Fortress: Rotating 360° Lighthouse Searchlight Beam in the background sky
    if (map.id === 'island') {
      const beamX = (290 - offsetX) * 0.65 + viewW * 0.18;
      const beamY = (410 - offsetY) * 0.65 + viewH * 0.12;
      const angle = world.elapsed * 0.85;
      ctx.save();
      ctx.translate(beamX, beamY);
      ctx.rotate(angle);
      const beamGrad = ctx.createLinearGradient(0, 0, 520, 0);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.38)');
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(520, -68);
      ctx.lineTo(520, 68);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawMapGeometry(
    ctx: CanvasRenderingContext2D,
    map: ArenaMap,
    world: MatchWorld,
    offsetX: number,
    offsetY: number,
    viewW: number,
    viewH: number,
  ): void {
    const biomeMaterials: Record<
      ArenaMap['id'],
      {
        cavernWall: string;
        cavernPebble: string;
        rockBody: string;
        rockChunkLight: string;
        rockChunkDark: string;
        grassMain: string;
        grassDark: string;
        outline: string;
      }
    > = {
      forest: {
        cavernWall: '#5C4E3C',
        cavernPebble: '#756550',
        rockBody: '#9E8F80',
        rockChunkLight: '#B5ABA1',
        rockChunkDark: '#7C7267',
        grassMain: '#76A65A',
        grassDark: '#527A3B',
        outline: '#1E1B18',
      },
      desert: {
        cavernWall: '#7C4D2B',
        cavernPebble: '#9A633A',
        rockBody: '#D4A36A',
        rockChunkLight: '#ECC695',
        rockChunkDark: '#A8763E',
        grassMain: '#E5B976',
        grassDark: '#B88642',
        outline: '#2A1A0E',
      },
      urban: {
        cavernWall: '#1E293B',
        cavernPebble: '#334155',
        rockBody: '#64748B',
        rockChunkLight: '#94A3B8',
        rockChunkDark: '#475569',
        grassMain: '#475569',
        grassDark: '#1E293B',
        outline: '#0F172A',
      },
      hangar: {
        cavernWall: '#111827',
        cavernPebble: '#1F2937',
        rockBody: '#374151',
        rockChunkLight: '#6B7280',
        rockChunkDark: '#1F2937',
        grassMain: '#F59E0B',
        grassDark: '#B45309',
        outline: '#030712',
      },
      island: {
        cavernWall: '#334155',
        cavernPebble: '#475569',
        rockBody: '#94A3B8',
        rockChunkLight: '#CBD5E1',
        rockChunkDark: '#64748B',
        grassMain: '#38BDF8',
        grassDark: '#0284C7',
        outline: '#0F172A',
      },
    };

    const mat = biomeMaterials[map.id] ?? biomeMaterials.forest;

    // Pass 0: Map-Specific Tactical Buildings & Landmarks
    for (const b of map.buildings ?? []) {
      if (b.x + b.w < offsetX - 220 || b.x > offsetX + viewW + 220) continue;
      this.drawMapBuilding(ctx, b, map.id, world, mat);
    }

    // Pass 1: Terrain Solids & Cover Props
    for (const s of map.solids) {
      if (s.kind === 'wall') continue;
      if (
        s.x + s.w < offsetX - 80 ||
        s.x > offsetX + viewW + 80 ||
        s.y + s.h < offsetY - 140 ||
        s.y > offsetY + viewH + 80
      ) {
        continue;
      }

      if (s.kind === 'crate') {
        this.drawRealisticCoverProp(ctx, s, map.id, mat);
      } else {
        this.drawOrganicTerrainMass(ctx, s, map.id, mat);
      }
    }

    // Pass 2: One-Way Platforms (Forest Rock Ledges, Desert Sand Dunes, Urban Rebar Slabs & Zip-Lines, Hangar Catwalks, Island Rope Bridges)
    const highTide = world.mapId === 'island' && Boolean(world.mapMechanic?.highTide);
    for (const p of map.platforms) {
      if (p.x + p.w < offsetX - 80 || p.x > offsetX + viewW + 80) continue;

      if (map.id === 'forest') {
        // FOREST OUTPOST: UNCHANGED organic rocky island ledge + spiky green grass crust
        const bellyH = 44;
        ctx.fillStyle = mat.rockBody;
        ctx.strokeStyle = mat.outline;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(p.x + 4, p.y + 4);
        ctx.lineTo(p.x + p.w - 4, p.y + 4);
        ctx.quadraticCurveTo(p.x + p.w + 6, p.y + bellyH * 0.48, p.x + p.w * 0.8, p.y + bellyH - 2);
        ctx.quadraticCurveTo(p.x + p.w * 0.5, p.y + bellyH + 4, p.x + p.w * 0.2, p.y + bellyH - 2);
        ctx.quadraticCurveTo(p.x - 6, p.y + bellyH * 0.48, p.x + 4, p.y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        for (let rx = p.x + 28; rx < p.x + p.w - 24; rx += 42) {
          const seed = hash2d(rx, p.y + 19);
          this.drawFacetedStone(
            ctx,
            rx,
            p.y + 18 + seed * 12,
            5.5 + seed * 4.5,
            seed > 0.5 ? mat.rockChunkLight : mat.rockChunkDark,
            mat.outline,
          );
        }

        const numEdgeStones = Math.max(5, Math.floor(p.w / 20));
        for (let i = 0; i <= numEdgeStones; i++) {
          const t = i / numEdgeStones;
          const sx = p.x + t * p.w;
          const arch = Math.sin(t * Math.PI);
          const sy = p.y + 8 + arch * (bellyH - 10);
          const seed = hash2d(sx, sy);
          this.drawFacetedStone(
            ctx,
            sx,
            sy,
            6 + seed * 4,
            seed > 0.5 ? mat.rockChunkLight : mat.rockChunkDark,
            mat.outline,
          );
        }

        this.drawJaggedGrassStrip(ctx, p.x - 4, p.y, p.w + 8, mat.grassMain, mat.grassDark, mat.outline);
      } else if (map.id === 'desert') {
        if (p.style === 'bridge' || p.style === 'metal') {
          // Desert Command Compound Steel Walkway / Radar Dish Platform
          ctx.fillStyle = '#92400E';
          ctx.strokeStyle = mat.outline;
          ctx.lineWidth = 2.2;
          ctx.fillRect(p.x, p.y, p.w, 18);
          ctx.strokeRect(p.x, p.y, p.w, 18);
          ctx.fillStyle = '#F59E0B';
          for (let rx = p.x + 8; rx < p.x + p.w - 12; rx += 26) {
            ctx.fillRect(rx, p.y + 3, 14, 4);
          }
        } else {
          // Sculpted Desert Sandstone Slab with Rippled Golden Sand Dune Crest (NO grass!)
          const bellyH = 38;
          ctx.fillStyle = '#C68E53';
          ctx.strokeStyle = mat.outline;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.roundRect(p.x, p.y + 4, p.w, bellyH - 4, [6, 6, 18, 18]);
          ctx.fill();
          ctx.stroke();

          // Horizontal sandstone sedimentary strata lines
          ctx.strokeStyle = 'rgba(120, 68, 33, 0.5)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(p.x + 10, p.y + 18);
          ctx.lineTo(p.x + p.w - 10, p.y + 18);
          ctx.moveTo(p.x + 18, p.y + 28);
          ctx.lineTo(p.x + p.w - 18, p.y + 28);
          ctx.stroke();

          // Smooth golden wind-blown sand dune crest on top
          ctx.fillStyle = '#F3C88B';
          ctx.strokeStyle = mat.outline;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(p.x - 2, p.y + 9);
          for (let sx = p.x; sx <= p.x + p.w; sx += 24) {
            const wave = Math.sin((sx - p.x) * 0.045) * 4;
            ctx.lineTo(sx, p.y - 2 + wave);
          }
          ctx.lineTo(p.x + p.w + 2, p.y + 9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else if (map.id === 'urban') {
        if (p.style === 'zipline') {
          // Rooftop Row High-Tension Zip-Line Cable + Pulley Trolley & Anchor Posts
          ctx.save();
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + 3);
          ctx.lineTo(p.x + p.w, p.y + 3);
          ctx.stroke();

          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.2;
          ctx.setLineDash([12, 8]);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + 3);
          ctx.lineTo(p.x + p.w, p.y + 3);
          ctx.stroke();
          ctx.setLineDash([]);

          // Animated zip-line pulley trolley
          const trolleyX = p.x + 24 + ((Math.sin(world.elapsed * 1.8 + p.x) * 0.5 + 0.5) * (p.w - 48));
          ctx.fillStyle = '#FACC15';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 1.8;
          ctx.fillRect(trolleyX - 10, p.y - 4, 20, 10);
          ctx.strokeRect(trolleyX - 10, p.y - 4, 20, 10);
          ctx.restore();
        } else {
          // Shattered Skyscraper Concrete Floor Slab with Exposed Rusted Rebar & I-Beam
          ctx.save();
          // Exposed protruding rebar rods at broken left/right ends
          ctx.strokeStyle = '#B45309';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(p.x - 14, p.y + 8);
          ctx.lineTo(p.x + p.w + 14, p.y + 8);
          ctx.moveTo(p.x - 10, p.y + 18);
          ctx.lineTo(p.x + p.w + 10, p.y + 18);
          ctx.stroke();

          ctx.fillStyle = '#64748B';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2.2;
          ctx.fillRect(p.x, p.y, p.w, 26);
          ctx.strokeRect(p.x, p.y, p.w, 26);

          // Red/brown steel girder flange along underside
          ctx.fillStyle = '#7C2D12';
          ctx.fillRect(p.x + 4, p.y + 20, p.w - 8, 6);

          // Yellow hazard floor stripe
          ctx.fillStyle = '#FACC15';
          ctx.fillRect(p.x + 6, p.y + 3, p.w - 12, 3);
          ctx.restore();
        }
      } else if (map.id === 'hangar') {
        // Industrial Steel Catwalk Truss with Safety Railing
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#030712';
        ctx.lineWidth = 2;
        ctx.fillRect(p.x, p.y, p.w, 16);
        ctx.strokeRect(p.x, p.y, p.w, 16);
        ctx.fillStyle = '#F59E0B';
        for (let rx = p.x + 10; rx < p.x + p.w - 10; rx += 24) {
          ctx.fillRect(rx, p.y + 3, 10, 4);
        }
      } else if (map.id === 'island') {
        if (p.style === 'rope_bridge') {
          // Rope Suspension Bridge (dims and submerges during High Tide if submergesAtHighTide)
          const submerged = highTide && Boolean(p.submergesAtHighTide);
          ctx.save();
          ctx.globalAlpha = submerged ? 0.32 : 1;

          // End timber posts
          ctx.fillStyle = '#78350F';
          ctx.strokeStyle = '#1C1917';
          ctx.lineWidth = 2;
          ctx.fillRect(p.x - 4, p.y - 26, 10, 36);
          ctx.strokeRect(p.x - 4, p.y - 26, 10, 36);
          ctx.fillRect(p.x + p.w - 6, p.y - 26, 10, 36);
          ctx.strokeRect(p.x + p.w - 6, p.y - 26, 10, 36);

          // Catenary hemp hand-rope & vertical suspender cords
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 22);
          ctx.quadraticCurveTo(p.x + p.w * 0.5, p.y - 4, p.x + p.w, p.y - 22);
          ctx.stroke();

          ctx.lineWidth = 1.2;
          for (let rx = p.x + 18; rx < p.x + p.w - 12; rx += 22) {
            const t = (rx - p.x) / p.w;
            const ropeY = p.y - 22 + Math.sin(t * Math.PI) * 10;
            ctx.beginPath();
            ctx.moveTo(rx, ropeY);
            ctx.lineTo(rx, p.y + 4);
            ctx.stroke();
          }

          // Wooden bridge planks
          for (let px = p.x + 2; px < p.x + p.w - 12; px += 16) {
            ctx.fillStyle = '#92400E';
            ctx.strokeStyle = '#1C1917';
            ctx.lineWidth = 1.6;
            ctx.fillRect(px, p.y, 13, 10);
            ctx.strokeRect(px, p.y, 13, 10);
          }
          ctx.restore();
        } else {
          // Ancient Coastal Stone Castle Battlement / Masonry Ledge
          ctx.save();
          ctx.fillStyle = '#94A3B8';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2.2;
          ctx.fillRect(p.x, p.y, p.w, 28);
          ctx.strokeRect(p.x, p.y, p.w, 28);

          // Stone block mortar joints & crenellations
          ctx.fillStyle = '#64748B';
          for (let bx = p.x + 8; bx < p.x + p.w - 18; bx += 28) {
            ctx.fillRect(bx, p.y + 6, 20, 16);
          }
          ctx.restore();
        }
      }
    }
  }

  private drawMapZones(ctx: CanvasRenderingContext2D, map: ArenaMap, world: MatchWorld): void {
    if (!map.zones) return;
    for (const z of map.zones) {
      ctx.save();
      if (z.kind === 'oasis_heal') {
        // Shimmering Turquoise Oasis Healing Water Pool + Rising +HP Bubbles
        const grad = ctx.createLinearGradient(z.x, z.y, z.x, z.y + z.h);
        grad.addColorStop(0, 'rgba(45, 212, 191, 0.78)');
        grad.addColorStop(1, 'rgba(13, 148, 136, 0.92)');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#14B8A6';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(z.x, z.y + 8, z.w, z.h - 8, 12);
        ctx.fill();
        ctx.stroke();

        // Shimmering surface waves
        ctx.strokeStyle = 'rgba(204, 251, 241, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let wx = z.x + 8; wx <= z.x + z.w - 8; wx += 14) {
          const wy = z.y + 11 + Math.sin(world.elapsed * 4 + wx * 0.08) * 2.5;
          if (wx === z.x + 8) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.stroke();

        // Floating green "+HP OASIS" badge & rising heal crosses
        ctx.font = '800 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#A7F3D0';
        ctx.fillText('OASIS +HP REGEN', z.x + z.w / 2, z.y + 2);
      } else if (z.kind === 'conveyor_left' || z.kind === 'conveyor_right') {
        // Motorized Industrial Conveyor Belt with Animated Scrolling Chevrons
        ctx.fillStyle = '#1E293B';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(z.x, z.y, z.w, z.h, 8);
        ctx.fill();
        ctx.stroke();

        const dir = z.kind === 'conveyor_right' ? 1 : -1;
        const scroll = ((world.elapsed * 85 * dir) % 28 + 28) % 28;
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2.4;
        for (let cx = z.x + 14 + scroll - 14; cx < z.x + z.w - 10; cx += 28) {
          if (cx < z.x + 8 || cx > z.x + z.w - 8) continue;
          const midY = z.y + z.h / 2;
          ctx.beginPath();
          ctx.moveTo(cx - 5 * dir, midY - 5);
          ctx.lineTo(cx + 5 * dir, midY);
          ctx.lineTo(cx - 5 * dir, midY + 5);
          ctx.stroke();
        }
      } else if (z.kind === 'jump_pad') {
        // Glowing Pneumatic Rooftop Jump Pad
        const pulse = 0.7 + Math.sin(world.elapsed * 6) * 0.3;
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.2;
        ctx.fillRect(z.x, z.y + z.h - 10, z.w, 10);
        ctx.strokeRect(z.x, z.y + z.h - 10, z.w, 10);

        ctx.strokeStyle = `rgba(56, 189, 248, ${pulse})`;
        ctx.lineWidth = 2.5;
        const cx = z.x + z.w / 2;
        for (let tier = 0; tier < 2; tier++) {
          const ay = z.y + 4 - tier * 8 - ((world.elapsed * 24) % 8);
          ctx.beginPath();
          ctx.moveTo(cx - 12, ay + 7);
          ctx.lineTo(cx, ay);
          ctx.lineTo(cx + 12, ay + 7);
          ctx.stroke();
        }
      } else if (z.kind === 'vault_switch') {
        // Interactive Armory Vault Terminal Switch (Red when locked, Emerald Green when unlocked)
        const open = Boolean(world.hangarVaultOpen);
        ctx.fillStyle = '#1E293B';
        ctx.strokeStyle = open ? '#22C55E' : '#EF4444';
        ctx.lineWidth = 2.4;
        ctx.fillRect(z.x, z.y, z.w, z.h);
        ctx.strokeRect(z.x, z.y, z.w, z.h);

        ctx.fillStyle = open ? '#22C55E' : '#EF4444';
        ctx.beginPath();
        ctx.arc(z.x + z.w / 2, z.y + z.h / 2 - 4, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '800 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText(open ? 'VAULT OPEN' : 'HIT SWITCH', z.x + z.w / 2, z.y - 6);
      } else if (z.kind === 'fire_hazard') {
        // Fuel Depot Animated Fire Hazard Floor Grate
        ctx.fillStyle = '#7F1D1D';
        ctx.strokeStyle = '#F97316';
        ctx.lineWidth = 1.8;
        ctx.fillRect(z.x, z.y + z.h - 8, z.w, 8);
        ctx.strokeRect(z.x, z.y + z.h - 8, z.w, 8);

        for (let fx = z.x + 8; fx < z.x + z.w - 6; fx += 14) {
          const flameH = 12 + Math.sin(world.elapsed * 14 + fx) * 7;
          ctx.fillStyle = fx % 28 === 0 ? '#FACC15' : '#F97316';
          ctx.beginPath();
          ctx.moveTo(fx - 6, z.y + z.h - 8);
          ctx.lineTo(fx, z.y + z.h - 8 - flameH);
          ctx.lineTo(fx + 6, z.y + z.h - 8);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  private drawDestructibles(ctx: CanvasRenderingContext2D, world: MatchWorld): void {
    if (!world.destructibles) return;
    for (const d of world.destructibles) {
      if (!d.active) continue;
      ctx.save();
      const hpRatio = Math.max(0, Math.min(1, d.hp / Math.max(1, d.maxHp)));

      if (d.kind === 'destructible_wall') {
        // Cracked Concrete / Brick Destructible Wall (RPG shatters immediately)
        ctx.fillStyle = d.hitFlashTimer > 0 ? '#FCA5A5' : '#78716C';
        ctx.strokeStyle = '#1C1917';
        ctx.lineWidth = 2.4;
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeRect(d.x, d.y, d.w, d.h);

        // Brick courses
        ctx.strokeStyle = 'rgba(28, 25, 23, 0.45)';
        ctx.lineWidth = 1.4;
        for (let by = d.y + 18; by < d.y + d.h - 8; by += 18) {
          ctx.beginPath();
          ctx.moveTo(d.x + 2, by);
          ctx.lineTo(d.x + d.w - 2, by);
          ctx.stroke();
        }

        // Jagged structural fracture cracks (deepen as HP drops)
        ctx.strokeStyle = '#F97316';
        ctx.lineWidth = hpRatio < 0.6 ? 2.6 : 1.8;
        ctx.beginPath();
        ctx.moveTo(d.x + d.w * 0.25, d.y + 10);
        ctx.lineTo(d.x + d.w * 0.68, d.y + d.h * 0.35);
        ctx.lineTo(d.x + d.w * 0.32, d.y + d.h * 0.65);
        ctx.lineTo(d.x + d.w * 0.75, d.y + d.h - 10);
        ctx.stroke();

        // Small RPG breach icon badge
        ctx.fillStyle = '#FACC15';
        ctx.font = '800 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RPG', d.x + d.w / 2, d.y - 4);
      } else if (d.kind === 'explosive_barrel') {
        // Red & Yellow Hazard Explosive Fuel Barrel
        ctx.fillStyle = d.hitFlashTimer > 0 ? '#FEF08A' : '#DC2626';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(d.x, d.y, d.w, d.h, 5);
        ctx.fill();
        ctx.stroke();

        // Yellow hazard band & flame diamond
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(d.x + 2, d.y + d.h * 0.34, d.w - 4, d.h * 0.28);
        ctx.fillStyle = '#0F172A';
        ctx.font = '800 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TNT', d.x + d.w / 2, d.y + d.h * 0.54);
      } else if (d.kind === 'vault_door') {
        // Armored Hangar Armory Vault Blast Door
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2.4;
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeRect(d.x, d.y, d.w, d.h);

        // Diagonal yellow/black security chevrons
        ctx.fillStyle = '#F59E0B';
        for (let sy = d.y + 8; sy < d.y + d.h - 12; sy += 22) {
          ctx.fillRect(d.x + 4, sy, d.w - 8, 8);
        }
      }
      ctx.restore();
    }
  }

  private drawWorldForegroundMechanics(
    ctx: CanvasRenderingContext2D,
    map: ArenaMap,
    world: MatchWorld,
    focus: SoldierEntity | null,
    offsetX: number,
    offsetY: number,
    viewW: number,
    viewH: number,
  ): void {
    // 1. Island Fortress: Dynamic Rising/Falling Ocean Water with Whitecap Waves
    if (map.id === 'island') {
      const waterY = world.mapMechanic?.waterY ?? 1155;
      const highTide = Boolean(world.mapMechanic?.highTide);
      ctx.save();
      const oceanGrad = ctx.createLinearGradient(0, waterY, 0, map.height + 120);
      oceanGrad.addColorStop(0, highTide ? 'rgba(14, 165, 233, 0.68)' : 'rgba(56, 189, 248, 0.58)');
      oceanGrad.addColorStop(0.4, 'rgba(2, 132, 199, 0.82)');
      oceanGrad.addColorStop(1, 'rgba(12, 74, 110, 0.94)');
      ctx.fillStyle = oceanGrad;
      ctx.beginPath();
      ctx.moveTo(0, map.height + 120);
      ctx.lineTo(0, waterY);
      for (let wx = 0; wx <= map.width; wx += 28) {
        const wave = Math.sin(world.elapsed * 3.4 + wx * 0.035) * 5;
        ctx.lineTo(wx, waterY + wave);
      }
      ctx.lineTo(map.width, map.height + 120);
      ctx.closePath();
      ctx.fill();

      // Glowing whitecap foam line along dynamic tide waterY
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let wx = 0; wx <= map.width; wx += 28) {
        const wave = Math.sin(world.elapsed * 3.4 + wx * 0.035) * 5;
        if (wx === 0) ctx.moveTo(wx, waterY + wave);
        else ctx.lineTo(wx, waterY + wave);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Urban Ruins: Underground Metro Station Dark Tunnel & Tactical Flashlight / Night-Vision Cone
    if (map.id === 'urban') {
      ctx.save();
      const metroTop = 945;
      const metroH = 260;
      ctx.fillStyle = 'rgba(2, 6, 23, 0.68)';
      ctx.fillRect(40, metroTop, map.width - 80, metroH);

      // If focus soldier is inside or near the underground Metro Station, project a bright tactical flashlight + NVG cone
      if (focus && focus.alive && focus.y + focus.h > metroTop - 30) {
        const sx = focus.x + focus.w / 2;
        const sy = focus.y + focus.h * 0.4;
        const coneGrad = ctx.createRadialGradient(sx, sy, 12, sx, sy, 310);
        coneGrad.addColorStop(0, 'rgba(134, 239, 172, 0.34)');
        coneGrad.addColorStop(0.55, 'rgba(74, 222, 128, 0.16)');
        coneGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.arc(sx, sy, 310, focus.aimAngle - 0.48, focus.aimAngle + 0.48);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawMapBuilding(
    ctx: CanvasRenderingContext2D,
    b: MapBuilding,
    mapId: ArenaMap['id'],
    world: MatchWorld,
    mat: {
      cavernWall: string;
      cavernPebble: string;
      rockBody: string;
      rockChunkLight: string;
      rockChunkDark: string;
      grassMain: string;
      grassDark: string;
      outline: string;
    },
  ): void {
    ctx.save();

    // 1. Recessed interior structural backdrop
    ctx.fillStyle =
      mapId === 'hangar'
        ? 'rgba(15, 23, 42, 0.76)'
        : mapId === 'urban'
          ? b.style === 'metro_station'
            ? 'rgba(2, 6, 23, 0.88)'
            : 'rgba(30, 41, 59, 0.72)'
          : mapId === 'desert'
            ? b.style === 'buried_bunker'
              ? 'rgba(41, 25, 16, 0.86)'
              : 'rgba(120, 74, 42, 0.64)'
            : b.style === 'cave_grotto'
              ? 'rgba(8, 47, 73, 0.82)'
              : 'rgba(38, 34, 29, 0.64)';
    ctx.strokeStyle = b.accentColor ?? 'rgba(15, 23, 42, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.fillRect(b.x + 14, b.y + 12, b.w - 28, b.h - 12);
    ctx.strokeRect(b.x + 14, b.y + 12, b.w - 28, b.h - 12);

    // 2. Interior structural steel ribs / masonry columns
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = 3;
    for (let gx = b.x + 56; gx < b.x + b.w - 40; gx += 76) {
      ctx.beginPath();
      ctx.moveTo(gx, b.y + 16);
      ctx.lineTo(gx, b.y + b.h);
      ctx.stroke();
    }

    // 3. Tactical window embrasures / firing slits across stories
    const windowRows = Math.max(1, Math.min(4, Math.floor(b.h / 145)));
    const windowCols = Math.max(2, Math.min(5, Math.floor((b.w - 80) / 88)));
    for (let r = 0; r < windowRows; r++) {
      const wy = b.y + 48 + r * 140;
      if (wy + 46 > b.y + b.h - 24) continue;
      for (let c = 0; c < windowCols; c++) {
        const wx =
          b.x +
          42 +
          c * Math.floor((b.w - 110) / Math.max(1, windowCols - 1)) -
          18;
        ctx.fillStyle =
          mapId === 'hangar' || b.style === 'control_tower'
            ? 'rgba(56, 189, 248, 0.24)'
            : b.style === 'hospital_ruins'
              ? 'rgba(239, 68, 68, 0.22)'
              : 'rgba(15, 23, 42, 0.62)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 1.6;
        ctx.fillRect(wx, wy, 36, 44);
        ctx.strokeRect(wx, wy, 36, 44);
        ctx.beginPath();
        ctx.moveTo(wx, wy + 22);
        ctx.lineTo(wx + 36, wy + 22);
        ctx.moveTo(wx + 18, wy);
        ctx.lineTo(wx + 18, wy + 44);
        ctx.stroke();
      }
    }

    // 4. Landmark-Specific Superstructures & Visual Setpieces
    const centerX = b.x + b.w / 2;
    const roofY = b.y;

    if (b.style === 'radar_station' || b.style === 'radar_dome' || b.style === 'bunker_hq') {
      // Giant Rotating/Tilted Parabolic Radar Dish + Geodesic Dome (Jetpack-Only Sniper Nest)
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, roofY - 26, 48, Math.PI * 0.85, Math.PI * 0.15, true);
      ctx.stroke();
      // Feed horn mast
      ctx.beginPath();
      ctx.moveTo(centerX, roofY - 26);
      ctx.lineTo(centerX + 24, roofY - 58);
      ctx.stroke();
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(centerX + 24, roofY - 58, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.style === 'oasis_tower') {
      // Alpha Oasis Sniper Watchtower with Camo Canopy & Palm Tree
      ctx.fillStyle = '#92400E';
      ctx.strokeStyle = mat.outline;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(b.x + 12, roofY + 6);
      ctx.lineTo(centerX, roofY - 36);
      ctx.lineTo(b.x + b.w - 12, roofY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      this.drawPalmTree(ctx, b.x + b.w - 28, b.y + b.h - 8, mat.outline);
    } else if (b.style === 'supply_depot') {
      // Military 6x6 Cargo Supply Truck parked inside Supply Depot
      const tx = b.x + 48;
      const ty = b.y + b.h - 68;
      ctx.fillStyle = '#4D7C0F';
      ctx.strokeStyle = '#1C1917';
      ctx.lineWidth = 2.2;
      // Cargo bed & canvas cover
      ctx.fillRect(tx, ty, 128, 48);
      ctx.strokeRect(tx, ty, 128, 48);
      // Truck cab
      ctx.fillStyle = '#3F6212';
      ctx.fillRect(tx + 128, ty + 14, 44, 34);
      ctx.strokeRect(tx + 128, ty + 14, 44, 34);
      // Windshield
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(tx + 148, ty + 18, 18, 14);
      // 3 heavy tires
      for (const wx of [tx + 26, tx + 78, tx + 148]) {
        ctx.fillStyle = '#1C1917';
        ctx.beginPath();
        ctx.arc(wx, ty + 50, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78716C';
        ctx.beginPath();
        ctx.arc(wx, ty + 50, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (b.style === 'collapsed_skyscraper') {
      // 5-Story Broken Skyscraper Floor Callouts & Exposed Girder Crane
      ctx.fillStyle = '#38BDF8';
      ctx.font = '800 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      const floors = ['FL-5 PENTHOUSE', 'FL-4', 'FL-3', 'FL-2', 'FL-1 LOBBY'];
      floors.forEach((lbl, idx) => {
        ctx.fillText(lbl, b.x + 22, b.y + 72 + idx * 140);
      });
    } else if (b.style === 'hospital_ruins') {
      // Glowing Medical Red Cross Emblem on Hospital Facade
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(centerX, roofY - 26, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(centerX - 6, roofY - 42, 12, 32);
      ctx.fillRect(centerX - 16, roofY - 32, 32, 12);
    } else if (b.style === 'gas_station') {
      // Red/Yellow Canopy & Fuel Pump Island
      ctx.fillStyle = '#DC2626';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.2;
      ctx.fillRect(b.x + 6, roofY - 18, b.w - 12, 18);
      ctx.strokeRect(b.x + 6, roofY - 18, b.w - 12, 18);
      // Fuel pump dispensers
      for (const px of [centerX - 55, centerX + 35]) {
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(px, b.y + b.h - 46, 24, 38);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px + 4, b.y + b.h - 40, 16, 12);
      }
    } else if (b.style === 'metro_station') {
      // Underground Subway Tracks & Glowing Cyan Metro Line Neon Strip
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x + 24, b.y + 44);
      ctx.lineTo(b.x + b.w - 24, b.y + 44);
      ctx.stroke();
    } else if (b.style === 'main_hangar_floor') {
      // Crashed Supersonic Fighter Jet Wreck on the Main Hangar Deck
      const jx = centerX;
      const jy = b.y + b.h - 32;
      ctx.fillStyle = '#64748B';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.4;
      // Sleek fighter fuselage
      ctx.beginPath();
      ctx.moveTo(jx - 165, jy - 8);
      ctx.lineTo(jx + 95, jy - 28);
      ctx.lineTo(jx + 175, jy - 10);
      ctx.lineTo(jx + 95, jy + 4);
      ctx.lineTo(jx - 155, jy + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Swept twin tail fins
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(jx - 150, jy - 10);
      ctx.lineTo(jx - 185, jy - 68);
      ctx.lineTo(jx - 115, jy - 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Gold-tinted armored cockpit canopy
      ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
      ctx.beginPath();
      ctx.ellipse(jx + 68, jy - 24, 36, 11, -0.1, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      // USAF-style tactical roundel star on fuselage
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(jx - 30, jy - 12, 11, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.style === 'armory_vault') {
      const open = Boolean(world.hangarVaultOpen);
      ctx.fillStyle = open ? 'rgba(34, 197, 94, 0.24)' : 'rgba(239, 68, 68, 0.22)';
      ctx.fillRect(b.x + 18, b.y + 44, b.w - 36, b.h - 54);
    } else if (b.style === 'main_fortress') {
      // 4-Corner-Tower Stone Castle Crenellations & Battlements
      for (const tx of [b.x + 12, b.x + b.w - 68]) {
        ctx.fillStyle = '#64748B';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.2;
        ctx.fillRect(tx, roofY - 46, 56, 48);
        ctx.strokeRect(tx, roofY - 46, 56, 48);
        // Merlons
        for (let mx = tx; mx < tx + 52; mx += 18) {
          ctx.fillRect(mx, roofY - 58, 12, 12);
          ctx.strokeRect(mx, roofY - 58, 12, 12);
        }
      }
    } else if (b.style === 'pirate_dock') {
      // Anchored Wooden Pirate / Smuggler Gunboat Hull with Mast & Tattered Sail
      const sx = centerX + 10;
      const sy = b.y + b.h - 24;
      ctx.fillStyle = '#78350F';
      ctx.strokeStyle = '#1C1917';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(sx - 135, sy - 34);
      ctx.lineTo(sx + 145, sy - 42);
      ctx.lineTo(sx + 105, sy + 6);
      ctx.lineTo(sx - 105, sy + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Timber mast & yardarm
      ctx.fillStyle = '#451A03';
      ctx.fillRect(sx - 6, sy - 165, 10, 130);
      // Tattered crimson/amber sail
      ctx.fillStyle = 'rgba(217, 119, 6, 0.78)';
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy - 155);
      ctx.quadraticCurveTo(sx + 78, sy - 115, sx + 4, sy - 68);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (b.style === 'lighthouse_hq' || b.style === 'sea_bastion') {
      // Tall Red-and-White Striped Lighthouse Tower with 360° Beacon Dome
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = mat.outline;
      ctx.lineWidth = 2.2;
      ctx.fillRect(centerX - 26, roofY - 86, 52, 88);
      ctx.strokeRect(centerX - 26, roofY - 86, 52, 88);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(centerX - 25, roofY - 62, 50, 22);
      ctx.fillRect(centerX - 25, roofY - 24, 50, 16);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(centerX - 20, roofY - 106, 40, 20);
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(centerX, roofY - 106, 24, Math.PI, 0);
      ctx.fill();
    } else if (b.style === 'control_tower' || b.style === 'fighter_bay') {
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 56, roofY + 4);
      ctx.lineTo(centerX - 70, roofY - 38);
      ctx.lineTo(centerX + 70, roofY - 38);
      ctx.lineTo(centerX + 56, roofY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(centerX - 32, roofY - 54, 64, 7);
    } else if (b.style === 'watchtower' || b.style === 'logging_mill') {
      // Forest Outpost: Pitched Timber Outpost Roof & Sandbag Parapet (UNCHANGED)
      ctx.fillStyle = '#785538';
      ctx.strokeStyle = mat.outline;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(b.x + 18, roofY + 6);
      ctx.lineTo(centerX, roofY - 34);
      ctx.lineTo(b.x + b.w - 18, roofY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 5. Landmark Color-Coded Callout Signboard on Building Facade
    const signW = Math.min(b.w - 24, 240);
    const signX = centerX - signW / 2;
    const signY =
      b.style === 'armory_vault'
        ? b.y + 52
        : b.style === 'main_fortress'
          ? b.y + 42
          : b.y + 16;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = b.accentColor ?? 'rgba(248, 250, 252, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.fillRect(signX, signY, signW, 22);
    ctx.strokeRect(signX, signY, signW, 22);

    ctx.font = '800 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = b.accentColor ?? '#FACC15';
    ctx.fillText(b.name, centerX, signY + 14.5);

    ctx.restore();
  }

  private drawOrganicTerrainMass(
    ctx: CanvasRenderingContext2D,
    s: Rect,
    mapId: ArenaMap['id'],
    mat: {
      rockBody: string;
      rockChunkLight: string;
      rockChunkDark: string;
      grassMain: string;
      grassDark: string;
      outline: string;
    },
  ): void {
    const visualH = s.h;

    if (mapId === 'hangar') {
      // Military Hangar: Riveted Industrial Steel Deck Bulkhead with Hazard Trim
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = mat.outline;
      ctx.lineWidth = 2.4;
      ctx.fillRect(s.x, s.y, s.w, visualH);
      ctx.strokeRect(s.x, s.y, s.w, visualH);

      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(s.x + 2, s.y, s.w - 4, 9);
      ctx.fillStyle = '#0F172A';
      for (let hx = s.x + 8; hx < s.x + s.w - 12; hx += 24) {
        ctx.fillRect(hx, s.y + 1, 10, 7);
      }
      return;
    }

    if (mapId === 'urban') {
      // Urban Ruins: Cracked Reinforced Concrete & Asphalt Street Deck (NO grass!)
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = mat.outline;
      ctx.lineWidth = 2.4;
      ctx.fillRect(s.x, s.y, s.w, visualH);
      ctx.strokeRect(s.x, s.y, s.w, visualH);

      // Dark asphalt roadway top cap with dashed yellow road markings
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(s.x, s.y, s.w, 12);
      ctx.fillStyle = '#FACC15';
      for (let rx = s.x + 16; rx < s.x + s.w - 24; rx += 44) {
        ctx.fillRect(rx, s.y + 4, 22, 3);
      }

      if (s.w >= 170) {
        const propSeed = hash2d(s.x * 0.7, s.y * 1.3);
        if (propSeed > 0.35) {
          this.drawUrbanStreetProp(ctx, s.x + s.w * 0.25, s.y + 2, mat.outline);
        }
      }
      return;
    }

    // 1. Organic contoured rock / sandstone / coastal limestone body
    ctx.fillStyle = mat.rockBody;
    ctx.strokeStyle = mat.outline;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(s.x, s.y + 2, s.w, visualH - 2, 18);
    ctx.fill();
    ctx.stroke();

    // 2. Interior scattered stone chunks & pebbles
    const cols = Math.max(2, Math.floor(s.w / 46));
    const rows = Math.max(1, Math.floor(visualH / 40));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = hash2d(s.x + c * 29, s.y + r * 37);
        if (seed > 0.28) {
          const cx = s.x + 22 + c * 44 + (seed - 0.5) * 18;
          const cy = s.y + 24 + r * 36 + (hash2d(c, r) - 0.5) * 12;
          if (
            cx > s.x + 14 &&
            cx < s.x + s.w - 14 &&
            cy > s.y + 16 &&
            cy < s.y + visualH - 12
          ) {
            this.drawFacetedStone(
              ctx,
              cx,
              cy,
              5.5 + seed * 8.5,
              seed > 0.62 ? mat.rockChunkLight : mat.rockChunkDark,
              mat.outline,
            );
          }
        }
      }
    }

    // 3. Faceted polygonal border stones along left, right, and bottom cliff edges
    const step = 17;
    for (let y = s.y + 14; y < s.y + visualH - 8; y += step) {
      const seed = hash2d(s.x, y);
      this.drawFacetedStone(
        ctx,
        s.x + 2,
        y,
        7.5 + seed * 5,
        seed > 0.5 ? mat.rockChunkLight : mat.rockChunkDark,
        mat.outline,
      );
    }
    for (let y = s.y + 14; y < s.y + visualH - 8; y += step) {
      const seed = hash2d(s.x + s.w, y);
      this.drawFacetedStone(
        ctx,
        s.x + s.w - 2,
        y,
        7.5 + seed * 5,
        seed > 0.5 ? mat.rockChunkLight : mat.rockChunkDark,
        mat.outline,
      );
    }
    if (s.y < 900) {
      for (let x = s.x + 12; x < s.x + s.w - 10; x += step) {
        const seed = hash2d(x, s.y + visualH);
        this.drawFacetedStone(
          ctx,
          x,
          s.y + visualH - 2,
          7.5 + seed * 5,
          seed > 0.5 ? mat.rockChunkLight : mat.rockChunkDark,
          mat.outline,
        );
      }
    }

    // 4. Biome-Specific Top Surface Crust
    if (mapId === 'forest') {
      // Forest Outpost: Jagged Jungle Grass Top Crust (UNCHANGED)
      this.drawJaggedGrassStrip(ctx, s.x - 4, s.y, s.w + 8, mat.grassMain, mat.grassDark, mat.outline);
    } else if (mapId === 'desert') {
      // Desert Base: Smooth Wind-Swept Golden Sand Dune Crest (NO grass blades!)
      ctx.fillStyle = '#F3C88B';
      ctx.strokeStyle = mat.outline;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(s.x - 2, s.y + 10);
      for (let sx = s.x; sx <= s.x + s.w; sx += 26) {
        const wave = Math.sin((sx - s.x) * 0.04) * 4;
        ctx.lineTo(sx, s.y - 2 + wave);
      }
      ctx.lineTo(s.x + s.w + 2, s.y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (mapId === 'island') {
      // Island Fortress: Coastal Stone Castle Masonry Parapet Cap & Sandy Shore Trim
      ctx.fillStyle = '#CBD5E1';
      ctx.strokeStyle = mat.outline;
      ctx.lineWidth = 2;
      ctx.fillRect(s.x + 2, s.y, s.w - 4, 10);
      ctx.strokeRect(s.x + 2, s.y, s.w - 4, 10);
    }

    // 5. Surface Foliage & Biome Props
    if (s.w >= 170) {
      const propSeed = hash2d(s.x * 0.7, s.y * 1.3);
      if (mapId === 'forest') {
        if (propSeed > 0.32) {
          this.drawPalmTree(ctx, s.x + s.w * 0.28, s.y + 2, mat.outline);
        }
        if (propSeed < 0.78) {
          this.drawJungleBush(ctx, s.x + s.w * 0.72, s.y + 2, mat.grassMain, mat.grassDark, mat.outline);
        }
      } else if (mapId === 'desert') {
        if (propSeed > 0.45) {
          this.drawDesertCactus(ctx, s.x + s.w * 0.3, s.y + 2, mat.outline);
        }
      } else if (mapId === 'island') {
        if (propSeed > 0.55) {
          this.drawPalmTree(ctx, s.x + s.w * 0.22, s.y + 2, mat.outline);
        }
      }
    }
  }

  private drawFacetedStone(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    fill: string,
    outline: string,
  ): void {
    ctx.fillStyle = fill;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const sides = 5;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + (cx * 0.15 + cy * 0.1);
      const rad = r * (i % 2 === 0 ? 1 : 0.76);
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad * 0.85;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawJaggedGrassStrip(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    grassMain: string,
    grassDark: string,
    outline: string,
  ): void {
    ctx.fillStyle = grassMain;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y + 8);

    // Upward spiky grass blades along top edge
    const bladeStep = 14;
    for (let gx = x; gx <= x + w; gx += bladeStep) {
      const seed = hash2d(gx, y);
      const tipH = 6 + seed * 9;
      const lean = (seed - 0.5) * 8;
      ctx.lineTo(gx + bladeStep * 0.35 + lean, y - tipH);
      ctx.lineTo(gx + bladeStep * 0.75, y + 2);
    }

    // Bottom jagged overlap onto rock
    for (let gx = x + w; gx >= x; gx -= 18) {
      const seed = hash2d(gx * 1.3, y + 10);
      ctx.lineTo(gx, y + 8 + seed * 7);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner dark grass highlight tufts
    ctx.fillStyle = grassDark;
    for (let gx = x + 16; gx < x + w - 16; gx += 38) {
      ctx.beginPath();
      ctx.moveTo(gx, y + 6);
      ctx.lineTo(gx + 5, y - 3);
      ctx.lineTo(gx + 10, y + 6);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawPalmTree(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    outline: string,
  ): void {
    ctx.save();
    const segments = 7;
    let curX = baseX;
    let curY = baseY;
    for (let i = 0; i < segments; i++) {
      const segW = 13 - i * 0.9;
      const segH = 15;
      const nextX = curX + Math.sin(i * 0.35) * 2.5;
      const nextY = curY - segH;
      ctx.fillStyle = i % 2 === 0 ? '#8C6D53' : '#735740';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(curX - segW / 2, curY);
      ctx.lineTo(nextX - (segW - 1) / 2, nextY);
      ctx.lineTo(nextX + (segW - 1) / 2, nextY);
      ctx.lineTo(curX + segW / 2, curY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      curX = nextX;
      curY = nextY;
    }

    const frondAngles = [-2.55, -2.05, -1.55, -1.0, -0.55, -0.15];
    for (let idx = 0; idx < frondAngles.length; idx++) {
      const ang = frondAngles[idx];
      const len = 46;
      const endX = curX + Math.cos(ang) * len;
      const endY = curY + Math.sin(ang) * len + 12;
      const ctrlX = curX + Math.cos(ang) * (len * 0.55);
      const ctrlY = curY + Math.sin(ang) * (len * 0.55) - 10;

      ctx.fillStyle = idx % 2 === 0 ? '#5E8C49' : '#4A7337';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.quadraticCurveTo(ctrlX, ctrlY - 9, endX, endY);
      ctx.quadraticCurveTo(ctrlX, ctrlY + 4, curX, curY + 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawJungleBush(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    lightGreen: string,
    darkGreen: string,
    outline: string,
  ): void {
    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.fillStyle = darkGreen;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const spikes = 9;
    for (let i = 0; i <= spikes; i++) {
      const a = Math.PI + (i / spikes) * Math.PI;
      const r = i % 2 === 0 ? 34 : 18;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = lightGreen;
    ctx.beginPath();
    for (let i = 0; i <= spikes; i++) {
      const a = Math.PI + (i / spikes) * Math.PI;
      const r = i % 2 === 0 ? 24 : 11;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r + 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawDesertCactus(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    outline: string,
  ): void {
    ctx.save();
    ctx.fillStyle = '#4D7C0F';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(baseX - 6, baseY - 68, 12, 68, 6);
    ctx.roundRect(baseX - 22, baseY - 46, 18, 9, 4);
    ctx.roundRect(baseX - 22, baseY - 62, 9, 22, 4);
    ctx.roundRect(baseX + 4, baseY - 38, 18, 9, 4);
    ctx.roundRect(baseX + 13, baseY - 54, 9, 22, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawUrbanStreetProp(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    outline: string,
  ): void {
    ctx.save();
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.fillRect(baseX - 3, baseY - 82, 6, 82);
    ctx.strokeRect(baseX - 3, baseY - 82, 6, 82);
    ctx.fillRect(baseX - 3, baseY - 82, 24, 5);
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(baseX + 14, baseY - 77, 8, 4);
    ctx.restore();
  }

  private drawRealisticCoverProp(
    ctx: CanvasRenderingContext2D,
    s: Rect,
    mapId: ArenaMap['id'],
    mat: { rockChunkLight: string; rockChunkDark: string; outline: string },
  ): void {
    if (mapId === 'forest') {
      // Forest Outpost: Cluster of jagged cover boulders (UNCHANGED)
      this.drawFacetedStone(
        ctx,
        s.x + s.w * 0.35,
        s.y + s.h * 0.62,
        Math.min(s.w, s.h) * 0.46,
        mat.rockChunkDark,
        mat.outline,
      );
      this.drawFacetedStone(
        ctx,
        s.x + s.w * 0.66,
        s.y + s.h * 0.68,
        Math.min(s.w, s.h) * 0.38,
        mat.rockChunkLight,
        mat.outline,
      );
      this.drawFacetedStone(
        ctx,
        s.x + s.w * 0.5,
        s.y + s.h * 0.38,
        Math.min(s.w, s.h) * 0.34,
        mat.rockChunkLight,
        mat.outline,
      );
    } else if (mapId === 'desert') {
      // Desert Base: Military Sandbag Barricade & Olive Supply Crate
      ctx.fillStyle = '#B45309';
      ctx.strokeStyle = mat.outline;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, s.h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(s.x + 6, s.y + 8, s.w - 12, 6);
    } else if (mapId === 'island') {
      // Island Fortress: Naval Cannon / Timber Cargo Crate
      ctx.fillStyle = '#78350F';
      ctx.strokeStyle = mat.outline;
      ctx.lineWidth = 2.2;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = '#D97706';
      ctx.beginPath();
      ctx.moveTo(s.x + 4, s.y + 4);
      ctx.lineTo(s.x + s.w - 4, s.y + s.h - 4);
      ctx.stroke();
    } else {
      // Urban Ruins / Military Hangar: Reinforced Concrete Jersey Barrier / Steel Crate
      ctx.fillStyle = mapId === 'urban' ? '#64748B' : '#334155';
      ctx.strokeStyle = mat.outline;
      ctx.lineWidth = 2.2;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = mapId === 'urban' ? '#FACC15' : '#38BDF8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(s.x + 5, s.y + 5);
      ctx.lineTo(s.x + s.w - 5, s.y + s.h - 5);
      ctx.moveTo(s.x + s.w - 5, s.y + 5);
      ctx.lineTo(s.x + 5, s.y + s.h - 5);
      ctx.stroke();
    }
  }

  private drawPickup(ctx: CanvasRenderingContext2D, p: PickupEntity): void {
    const y = p.y + Math.sin(p.bobPhase) * 2.5;
    ctx.save();
    ctx.translate(p.x, y);

    if (p.kind === 'medkit') {
      // Curved field medical pouch with cross badge (just like reference image!)
      ctx.fillStyle = '#E7E5E4';
      ctx.strokeStyle = '#1C1917';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-12, -8, 24, 16, 5);
      ctx.fill();
      ctx.stroke();
      // Olive strap
      ctx.fillStyle = '#4D7C0F';
      ctx.fillRect(-12, -8, 24, 4);
      // Cross
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-2, -2, 4, 8);
      ctx.fillRect(-4, 0, 8, 4);
    } else if (p.kind === 'armor') {
      // Ballistic vest pickup
      ctx.fillStyle = '#2563EB';
      ctx.strokeStyle = '#0D1117';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -10);
      ctx.lineTo(9, -10);
      ctx.lineTo(11, 8);
      ctx.lineTo(-11, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.kind === 'ammo') {
      // Olive military ammo box + brass rounds
      ctx.fillStyle = '#3F6212';
      ctx.strokeStyle = '#14191F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-12, -8, 24, 16, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-7, -4, 3, 8);
      ctx.fillRect(-1.5, -4, 3, 8);
      ctx.fillRect(4, -4, 3, 8);
    } else if (p.kind === 'grenade') {
      // Pineapple grenade pack
      ctx.fillStyle = '#4D7C0F';
      ctx.strokeStyle = '#1A2E05';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-4, 0, 5.5, 7, 0, 0, Math.PI * 2);
      ctx.ellipse(5, 1, 5.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Realistic weapon lying on the battlefield with interactive click-to-equip ring
      const wId = p.kind.replace('weapon_', '') as WeaponId;
      ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 2, 26, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(-14, 2);
      this.drawWeaponSprite(ctx, wId, false, '#4D6B4A', '#E5B58B', p.bobPhase, false);
      ctx.restore();
    }

    // Crisp compact pickup label
    const isWeaponPickup = p.kind.startsWith('weapon_');
    const label =
      p.kind === 'medkit'
        ? '+HP'
        : p.kind === 'armor'
          ? '+ARMOR'
          : p.kind === 'ammo'
            ? 'AMMO'
            : p.kind === 'grenade'
              ? 'FRAG'
              : `CLICK: ${p.kind.replace('weapon_', '').toUpperCase()}`;
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#0D1117';
    ctx.lineWidth = 2.6;
    ctx.strokeText(label, 0, 20);
    ctx.fillStyle = isWeaponPickup ? '#FDE047' : '#F8FAFC';
    ctx.fillText(label, 0, 20);

    ctx.restore();
  }

  private drawTelegraph(ctx: CanvasRenderingContext2D, s: SoldierEntity): void {
    const sx = s.x + s.w / 2;
    const sy = s.y + s.h * 0.36;
    ctx.save();
    ctx.strokeStyle =
      s.botArchetype === 'sniper'
        ? 'rgba(239, 68, 68, 0.72)'
        : 'rgba(245, 158, 11, 0.55)';
    ctx.lineWidth = s.botArchetype === 'sniper' ? 2 : 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(
      sx + Math.cos(s.aimAngle) * 560,
      sy + Math.sin(s.aimAngle) * 560,
    );
    ctx.stroke();
    ctx.restore();
  }

  private drawSoldier(
    ctx: CanvasRenderingContext2D,
    s: SoldierEntity,
    isFocused: boolean,
    tourMode: boolean,
  ): void {
    const pal = ARMOR_PALETTES[s.armorColor] ?? ARMOR_PALETTES.olive;
    const skin = SKIN_TONES[s.skinTone ?? 'tan'] ?? SKIN_TONES.tan;
    const jpStyle = JETPACK_STYLES[s.jetpackStyle ?? 'amber'] ?? JETPACK_STYLES.amber;
    const eyewear = s.eyewear ?? 'visor';
    const cx = s.x + s.w / 2;
    const footY = s.y + s.h;
    const koProgress = s.alive ? 0 : 1 - Math.max(0, s.koTimer / 0.45);

    ctx.save();
    ctx.translate(cx, footY);

    if (!s.alive) {
      ctx.globalAlpha = Math.max(0, 1 - koProgress);
      ctx.rotate(s.facing * koProgress * 1.45);
    } else {
      if (s.invulnTimer > 0 && Math.floor(s.invulnTimer * 14) % 2 === 0) {
        ctx.globalAlpha = 0.65;
      }
      // Dynamic flight tilt like the airborne soldier in the Mini Militia reference!
      if (!s.grounded) {
        const flightTilt = Math.max(-0.42, Math.min(0.42, s.vx * 0.0011));
        ctx.rotate(flightTilt);
      }
    }

    ctx.scale(s.squashX, s.squashY);

    const flash = false;
    const outline = s.hitFlashTimer > 0 ? '#DC2626' : '#141413';
    const bodyH = s.crouching ? 19 : 25;
    const legH = s.crouching ? 8 : 13;
    const stride = s.grounded ? Math.sin(s.walkPhase) * 6.5 : s.vy < 0 ? 4 : -3;

    // 1. Dual-Nozzle Jetpack unit on back + Twin Flame Cones (like reference image!)
    const jpX = -s.facing * 12.5 - 4.5;
    const jpY = -legH - bodyH + 4;
    if (s.alive && s.jetpackActive) {
      const flameH = 13 + Math.random() * 9;
      // Twin thruster nozzles
      for (const offsetNozzle of [1.5, 6.5]) {
        ctx.fillStyle = jpStyle.outer;
        ctx.beginPath();
        ctx.moveTo(jpX + offsetNozzle - 2, jpY + 19);
        ctx.lineTo(jpX + offsetNozzle, jpY + 19 + flameH);
        ctx.lineTo(jpX + offsetNozzle + 2, jpY + 19);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = jpStyle.core;
        ctx.beginPath();
        ctx.moveTo(jpX + offsetNozzle - 1, jpY + 19);
        ctx.lineTo(jpX + offsetNozzle, jpY + 19 + flameH * 0.58);
        ctx.lineTo(jpX + offsetNozzle + 1, jpY + 19);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.fillStyle = flash ? '#FFFFFF' : '#3F3F46';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(jpX, jpY, 9.5, 19, 3);
    ctx.fill();
    ctx.stroke();

    // 2. Articulated Legs & Combat Boots
    const leftFootX = -4.2 + stride;
    const rightFootX = 4.2 - stride;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 6.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4.2, -legH);
    ctx.lineTo(leftFootX, -3);
    ctx.moveTo(4.2, -legH);
    ctx.lineTo(rightFootX, -3);
    ctx.stroke();

    ctx.strokeStyle = flash ? '#FFFFFF' : pal.secondary;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(-4.2, -legH);
    ctx.lineTo(leftFootX, -3);
    ctx.moveTo(4.2, -legH);
    ctx.lineTo(rightFootX, -3);
    ctx.stroke();

    // Heavy laced combat boots
    if (!flash) {
      ctx.fillStyle = '#18181B';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(leftFootX - 3.5, -5, 8, 5, 2);
      ctx.roundRect(rightFootX - 3.5, -5, 8, 5, 2);
      ctx.fill();
      ctx.stroke();
    }

    // 3. Contoured Tactical Vest, Harness Straps & Belt
    ctx.fillStyle = flash ? '#FFFFFF' : pal.primary;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-10.5, -legH - bodyH, 21, bodyH, 5.5);
    ctx.fill();
    ctx.stroke();

    if (!flash) {
      ctx.fillStyle = pal.secondary;
      ctx.beginPath();
      ctx.roundRect(-7.5, -legH - bodyH + 4, 15, bodyH - 8, 3);
      ctx.fill();

      // Chest rig pouches & utility belt
      ctx.fillStyle = '#18181B';
      const pouchY = -legH - 9;
      ctx.fillRect(-7, pouchY, 4, 5);
      ctx.fillRect(-2, pouchY, 4, 5);
      ctx.fillRect(3, pouchY, 4, 5);
      ctx.fillRect(-10, -legH - 3.5, 20, 3.5);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(-2, -legH - 3.2, 4, 2.8);
    }

    // 4. Expressive Doodle-Military Head (Proportions & facial details matching reference)
    const headY = -legH - bodyH - 11.5;

    // Bandana fluttering knot tails behind head
    if (s.helmet === 'bandana' && !flash) {
      const wave = Math.sin(s.walkPhase * 1.5 + s.vx * 0.02) * 2.5;
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-s.facing * 10, headY - 4);
      ctx.lineTo(-s.facing * 18, headY - 2 + wave);
      ctx.moveTo(-s.facing * 10, headY - 2);
      ctx.lineTo(-s.facing * 16, headY + 3 + wave * 0.7);
      ctx.stroke();
    }

    // Head circle with skin tone
    ctx.fillStyle = flash ? '#FFFFFF' : skin.fill;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, headY, 11.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stubble jaw shade + expressive battle grin/mouth + ear detail
    if (!flash && s.helmet !== 'heavy' && s.helmet !== 'recon') {
      // Stubble beard shade along lower jaw (like the reference soldier!)
      ctx.fillStyle = 'rgba(68, 64, 60, 0.35)';
      ctx.beginPath();
      ctx.arc(0, headY + 1, 10.2, 0.15, Math.PI - 0.15);
      ctx.fill();

      // Determined mouth / battle grin
      ctx.fillStyle = '#1C1917';
      ctx.fillRect(s.facing > 0 ? 2 : -7, headY + 4.2, 5, 2.2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(s.facing > 0 ? 2.5 : -6.5, headY + 4.4, 3.8, 1);
    }

    // Eyewear / Eyes layer
    if (!flash) {
      const eyeBaseX = s.facing > 0 ? 1.2 : -9.2;
      if (eyewear === 'aviators') {
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(eyeBaseX, headY - 4, 8.6, 4.8, 1.5);
        ctx.fill();
        ctx.stroke();
      } else if (eyewear === 'nvg') {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(eyeBaseX - 0.5, headY - 4.5, 9.2, 5.2);
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.arc(eyeBaseX + 2.2, headY - 1.8, 1.9, 0, Math.PI * 2);
        ctx.arc(eyeBaseX + 6.4, headY - 1.8, 1.9, 0, Math.PI * 2);
        ctx.fill();
      } else if (eyewear === 'goggles') {
        ctx.fillStyle = '#F59E0B';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(eyeBaseX - 0.5, headY - 4.2, 9, 5, 2);
        ctx.fill();
        ctx.stroke();
      } else if (eyewear === 'eyepatch') {
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-9, headY - 4.5);
        ctx.lineTo(9, headY - 1);
        ctx.stroke();
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(s.facing > 0 ? 4 : -4, headY - 1.8, 2.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (eyewear === 'none') {
        // Expressive cartoon eyes + fierce brow
        const ex = s.facing > 0 ? 3.5 : -6.5;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(ex + 1.5, headY - 1.8, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(ex + (s.facing > 0 ? 2.2 : 0.8), headY - 1.8, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(ex - 1, headY - 4.8);
        ctx.lineTo(ex + 4.5, headY - 3.6);
        ctx.stroke();
      } else {
        // Tactical visor
        ctx.fillStyle = pal.visor;
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.roundRect(eyeBaseX, headY - 4, 8.5, 4.8, 1.5);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Headgear geometry by style
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    if (s.helmet === 'commando') {
      ctx.fillStyle = flash ? '#FFFFFF' : '#991B1B';
      ctx.beginPath();
      ctx.ellipse(s.facing * -1.5, headY - 7.5, 12, 5.8, -0.16 * s.facing, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (!flash) {
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(s.facing * 4.5, headY - 7.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (s.helmet === 'bandana') {
      // Spiky hair tuft above bandana + red headband
      if (!flash) {
        ctx.fillStyle = '#1C1917';
        ctx.beginPath();
        ctx.arc(0, headY - 3, 10.8, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillStyle = flash ? '#FFFFFF' : '#DC2626';
      ctx.beginPath();
      ctx.roundRect(-11, headY - 8.2, 22, 5, 2);
      ctx.fill();
      ctx.stroke();
    } else if (s.helmet === 'officer') {
      ctx.fillStyle = flash ? '#FFFFFF' : pal.secondary;
      ctx.beginPath();
      ctx.roundRect(-11, headY - 12, 22, 8, 2.5);
      ctx.fill();
      ctx.stroke();
      if (!flash) {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(s.facing > 0 ? 0 : -14, headY - 5, 14, 3);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(-10, headY - 6, 20, 1.8);
      }
    } else if (s.helmet === 'heavy') {
      ctx.fillStyle = flash ? '#FFFFFF' : pal.secondary;
      ctx.beginPath();
      ctx.roundRect(-11.8, headY - 12, 23.6, 16, 4);
      ctx.fill();
      ctx.stroke();
      if (!flash) {
        ctx.fillStyle = pal.visor;
        ctx.fillRect(s.facing > 0 ? 0 : -8.5, headY - 4, 8.5, 3.8);
      }
    } else if (s.helmet === 'recon') {
      ctx.fillStyle = flash ? '#FFFFFF' : pal.secondary;
      ctx.beginPath();
      ctx.roundRect(-11.2, headY - 11.5, 22.4, 14.5, 6);
      ctx.fill();
      ctx.stroke();
      if (!flash) {
        ctx.fillStyle = pal.visor;
        ctx.beginPath();
        ctx.roundRect(s.facing > 0 ? -1 : -9, headY - 4.8, 10, 5.8, 2);
        ctx.fill();
      }
    } else {
      // Tactical Ops-Core FAST helmet
      ctx.fillStyle = flash ? '#FFFFFF' : pal.secondary;
      ctx.beginPath();
      ctx.arc(0, headY - 2.2, 11.5, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (!flash) {
        ctx.fillStyle = pal.accent;
        ctx.fillRect(-5.5, headY - 8.2, 11, 2.5);
      }
    }

    // 5. Realistic Detailed Weapon + Articulated Two-Handed Grip rotated 360° around shoulder
    const shoulderY = -legH - bodyH + 8.5;
    ctx.save();
    ctx.translate(0, shoulderY);
    ctx.rotate(s.aimAngle);
    const flipY = Math.cos(s.aimAngle) < 0 ? -1 : 1;
    ctx.scale(1, flipY);

    const wId = s.slots[s.activeSlot].weaponId;

    if (s.meleeAnimTimer > 0) {
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.arc(16, 0, 22, -0.85, 0.85);
      ctx.stroke();
    }

    this.drawWeaponSprite(ctx, wId, flash, pal.primary, skin.fill, worldElapsed(s), true);

    ctx.restore();
    ctx.restore();

    // Name & overhead HP bar (hidden in title tour mode)
    if (s.alive && !tourMode) {
      const topY = s.y - 20;
      ctx.save();
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(13,17,23,0.92)';
      ctx.lineWidth = 3;
      ctx.strokeText(s.name, cx, topY - 8);
      ctx.fillStyle = isFocused
        ? '#FACC15'
        : s.team === 'alpha'
          ? '#60A5FA'
          : s.team === 'bravo'
            ? '#F87171'
            : '#F8FAFC';
      ctx.fillText(s.name, cx, topY - 8);

      // Compact HP bar
      const barW = 34;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(cx - barW / 2, topY - 4, barW, 4);
      const hpPct = Math.max(0, s.hp / s.maxHp);
      ctx.fillStyle = hpPct > 0.5 ? '#22C55E' : hpPct > 0.25 ? '#F59E0B' : '#EF4444';
      ctx.fillRect(cx - barW / 2, topY - 4, barW * hpPct, 4);

      if (s.reloadTimer > 0) {
        const pct = 1 - s.reloadTimer / Math.max(0.1, s.reloadDuration);
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, topY - 22, 6, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawWeaponSprite(
    ctx: CanvasRenderingContext2D,
    wId: WeaponId,
    flash: boolean,
    sleeveColor: string,
    skinColor: string,
    spinSeed: number,
    withHands = true,
  ): void {
    const outline = '#0D1117';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.7;

    if (wId === 'rifle') {
      // Detailed M4A1 Carbine (like the top-right HUD gun in the reference image!)
      // Collapsible stock
      ctx.fillStyle = flash ? '#FFFFFF' : '#18181B';
      ctx.beginPath();
      ctx.moveTo(-6, -3);
      ctx.lineTo(4, -3);
      ctx.lineTo(4, 2);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Receiver + carry handle + ribbed handguard
      ctx.fillStyle = flash ? '#FFFFFF' : '#27272A';
      ctx.fillRect(4, -4.5, 15, 6.5);
      ctx.strokeRect(4, -4.5, 15, 6.5);
      ctx.fillRect(19, -3.8, 10, 5);
      ctx.strokeRect(19, -3.8, 10, 5);
      // Carry handle sight
      ctx.fillRect(6, -7, 10, 2.5);
      // Barrel + triangular front sight post + flash hider
      ctx.fillStyle = flash ? '#FFFFFF' : '#3F3F46';
      ctx.fillRect(29, -2.5, 9, 2.4);
      ctx.beginPath();
      ctx.moveTo(31, -2.5);
      ctx.lineTo(33, -6.5);
      ctx.lineTo(34.5, -2.5);
      ctx.closePath();
      ctx.fill();
      // Curved magazine + pistol grip
      ctx.fillStyle = flash ? '#FFFFFF' : '#18181B';
      ctx.fillRect(5, 2, 3.5, 6);
      ctx.beginPath();
      ctx.moveTo(13, 2);
      ctx.lineTo(16, 10);
      ctx.lineTo(12, 10.5);
      ctx.lineTo(10, 2);
      ctx.closePath();
      ctx.fill();
    } else if (wId === 'ak47') {
      // Detailed AK-47 with warm wood stock, wood handguard, steel receiver & banana mag
      ctx.fillStyle = flash ? '#FFFFFF' : '#9A3412';
      ctx.beginPath();
      ctx.moveTo(-6, -2.5);
      ctx.lineTo(5, -3.5);
      ctx.lineTo(5, 1.5);
      ctx.lineTo(-6, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = flash ? '#FFFFFF' : '#27272A';
      ctx.fillRect(5, -4.2, 15, 6);
      ctx.strokeRect(5, -4.2, 15, 6);

      ctx.fillStyle = flash ? '#FFFFFF' : '#B45309';
      ctx.fillRect(20, -3.8, 9, 4.8);
      ctx.strokeRect(20, -3.8, 9, 4.8);

      ctx.fillStyle = flash ? '#FFFFFF' : '#18181B';
      ctx.fillRect(29, -2.6, 9, 2.4);
      // Front sight triangle
      ctx.fillRect(35, -5.5, 2, 3);
      // Orange-brown curved Bakelite mag
      ctx.fillStyle = flash ? '#FFFFFF' : '#C2410C';
      ctx.beginPath();
      ctx.moveTo(13, 1.8);
      ctx.lineTo(18.5, 10.5);
      ctx.lineTo(14.5, 11.2);
      ctx.lineTo(9.5, 1.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (wId === 'rocket') {
      // SMAW / RPG Rocket Launcher (matching the olive-brown scoped launcher in the reference image!)
      ctx.fillStyle = flash ? '#FFFFFF' : '#786848';
      ctx.beginPath();
      ctx.roundRect(-10, -5, 42, 7.5, 2);
      ctx.fill();
      ctx.stroke();
      // Flared rear backblast cone
      ctx.fillStyle = flash ? '#FFFFFF' : '#574B32';
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-16, -7.5);
      ctx.lineTo(-16, 5);
      ctx.lineTo(-10, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Black reinforcing bands, optic scope & dual grips
      ctx.fillStyle = '#18181B';
      ctx.fillRect(4, -5.5, 4, 8.5);
      ctx.fillRect(20, -5.5, 4, 8.5);
      ctx.fillRect(10, -9, 10, 3.5);
      ctx.fillRect(8, 2.5, 4.5, 7);
      ctx.fillRect(21, 2.5, 4, 6);
      // Loaded warhead tip
      ctx.fillStyle = flash ? '#FFFFFF' : '#4D6B4A';
      ctx.beginPath();
      ctx.moveTo(32, -4.5);
      ctx.lineTo(41, -1.2);
      ctx.lineTo(32, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (wId === 'sawgun') {
      // Machete Saw Cutter with spinning toothed blade at muzzle
      ctx.fillStyle = flash ? '#FFFFFF' : '#CA8A04';
      ctx.beginPath();
      ctx.roundRect(2, -4.5, 24, 7.5, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#18181B';
      ctx.fillRect(8, -2.5, 12, 3);
      ctx.save();
      ctx.translate(31, -1);
      ctx.rotate(spinSeed * 8);
      ctx.fillStyle = flash ? '#FFFFFF' : '#E2E8F0';
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (wId === 'uzi') {
      ctx.fillStyle = flash ? '#FFFFFF' : '#27272A';
      ctx.beginPath();
      ctx.roundRect(5, -4.5, 16, 6.5, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = flash ? '#FFFFFF' : '#52525B';
      ctx.fillRect(21, -3, 6, 3);
      ctx.fillStyle = '#18181B';
      ctx.fillRect(10, 2, 4, 8.5);
    } else if (wId === 'gl') {
      ctx.fillStyle = flash ? '#FFFFFF' : '#3F3F46';
      ctx.fillRect(0, -3.5, 10, 5.5);
      ctx.fillStyle = flash ? '#FFFFFF' : '#52525B';
      ctx.beginPath();
      ctx.roundRect(9, -6, 13, 10, 2.5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#18181B';
      ctx.fillRect(22, -4.5, 12, 6);
    } else if (wId === 'sniper') {
      ctx.fillStyle = flash ? '#FFFFFF' : '#27272A';
      ctx.beginPath();
      ctx.roundRect(-4, -3.5, 28, 6, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#52525B';
      ctx.fillRect(24, -2.2, 20, 2.8);
      ctx.fillStyle = '#18181B';
      ctx.fillRect(42, -3.5, 4.5, 5.2);
      ctx.fillRect(6, -8, 15, 3.5);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(19, -7.5, 2.5, 2.6);
    } else if (wId === 'lmg') {
      ctx.fillStyle = flash ? '#FFFFFF' : '#27272A';
      ctx.beginPath();
      ctx.roundRect(0, -4.5, 28, 7.5, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#52525B';
      ctx.fillRect(28, -3, 11, 4);
      ctx.fillStyle = '#15803D';
      ctx.fillRect(11, 2.5, 9, 8);
      ctx.strokeRect(11, 2.5, 9, 8);
    } else if (wId === 'shotgun') {
      ctx.fillStyle = flash ? '#FFFFFF' : '#27272A';
      ctx.beginPath();
      ctx.roundRect(0, -4, 31, 5.5, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350F';
      ctx.fillRect(12, 1.5, 14, 3.5);
    } else {
      const weapon = WEAPONS[wId] ?? WEAPONS.rifle;
      const gunLen = weapon.muzzleLength;
      ctx.fillStyle = flash ? '#FFFFFF' : '#27272A';
      ctx.beginPath();
      ctx.roundRect(3, -4, gunLen - 3, 6, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = wId === 'tavor' ? '#34D399' : '#52525B';
      ctx.fillRect(9, -2.2, gunLen - 11, 2.2);
      if (wId !== 'pistol') {
        ctx.fillStyle = '#18181B';
        ctx.fillRect(12, 2, 4, 6.5);
      }
    }

    if (withHands && !flash) {
      // Front support hand + rear trigger hand & armored sleeve
      ctx.fillStyle = skinColor;
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(19, 1.5, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = sleeveColor;
      ctx.beginPath();
      ctx.roundRect(-2, -3, 8, 5.5, 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(7.5, 0.8, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

function worldElapsed(s: SoldierEntity): number {
  return s.walkPhase + s.x * 0.01;
}

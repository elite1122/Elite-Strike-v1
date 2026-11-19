import { MAPS } from './maps';
import {
  ArenaMap,
  ArmorColorId,
  BotArchetype,
  DestructibleEntity,
  EyewearStyle,
  GameModeId,
  HelmetStyle,
  JetpackStyleId,
  MapId,
  MapMechanicSnapshot,
  MatchWorld,
  PickupEntity,
  PlayerInputState,
  PlayerProfile,
  Rect,
  SkinToneId,
  SoldierEntity,
  TeamId,
  WeaponId,
} from './types';
import { GRENADE_STATS, MELEE_STATS, WEAPONS } from './weapons';
import { getWeatherStateForMap } from './weather';

const GRAVITY = 1080;
const MAX_FALL_SPEED = 680;
const RUN_SPEED = 215;
const CROUCH_SPEED = 118;
const GROUND_ACCEL = 1550;
const AIR_ACCEL = 980;
const GROUND_FRICTION = 1850;
const JUMP_VELOCITY = -465;
const JETPACK_THRUST = 1680;
const MAX_JETPACK_UP_SPEED = -315;
const STAND_W = 28;
const STAND_H = 48;
const CROUCH_H = 32;

export function emptyInput(aimAngle = 0): PlayerInputState {
  return {
    moveX: 0,
    jumpHeld: false,
    jumpPressed: false,
    jetpackHeld: false,
    crouchHeld: false,
    aimAngle,
    fireHeld: false,
    firePressed: false,
    reloadPressed: false,
    grenadePressed: false,
    meleePressed: false,
    switchSlotPressed: null,
    pickupPressed: false,
    pickupTargetId: null,
  };
}

export function createSoldier(opts: {
  id: string;
  name: string;
  team: TeamId;
  isBot: boolean;
  botArchetype?: BotArchetype;
  helmet: HelmetStyle;
  eyewear?: EyewearStyle;
  skinTone?: SkinToneId;
  jetpackStyle?: JetpackStyleId;
  armorColor: ArmorColorId;
  primaryWeapon: WeaponId;
  secondaryWeapon: WeaponId;
  map: ArenaMap;
  existingSoldiers?: SoldierEntity[];
  livesRemaining?: number;
}): SoldierEntity {
  const spawn = pickBestSpawn(opts.map, opts.team, opts.existingSoldiers ?? []);
  const pDef = WEAPONS[opts.primaryWeapon] ?? WEAPONS.rifle;
  const sDef = WEAPONS[opts.secondaryWeapon] ?? WEAPONS.pistol;
  return {
    id: opts.id,
    name: opts.name,
    team: opts.team,
    isBot: opts.isBot,
    botArchetype: opts.botArchetype,
    helmet: opts.helmet,
    eyewear: opts.eyewear ?? 'visor',
    skinTone: opts.skinTone ?? 'tan',
    jetpackStyle: opts.jetpackStyle ?? 'amber',
    armorColor: opts.armorColor,
    x: spawn.x - STAND_W / 2,
    y: spawn.y - STAND_H,
    vx: 0,
    vy: 0,
    w: STAND_W,
    h: STAND_H,
    facing: spawn.x > opts.map.width / 2 ? -1 : 1,
    aimAngle: spawn.x > opts.map.width / 2 ? Math.PI : 0,
    grounded: false,
    crouching: false,
    dropThroughTimer: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    jetpackActive: false,
    fuel: 100,
    fuelRegenDelay: 0,
    hp: 100,
    maxHp: 100,
    armor: 50,
    maxArmor: 50,
    slots: [
      { weaponId: pDef.id, mag: pDef.magSize, reserve: 999 },
      { weaponId: sDef.id, mag: sDef.magSize, reserve: 999 },
    ],
    activeSlot: 0,
    fireCooldown: 0,
    reloadTimer: 0,
    reloadDuration: pDef.reloadMs / 1000,
    grenades: 999,
    meleeCooldown: 0,
    meleeAnimTimer: 0,
    hitFlashTimer: 0,
    invulnTimer: 1.5,
    squashX: 1,
    squashY: 1,
    walkPhase: 0,
    alive: true,
    koTimer: 0,
    respawnTimer: 0,
    kills: 0,
    deaths: 0,
    damageDealt: 0,
    livesRemaining: opts.livesRemaining ?? 99,
    lastHitBy: null,
    lastHitWeapon: null,
    telegraphTimer: 0,
    telegraphAngle: 0,
    aiMoveDir: 1,
    aiDecisionTimer: 0,
    aiJumpTimer: 0,
  };
}

export function pickBestSpawn(
  map: ArenaMap,
  team: TeamId,
  existing: SoldierEntity[],
): { x: number; y: number } {
  const preferred = map.spawns.filter((s) => s.team === team);
  const candidates = preferred.length > 0 ? preferred : map.spawns;
  const aliveEnemies = existing.filter(
    (s) => s.alive && (team === 'ffa' || s.team !== team),
  );
  if (aliveEnemies.length === 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  let best = candidates[0];
  let bestMinDist = -1;
  for (const sp of candidates) {
    let minDist = Infinity;
    for (const enemy of aliveEnemies) {
      const dx = enemy.x - sp.x;
      const dy = enemy.y - sp.y;
      const d = dx * dx + dy * dy;
      if (d < minDist) minDist = d;
    }
    if (minDist > bestMinDist) {
      bestMinDist = minDist;
      best = sp;
    }
  }
  return best;
}

export function applyProfileToSoldier(
  soldier: SoldierEntity,
  profile: PlayerProfile,
): void {
  soldier.name = profile.callsign.trim() || 'Striker-01';
  soldier.helmet = profile.helmet;
  soldier.eyewear = profile.eyewear ?? 'visor';
  soldier.skinTone = profile.skinTone ?? 'tan';
  soldier.jetpackStyle = profile.jetpackStyle ?? 'amber';
  soldier.armorColor = profile.armorColor;

  const pDef = WEAPONS[profile.primaryWeapon] ?? WEAPONS.rifle;
  const sDef = WEAPONS[profile.secondaryWeapon] ?? WEAPONS.pistol;

  if (soldier.slots[0].weaponId !== pDef.id) {
    soldier.slots[0] = {
      weaponId: pDef.id,
      mag: pDef.magSize,
      reserve: 999,
    };
    soldier.reloadTimer = 0;
  }
  if (soldier.slots[1].weaponId !== sDef.id) {
    soldier.slots[1] = {
      weaponId: sDef.id,
      mag: sDef.magSize,
      reserve: 999,
    };
    soldier.reloadTimer = 0;
  }
}

export function createMatchWorld(opts: {
  mode: GameModeId;
  mapId: MapId;
  playerConfig: {
    id: string;
    name: string;
    helmet: HelmetStyle;
    eyewear?: EyewearStyle;
    skinTone?: SkinToneId;
    jetpackStyle?: JetpackStyleId;
    armorColor: ArmorColorId;
    primaryWeapon: WeaponId;
    secondaryWeapon: WeaponId;
  };
  botCount?: number;
}): MatchWorld {
  const map = MAPS[opts.mapId];
  const world: MatchWorld = {
    mode: opts.mode,
    mapId: opts.mapId,
    elapsed: 0,
    timeLimit: opts.mode === 'training' ? 9999 : opts.mode === 'tdm' ? 210 : 180,
    targetKills: opts.mode === 'tdm' ? 20 : opts.mode === 'deathmatch' ? 12 : 999,
    wave: 1,
    waveClearTimer: 0,
    status: 'playing',
    winnerTeam: null,
    winnerName: null,
    soldiers: [],
    bullets: [],
    grenades: [],
    pickups: map.pickups.map((p, idx) => ({
      id: idx + 1,
      kind: p.kind,
      x: p.x,
      y: p.y,
      active: true,
      respawnTimer: 0,
      bobPhase: idx * 0.9,
    })),
    destructibles: (map.destructibles ?? []).map((d) => ({
      ...d,
      hp: d.maxHp,
      active: true,
      respawnTimer: 0,
      hitFlashTimer: 0,
    })),
    hangarVaultOpen: false,
    hangarVaultTimer: 0,
    killFeed: [],
    events: [],
    hitstopTimer: 0,
    cameraTrauma: 0,
    nextEntityId: 100,
    attackTokenCooldown: 0,
    weather: getWeatherStateForMap(opts.mapId, 0),
  };
  world.mapMechanic = computeMapMechanicSnapshot(world);

  const playerTeam: TeamId =
    opts.mode === 'tdm' || opts.mode === 'survival' ? 'alpha' : 'ffa';

  const human = createSoldier({
    ...opts.playerConfig,
    team: playerTeam,
    isBot: false,
    map,
    existingSoldiers: world.soldiers,
    livesRemaining: opts.mode === 'survival' ? 3 : 99,
  });
  world.soldiers.push(human);

  if (opts.mode === 'training') {
    const trainingBots: {
      name: string;
      arch: BotArchetype;
      helmet: HelmetStyle;
      eyewear: EyewearStyle;
      skin: SkinToneId;
      jet: JetpackStyleId;
      color: ArmorColorId;
      w: WeaponId;
    }[] = [
      {
        name: 'Range Dummy A',
        arch: 'dummy',
        helmet: 'tactical',
        eyewear: 'goggles',
        skin: 'light',
        jet: 'amber',
        color: 'sand',
        w: 'pistol',
      },
      {
        name: 'Strafe Bot B',
        arch: 'assault',
        helmet: 'bandana',
        eyewear: 'aviators',
        skin: 'tan',
        jet: 'ion',
        color: 'graphite',
        w: 'ak47',
      },
      {
        name: 'Jetpack Scout C',
        arch: 'flanker',
        helmet: 'recon',
        eyewear: 'nvg',
        skin: 'bronze',
        jet: 'emerald',
        color: 'crimson',
        w: 'uzi',
      },
    ];
    trainingBots.forEach((b, i) => {
      world.soldiers.push(
        createSoldier({
          id: `bot-${i + 1}`,
          name: b.name,
          team: 'ffa',
          isBot: true,
          botArchetype: b.arch,
          helmet: b.helmet,
          eyewear: b.eyewear,
          skinTone: b.skin,
          jetpackStyle: b.jet,
          armorColor: b.color,
          primaryWeapon: b.w,
          secondaryWeapon: 'pistol',
          map,
          existingSoldiers: world.soldiers,
        }),
      );
    });
  } else if (opts.mode === 'survival') {
    spawnSurvivalWave(world, 1);
  } else {
    const count = opts.botCount ?? (opts.mode === 'tdm' ? 5 : 4);
    const botRoster: {
      name: string;
      arch: BotArchetype;
      helmet: HelmetStyle;
      eyewear: EyewearStyle;
      skin: SkinToneId;
      jet: JetpackStyleId;
      color: ArmorColorId;
      w: WeaponId;
    }[] = [
      {
        name: 'Sgt. Kestrel',
        arch: 'assault',
        helmet: 'bandana',
        eyewear: 'aviators',
        skin: 'tan',
        jet: 'amber',
        color: 'tiger',
        w: 'ak47',
      },
      {
        name: 'Viper-Zero',
        arch: 'flanker',
        helmet: 'recon',
        eyewear: 'nvg',
        skin: 'light',
        jet: 'ion',
        color: 'graphite',
        w: 'uzi',
      },
      {
        name: 'Ironclad',
        arch: 'heavy',
        helmet: 'heavy',
        eyewear: 'goggles',
        skin: 'deep',
        jet: 'crimson',
        color: 'olive',
        w: 'lmg',
      },
      {
        name: 'Hawkeye-7',
        arch: 'sniper',
        helmet: 'officer',
        eyewear: 'eyepatch',
        skin: 'bronze',
        jet: 'emerald',
        color: 'sand',
        w: 'sniper',
      },
      {
        name: 'Ghost-Fox',
        arch: 'assault',
        helmet: 'commando',
        eyewear: 'visor',
        skin: 'tan',
        jet: 'ion',
        color: 'cobalt',
        w: 'sawgun',
      },
      {
        name: 'Bravo-Lead',
        arch: 'flanker',
        helmet: 'tactical',
        eyewear: 'aviators',
        skin: 'light',
        jet: 'amber',
        color: 'crimson',
        w: 'tavor',
      },
    ];
    for (let i = 0; i < count; i++) {
      const tpl = botRoster[i % botRoster.length];
      const team: TeamId =
        opts.mode === 'tdm' ? (i % 2 === 0 ? 'bravo' : 'alpha') : 'ffa';
      world.soldiers.push(
        createSoldier({
          id: `bot-${i + 1}`,
          name: tpl.name,
          team,
          isBot: true,
          botArchetype: tpl.arch,
          helmet: tpl.helmet,
          eyewear: tpl.eyewear,
          skinTone: tpl.skin,
          jetpackStyle: tpl.jet,
          armorColor:
            team === 'alpha' ? 'cobalt' : team === 'bravo' ? 'crimson' : tpl.color,
          primaryWeapon: tpl.w,
          secondaryWeapon: 'pistol',
          map,
          existingSoldiers: world.soldiers,
        }),
      );
    }
  }

  return world;
}

export function spawnSurvivalWave(world: MatchWorld, wave: number): void {
  const map = MAPS[world.mapId];
  const waveSize = Math.min(2 + wave, 7);
  const archetypes: BotArchetype[] = ['assault', 'flanker', 'heavy', 'sniper'];
  const weapons: WeaponId[] = ['rifle', 'smg', 'lmg', 'sniper'];
  const helmets: HelmetStyle[] = ['tactical', 'recon', 'heavy', 'commando'];

  // Remove defeated wave bots
  world.soldiers = world.soldiers.filter((s) => !s.isBot);

  for (let i = 0; i < waveSize; i++) {
    const idx = (i + wave - 1) % archetypes.length;
    const arch = archetypes[idx];
    const bot = createSoldier({
      id: `wave-${wave}-bot-${i}`,
      name: `Raider W${wave}-${i + 1}`,
      team: 'bravo',
      isBot: true,
      botArchetype: arch,
      helmet: helmets[idx],
      armorColor: 'crimson',
      primaryWeapon: weapons[idx],
      secondaryWeapon: 'pistol',
      map,
      existingSoldiers: world.soldiers,
      livesRemaining: 1,
    });
    bot.maxHp = 75 + wave * 12;
    bot.hp = bot.maxHp;
    bot.armor = wave >= 2 ? 35 : 0;
    world.soldiers.push(bot);
  }
}

export function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: { x: number; y: number; w: number; h: number },
): { hit: boolean; t: number; x: number; y: number } {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const checks = [
    [-dx, x1 - r.x],
    [dx, r.x + r.w - x1],
    [-dy, y1 - r.y],
    [dy, r.y + r.h - y1],
  ];
  for (const [p, q] of checks) {
    if (Math.abs(p) < 1e-8) {
      if (q < 0) return { hit: false, t: 1, x: x2, y: y2 };
    } else {
      const ratio = q / p;
      if (p < 0) {
        if (ratio > t1) return { hit: false, t: 1, x: x2, y: y2 };
        if (ratio > t0) t0 = ratio;
      } else {
        if (ratio < t0) return { hit: false, t: 1, x: x2, y: y2 };
        if (ratio < t1) t1 = ratio;
      }
    }
  }
  return {
    hit: true,
    t: t0,
    x: x1 + dx * t0,
    y: y1 + dy * t0,
  };
}

export function getDesertSandstormState(elapsedSec: number): {
  active: boolean;
  intensity: number;
  nextInSec: number;
} {
  // Periodic 120s (2-minute) sandstorm cycle; storm strikes from 90s..120s of each 120s cycle
  const period = 120;
  const phase = ((elapsedSec % period) + period) % period;
  if (phase >= 90) {
    const stormProgress = phase - 90; // 0..30s
    let intensity = 1;
    if (stormProgress < 4) intensity = stormProgress / 4;
    else if (stormProgress > 26) intensity = Math.max(0, (30 - stormProgress) / 4);
    return {
      active: true,
      intensity: Math.max(0.15, Math.min(1, intensity)),
      nextInSec: 0,
    };
  }
  return {
    active: false,
    intensity: 0,
    nextInSec: Math.max(0, Math.ceil(90 - phase)),
  };
}

export function getIslandTideState(elapsedSec: number): {
  waterY: number;
  highTide: boolean;
  tideProgress: number;
} {
  // Smooth 48s tidal oscillation: Low Tide = 1155, High Tide = 1060
  // Lower rope bridges sit at y = 1095 and submerge when waterY <= 1095
  const period = 48;
  const tideProgress = 0.5 - 0.5 * Math.cos((elapsedSec * Math.PI * 2) / period);
  const waterY = Math.round(1155 - tideProgress * 95);
  return {
    waterY,
    highTide: waterY <= 1095,
    tideProgress,
  };
}

export function unlockHangarVault(world: MatchWorld, durationSec = 20): void {
  world.hangarVaultOpen = true;
  world.hangarVaultTimer = Math.max(world.hangarVaultTimer ?? 0, durationSec);
  if (world.destructibles) {
    for (const d of world.destructibles) {
      if (d.kind === 'vault_door') {
        d.active = false;
      }
    }
  }
  world.mapMechanic = computeMapMechanicSnapshot(world);
}

export function computeMapMechanicSnapshot(world: MatchWorld): MapMechanicSnapshot {
  const map = MAPS[world.mapId];
  const destructibles = world.destructibles ?? [];
  const totalDestructibles = destructibles.filter(
    (d) => d.kind === 'destructible_wall' || d.kind === 'explosive_barrel',
  ).length;
  const activeDestructibles = destructibles.filter(
    (d) => d.active && (d.kind === 'destructible_wall' || d.kind === 'explosive_barrel'),
  ).length;

  if (world.mapId === 'desert') {
    const storm = getDesertSandstormState(world.elapsed);
    return {
      label: storm.active
        ? `SANDSTORM WHITEOUT (${Math.round(storm.intensity * 100)}% • CLOSE RANGE ONLY)`
        : `OASIS REGEN ACTIVE • SANDSTORM IN ${storm.nextInSec}S`,
      active: storm.active,
      sandstormIntensity: storm.intensity,
      waterY: 1200,
      highTide: false,
      vaultOpen: false,
      activeDestructibles,
      totalDestructibles,
    };
  }

  if (world.mapId === 'urban') {
    return {
      label: `BREACHABLE COVER: ${activeDestructibles}/${totalDestructibles} INTACT • RPG SHATTERS WALLS`,
      active: activeDestructibles < totalDestructibles,
      sandstormIntensity: 0,
      waterY: 1200,
      highTide: false,
      vaultOpen: false,
      activeDestructibles,
      totalDestructibles,
    };
  }

  if (world.mapId === 'hangar') {
    const open = Boolean(world.hangarVaultOpen);
    const rem = Math.ceil(world.hangarVaultTimer ?? 0);
    return {
      label: open
        ? `ARMORY VAULT UNLOCKED (${rem}S) • CONVEYORS ACTIVE`
        : 'ARMORY VAULT LOCKED (HIT DECK SWITCH) • CONVEYORS ACTIVE',
      active: open,
      sandstormIntensity: 0,
      waterY: 1200,
      highTide: false,
      vaultOpen: open,
      activeDestructibles,
      totalDestructibles,
    };
  }

  if (world.mapId === 'island') {
    const tide = getIslandTideState(world.elapsed);
    return {
      label: tide.highTide
        ? 'HIGH TIDE: ROPE BRIDGES SUBMERGED • OCEAN SLOW + DMG'
        : 'LOW TIDE: ROPE BRIDGES CLEAR • OCEAN SLOW + DMG',
      active: tide.highTide,
      sandstormIntensity: 0,
      waterY: tide.waterY,
      highTide: tide.highTide,
      vaultOpen: false,
      activeDestructibles,
      totalDestructibles,
    };
  }

  return {
    label: map.specialMechanicLabel ?? 'JUNGLE CANOPY • CLASSIC OUTPOST RULES',
    active: false,
    sandstormIntensity: 0,
    waterY: 1200,
    highTide: false,
    vaultOpen: false,
    activeDestructibles,
    totalDestructibles,
  };
}

export function getActiveSolids(map: ArenaMap, world?: MatchWorld): Rect[] {
  const activeDestructibles =
    world?.destructibles
      ?.filter((d) => d.active)
      .map((d) => ({
        x: d.x,
        y: d.y,
        w: d.w,
        h: d.h,
        kind: d.kind === 'destructible_wall' ? ('wall' as const) : ('crate' as const),
      })) ?? [];
  return [...map.solids, ...activeDestructibles];
}

export function getProjectileColliders(map: ArenaMap, world?: MatchWorld): Rect[] {
  const platformH = map.id === 'hangar' ? 16 : 44;
  const highTide = world?.mapId === 'island' ? Boolean(world.mapMechanic?.highTide) : false;
  const activePlatforms = map.platforms
    .filter((p) => !(highTide && p.submergesAtHighTide))
    .map((p) => ({
      x: p.x,
      y: p.y,
      w: p.w,
      h: platformH,
      kind: 'rock' as const,
    }));
  const activeDestructibles =
    world?.destructibles
      ?.filter((d) => d.active)
      .map((d) => ({
        x: d.x,
        y: d.y,
        w: d.w,
        h: d.h,
        kind: 'crate' as const,
      })) ?? [];
  return [...map.solids, ...activePlatforms, ...activeDestructibles];
}

export function hasLineOfSight(
  map: ArenaMap,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  world?: MatchWorld,
): boolean {
  const colliders = getProjectileColliders(map, world);
  for (const s of colliders) {
    if (s.kind === 'wall') continue;
    if (segmentIntersectsRect(x1, y1, x2, y2, s).hit) {
      return false;
    }
  }
  return true;
}

export function damageDestructible(
  world: MatchWorld,
  d: DestructibleEntity,
  amount: number,
  attackerId: string,
  isExplosive = false,
): void {
  if (!d.active) return;
  // Hangar Armory Vault blast doors can only be opened via the vault switch
  if (d.kind === 'vault_door') {
    d.hitFlashTimer = 0.08;
    return;
  }

  // Rockets/grenades shatter destructible walls immediately
  const effectiveDamage =
    d.kind === 'destructible_wall' && isExplosive
      ? Math.max(d.maxHp, amount * 3)
      : amount;

  d.hp = Math.max(0, d.hp - effectiveDamage);
  d.hitFlashTimer = 0.1;

  if (d.hp <= 0) {
    d.active = false;
    d.respawnTimer = d.kind === 'explosive_barrel' ? 18 : 28;
    const cx = d.x + d.w / 2;
    const cy = d.y + d.h / 2;
    world.events.push({ type: 'explosion', x: cx, y: cy, ownerId: attackerId });
    world.cameraTrauma = Math.min(1, world.cameraTrauma + 0.48);

    if (d.kind === 'explosive_barrel') {
      // Secondary fuel barrel detonation + chain explosion
      const blastRadius = 155;
      for (const target of world.soldiers) {
        if (!target.alive || target.invulnTimer > 0) continue;
        const tx = target.x + target.w / 2;
        const ty = target.y + target.h / 2;
        const dist = Math.hypot(tx - cx, ty - cy);
        if (dist <= blastRadius) {
          const falloff = 1 - (dist / blastRadius) * 0.65;
          const dmg = Math.max(12, Math.round(92 * falloff));
          const nx = dist > 1 ? (tx - cx) / dist : 0;
          const ny = dist > 1 ? (ty - cy) / dist : -1;
          applyDamage(
            world,
            target,
            dmg,
            attackerId,
            'FUEL BARREL',
            nx * 360 * falloff,
            (ny - 0.35) * 360 * falloff,
          );
        }
      }

      // Chain-detonate adjacent barrels or breach nearby destructible walls
      if (world.destructibles) {
        for (const other of world.destructibles) {
          if (!other.active || other.id === d.id) continue;
          const ox = other.x + other.w / 2;
          const oy = other.y + other.h / 2;
          if (Math.hypot(ox - cx, oy - cy) <= blastRadius) {
            damageDestructible(world, other, 180, attackerId, true);
          }
        }
      }
    }
  }
}

function updateMapMechanics(world: MatchWorld, dt: number): void {
  // Hangar Armory Vault timer & doors
  if (world.mapId === 'hangar') {
    if (world.hangarVaultOpen) {
      world.hangarVaultTimer = Math.max(0, (world.hangarVaultTimer ?? 0) - dt);
      if (world.hangarVaultTimer <= 0) {
        world.hangarVaultOpen = false;
        if (world.destructibles) {
          for (const d of world.destructibles) {
            if (d.kind === 'vault_door') {
              d.active = true;
              d.hp = d.maxHp;
            }
          }
        }
      }
    }
  }

  // Update destructible hit flash & respawn timers
  if (world.destructibles) {
    for (const d of world.destructibles) {
      d.hitFlashTimer = Math.max(0, d.hitFlashTimer - dt);
      if (!d.active && d.kind !== 'vault_door') {
        d.respawnTimer -= dt;
        if (d.respawnTimer <= 0) {
          d.active = true;
          d.hp = d.maxHp;
        }
      }
    }
  }

  world.mapMechanic = computeMapMechanicSnapshot(world);
}

export function stepWorld(
  world: MatchWorld,
  inputs: Record<string, PlayerInputState>,
  rawDt: number,
): void {
  world.events.length = 0;
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  world.cameraTrauma = Math.max(0, world.cameraTrauma - dt * 1.9);
  world.attackTokenCooldown = Math.max(0, world.attackTokenCooldown - dt);

  if (world.status !== 'playing') return;

  if (world.hitstopTimer > 0) {
    world.hitstopTimer = Math.max(0, world.hitstopTimer - dt);
    return;
  }

  world.elapsed += dt;
  world.weather = getWeatherStateForMap(world.mapId, world.elapsed);
  updateMapMechanics(world, dt);
  const map = MAPS[world.mapId];

  // Update soldiers
  for (const soldier of world.soldiers) {
    if (!soldier.alive) {
      soldier.koTimer = Math.max(0, soldier.koTimer - dt);
      if (soldier.livesRemaining > 0) {
        soldier.respawnTimer -= dt;
        if (soldier.respawnTimer <= 0) {
          respawnSoldier(world, soldier, map);
        }
      }
      continue;
    }

    const input = inputs[soldier.id] ?? emptyInput(soldier.aimAngle);
    updateSoldier(world, soldier, input, map, dt);
  }

  // Update bullets
  updateBullets(world, map, dt);

  // Update grenades
  updateGrenades(world, map, dt);

  // Update pickups (requires inputs for manual weapon click/pickup)
  updatePickups(world, inputs, dt);

  // Refresh map mechanic snapshot after combat interactions
  world.mapMechanic = computeMapMechanicSnapshot(world);

  // Check mode rules & win conditions
  evaluateMatchState(world);
}

function respawnSoldier(
  world: MatchWorld,
  soldier: SoldierEntity,
  map: ArenaMap,
): void {
  const spawn = pickBestSpawn(map, soldier.team, world.soldiers);
  soldier.x = spawn.x - STAND_W / 2;
  soldier.y = spawn.y - STAND_H;
  soldier.vx = 0;
  soldier.vy = 0;
  soldier.w = STAND_W;
  soldier.h = STAND_H;
  soldier.crouching = false;
  soldier.hp = soldier.maxHp;
  soldier.armor = soldier.maxArmor;
  soldier.fuel = 100;
  soldier.grenades = 999;
  soldier.reloadTimer = 0;
  soldier.fireCooldown = 0;
  soldier.invulnTimer = 1.6;
  soldier.alive = true;
  soldier.lastHitBy = null;
  soldier.lastHitWeapon = null;
  for (const slot of soldier.slots) {
    const def = WEAPONS[slot.weaponId];
    slot.mag = def.magSize;
    slot.reserve = 999;
  }
}

function updateSoldier(
  world: MatchWorld,
  s: SoldierEntity,
  input: PlayerInputState,
  map: ArenaMap,
  dt: number,
): void {
  s.hitFlashTimer = Math.max(0, s.hitFlashTimer - dt);
  s.invulnTimer = Math.max(0, s.invulnTimer - dt);
  s.fireCooldown = Math.max(0, s.fireCooldown - dt);
  s.meleeCooldown = Math.max(0, s.meleeCooldown - dt);
  s.meleeAnimTimer = Math.max(0, s.meleeAnimTimer - dt);
  s.dropThroughTimer = Math.max(0, s.dropThroughTimer - dt);
  s.fuelRegenDelay = Math.max(0, s.fuelRegenDelay - dt);

  // Decay squash/stretch smoothly back to 1
  const squashDecay = 1 - Math.exp(-16 * dt);
  s.squashX += (1 - s.squashX) * squashDecay;
  s.squashY += (1 - s.squashY) * squashDecay;

  // Aiming & facing
  s.aimAngle = input.aimAngle;
  if (Math.cos(s.aimAngle) >= 0) {
    s.facing = 1;
  } else {
    s.facing = -1;
  }

  // Weapon switching
  if (input.switchSlotPressed !== null && s.reloadTimer <= 0) {
    const nextSlot =
      input.switchSlotPressed === 'toggle'
        ? s.activeSlot === 0
          ? 1
          : 0
        : input.switchSlotPressed;
    if (nextSlot !== s.activeSlot) {
      s.activeSlot = nextSlot;
      s.fireCooldown = Math.max(s.fireCooldown, 0.12);
    }
  }

  const activeSolids = getActiveSolids(map, world);

  // Crouch state (adjust hitbox anchored at feet)
  const wantCrouch = input.crouchHeld && s.grounded;
  if (wantCrouch && !s.crouching) {
    s.y += STAND_H - CROUCH_H;
    s.h = CROUCH_H;
    s.crouching = true;
  } else if (!wantCrouch && s.crouching) {
    // Check headroom before standing
    const headBox: Rect = { x: s.x, y: s.y - (STAND_H - CROUCH_H), w: s.w, h: STAND_H - CROUCH_H };
    const blocked = activeSolids.some((solid) => rectsOverlap(headBox, solid));
    if (!blocked) {
      s.y -= STAND_H - CROUCH_H;
      s.h = STAND_H;
      s.crouching = false;
    }
  }

  // Drop through one-way platforms when holding crouch and pressing jump
  if (input.crouchHeld && input.jumpPressed && s.grounded) {
    s.dropThroughTimer = 0.22;
    s.grounded = false;
    s.coyoteTimer = 0;
  }

  // Check if soldier is in Island ocean water (slows movement)
  const islandWaterY = world.mapId === 'island' ? (world.mapMechanic?.waterY ?? 1155) : 9999;
  const inOceanWater = world.mapId === 'island' && s.y + s.h > islandWaterY + 4;

  // Horizontal velocity
  const baseRun = s.crouching ? CROUCH_SPEED : RUN_SPEED;
  const maxRun = inOceanWater ? baseRun * 0.52 : baseRun;
  const targetVx = Math.max(-1, Math.min(1, input.moveX)) * maxRun;
  if (Math.abs(targetVx) > 1) {
    const accel = s.grounded ? GROUND_ACCEL : AIR_ACCEL;
    if (s.vx < targetVx) {
      s.vx = Math.min(targetVx, s.vx + accel * dt);
    } else if (s.vx > targetVx) {
      s.vx = Math.max(targetVx, s.vx - accel * dt);
    }
  } else {
    const decel = s.grounded ? GROUND_FRICTION : AIR_ACCEL * 0.45;
    if (s.vx > 0) s.vx = Math.max(0, s.vx - decel * dt);
    else if (s.vx < 0) s.vx = Math.min(0, s.vx + decel * dt);
  }

  // Desert sandstorm wind drift
  if (world.mapId === 'desert' && (world.mapMechanic?.sandstormIntensity ?? 0) > 0) {
    s.vx -= (world.mapMechanic?.sandstormIntensity ?? 0) * 55 * dt;
  }

  // Jump buffering & coyote time
  if (s.grounded) {
    s.coyoteTimer = 0.11;
  } else {
    s.coyoteTimer = Math.max(0, s.coyoteTimer - dt);
  }

  if (input.jumpPressed && !input.crouchHeld) {
    s.jumpBufferTimer = 0.12;
  } else {
    s.jumpBufferTimer = Math.max(0, s.jumpBufferTimer - dt);
  }

  if (s.jumpBufferTimer > 0 && s.coyoteTimer > 0) {
    s.vy = JUMP_VELOCITY;
    s.grounded = false;
    s.coyoteTimer = 0;
    s.jumpBufferTimer = 0;
    s.squashX = 0.84;
    s.squashY = 1.18;
    world.events.push({ type: 'jump', x: s.x + s.w / 2, y: s.y + s.h });
  }

  // Variable jump cut if released early without jetpack active
  if (!input.jumpHeld && !input.jetpackHeld && s.vy < -180) {
    s.vy *= Math.pow(0.45, dt * 12);
  }

  // Jetpack thrust & unlimited gas/fuel management
  s.fuel = 100;
  const wantsJetpack =
    input.jetpackHeld || (!s.grounded && input.jumpHeld && s.vy > -120);
  if (wantsJetpack) {
    s.jetpackActive = true;
    s.grounded = false;
    s.vy = Math.max(MAX_JETPACK_UP_SPEED, s.vy - JETPACK_THRUST * dt);
    s.fuel = 100;
    s.fuelRegenDelay = 0;
  } else {
    s.jetpackActive = false;
  }

  // Gravity
  s.vy = Math.min(MAX_FALL_SPEED, s.vy + GRAVITY * dt);

  // Move X & resolve solid X collisions (including active destructible walls/barrels/vault doors)
  s.x += s.vx * dt;
  for (const solid of activeSolids) {
    if (rectsOverlap({ x: s.x, y: s.y, w: s.w, h: s.h }, solid)) {
      if (s.vx > 0) {
        s.x = solid.x - s.w;
        s.vx = 0;
      } else if (s.vx < 0) {
        s.x = solid.x + solid.w;
        s.vx = 0;
      }
    }
  }
  s.x = Math.max(0, Math.min(map.width - s.w, s.x));

  // Move Y & resolve solid + one-way platform collisions
  const prevBottom = s.y + s.h;
  const wasGrounded = s.grounded;
  s.y += s.vy * dt;
  s.grounded = false;

  for (const solid of activeSolids) {
    if (rectsOverlap({ x: s.x, y: s.y, w: s.w, h: s.h }, solid)) {
      if (s.vy > 0) {
        s.y = solid.y - s.h;
        if (!wasGrounded && s.vy > 280) {
          s.squashX = 1.22;
          s.squashY = 0.78;
          world.events.push({ type: 'land', x: s.x + s.w / 2, y: s.y + s.h });
        }
        s.vy = 0;
        s.grounded = true;
      } else if (s.vy < 0) {
        s.y = solid.y + solid.h;
        s.vy = 0;
      }
    }
  }

  const highTide = world.mapId === 'island' && Boolean(world.mapMechanic?.highTide);
  if (!s.grounded && s.vy >= 0 && s.dropThroughTimer <= 0) {
    const nextBottom = s.y + s.h;
    for (const plat of map.platforms) {
      if (highTide && plat.submergesAtHighTide) continue;
      if (
        s.x + s.w > plat.x + 2 &&
        s.x < plat.x + plat.w - 2 &&
        prevBottom <= plat.y + 4 &&
        nextBottom >= plat.y
      ) {
        s.y = plat.y - s.h;
        if (!wasGrounded && s.vy > 260) {
          s.squashX = 1.18;
          s.squashY = 0.82;
          world.events.push({ type: 'land', x: s.x + s.w / 2, y: s.y + s.h });
        }
        s.vy = 0;
        s.grounded = true;
        break;
      }
    }
  }

  // Interactive Map Zones (Oasis Health Regen, Conveyor Belts, Rooftop Jump Pads, Armory Switch, Fire & Water Hazards)
  if (map.zones && s.alive) {
    const sBox: Rect = { x: s.x, y: s.y, w: s.w, h: s.h };
    const feetBox: Rect = { x: s.x + 2, y: s.y + s.h - 10, w: s.w - 4, h: 16 };
    for (const zone of map.zones) {
      if (zone.kind === 'oasis_heal' && rectsOverlap(sBox, zone)) {
        if (s.hp < s.maxHp) {
          s.hp = Math.min(s.maxHp, s.hp + (zone.value ?? 16) * dt);
        }
      } else if (
        (zone.kind === 'conveyor_left' || zone.kind === 'conveyor_right') &&
        rectsOverlap(feetBox, zone)
      ) {
        const speed = zone.value ?? 185;
        const pushDx = (zone.kind === 'conveyor_right' ? speed : -speed) * dt;
        s.x = Math.max(0, Math.min(map.width - s.w, s.x + pushDx));
        for (const solid of activeSolids) {
          if (rectsOverlap({ x: s.x, y: s.y, w: s.w, h: s.h }, solid)) {
            if (pushDx > 0) s.x = solid.x - s.w;
            else s.x = solid.x + solid.w;
          }
        }
      } else if (zone.kind === 'jump_pad' && rectsOverlap(feetBox, zone) && s.vy >= -120) {
        s.vy = -(zone.value ?? 780);
        s.grounded = false;
        s.squashX = 0.78;
        s.squashY = 1.26;
        world.events.push({ type: 'jump', x: s.x + s.w / 2, y: s.y + s.h });
      } else if (zone.kind === 'vault_switch' && rectsOverlap(sBox, zone)) {
        if (!world.hangarVaultOpen) {
          unlockHangarVault(world, 20);
        }
      } else if (zone.kind === 'fire_hazard' && rectsOverlap(feetBox, zone)) {
        const dmg = (zone.value ?? 14) * dt;
        s.hp = Math.max(0, s.hp - dmg);
        if (s.hp <= 0) {
          s.hp = 1;
          applyDamage(world, s, 5, s.id, 'FUEL FIRE', 0, -110);
        }
      }
    }
  }

  // Island Fortress Ocean Water Hazard: slow + continuous damage when submerged below current tide waterY
  if (inOceanWater && s.alive) {
    s.vx *= 0.85;
    const waterDmg = 15 * dt;
    s.hp = Math.max(0, s.hp - waterDmg);
    if (s.hp <= 0) {
      s.hp = 1;
      applyDamage(world, s, 5, s.id, 'OCEAN TIDE', 0, -90);
    }
  }

  // Distance-synced walk phase
  if (s.grounded && Math.abs(s.vx) > 10) {
    s.walkPhase += Math.abs(s.vx) * dt * 0.085;
  }

  // Reloading (Unlimited reserve ammo for all weapons)
  const activeSlot = s.slots[s.activeSlot];
  const weapon = WEAPONS[activeSlot.weaponId];
  activeSlot.reserve = 999;

  if (s.reloadTimer > 0) {
    s.reloadTimer -= dt;
    if (s.reloadTimer <= 0) {
      s.reloadTimer = 0;
      activeSlot.mag = weapon.magSize;
      activeSlot.reserve = 999;
    }
  } else if (
    (input.reloadPressed || (activeSlot.mag === 0 && input.firePressed)) &&
    activeSlot.mag < weapon.magSize
  ) {
    s.reloadDuration = weapon.reloadMs / 1000;
    s.reloadTimer = s.reloadDuration;
    world.events.push({ type: 'reload', x: s.x + s.w / 2, y: s.y + 14 });
  }

  // Firing
  const wantsFire = weapon.automatic ? input.fireHeld : input.firePressed;
  if (wantsFire && s.fireCooldown <= 0 && s.reloadTimer <= 0) {
    if (activeSlot.mag > 0) {
      fireWeapon(world, s, activeSlot, weapon);
    } else {
      s.reloadDuration = weapon.reloadMs / 1000;
      s.reloadTimer = s.reloadDuration;
      world.events.push({ type: 'reload', x: s.x + s.w / 2, y: s.y + 14 });
    }
  }

  // Melee attack
  if (input.meleePressed && s.meleeCooldown <= 0) {
    performMelee(world, s);
  }

  // Throw grenade (unlimited grenades)
  s.grenades = 999;
  if (input.grenadePressed) {
    throwGrenade(world, s);
  }
}

function fireWeapon(
  world: MatchWorld,
  s: SoldierEntity,
  slot: { weaponId: WeaponId; mag: number; reserve: number },
  weapon: (typeof WEAPONS)[WeaponId],
): void {
  slot.mag -= 1;
  s.fireCooldown = weapon.fireRateMs / 1000;
  s.invulnTimer = Math.min(s.invulnTimer, 0.15);

  const shoulderX = s.x + s.w / 2;
  const shoulderY = s.y + s.h * 0.36;
  const muzzleX = shoulderX + Math.cos(s.aimAngle) * weapon.muzzleLength;
  const muzzleY = shoulderY + Math.sin(s.aimAngle) * weapon.muzzleLength;
  const maxLife = weapon.rangePx / weapon.projectileSpeed;

  for (let i = 0; i < weapon.pellets; i++) {
    const spreadOffset = (Math.random() - 0.5) * 2 * weapon.spreadRad;
    const angle = s.aimAngle + spreadOffset;
    const id = world.nextEntityId++;
    world.bullets.push({
      id,
      ownerId: s.id,
      team: s.team,
      weaponId: weapon.id,
      x: muzzleX,
      y: muzzleY,
      prevX: shoulderX,
      prevY: shoulderY,
      vx: Math.cos(angle) * weapon.projectileSpeed,
      vy: Math.sin(angle) * weapon.projectileSpeed,
      damage: weapon.damage,
      knockback: weapon.knockback,
      life: maxLife,
      maxLife,
      color: weapon.tracerColor,
      projectileKind: weapon.projectileKind ?? 'bullet',
      explosiveRadius: weapon.explosiveRadius,
      bouncesLeft: weapon.bounces ?? 0,
      gravityScale: weapon.gravityScale ?? 0,
      spinAngle: 0,
    });
  }

  // Subtle physical recoil push
  s.vx -= Math.cos(s.aimAngle) * weapon.recoilKick * 8;
  const heavyShot =
    weapon.id === 'sniper' ||
    weapon.id === 'shotgun' ||
    weapon.id === 'rocket' ||
    weapon.id === 'gl' ||
    weapon.id === 'sawgun';
  world.cameraTrauma = Math.min(0.45, world.cameraTrauma + (heavyShot ? 0.18 : 0.05));
  world.events.push({
    type: 'shot',
    x: muzzleX,
    y: muzzleY,
    angle: s.aimAngle,
    weaponId: weapon.id,
    ownerId: s.id,
  });
}

function performMelee(world: MatchWorld, s: SoldierEntity): void {
  s.meleeCooldown = MELEE_STATS.cooldownMs / 1000;
  s.meleeAnimTimer = 0.18;
  const sx = s.x + s.w / 2;
  const sy = s.y + s.h * 0.42;
  const cx = sx + Math.cos(s.aimAngle) * 24;
  const cy = sy + Math.sin(s.aimAngle) * 24;
  world.events.push({ type: 'melee', x: cx, y: cy, angle: s.aimAngle, ownerId: s.id });

  const map = MAPS[world.mapId];
  for (const target of world.soldiers) {
    if (!target.alive || target.id === s.id) continue;
    if (s.team !== 'ffa' && target.team === s.team) continue;
    const tx = target.x + target.w / 2;
    const ty = target.y + target.h / 2;
    const dist = Math.hypot(tx - cx, ty - cy);
    if (dist <= MELEE_STATS.range && hasLineOfSight(map, sx, sy, tx, ty, world)) {
      applyDamage(
        world,
        target,
        MELEE_STATS.damage,
        s.id,
        'Combat Knife',
        Math.cos(s.aimAngle) * MELEE_STATS.knockback,
        -180,
      );
      world.hitstopTimer = 0.045;
    }
  }

  // Melee can also strike destructible walls, explosive barrels, or the Hangar vault switch
  if (world.destructibles) {
    for (const d of world.destructibles) {
      if (!d.active) continue;
      const dx = d.x + d.w / 2 - cx;
      const dy = d.y + d.h / 2 - cy;
      if (Math.hypot(dx, dy) <= MELEE_STATS.range + 18) {
        damageDestructible(world, d, MELEE_STATS.damage, s.id, false);
      }
    }
  }
}

function throwGrenade(world: MatchWorld, s: SoldierEntity): void {
  s.grenades = 999;
  const shoulderX = s.x + s.w / 2;
  const shoulderY = s.y + s.h * 0.35;
  let sx = shoulderX + Math.cos(s.aimAngle) * 18;
  let sy = shoulderY + Math.sin(s.aimAngle) * 18;
  const colliders = getProjectileColliders(MAPS[world.mapId], world);
  for (const col of colliders) {
    const res = segmentIntersectsRect(shoulderX, shoulderY, sx, sy, col);
    if (res.hit) {
      sx = shoulderX;
      sy = shoulderY;
      break;
    }
  }
  world.grenades.push({
    id: world.nextEntityId++,
    ownerId: s.id,
    team: s.team,
    x: sx,
    y: sy,
    vx: Math.cos(s.aimAngle) * GRENADE_STATS.throwSpeed + s.vx * 0.35,
    vy: Math.sin(s.aimAngle) * GRENADE_STATS.throwSpeed - 140,
    fuse: GRENADE_STATS.fuseSeconds,
    radius: 7,
  });
}

function detonateExplosiveProjectile(
  world: MatchWorld,
  b: MatchWorld['bullets'][number],
  hitX: number,
  hitY: number,
): void {
  const radius = b.explosiveRadius ?? 140;
  world.events.push({ type: 'explosion', x: hitX, y: hitY, ownerId: b.ownerId });
  world.cameraTrauma = Math.min(1, world.cameraTrauma + 0.55);
  world.hitstopTimer = 0.035;

  const label = WEAPONS[b.weaponId]?.shortName ?? 'RPG';
  for (const target of world.soldiers) {
    if (!target.alive || target.invulnTimer > 0) continue;
    if (b.team !== 'ffa' && target.team === b.team && target.id !== b.ownerId) {
      continue;
    }
    const tx = target.x + target.w / 2;
    const ty = target.y + target.h / 2;
    const dx = tx - hitX;
    const dy = ty - hitY;
    const dist = Math.hypot(dx, dy);
    if (dist <= radius) {
      const falloff = 1 - (dist / radius) * 0.68;
      const dmg = Math.max(8, Math.round(b.damage * falloff));
      const nx = dist > 1 ? dx / dist : 0;
      const ny = dist > 1 ? dy / dist : -1;
      applyDamage(
        world,
        target,
        dmg,
        b.ownerId,
        label,
        nx * b.knockback * falloff,
        (ny - 0.35) * b.knockback * falloff,
      );
    }
  }

  // Shatter destructible walls & detonate explosive barrels within blast radius
  if (world.destructibles) {
    for (const d of world.destructibles) {
      if (!d.active) continue;
      const cx = Math.max(d.x, Math.min(hitX, d.x + d.w));
      const cy = Math.max(d.y, Math.min(hitY, d.y + d.h));
      if (Math.hypot(cx - hitX, cy - hitY) <= radius) {
        damageDestructible(world, d, b.damage, b.ownerId, true);
      }
    }
  }
}

function updateBullets(world: MatchWorld, map: ArenaMap, dt: number): void {
  const platformH = map.id === 'hangar' ? 16 : 44;
  const highTide = world.mapId === 'island' && Boolean(world.mapMechanic?.highTide);
  const staticColliders: Rect[] = [
    ...map.solids,
    ...map.platforms
      .filter((p) => !(highTide && p.submergesAtHighTide))
      .map((p) => ({
        x: p.x,
        y: p.y,
        w: p.w,
        h: platformH,
        kind: 'rock' as const,
      })),
  ];

  for (let i = world.bullets.length - 1; i >= 0; i--) {
    const b = world.bullets[i];
    // Preserve shoulder->muzzle prevX/prevY on the spawn tick so close-range shots never tunnel through obstacles
    if (b.life < b.maxLife) {
      b.prevX = b.x;
      b.prevY = b.y;
    }
    if (b.gravityScale) {
      b.vy += GRAVITY * b.gravityScale * dt;
    }
    if (b.projectileKind === 'saw') {
      b.spinAngle = (b.spinAngle ?? 0) + dt * 28;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    // Check if bullet passes through Hangar vault switch terminal
    if (map.zones) {
      for (const z of map.zones) {
        if (z.kind === 'vault_switch' && segmentIntersectsRect(b.prevX, b.prevY, b.x, b.y, z).hit) {
          unlockHangarVault(world, 20);
        }
      }
    }

    if (b.life <= 0) {
      if (b.explosiveRadius && b.explosiveRadius > 0) {
        detonateExplosiveProjectile(world, b, b.x, b.y);
      }
      world.bullets.splice(i, 1);
      continue;
    }

    // Check closest solid, destructible entity, or soldier hit
    let closestT = 2;
    let hitX = b.x;
    let hitY = b.y;
    let hitSoldier: SoldierEntity | null = null;
    let hitSolid: { x: number; y: number; w: number; h: number } | null = null;
    let hitDestructible: DestructibleEntity | null = null;

    for (const solid of staticColliders) {
      const res = segmentIntersectsRect(b.prevX, b.prevY, b.x, b.y, solid);
      if (res.hit && res.t < closestT) {
        closestT = res.t;
        hitX = res.x;
        hitY = res.y;
        hitSolid = solid;
        hitDestructible = null;
      }
    }

    if (world.destructibles) {
      for (const d of world.destructibles) {
        if (!d.active) continue;
        const res = segmentIntersectsRect(b.prevX, b.prevY, b.x, b.y, d);
        if (res.hit && res.t < closestT) {
          closestT = res.t;
          hitX = res.x;
          hitY = res.y;
          hitDestructible = d;
          hitSolid = d;
        }
      }
    }

    for (const target of world.soldiers) {
      if (!target.alive || target.id === b.ownerId || target.invulnTimer > 0) continue;
      if (b.team !== 'ffa' && target.team === b.team) continue;
      const res = segmentIntersectsRect(b.prevX, b.prevY, b.x, b.y, {
        x: target.x,
        y: target.y,
        w: target.w,
        h: target.h,
      });
      if (res.hit && res.t < closestT) {
        closestT = res.t;
        hitX = res.x;
        hitY = res.y;
        hitSoldier = target;
        hitSolid = null;
        hitDestructible = null;
      }
    }

    if (closestT <= 1) {
      if (hitSoldier) {
        if (b.explosiveRadius && b.explosiveRadius > 0) {
          detonateExplosiveProjectile(world, b, hitX, hitY);
        } else {
          const speed = Math.hypot(b.vx, b.vy) || 1;
          applyDamage(
            world,
            hitSoldier,
            b.damage,
            b.ownerId,
            WEAPONS[b.weaponId].shortName,
            (b.vx / speed) * b.knockback,
            (b.vy / speed) * b.knockback * 0.45 - 65,
          );
          world.events.push({
            type: 'hit',
            x: hitX,
            y: hitY,
            damage: b.damage,
            ownerId: b.ownerId,
            targetId: hitSoldier.id,
          });
        }
        world.bullets.splice(i, 1);
      } else if (hitDestructible) {
        if (b.explosiveRadius && b.explosiveRadius > 0) {
          detonateExplosiveProjectile(world, b, hitX, hitY);
        } else {
          damageDestructible(world, hitDestructible, b.damage, b.ownerId, false);
          world.events.push({ type: 'hit', x: hitX, y: hitY, damage: b.damage });
        }
        world.bullets.splice(i, 1);
      } else if (hitSolid && (b.bouncesLeft ?? 0) > 0) {
        // Ricochet bounce off wall/floor (Sawblade Cutter or bouncing GL shell)
        b.bouncesLeft = (b.bouncesLeft ?? 1) - 1;
        const distLeft = Math.abs(hitX - hitSolid.x);
        const distRight = Math.abs(hitX - (hitSolid.x + hitSolid.w));
        const distTop = Math.abs(hitY - hitSolid.y);
        const distBottom = Math.abs(hitY - (hitSolid.y + hitSolid.h));
        const minHoriz = Math.min(distLeft, distRight);
        const minVert = Math.min(distTop, distBottom);

        if (minHoriz < minVert) {
          b.vx = -b.vx * (b.projectileKind === 'saw' ? 0.96 : 0.72);
        } else {
          b.vy = -b.vy * (b.projectileKind === 'saw' ? 0.96 : 0.68);
        }
        b.x = hitX + (b.vx > 0 ? 2 : -2);
        b.y = hitY + (b.vy > 0 ? 2 : -2);
        b.prevX = b.x;
        b.prevY = b.y;
        world.events.push({ type: 'hit', x: hitX, y: hitY, damage: 0 });
      } else {
        if (b.explosiveRadius && b.explosiveRadius > 0) {
          detonateExplosiveProjectile(world, b, hitX, hitY);
        } else {
          world.events.push({ type: 'hit', x: hitX, y: hitY, damage: 0 });
        }
        world.bullets.splice(i, 1);
      }
    }
  }
}

function updateGrenades(world: MatchWorld, map: ArenaMap, dt: number): void {
  const colliders = getProjectileColliders(map, world);
  for (let i = world.grenades.length - 1; i >= 0; i--) {
    const g = world.grenades[i];
    g.fuse -= dt;
    g.vy += GRAVITY * 0.9 * dt;

    g.x += g.vx * dt;
    for (const s of colliders) {
      if (rectsOverlap({ x: g.x - g.radius, y: g.y - g.radius, w: g.radius * 2, h: g.radius * 2 }, s)) {
        if (g.vx > 0) g.x = s.x - g.radius;
        else g.x = s.x + s.w + g.radius;
        g.vx *= -0.58;
        world.events.push({ type: 'grenade_bounce', x: g.x, y: g.y });
      }
    }

    g.y += g.vy * dt;
    for (const s of colliders) {
      if (rectsOverlap({ x: g.x - g.radius, y: g.y - g.radius, w: g.radius * 2, h: g.radius * 2 }, s)) {
        if (g.vy > 0) g.y = s.y - g.radius;
        else g.y = s.y + s.h + g.radius;
        g.vy *= -0.52;
        g.vx *= 0.82;
        if (Math.abs(g.vy) > 40) {
          world.events.push({ type: 'grenade_bounce', x: g.x, y: g.y });
        }
      }
    }

    if (g.fuse <= 0) {
      detonateGrenade(world, g);
      world.grenades.splice(i, 1);
    }
  }
}

function detonateGrenade(
  world: MatchWorld,
  g: MatchWorld['grenades'][number],
): void {
  world.events.push({ type: 'explosion', x: g.x, y: g.y, ownerId: g.ownerId });
  world.cameraTrauma = Math.min(1, world.cameraTrauma + 0.65);
  world.hitstopTimer = 0.045;

  for (const target of world.soldiers) {
    if (!target.alive || target.invulnTimer > 0) continue;
    if (g.team !== 'ffa' && target.team === g.team && target.id !== g.ownerId) {
      continue;
    }
    const tx = target.x + target.w / 2;
    const ty = target.y + target.h / 2;
    const dx = tx - g.x;
    const dy = ty - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= GRENADE_STATS.blastRadius) {
      const falloff = 1 - (dist / GRENADE_STATS.blastRadius) * 0.72;
      const dmg = Math.round(GRENADE_STATS.maxDamage * falloff);
      const nx = dist > 1 ? dx / dist : 0;
      const ny = dist > 1 ? dy / dist : -1;
      applyDamage(
        world,
        target,
        dmg,
        g.ownerId,
        'FRAG',
        nx * GRENADE_STATS.knockback * falloff,
        (ny - 0.35) * GRENADE_STATS.knockback * falloff,
      );
    }
  }

  // Grenade blast also shatters destructible walls & detonates explosive barrels
  if (world.destructibles) {
    for (const d of world.destructibles) {
      if (!d.active) continue;
      const cx = Math.max(d.x, Math.min(g.x, d.x + d.w));
      const cy = Math.max(d.y, Math.min(g.y, d.y + d.h));
      if (Math.hypot(cx - g.x, cy - g.y) <= GRENADE_STATS.blastRadius) {
        damageDestructible(world, d, GRENADE_STATS.maxDamage, g.ownerId, true);
      }
    }
  }
}

export function applyDamage(
  world: MatchWorld,
  target: SoldierEntity,
  amount: number,
  attackerId: string,
  weaponLabel: string,
  kbX: number,
  kbY: number,
): void {
  if (!target.alive || target.invulnTimer > 0) return;

  let hpDmg = amount;
  if (target.armor > 0) {
    const absorbed = Math.min(target.armor, Math.round(amount * 0.6));
    target.armor -= absorbed;
    hpDmg = Math.max(1, amount - absorbed);
  }

  target.hp = Math.max(0, target.hp - hpDmg);
  target.hitFlashTimer = 0.07;
  target.vx += kbX;
  target.vy += kbY;
  target.lastHitBy = attackerId;
  target.lastHitWeapon = weaponLabel;

  const attacker = world.soldiers.find((s) => s.id === attackerId);
  if (attacker && attacker.id !== target.id) {
    attacker.damageDealt += amount;
  }

  if (target.hp <= 0) {
    target.alive = false;
    target.koTimer = 0.45;
    target.respawnTimer = world.mode === 'training' ? 1.8 : 3.2;
    target.deaths += 1;
    if (world.mode === 'survival') {
      target.livesRemaining = Math.max(0, target.livesRemaining - 1);
    }
    if (attacker && attacker.id !== target.id) {
      attacker.kills += 1;
    }

    world.hitstopTimer = Math.max(world.hitstopTimer, 0.04);
    world.cameraTrauma = Math.min(1, world.cameraTrauma + 0.35);
    world.events.push({
      type: 'ko',
      x: target.x + target.w / 2,
      y: target.y + target.h / 2,
      ownerId: attackerId,
      targetId: target.id,
    });

    world.killFeed.unshift({
      id: world.nextEntityId++,
      killerName: attacker ? attacker.name : 'Hazard',
      killerTeam: attacker ? attacker.team : 'ffa',
      victimName: target.name,
      victimTeam: target.team,
      weaponLabel,
      timestamp: world.elapsed,
    });
    if (world.killFeed.length > 5) {
      world.killFeed.length = 5;
    }
  }
}

export function findClickedWeaponPickup(
  world: MatchWorld,
  worldX: number,
  worldY: number,
  maxRadius = 48,
): PickupEntity | null {
  let closest: PickupEntity | null = null;
  let bestDist = maxRadius;
  for (const p of world.pickups) {
    if (!p.active || !p.kind.startsWith('weapon_')) continue;
    const d = Math.hypot(worldX - p.x, worldY - p.y);
    if (d <= bestDist) {
      bestDist = d;
      closest = p;
    }
  }
  return closest;
}

export function findNearbyWeaponPickup(
  world: MatchWorld,
  soldier: SoldierEntity | null,
  maxDist = 95,
): PickupEntity | null {
  if (!soldier || !soldier.alive) return null;
  const sx = soldier.x + soldier.w / 2;
  const sy = soldier.y + soldier.h / 2;
  let closest: PickupEntity | null = null;
  let bestDist = maxDist;
  for (const p of world.pickups) {
    if (!p.active || !p.kind.startsWith('weapon_')) continue;
    const d = Math.hypot(sx - p.x, sy - p.y);
    if (d <= bestDist) {
      bestDist = d;
      closest = p;
    }
  }
  return closest;
}

function updatePickups(
  world: MatchWorld,
  inputs: Record<string, PlayerInputState>,
  dt: number,
): void {
  for (const p of world.pickups) {
    p.bobPhase += dt * 3;
    if (!p.active) {
      p.respawnTimer -= dt;
      if (p.respawnTimer <= 0) {
        p.active = true;
      }
      continue;
    }

    for (const s of world.soldiers) {
      if (!s.alive) continue;
      const sx = s.x + s.w / 2;
      const sy = s.y + s.h / 2;
      const dist = Math.hypot(sx - p.x, sy - p.y);
      const inp = inputs[s.id];

      // Weapon pickups: NEVER auto-pickup on landing/touch!
      // Only pick up into hand when explicitly clicked (pickupTargetId === p.id)
      // or when pickupPressed is triggered while near the gun.
      if (p.kind.startsWith('weapon_')) {
        const clickedThisGun = inp?.pickupTargetId === p.id;
        const pressedPickupNearby = Boolean(inp?.pickupPressed && dist <= 95);
        if (clickedThisGun || pressedPickupNearby) {
          const wId = p.kind.replace('weapon_', '') as WeaponId;
          const def = WEAPONS[wId];
          if (def) {
            s.slots[s.activeSlot] = {
              weaponId: wId,
              mag: def.magSize,
              reserve: 999,
            };
            s.reloadTimer = 0;
            s.fireCooldown = 0.08;
            p.active = false;
            p.respawnTimer = 14;
            world.events.push({
              type: 'pickup',
              x: p.x,
              y: p.y,
              ownerId: s.id,
              weaponId: wId,
            });
            break;
          }
        }
        continue;
      }

      // Non-weapon utility pickups (medkit, armor, ammo, grenade) collect on touch
      if (dist < 34) {
        let consumed = false;
        if (p.kind === 'medkit' && s.hp < s.maxHp) {
          s.hp = Math.min(s.maxHp, s.hp + 45);
          consumed = true;
        } else if (p.kind === 'armor' && s.armor < s.maxArmor) {
          s.armor = Math.min(s.maxArmor, s.armor + 35);
          consumed = true;
        } else if (p.kind === 'ammo') {
          for (const slot of s.slots) {
            slot.mag = WEAPONS[slot.weaponId].magSize;
            slot.reserve = 999;
          }
          consumed = true;
        } else if (p.kind === 'grenade' && s.grenades < 4) {
          s.grenades = Math.min(4, s.grenades + 2);
          consumed = true;
        }
        if (consumed) {
          p.active = false;
          p.respawnTimer = 16;
          world.events.push({ type: 'pickup', x: p.x, y: p.y, ownerId: s.id });
          break;
        }
      }
    }
  }
}

function evaluateMatchState(world: MatchWorld): void {
  if (world.mode === 'training') return;

  if (world.mode === 'survival') {
    const human = world.soldiers.find((s) => !s.isBot);
    if (human && !human.alive && human.livesRemaining <= 0) {
      world.status = 'ended';
      world.winnerTeam = 'bravo';
      world.winnerName = `Wave ${world.wave} Overwhelmed`;
      return;
    }
    const remainingBots = world.soldiers.filter((s) => s.isBot && (s.alive || s.livesRemaining > 0));
    if (remainingBots.length === 0) {
      world.waveClearTimer += 0.016;
      if (world.wave >= 5 && world.waveClearTimer > 1.2) {
        world.status = 'ended';
        world.winnerTeam = 'alpha';
        world.winnerName = human?.name ?? 'Squad Alpha';
      } else if (world.waveClearTimer > 1.5) {
        world.wave += 1;
        world.waveClearTimer = 0;
        if (human) {
          human.hp = Math.min(human.maxHp, human.hp + 35);
          human.grenades = Math.min(4, human.grenades + 1);
        }
        spawnSurvivalWave(world, world.wave);
      }
    }
    return;
  }

  if (world.mode === 'tdm') {
    const alphaKills = world.soldiers
      .filter((s) => s.team === 'alpha')
      .reduce((acc, s) => acc + s.kills, 0);
    const bravoKills = world.soldiers
      .filter((s) => s.team === 'bravo')
      .reduce((acc, s) => acc + s.kills, 0);

    if (alphaKills >= world.targetKills || bravoKills >= world.targetKills || world.elapsed >= world.timeLimit) {
      world.status = 'ended';
      world.winnerTeam = alphaKills >= bravoKills ? 'alpha' : 'bravo';
      world.winnerName = alphaKills >= bravoKills ? 'Alpha Squad' : 'Bravo Squad';
    }
    return;
  }

  // Deathmatch FFA
  const top = [...world.soldiers].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths)[0];
  if ((top && top.kills >= world.targetKills) || world.elapsed >= world.timeLimit) {
    world.status = 'ended';
    world.winnerTeam = top?.team ?? 'ffa';
    world.winnerName = top?.name ?? 'Draw';
  }
}

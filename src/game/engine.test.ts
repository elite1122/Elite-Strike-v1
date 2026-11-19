import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDamage,
  createMatchWorld,
  emptyInput,
  stepWorld,
} from './physics';
import { MAPS } from './maps';
import { computeBotInputs } from './ai';
import {
  buildMinimapContacts,
  buildMinimapGeometry,
  getMinimapSummary,
} from './minimap';
import { calculateMatchXp, getLevelFromXp } from './progression';

function makeTestWorld(mode: 'training' | 'deathmatch' | 'tdm' | 'survival' = 'training') {
  return createMatchWorld({
    mode,
    mapId: 'forest',
    playerConfig: {
      id: 'p1',
      name: 'Tester',
      helmet: 'tactical',
      armorColor: 'olive',
      primaryWeapon: 'rifle',
      secondaryWeapon: 'pistol',
    },
  });
}

test('player spawns on clear terrain and settles grounded without falling through floor', () => {
  const world = makeTestWorld('training');
  const p = world.soldiers[0];
  for (let i = 0; i < 60; i++) {
    stepWorld(world, { p1: emptyInput(0) }, 1 / 60);
  }
  assert.equal(p.alive, true);
  assert.equal(p.grounded, true);
  assert.ok(p.y < MAPS.forest.height);
});

test('jetpack gas and frag grenades are unlimited during flight and combat', () => {
  const world = makeTestWorld('training');
  const p = world.soldiers[0];
  p.x = 640;
  p.y = 890;
  const initialY = p.y;
  for (let i = 0; i < 45; i++) {
    const inp = emptyInput(0);
    inp.jetpackHeld = true;
    if (i < 5) inp.grenadePressed = true;
    stepWorld(world, { p1: inp }, 1 / 60);
  }
  assert.ok(p.y < initialY - 30, 'jetpack should lift player upwards');
  assert.equal(p.fuel, 100, 'jetpack gas must remain unlimited at 100%');
  assert.equal(p.grenades, 999, 'frag grenades must remain unlimited at 999');
  assert.equal(world.grenades.length, 5, 'player can throw multiple grenades without running out');
});

test('firing depletes magazine and reloading restores magazine from reserve', () => {
  const world = makeTestWorld('training');
  const p = world.soldiers[0];
  p.invulnTimer = 0;
  const startMag = p.slots[0].mag;

  const fireInp = emptyInput(0);
  fireInp.fireHeld = true;
  fireInp.firePressed = true;
  stepWorld(world, { p1: fireInp }, 1 / 60);

  assert.equal(p.slots[0].mag, startMag - 1);
  assert.equal(world.bullets.length, 1);

  const reloadInp = emptyInput(0);
  reloadInp.reloadPressed = true;
  stepWorld(world, { p1: reloadInp }, 1 / 60);
  assert.ok(p.reloadTimer > 0);

  for (let i = 0; i < 130; i++) {
    stepWorld(world, { p1: emptyInput(0) }, 1 / 60);
  }
  assert.equal(p.slots[0].mag, startMag);
});

test('armor absorbs 60% damage and KO increments killer kills and victim deaths', () => {
  const world = makeTestWorld('deathmatch');
  const attacker = world.soldiers[0];
  const victim = world.soldiers[1];
  victim.invulnTimer = 0;
  victim.armor = 50;
  victim.hp = 100;

  applyDamage(world, victim, 50, attacker.id, 'VX-16', 0, 0);
  assert.equal(victim.armor, 20);
  assert.equal(victim.hp, 80);

  applyDamage(world, victim, 200, attacker.id, 'VX-16', 0, 0);
  assert.equal(victim.alive, false);
  assert.equal(victim.deaths, 1);
  assert.equal(attacker.kills, 1);
});

test('AI bot policies execute without errors across simulation steps', () => {
  const world = makeTestWorld('deathmatch');
  for (let i = 0; i < 120; i++) {
    const botInputs = computeBotInputs(world, 1 / 60);
    stepWorld(world, { p1: emptyInput(0), ...botInputs }, 1 / 60);
  }
  assert.ok(world.elapsed > 1.6);
});

test('progression XP and rank thresholds compute monotonically', () => {
  const lv1 = getLevelFromXp(0);
  const lv3 = getLevelFromXp(700);
  assert.equal(lv1.level, 1);
  assert.ok(lv3.level >= 3);
  assert.ok(calculateMatchXp({ kills: 5, won: true, mode: 'deathmatch' }) > 200);
});

test('minimap projects map geometry and classifies self, ally, and enemy positions accurately', () => {
  const tdmWorld = makeTestWorld('tdm');
  const geom = buildMinimapGeometry(MAPS.forest, 204, 84);
  assert.ok(geom.length >= 15, 'should project solid terrain, bunkers, crates, and platforms');
  assert.ok(geom.some((g) => g.kind === 'platform'));
  assert.ok(geom.some((g) => g.kind === 'bunker'));

  const contacts = buildMinimapContacts(tdmWorld, 'p1', 204, 84);
  assert.equal(contacts.length, tdmWorld.soldiers.length);
  const self = contacts.find((c) => c.id === 'p1');
  assert.ok(self);
  assert.equal(self.relation, 'self');
  assert.ok(self.x >= 0 && self.x <= 204);
  assert.ok(self.y >= 0 && self.y <= 84);

  const summary = getMinimapSummary(tdmWorld, 'p1');
  assert.equal(summary.mapName, 'Forest Outpost');
  assert.ok(summary.hostileCount > 0);
  assert.ok(summary.allyCount > 0);
  assert.ok(summary.playerCoords !== null);
});

test('12 Mini Militia weapons including sawgun ricochet and rocket splash damage work accurately', () => {
  const world = createMatchWorld({
    mode: 'training',
    mapId: 'forest',
    playerConfig: {
      id: 'p1',
      name: 'Commando',
      helmet: 'bandana',
      eyewear: 'aviators',
      skinTone: 'bronze',
      jetpackStyle: 'ion',
      armorColor: 'tiger',
      primaryWeapon: 'sawgun',
      secondaryWeapon: 'rocket',
    },
  });
  const p = world.soldiers[0];
  p.invulnTimer = 0;
  // Place player near left bunker wall so firing right hits the bunker wall
  p.x = 180;
  p.y = 740;

  const fireSaw = emptyInput(0);
  fireSaw.firePressed = true;
  fireSaw.fireHeld = true;
  stepWorld(world, { p1: fireSaw }, 1 / 60);

  assert.equal(world.bullets.length, 1);
  assert.equal(world.bullets[0].projectileKind, 'saw');
  assert.equal(world.bullets[0].bouncesLeft, 3);

  // Step until the sawblade hits the bunker at x=260 and ricochets
  for (let i = 0; i < 15; i++) {
    stepWorld(world, { p1: emptyInput(0) }, 1 / 60);
  }
  assert.equal(world.bullets.length, 1, 'sawblade should survive wall hit via ricochet');
  assert.ok((world.bullets[0].bouncesLeft ?? 3) < 3, 'bouncesLeft should decrement after ricochet');
  assert.ok(world.bullets[0].vx < 0, 'sawblade horizontal velocity should reverse on wall bounce');

  // Switch to slot 1 (SMAW Rocket Launcher) and fire horizontally at bunker wall
  const switchSlot = emptyInput(0);
  switchSlot.switchSlotPressed = 1;
  stepWorld(world, { p1: switchSlot }, 1 / 60);
  assert.equal(p.activeSlot, 1);
  p.fireCooldown = 0;

  const fireRocket = emptyInput(0);
  fireRocket.firePressed = true;
  fireRocket.fireHeld = true;
  stepWorld(world, { p1: fireRocket }, 1 / 60);
  assert.ok(world.bullets.some((b) => b.projectileKind === 'rocket'));

  // Step until rocket impacts the bunker wall and triggers an explosion
  let exploded = false;
  for (let i = 0; i < 20; i++) {
    stepWorld(world, { p1: emptyInput(0) }, 1 / 60);
    if (world.events.some((ev) => ev.type === 'explosion')) {
      exploded = true;
      break;
    }
  }
  assert.equal(exploded, true, 'rocket impact must trigger an explosion event');
});

test('landing on a weapon does not auto-equip it; clicking the weapon equips it into hand with unlimited ammo', () => {
  const world = makeTestWorld('training');
  const p = world.soldiers[0];
  assert.equal(p.slots[0].weaponId, 'rifle', 'default primary in hand is rifle');
  assert.equal(p.slots[1].weaponId, 'pistol', 'default secondary is pistol');
  assert.equal(p.slots[0].reserve, 999, 'all weapons start with unlimited reserve');

  const groundGun = world.pickups.find((pk) => pk.kind.startsWith('weapon_'));
  assert.ok(groundGun, 'map should contain weapon pickups');

  // Move player directly onto the weapon pickup and step 10 frames without clicking it
  p.x = groundGun.x - p.w / 2;
  p.y = groundGun.y - p.h / 2;
  for (let i = 0; i < 10; i++) {
    stepWorld(world, { p1: emptyInput(0) }, 1 / 60);
  }
  assert.equal(
    groundGun.active,
    true,
    'landing on a weapon pickup must NOT auto-pick it up',
  );
  assert.equal(
    p.slots[p.activeSlot].weaponId,
    'rifle',
    'player still holds rifle until clicking the ground weapon',
  );

  // Now click the weapon pickup (pickupTargetId = groundGun.id)
  const clickInput = emptyInput(0);
  clickInput.pickupTargetId = groundGun.id;
  stepWorld(world, { p1: clickInput }, 1 / 60);

  const expectedWeaponId = groundGun.kind.replace('weapon_', '');
  assert.equal(groundGun.active, false, 'clicked weapon pickup is consumed');
  assert.equal(
    p.slots[p.activeSlot].weaponId,
    expectedWeaponId,
    'clicked weapon is equipped directly into active hand',
  );
  assert.equal(
    p.slots[p.activeSlot].reserve,
    999,
    'picked up weapon also has unlimited reserve ammo',
  );
});

test('projectiles never tunnel through point-blank crates/walls or rocky island platforms', () => {
  const world = makeTestWorld('training');
  const p = world.soldiers[0];
  p.invulnTimer = 0;

  // 1. Place player pressed directly against the left bunker pillar (x: 260, y: 782, w: 34, h: 90)
  // Soldier width is 28, so x = 232 puts right edge at 260 (0px gap to the 34px-wide wall).
  p.x = 232;
  p.y = 790;
  p.vx = 0;
  p.vy = 0;

  // Put a target enemy directly behind the 34px bunker wall
  const enemy = world.soldiers[1];
  enemy.alive = true;
  enemy.invulnTimer = 0;
  enemy.x = 302;
  enemy.y = 790;
  const initialEnemyHp = enemy.hp;

  const fireRight = emptyInput(0);
  fireRight.firePressed = true;
  fireRight.fireHeld = true;
  stepWorld(world, { p1: fireRight }, 1 / 60);

  assert.equal(
    world.bullets.length,
    0,
    'point-blank bullet fired into bunker wall must impact immediately and not tunnel through',
  );
  assert.equal(
    enemy.hp,
    initialEnemyHp,
    'enemy standing behind bunker wall must not take damage from point-blank shot',
  );

  // 2. Fire at an elevated rocky island platform (forest platform at x: 290, y: 560, w: 210)
  p.x = 200;
  p.y = 555;
  p.fireCooldown = 0;
  const fireAtPlatform = emptyInput(0);
  fireAtPlatform.firePressed = true;
  fireAtPlatform.fireHeld = true;

  for (let i = 0; i < 15; i++) {
    stepWorld(world, { p1: i === 0 ? fireAtPlatform : emptyInput(0) }, 1 / 60);
  }
  assert.equal(
    world.bullets.length,
    0,
    'bullet fired into a rocky island platform must be blocked by the platform',
  );
});

test('weapon scope zoom profiles and scope zoom cycling work accurately across gun tiers', async () => {
  const { WEAPONS, getScopeZoomProfile, cycleWeaponScopeZoom } = await import('./weapons');
  assert.equal(WEAPONS.pistol.scopeZoom, 1);
  assert.equal(WEAPONS.rifle.scopeZoom, 3);
  assert.equal(WEAPONS.rocket.scopeZoom, 4);
  assert.equal(WEAPONS.sniper.scopeZoom, 5);

  const z1 = getScopeZoomProfile(1);
  const z3 = getScopeZoomProfile(3);
  const z5 = getScopeZoomProfile(5);

  assert.ok(
    z5.cameraScale < z3.cameraScale && z3.cameraScale < z1.cameraScale,
    'higher scope zoom expands visible battlefield FOV (smaller cameraScale)',
  );
  assert.ok(
    z5.lookAheadPx > z3.lookAheadPx && z3.lookAheadPx > z1.lookAheadPx,
    'higher scope zoom pans camera further downrange along aim angle',
  );

  // Cycling M4A1 Rifle (3X max): 3 -> 1 -> 2 -> 3
  assert.equal(cycleWeaponScopeZoom(3, WEAPONS.rifle.scopeZoom), 1);
  assert.equal(cycleWeaponScopeZoom(1, WEAPONS.rifle.scopeZoom), 2);
  assert.equal(cycleWeaponScopeZoom(2, WEAPONS.rifle.scopeZoom), 3);

  // Cycling M93BA Sniper (5X max): 5 -> 1 -> 3 -> 5
  assert.equal(cycleWeaponScopeZoom(5, WEAPONS.sniper.scopeZoom), 1);
  assert.equal(cycleWeaponScopeZoom(1, WEAPONS.sniper.scopeZoom), 3);
  assert.equal(cycleWeaponScopeZoom(3, WEAPONS.sniper.scopeZoom), 5);
});

test('all 5 maps feature large 4400-4800px dimensions, 5 tactical buildings, and sector detection', () => {
  for (const map of Object.values(MAPS)) {
    assert.ok(map.width >= 4400, `${map.id} width should be >= 4400px`);
    assert.ok(map.height >= 1560, `${map.id} height should be >= 1560px`);
    assert.equal(map.buildings.length, 5, `${map.id} should have 5 tactical buildings`);
    assert.ok(map.strategySummary.length > 30, `${map.id} should define a tactical strategy summary`);
  }

  const world = makeTestWorld('training');
  const p = world.soldiers[0];
  const hq = MAPS.forest.buildings[2]; // CENTRAL COMMAND BUNKER
  p.x = hq.x + hq.w / 2;
  p.y = hq.y + hq.h / 2;

  const summary = getMinimapSummary(world, 'p1');
  assert.equal(summary.currentZone, 'CENTRAL COMMAND BUNKER');
});

test('player name customization and draggable control layout repositioning work accurately', async () => {
  const { applyProfileToSoldier } = await import('./physics');
  const {
    DEFAULT_PROFILE,
    DEFAULT_CONTROL_LAYOUT,
    updateControlLayoutPosition,
  } = await import('./progression');

  const world = makeTestWorld('training');
  const p = world.soldiers[0];

  // 1. Change player name
  applyProfileToSoldier(p, {
    ...DEFAULT_PROFILE,
    callsign: 'Rashed-Elite',
  });
  assert.equal(p.name, 'Rashed-Elite', 'soldier name updates to custom player name');

  // Blank name falls back to Striker-01
  applyProfileToSoldier(p, {
    ...DEFAULT_PROFILE,
    callsign: '   ',
  });
  assert.equal(p.name, 'Striker-01', 'blank callsign falls back safely to Striker-01');

  // 2. Drag and reposition controls
  let layout = { ...DEFAULT_CONTROL_LAYOUT };
  layout = updateControlLayoutPosition(layout, 'moveStick', { xPct: 18.4, yPct: 74.2 });
  layout = updateControlLayoutPosition(layout, 'fireStick', { xPct: 82.6, yPct: 71.5 });
  layout = updateControlLayoutPosition(layout, 'grenadeBtn', { xPct: 140, yPct: -20 }); // out-of-bounds clamped

  assert.deepEqual(layout.moveStick, { xPct: 18.4, yPct: 74.2 });
  assert.deepEqual(layout.fireStick, { xPct: 82.6, yPct: 71.5 });
  assert.deepEqual(
    layout.grenadeBtn,
    { xPct: 96, yPct: 8 },
    'out-of-bounds drag coordinates clamp safely within viewport bounds',
  );
});

test('dynamic weather system cycles through light_rain, fog, snow, and clear per map', async () => {
  const {
    WEATHER_PHASE_DURATION_SEC,
    getWeatherStateForMap,
    getMapWeatherVisualConfig,
  } = await import('./weather');

  // Forest starts in light_rain, then cycles to fog, snow, clear
  const w0 = getWeatherStateForMap('forest', 1);
  const w1 = getWeatherStateForMap('forest', WEATHER_PHASE_DURATION_SEC + 5);
  const w2 = getWeatherStateForMap('forest', WEATHER_PHASE_DURATION_SEC * 2 + 5);
  const w3 = getWeatherStateForMap('forest', WEATHER_PHASE_DURATION_SEC * 3 + 5);

  assert.equal(w0.type, 'light_rain');
  assert.ok(w0.intensity > 0);
  assert.equal(w1.type, 'fog');
  assert.equal(w2.type, 'snow');
  assert.equal(w3.type, 'clear');
  assert.equal(w3.intensity, 0);

  // Desert starts in fog, Urban starts in snow
  assert.equal(getWeatherStateForMap('desert', 2).type, 'fog');
  assert.equal(getWeatherStateForMap('urban', 2).type, 'snow');

  // Visual configs exist for all maps and weather types
  for (const mapId of ['forest', 'desert', 'urban', 'hangar', 'island'] as const) {
    for (const wType of ['light_rain', 'fog', 'snow'] as const) {
      const cfg = getMapWeatherVisualConfig(mapId, wType);
      assert.ok(cfg.label.length > 3);
      assert.ok(cfg.fogMaxOpacity > 0);
    }
  }

  // stepWorld updates world.weather automatically
  const world = makeTestWorld('training');
  world.elapsed = WEATHER_PHASE_DURATION_SEC + 4;
  stepWorld(world, {}, 1 / 60);
  assert.equal(world.weather?.type, 'fog');
});

test('Desert Base, Urban Ruins, Military Hangar, and Island Fortress implement distinct landmarks and unique special mechanics', async () => {
  const {
    createMatchWorld,
    getDesertSandstormState,
    getIslandTideState,
    unlockHangarVault,
  } = await import('./physics');

  // 1. DESERT BASE: 5 requested landmarks + Oasis Health Regen + 2-minute Sandstorm whiteout
  const desertNames = MAPS.desert.buildings.map((b) => b.name);
  assert.deepEqual(desertNames, [
    'ALPHA OASIS TOWER',
    'COMMAND COMPOUND',
    'BURIED BUNKER',
    'RADAR STATION',
    'SUPPLY DEPOT',
  ]);
  const desertWorld = createMatchWorld({
    mode: 'training',
    mapId: 'desert',
    playerConfig: {
      id: 'p1',
      name: 'DesertTester',
      helmet: 'tactical',
      armorColor: 'sand',
      primaryWeapon: 'rifle',
      secondaryWeapon: 'pistol',
    },
  });
  const dp = desertWorld.soldiers[0];
  dp.hp = 50;
  // Place soldier inside the Oasis healing water zone (x: 600..940, y: 940..1005)
  dp.x = 750;
  dp.y = 950;
  stepWorld(desertWorld, {}, 0.5);
  assert.ok(dp.hp > 50, 'Oasis water pool regenerates soldier health on Desert Base');

  // Sandstorm periodic 2-minute cycle: clear at 30s, active whiteout at 105s
  assert.equal(getDesertSandstormState(30).active, false);
  const stormAt105 = getDesertSandstormState(105);
  assert.equal(stormAt105.active, true);
  assert.ok(stormAt105.intensity > 0.8);

  // 2. URBAN RUINS: 5 requested landmarks + Destructible Walls shattered by RPG + Jump Pads
  const urbanNames = MAPS.urban.buildings.map((b) => b.name);
  assert.deepEqual(urbanNames, [
    'COLLAPSED SKYSCRAPER',
    'METRO STATION',
    'ROOFTOP ROW',
    'GAS STATION',
    'HOSPITAL RUINS',
  ]);
  const urbanWorld = createMatchWorld({
    mode: 'training',
    mapId: 'urban',
    playerConfig: {
      id: 'p1',
      name: 'UrbanTester',
      helmet: 'tactical',
      armorColor: 'graphite',
      primaryWeapon: 'rocket',
      secondaryWeapon: 'pistol',
    },
  });
  const up = urbanWorld.soldiers[0];
  const wall = urbanWorld.destructibles?.find((d) => d.kind === 'destructible_wall');
  assert.ok(wall && wall.active, 'Urban Ruins spawns active destructible walls');
  if (wall) {
    up.x = wall.x - 90;
    up.y = wall.y + 10;
    up.vx = 0;
    up.vy = 0;
    const fireRpg = emptyInput(0);
    fireRpg.firePressed = true;
    fireRpg.fireHeld = true;
    for (let i = 0; i < 12; i++) {
      stepWorld(urbanWorld, { p1: i === 0 ? fireRpg : emptyInput(0) }, 1 / 60);
    }
    assert.equal(
      wall.active,
      false,
      'RPG rocket immediately shatters destructible concrete wall on Urban Ruins',
    );
  }

  // 3. MILITARY HANGAR: 5 requested landmarks + Conveyor Belt movement + Armory Vault Switch unlocking
  const hangarNames = MAPS.hangar.buildings.map((b) => b.name);
  assert.deepEqual(hangarNames, [
    'CONTROL TOWER',
    'CATWALK NETWORK',
    'MAIN HANGAR FLOOR',
    'ARMORY VAULT',
    'FUEL DEPOT',
  ]);
  const hangarWorld = createMatchWorld({
    mode: 'training',
    mapId: 'hangar',
    playerConfig: {
      id: 'p1',
      name: 'HangarTester',
      helmet: 'heavy',
      armorColor: 'cobalt',
      primaryWeapon: 'rifle',
      secondaryWeapon: 'pistol',
    },
  });
  const hp = hangarWorld.soldiers[0];
  // Place soldier on Eastward Conveyor Belt (x: 920..1680, y: 940..966, ground y=960)
  hp.x = 1200;
  hp.y = 960 - hp.h;
  hp.vx = 0;
  hp.vy = 0;
  const startConveyorX = hp.x;
  stepWorld(hangarWorld, {}, 0.05);
  assert.ok(
    hp.x > startConveyorX,
    'Conveyor belt automatically transports soldier horizontally on Military Hangar',
  );

  // Armory Vault starts locked with active blast doors, and unlocks when switch is triggered
  assert.equal(hangarWorld.hangarVaultOpen, false);
  assert.ok(
    hangarWorld.destructibles?.some((d) => d.kind === 'vault_door' && d.active),
    'Hangar Armory Vault blast doors start locked',
  );
  unlockHangarVault(hangarWorld, 20);
  assert.equal(hangarWorld.hangarVaultOpen, true);
  assert.ok(
    hangarWorld.destructibles?.every((d) => d.kind !== 'vault_door' || !d.active),
    'Triggering the Armory Vault switch opens the blast doors',
  );

  // 4. ISLAND FORTRESS: 5 requested landmarks + Ocean Water slow/damage + Dynamic Tide bridge submersion
  const islandNames = MAPS.island.buildings.map((b) => b.name);
  assert.deepEqual(islandNames, [
    'LIGHTHOUSE',
    'BRIDGE OUTPOSTS',
    'MAIN FORTRESS',
    'CAVE GROTTO',
    'PIRATE DOCK',
  ]);
  const lowTide = getIslandTideState(0);
  const highTide = getIslandTideState(24);
  assert.equal(lowTide.highTide, false);
  assert.equal(highTide.highTide, true);
  assert.ok(highTide.waterY < lowTide.waterY);

  const islandWorld = createMatchWorld({
    mode: 'training',
    mapId: 'island',
    playerConfig: {
      id: 'p1',
      name: 'IslandTester',
      helmet: 'recon',
      armorColor: 'olive',
      primaryWeapon: 'rifle',
      secondaryWeapon: 'pistol',
    },
  });
  const ip = islandWorld.soldiers[0];
  ip.hp = 100;
  ip.x = 1120; // over ocean channel
  ip.y = 1180; // submerged in ocean water
  stepWorld(islandWorld, {}, 0.2);
  assert.ok(ip.hp < 100, 'Falling into Island Fortress ocean water deals continuous water hazard damage');
});


import { ArenaMap, MapId } from './types';

export const MAPS: Record<MapId, ArenaMap> = {
  forest: {
    id: 'forest',
    name: 'Forest Outpost',
    tagline: 'Timber watchtowers, logging mill, underground root bunker & canopy bridges',
    strategySummary:
      '3-Lane Canopy & Trench Warfare: Hold the West/East 3-Story Watchtowers for 5X Sniper sightlines, contest the Central Command Bunker for Rocket & Armor control, or flank through the sunken River Mill valley.',
    specialMechanicLabel: 'CANOPY OVERWATCH & RIVER TRENCH',
    width: 4400,
    height: 1600,
    palette: {
      skyTop: '#162836',
      skyBottom: '#3B5C5A',
      sunColor: '#FDE68A',
      mountainFar: '#1E3738',
      mountainNear: '#274841',
      terrainFill: '#3B2F26',
      terrainStroke: '#14191F',
      terrainTop: '#4A7C44',
      bunkerFill: '#475569',
      platformFill: '#785538',
      accent: '#22C55E',
    },
    buildings: [
      {
        id: 'forest-west-tower',
        name: 'ALPHA TIMBER WATCHTOWER',
        style: 'watchtower',
        x: 240,
        y: 520,
        w: 300,
        h: 420,
        role: '3-Tier Sniper Overwatch & West Spawn Bastion',
      },
      {
        id: 'forest-mill-west',
        name: 'SAWMILL GARRISON',
        style: 'logging_mill',
        x: 980,
        y: 660,
        w: 440,
        h: 320,
        role: 'Mid-Flank Timber Mill & Sawgun Armory',
      },
      {
        id: 'forest-central-hq',
        name: 'CENTRAL COMMAND BUNKER',
        style: 'bunker_hq',
        x: 1920,
        y: 560,
        w: 560,
        h: 380,
        role: 'Reinforced 2-Story Comms Bunker & Heavy Weapon Vault',
      },
      {
        id: 'forest-comms-east',
        name: 'RIVER COMMS STATION',
        style: 'logging_mill',
        x: 2980,
        y: 660,
        w: 440,
        h: 320,
        role: 'East Mid-Flank Relay & CQB Chokepoint',
      },
      {
        id: 'forest-east-tower',
        name: 'BRAVO TIMBER WATCHTOWER',
        style: 'watchtower',
        x: 3860,
        y: 520,
        w: 300,
        h: 420,
        role: '3-Tier Sniper Overwatch & East Spawn Bastion',
      },
    ],
    solids: [
      // Outer boundaries
      { x: -80, y: 0, w: 80, h: 1600, kind: 'wall' },
      { x: 4400, y: 0, w: 80, h: 1600, kind: 'wall' },
      { x: 0, y: -80, w: 4400, h: 80, kind: 'wall' },

      // Multi-tiered ground terrain across 4400px with sunken river trenches & subterranean root pass
      { x: 0, y: 940, w: 720, h: 660, kind: 'ground' },
      { x: 720, y: 1120, w: 260, h: 480, kind: 'ground' },
      { x: 980, y: 980, w: 500, h: 620, kind: 'ground' },
      { x: 1480, y: 1240, w: 420, h: 360, kind: 'ground' },
      { x: 1900, y: 940, w: 600, h: 660, kind: 'ground' },
      { x: 2500, y: 1240, w: 420, h: 360, kind: 'ground' },
      { x: 2920, y: 980, w: 500, h: 620, kind: 'ground' },
      { x: 3420, y: 1120, w: 260, h: 480, kind: 'ground' },
      { x: 3680, y: 940, w: 720, h: 660, kind: 'ground' },

      // Subterranean trench stepping ledges in the deep river gorges
      { x: 1560, y: 1060, w: 240, h: 42, kind: 'rock' },
      { x: 2600, y: 1060, w: 240, h: 42, kind: 'rock' },

      // 1. ALPHA TIMBER WATCHTOWER (West, x: 260..520) — preserves exact test geometry at x=260, y=740..872
      { x: 260, y: 740, w: 260, h: 42, kind: 'bunker' },
      { x: 260, y: 782, w: 34, h: 90, kind: 'bunker' },
      { x: 486, y: 782, w: 34, h: 90, kind: 'bunker' },

      // 2. SAWMILL GARRISON (West-Mid 2-Story Building, x: 1020..1420)
      { x: 1020, y: 800, w: 400, h: 40, kind: 'bunker' },
      { x: 1020, y: 840, w: 36, h: 80, kind: 'bunker' },
      { x: 1384, y: 840, w: 36, h: 80, kind: 'bunker' },
      { x: 1060, y: 650, w: 320, h: 38, kind: 'bunker' },

      // 3. CENTRAL COMMAND BUNKER (2-Story Fortified Concrete HQ, x: 1940..2460)
      { x: 1940, y: 750, w: 520, h: 46, kind: 'bunker' },
      { x: 1940, y: 796, w: 42, h: 86, kind: 'bunker' },
      { x: 2418, y: 796, w: 42, h: 86, kind: 'bunker' },
      { x: 2020, y: 560, w: 360, h: 42, kind: 'bunker' },
      { x: 2020, y: 602, w: 36, h: 84, kind: 'bunker' },
      { x: 2344, y: 602, w: 36, h: 84, kind: 'bunker' },

      // 4. RIVER COMMS STATION (East-Mid 2-Story Building, x: 2980..3380)
      { x: 2980, y: 800, w: 400, h: 40, kind: 'bunker' },
      { x: 2980, y: 840, w: 36, h: 80, kind: 'bunker' },
      { x: 3344, y: 840, w: 36, h: 80, kind: 'bunker' },
      { x: 3020, y: 650, w: 320, h: 38, kind: 'bunker' },

      // 5. BRAVO TIMBER WATCHTOWER (East, x: 3880..4140)
      { x: 3880, y: 740, w: 260, h: 42, kind: 'bunker' },
      { x: 3880, y: 782, w: 34, h: 90, kind: 'bunker' },
      { x: 4106, y: 782, w: 34, h: 90, kind: 'bunker' },

      // High-altitude canopy sniper rock islands
      { x: 680, y: 490, w: 240, h: 42, kind: 'rock' },
      { x: 1540, y: 450, w: 260, h: 42, kind: 'rock' },
      { x: 2600, y: 450, w: 260, h: 42, kind: 'rock' },
      { x: 3480, y: 490, w: 240, h: 42, kind: 'rock' },

      // Tactical boulder & crate barricades
      { x: 160, y: 888, w: 60, h: 52, kind: 'crate' },
      { x: 810, y: 1066, w: 72, h: 54, kind: 'crate' },
      { x: 1640, y: 1186, w: 76, h: 54, kind: 'crate' },
      { x: 2680, y: 1186, w: 76, h: 54, kind: 'crate' },
      { x: 3510, y: 1066, w: 72, h: 54, kind: 'crate' },
      { x: 4180, y: 888, w: 60, h: 52, kind: 'crate' },
    ],
    platforms: [
      // West Watchtower upper sniper deck (preserves x: 290, y: 560, w: 210)
      { x: 290, y: 560, w: 210, style: 'bridge' },
      { x: 540, y: 740, w: 190, style: 'bridge' },
      // West-Mid Sawmill catwalks & high canopy bridges
      { x: 780, y: 880, w: 180, style: 'bridge' },
      { x: 1100, y: 480, w: 240, style: 'scaffold' },
      { x: 1460, y: 860, w: 220, style: 'bridge' },
      { x: 1570, y: 680, w: 220, style: 'catwalk' },
      // Central Command Bunker high radar deck & flanking bridges
      { x: 2060, y: 380, w: 280, style: 'catwalk' },
      { x: 2610, y: 680, w: 220, style: 'catwalk' },
      { x: 2720, y: 860, w: 220, style: 'bridge' },
      // East-Mid Comms Station & East Watchtower bridges
      { x: 3060, y: 480, w: 240, style: 'scaffold' },
      { x: 3440, y: 880, w: 180, style: 'bridge' },
      { x: 3670, y: 740, w: 190, style: 'bridge' },
      { x: 3900, y: 560, w: 210, style: 'bridge' },
    ],
    spawns: [
      { x: 140, y: 870, team: 'alpha' },
      { x: 390, y: 670, team: 'alpha' },
      { x: 620, y: 870, team: 'alpha' },
      { x: 1220, y: 730, team: 'alpha' },
      { x: 4260, y: 870, team: 'bravo' },
      { x: 4010, y: 670, team: 'bravo' },
      { x: 3780, y: 870, team: 'bravo' },
      { x: 3180, y: 730, team: 'bravo' },
      { x: 2200, y: 680, team: 'ffa' },
      { x: 2200, y: 490, team: 'ffa' },
      { x: 800, y: 420, team: 'ffa' },
      { x: 1680, y: 990, team: 'ffa' },
      { x: 2720, y: 990, team: 'ffa' },
      { x: 3600, y: 420, team: 'ffa' },
    ],
    pickups: [
      { x: 390, y: 530, kind: 'weapon_sniper' },
      { x: 4010, y: 530, kind: 'weapon_sniper' },
      { x: 1220, y: 620, kind: 'weapon_sawgun' },
      { x: 3180, y: 620, kind: 'weapon_tavor' },
      { x: 2200, y: 350, kind: 'weapon_rocket' },
      { x: 2200, y: 530, kind: 'armor' },
      { x: 2200, y: 720, kind: 'weapon_lmg' },
      { x: 2200, y: 910, kind: 'medkit' },
      { x: 1670, y: 420, kind: 'weapon_ak47' },
      { x: 2730, y: 420, kind: 'weapon_gl' },
      { x: 1220, y: 950, kind: 'medkit' },
      { x: 3180, y: 950, kind: 'medkit' },
      { x: 800, y: 460, kind: 'armor' },
      { x: 3600, y: 460, kind: 'armor' },
      { x: 1680, y: 1030, kind: 'weapon_shotgun' },
      { x: 2720, y: 1030, kind: 'weapon_uzi' },
      { x: 860, y: 1090, kind: 'grenade' },
      { x: 3540, y: 1090, kind: 'grenade' },
    ],
  },

  desert: {
    id: 'desert',
    name: 'Desert Base',
    tagline: 'Alpha Oasis regen tower, walled command compound, buried CQB tunnel & high radar nest',
    strategySummary:
      '3-Lane Scorching Dune Warfare: TOP — Jetpack up to the Radar Station dish or Alpha Oasis Tower for 5X Sniper dominance. MID — Breach the multi-gate Command Compound or Supply Depot trucks for Rocket Launcher & Armor. BOTTOM — Flank through the underground Buried Bunker tunnel with Shotguns & SMGs. Watch for periodic Sandstorm blackouts!',
    specialMechanicLabel: 'SANDSTORM WHITEOUT & OASIS HP REGEN',
    width: 4600,
    height: 1620,
    palette: {
      skyTop: '#7C2D12',
      skyBottom: '#F59E0B',
      sunColor: '#FEF08A',
      mountainFar: '#9A3412',
      mountainNear: '#B45309',
      terrainFill: '#B45309',
      terrainStroke: '#291509',
      terrainTop: '#FDE68A',
      bunkerFill: '#78716C',
      platformFill: '#D97706',
      accent: '#F59E0B',
    },
    buildings: [
      {
        id: 'desert-oasis-tower',
        name: 'ALPHA OASIS TOWER',
        style: 'oasis_tower',
        x: 220,
        y: 360,
        w: 360,
        h: 620,
        role: 'High Sniper Tower & Healing Oasis Water Pool (+16 HP/s)',
      },
      {
        id: 'desert-command-compound',
        name: 'COMMAND COMPOUND',
        style: 'command_compound',
        x: 1920,
        y: 560,
        w: 760,
        h: 420,
        role: 'Mid-Map Walled Military Base · Multi-Gate Entry · Ammo & Armor',
      },
      {
        id: 'desert-buried-bunker',
        name: 'BURIED BUNKER',
        style: 'buried_bunker',
        x: 1180,
        y: 1020,
        w: 2240,
        h: 340,
        role: 'Underground Tunnel Network · Shotgun & SMG Close Combat',
      },
      {
        id: 'desert-radar-station',
        name: 'RADAR STATION',
        style: 'radar_station',
        x: 2040,
        y: 180,
        w: 520,
        h: 240,
        role: 'Elevated Radar Dish · Jetpack-Only Sniper Nest',
      },
      {
        id: 'desert-supply-depot',
        name: 'SUPPLY DEPOT',
        style: 'supply_depot',
        x: 3540,
        y: 580,
        w: 740,
        h: 400,
        role: 'Military Trucks & Cargo Crates · Exposed Rocket Launcher Spawn',
      },
    ],
    zones: [
      {
        id: 'desert-oasis-water',
        kind: 'oasis_heal',
        label: 'OASIS HEALING SPRING (+16 HP/S)',
        x: 600,
        y: 940,
        w: 340,
        h: 65,
        value: 16,
      },
    ],
    solids: [
      { x: -80, y: 0, w: 80, h: 1620, kind: 'wall' },
      { x: 4600, y: 0, w: 80, h: 1620, kind: 'wall' },
      { x: 0, y: -80, w: 4600, h: 80, kind: 'wall' },

      // West Sand Dune & Alpha Oasis Basin
      { x: 0, y: 980, w: 600, h: 640, kind: 'ground' },
      { x: 600, y: 1000, w: 340, h: 620, kind: 'ground' }, // Oasis water basin floor
      { x: 940, y: 980, w: 280, h: 640, kind: 'ground' },

      // Mid-Map Command Compound Roof Slab over the Underground Buried Bunker
      { x: 1360, y: 980, w: 460, h: 52, kind: 'bunker' },
      { x: 1920, y: 980, w: 760, h: 52, kind: 'bunker' },
      { x: 2780, y: 980, w: 460, h: 52, kind: 'bunker' },

      // Deep Underground Buried Bunker Floor & Partition Chambers (Bottom Flank Lane y: 1032..1290)
      { x: 1120, y: 1290, w: 2360, h: 330, kind: 'ground' },
      { x: 1760, y: 1120, w: 42, h: 100, kind: 'bunker' },
      { x: 2280, y: 1090, w: 44, h: 110, kind: 'bunker' },
      { x: 2800, y: 1120, w: 42, h: 100, kind: 'bunker' },

      // East Sand Dune & Supply Depot Tarmac
      { x: 3380, y: 980, w: 1220, h: 640, kind: 'ground' },

      // 1. ALPHA OASIS TOWER (Tall 4-Tier Sniper Watchtower at x: 220..580)
      { x: 240, y: 800, w: 320, h: 38, kind: 'bunker' },
      { x: 240, y: 620, w: 290, h: 38, kind: 'bunker' },
      { x: 250, y: 440, w: 260, h: 36, kind: 'bunker' },
      { x: 240, y: 476, w: 34, h: 324, kind: 'bunker' },

      // 2. COMMAND COMPOUND (Mid-Map Walled Base with Multiple Entry Gates at x: 1920..2680)
      { x: 1920, y: 780, w: 760, h: 42, kind: 'bunker' },
      { x: 1920, y: 822, w: 42, h: 86, kind: 'bunker' }, // West upper gate pillar
      { x: 2638, y: 822, w: 42, h: 86, kind: 'bunker' }, // East upper gate pillar
      { x: 2040, y: 600, w: 520, h: 40, kind: 'bunker' },
      { x: 2278, y: 640, w: 44, h: 74, kind: 'bunker' }, // Central inner compound divider

      // 3. RADAR STATION (Top-Lane Jetpack-Only High Radar Dish Perch at x: 2040..2560, y: 260..380)
      { x: 2080, y: 340, w: 440, h: 36, kind: 'bunker' },
      { x: 2280, y: 376, w: 40, h: 90, kind: 'bunker' },

      // 4. SUPPLY DEPOT (East Logistics Compound + Military Trucks & Crates at x: 3540..4280)
      { x: 3560, y: 780, w: 700, h: 42, kind: 'bunker' },
      { x: 3560, y: 822, w: 40, h: 86, kind: 'bunker' },
      { x: 4220, y: 822, w: 40, h: 86, kind: 'bunker' },
      { x: 3680, y: 600, w: 460, h: 38, kind: 'bunker' },

      // Supply Depot Armored Trucks & Cover Crates
      { x: 3660, y: 906, w: 140, h: 74, kind: 'crate' },
      { x: 3980, y: 906, w: 140, h: 74, kind: 'crate' },
      { x: 1020, y: 924, w: 76, h: 56, kind: 'crate' },
      { x: 1520, y: 1234, w: 76, h: 56, kind: 'crate' },
      { x: 3020, y: 1234, w: 76, h: 56, kind: 'crate' },
    ],
    platforms: [
      // Top-Lane Jetpack & Sniper Dune Ledges leading to Radar Station
      { x: 270, y: 290, w: 210, style: 'dune_ledge' },
      { x: 740, y: 520, w: 280, style: 'dune_ledge' },
      { x: 1240, y: 420, w: 320, style: 'dune_ledge' },
      { x: 1680, y: 340, w: 260, style: 'catwalk' },
      { x: 2140, y: 210, w: 320, style: 'catwalk' }, // Radar Dish Apex Sniper Nest
      { x: 2660, y: 340, w: 260, style: 'catwalk' },
      { x: 3040, y: 420, w: 320, style: 'dune_ledge' },
      // Mid-Lane & Buried Bunker Access Ramps
      { x: 960, y: 740, w: 260, style: 'dune_ledge' },
      { x: 1180, y: 1120, w: 220, style: 'catwalk' },
      { x: 1960, y: 1150, w: 240, style: 'catwalk' },
      { x: 2420, y: 1150, w: 240, style: 'catwalk' },
      { x: 3180, y: 1120, w: 220, style: 'catwalk' },
      { x: 3740, y: 440, w: 320, style: 'scaffold' },
    ],
    spawns: [
      { x: 140, y: 900, team: 'alpha' },
      { x: 380, y: 730, team: 'alpha' },
      { x: 380, y: 550, team: 'alpha' },
      { x: 760, y: 920, team: 'alpha' },
      { x: 4460, y: 900, team: 'bravo' },
      { x: 3910, y: 710, team: 'bravo' },
      { x: 3910, y: 530, team: 'bravo' },
      { x: 3450, y: 900, team: 'bravo' },
      { x: 2300, y: 710, team: 'ffa' },
      { x: 2300, y: 530, team: 'ffa' },
      { x: 2300, y: 270, team: 'ffa' },
      { x: 1420, y: 1220, team: 'ffa' },
      { x: 3160, y: 1220, team: 'ffa' },
      { x: 3910, y: 710, team: 'ffa' },
    ],
    pickups: [
      // Alpha Oasis Tower & Oasis Pool
      { x: 370, y: 260, kind: 'weapon_sniper' },
      { x: 380, y: 410, kind: 'weapon_tavor' },
      { x: 770, y: 920, kind: 'medkit' },
      // Radar Station (Jetpack-Only Sniper Nest)
      { x: 2300, y: 180, kind: 'weapon_sniper' },
      { x: 2300, y: 310, kind: 'armor' },
      // Command Compound (Mid-Map Walled Base: Ammo + Armor + Heavy Guns)
      { x: 2140, y: 570, kind: 'armor' },
      { x: 2460, y: 570, kind: 'ammo' },
      { x: 2300, y: 750, kind: 'weapon_lmg' },
      { x: 2100, y: 950, kind: 'ammo' },
      { x: 2500, y: 950, kind: 'armor' },
      // Buried Bunker (Underground Tunnel: Shotgun & SMG Close Combat)
      { x: 1380, y: 1260, kind: 'weapon_shotgun' },
      { x: 2080, y: 1120, kind: 'weapon_uzi' },
      { x: 2540, y: 1120, kind: 'weapon_smg' },
      { x: 3200, y: 1260, kind: 'weapon_shotgun' },
      { x: 2300, y: 1260, kind: 'medkit' },
      // Supply Depot (Crates & Trucks: Exposed Rocket Launcher & GL Spawn)
      { x: 3900, y: 410, kind: 'weapon_rocket' },
      { x: 3910, y: 570, kind: 'weapon_gl' },
      { x: 3830, y: 750, kind: 'weapon_ak47' },
      { x: 4120, y: 750, kind: 'armor' },
      { x: 3830, y: 950, kind: 'medkit' },
    ],
  },

  urban: {
    id: 'urban',
    name: 'Urban Ruins',
    tagline: '5-story collapsed skyscraper, dark metro flank, rooftop jump pads, gas station trap & hospital ward',
    strategySummary:
      '3-Lane Vertical City Siege: TOP — Jetpack floor-by-floor up the 5-Story Collapsed Skyscraper or ride the Rooftop Row Jump Pads across 3 connected roofs. MID — Detonate the Gas Station chain-explosion barrel trap or fight over concentrated Medkits in Hospital Ruins. BOTTOM — Flank through the dark Underground Metro Station. Blast Destructible Walls with Rockets!',
    specialMechanicLabel: 'DESTRUCTIBLE WALLS · GAS BARREL TRAP · JUMP PADS',
    width: 4500,
    height: 1650,
    palette: {
      skyTop: '#090D16',
      skyBottom: '#1E293B',
      sunColor: '#F43F5E',
      mountainFar: '#111827',
      mountainNear: '#1E293B',
      terrainFill: '#334155',
      terrainStroke: '#090D16',
      terrainTop: '#64748B',
      bunkerFill: '#475569',
      platformFill: '#94A3B8',
      accent: '#F43F5E',
    },
    buildings: [
      {
        id: 'urban-collapsed-skyscraper',
        name: 'COLLAPSED SKYSCRAPER',
        style: 'collapsed_skyscraper',
        x: 200,
        y: 180,
        w: 560,
        h: 800,
        role: '5-Story Broken High-Rise · Jetpack Floor-to-Floor Vertical Climb',
      },
      {
        id: 'urban-metro-station',
        name: 'METRO STATION',
        style: 'metro_station',
        x: 1140,
        y: 1030,
        w: 2220,
        h: 350,
        role: 'Dark Underground Subway · Flashlight/NVG Flank Tunnel',
      },
      {
        id: 'urban-rooftop-row',
        name: 'ROOFTOP ROW',
        style: 'rooftop_row',
        x: 1080,
        y: 340,
        w: 1520,
        h: 380,
        role: '3 Interconnected Building Roofs · Zip-Lines & Jump Pads',
      },
      {
        id: 'urban-gas-station',
        name: 'GAS STATION',
        style: 'gas_station',
        x: 2740,
        y: 660,
        w: 660,
        h: 320,
        role: 'Explosive Fuel Barrels · Chain-Explosion Trap & Heavy Loot',
      },
      {
        id: 'urban-hospital-ruins',
        name: 'HOSPITAL RUINS',
        style: 'hospital_ruins',
        x: 3600,
        y: 440,
        w: 680,
        h: 540,
        role: 'Concentrated Medkit Ward · High-Contention Healing Zone',
      },
    ],
    zones: [
      {
        id: 'urban-jump-pad-1',
        kind: 'jump_pad',
        label: 'ROOFTOP JUMP PAD ALPHA',
        x: 1020,
        y: 952,
        w: 96,
        h: 28,
        value: -940,
      },
      {
        id: 'urban-jump-pad-2',
        kind: 'jump_pad',
        label: 'ROOFTOP ZIPLINE BOOSTER',
        x: 1520,
        y: 492,
        w: 92,
        h: 28,
        value: -780,
      },
      {
        id: 'urban-jump-pad-3',
        kind: 'jump_pad',
        label: 'SKYLINE LAUNCH PAD',
        x: 2040,
        y: 492,
        w: 92,
        h: 28,
        value: -780,
      },
      {
        id: 'urban-metro-dark',
        kind: 'metro_dark',
        label: 'METRO UNDERGROUND NIGHT-VISION ZONE',
        x: 1140,
        y: 1030,
        w: 2220,
        h: 350,
      },
    ],
    destructibles: [
      // Destructible Cracked Concrete Walls (Rocket = instant breach, Bullets = chip down)
      {
        id: 'urban-wall-1',
        kind: 'destructible_wall',
        label: 'SKYSCRAPER BREACH WALL',
        x: 680,
        y: 718,
        w: 38,
        h: 112,
        maxHp: 90,
      },
      {
        id: 'urban-wall-2',
        kind: 'destructible_wall',
        label: 'ROOFTOP BARRICADE WEST',
        x: 1460,
        y: 618,
        w: 38,
        h: 102,
        maxHp: 90,
      },
      {
        id: 'urban-wall-3',
        kind: 'destructible_wall',
        label: 'ROOFTOP BARRICADE EAST',
        x: 2180,
        y: 618,
        w: 38,
        h: 102,
        maxHp: 90,
      },
      {
        id: 'urban-wall-4',
        kind: 'destructible_wall',
        label: 'METRO TUNNEL BULKHEAD',
        x: 2230,
        y: 1140,
        w: 40,
        h: 160,
        maxHp: 90,
      },
      {
        id: 'urban-wall-5',
        kind: 'destructible_wall',
        label: 'HOSPITAL WARD WALL',
        x: 3620,
        y: 848,
        w: 38,
        h: 132,
        maxHp: 90,
      },
      // Gas Station Explosive Barrels (Chain Explosion Trap!)
      {
        id: 'urban-barrel-1',
        kind: 'explosive_barrel',
        label: 'FUEL PUMP BARREL',
        x: 2880,
        y: 924,
        w: 34,
        h: 54,
        maxHp: 35,
      },
      {
        id: 'urban-barrel-2',
        kind: 'explosive_barrel',
        label: 'FUEL PUMP BARREL',
        x: 2955,
        y: 924,
        w: 34,
        h: 54,
        maxHp: 35,
      },
      {
        id: 'urban-barrel-3',
        kind: 'explosive_barrel',
        label: 'FUEL PUMP BARREL',
        x: 3030,
        y: 924,
        w: 34,
        h: 54,
        maxHp: 35,
      },
      {
        id: 'urban-barrel-4',
        kind: 'explosive_barrel',
        label: 'CANOPY FUEL DRUM',
        x: 3110,
        y: 924,
        w: 34,
        h: 54,
        maxHp: 35,
      },
    ],
    solids: [
      { x: -80, y: 0, w: 80, h: 1650, kind: 'wall' },
      { x: 4500, y: 0, w: 80, h: 1650, kind: 'wall' },
      { x: 0, y: -80, w: 4500, h: 80, kind: 'wall' },

      // West & East Street Level +Collapsed Roadway Slabs over the Underground Metro Station
      { x: 0, y: 980, w: 1160, h: 670, kind: 'ground' },
      { x: 1340, y: 980, w: 740, h: 50, kind: 'bunker' },
      { x: 2280, y: 980, w: 760, h: 50, kind: 'bunker' },
      { x: 3240, y: 980, w: 1260, h: 670, kind: 'ground' },

      // Underground Metro Station Floor & Subway Pillars (Bottom Dark Flank Lane y: 1030..1300)
      { x: 1160, y: 1300, w: 2080, h: 350, kind: 'ground' },
      { x: 1680, y: 1120, w: 38, h: 110, kind: 'bunker' },
      { x: 2760, y: 1120, w: 38, h: 110, kind: 'bunker' },

      // 1. COLLAPSED SKYSCRAPER (5 Broken Staggered Floors at x: 200..760 for Jetpack Floor-to-Floor Climb)
      { x: 200, y: 830, w: 320, h: 36, kind: 'bunker' }, // Story 1 (Broken Right Gap)
      { x: 380, y: 690, w: 360, h: 36, kind: 'bunker' }, // Story 2 (Broken Left Gap)
      { x: 200, y: 550, w: 330, h: 36, kind: 'bunker' }, // Story 3 (Broken Right Gap)
      { x: 360, y: 410, w: 370, h: 36, kind: 'bunker' }, // Story 4 (Broken Left Gap)
      { x: 220, y: 260, w: 380, h: 36, kind: 'bunker' }, // Story 5 Penthouse Sniper Roof
      { x: 200, y: 296, w: 34, h: 534, kind: 'bunker' }, // Outer structural spine wall

      // 2. ROOFTOP ROW (3 Distinct Building Roofs Connected by Zip-Lines & Jump Pads at x: 1080..2600)
      // Roof A (West Tower Roof)
      { x: 1100, y: 720, w: 380, h: 40, kind: 'bunker' },
      { x: 1120, y: 520, w: 340, h: 36, kind: 'bunker' },
      // Roof B (Center Tower Roof)
      { x: 1640, y: 720, w: 400, h: 40, kind: 'bunker' },
      { x: 1660, y: 520, w: 360, h: 36, kind: 'bunker' },
      // Roof C (East Tower Roof)
      { x: 2200, y: 720, w: 380, h: 40, kind: 'bunker' },
      { x: 2220, y: 520, w: 340, h: 36, kind: 'bunker' },

      // 3. GAS STATION (Canopy Roof & Pump Pillars at x: 2740..3400)
      { x: 2760, y: 740, w: 600, h: 38, kind: 'bunker' },
      { x: 2820, y: 778, w: 34, h: 120, kind: 'bunker' },
      { x: 3260, y: 778, w: 34, h: 120, kind: 'bunker' },

      // 4. HOSPITAL RUINS (3-Story Medical Wing at x: 3600..4280)
      { x: 3620, y: 810, w: 640, h: 38, kind: 'bunker' },
      { x: 3660, y: 630, w: 560, h: 38, kind: 'bunker' },
      { x: 3720, y: 460, w: 460, h: 36, kind: 'bunker' },
      { x: 4224, y: 496, w: 36, h: 314, kind: 'bunker' },

      // Rubble & Collapsed Concrete Blocks
      { x: 880, y: 920, w: 80, h: 60, kind: 'crate' },
      { x: 1940, y: 1240, w: 84, h: 60, kind: 'crate' },
      { x: 3440, y: 920, w: 80, h: 60, kind: 'crate' },
    ],
    platforms: [
      // Zip-Line & Catwalk Bridges linking the 3 Roofs of Rooftop Row
      { x: 800, y: 540, w: 260, style: 'zipline' },
      { x: 1470, y: 520, w: 180, style: 'zipline' },
      { x: 2030, y: 520, w: 180, style: 'zipline' },
      { x: 2600, y: 560, w: 240, style: 'zipline' },
      // Metro Subway Drop Platforms
      { x: 1180, y: 1130, w: 200, style: 'concrete_slab' },
      { x: 2090, y: 1130, w: 200, style: 'concrete_slab' },
      { x: 2980, y: 1130, w: 220, style: 'concrete_slab' },
      // Hospital & Gas Station Upper Scaffolds
      { x: 2920, y: 560, w: 280, style: 'scaffold' },
      { x: 3820, y: 310, w: 260, style: 'scaffold' },
    ],
    spawns: [
      { x: 120, y: 900, team: 'alpha' },
      { x: 340, y: 760, team: 'alpha' },
      { x: 520, y: 620, team: 'alpha' },
      { x: 1280, y: 650, team: 'alpha' },
      { x: 4380, y: 900, team: 'bravo' },
      { x: 3920, y: 740, team: 'bravo' },
      { x: 3920, y: 560, team: 'bravo' },
      { x: 3060, y: 670, team: 'bravo' },
      { x: 1840, y: 450, team: 'ffa' },
      { x: 410, y: 190, team: 'ffa' },
      { x: 1520, y: 1220, team: 'ffa' },
      { x: 2900, y: 1220, team: 'ffa' },
      { x: 3920, y: 390, team: 'ffa' },
    ],
    pickups: [
      // Collapsed Skyscraper (5-Story Tower: Sniper on 5th Floor, Shotgun & Sawgun inside floors)
      { x: 410, y: 230, kind: 'weapon_sniper' },
      { x: 540, y: 380, kind: 'weapon_tavor' },
      { x: 360, y: 520, kind: 'weapon_sawgun' },
      { x: 540, y: 660, kind: 'weapon_shotgun' },
      { x: 360, y: 800, kind: 'armor' },
      // Rooftop Row (3 Connected Roofs)
      { x: 1290, y: 490, kind: 'weapon_ak47' },
      { x: 1840, y: 490, kind: 'weapon_rocket' },
      { x: 2390, y: 490, kind: 'weapon_lmg' },
      { x: 1840, y: 690, kind: 'armor' },
      // Underground Metro Station (Dark Flank Route: SMGs & Grenade Launcher)
      { x: 1460, y: 1270, kind: 'weapon_uzi' },
      { x: 2180, y: 1100, kind: 'weapon_gl' },
      { x: 2940, y: 1270, kind: 'weapon_smg' },
      // Gas Station (Risk vs Reward: Rocket & Sawgun right beside Explosive Barrels!)
      { x: 3000, y: 945, kind: 'weapon_rocket' },
      { x: 3060, y: 710, kind: 'weapon_sawgun' },
      // Hospital Ruins (Concentrated Medkits + Armor where everyone fights!)
      { x: 3820, y: 950, kind: 'medkit' },
      { x: 4060, y: 950, kind: 'medkit' },
      { x: 3940, y: 780, kind: 'medkit' },
      { x: 3940, y: 600, kind: 'medkit' },
      { x: 3940, y: 430, kind: 'armor' },
      { x: 3950, y: 280, kind: 'weapon_sniper' },
    ],
  },

  hangar: {
    id: 'hangar',
    name: 'Military Hangar',
    tagline: 'Fighter jet wreck floor, high catwalk network, switch-locked armory vault, control tower & conveyor belts',
    strategySummary:
      '3-Lane Industrial Hangar Operations: TOP — Climb the towering Control Tower or traverse the full-span Catwalk Network for sniper highground. MID — Ride the motorized Conveyor Belts across the Main Hangar Floor using the Fighter Jet Wreck as cover, or detonate the Fuel Depot fire trap. BOTTOM — Trigger the Vault Switch to open the locked Armory Vault!',
    specialMechanicLabel: 'CONVEYOR BELTS · VAULT SWITCH · FUEL FIRE ZONE',
    width: 4400,
    height: 1560,
    palette: {
      skyTop: '#090D16',
      skyBottom: '#1E293B',
      sunColor: '#38BDF8',
      mountainFar: '#0F172A',
      mountainNear: '#1E293B',
      terrainFill: '#27303F',
      terrainStroke: '#090D16',
      terrainTop: '#475569',
      bunkerFill: '#3B4758',
      platformFill: '#D97706',
      accent: '#38BDF8',
    },
    buildings: [
      {
        id: 'hangar-control-tower',
        name: 'CONTROL TOWER',
        style: 'control_tower',
        x: 200,
        y: 180,
        w: 460,
        h: 780,
        role: 'Highest Point in Map · Panoramic Hangar Sniper Overwatch',
      },
      {
        id: 'hangar-catwalk-network',
        name: 'CATWALK NETWORK',
        style: 'catwalk_network',
        x: 840,
        y: 280,
        w: 2620,
        h: 220,
        role: 'Overhead Steel Gantry Walkways · Top-Lane Sniper Highground',
      },
      {
        id: 'hangar-main-floor',
        name: 'MAIN HANGAR FLOOR',
        style: 'main_hangar_floor',
        x: 1320,
        y: 580,
        w: 1760,
        h: 380,
        role: 'Open Aircraft Deck · Fighter Jet Wreck Cover & Conveyor Belts',
      },
      {
        id: 'hangar-armory-vault',
        name: 'ARMORY VAULT',
        style: 'armory_vault',
        x: 1920,
        y: 980,
        w: 560,
        h: 260,
        role: 'Switch-Locked Security Room · Best Weapons Inside (RPG, Sawgun, Sniper)',
      },
      {
        id: 'hangar-fuel-depot',
        name: 'FUEL DEPOT',
        style: 'fuel_depot',
        x: 3520,
        y: 540,
        w: 680,
        h: 420,
        role: 'Volatile Barrel Zone & Burning Fire Damage-Over-Time Grate',
      },
    ],
    zones: [
      {
        id: 'hangar-conveyor-west',
        kind: 'conveyor_right',
        label: 'CONVEYOR BELT EASTBOUND (+185 PX/S)',
        x: 920,
        y: 940,
        w: 760,
        h: 26,
        value: 185,
      },
      {
        id: 'hangar-conveyor-east',
        kind: 'conveyor_left',
        label: 'CONVEYOR BELT WESTBOUND (-185 PX/S)',
        x: 2720,
        y: 940,
        w: 760,
        h: 26,
        value: -185,
      },
      {
        id: 'hangar-conveyor-upper',
        kind: 'conveyor_right',
        label: 'GANTRY CARGO CONVEYOR (+165 PX/S)',
        x: 1860,
        y: 722,
        w: 680,
        h: 24,
        value: 165,
      },
      {
        id: 'hangar-vault-switch',
        kind: 'vault_switch',
        label: 'ARMORY VAULT OVERRIDE SWITCH (TOUCH OR SHOOT)',
        x: 2150,
        y: 900,
        w: 100,
        h: 60,
      },
      {
        id: 'hangar-fire-hazard',
        kind: 'fire_hazard',
        label: 'FUEL DEPOT BURNING DECK (12 DMG/S)',
        x: 3680,
        y: 932,
        w: 360,
        h: 34,
        value: 12,
      },
    ],
    destructibles: [
      // Armory Vault Blast Doors (Unlocked for 20s by triggering the Vault Switch, or breached by heavy fire)
      {
        id: 'hangar-vault-door-west',
        kind: 'vault_door',
        label: 'VAULT BLAST DOOR WEST',
        x: 1920,
        y: 1012,
        w: 38,
        h: 188,
        maxHp: 320,
      },
      {
        id: 'hangar-vault-door-east',
        kind: 'vault_door',
        label: 'VAULT BLAST DOOR EAST',
        x: 2442,
        y: 1012,
        w: 38,
        h: 188,
        maxHp: 320,
      },
      // Fuel Depot Volatile Barrels
      {
        id: 'hangar-barrel-1',
        kind: 'explosive_barrel',
        label: 'JP-8 AVIATION FUEL DRUM',
        x: 3640,
        y: 904,
        w: 34,
        h: 54,
        maxHp: 35,
      },
      {
        id: 'hangar-barrel-2',
        kind: 'explosive_barrel',
        label: 'JP-8 AVIATION FUEL DRUM',
        x: 3840,
        y: 904,
        w: 34,
        h: 54,
        maxHp: 35,
      },
      {
        id: 'hangar-barrel-3',
        kind: 'explosive_barrel',
        label: 'JP-8 AVIATION FUEL DRUM',
        x: 4040,
        y: 904,
        w: 34,
        h: 54,
        maxHp: 35,
      },
    ],
    solids: [
      { x: -80, y: 0, w: 80, h: 1560, kind: 'wall' },
      { x: 4400, y: 0, w: 80, h: 1560, kind: 'wall' },
      { x: 0, y: -80, w: 4400, h: 80, kind: 'wall' },

      // Main Hangar Floor & Sub-Deck Armory Vault Pit
      { x: 0, y: 960, w: 1700, h: 600, kind: 'ground' },
      { x: 1920, y: 960, w: 560, h: 52, kind: 'bunker' }, // Armory Vault Ceiling Slab
      { x: 1700, y: 1200, w: 1000, h: 360, kind: 'ground' }, // Armory Vault Sub-Floor
      { x: 2700, y: 960, w: 1700, h: 600, kind: 'ground' },

      // 1. CONTROL TOWER (Highest Point on West Side: 4 Levels up to y = 200, x: 200..660)
      { x: 220, y: 800, w: 420, h: 38, kind: 'bunker' },
      { x: 220, y: 630, w: 380, h: 38, kind: 'bunker' },
      { x: 220, y: 460, w: 340, h: 38, kind: 'bunker' },
      { x: 220, y: 290, w: 320, h: 36, kind: 'bunker' },
      { x: 220, y: 326, w: 36, h: 474, kind: 'bunker' },

      // 2. MAIN HANGAR FLOOR & FIGHTER JET WRECK COVER (x: 1320..3080)
      { x: 1860, y: 740, w: 680, h: 42, kind: 'bunker' }, // Upper Gantry Deck above Jet Wreck
      // Crashed Fighter Jet Wreckage Hull & Wing Cover on Main Hangar Floor
      { x: 1520, y: 884, w: 180, h: 76, kind: 'crate' }, // Jet Nose & Cockpit Wreck
      { x: 2700, y: 884, w: 180, h: 76, kind: 'crate' }, // Jet Tail & Turbine Wreck

      // 3. FUEL DEPOT (East Wing Multi-Tier Storage Deck at x: 3520..4200)
      { x: 3540, y: 760, w: 640, h: 40, kind: 'bunker' },
      { x: 3620, y: 580, w: 480, h: 38, kind: 'bunker' },
      { x: 4144, y: 618, w: 36, h: 280, kind: 'bunker' },

      // Industrial Cargo Containers
      { x: 740, y: 884, w: 130, h: 76, kind: 'crate' },
    ],
    platforms: [
      // Control Tower Apex Roof (Map's Highest Overwatch Point at y = 180)
      { x: 240, y: 180, w: 260, style: 'scaffold' },
      // Overhead Catwalk Network (Full Top-Lane Sniper Highground spanning x: 840..3460)
      { x: 860, y: 340, w: 420, style: 'catwalk' },
      { x: 1380, y: 310, w: 460, style: 'catwalk' },
      { x: 1960, y: 280, w: 480, style: 'catwalk' },
      { x: 2560, y: 310, w: 460, style: 'catwalk' },
      { x: 3120, y: 340, w: 360, style: 'catwalk' },
      // Mid-Hangar Connectors & Vault Access Shafts
      { x: 960, y: 640, w: 320, style: 'catwalk' },
      { x: 1420, y: 540, w: 340, style: 'catwalk' },
      { x: 2640, y: 540, w: 340, style: 'catwalk' },
      { x: 3100, y: 640, w: 320, style: 'catwalk' },
      { x: 1720, y: 1060, w: 170, style: 'bridge' },
      { x: 2510, y: 1060, w: 170, style: 'bridge' },
      { x: 3720, y: 420, w: 280, style: 'scaffold' },
    ],
    spawns: [
      { x: 120, y: 890, team: 'alpha' },
      { x: 380, y: 730, team: 'alpha' },
      { x: 380, y: 560, team: 'alpha' },
      { x: 1120, y: 890, team: 'alpha' },
      { x: 4280, y: 890, team: 'bravo' },
      { x: 3860, y: 690, team: 'bravo' },
      { x: 3860, y: 510, team: 'bravo' },
      { x: 3280, y: 890, team: 'bravo' },
      { x: 2200, y: 670, team: 'ffa' },
      { x: 2200, y: 210, team: 'ffa' },
      { x: 370, y: 220, team: 'ffa' },
      { x: 1600, y: 810, team: 'ffa' },
      { x: 2800, y: 810, team: 'ffa' },
    ],
    pickups: [
      // Control Tower (Highest Point on Map)
      { x: 370, y: 150, kind: 'weapon_sniper' },
      { x: 370, y: 260, kind: 'armor' },
      { x: 380, y: 430, kind: 'weapon_tavor' },
      // Catwalk Network (Sniper & Assault Highground)
      { x: 1070, y: 310, kind: 'weapon_ak47' },
      { x: 2200, y: 250, kind: 'weapon_sniper' },
      { x: 3300, y: 310, kind: 'weapon_lmg' },
      // Main Hangar Floor & Fighter Jet Wreck
      { x: 1610, y: 850, kind: 'weapon_shotgun' },
      { x: 2200, y: 710, kind: 'weapon_lmg' },
      { x: 2790, y: 850, kind: 'weapon_uzi' },
      { x: 1320, y: 930, kind: 'medkit' },
      { x: 3080, y: 930, kind: 'medkit' },
      // Armory Vault (Locked Room — Best Weapons inside!)
      { x: 2060, y: 1170, kind: 'weapon_rocket' },
      { x: 2200, y: 1170, kind: 'weapon_sawgun' },
      { x: 2340, y: 1170, kind: 'weapon_gl' },
      { x: 2200, y: 1110, kind: 'armor' },
      // Fuel Depot (Risk vs Reward Zone)
      { x: 3860, y: 390, kind: 'weapon_rocket' },
      { x: 3860, y: 550, kind: 'armor' },
      { x: 3860, y: 730, kind: 'medkit' },
    ],
  },

  island: {
    id: 'island',
    name: 'Island Fortress',
    tagline: '4-tower central stone castle, tall coastal lighthouse, pirate dock, under-island cave grotto & rising tide',
    strategySummary:
      '3-Lane Archipelago & Tidal Siege: TOP — Ascend the West Lighthouse for 360° Sniper view or claim the 4 Corner Towers of the Main Fortress. MID — Cross the Rope Bridges between Bridge Outposts or storm the Pirate Dock ship cover with Shotguns. BOTTOM — Flank through the hidden under-island Cave Grotto. Beware Ocean Water damage and High Tide bridge submersion!',
    specialMechanicLabel: 'OCEAN WATER HAZARD & TIDAL BRIDGE SUBMERSION',
    width: 4800,
    height: 1680,
    palette: {
      skyTop: '#082F49',
      skyBottom: '#0284C7',
      sunColor: '#FDE047',
      mountainFar: '#0C4A6E',
      mountainNear: '#155E75',
      terrainFill: '#44403C',
      terrainStroke: '#0C0A09',
      terrainTop: '#14B8A6',
      bunkerFill: '#57534E',
      platformFill: '#92400E',
      accent: '#2DD4BF',
    },
    buildings: [
      {
        id: 'island-lighthouse',
        name: 'LIGHTHOUSE',
        style: 'lighthouse_hq',
        x: 200,
        y: 160,
        w: 400,
        h: 820,
        role: 'West Island Beacon · Sniper Heaven & 360° Archipelago View',
      },
      {
        id: 'island-bridge-outposts',
        name: 'BRIDGE OUTPOSTS',
        style: 'bridge_outpost',
        x: 1040,
        y: 580,
        w: 540,
        h: 400,
        role: 'Rope-Bridge Gatehouse Bunkers & Mid-Channel Checkpoints',
      },
      {
        id: 'island-main-fortress',
        name: 'MAIN FORTRESS',
        style: 'main_fortress',
        x: 1880,
        y: 380,
        w: 1040,
        h: 580,
        role: 'Central Stone Castle · 4 Corner Towers & Heavy Ordnance Courtyard',
      },
      {
        id: 'island-cave-grotto',
        name: 'CAVE GROTTO',
        style: 'cave_grotto',
        x: 1920,
        y: 1000,
        w: 960,
        h: 270,
        role: 'Hidden Under-Island Sea Cavern · Secret Flank Route',
      },
      {
        id: 'island-pirate-dock',
        name: 'PIRATE DOCK',
        style: 'pirate_dock',
        x: 3880,
        y: 620,
        w: 720,
        h: 360,
        role: 'Anchored Pirate Gunboat & Timber Pier · Shotgun CQB Zone',
      },
    ],
    zones: [
      {
        id: 'island-ocean-water',
        kind: 'water_hazard',
        label: 'TIDAL OCEAN WATER (SLOW + 14 DMG/S · HIGH TIDE SUBMERGES LOW BRIDGES)',
        x: 0,
        y: 1120,
        w: 4800,
        h: 560,
        value: 14,
      },
    ],
    solids: [
      { x: -80, y: 0, w: 80, h: 1680, kind: 'wall' },
      { x: 4800, y: 0, w: 80, h: 1680, kind: 'wall' },
      { x: 0, y: -80, w: 4800, h: 80, kind: 'wall' },

      // 5 Distinct Archipelago Islands separated by open Ocean Water Channels!
      // Island 1 (West Lighthouse Island, x: 0..680)
      { x: 0, y: 980, w: 680, h: 700, kind: 'ground' },
      // Ocean Channel 1 Seabed (x: 680..1040)
      { x: 680, y: 1360, w: 360, h: 320, kind: 'ground' },
      // Island 2 (West Bridge Outpost Atoll, x: 1040..1580)
      { x: 1040, y: 980, w: 540, h: 700, kind: 'ground' },
      // Ocean Channel 2 Seabed (x: 1580..1880)
      { x: 1580, y: 1360, w: 300, h: 320, kind: 'ground' },
      // Island 3 (Central Main Fortress Roof Slab + Hidden Under-Island Cave Grotto below it! x: 1880..2920)
      { x: 1880, y: 960, w: 340, h: 48, kind: 'bunker' }, // West Castle Courtyard Slab (leaves central drop shaft to Grotto)
      { x: 2580, y: 960, w: 340, h: 48, kind: 'bunker' }, // East Castle Courtyard Slab
      { x: 1880, y: 1250, w: 1040, h: 430, kind: 'ground' }, // Cave Grotto Dry Cavern Floor above high tide
      // Ocean Channel 3 Seabed (x: 2920..3220)
      { x: 2920, y: 1360, w: 300, h: 320, kind: 'ground' },
      // Island 4 (East Bridge Outpost Atoll, x: 3220..3760)
      { x: 3220, y: 980, w: 540, h: 700, kind: 'ground' },
      // Ocean Channel 4 Seabed (x: 3760..3880)
      { x: 3760, y: 1360, w: 120, h: 320, kind: 'ground' },
      // Island 5 (East Pirate Dock & Gunboat Wharf, x: 3880..4800)
      { x: 3880, y: 980, w: 920, h: 700, kind: 'ground' },

      // 1. LIGHTHOUSE (West Side Towering 4-Story Sniper Tower at x: 200..600)
      { x: 220, y: 800, w: 340, h: 38, kind: 'bunker' },
      { x: 230, y: 620, w: 310, h: 38, kind: 'bunker' },
      { x: 240, y: 440, w: 280, h: 36, kind: 'bunker' },
      { x: 250, y: 260, w: 260, h: 36, kind: 'bunker' },

      // 2. BRIDGE OUTPOSTS (West at x: 1060..1560 & East at x: 3240..3740)
      { x: 1080, y: 780, w: 460, h: 40, kind: 'bunker' },
      { x: 1080, y: 820, w: 38, h: 90, kind: 'bunker' },
      { x: 1502, y: 820, w: 38, h: 90, kind: 'bunker' },
      { x: 1140, y: 600, w: 340, h: 36, kind: 'bunker' },

      { x: 3260, y: 780, w: 460, h: 40, kind: 'bunker' },
      { x: 3260, y: 820, w: 38, h: 90, kind: 'bunker' },
      { x: 3682, y: 820, w: 38, h: 90, kind: 'bunker' },
      { x: 3320, y: 600, w: 340, h: 36, kind: 'bunker' },

      // 3. MAIN FORTRESS (Central Stone Castle with 4 Distinct Corner Towers at x: 1880..2920)
      // Lower SW & SE Corner Towers
      { x: 1900, y: 740, w: 320, h: 42, kind: 'bunker' }, // SW Tower Floor
      { x: 2580, y: 740, w: 320, h: 42, kind: 'bunker' }, // SE Tower Floor
      { x: 1900, y: 782, w: 42, h: 100, kind: 'bunker' },
      { x: 2858, y: 782, w: 42, h: 100, kind: 'bunker' },
      // Upper NW & NE Corner Towers
      { x: 1900, y: 520, w: 300, h: 40, kind: 'bunker' }, // NW Corner Tower
      { x: 2600, y: 520, w: 300, h: 40, kind: 'bunker' }, // NE Corner Tower
      // Central Keep High Altar (Risk-vs-Reward Exposed Best Weapon Platform)
      { x: 2220, y: 620, w: 360, h: 40, kind: 'bunker' },

      // 4. PIRATE DOCK (Anchored Gunboat Ship Hull & Pier Cover at x: 3880..4600)
      { x: 3920, y: 800, w: 620, h: 40, kind: 'bunker' }, // Ship Main Deck
      { x: 3960, y: 840, w: 44, h: 90, kind: 'bunker' }, // Bow Bulkhead
      { x: 4496, y: 840, w: 44, h: 90, kind: 'bunker' }, // Stern Bulkhead
      { x: 4100, y: 640, w: 300, h: 36, kind: 'bunker' }, // Captain's Quarterdeck
      { x: 4020, y: 904, w: 120, h: 76, kind: 'crate' }, // Dock Cargo Chests
      { x: 4320, y: 904, w: 120, h: 76, kind: 'crate' },
    ],
    platforms: [
      // Lighthouse 360° Lantern Gallery Apex
      { x: 270, y: 140, w: 220, style: 'catwalk' },
      // High Suspension Rope Bridges (Stay dry above High Tide)
      { x: 640, y: 720, w: 440, style: 'rope_bridge' },
      { x: 1540, y: 680, w: 360, style: 'rope_bridge' },
      { x: 2240, y: 380, w: 320, style: 'catwalk' }, // Main Fortress Crown Bridge
      { x: 2900, y: 680, w: 360, style: 'rope_bridge' },
      { x: 3720, y: 720, w: 220, style: 'rope_bridge' },
      // Low Tidal Rope Bridges across Ocean Channels (Submerge underwater during High Tide!)
      { x: 680, y: 1095, w: 360, style: 'rope_bridge', submergesAtHighTide: true },
      { x: 1580, y: 1095, w: 300, style: 'rope_bridge', submergesAtHighTide: true },
      { x: 2920, y: 1095, w: 300, style: 'rope_bridge', submergesAtHighTide: true },
      // Cave Grotto Interior Stepping Ledge
      { x: 2260, y: 1110, w: 280, style: 'bridge' },
    ],
    spawns: [
      { x: 140, y: 900, team: 'alpha' },
      { x: 380, y: 730, team: 'alpha' },
      { x: 380, y: 370, team: 'alpha' },
      { x: 1310, y: 710, team: 'alpha' },
      { x: 4640, y: 900, team: 'bravo' },
      { x: 4230, y: 730, team: 'bravo' },
      { x: 4250, y: 570, team: 'bravo' },
      { x: 3490, y: 710, team: 'bravo' },
      { x: 2400, y: 550, team: 'ffa' },
      { x: 2050, y: 450, team: 'ffa' },
      { x: 2750, y: 450, team: 'ffa' },
      { x: 2400, y: 1180, team: 'ffa' },
    ],
    pickups: [
      // Lighthouse (Sniper Heaven 360° View)
      { x: 380, y: 110, kind: 'weapon_sniper' },
      { x: 380, y: 230, kind: 'armor' },
      { x: 380, y: 410, kind: 'weapon_tavor' },
      // Bridge Outposts (West & East Rope Bridge Bunkers)
      { x: 1310, y: 570, kind: 'weapon_ak47' },
      { x: 1310, y: 950, kind: 'medkit' },
      { x: 3490, y: 570, kind: 'weapon_tavor' },
      { x: 3490, y: 950, kind: 'medkit' },
      // Main Fortress (Central Stone Castle + 4 Corner Towers + Exposed Best Weapons)
      { x: 2400, y: 350, kind: 'weapon_rocket' },
      { x: 2050, y: 490, kind: 'weapon_sniper' },
      { x: 2750, y: 490, kind: 'weapon_gl' },
      { x: 2400, y: 590, kind: 'weapon_lmg' },
      { x: 2060, y: 710, kind: 'armor' },
      { x: 2740, y: 710, kind: 'armor' },
      // Cave Grotto (Hidden Under-Island Flank Passage)
      { x: 2400, y: 1080, kind: 'weapon_sawgun' },
      { x: 2140, y: 1220, kind: 'weapon_uzi' },
      { x: 2660, y: 1220, kind: 'medkit' },
      // Pirate Dock (Boat/Ship Cover — Shotgun Zone!)
      { x: 4230, y: 770, kind: 'weapon_shotgun' },
      { x: 4250, y: 610, kind: 'weapon_shotgun' },
      { x: 4230, y: 950, kind: 'medkit' },
    ],
  },
};

export const MAP_LIST: ArenaMap[] = Object.values(MAPS);

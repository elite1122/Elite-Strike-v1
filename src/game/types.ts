export type GameModeId = 'training' | 'deathmatch' | 'tdm' | 'survival';

export type WeaponId =
  | 'pistol'
  | 'uzi'
  | 'smg'
  | 'ak47'
  | 'rifle'
  | 'tavor'
  | 'shotgun'
  | 'sniper'
  | 'lmg'
  | 'rocket'
  | 'gl'
  | 'sawgun';

export type MapId = 'forest' | 'desert' | 'urban' | 'hangar' | 'island';

export type HelmetStyle =
  | 'tactical'
  | 'commando'
  | 'recon'
  | 'heavy'
  | 'bandana'
  | 'officer';

export type EyewearStyle =
  | 'visor'
  | 'aviators'
  | 'nvg'
  | 'eyepatch'
  | 'goggles'
  | 'none';

export type SkinToneId = 'light' | 'tan' | 'bronze' | 'deep';

export type JetpackStyleId = 'amber' | 'ion' | 'emerald' | 'crimson';

export type ArmorColorId =
  | 'olive'
  | 'graphite'
  | 'sand'
  | 'crimson'
  | 'cobalt'
  | 'tiger'
  | 'arctic'
  | 'emerald';

export type TeamId = 'alpha' | 'bravo' | 'ffa';

export type BotArchetype = 'dummy' | 'assault' | 'flanker' | 'heavy' | 'sniper';

export interface PlayerProfile {
  callsign: string;
  helmet: HelmetStyle;
  eyewear?: EyewearStyle;
  skinTone?: SkinToneId;
  jetpackStyle?: JetpackStyleId;
  armorColor: ArmorColorId;
  primaryWeapon: WeaponId;
  secondaryWeapon: WeaponId;
  xp: number;
  kills: number;
  deaths: number;
  wins: number;
  matches: number;
}

export type DraggableControlId =
  | 'moveStick'
  | 'grenadeBtn'
  | 'meleeBtn'
  | 'fireStick'
  | 'scopeBtn';

export interface ControlPosition {
  xPct: number;
  yPct: number;
}

export type CustomControlLayout = Record<DraggableControlId, ControlPosition>;

export interface ControlSettings {
  touchControls: 'auto' | 'always' | 'off';
  controlOpacity: number;
  aimAssist: boolean;
  sfxVolume: number;
  muted: boolean;
  controlLayout: CustomControlLayout;
}

export type WeaponCategory =
  | 'Sidearm'
  | 'SMG'
  | 'Assault'
  | 'Shotgun'
  | 'Sniper'
  | 'Heavy'
  | 'Special';

export type ProjectileKind = 'bullet' | 'rocket' | 'saw' | 'grenade_shell';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  shortName: string;
  role: string;
  category: WeaponCategory;
  damage: number;
  pellets: number;
  fireRateMs: number;
  magSize: number;
  reserveMax: number;
  reloadMs: number;
  projectileSpeed: number;
  spreadRad: number;
  recoilKick: number;
  knockback: number;
  rangePx: number;
  automatic: boolean;
  unlockLevel: number;
  tracerColor: string;
  muzzleLength: number;
  scopeZoom: number;
  projectileKind?: ProjectileKind;
  explosiveRadius?: number;
  bounces?: number;
  gravityScale?: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: 'ground' | 'bunker' | 'crate' | 'rock' | 'wall';
}

export interface OneWayPlatform {
  x: number;
  y: number;
  w: number;
  style?:
    | 'bridge'
    | 'catwalk'
    | 'scaffold'
    | 'metal'
    | 'dune_ledge'
    | 'concrete_slab'
    | 'zipline'
    | 'rope_bridge';
  submergesAtHighTide?: boolean;
}

export interface SpawnPoint {
  x: number;
  y: number;
  team: TeamId;
}

export type PickupKind =
  | 'medkit'
  | 'armor'
  | 'ammo'
  | 'grenade'
  | 'weapon_pistol'
  | 'weapon_uzi'
  | 'weapon_smg'
  | 'weapon_ak47'
  | 'weapon_rifle'
  | 'weapon_tavor'
  | 'weapon_shotgun'
  | 'weapon_sniper'
  | 'weapon_lmg'
  | 'weapon_rocket'
  | 'weapon_gl'
  | 'weapon_sawgun';

export interface PickupSpawn {
  x: number;
  y: number;
  kind: PickupKind;
}

export interface MapPalette {
  skyTop: string;
  skyBottom: string;
  sunColor: string;
  mountainFar: string;
  mountainNear: string;
  terrainFill: string;
  terrainStroke: string;
  terrainTop: string;
  bunkerFill: string;
  platformFill: string;
  accent: string;
}

export type BuildingStyle =
  | 'watchtower'
  | 'logging_mill'
  | 'bunker_hq'
  | 'desert_barracks'
  | 'oil_refinery'
  | 'radar_dome'
  | 'ruined_apt'
  | 'overpass_station'
  | 'control_tower'
  | 'fighter_bay'
  | 'sea_bastion'
  | 'lighthouse_hq'
  | 'oasis_tower'
  | 'command_compound'
  | 'buried_bunker'
  | 'radar_station'
  | 'supply_depot'
  | 'collapsed_skyscraper'
  | 'metro_station'
  | 'rooftop_row'
  | 'gas_station'
  | 'hospital_ruins'
  | 'main_hangar_floor'
  | 'catwalk_network'
  | 'armory_vault'
  | 'fuel_depot'
  | 'main_fortress'
  | 'pirate_dock'
  | 'cave_grotto'
  | 'bridge_outpost';

export interface MapBuilding {
  id: string;
  name: string;
  style: BuildingStyle;
  x: number;
  y: number;
  w: number;
  h: number;
  role: string;
  accentColor?: string;
}

export type MapZoneKind =
  | 'oasis_heal'
  | 'conveyor_left'
  | 'conveyor_right'
  | 'fire_hazard'
  | 'jump_pad'
  | 'metro_dark'
  | 'vault_switch'
  | 'water_hazard';

export interface MapZone {
  id: string;
  kind: MapZoneKind;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  value?: number;
}

export type DestructibleKind =
  | 'destructible_wall'
  | 'explosive_barrel'
  | 'vault_door';

export interface DestructibleSpawn {
  id: string;
  kind: DestructibleKind;
  x: number;
  y: number;
  w: number;
  h: number;
  maxHp: number;
  label?: string;
}

export interface DestructibleEntity extends DestructibleSpawn {
  hp: number;
  active: boolean;
  respawnTimer: number;
  hitFlashTimer: number;
}

export interface MapMechanicSnapshot {
  label: string;
  active: boolean;
  activeAlert?: boolean;
  sandstormIntensity: number;
  vaultOpen: boolean;
  vaultTimer?: number;
  highTide: boolean;
  waterY: number;
  activeDestructibles: number;
  totalDestructibles: number;
}

export interface ArenaMap {
  id: MapId;
  name: string;
  tagline: string;
  strategySummary: string;
  specialMechanicLabel: string;
  width: number;
  height: number;
  palette: MapPalette;
  buildings: MapBuilding[];
  solids: Rect[];
  platforms: OneWayPlatform[];
  spawns: SpawnPoint[];
  pickups: PickupSpawn[];
  zones?: MapZone[];
  destructibles?: DestructibleSpawn[];
}

export interface WeaponSlotState {
  weaponId: WeaponId;
  mag: number;
  reserve: number;
}

export interface SoldierEntity {
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
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  aimAngle: number;
  grounded: boolean;
  crouching: boolean;
  dropThroughTimer: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  jetpackActive: boolean;
  fuel: number;
  fuelRegenDelay: number;
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  slots: [WeaponSlotState, WeaponSlotState];
  activeSlot: 0 | 1;
  fireCooldown: number;
  reloadTimer: number;
  reloadDuration: number;
  grenades: number;
  meleeCooldown: number;
  meleeAnimTimer: number;
  hitFlashTimer: number;
  invulnTimer: number;
  squashX: number;
  squashY: number;
  walkPhase: number;
  alive: boolean;
  koTimer: number;
  respawnTimer: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  livesRemaining: number;
  lastHitBy: string | null;
  lastHitWeapon: string | null;
  telegraphTimer: number;
  telegraphAngle: number;
  aiMoveDir: number;
  aiDecisionTimer: number;
  aiJumpTimer: number;
}

export interface BulletEntity {
  id: number;
  ownerId: string;
  team: TeamId;
  weaponId: WeaponId;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  damage: number;
  knockback: number;
  life: number;
  maxLife: number;
  color: string;
  projectileKind?: ProjectileKind;
  explosiveRadius?: number;
  bouncesLeft?: number;
  gravityScale?: number;
  spinAngle?: number;
}

export interface GrenadeEntity {
  id: number;
  ownerId: string;
  team: TeamId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fuse: number;
  radius: number;
}

export interface PickupEntity {
  id: number;
  kind: PickupKind;
  x: number;
  y: number;
  active: boolean;
  respawnTimer: number;
  bobPhase: number;
}

export interface KillFeedEntry {
  id: number;
  killerName: string;
  killerTeam: TeamId;
  victimName: string;
  victimTeam: TeamId;
  weaponLabel: string;
  timestamp: number;
}

export interface WorldEvent {
  type:
    | 'shot'
    | 'hit'
    | 'explosion'
    | 'melee'
    | 'jump'
    | 'land'
    | 'reload'
    | 'pickup'
    | 'ko'
    | 'grenade_bounce';
  x: number;
  y: number;
  angle?: number;
  weaponId?: WeaponId;
  damage?: number;
  ownerId?: string;
  targetId?: string;
}

export type WeatherType = 'light_rain' | 'fog' | 'snow' | 'clear';

export interface WeatherStateSnapshot {
  type: WeatherType;
  nextType: WeatherType;
  label: string;
  intensity: number;
  phaseProgress: number;
  timeRemainingSec: number;
}

export interface MatchWorld {
  mode: GameModeId;
  mapId: MapId;
  elapsed: number;
  timeLimit: number;
  targetKills: number;
  wave: number;
  waveClearTimer: number;
  status: 'playing' | 'ended';
  winnerTeam: TeamId | null;
  winnerName: string | null;
  soldiers: SoldierEntity[];
  bullets: BulletEntity[];
  grenades: GrenadeEntity[];
  pickups: PickupEntity[];
  destructibles?: DestructibleEntity[];
  hangarVaultOpen?: boolean;
  hangarVaultTimer?: number;
  mapMechanic?: MapMechanicSnapshot;
  killFeed: KillFeedEntry[];
  events: WorldEvent[];
  hitstopTimer: number;
  cameraTrauma: number;
  nextEntityId: number;
  attackTokenCooldown: number;
  weather?: WeatherStateSnapshot;
}

export interface PlayerInputState {
  moveX: number; // -1 to 1
  jumpHeld: boolean;
  jumpPressed: boolean;
  jetpackHeld: boolean;
  crouchHeld: boolean;
  aimAngle: number;
  fireHeld: boolean;
  firePressed: boolean;
  reloadPressed: boolean;
  grenadePressed: boolean;
  meleePressed: boolean;
  switchSlotPressed: 0 | 1 | 'toggle' | null;
  pickupPressed?: boolean;
  pickupTargetId?: number | null;
}

export interface RoomSummary {
  id: string;
  name: string;
  hostName: string;
  mapId: MapId;
  mode: GameModeId;
  playerCount: number;
  maxPlayers: number;
  hasPassword: boolean;
  status: 'lobby' | 'playing';
}

export interface LobbyPlayer {
  id: string;
  name: string;
  team: TeamId;
  helmet: HelmetStyle;
  eyewear?: EyewearStyle;
  skinTone?: SkinToneId;
  jetpackStyle?: JetpackStyleId;
  armorColor: ArmorColorId;
  primaryWeapon: WeaponId;
  secondaryWeapon: WeaponId;
  ready: boolean;
  isHost: boolean;
}

export interface RoomState {
  id: string;
  name: string;
  mapId: MapId;
  mode: GameModeId;
  maxPlayers: number;
  status: 'lobby' | 'playing';
  hostId: string;
  players: LobbyPlayer[];
}

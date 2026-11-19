import {
  ControlPosition,
  ControlSettings,
  CustomControlLayout,
  DraggableControlId,
  PlayerProfile,
} from './types';

const PROFILE_KEY = 'elitestrike_profile_v2';
const SETTINGS_KEY = 'elitestrike_settings_v2';

export const DEFAULT_PROFILE: PlayerProfile = {
  callsign: 'Striker-01',
  helmet: 'tactical',
  eyewear: 'visor',
  skinTone: 'tan',
  jetpackStyle: 'amber',
  armorColor: 'olive',
  primaryWeapon: 'rifle',
  secondaryWeapon: 'pistol',
  xp: 0,
  kills: 0,
  deaths: 0,
  wins: 0,
  matches: 0,
};

export const DEFAULT_CONTROL_LAYOUT: CustomControlLayout = {
  moveStick: { xPct: 12, yPct: 76 },
  grenadeBtn: { xPct: 26, yPct: 84 },
  meleeBtn: { xPct: 72, yPct: 84 },
  fireStick: { xPct: 88, yPct: 76 },
  scopeBtn: { xPct: 7, yPct: 34 },
};

export function clampControlPosition(pos: ControlPosition): ControlPosition {
  const xPct = Math.round(Math.max(4, Math.min(96, pos.xPct)) * 10) / 10;
  const yPct = Math.round(Math.max(8, Math.min(94, pos.yPct)) * 10) / 10;
  return { xPct, yPct };
}

export function updateControlLayoutPosition(
  layout: CustomControlLayout,
  id: DraggableControlId,
  pos: ControlPosition,
): CustomControlLayout {
  return {
    ...layout,
    [id]: clampControlPosition(pos),
  };
}

export const DEFAULT_SETTINGS: ControlSettings = {
  touchControls: 'always',
  controlOpacity: 0.85,
  aimAssist: true,
  sfxVolume: 0.7,
  muted: false,
  controlLayout: { ...DEFAULT_CONTROL_LAYOUT },
};

export function getLevelFromXp(xp: number): {
  level: number;
  rankTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  // Clean progressive curve: 250 XP for Lv2, 600 for Lv3, 1100 for Lv4, etc.
  const thresholds = [0, 250, 600, 1100, 1750, 2550, 3500, 4600];
  const ranks = [
    'Recruit',
    'Corporal',
    'Sergeant',
    'Lieutenant',
    'Captain',
    'Major',
    'Colonel',
    'Apex Commander',
  ];
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
  }
  const curMin = thresholds[level - 1] ?? 0;
  const nextMax = thresholds[level] ?? curMin + 1200;
  const progress = Math.max(0, Math.min(1, (xp - curMin) / Math.max(1, nextMax - curMin)));
  return {
    level,
    rankTitle: ranks[Math.min(ranks.length - 1, level - 1)],
    currentLevelXp: xp - curMin,
    nextLevelXp: nextMax - curMin,
    progress,
  };
}

export function calculateMatchXp(opts: {
  kills: number;
  won: boolean;
  mode: string;
}): number {
  if (opts.mode === 'training') {
    return Math.min(120, opts.kills * 15);
  }
  return 60 + opts.kills * 35 + (opts.won ? 120 : 25);
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSettings(): ControlSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        ...DEFAULT_SETTINGS,
        controlLayout: { ...DEFAULT_CONTROL_LAYOUT },
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      controlLayout: {
        ...DEFAULT_CONTROL_LAYOUT,
        ...(parsed?.controlLayout ?? {}),
      },
    };
  } catch {
    return {
      ...DEFAULT_SETTINGS,
      controlLayout: { ...DEFAULT_CONTROL_LAYOUT },
    };
  }
}

export function saveSettings(settings: ControlSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

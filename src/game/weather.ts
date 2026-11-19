import { MapId, WeatherStateSnapshot, WeatherType } from './types';

export const WEATHER_PHASE_DURATION_SEC = 18;
export const WEATHER_TRANSITION_SEC = 3;

export interface MapWeatherVisualConfig {
  label: string;
  skyTint: string;
  fogColorInner: string;
  fogColorOuter: string;
  fogMaxOpacity: number;
  rainStroke: string;
  rainSplashColor: string;
  rainWindX: number;
  snowFill: string;
  snowWindX: number;
}

export const MAP_WEATHER_CYCLES: Record<MapId, WeatherType[]> = {
  forest: ['light_rain', 'fog', 'snow', 'clear'],
  desert: ['fog', 'light_rain', 'snow', 'clear'],
  urban: ['snow', 'light_rain', 'fog', 'clear'],
  hangar: ['fog', 'snow', 'light_rain', 'clear'],
  island: ['light_rain', 'fog', 'snow', 'clear'],
};

const MAP_BIOME_WEATHER_STYLES: Record<
  MapId,
  Record<WeatherType, MapWeatherVisualConfig>
> = {
  forest: {
    light_rain: {
      label: 'CANOPY LIGHT RAIN',
      skyTint: 'rgba(15, 42, 36, 0.16)',
      fogColorInner: 'rgba(186, 219, 206, 0.22)',
      fogColorOuter: 'rgba(134, 179, 160, 0.08)',
      fogMaxOpacity: 0.22,
      rainStroke: 'rgba(204, 242, 255, 0.62)',
      rainSplashColor: 'rgba(224, 247, 255, 0.72)',
      rainWindX: -110,
      snowFill: '#F1F5F9',
      snowWindX: -35,
    },
    fog: {
      label: 'JUNGLE MIST FOG',
      skyTint: 'rgba(209, 232, 224, 0.22)',
      fogColorInner: 'rgba(226, 242, 236, 0.52)',
      fogColorOuter: 'rgba(167, 204, 190, 0.24)',
      fogMaxOpacity: 0.56,
      rainStroke: 'rgba(204, 242, 255, 0.45)',
      rainSplashColor: 'rgba(224, 247, 255, 0.5)',
      rainWindX: -70,
      snowFill: '#F1F5F9',
      snowWindX: -25,
    },
    snow: {
      label: 'HIGHLAND SNOW',
      skyTint: 'rgba(226, 238, 248, 0.2)',
      fogColorInner: 'rgba(235, 244, 252, 0.28)',
      fogColorOuter: 'rgba(191, 219, 238, 0.12)',
      fogMaxOpacity: 0.28,
      rainStroke: 'rgba(224, 242, 254, 0.5)',
      rainSplashColor: 'rgba(241, 245, 249, 0.6)',
      rainWindX: -80,
      snowFill: 'rgba(248, 250, 252, 0.92)',
      snowWindX: -45,
    },
    clear: {
      label: 'CLEAR CANOPY',
      skyTint: 'rgba(255, 255, 255, 0)',
      fogColorInner: 'rgba(255, 255, 255, 0)',
      fogColorOuter: 'rgba(255, 255, 255, 0)',
      fogMaxOpacity: 0,
      rainStroke: 'rgba(255, 255, 255, 0)',
      rainSplashColor: 'rgba(255, 255, 255, 0)',
      rainWindX: 0,
      snowFill: 'rgba(255, 255, 255, 0)',
      snowWindX: 0,
    },
  },
  desert: {
    fog: {
      label: 'DUST HAZE FOG',
      skyTint: 'rgba(180, 120, 62, 0.24)',
      fogColorInner: 'rgba(238, 198, 148, 0.52)',
      fogColorOuter: 'rgba(198, 144, 86, 0.24)',
      fogMaxOpacity: 0.55,
      rainStroke: 'rgba(254, 240, 199, 0.55)',
      rainSplashColor: 'rgba(254, 215, 170, 0.6)',
      rainWindX: -140,
      snowFill: '#FEF3C7',
      snowWindX: -60,
    },
    light_rain: {
      label: 'DESERT SQUALL RAIN',
      skyTint: 'rgba(92, 68, 46, 0.2)',
      fogColorInner: 'rgba(214, 184, 148, 0.24)',
      fogColorOuter: 'rgba(168, 134, 96, 0.1)',
      fogMaxOpacity: 0.24,
      rainStroke: 'rgba(226, 232, 240, 0.58)',
      rainSplashColor: 'rgba(254, 243, 199, 0.65)',
      rainWindX: -155,
      snowFill: '#F8FAFC',
      snowWindX: -50,
    },
    snow: {
      label: 'HIGH-DESERT FROST SNOW',
      skyTint: 'rgba(226, 232, 240, 0.2)',
      fogColorInner: 'rgba(241, 245, 249, 0.26)',
      fogColorOuter: 'rgba(203, 213, 225, 0.12)',
      fogMaxOpacity: 0.26,
      rainStroke: 'rgba(226, 232, 240, 0.5)',
      rainSplashColor: 'rgba(241, 245, 249, 0.6)',
      rainWindX: -90,
      snowFill: 'rgba(255, 251, 235, 0.9)',
      snowWindX: -55,
    },
    clear: {
      label: 'CLEAR DUNES',
      skyTint: 'rgba(255, 255, 255, 0)',
      fogColorInner: 'rgba(255, 255, 255, 0)',
      fogColorOuter: 'rgba(255, 255, 255, 0)',
      fogMaxOpacity: 0,
      rainStroke: 'rgba(255, 255, 255, 0)',
      rainSplashColor: 'rgba(255, 255, 255, 0)',
      rainWindX: 0,
      snowFill: 'rgba(255, 255, 255, 0)',
      snowWindX: 0,
    },
  },
  urban: {
    snow: {
      label: 'WINTER SNOWFALL',
      skyTint: 'rgba(203, 213, 225, 0.22)',
      fogColorInner: 'rgba(226, 232, 240, 0.3)',
      fogColorOuter: 'rgba(148, 163, 184, 0.14)',
      fogMaxOpacity: 0.3,
      rainStroke: 'rgba(226, 232, 240, 0.55)',
      rainSplashColor: 'rgba(241, 245, 249, 0.65)',
      rainWindX: -95,
      snowFill: 'rgba(248, 250, 252, 0.95)',
      snowWindX: -48,
    },
    light_rain: {
      label: 'URBAN LIGHT RAIN',
      skyTint: 'rgba(15, 23, 42, 0.22)',
      fogColorInner: 'rgba(148, 163, 184, 0.24)',
      fogColorOuter: 'rgba(71, 85, 105, 0.1)',
      fogMaxOpacity: 0.24,
      rainStroke: 'rgba(186, 230, 253, 0.65)',
      rainSplashColor: 'rgba(224, 242, 254, 0.72)',
      rainWindX: -125,
      snowFill: '#F8FAFC',
      snowWindX: -40,
    },
    fog: {
      label: 'METRO SMOG FOG',
      skyTint: 'rgba(148, 163, 184, 0.25)',
      fogColorInner: 'rgba(203, 213, 225, 0.54)',
      fogColorOuter: 'rgba(100, 116, 139, 0.25)',
      fogMaxOpacity: 0.55,
      rainStroke: 'rgba(186, 230, 253, 0.5)',
      rainSplashColor: 'rgba(224, 242, 254, 0.5)',
      rainWindX: -90,
      snowFill: '#F8FAFC',
      snowWindX: -30,
    },
    clear: {
      label: 'CLEAR OVERCAST',
      skyTint: 'rgba(255, 255, 255, 0)',
      fogColorInner: 'rgba(255, 255, 255, 0)',
      fogColorOuter: 'rgba(255, 255, 255, 0)',
      fogMaxOpacity: 0,
      rainStroke: 'rgba(255, 255, 255, 0)',
      rainSplashColor: 'rgba(255, 255, 255, 0)',
      rainWindX: 0,
      snowFill: 'rgba(255, 255, 255, 0)',
      snowWindX: 0,
    },
  },
  hangar: {
    fog: {
      label: 'CRYO VENT FOG',
      skyTint: 'rgba(14, 116, 144, 0.18)',
      fogColorInner: 'rgba(165, 243, 252, 0.42)',
      fogColorOuter: 'rgba(56, 189, 248, 0.16)',
      fogMaxOpacity: 0.48,
      rainStroke: 'rgba(165, 243, 252, 0.58)',
      rainSplashColor: 'rgba(207, 250, 254, 0.68)',
      rainWindX: -75,
      snowFill: '#ECFEFF',
      snowWindX: -30,
    },
    snow: {
      label: 'CRYO FROST SNOW',
      skyTint: 'rgba(56, 189, 248, 0.14)',
      fogColorInner: 'rgba(186, 230, 253, 0.24)',
      fogColorOuter: 'rgba(56, 189, 248, 0.1)',
      fogMaxOpacity: 0.24,
      rainStroke: 'rgba(186, 230, 253, 0.55)',
      rainSplashColor: 'rgba(224, 242, 254, 0.65)',
      rainWindX: -70,
      snowFill: 'rgba(224, 242, 254, 0.92)',
      snowWindX: -35,
    },
    light_rain: {
      label: 'COOLANT SPRINKLER RAIN',
      skyTint: 'rgba(15, 23, 42, 0.22)',
      fogColorInner: 'rgba(148, 163, 184, 0.2)',
      fogColorOuter: 'rgba(71, 85, 105, 0.08)',
      fogMaxOpacity: 0.2,
      rainStroke: 'rgba(125, 211, 252, 0.62)',
      rainSplashColor: 'rgba(186, 230, 253, 0.72)',
      rainWindX: -85,
      snowFill: '#E0F2FE',
      snowWindX: -25,
    },
    clear: {
      label: 'CLEAR HANGAR BAY',
      skyTint: 'rgba(255, 255, 255, 0)',
      fogColorInner: 'rgba(255, 255, 255, 0)',
      fogColorOuter: 'rgba(255, 255, 255, 0)',
      fogMaxOpacity: 0,
      rainStroke: 'rgba(255, 255, 255, 0)',
      rainSplashColor: 'rgba(255, 255, 255, 0)',
      rainWindX: 0,
      snowFill: 'rgba(255, 255, 255, 0)',
      snowWindX: 0,
    },
  },
  island: {
    light_rain: {
      label: 'TROPICAL SQUALL RAIN',
      skyTint: 'rgba(12, 74, 110, 0.18)',
      fogColorInner: 'rgba(186, 230, 253, 0.22)',
      fogColorOuter: 'rgba(125, 211, 252, 0.09)',
      fogMaxOpacity: 0.22,
      rainStroke: 'rgba(224, 242, 254, 0.66)',
      rainSplashColor: 'rgba(240, 249, 255, 0.76)',
      rainWindX: -135,
      snowFill: '#F0F9FF',
      snowWindX: -45,
    },
    fog: {
      label: 'LAGOON SEA FOG',
      skyTint: 'rgba(153, 246, 228, 0.2)',
      fogColorInner: 'rgba(204, 251, 241, 0.5)',
      fogColorOuter: 'rgba(153, 246, 228, 0.22)',
      fogMaxOpacity: 0.52,
      rainStroke: 'rgba(204, 251, 241, 0.5)',
      rainSplashColor: 'rgba(240, 253, 250, 0.6)',
      rainWindX: -95,
      snowFill: '#F0FDFA',
      snowWindX: -35,
    },
    snow: {
      label: 'POLAR GALE SNOW',
      skyTint: 'rgba(224, 242, 254, 0.22)',
      fogColorInner: 'rgba(240, 249, 255, 0.28)',
      fogColorOuter: 'rgba(186, 230, 253, 0.12)',
      fogMaxOpacity: 0.28,
      rainStroke: 'rgba(224, 242, 254, 0.55)',
      rainSplashColor: 'rgba(240, 249, 255, 0.65)',
      rainWindX: -105,
      snowFill: 'rgba(248, 250, 252, 0.94)',
      snowWindX: -52,
    },
    clear: {
      label: 'CLEAR ATOLL SKIES',
      skyTint: 'rgba(255, 255, 255, 0)',
      fogColorInner: 'rgba(255, 255, 255, 0)',
      fogColorOuter: 'rgba(255, 255, 255, 0)',
      fogMaxOpacity: 0,
      rainStroke: 'rgba(255, 255, 255, 0)',
      rainSplashColor: 'rgba(255, 255, 255, 0)',
      rainWindX: 0,
      snowFill: 'rgba(255, 255, 255, 0)',
      snowWindX: 0,
    },
  },
};

export function getMapWeatherVisualConfig(
  mapId: MapId,
  weather: WeatherType,
): MapWeatherVisualConfig {
  const mapStyles = MAP_BIOME_WEATHER_STYLES[mapId] ?? MAP_BIOME_WEATHER_STYLES.forest;
  return mapStyles[weather] ?? mapStyles.light_rain;
}

/**
 * Computes the deterministic dynamic weather state for a given map and elapsed match time.
 * Cycles periodically every WEATHER_PHASE_DURATION_SEC (18s) through the map's weather rotation
 * (light_rain, fog, snow, clear) with smooth intensity ramping at phase boundaries.
 */
export function getWeatherStateForMap(
  mapId: MapId,
  elapsedSec: number,
  phaseDurationSec = WEATHER_PHASE_DURATION_SEC,
): WeatherStateSnapshot {
  const cycle = MAP_WEATHER_CYCLES[mapId] ?? MAP_WEATHER_CYCLES.forest;
  const safeElapsed = Math.max(0, elapsedSec);
  const phaseIndex = Math.floor(safeElapsed / phaseDurationSec) % cycle.length;
  const nextIndex = (phaseIndex + 1) % cycle.length;
  const phaseTime = safeElapsed % phaseDurationSec;
  const phaseProgress = Math.max(0, Math.min(1, phaseTime / phaseDurationSec));

  const current = cycle[phaseIndex];
  const next = cycle[nextIndex];
  const config = getMapWeatherVisualConfig(mapId, current);

  // Smooth fade-in and fade-out at phase transitions, staying at full intensity in the middle
  let intensity = 1.0;
  if (current === 'clear') {
    intensity = 0;
  } else if (phaseTime < WEATHER_TRANSITION_SEC && safeElapsed >= phaseDurationSec) {
    intensity = Math.max(0.35, phaseTime / WEATHER_TRANSITION_SEC);
  } else if (phaseTime > phaseDurationSec - WEATHER_TRANSITION_SEC) {
    const remaining = phaseDurationSec - phaseTime;
    intensity = Math.max(0.35, remaining / WEATHER_TRANSITION_SEC);
  }

  return {
    type: current,
    nextType: next,
    label: config.label,
    intensity: Math.round(intensity * 100) / 100,
    phaseProgress: Math.round(phaseProgress * 100) / 100,
    timeRemainingSec: Math.max(0, Math.ceil(phaseDurationSec - phaseTime)),
  };
}

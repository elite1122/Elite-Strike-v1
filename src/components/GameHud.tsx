import React, { useRef, useState } from 'react';
import { Check, Gamepad2, Move, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import {
  DEFAULT_CONTROL_LAYOUT,
  updateControlLayoutPosition,
} from '../game/progression';
import { WEAPONS } from '../game/weapons';
import { getWeatherStateForMap } from '../game/weather';
import { MinimapSnapshotData } from '../game/minimap';
import {
  ControlSettings,
  DraggableControlId,
  KillFeedEntry,
  MapId,
  MapMechanicSnapshot,
  MatchWorld,
  SoldierEntity,
  WeaponId,
} from '../game/types';
import { WeaponSilhouetteSvg } from './CharacterPreviewSvg';

export interface TouchInputBridge {
  moveX: number;
  jumpHeld: boolean;
  jetpackHeld: boolean;
  crouchHeld: boolean;
  aimAngle: number | null;
  fireHeld: boolean;
  triggerJump: () => void;
  triggerGrenade: () => void;
  triggerMelee: () => void;
  triggerReload: () => void;
  triggerSwitchSlot: (slot: 0 | 1 | 'toggle') => void;
  triggerPickup: (pickupId?: number) => void;
}

export interface MapUiTheme {
  id: MapId;
  badgeLabel: string;
  panelBg: string;
  borderColor: string;
  hpGradient: string;
  fuelGradient: string;
  accentColor: string;
  controlRingBg: string;
  controlInnerBg: string;
  minimapBg: string;
}

export const MAP_UI_THEMES: Record<MapId, MapUiTheme> = {
  forest: {
    id: 'forest',
    badgeLabel: 'JUNGLE CANOPY HUD',
    panelBg: 'rgba(138, 152, 134, 0.56)',
    borderColor: 'rgba(248, 250, 252, 0.94)',
    hpGradient: 'linear-gradient(90deg, #9333EA 0%, #D946EF 100%)',
    fuelGradient: 'linear-gradient(90deg, #1E3A8A 0%, #2563EB 100%)',
    accentColor: '#4ADE80',
    controlRingBg: 'rgba(148, 163, 184, 0.28)',
    controlInnerBg: 'rgba(51, 65, 95, 0.68)',
    minimapBg: '#0B1510',
  },
  desert: {
    id: 'desert',
    badgeLabel: 'SANDSTORM COMMAND HUD',
    panelBg: 'rgba(133, 90, 44, 0.62)',
    borderColor: 'rgba(254, 240, 138, 0.94)',
    hpGradient: 'linear-gradient(90deg, #DC2626 0%, #F97316 100%)',
    fuelGradient: 'linear-gradient(90deg, #0369A1 0%, #38BDF8 100%)',
    accentColor: '#FBBF24',
    controlRingBg: 'rgba(217, 160, 91, 0.28)',
    controlInnerBg: 'rgba(92, 58, 26, 0.72)',
    minimapBg: '#191108',
  },
  urban: {
    id: 'urban',
    badgeLabel: 'NIGHT OPS CYBER HUD',
    panelBg: 'rgba(15, 23, 42, 0.74)',
    borderColor: 'rgba(56, 189, 248, 0.92)',
    hpGradient: 'linear-gradient(90deg, #E11D48 0%, #FB7185 100%)',
    fuelGradient: 'linear-gradient(90deg, #4338CA 0%, #06B6D4 100%)',
    accentColor: '#38BDF8',
    controlRingBg: 'rgba(56, 189, 248, 0.22)',
    controlInnerBg: 'rgba(15, 32, 62, 0.74)',
    minimapBg: '#080D18',
  },
  hangar: {
    id: 'hangar',
    badgeLabel: 'ARMOR BAY HAZARD HUD',
    panelBg: 'rgba(39, 39, 42, 0.74)',
    borderColor: 'rgba(250, 204, 21, 0.94)',
    hpGradient: 'linear-gradient(90deg, #16A34A 0%, #84CC16 100%)',
    fuelGradient: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)',
    accentColor: '#FACC15',
    controlRingBg: 'rgba(250, 204, 21, 0.24)',
    controlInnerBg: 'rgba(42, 42, 48, 0.74)',
    minimapBg: '#111215',
  },
  island: {
    id: 'island',
    badgeLabel: 'LAGOON ATOLL HUD',
    panelBg: 'rgba(19, 78, 74, 0.62)',
    borderColor: 'rgba(153, 246, 228, 0.94)',
    hpGradient: 'linear-gradient(90deg, #C026D3 0%, #F43F5E 100%)',
    fuelGradient: 'linear-gradient(90deg, #0284C7 0%, #2DD4BF 100%)',
    accentColor: '#2DD4BF',
    controlRingBg: 'rgba(45, 212, 191, 0.25)',
    controlInnerBg: 'rgba(15, 62, 70, 0.72)',
    minimapBg: '#071719',
  },
};

const PineappleGrenadeSvg: React.FC<{ className?: string }> = ({
  className = 'w-6 h-7 sm:w-7 sm:h-8',
}) => (
  <svg viewBox="0 0 36 42" className={className} aria-hidden="true">
    {/* Fuse & Spoon Lever */}
    <rect x="14" y="3" width="8" height="6" rx="1" fill="#94A3B8" stroke="#1E293B" strokeWidth="1.8" />
    <path d="M22 5 L30 9 L28 24" fill="none" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="13" cy="6" r="3.5" fill="none" stroke="#E2E8F0" strokeWidth="1.8" />
    {/* Segmented Pineapple Body */}
    <ellipse cx="18" cy="24" rx="11" ry="14" fill="#65784B" stroke="#1E293B" strokeWidth="2.2" />
    <line x1="8" y1="18" x2="28" y2="18" stroke="#1E293B" strokeWidth="1.6" />
    <line x1="7" y1="24" x2="29" y2="24" stroke="#1E293B" strokeWidth="1.6" />
    <line x1="8" y1="30" x2="28" y2="30" stroke="#1E293B" strokeWidth="1.6" />
    <line x1="14" y1="11" x2="14" y2="37" stroke="#1E293B" strokeWidth="1.5" />
    <line x1="22" y1="11" x2="22" y2="37" stroke="#1E293B" strokeWidth="1.5" />
  </svg>
);

const ClenchedFistSvg: React.FC<{ className?: string }> = ({
  className = 'w-7 h-7 sm:w-9 sm:h-9',
}) => (
  <svg viewBox="0 0 44 44" className={className} aria-hidden="true">
    <g fill="rgba(248, 250, 252, 0.92)" stroke="rgba(30, 41, 59, 0.7)" strokeWidth="1.4">
      <polygon points="18,26 30,22 36,34 22,39" />
      <rect x="13" y="13" width="6" height="9" rx="2.5" transform="rotate(-15 16 17)" />
      <rect x="18" y="11" width="6" height="10" rx="2.5" transform="rotate(-12 21 16)" />
      <rect x="23" y="11" width="6" height="10" rx="2.5" transform="rotate(-10 26 16)" />
      <rect x="28" y="13" width="5.5" height="9" rx="2.5" transform="rotate(-8 31 17)" />
      <rect x="12" y="19" width="13" height="6" rx="2.5" transform="rotate(14 18 22)" />
    </g>
  </svg>
);

interface GameHudProps {
  worldSnapshot: {
    mapId: MapId;
    mode: MatchWorld['mode'];
    elapsed: number;
    timeLimit: number;
    targetKills: number;
    wave: number;
    alphaKills: number;
    bravoKills: number;
    topKills: number;
    killFeed: KillFeedEntry[];
    minimap: MinimapSnapshotData;
    nearbyWeaponPickup?: { id: number; weaponId: WeaponId } | null;
    mapMechanic?: MapMechanicSnapshot | null;
  };
  player: SoldierEntity | null;
  settings: ControlSettings;
  onUpdateSettings: (patch: Partial<ControlSettings>) => void;
  showTouchControls: boolean;
  isEditingControls: boolean;
  onToggleEditControls: () => void;
  touchBridge: React.MutableRefObject<TouchInputBridge>;
  minimapCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  minimapZoomed?: boolean;
  onToggleMinimapZoom?: () => void;
  scopeZoomLevel: number;
  onCycleScopeZoom: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onToggleTouch: () => void;
  isPortraitRotated?: boolean;
}

export const GameHud: React.FC<GameHudProps> = ({
  worldSnapshot,
  player,
  settings,
  onUpdateSettings,
  showTouchControls,
  isEditingControls,
  onToggleEditControls,
  touchBridge,
  scopeZoomLevel,
  onCycleScopeZoom,
  onPause,
  onToggleMute,
  onToggleTouch,
  isPortraitRotated = false,
}) => {
  const moveStickRef = useRef<HTMLDivElement | null>(null);
  const aimStickRef = useRef<HTMLDivElement | null>(null);
  const [draggingControlId, setDraggingControlId] = useState<DraggableControlId | null>(null);
  const [moveKnobOffset, setMoveKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fireKnobOffset, setFireKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const theme = MAP_UI_THEMES[worldSnapshot.mapId] ?? MAP_UI_THEMES.forest;
  const layout = settings.controlLayout ?? DEFAULT_CONTROL_LAYOUT;
  const weather = getWeatherStateForMap(
    worldSnapshot.mapId,
    worldSnapshot.elapsed,
  );

  const activeSlot = player ? player.slots[player.activeSlot] : null;
  const secondarySlot = player
    ? player.slots[player.activeSlot === 0 ? 1 : 0]
    : null;
  const activeWeapon = activeSlot ? WEAPONS[activeSlot.weaponId] : null;

  const scopePowerLabel = `${scopeZoomLevel}X`;

  const remainingSec = Math.max(
    0,
    Math.ceil(worldSnapshot.timeLimit - worldSnapshot.elapsed),
  );
  const mins = Math.floor(remainingSec / 60);
  const secs = String(remainingSec % 60).padStart(2, '0');

  // Helper that maps pointer deltas and viewport percentages accurately in both native landscape
  // and CSS 90-degree auto-rotated portrait-to-landscape mode
  const getRelativeDelta = (
    el: HTMLElement,
    clientX: number,
    clientY: number,
  ): { dx: number; dy: number; radius: number } => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (isPortraitRotated) {
      return {
        dx: clientY - cy,
        dy: -(clientX - cx),
        radius: Math.max(24, Math.min(rect.width, rect.height) * 0.44),
      };
    }
    return {
      dx: clientX - cx,
      dy: clientY - cy,
      radius: Math.max(24, Math.min(rect.width, rect.height) * 0.44),
    };
  };

  const moveControlToViewport = (id: DraggableControlId, clientX: number, clientY: number) => {
    if (!isEditingControls) return;
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    const xPct = isPortraitRotated
      ? (clientY / vh) * 100
      : (clientX / vw) * 100;
    const yPct = isPortraitRotated
      ? ((vw - clientX) / vw) * 100
      : (clientY / vh) * 100;
    const nextLayout = updateControlLayoutPosition(layout, id, { xPct, yPct });
    onUpdateSettings({ controlLayout: nextLayout });
  };

  const handleMovePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = moveStickRef.current;
    if (!el) return;
    const { dx, dy, radius } = getRelativeDelta(el, e.clientX, e.clientY);

    // Clamp visual thumb knob displacement inside the stick ring
    const dist = Math.hypot(dx, dy);
    const maxKnob = radius * 0.72;
    const clampedScale = dist > maxKnob && dist > 0 ? maxKnob / dist : 1;
    setMoveKnobOffset({ x: dx * clampedScale, y: dy * clampedScale });

    // Smooth analog response curve with 18% deadzone so thumb movement is never twitchy or overly fast
    const rawX = Math.max(-1, Math.min(1, dx / radius));
    const deadzone = 0.18;
    if (Math.abs(rawX) < deadzone) {
      touchBridge.current.moveX = 0;
    } else {
      const normalized = (Math.abs(rawX) - deadzone) / (1 - deadzone);
      touchBridge.current.moveX =
        Math.sign(rawX) * Math.pow(Math.min(1, normalized), 1.35);
    }

    const rawY = Math.max(-1, Math.min(1, dy / radius));
    touchBridge.current.crouchHeld = rawY > 0.42;
    touchBridge.current.jetpackHeld = rawY < -0.32;
  };

  const handleAimPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = aimStickRef.current;
    if (!el) return;
    const { dx, dy, radius } = getRelativeDelta(el, e.clientX, e.clientY);

    const dist = Math.hypot(dx, dy);
    const maxKnob = radius * 0.72;
    const clampedScale = dist > maxKnob && dist > 0 ? maxKnob / dist : 1;
    setFireKnobOffset({ x: dx * clampedScale, y: dy * clampedScale });

    if (dist > 7) {
      touchBridge.current.aimAngle = Math.atan2(dy, dx);
    }
    touchBridge.current.fireHeld = dist > 10;
  };

  return (
    <div
      data-testid="game-hud"
      data-map-theme={theme.id}
      data-editing-controls={isEditingControls ? 'true' : 'false'}
      className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-1.5 sm:p-2.5 md:p-3.5 select-none"
    >
      {/* Low-HP peripheral danger vignette */}
      {player && player.alive && player.hp <= 30 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 80px rgba(220, 38, 38, 0.55)',
          }}
        />
      )}

      {/* TOP HUD BAR: Responsive Vitality Dock (Top-Left) + Weapon Dock (Top-Center/Right) + Compact Utility Icons */}
      <div className="flex items-start justify-between gap-2">
        {/* TOP-LEFT: Angled Chamfered Vitality & Jetpack Dock + Slim Single-Line Status Strip */}
        <div className="flex flex-col items-start gap-1">
          {player && (
            <div className="relative pointer-events-auto px-2.5 sm:px-3.5 py-1.5 w-[198px] sm:w-[272px] drop-shadow-lg">
              <svg
                viewBox="0 0 300 76"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden="true"
              >
                <polygon
                  points="2,2 298,2 268,74 2,74"
                  fill={theme.panelBg}
                  stroke={theme.borderColor}
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="relative z-10 flex items-center gap-2 pr-3 sm:pr-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono-hud font-bold text-amber-300 leading-none">
                    <span data-testid="hud-player-name" className="truncate max-w-[100px] sm:max-w-[150px]">
                      {player.name}
                    </span>
                    <span className="text-white/90">HP {Math.ceil(player.hp)}</span>
                  </div>
                  {/* Heart + Health Bar Row */}
                  <div className="flex items-center gap-1.5">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 fill-white drop-shadow"
                      aria-hidden="true"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <div className="h-2.5 sm:h-3 flex-1 rounded-xs bg-black/45 border border-white/85 overflow-hidden p-0.5">
                      <div
                        className="h-full transition-all duration-100"
                        style={{
                          width: `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`,
                          background: theme.hpGradient,
                        }}
                      />
                    </div>
                  </div>

                  {/* Jetpack Icon + Unlimited Gas Bar Row */}
                  <div className="flex items-center gap-1.5">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 fill-white drop-shadow"
                      aria-hidden="true"
                    >
                      <path d="M12 2L8 7.5V16h8V7.5L12 2zm-2 15l2 5 2-5h-4z" />
                    </svg>
                    <div className="relative h-2.5 sm:h-3 flex-1 rounded-xs bg-black/45 border border-white/85 overflow-hidden p-0.5">
                      <div
                        className="h-full transition-all duration-75"
                        style={{
                          width: '100%',
                          background: theme.fuelGradient,
                        }}
                      />
                      <span
                        title="Unlimited Jetpack Gas"
                        className="absolute right-1 top-1/2 -translate-y-1/2 font-mono-hud text-[9px] sm:text-[10px] font-extrabold text-white leading-none drop-shadow"
                      >
                        ∞
                      </span>
                    </div>
                  </div>
                </div>

                {/* Integrated Circular || Pause Button inside top-left panel */}
                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="hud-pause-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onPause();
                  }}
                  aria-label="Pause [Esc]"
                  title="Pause [Esc]"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white/95 bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors shrink-0"
                >
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    <span className="w-0.5 sm:w-1 h-3 sm:h-3.5 bg-white rounded-xs" />
                    <span className="w-0.5 sm:w-1 h-3 sm:h-3.5 bg-white rounded-xs" />
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Ultra-Compact Single-Line Status Pill (Never blocks mobile gameplay view) */}
          <div
            className="px-2 py-0.5 rounded-xs text-[9px] sm:text-[10px] font-mono-hud text-white shadow flex flex-wrap items-center gap-x-2 gap-y-0.5 max-w-[260px] sm:max-w-[380px] pointer-events-none"
            style={{
              backgroundColor: theme.panelBg,
              border: `1.5px solid ${theme.borderColor}`,
              backdropFilter: 'blur(3px)',
              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            }}
          >
            <span className="font-extrabold" style={{ color: theme.accentColor }}>
              {worldSnapshot.mode === 'tdm'
                ? `A:${worldSnapshot.alphaKills} B:${worldSnapshot.bravoKills}`
                : worldSnapshot.mode === 'survival'
                  ? `W${worldSnapshot.wave}/5`
                  : `KILLS ${player?.kills ?? 0}`}
            </span>
            {worldSnapshot.mode !== 'training' && (
              <span className="font-bold text-white">{mins}:{secs}</span>
            )}
            <span
              data-testid="hud-weather-status"
              className="text-sky-200 truncate max-w-[120px] sm:max-w-[160px]"
            >
              {weather.label}
            </span>
            {worldSnapshot.mapMechanic && (
              <span
                data-testid="hud-map-mechanic-status"
                className={`font-extrabold uppercase truncate max-w-[180px] sm:max-w-[230px] ${
                  worldSnapshot.mapMechanic.active
                    ? 'text-emerald-300'
                    : 'text-amber-200'
                }`}
              >
                {worldSnapshot.mapMechanic.label}
              </span>
            )}
          </div>
        </div>

        {/* TOP-CENTER / RIGHT: Responsive Angled Weapon Dock + Circular Weapon Swap Ring + Grenade */}
        {player && activeSlot && activeWeapon && (
          <div
            data-testid="hud-weapon-dock"
            className="relative flex items-start pointer-events-auto"
          >
            {/* Overlapping Circular Secondary Weapon Swap Button */}
            {secondarySlot && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  touchBridge.current.triggerSwitchSlot('toggle');
                }}
                aria-label="Swap primary and secondary weapon [Q]"
                title="Swap Weapon [Q / 1 / 2]"
                className="relative z-20 -mr-3.5 sm:-mr-5 mt-2 sm:mt-4 w-14 h-14 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xl"
                style={{
                  backgroundColor: theme.panelBg,
                  border: `3px solid ${theme.borderColor}`,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <svg
                  viewBox="0 0 80 80"
                  className="absolute inset-0.5 w-full h-full pointer-events-none opacity-90"
                  aria-hidden="true"
                >
                  <path
                    d="M 22 18 A 28 28 0 0 1 58 18"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <polygon points="58,11 66,21 53,22" fill="#FFFFFF" />
                  <path
                    d="M 58 62 A 28 28 0 0 1 22 62"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <polygon points="22,69 14,59 27,58" fill="#FFFFFF" />
                </svg>
                <WeaponSilhouetteSvg
                  weaponId={secondarySlot.weaponId}
                  className="w-11 h-5 sm:w-16 sm:h-7 relative z-10 drop-shadow"
                />
              </button>
            )}

            {/* Main Angled Chamfered Active Weapon Dock */}
            <div className="flex items-center">
              <div
                onClick={() => touchBridge.current.triggerReload()}
                title="Tap to Reload [R]"
                className="relative px-4 sm:px-6 py-1 sm:py-1.5 min-w-[162px] sm:min-w-[236px] cursor-pointer drop-shadow-lg"
              >
                <svg
                  viewBox="0 0 266 72"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  aria-hidden="true"
                >
                  <polygon
                    points="2,2 264,2 264,70 30,70"
                    fill={theme.panelBg}
                    stroke={theme.borderColor}
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                </svg>

                <div
                  className="relative z-10 flex flex-col items-center"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.85)' }}
                >
                  <WeaponSilhouetteSvg
                    weaponId={activeSlot.weaponId}
                    className="w-24 h-8 sm:w-32 sm:h-10 drop-shadow"
                  />
                  <div className="w-full flex items-center justify-between px-2 -mt-0.5 font-mono-hud text-xs sm:text-sm font-extrabold text-white tracking-wider">
                    <span>
                      {player.reloadTimer > 0
                        ? 'RLD'
                        : String(activeSlot.mag).padStart(3, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold opacity-90 uppercase truncate max-w-[72px] sm:max-w-none">
                      {activeWeapon.shortName}
                    </span>
                    <span title="Unlimited Ammo" aria-label="Unlimited reserve ammo">
                      ∞
                    </span>
                  </div>
                </div>
              </div>

              {/* Attached Circular Pineapple Grenade Badge on Right of Weapon Dock */}
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  touchBridge.current.triggerGrenade();
                }}
                aria-label="Throw Frag Grenade [G] (Unlimited)"
                title="Throw Frag Grenade [G] · Unlimited (∞)"
                className="-ml-2.5 sm:-ml-3.5 relative z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xl"
                style={{
                  backgroundColor: theme.panelBg,
                  border: `3px solid ${theme.borderColor}`,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <PineappleGrenadeSvg className="w-6 h-7 sm:w-7 sm:h-8" />
                <span className="absolute bottom-0.5 right-1.5 font-mono-hud text-[10px] sm:text-xs font-extrabold text-white drop-shadow">
                  ∞
                </span>
              </button>
            </div>

            {/* Interactive Ground Weapon Pickup Prompt Button when standing on/near a gun */}
            {worldSnapshot.nearbyWeaponPickup && (
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-pickup-weapon-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  touchBridge.current.triggerPickup(
                    worldSnapshot.nearbyWeaponPickup?.id,
                  );
                }}
                aria-label={`Pick up ${WEAPONS[worldSnapshot.nearbyWeaponPickup.weaponId]?.name ?? 'Weapon'}`}
                className="ml-2 mt-1 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-white shadow-xl transition-transform hover:scale-105 active:scale-95 animate-pulse"
                style={{
                  backgroundColor: 'rgba(20, 83, 45, 0.9)',
                  border: `2px solid #4ADE80`,
                }}
              >
                <WeaponSilhouetteSvg
                  weaponId={worldSnapshot.nearbyWeaponPickup.weaponId}
                  className="w-10 h-5 sm:w-12 sm:h-6"
                />
                <div className="text-left leading-tight">
                  <div className="text-[8px] font-mono-hud font-bold uppercase text-emerald-300">
                    EQUIP
                  </div>
                  <div className="text-[10px] sm:text-xs font-mono-hud font-extrabold uppercase text-white">
                    {WEAPONS[worldSnapshot.nearbyWeaponPickup.weaponId]?.shortName}
                  </div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* TOP-RIGHT: Minimal Reload & Mute Utility Buttons (NO Enemy Location Minimap, NO In-Game Drag Button) */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                touchBridge.current.triggerReload();
              }}
              aria-label="Reload weapon [R]"
              title="Reload Weapon [R]"
              className="h-8 sm:h-9 px-2.5 flex items-center gap-1 rounded-full text-[11px] font-mono-hud font-bold text-white transition-transform active:scale-95"
              style={{
                backgroundColor: theme.panelBg,
                border: `2px solid ${theme.borderColor}`,
              }}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">RLD</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleTouch();
              }}
              aria-label="Toggle touch controls"
              title="Toggle touch controls [T]"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors"
              style={{
                backgroundColor: showTouchControls
                  ? theme.controlInnerBg
                  : theme.panelBg,
                border: `2px solid ${theme.borderColor}`,
              }}
            >
              <Gamepad2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={settings.muted ? 'Unmute [M]' : 'Mute [M]'}
              title="Mute / Unmute [M]"
              className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full text-white transition-colors"
              style={{
                backgroundColor: theme.panelBg,
                border: `2px solid ${theme.borderColor}`,
              }}
            >
              {settings.muted ? (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>

          {/* Single latest Kill Feed toast (compact, never stacks down the right side) */}
          {worldSnapshot.killFeed.length > 0 && (
            <div
              key={worldSnapshot.killFeed[0].id}
              className="rounded-xs px-2 py-0.5 text-[10px] text-white flex items-center gap-1 shadow pointer-events-none"
              style={{
                backgroundColor: theme.panelBg,
                border: `1.5px solid ${theme.borderColor}`,
              }}
            >
              <span className="font-bold text-amber-200 truncate max-w-[75px]">
                {worldSnapshot.killFeed[0].killerName}
              </span>
              <span className="text-white/80">[{worldSnapshot.killFeed[0].weaponLabel}]</span>
              <span className="font-bold text-rose-200 truncate max-w-[75px]">
                {worldSnapshot.killFeed[0].victimName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* HUD Control Edit Banner (Only shown when explicitly launched from Title or Pause Menu) */}
      {isEditingControls && (
        <div
          data-testid="hud-control-edit-banner"
          className="mx-auto pointer-events-auto px-3.5 py-2 rounded-md bg-slate-950/92 border-2 border-sky-400 text-white shadow-2xl flex flex-wrap items-center gap-2.5 z-30"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-mono-hud font-bold text-sky-300">
            <Move className="w-3.5 h-3.5" />
            <span>DRAG ANY CONTROL TO REPOSITION</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="hud-reset-controls-btn"
              onClick={() =>
                onUpdateSettings({
                  controlLayout: { ...DEFAULT_CONTROL_LAYOUT },
                })
              }
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Default
            </button>
            <button
              type="button"
              data-testid="hud-done-controls-btn"
              onClick={onToggleEditControls}
              className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Done
            </button>
          </div>
        </div>
      )}

      {/* Respawn Center Notice */}
      {player && !player.alive && !isEditingControls && (
        <div
          className="mx-auto rounded-sm px-5 py-2.5 text-center shadow-2xl"
          style={{
            backgroundColor: theme.panelBg,
            border: `2.5px solid ${theme.borderColor}`,
          }}
        >
          <div className="text-xs font-extrabold uppercase tracking-wider text-rose-200">
            Killed In Action
          </div>
          <div className="font-mono-hud text-base sm:text-lg font-bold text-white">
            {player.livesRemaining > 0
              ? `Redeploying in ${Math.max(0.1, player.respawnTimer).toFixed(1)}s`
              : 'Out of Lives'}
          </div>
        </div>
      )}

      {/* SCOPE ZOOM BUTTON (5X / 3X / 1X) — Never drags during active gameplay */}
      <button
        type="button"
        tabIndex={-1}
        data-testid="hud-scope-zoom-btn"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          if (isEditingControls) {
            setDraggingControlId('scopeBtn');
          }
        }}
        onPointerMove={(e) => {
          if (isEditingControls && draggingControlId === 'scopeBtn' && e.buttons > 0) {
            moveControlToViewport('scopeBtn', e.clientX, e.clientY);
          }
        }}
        onPointerUp={() => {
          setDraggingControlId(null);
          if (!isEditingControls) {
            onCycleScopeZoom();
          }
        }}
        onPointerCancel={() => {
          setDraggingControlId(null);
        }}
        aria-label={`Cycle weapon scope zoom (${scopePowerLabel})`}
        title="Cycle Gun Scope Zoom [Z / Scroll]"
        className={`absolute z-20 w-12 h-12 sm:w-15 sm:h-15 rounded-full flex items-center justify-center shadow-lg pointer-events-auto touch-none ${
          isEditingControls
            ? 'ring-4 ring-sky-400 cursor-grab active:cursor-grabbing'
            : 'hover:scale-105 active:scale-95'
        }`}
        style={{
          left: `${layout.scopeBtn.xPct}%`,
          top: `${layout.scopeBtn.yPct}%`,
          transform: 'translate(-50%, -50%)',
          backgroundColor:
            scopeZoomLevel >= 3
              ? 'rgba(16, 185, 129, 0.34)'
              : theme.panelBg,
          border: `3px solid ${scopeZoomLevel >= 3 ? theme.accentColor : theme.borderColor}`,
        }}
      >
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex flex-col items-center justify-center leading-none"
          style={{
            borderColor:
              scopeZoomLevel >= 3 ? theme.accentColor : theme.borderColor,
          }}
        >
          <span className="font-mono-hud text-xs sm:text-sm font-extrabold text-white tracking-wider drop-shadow">
            {scopePowerLabel}
          </span>
        </div>
        <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-white/90" />
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-white/90" />
        <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-0.5 bg-white/90" />
        <span className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-0.5 bg-white/90" />
      </button>

      {/* TOUCH CONTROLS (MOVE, GRENADE, MELEE, FIRE) — Locked in place during gameplay */}
      {(showTouchControls || isEditingControls) && player && (
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{ opacity: isEditingControls ? 1 : settings.controlOpacity }}
        >
          {/* 1. Double-Ring Movement & Jetpack Pad with Movable Inner Thumb Knob */}
          <div
            ref={moveStickRef}
            data-testid="hud-control-moveStick"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              if (isEditingControls) {
                setDraggingControlId('moveStick');
                moveControlToViewport('moveStick', e.clientX, e.clientY);
              } else {
                handleMovePointer(e);
              }
            }}
            onPointerMove={(e) => {
              if (e.buttons <= 0) return;
              if (isEditingControls) {
                if (draggingControlId === 'moveStick') {
                  moveControlToViewport('moveStick', e.clientX, e.clientY);
                }
              } else {
                handleMovePointer(e);
              }
            }}
            onPointerUp={() => {
              setDraggingControlId(null);
              setMoveKnobOffset({ x: 0, y: 0 });
              touchBridge.current.moveX = 0;
              touchBridge.current.crouchHeld = false;
              touchBridge.current.jetpackHeld = false;
            }}
            onPointerCancel={() => {
              setDraggingControlId(null);
              setMoveKnobOffset({ x: 0, y: 0 });
              touchBridge.current.moveX = 0;
              touchBridge.current.crouchHeld = false;
              touchBridge.current.jetpackHeld = false;
            }}
            aria-label="Movement and jetpack stick"
            style={{
              left: `${layout.moveStick.xPct}%`,
              top: `${layout.moveStick.yPct}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: theme.controlRingBg,
              border: `4.5px solid ${theme.borderColor}`,
            }}
            className={`absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center touch-none pointer-events-auto shadow-2xl ${
              isEditingControls
                ? 'ring-4 ring-sky-400 cursor-grab active:cursor-grabbing'
                : 'cursor-pointer'
            }`}
          >
            <div
              className="w-16 h-16 sm:w-22 sm:h-22 rounded-full border-2 border-white/80 flex flex-col items-center justify-center transition-transform duration-75"
              style={{
                backgroundColor: theme.controlInnerBg,
                transform: `translate(${moveKnobOffset.x}px, ${moveKnobOffset.y}px)`,
              }}
            >
              {isEditingControls && (
                <span className="font-mono-hud text-[9px] text-sky-300">
                  {Math.round(layout.moveStick.xPct)}%,{Math.round(layout.moveStick.yPct)}%
                </span>
              )}
            </div>
          </div>

          {/* 2. Circular Pineapple Frag Grenade Button */}
          <button
            type="button"
            tabIndex={-1}
            data-testid="hud-control-grenadeBtn"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              if (isEditingControls) {
                setDraggingControlId('grenadeBtn');
              }
            }}
            onPointerMove={(e) => {
              if (isEditingControls && draggingControlId === 'grenadeBtn' && e.buttons > 0) {
                moveControlToViewport('grenadeBtn', e.clientX, e.clientY);
              }
            }}
            onPointerUp={() => {
              setDraggingControlId(null);
              if (!isEditingControls) {
                touchBridge.current.triggerGrenade();
              }
            }}
            onPointerCancel={() => {
              setDraggingControlId(null);
            }}
            aria-label="Throw Frag Grenade (Unlimited)"
            title="Throw Frag Grenade [G]"
            style={{
              left: `${layout.grenadeBtn.xPct}%`,
              top: `${layout.grenadeBtn.yPct}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: theme.panelBg,
              border: `3.5px solid ${theme.borderColor}`,
            }}
            className={`absolute w-14 h-14 sm:w-18 sm:h-18 rounded-full flex items-center justify-center gap-0.5 pointer-events-auto touch-none shadow-xl ${
              isEditingControls
                ? 'ring-4 ring-sky-400 cursor-grab active:cursor-grabbing'
                : 'active:scale-95'
            }`}
          >
            <PineappleGrenadeSvg className="w-6 h-7 sm:w-7 sm:h-8" />
            <span className="font-mono-hud text-sm sm:text-base font-extrabold text-white drop-shadow">
              ∞
            </span>
          </button>

          {/* 3. Circular Clenched-Fist Melee Button */}
          <button
            type="button"
            tabIndex={-1}
            data-testid="hud-control-meleeBtn"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              if (isEditingControls) {
                setDraggingControlId('meleeBtn');
              }
            }}
            onPointerMove={(e) => {
              if (isEditingControls && draggingControlId === 'meleeBtn' && e.buttons > 0) {
                moveControlToViewport('meleeBtn', e.clientX, e.clientY);
              }
            }}
            onPointerUp={() => {
              setDraggingControlId(null);
              if (!isEditingControls) {
                touchBridge.current.triggerMelee();
              }
            }}
            onPointerCancel={() => {
              setDraggingControlId(null);
            }}
            aria-label="Melee Strike [E]"
            title="Melee Strike [E]"
            style={{
              left: `${layout.meleeBtn.xPct}%`,
              top: `${layout.meleeBtn.yPct}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: theme.panelBg,
              border: `3.5px solid ${theme.borderColor}`,
            }}
            className={`absolute w-14 h-14 sm:w-18 sm:h-18 rounded-full flex items-center justify-center pointer-events-auto touch-none shadow-xl ${
              isEditingControls
                ? 'ring-4 ring-sky-400 cursor-grab active:cursor-grabbing'
                : 'active:scale-95'
            }`}
          >
            <ClenchedFistSvg className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>

          {/* 4. Overlapping Red-Tinted Dual-Ring Aim & Fire Pad with Movable Knob */}
          <div
            ref={aimStickRef}
            data-testid="hud-control-fireStick"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              if (isEditingControls) {
                setDraggingControlId('fireStick');
                moveControlToViewport('fireStick', e.clientX, e.clientY);
              } else {
                handleAimPointer(e);
              }
            }}
            onPointerMove={(e) => {
              if (e.buttons <= 0) return;
              if (isEditingControls) {
                if (draggingControlId === 'fireStick') {
                  moveControlToViewport('fireStick', e.clientX, e.clientY);
                }
              } else {
                handleAimPointer(e);
              }
            }}
            onPointerUp={() => {
              setDraggingControlId(null);
              setFireKnobOffset({ x: 0, y: 0 });
              touchBridge.current.fireHeld = false;
            }}
            onPointerCancel={() => {
              setDraggingControlId(null);
              setFireKnobOffset({ x: 0, y: 0 });
              touchBridge.current.fireHeld = false;
            }}
            aria-label="Aim and Fire pad"
            style={{
              left: `${layout.fireStick.xPct}%`,
              top: `${layout.fireStick.yPct}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center touch-none pointer-events-auto ${
              isEditingControls
                ? 'ring-4 ring-sky-400 rounded-full cursor-grab active:cursor-grabbing'
                : 'cursor-crosshair'
            }`}
          >
            {/* Upper-Left Secondary Translucent Red Ring (Like Mini Militia reference) */}
            <div
              className="absolute top-0 left-0 w-18 h-18 sm:w-24 sm:h-24 rounded-full pointer-events-none"
              style={{
                backgroundColor: 'rgba(185, 74, 72, 0.38)',
                border: `3.5px solid ${theme.borderColor}`,
              }}
            />
            {/* Main Lower-Right Red Fire Ring */}
            <div
              className="absolute bottom-1 right-1 w-24 h-24 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center shadow-2xl"
              style={{
                backgroundColor: 'rgba(168, 58, 56, 0.56)',
                border: `4.5px solid ${theme.borderColor}`,
              }}
            >
              {/* Movable inner fire thumb puck */}
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white/80 bg-red-900/60 flex items-center justify-center transition-transform duration-75"
                style={{
                  transform: `translate(${fireKnobOffset.x}px, ${fireKnobOffset.y}px)`,
                }}
              >
                {isEditingControls && (
                  <span className="font-mono-hud text-[9px] text-sky-200">
                    {Math.round(layout.fireStick.xPct)}%,{Math.round(layout.fireStick.yPct)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

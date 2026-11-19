import React, { useState } from 'react';
import { Crosshair, Download, Edit3, Move, Settings, Shield, Users, Volume2, VolumeX } from 'lucide-react';
import { MAP_LIST } from '../game/maps';
import { getLevelFromXp } from '../game/progression';
import { ControlSettings, GameModeId, MapId, PlayerProfile } from '../game/types';
import { WEAPONS } from '../game/weapons';
import { ApkInstallModal } from './ApkInstallModal';

interface TitleOverlayProps {
  profile: PlayerProfile;
  settings: ControlSettings;
  selectedMode: GameModeId;
  selectedMap: MapId;
  onSelectMode: (mode: GameModeId) => void;
  onSelectMap: (map: MapId) => void;
  onUpdateProfile: (patch: Partial<PlayerProfile>) => void;
  onStart: () => void;
  onOpenArmory: () => void;
  onOpenSettings: () => void;
  onOpenControlsCustomizer: () => void;
  onOpenMultiplayer: () => void;
  onToggleMute: () => void;
}

const MODES: { id: GameModeId; label: string; desc: string }[] = [
  { id: 'training', label: 'Training Range', desc: 'Target dummies & jetpack drills' },
  { id: 'deathmatch', label: 'Deathmatch', desc: 'Free-for-all to 12 kills' },
  { id: 'tdm', label: 'Team Deathmatch', desc: 'Alpha vs Bravo squad warfare' },
  { id: 'survival', label: 'Survival Waves', desc: '5 escalating enemy waves' },
];

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  profile,
  settings,
  selectedMode,
  selectedMap,
  onSelectMode,
  onSelectMap,
  onUpdateProfile,
  onStart,
  onOpenArmory,
  onOpenSettings,
  onOpenControlsCustomizer,
  onOpenMultiplayer,
  onToggleMute,
}) => {
  const [showApkModal, setShowApkModal] = useState(false);
  const rank = getLevelFromXp(profile.xp);
  const primaryGun = WEAPONS[profile.primaryWeapon]?.shortName ?? 'AK-47';
  const secondaryGun = WEAPONS[profile.secondaryWeapon]?.shortName ?? 'DUAL UZI';

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 md:p-8 overflow-y-auto pointer-events-auto bg-gradient-to-r from-[#0B0E14]/94 via-[#0B0E14]/75 to-transparent gap-3">
      {/* Top operator bar with Direct Player Name Editor + Drag Controls & Settings buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-300">
          <label
            htmlFor="title-player-name-input"
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#161B22]/95 border border-slate-700/90 focus-within:border-amber-400 transition-colors"
            title="Click to change your player name"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-mono-hud uppercase tracking-wider text-slate-400">
              Name:
            </span>
            <input
              id="title-player-name-input"
              data-testid="title-name-input"
              aria-label="Player Name"
              type="text"
              maxLength={16}
              placeholder="Enter Name..."
              value={profile.callsign}
              onChange={(e) => onUpdateProfile({ callsign: e.target.value })}
              className="w-24 sm:w-32 bg-transparent font-semibold text-white text-xs sm:text-sm focus:outline-none"
            />
          </label>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="font-mono-hud text-amber-400 text-xs sm:text-sm">
            Lv.{rank.level} {rank.rankTitle}
          </span>
          <span aria-hidden="true" className="text-slate-500 hidden sm:inline">·</span>
          <span className="font-mono-hud text-xs text-slate-300 hidden sm:inline">
            {primaryGun} + {secondaryGun}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            data-testid="title-apk-install-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              setShowApkModal(true);
            }}
            aria-label="Download Android APK or Install Mobile App"
            className="h-8 sm:h-9 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-md bg-emerald-950/80 border border-emerald-500/60 text-[11px] sm:text-xs font-semibold text-emerald-200 hover:bg-emerald-900/80 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>APK / Install App</span>
          </button>

          <button
            type="button"
            data-testid="title-drag-controls-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenControlsCustomizer();
            }}
            aria-label="Drag and Customize Controls"
            className="h-8 sm:h-9 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-md bg-[#161B22]/90 border border-slate-700/80 text-[11px] sm:text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Move className="w-3.5 h-3.5 text-sky-400" />
            <span>Drag Controls</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSettings();
            }}
            aria-label="Open Settings and Character Customizer"
            className="h-8 sm:h-9 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-md bg-[#161B22]/90 border border-slate-700/80 text-[11px] sm:text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Settings &amp; Customize</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={settings.muted ? 'Unmute audio' : 'Mute audio'}
            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-md bg-[#161B22]/90 border border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main asymmetric negative-space tactical lockup — Responsive for phone landscape & desktop */}
      <div className="max-w-3xl space-y-2 sm:space-y-3.5 my-auto">
        {/* Bespoke inline SVG military crest & title lockup + Quick Deploy CTA row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <svg
            viewBox="0 0 420 76"
            className="w-full max-w-[185px] sm:max-w-[310px] h-auto"
            role="img"
            aria-label="EliteStrike"
          >
            {/* Tactical Shield Crest */}
            <polygon
              points="30,6 56,16 52,48 30,68 8,48 4,16"
              fill="#1E293B"
              stroke="#DC2626"
              strokeWidth="3"
            />
            <polygon
              points="30,14 46,21 43,43 30,57 17,43 14,21"
              fill="#DC2626"
            />
            <path
              d="M22 36 L30 22 L38 36 L30 33 Z"
              fill="#F8FAFC"
            />
            {/* Wordmark */}
            <text
              x="72"
              y="47"
              fill="#F8FAFC"
              fontFamily="Barlow Condensed, sans-serif"
              fontWeight="800"
              fontSize="48"
              letterSpacing="2"
            >
              ELITE
            </text>
            <text
              x="190"
              y="47"
              fill="#EF4444"
              fontFamily="Barlow Condensed, sans-serif"
              fontWeight="800"
              fontSize="48"
              letterSpacing="2"
            >
              STRIKE
            </text>
            <rect x="72" y="56" width="276" height="2.5" fill="#475569" />
            <text
              x="72"
              y="70"
              fill="#94A3B8"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="600"
              fontSize="11"
              letterSpacing="2.4"
            >
              2D TACTICAL JETPACK COMBAT
            </text>
          </svg>

          {/* Primary Menu Actions — Always visible above the fold on mobile landscape */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStart();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-md bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-display text-base sm:text-xl font-bold tracking-wide transition-colors shadow-lg shadow-red-950/50 whitespace-nowrap"
            >
              <Crosshair className="w-4 h-4 sm:w-5 sm:h-5" />
              Deploy Solo
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenMultiplayer();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-md bg-[#1C222D] hover:bg-[#262E3D] border border-slate-600 text-slate-100 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
              Host / Join Room
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenArmory();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-md bg-[#1C222D] hover:bg-[#262E3D] border border-slate-600 text-slate-100 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              Armory
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">Combat Mode</span>
            <span className="text-[11px] text-slate-400">
              {MODES.find((m) => m.id === selectedMode)?.desc}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {MODES.map((m) => {
              const active = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  data-mode={m.id}
                  onClick={() => onSelectMode(m.id)}
                  className={`px-2 py-1 sm:px-2.5 sm:py-2 rounded-md text-left border transition-colors ${
                    active
                      ? 'bg-red-600/20 border-red-500 text-white'
                      : 'bg-[#161B22]/90 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  <div className="text-[11px] sm:text-xs font-semibold whitespace-nowrap truncate">
                    {m.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Selector + Tactical Strategy Brief */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">Battle Zone</span>
            {(() => {
              const activeMap = MAP_LIST.find((m) => m.id === selectedMap) ?? MAP_LIST[0];
              return (
                <span className="font-mono-hud text-[10px] sm:text-[11px] text-amber-400">
                  {activeMap.width}×{activeMap.height}m · {activeMap.buildings.length} Tactical Buildings
                </span>
              );
            })()}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MAP_LIST.map((map) => {
              const active = selectedMap === map.id;
              return (
                <button
                  key={map.id}
                  type="button"
                  data-map={map.id}
                  onClick={() => onSelectMap(map.id)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-medium border whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-slate-100 text-slate-900 border-white'
                      : 'bg-[#161B22]/90 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {map.name}
                </button>
              );
            })}
          </div>
          {(() => {
            const activeMap = MAP_LIST.find((m) => m.id === selectedMap) ?? MAP_LIST[0];
            return (
              <div className="p-1.5 sm:p-2 rounded-md bg-[#11161F]/88 border border-slate-700/70 space-y-1">
                {activeMap.specialMechanicLabel && (
                  <div
                    data-testid="title-map-special-mechanic"
                    className="font-mono-hud text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-400"
                  >
                    ★ Special Mechanic: {activeMap.specialMechanicLabel}
                  </div>
                )}
                <p className="text-[10px] sm:text-[11px] leading-snug text-slate-300 line-clamp-1 sm:line-clamp-none">
                  <span className="font-bold text-amber-400 uppercase tracking-wider mr-1.5">
                    Strategy:
                  </span>
                  {activeMap.strategySummary}
                </p>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {activeMap.buildings.map((b) => (
                    <span
                      key={b.id}
                      style={{
                        borderColor: b.accentColor ?? 'rgba(71, 85, 105, 0.7)',
                        color: b.accentColor ?? '#E2E8F0',
                      }}
                      className="px-1.5 py-0.5 rounded-xs bg-slate-900/90 border font-mono-hud text-[8px] sm:text-[9px] font-semibold"
                    >
                      {b.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Bottom flat borderless control hint */}
      <div className="hidden sm:block text-xs text-slate-400 tracking-wide pointer-events-none">
        A / D Move · W / Space Jump &amp; Jetpack · S Crouch · Mouse Aim &amp; Fire · 1–2 Swap · R Reload · G Grenade · E Melee · Esc Pause
      </div>

      {showApkModal && <ApkInstallModal onClose={() => setShowApkModal(false)} />}
    </div>
  );
};

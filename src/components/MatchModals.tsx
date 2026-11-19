import React, { useRef, useState } from 'react';
import { Edit3, Home, Move, Play, RotateCcw, Sliders, UserCog, X } from 'lucide-react';
import {
  DEFAULT_CONTROL_LAYOUT,
  getLevelFromXp,
  updateControlLayoutPosition,
} from '../game/progression';
import {
  ControlSettings,
  DraggableControlId,
  MatchWorld,
  PlayerProfile,
} from '../game/types';
import { CharacterCustomizerPanel } from './CharacterPreviewSvg';

interface PauseModalProps {
  profile: PlayerProfile;
  settings: ControlSettings;
  onUpdateProfile: (patch: Partial<PlayerProfile>) => void;
  onUpdateSettings: (patch: Partial<ControlSettings>) => void;
  onResume: () => void;
  onStartHudControlEdit?: () => void;
  onRestart?: () => void;
  onExitToTitle?: () => void;
  isTitleSettings?: boolean;
  initialTab?: 'character' | 'controls';
}

const DRAGGABLE_ITEMS: {
  id: DraggableControlId;
  label: string;
  shortLabel: string;
  sizeClass: string;
  colorClass: string;
}[] = [
  {
    id: 'moveStick',
    label: 'Move & Jetpack Stick',
    shortLabel: 'MOVE',
    sizeClass: 'w-16 h-16 text-[10px]',
    colorClass: 'bg-slate-700/85 border-white text-white',
  },
  {
    id: 'grenadeBtn',
    label: 'Frag Grenade Button',
    shortLabel: 'GRN ∞',
    sizeClass: 'w-11 h-11 text-[9px]',
    colorClass: 'bg-emerald-800/85 border-emerald-300 text-emerald-100',
  },
  {
    id: 'meleeBtn',
    label: 'Melee Fist Button',
    shortLabel: 'MELEE',
    sizeClass: 'w-11 h-11 text-[9px]',
    colorClass: 'bg-amber-800/85 border-amber-300 text-amber-100',
  },
  {
    id: 'fireStick',
    label: 'Aim & Fire Stick',
    shortLabel: 'FIRE',
    sizeClass: 'w-16 h-16 text-[10px]',
    colorClass: 'bg-red-700/85 border-red-200 text-white',
  },
  {
    id: 'scopeBtn',
    label: 'Scope Zoom Button',
    shortLabel: 'SCOPE',
    sizeClass: 'w-11 h-11 text-[9px]',
    colorClass: 'bg-teal-800/85 border-teal-300 text-teal-100',
  },
];

export const PauseModal: React.FC<PauseModalProps> = ({
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onResume,
  onStartHudControlEdit,
  onRestart,
  onExitToTitle,
  isTitleSettings = false,
  initialTab = 'character',
}) => {
  const [activeTab, setActiveTab] = useState<'character' | 'controls'>(initialTab);
  const [draggingId, setDraggingId] = useState<DraggableControlId | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  const layout = settings.controlLayout ?? DEFAULT_CONTROL_LAYOUT;

  const updateDraggedPosition = (id: DraggableControlId, clientX: number, clientY: number) => {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const rawXPct = ((clientX - rect.left) / rect.width) * 100;
    const rawYPct = ((clientY - rect.top) / rect.height) * 100;
    const nextLayout = updateControlLayoutPosition(layout, id, {
      xPct: rawXPct,
      yPct: rawYPct,
    });
    onUpdateSettings({ controlLayout: nextLayout });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/78 p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#161B22] border border-slate-700 rounded-lg p-6 space-y-5 shadow-2xl">
        {/* Header + Quick Player Name Input + Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white tracking-wide">
              {isTitleSettings ? 'Settings & Character Customizer' : 'Match Paused · Settings'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Change your player name, customize your character &amp; drag controls to reposition.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Always-visible Player Name quick editor in modal header */}
            <label
              htmlFor="settings-header-name-input"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#0E1319] border border-slate-700 focus-within:border-amber-400"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] font-mono-hud uppercase text-slate-400">
                Name:
              </span>
              <input
                id="settings-header-name-input"
                data-testid="settings-name-input"
                aria-label="Player Name in Settings"
                type="text"
                maxLength={16}
                placeholder="Enter Name..."
                value={profile.callsign}
                onChange={(e) => onUpdateProfile({ callsign: e.target.value })}
                className="w-28 bg-transparent text-xs font-semibold text-white focus:outline-none"
              />
            </label>

            <div
              role="tablist"
              aria-label="Settings sections"
              className="flex items-center bg-[#0E1319] p-1 rounded-md border border-slate-800"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'character'}
                onClick={() => setActiveTab('character')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'character'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <UserCog className="w-3.5 h-3.5" />
                Customize Character
              </button>
              <button
                type="button"
                role="tab"
                data-testid="tab-controls-audio"
                aria-selected={activeTab === 'controls'}
                onClick={() => setActiveTab('controls')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'controls'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Drag Controls &amp; Audio
              </button>
            </div>

            <button
              type="button"
              onClick={onResume}
              aria-label="Close Settings"
              className="h-9 w-9 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Live Character & Gun Customizer inside Settings */}
        {activeTab === 'character' ? (
          <CharacterCustomizerPanel
            profile={profile}
            onUpdateProfile={onUpdateProfile}
            compact
          />
        ) : (
          /* Tab 2: Drag-and-Drop Control Layout Customizer + Audio Settings */
          <div className="space-y-4 py-1">
            {/* Interactive Drag-and-Drop Control Customizer Arena */}
            <div className="bg-[#0E1319] border border-slate-800 rounded-md p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5" />
                    Drag Controls to Reposition (HUD Layout Customizer)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Drag MOVE, FIRE, GRENADE, MELEE, or SCOPE buttons below to customize your layout.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onStartHudControlEdit && (
                    <button
                      type="button"
                      data-testid="modal-live-hud-drag-btn"
                      onClick={onStartHudControlEdit}
                      className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Move className="w-3.5 h-3.5" />
                      Drag on Live HUD
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="reset-control-layout-btn"
                    onClick={() =>
                      onUpdateSettings({
                        controlLayout: { ...DEFAULT_CONTROL_LAYOUT },
                      })
                    }
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    Reset Default Layout
                  </button>
                </div>
              </div>

              {/* 16:9 Interactive Drag Arena */}
              <div
                ref={arenaRef}
                data-testid="settings-control-drag-area"
                className="relative w-full h-64 sm:h-72 rounded-md bg-gradient-to-b from-[#13221B] via-[#1C3126] to-[#101820] border-2 border-slate-700 overflow-hidden select-none touch-none"
              >
                {/* Simulated HUD Top Reference Outlines */}
                <div className="absolute top-2.5 left-3 px-2.5 py-1 rounded bg-slate-900/70 border border-slate-600/60 text-[9px] font-mono-hud text-slate-300 pointer-events-none">
                  HP / GAS ∞ ({profile.callsign})
                </div>
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-slate-900/70 border border-slate-600/60 text-[9px] font-mono-hud text-slate-300 pointer-events-none">
                  WEAPON DOCK · ∞
                </div>
                <div className="absolute top-2.5 right-3 px-2.5 py-1 rounded bg-slate-900/70 border border-slate-600/60 text-[9px] font-mono-hud text-slate-300 pointer-events-none">
                  MINIMAP
                </div>

                {/* Subtle Grid Lines */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-15"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, #94A3B8 1px, transparent 1px), linear-gradient(to bottom, #94A3B8 1px, transparent 1px)',
                    backgroundSize: '10% 20%',
                  }}
                />

                {/* Draggable Control Nodes */}
                {DRAGGABLE_ITEMS.map((item) => {
                  const pos = layout[item.id] ?? DEFAULT_CONTROL_LAYOUT[item.id];
                  const isActive = draggingId === item.id;
                  return (
                    <div
                      key={item.id}
                      data-testid={`preview-drag-${item.id}`}
                      role="slider"
                      aria-label={`Drag ${item.label}`}
                      aria-valuenow={Math.round(pos.xPct)}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        setDraggingId(item.id);
                        updateDraggedPosition(item.id, e.clientX, e.clientY);
                      }}
                      onPointerMove={(e) => {
                        if (draggingId === item.id && e.buttons > 0) {
                          updateDraggedPosition(item.id, e.clientX, e.clientY);
                        }
                      }}
                      onPointerUp={() => setDraggingId(null)}
                      onPointerCancel={() => setDraggingId(null)}
                      style={{
                        left: `${pos.xPct}%`,
                        top: `${pos.yPct}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute rounded-full border-2 flex flex-col items-center justify-center font-mono-hud font-extrabold cursor-grab active:cursor-grabbing shadow-lg transition-shadow ${
                        item.sizeClass
                      } ${item.colorClass} ${
                        isActive ? 'ring-4 ring-sky-400 scale-110 z-20' : 'z-10 hover:ring-2 hover:ring-white/80'
                      }`}
                    >
                      <span>{item.shortLabel}</span>
                      <span className="text-[8px] font-normal opacity-85">
                        {Math.round(pos.xPct)}%,{Math.round(pos.yPct)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#0E1319] border border-slate-800 rounded-md p-4 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Audio Configuration
                </div>

                <label className="flex items-center justify-between text-sm text-slate-200">
                  <span>SFX Volume ({Math.round(settings.sfxVolume * 100)}%)</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.sfxVolume}
                    onChange={(e) =>
                      onUpdateSettings({ sfxVolume: Number(e.target.value) })
                    }
                    className="w-36 accent-red-500"
                  />
                </label>

                <label className="flex items-center justify-between text-sm text-slate-200">
                  <span>Mute All Audio</span>
                  <input
                    type="checkbox"
                    checked={settings.muted}
                    onChange={(e) =>
                      onUpdateSettings({ muted: e.target.checked })
                    }
                    className="h-4 w-4 accent-red-500 rounded"
                  />
                </label>
              </div>

              <div className="bg-[#0E1319] border border-slate-800 rounded-md p-4 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  HUD &amp; Touch Controls
                </div>

                <label className="flex items-center justify-between text-sm text-slate-200">
                  <span>Touch Controls</span>
                  <select
                    value={settings.touchControls}
                    onChange={(e) =>
                      onUpdateSettings({
                        touchControls: e.target.value as ControlSettings['touchControls'],
                      })
                    }
                    className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                  >
                    <option value="auto">Auto-Detect</option>
                    <option value="always">Always On</option>
                    <option value="off">Off (Keyboard/Mouse)</option>
                  </select>
                </label>

                <label className="flex items-center justify-between text-sm text-slate-200">
                  <span>Control Opacity ({Math.round(settings.controlOpacity * 100)}%)</span>
                  <input
                    type="range"
                    min={0.35}
                    max={1}
                    step={0.05}
                    value={settings.controlOpacity}
                    onChange={(e) =>
                      onUpdateSettings({ controlOpacity: Number(e.target.value) })
                    }
                    className="w-36 accent-red-500"
                  />
                </label>

                <label className="flex items-center justify-between text-sm text-slate-200">
                  <span>Tactical Aim Assist</span>
                  <input
                    type="checkbox"
                    checked={settings.aimAssist}
                    onChange={(e) =>
                      onUpdateSettings({ aimAssist: e.target.checked })
                    }
                    className="h-4 w-4 accent-red-500 rounded"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          {!isTitleSettings && onRestart && onExitToTitle ? (
            <>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onRestart}
                  className="py-2.5 px-4 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart
                </button>
                <button
                  type="button"
                  onClick={onExitToTitle}
                  className="py-2.5 px-4 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Title Menu
                </button>
              </div>
              <button
                type="button"
                onClick={onResume}
                className="py-2.5 px-6 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                Apply &amp; Resume Match
              </button>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={onResume}
                className="py-2.5 px-6 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
              >
                Save &amp; Close Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ResultsModalProps {
  world: MatchWorld;
  localPlayerId: string;
  xpEarned: number;
  profile: PlayerProfile;
  onPlayAgain: () => void;
  onExitToTitle: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  world,
  localPlayerId,
  xpEarned,
  profile,
  onPlayAgain,
  onExitToTitle,
}) => {
  const sorted = [...world.soldiers].sort(
    (a, b) => b.kills - a.kills || a.deaths - b.deaths,
  );
  const me = world.soldiers.find((s) => s.id === localPlayerId);
  const isVictory =
    world.mode === 'tdm' || world.mode === 'survival'
      ? world.winnerTeam === me?.team
      : sorted[0]?.id === localPlayerId;
  const rank = getLevelFromXp(profile.xp);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/78 p-4">
      <div className="w-full max-w-xl bg-[#161B22] border border-slate-700 rounded-lg p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className={`text-xs font-bold uppercase tracking-widest ${
                isVictory ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isVictory ? 'Mission Accomplished' : 'Match Complete'}
            </div>
            <h2 className="font-display text-4xl font-extrabold text-white tracking-wide">
              {isVictory ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Winner: <span className="text-slate-200 font-medium">{world.winnerName}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Rank Progress</div>
            <div className="font-mono-hud text-sm font-bold text-amber-400">
              Lv.{rank.level} {rank.rankTitle}
            </div>
            <div className="font-mono-hud text-xs text-emerald-400">
              +{xpEarned} XP
            </div>
          </div>
        </div>

        {/* 3 Tabular Stat Tiles */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0E1319] border border-slate-800 rounded-md p-3">
            <div className="text-[11px] text-slate-400">Your Kills</div>
            <div className="font-mono-hud text-2xl font-bold text-white">
              {me?.kills ?? 0}
            </div>
          </div>
          <div className="bg-[#0E1319] border border-slate-800 rounded-md p-3">
            <div className="text-[11px] text-slate-400">Deaths</div>
            <div className="font-mono-hud text-2xl font-bold text-white">
              {me?.deaths ?? 0}
            </div>
          </div>
          <div className="bg-[#0E1319] border border-slate-800 rounded-md p-3">
            <div className="text-[11px] text-slate-400">Damage Dealt</div>
            <div className="font-mono-hud text-2xl font-bold text-amber-300">
              {Math.round(me?.damageDealt ?? 0)}
            </div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="border border-slate-800 rounded-md overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1319] text-slate-400">
              <tr>
                <th className="py-2 px-3 font-medium">Combatant</th>
                <th className="py-2 px-3 font-medium text-right">Kills</th>
                <th className="py-2 px-3 font-medium text-right">Deaths</th>
                <th className="py-2 px-3 font-medium text-right">Damage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sorted.slice(0, 6).map((s) => (
                <tr
                  key={s.id}
                  className={s.id === localPlayerId ? 'bg-red-950/25' : ''}
                >
                  <td className="py-2 px-3 font-medium text-slate-100">
                    {s.name}{' '}
                    {s.isBot && (
                      <span className="text-[10px] text-slate-500">Bot</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono-hud text-white">
                    {s.kills}
                  </td>
                  <td className="py-2 px-3 text-right font-mono-hud text-slate-400">
                    {s.deaths}
                  </td>
                  <td className="py-2 px-3 text-right font-mono-hud text-slate-300">
                    {Math.round(s.damageDealt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="flex-1 py-3 px-5 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button
            type="button"
            onClick={onExitToTitle}
            className="py-3 px-5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-sm transition-colors"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

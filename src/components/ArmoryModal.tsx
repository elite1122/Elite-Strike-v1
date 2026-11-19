import React from 'react';
import { X } from 'lucide-react';
import { getLevelFromXp } from '../game/progression';
import { PlayerProfile } from '../game/types';
import { CharacterCustomizerPanel } from './CharacterPreviewSvg';

interface ArmoryModalProps {
  profile: PlayerProfile;
  onUpdateProfile: (patch: Partial<PlayerProfile>) => void;
  onClose: () => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
}) => {
  const rank = getLevelFromXp(profile.xp);
  const kd =
    profile.deaths > 0
      ? (profile.kills / profile.deaths).toFixed(2)
      : profile.kills.toFixed(2);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/78 p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#161B22] border border-slate-700 rounded-lg p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white tracking-wide">
              Armory &amp; Operator Customization
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="font-mono-hud text-amber-400">
                Lv.{rank.level} {rank.rankTitle}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-hud">
                XP {rank.currentLevelXp}/{rank.nextLevelXp}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-hud">{profile.kills} Kills</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-hud">K/D {kd}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-hud">{profile.wins} Wins</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Armory"
            className="h-9 w-9 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <CharacterCustomizerPanel
          profile={profile}
          onUpdateProfile={onUpdateProfile}
        />

        <div className="flex justify-end border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
          >
            Save &amp; Ready
          </button>
        </div>
      </div>
    </div>
  );
};

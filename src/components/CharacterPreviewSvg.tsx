import React, { useState } from 'react';
import {
  ArmorColorId,
  EyewearStyle,
  HelmetStyle,
  JetpackStyleId,
  PlayerProfile,
  SkinToneId,
  WeaponCategory,
  WeaponId,
} from '../game/types';
import {
  ARMOR_PALETTES,
  EYEWEAR_STYLES,
  HELMET_STYLES,
  JETPACK_STYLES,
  SKIN_TONES,
  WEAPON_LIST,
  WEAPONS,
} from '../game/weapons';

export const WeaponSilhouetteSvg: React.FC<{
  weaponId: WeaponId;
  className?: string;
}> = ({ weaponId, className = 'w-16 h-7' }) => {
  return (
    <svg
      viewBox="0 0 96 38"
      className={className}
      aria-hidden="true"
    >
      {weaponId === 'rifle' ? (
        /* Realistic M4A1 Carbine matching reference HUD */
        <g>
          {/* Retractable Buttstock */}
          <polygon
            points="4,13 22,13 22,19 12,23 4,24"
            fill="#1E293B"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          {/* Upper & Lower Receiver */}
          <rect
            x="22"
            y="12"
            width="25"
            height="8.5"
            rx="1"
            fill="#111827"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          {/* Iconic M4 Carry Handle */}
          <path
            d="M25 12 L27 7.5 L42 7.5 L44 12 Z"
            fill="none"
            stroke="#090D14"
            strokeWidth="2.4"
          />
          {/* Ribbed Handguard */}
          <rect
            x="47"
            y="12.5"
            width="19"
            height="6.5"
            rx="1"
            fill="#1F2937"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          <line x1="51" y1="13" x2="51" y2="18.5" stroke="#090D14" strokeWidth="1.1" />
          <line x1="55" y1="13" x2="55" y2="18.5" stroke="#090D14" strokeWidth="1.1" />
          <line x1="59" y1="13" x2="59" y2="18.5" stroke="#090D14" strokeWidth="1.1" />
          <line x1="63" y1="13" x2="63" y2="18.5" stroke="#090D14" strokeWidth="1.1" />
          {/* Triangular Front Sight Post */}
          <polygon points="68,14 71,7.5 74,14" fill="#090D14" />
          {/* Barrel & Flash Hider */}
          <rect
            x="66"
            y="14"
            width="22"
            height="3"
            fill="#374151"
            stroke="#090D14"
            strokeWidth="1.5"
          />
          <rect x="86" y="13.3" width="5" height="4.4" fill="#111827" />
          {/* Pistol Grip */}
          <polygon
            points="25,20.5 30,20.5 27,30 22,30"
            fill="#111827"
            stroke="#090D14"
            strokeWidth="1.6"
          />
          {/* Curved STANAG Magazine */}
          <path
            d="M36 20.5 L43 20.5 L46 33 L39 34 Z"
            fill="#1F2937"
            stroke="#090D14"
            strokeWidth="1.7"
          />
        </g>
      ) : weaponId === 'ak47' ? (
        /* Realistic AK-47 Kalashnikov */
        <g>
          {/* Wooden Buttstock */}
          <polygon
            points="4,15 22,13 22,20 6,25"
            fill="#9A3412"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          {/* Steel Receiver + Dust Cover */}
          <rect
            x="22"
            y="12"
            width="25"
            height="8"
            rx="1"
            fill="#1E293B"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          {/* Wooden Handguard */}
          <rect
            x="47"
            y="13"
            width="17"
            height="6"
            rx="1"
            fill="#B45309"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          {/* Gas Tube + Barrel + Front Sight */}
          <rect x="47" y="11" width="16" height="2.2" fill="#334155" />
          <rect
            x="64"
            y="14"
            width="22"
            height="3"
            fill="#334155"
            stroke="#090D14"
            strokeWidth="1.5"
          />
          <polygon points="80,14 83,8 85,14" fill="#090D14" />
          {/* Pistol Grip */}
          <polygon
            points="24,20 29,20 26,29 21,29"
            fill="#7C2D12"
            stroke="#090D14"
            strokeWidth="1.6"
          />
          {/* Curved Bakelite Banana Magazine */}
          <path
            d="M36 20 L43 20 L50 33 L43 35 Z"
            fill="#C2410C"
            stroke="#090D14"
            strokeWidth="1.8"
          />
        </g>
      ) : weaponId === 'rocket' ? (
        /* Realistic SMAW / RPG Launcher matching reference swap circle */
        <g>
          {/* Flared Rear Backblast Cone */}
          <polygon
            points="3,9 14,12.5 14,21.5 3,25"
            fill="#78716C"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          {/* Olive Launch Tube */}
          <rect
            x="14"
            y="12"
            width="64"
            height="10"
            rx="1.5"
            fill="#787146"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          {/* Reinforcing Dark Bands */}
          <rect x="28" y="11.2" width="5" height="11.6" fill="#111827" />
          <rect x="56" y="11.2" width="5" height="11.6" fill="#111827" />
          {/* Front Muzzle Lip */}
          <rect
            x="78"
            y="10.5"
            width="6"
            height="13"
            rx="1"
            fill="#57534E"
            stroke="#090D14"
            strokeWidth="1.6"
          />
          {/* Top Optical Sight */}
          <rect
            x="42"
            y="6.5"
            width="13"
            height="4.5"
            rx="1"
            fill="#0F172A"
            stroke="#090D14"
            strokeWidth="1.5"
          />
          {/* Foregrip & Trigger Housing */}
          <polygon
            points="44,22 52,22 49,33 41,33"
            fill="#0F172A"
            stroke="#090D14"
            strokeWidth="1.6"
          />
          <rect x="33" y="22" width="5" height="8" rx="1" fill="#1E293B" />
        </g>
      ) : weaponId === 'sawgun' ? (
        /* Realistic Machete Sawblade Launcher */
        <g>
          <rect
            x="10"
            y="12"
            width="44"
            height="11"
            rx="2"
            fill="#CA8A04"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          <rect x="18" y="15" width="22" height="4.5" fill="#0F172A" />
          <polygon points="22,23 28,23 25,32 19,32" fill="#1E293B" stroke="#090D14" strokeWidth="1.5" />
          <circle
            cx="66"
            cy="17.5"
            r="12"
            fill="#E2E8F0"
            stroke="#090D14"
            strokeWidth="2"
          />
          <circle cx="66" cy="17.5" r="4.2" fill="#38BDF8" stroke="#090D14" strokeWidth="1.2" />
        </g>
      ) : weaponId === 'uzi' ? (
        /* Micro Uzi Machine Pistol */
        <g>
          <rect
            x="24"
            y="10"
            width="30"
            height="10"
            rx="1.5"
            fill="#1E293B"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          <rect x="54" y="13" width="14" height="4" fill="#64748B" stroke="#090D14" strokeWidth="1.5" />
          <rect
            x="35"
            y="20"
            width="7.5"
            height="14"
            rx="1"
            fill="#0F172A"
            stroke="#090D14"
            strokeWidth="1.7"
          />
          <rect x="16" y="8" width="10" height="3" fill="#475569" />
        </g>
      ) : weaponId === 'smg' ? (
        /* MP5-K Tactical SMG */
        <g>
          <polygon points="10,14 22,13 22,19 10,21" fill="#0F172A" stroke="#090D14" strokeWidth="1.6" />
          <rect
            x="22"
            y="11"
            width="34"
            height="9"
            rx="1.5"
            fill="#1E293B"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          <rect x="56" y="13.5" width="16" height="4" fill="#334155" stroke="#090D14" strokeWidth="1.5" />
          <path d="M39 20 L45 20 L48 32 L42 33 Z" fill="#0F172A" stroke="#090D14" strokeWidth="1.6" />
          <rect x="26" y="20" width="5.5" height="9" fill="#0F172A" />
        </g>
      ) : weaponId === 'tavor' ? (
        /* TAR-21 Bullpup Rifle */
        <g>
          <rect
            x="10"
            y="11"
            width="48"
            height="11"
            rx="2"
            fill="#365314"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          <rect x="58" y="14" width="18" height="3.5" fill="#1E293B" stroke="#090D14" strokeWidth="1.5" />
          <rect x="34" y="7" width="16" height="4" rx="1" fill="#0F172A" />
          <path d="M18 22 L25 22 L27 33 L20 33 Z" fill="#1E293B" stroke="#090D14" strokeWidth="1.6" />
          <rect x="36" y="22" width="6" height="9" fill="#1E293B" />
        </g>
      ) : weaponId === 'gl' ? (
        /* RG-6 Revolving Grenade Launcher */
        <g>
          <rect x="8" y="14" width="18" height="7" rx="1.5" fill="#334155" stroke="#090D14" strokeWidth="1.8" />
          <rect
            x="26"
            y="8.5"
            width="24"
            height="16"
            rx="3"
            fill="#475569"
            stroke="#090D14"
            strokeWidth="2"
          />
          <line x1="26" y1="14" x2="50" y2="14" stroke="#090D14" strokeWidth="1.4" />
          <line x1="26" y1="19" x2="50" y2="19" stroke="#090D14" strokeWidth="1.4" />
          <rect x="50" y="12" width="24" height="8.5" rx="1.5" fill="#1E293B" stroke="#090D14" strokeWidth="1.8" />
          <rect x="28" y="24.5" width="6" height="8" fill="#0F172A" />
        </g>
      ) : weaponId === 'sniper' ? (
        /* M93BA Anti-Materiel Sniper */
        <g>
          <polygon points="4,14 20,13 20,20 4,22" fill="#0F172A" stroke="#090D14" strokeWidth="1.7" />
          <rect
            x="20"
            y="12.5"
            width="32"
            height="7.5"
            rx="1.5"
            fill="#1E293B"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          <rect x="52" y="14.5" width="36" height="3.2" fill="#475569" stroke="#090D14" strokeWidth="1.5" />
          <rect x="85" y="13" width="6" height="6" fill="#0F172A" />
          <rect x="26" y="6.5" width="22" height="4.8" rx="1" fill="#0F172A" stroke="#090D14" strokeWidth="1.4" />
          <rect x="44" y="7" width="3.5" height="3.8" fill="#38BDF8" />
          <rect x="34" y="20" width="8" height="9" fill="#0F172A" />
        </g>
      ) : weaponId === 'lmg' ? (
        /* M249 SAW Squad Automatic */
        <g>
          <rect
            x="8"
            y="11.5"
            width="46"
            height="9.5"
            rx="2"
            fill="#1E293B"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          <rect x="54" y="13.5" width="24" height="4.5" fill="#64748B" stroke="#090D14" strokeWidth="1.5" />
          <rect
            x="28"
            y="21"
            width="16"
            height="11"
            rx="1.5"
            fill="#15803D"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          <rect x="29" y="18" width="12" height="3" fill="#FACC15" />
        </g>
      ) : weaponId === 'shotgun' ? (
        /* SPAS-12 Combat Shotgun */
        <g>
          <polygon points="6,15 20,13 20,20 8,24" fill="#0F172A" stroke="#090D14" strokeWidth="1.7" />
          <rect
            x="20"
            y="12"
            width="52"
            height="7.5"
            rx="1.5"
            fill="#1E293B"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          <rect
            x="38"
            y="19.5"
            width="24"
            height="4.5"
            rx="1"
            fill="#475569"
            stroke="#090D14"
            strokeWidth="1.5"
          />
          <rect x="22" y="19.5" width="6" height="9" fill="#0F172A" />
        </g>
      ) : (
        /* Desert Magnum Sidearm */
        <g>
          <rect
            x="24"
            y="10"
            width="36"
            height="9.5"
            rx="1.5"
            fill="#64748B"
            stroke="#090D14"
            strokeWidth="1.8"
          />
          <polygon
            points="27,19.5 36,19.5 33,31 24,31"
            fill="#1E293B"
            stroke="#090D14"
            strokeWidth="1.7"
          />
        </g>
      )}
    </svg>
  );
};

export const CharacterPreviewSvg: React.FC<{
  profile: PlayerProfile;
  className?: string;
}> = ({ profile, className = 'w-36 h-40' }) => {
  const pal = ARMOR_PALETTES[profile.armorColor] ?? ARMOR_PALETTES.olive;
  const skin = SKIN_TONES[profile.skinTone ?? 'tan'] ?? SKIN_TONES.tan;
  const jp = JETPACK_STYLES[profile.jetpackStyle ?? 'amber'] ?? JETPACK_STYLES.amber;
  const eyewear = profile.eyewear ?? 'visor';
  const wId = profile.primaryWeapon;

  return (
    <svg
      viewBox="0 0 148 158"
      className={className}
      role="img"
      aria-label="Customized Operator Preview"
    >
      {/* Tactical floor shadow */}
      <ellipse cx="68" cy="146" rx="36" ry="6" fill="rgba(15, 23, 42, 0.72)" />

      {/* Twin Jetpack Thruster Flame Cones */}
      <polygon points="23,98 29,134 35,98" fill={jp.outer} />
      <polygon points="31,98 37,130 43,98" fill={jp.outer} />
      <polygon points="26,98 29,120 32,98" fill={jp.core} />
      <polygon points="34,98 37,118 40,98" fill={jp.core} />

      {/* Twin-Cylinder Jetpack Backpack */}
      <rect
        x="22"
        y="55"
        width="21"
        height="43"
        rx="5"
        fill="#334155"
        stroke="#0D1117"
        strokeWidth="3"
      />
      <rect x="25" y="92" width="6" height="6" fill="#0F172A" />
      <rect x="34" y="92" width="6" height="6" fill="#0F172A" />
      <rect x="28" y="63" width="8" height="6" rx="1.5" fill="#22C55E" />

      {/* Articulated Legs & Combat Boots */}
      <line
        x1="54"
        y1="104"
        x2="49"
        y2="134"
        stroke="#0D1117"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <line
        x1="76"
        y1="104"
        x2="81"
        y2="134"
        stroke="#0D1117"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <line
        x1="54"
        y1="104"
        x2="49"
        y2="134"
        stroke={pal.secondary}
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <line
        x1="76"
        y1="104"
        x2="81"
        y2="134"
        stroke={pal.secondary}
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      {/* Lace-up Combat Boots */}
      <rect x="41" y="131" width="16" height="9.5" rx="3" fill="#0F172A" stroke="#0D1117" strokeWidth="2.2" />
      <rect x="74" y="131" width="16" height="9.5" rx="3" fill="#0F172A" stroke="#0D1117" strokeWidth="2.2" />

      {/* Armored Torso & Tactical Plate Carrier */}
      <rect
        x="43"
        y="54"
        width="44"
        height="52"
        rx="9"
        fill={pal.primary}
        stroke="#0D1117"
        strokeWidth="3"
      />
      <rect
        x="49"
        y="61"
        width="32"
        height="34"
        rx="5"
        fill={pal.secondary}
      />
      <rect x="53" y="65" width="24" height="4" rx="1.5" fill={pal.accent} />

      {/* 3 Ammo Pouches + Tactical Belt */}
      <rect x="50" y="84" width="8" height="10" rx="1.5" fill="#1E293B" />
      <rect x="61" y="84" width="8" height="10" rx="1.5" fill="#1E293B" />
      <rect x="72" y="84" width="8" height="10" rx="1.5" fill="#1E293B" />
      <rect x="44" y="98" width="42" height="6" fill="#0F172A" />
      <rect x="61" y="98.5" width="8" height="5" rx="1" fill="#FBBF24" />

      {/* Bandana fluttering knot tails behind head */}
      {profile.helmet === 'bandana' && (
        <g stroke="#DC2626" strokeWidth="5" strokeLinecap="round">
          <line x1="45" y1="28" x2="27" y2="33" />
          <line x1="45" y1="31" x2="31" y2="41" />
        </g>
      )}

      {/* Expressive Cartoon Military Head with Stubble & Grin */}
      <circle
        cx="65"
        cy="34"
        r="19.5"
        fill={skin.fill}
        stroke="#0D1117"
        strokeWidth="3"
      />
      {/* Lower jaw stubble shadow */}
      <path
        d="M47 36 A18.5 18.5 0 0 0 83 36 L81 45 A17 17 0 0 1 49 45 Z"
        fill="rgba(30, 41, 59, 0.25)"
      />
      {/* Ear */}
      <circle cx="48" cy="35" r="4" fill={skin.fill} stroke="#0D1117" strokeWidth="2.2" />
      {/* Determined Grin */}
      <rect
        x="65"
        y="40.5"
        width="10"
        height="4"
        rx="1.5"
        fill="#FFFFFF"
        stroke="#0D1117"
        strokeWidth="1.6"
      />

      {/* Eyewear Layer */}
      {eyewear === 'aviators' ? (
        <rect
          x="64"
          y="27"
          width="17"
          height="9"
          rx="3"
          fill="#0F172A"
          stroke="#F59E0B"
          strokeWidth="2.2"
        />
      ) : eyewear === 'nvg' ? (
        <g>
          <rect x="63" y="26" width="19" height="10" rx="2" fill="#1E293B" stroke="#0D1117" strokeWidth="2" />
          <circle cx="68" cy="31" r="3.2" fill="#22C55E" />
          <circle cx="77" cy="31" r="3.2" fill="#22C55E" />
        </g>
      ) : eyewear === 'goggles' ? (
        <rect
          x="63"
          y="26"
          width="18"
          height="10"
          rx="3"
          fill="#F59E0B"
          stroke="#0F172A"
          strokeWidth="2.5"
        />
      ) : eyewear === 'eyepatch' ? (
        <g>
          <line x1="48" y1="27" x2="82" y2="33" stroke="#0F172A" strokeWidth="2.8" />
          <circle cx="72" cy="31" r="5" fill="#0F172A" />
        </g>
      ) : eyewear === 'none' ? (
        <g>
          <ellipse cx="73" cy="31" rx="4.5" ry="3.5" fill="#FFFFFF" stroke="#0D1117" strokeWidth="1.6" />
          <circle cx="74.5" cy="31" r="2" fill="#0F172A" />
          <line x1="67" y1="25.5" x2="79" y2="27.5" stroke="#0F172A" strokeWidth="2.8" />
        </g>
      ) : (
        <rect
          x="64"
          y="27"
          width="17"
          height="9"
          rx="2.5"
          fill={pal.visor}
          stroke="#0F172A"
          strokeWidth="2"
        />
      )}

      {/* Headgear Layer */}
      {profile.helmet === 'commando' ? (
        <g>
          <ellipse
            cx="62"
            cy="20"
            rx="22"
            ry="10"
            fill="#991B1B"
            stroke="#0D1117"
            strokeWidth="3"
          />
          <circle cx="72" cy="20" r="3.5" fill="#FACC15" />
        </g>
      ) : profile.helmet === 'bandana' ? (
        <rect
          x="45"
          y="20"
          width="40"
          height="9"
          rx="3"
          fill="#DC2626"
          stroke="#0D1117"
          strokeWidth="3"
        />
      ) : profile.helmet === 'officer' ? (
        <g>
          <rect
            x="44"
            y="13"
            width="42"
            height="14"
            rx="4"
            fill={pal.secondary}
            stroke="#0D1117"
            strokeWidth="3"
          />
          <rect x="46" y="24" width="38" height="3" fill="#FACC15" />
          <rect x="64" y="26" width="25" height="5" rx="1.5" fill="#0F172A" />
        </g>
      ) : profile.helmet === 'heavy' ? (
        <g>
          <rect
            x="43"
            y="13"
            width="44"
            height="28"
            rx="7"
            fill={pal.secondary}
            stroke="#0D1117"
            strokeWidth="3"
          />
          <rect x="65" y="27" width="16" height="7" rx="1.5" fill={pal.visor} />
        </g>
      ) : profile.helmet === 'recon' ? (
        <g>
          <rect
            x="44"
            y="14"
            width="42"
            height="26"
            rx="11"
            fill={pal.secondary}
            stroke="#0D1117"
            strokeWidth="3"
          />
          <rect x="63" y="26" width="19" height="10" rx="3" fill={pal.visor} />
        </g>
      ) : (
        <g>
          <path
            d="M44 31 A21 21 0 0 1 86 31 Z"
            fill={pal.secondary}
            stroke="#0D1117"
            strokeWidth="3"
          />
          <rect x="55" y="19" width="20" height="4.5" rx="1.5" fill={pal.accent} />
        </g>
      )}

      {/* Equipped Primary Gun Silhouette in Hands */}
      <g transform="translate(50, 54)">
        <svg x="0" y="0" width="94" height="38" viewBox="0 0 96 38">
          {/* Reuse identical weapon geometry */}
          {wId === 'rifle' ? (
            <g>
              <polygon points="4,13 22,13 22,19 12,23 4,24" fill="#1E293B" stroke="#090D14" strokeWidth="2" />
              <rect x="22" y="12" width="25" height="8.5" rx="1" fill="#111827" stroke="#090D14" strokeWidth="2" />
              <path d="M25 12 L27 7.5 L42 7.5 L44 12 Z" fill="none" stroke="#090D14" strokeWidth="2.4" />
              <rect x="47" y="12.5" width="19" height="6.5" rx="1" fill="#1F2937" stroke="#090D14" strokeWidth="2" />
              <polygon points="68,14 71,7.5 74,14" fill="#090D14" />
              <rect x="66" y="14" width="22" height="3" fill="#374151" stroke="#090D14" strokeWidth="1.6" />
              <path d="M36 20.5 L43 20.5 L46 33 L39 34 Z" fill="#1F2937" stroke="#090D14" strokeWidth="1.8" />
            </g>
          ) : wId === 'ak47' ? (
            <g>
              <polygon points="4,15 22,13 22,20 6,25" fill="#9A3412" stroke="#090D14" strokeWidth="2" />
              <rect x="22" y="12" width="25" height="8" rx="1" fill="#1E293B" stroke="#090D14" strokeWidth="2" />
              <rect x="47" y="13" width="17" height="6" rx="1" fill="#B45309" stroke="#090D14" strokeWidth="2" />
              <rect x="64" y="14" width="22" height="3" fill="#334155" stroke="#090D14" strokeWidth="1.6" />
              <path d="M36 20 L43 20 L50 33 L43 35 Z" fill="#C2410C" stroke="#090D14" strokeWidth="2" />
            </g>
          ) : wId === 'rocket' ? (
            <g>
              <polygon points="3,9 14,12.5 14,21.5 3,25" fill="#78716C" stroke="#090D14" strokeWidth="2" />
              <rect x="14" y="12" width="64" height="10" rx="1.5" fill="#787146" stroke="#090D14" strokeWidth="2" />
              <rect x="28" y="11.2" width="5" height="11.6" fill="#111827" />
              <rect x="56" y="11.2" width="5" height="11.6" fill="#111827" />
            </g>
          ) : (
            <g>
              <rect x="14" y="12" width="46" height="9.5" rx="2" fill="#1E293B" stroke="#090D14" strokeWidth="2" />
              <rect x="60" y="14" width="20" height="4" fill="#64748B" stroke="#090D14" strokeWidth="1.8" />
              <rect x="34" y="21.5" width="8" height="10" fill="#0F172A" />
            </g>
          )}
        </svg>
        {/* Operator Sleeve, Trigger Hand & Foregrip Hand */}
        <rect x="2" y="12" width="14" height="9" rx="3" fill={pal.primary} stroke="#0D1117" strokeWidth="2.2" />
        <circle cx="20" cy="18" r="4.5" fill={skin.fill} stroke="#0D1117" strokeWidth="2" />
        <circle cx="48" cy="19" r="4.2" fill={skin.fill} stroke="#0D1117" strokeWidth="2" />
      </g>
    </svg>
  );
};

interface CharacterCustomizerPanelProps {
  profile: PlayerProfile;
  onUpdateProfile: (patch: Partial<PlayerProfile>) => void;
  compact?: boolean;
}

const CATEGORIES: ('All' | WeaponCategory)[] = [
  'All',
  'Assault',
  'SMG',
  'Heavy',
  'Special',
  'Shotgun',
  'Sniper',
  'Sidearm',
];

export const CharacterCustomizerPanel: React.FC<CharacterCustomizerPanelProps> = ({
  profile,
  onUpdateProfile,
  compact = false,
}) => {
  const [weaponFilter, setWeaponFilter] = useState<'All' | WeaponCategory>('All');
  const filteredWeapons =
    weaponFilter === 'All'
      ? WEAPON_LIST
      : WEAPON_LIST.filter((w) => w.category === weaponFilter);

  const primaryDef = WEAPONS[profile.primaryWeapon] ?? WEAPONS.rifle;
  const secondaryDef = WEAPONS[profile.secondaryWeapon] ?? WEAPONS.pistol;

  return (
    <div className="grid md:grid-cols-[250px_1fr] gap-5">
      {/* Left Column: Live Character Preview + Callsign + Skin Tone + Jetpack Style */}
      <div className="space-y-4">
        <div className="bg-[#0E1319] border border-slate-800 rounded-md p-3.5 flex flex-col items-center">
          <CharacterPreviewSvg
            profile={profile}
            className={compact ? 'w-32 h-36' : 'w-36 h-40'}
          />
          <div className="w-full mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300 font-mono-hud">
            <span className="text-amber-300 font-semibold truncate">
              1: {primaryDef.shortName}
            </span>
            <span className="text-sky-300 font-semibold truncate">
              2: {secondaryDef.shortName}
            </span>
          </div>
        </div>

        {/* Callsign */}
        <div className="space-y-1">
          <label
            htmlFor="operator-callsign-input"
            className="block text-xs font-medium text-slate-300"
          >
            Operator Callsign
          </label>
          <input
            id="operator-callsign-input"
            type="text"
            maxLength={16}
            value={profile.callsign}
            onChange={(e) => onUpdateProfile({ callsign: e.target.value })}
            className="w-full bg-[#0E1319] border border-slate-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Armor Camo Swatches */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-300">Armor Camo</div>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(ARMOR_PALETTES) as ArmorColorId[]).map((colorId) => {
              const item = ARMOR_PALETTES[colorId];
              const active = profile.armorColor === colorId;
              return (
                <button
                  key={colorId}
                  type="button"
                  onClick={() => onUpdateProfile({ armorColor: colorId })}
                  aria-label={`Select ${item.label} armor`}
                  className={`h-8 rounded-md border-2 flex items-center justify-center text-[10px] font-bold transition-transform ${
                    active ? 'border-white scale-105 text-white' : 'border-slate-700 text-slate-200/80'
                  }`}
                  style={{ backgroundColor: item.primary }}
                  title={item.label}
                >
                  {item.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skin Tone & Jetpack Flame Style */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-300">Skin Tone</div>
            <div className="flex items-center gap-1.5">
              {(Object.keys(SKIN_TONES) as SkinToneId[]).map((toneId) => {
                const tone = SKIN_TONES[toneId];
                const active = (profile.skinTone ?? 'tan') === toneId;
                return (
                  <button
                    key={toneId}
                    type="button"
                    onClick={() => onUpdateProfile({ skinTone: toneId })}
                    aria-label={`Select ${tone.label} skin tone`}
                    title={tone.label}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      active ? 'border-white scale-110' : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: tone.fill }}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-300">Jetpack Flame</div>
            <div className="flex items-center gap-1.5">
              {(Object.keys(JETPACK_STYLES) as JetpackStyleId[]).map((jpId) => {
                const jp = JETPACK_STYLES[jpId];
                const active = (profile.jetpackStyle ?? 'amber') === jpId;
                return (
                  <button
                    key={jpId}
                    type="button"
                    onClick={() => onUpdateProfile({ jetpackStyle: jpId })}
                    aria-label={`Select ${jp.label} jetpack`}
                    title={jp.label}
                    className={`h-7 w-7 rounded-md border-2 transition-transform ${
                      active ? 'border-white scale-110' : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: jp.outer }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Headgear, Eyewear & 12 Mini Militia Weapons */}
      <div className="space-y-4">
        {/* Headgear Style (6 options) */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-300">Headgear Style</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {HELMET_STYLES.map((h) => {
              const active = profile.helmet === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onUpdateProfile({ helmet: h.id as HelmetStyle })}
                  className={`p-2 rounded-md border text-left transition-colors ${
                    active
                      ? 'bg-red-600/20 border-red-500 text-white'
                      : 'bg-[#0E1319] border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{h.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{h.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Eyewear / Optics Style (6 options) */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-300">Eyewear &amp; Face Gear</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EYEWEAR_STYLES.map((ew) => {
              const active = (profile.eyewear ?? 'visor') === ew.id;
              return (
                <button
                  key={ew.id}
                  type="button"
                  onClick={() => onUpdateProfile({ eyewear: ew.id as EyewearStyle })}
                  className={`p-2 rounded-md border text-left transition-colors ${
                    active
                      ? 'bg-amber-500/20 border-amber-400 text-white'
                      : 'bg-[#0E1319] border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{ew.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{ew.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mini Militia Style Arsenal (12 Weapons with Category Filter + Visual Gun Silhouettes) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-medium text-slate-300">
              Mini Militia Arsenal ({WEAPON_LIST.length} Guns)
            </div>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setWeaponFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                    weaponFilter === cat
                      ? 'bg-slate-200 text-slate-900 border-white'
                      : 'bg-[#0E1319] text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
            {filteredWeapons.map((w) => {
              const isPrimary = profile.primaryWeapon === w.id;
              const isSecondary = profile.secondaryWeapon === w.id;
              return (
                <div
                  key={w.id}
                  className={`p-2.5 rounded-md border ${
                    isPrimary || isSecondary
                      ? 'bg-[#1D2430] border-slate-500'
                      : 'bg-[#0E1319] border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {w.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {w.role} · DMG {w.damage * w.pellets} · MAG {w.magSize}
                      </div>
                    </div>
                    <WeaponSilhouetteSvg weaponId={w.id} className="w-16 h-7 shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProfile({ primaryWeapon: w.id as WeaponId })
                      }
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold border whitespace-nowrap transition-colors ${
                        isPrimary
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isPrimary ? 'Primary [1]' : 'Set Primary'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProfile({ secondaryWeapon: w.id as WeaponId })
                      }
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold border whitespace-nowrap transition-colors ${
                        isSecondary
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isSecondary ? 'Sidearm [2]' : 'Set Sidearm'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

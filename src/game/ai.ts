import { MAPS } from './maps';
import { emptyInput, hasLineOfSight } from './physics';
import { MatchWorld, PlayerInputState, SoldierEntity } from './types';

export function computeBotInputs(
  world: MatchWorld,
  dt: number,
): Record<string, PlayerInputState> {
  const result: Record<string, PlayerInputState> = {};
  const map = MAPS[world.mapId];

  // Limit concurrent bots firing heavy/high-threat bursts via attack token budget
  let activeFiringBots = 0;

  for (const bot of world.soldiers) {
    if (!bot.isBot || !bot.alive) continue;

    const input = emptyInput(bot.aimAngle);
    const arch = bot.botArchetype ?? 'assault';

    if (arch === 'dummy') {
      // Training range target dummy: gentle idle sway, holds position
      bot.aiDecisionTimer -= dt;
      if (bot.aiDecisionTimer <= 0) {
        bot.aiDecisionTimer = 2.0;
        bot.aiMoveDir = bot.aiMoveDir === 1 ? -1 : 1;
      }
      input.moveX = 0;
      input.aimAngle = bot.aiMoveDir > 0 ? 0 : Math.PI;
      result[bot.id] = input;
      continue;
    }

    // Find nearest living enemy
    let target: SoldierEntity | null = null;
    let bestDist = Infinity;
    for (const other of world.soldiers) {
      if (!other.alive || other.id === bot.id) continue;
      if (bot.team !== 'ffa' && other.team === bot.team) continue;
      const d = Math.hypot(other.x - bot.x, other.y - bot.y);
      if (d < bestDist) {
        bestDist = d;
        target = other;
      }
    }

    if (!target) {
      result[bot.id] = input;
      continue;
    }

    const bx = bot.x + bot.w / 2;
    const by = bot.y + bot.h * 0.4;
    const tx = target.x + target.w / 2;
    const ty = target.y + target.h * 0.4;
    const dx = tx - bx;
    const dy = ty - by;
    const dist = Math.hypot(dx, dy);
    const los = hasLineOfSight(map, bx, by, tx, ty);

    const rawAim = Math.atan2(dy, dx);
    // Smooth angular tracking so bots feel human rather than instant snap-aiming
    let diff = rawAim - bot.aimAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const aimSpeed = arch === 'sniper' ? 5.5 : 8.5;
    input.aimAngle = bot.aimAngle + diff * Math.min(1, dt * aimSpeed);

    bot.aiDecisionTimer -= dt;
    bot.aiJumpTimer -= dt;

    // Distinct movement policy per archetype
    if (arch === 'assault') {
      // Mid-range strafer: closes to 240-360px and strafes
      if (dist > 360) input.moveX = Math.sign(dx);
      else if (dist < 170) input.moveX = -Math.sign(dx);
      else {
        if (bot.aiDecisionTimer <= 0) {
          bot.aiDecisionTimer = 0.8 + Math.random() * 0.8;
          bot.aiMoveDir = Math.random() > 0.5 ? 1 : -1;
        }
        input.moveX = bot.aiMoveDir * 0.75;
      }
      if ((dy < -90 || !los) && bot.aiJumpTimer <= 0 && bot.fuel > 30) {
        if (bot.grounded) input.jumpPressed = true;
        input.jetpackHeld = dy < -70;
        bot.aiJumpTimer = 0.45;
      }
    } else if (arch === 'flanker') {
      // Jetpack Raider: aggressive vertical flanking & overhead dive
      input.moveX = Math.sign(dx);
      if (dist < 110 && bot.aiDecisionTimer <= 0) {
        bot.aiDecisionTimer = 0.6;
        bot.aiMoveDir = -Math.sign(dx) || 1;
      }
      if (dy < 60 && bot.fuel > 25) {
        if (bot.grounded) input.jumpPressed = true;
        input.jetpackHeld = true;
      }
      if (los && dist > 160 && dist < 340 && bot.grenades > 0 && Math.random() < dt * 0.35) {
        input.grenadePressed = true;
      }
    } else if (arch === 'heavy') {
      // Suppression Gunner: anchors ground, crouches when firing, slow push
      if (dist > 420 || !los) {
        input.moveX = Math.sign(dx) * 0.65;
      } else {
        input.moveX = 0;
        input.crouchHeld = bot.grounded && los;
      }
      if (dy < -130 && bot.grounded && bot.aiJumpTimer <= 0) {
        input.jumpPressed = true;
        bot.aiJumpTimer = 1.2;
      }
    } else if (arch === 'sniper') {
      // Recon Marksman: maintains > 380px spacing & seeks high ground
      if (dist < 320) {
        input.moveX = -Math.sign(dx);
        if (bot.grounded && bot.aiJumpTimer <= 0) {
          input.jumpPressed = true;
          bot.aiJumpTimer = 0.9;
        }
      } else if (dist > 640 || !los) {
        input.moveX = Math.sign(dx) * 0.8;
        if (dy < -80 && bot.fuel > 40) input.jetpackHeld = true;
      } else {
        input.moveX = 0;
        input.crouchHeld = bot.grounded;
      }
    }

    // Attack telegraph & crowd-capped firing
    const maxRange = arch === 'sniper' ? 920 : arch === 'flanker' ? 420 : 620;
    if (los && dist < maxRange && Math.abs(diff) < 0.38) {
      if (arch === 'sniper' || arch === 'heavy') {
        // Sniper / Heavy telegraph before high-impact shot
        if (bot.telegraphTimer <= 0 && bot.fireCooldown <= 0.05) {
          bot.telegraphTimer = arch === 'sniper' ? 0.55 : 0.32;
          bot.telegraphAngle = input.aimAngle;
        } else if (bot.telegraphTimer > 0) {
          bot.telegraphTimer -= dt;
          if (bot.telegraphTimer <= 0 && activeFiringBots < 3) {
            input.fireHeld = true;
            input.firePressed = true;
            activeFiringBots += 1;
          }
        }
      } else if (activeFiringBots < 3) {
        input.fireHeld = true;
        input.firePressed = bot.fireCooldown <= 0;
        activeFiringBots += 1;
      }
    } else {
      bot.telegraphTimer = 0;
    }

    // Opportunistic melee up close
    if (dist < 54 && bot.meleeCooldown <= 0) {
      input.meleePressed = true;
    }

    // Auto reload when empty
    if (bot.slots[bot.activeSlot].mag === 0 && bot.reloadTimer <= 0) {
      input.reloadPressed = true;
    }

    result[bot.id] = input;
  }

  return result;
}

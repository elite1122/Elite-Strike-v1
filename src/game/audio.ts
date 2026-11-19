import { WeaponId } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private jetSource: AudioBufferSourceNode | null = null;
  private jetGain: GainNode | null = null;
  private volume = 0.7;
  private muted = false;

  public setConfig(volume: number, muted: boolean): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.muted = muted;
    if (this.muted && this.jetGain && this.ctx) {
      this.jetGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
    }
  }

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 1.0;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private get gainScale(): number {
    return this.muted ? 0 : this.volume;
  }

  public playShot(weaponId: WeaponId, distanceScale = 1): void {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    const vol = this.gainScale * distanceScale;
    if (vol < 0.02) return;

    const now = this.ctx.currentTime;
    const pitchVar = 0.92 + Math.random() * 0.16;

    // Noise burst for propellant crack
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const baseFreq =
      weaponId === 'sniper'
        ? 950
        : weaponId === 'rocket' || weaponId === 'gl'
          ? 520
          : weaponId === 'shotgun'
            ? 700
            : weaponId === 'lmg' || weaponId === 'ak47'
              ? 880
              : weaponId === 'sawgun'
                ? 2100
                : weaponId === 'smg' || weaponId === 'uzi'
                  ? 1680
                  : 1250;
    filter.frequency.setValueAtTime(baseFreq * pitchVar, now);
    filter.Q.value = weaponId === 'sniper' || weaponId === 'rocket' ? 0.7 : 1.1;

    const nGain = this.ctx.createGain();
    const isHeavy =
      weaponId === 'sniper' ||
      weaponId === 'shotgun' ||
      weaponId === 'rocket' ||
      weaponId === 'gl';
    const dur = isHeavy ? 0.24 : weaponId === 'sawgun' ? 0.16 : 0.09;
    const peak = (isHeavy ? 0.36 : 0.22) * vol;
    nGain.gain.setValueAtTime(peak, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + dur);

    // Body punch oscillator
    const osc = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type =
      weaponId === 'sniper' || weaponId === 'sawgun' ? 'sawtooth' : 'triangle';
    const startHz =
      weaponId === 'sawgun'
        ? 620
        : weaponId === 'rocket' || weaponId === 'gl'
          ? 145
          : weaponId === 'sniper'
            ? 240
            : weaponId === 'shotgun'
              ? 170
              : 280;
    osc.frequency.setValueAtTime(startHz * pitchVar, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
    oGain.gain.setValueAtTime(0.24 * vol, now);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(oGain);
    oGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playExplosion(distanceScale = 1): void {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    const vol = this.gainScale * distanceScale;
    if (vol < 0.02) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(620, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.55);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.62);

    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(115, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.45);
    sGain.gain.setValueAtTime(0.5 * vol, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    sub.connect(sGain);
    sGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.5);
  }

  public playHitmarker(isKill = false): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isKill ? 980 : 1420, now);
    if (isKill) osc.frequency.exponentialRampToValueAtTime(1480, now + 0.12);
    gain.gain.setValueAtTime(0.18 * this.gainScale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isKill ? 0.14 : 0.05));
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + (isKill ? 0.15 : 0.06));
  }

  public playReload(): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.setValueAtTime(640, now + 0.05);
    gain.gain.setValueAtTime(0.09 * this.gainScale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playJump(): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.09);
    gain.gain.setValueAtTime(0.11 * this.gainScale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playPickup(): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587, now);
    osc.frequency.setValueAtTime(880, now + 0.06);
    gain.gain.setValueAtTime(0.14 * this.gainScale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playMelee(): void {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 0.12);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22 * this.gainScale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.14);
  }

  public setJetpackActive(active: boolean): void {
    if (!this.ctx || !this.noiseBuffer) return;
    if (!this.jetSource) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 340;
      filter.Q.value = 0.8;
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start();
      this.jetSource = src;
      this.jetGain = gain;
    }
    if (this.jetGain) {
      const target = active && !this.muted ? 0.14 * this.volume : 0;
      this.jetGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
    }
  }
}

export const soundEngine = new SoundEngine();

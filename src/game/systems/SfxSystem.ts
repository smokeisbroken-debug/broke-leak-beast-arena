type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export class SfxSystem {
  private ctx?: AudioContext;
  private lastPlayedAt = new Map<string, number>();

  unlock(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    void ctx.resume?.();
  }

  playSword(heavy = false): void {
    if (!this.canPlay("sword", heavy ? 70 : 54)) return;
    this.playSweep(heavy ? 260 : 220, heavy ? 760 : 640, heavy ? 0.115 : 0.085, "sawtooth", heavy ? 0.048 : 0.038);
    this.playTone(heavy ? 128 : 164, heavy ? 74 : 48, "triangle", heavy ? 0.032 : 0.022, 0.012);
  }

  playDashSlash(): void {
    if (!this.canPlay("dashSlash", 120)) return;
    this.playSweep(360, 980, 0.15, "sawtooth", 0.05);
    this.playTone(96, 90, "square", 0.025, 0.03);
  }

  playPulse(): void {
    if (!this.canPlay("pulse", 140)) return;
    this.playSweep(120, 520, 0.18, "sine", 0.046);
    this.playTone(740, 72, "triangle", 0.024, 0.045);
  }

  playShield(): void {
    if (!this.canPlay("shield", 160)) return;
    this.playTone(330, 95, "triangle", 0.034);
    this.playTone(495, 125, "sine", 0.025, 0.055);
  }

  playPickup(): void {
    if (!this.canPlay("pickup", 70)) return;
    this.playTone(610, 48, "sine", 0.034);
    this.playTone(920, 58, "sine", 0.028, 0.042);
  }

  playHit(heavy = false): void {
    if (!this.canPlay("hit", heavy ? 90 : 55)) return;
    this.playTone(heavy ? 118 : 156, heavy ? 120 : 70, "square", heavy ? 0.04 : 0.03);
  }

  playBlock(): void {
    if (!this.canPlay("block", 120)) return;
    this.playTone(280, 56, "triangle", 0.036);
    this.playTone(720, 80, "sine", 0.024, 0.035);
  }

  playGameOver(): void {
    if (!this.canPlay("gameover", 350)) return;
    this.playTone(220, 110, "triangle", 0.035);
    this.playTone(150, 170, "triangle", 0.032, 0.12);
  }

  private canPlay(name: string, minGapMs: number): boolean {
    const now = Date.now();
    const last = this.lastPlayedAt.get(name) ?? 0;
    if (now - last < minGapMs) return false;
    this.lastPlayedAt.set(name, now);
    return true;
  }

  private getContext(): AudioContext | undefined {
    if (this.ctx) return this.ctx;

    const AudioCtor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioCtor) return undefined;

    try {
      this.ctx = new AudioCtor();
      return this.ctx;
    } catch {
      return undefined;
    }
  }

  private playTone(
    frequency: number,
    durationMs: number,
    type: OscillatorType,
    gainValue: number,
    delaySeconds = 0,
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const start = ctx.currentTime + delaySeconds;
      const end = start + durationMs / 1000;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    } catch {
      // Audio is optional. Some WebViews block or suspend WebAudio.
    }
  }

  private playSweep(startFrequency: number, endFrequency: number, durationSeconds: number, type: OscillatorType, gainValue: number): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const start = ctx.currentTime;
      const end = start + durationSeconds;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(startFrequency, start);
      osc.frequency.exponentialRampToValueAtTime(endFrequency, end);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(end + 0.03);
    } catch {
      // Sound must never break gameplay.
    }
  }
}

// Exhibition Sound Engine for 《167次-勝興》
// Supports real MP3 assets placed in /public/audio/ with automatic Web Audio API synthesized fallback.
// Respects Vite base URL (for GitHub Pages) and browser autoplay policies.

import { PUBLIC_ASSETS, resolvePublicAsset } from './assetResolver';

class ExhibitionSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private synthAmbientRunning = false;
  private isMuted = false;
  private pulseInterval: number | null = null;

  // Real MP3 BGM state
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmMode: 'idle' | 'mp3' | 'synth' = 'idle';
  private bgmWanted = false;

  // Track missing MP3 files so we don't repeatedly hit 404s within the same session
  private missingAudioFiles = new Set<string>();

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.7;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Attempts to play an MP3 file under /public/audio/.
   * Only runs the synthesized fallback if the MP3 file does not exist or cannot be decoded.
   */
  private playMp3OrFallback(
    filename: string,
    volume: number,
    fallbackFn: () => void
  ): void {
    if (this.isMuted) return;

    if (typeof window === 'undefined' || this.missingAudioFiles.has(filename)) {
      fallbackFn();
      return;
    }

    let didFallback = false;
    const triggerFallback = (markMissing: boolean) => {
      if (markMissing) {
        this.missingAudioFiles.add(filename);
      }
      if (!didFallback) {
        didFallback = true;
        fallbackFn();
      }
    };

    try {
      const audio = new Audio(resolvePublicAsset(`audio/${filename}`));
      audio.volume = volume;
      audio.preload = 'auto';

      audio.addEventListener(
        'error',
        () => {
          triggerFallback(true);
        },
        { once: true }
      );

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((err: unknown) => {
          const name = (err as { name?: string })?.name;
          // Autoplay block means the file may exist, just blocked before gesture
          if (name === 'NotAllowedError') {
            triggerFallback(false);
          } else {
            triggerFallback(true);
          }
        });
      }
    } catch {
      triggerFallback(true);
    }
  }

  private startSynthAmbient(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.synthAmbientRunning) return;

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.ambientGain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 2.0);
    this.ambientGain.connect(this.masterGain);

    // Filtered brown-like wind noise for misty mountain night atmosphere
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.2;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 260;

    noiseSource.connect(lowpass);
    lowpass.connect(this.ambientGain);
    noiseSource.start();

    // Very soft distant railway track rhythm every 1.55s
    this.pulseInterval = window.setInterval(() => {
      if (
        this.isMuted ||
        this.bgmMode !== 'synth' ||
        !this.ctx ||
        !this.ambientGain ||
        this.ctx.state !== 'running'
      ) {
        return;
      }
      const now = this.ctx.currentTime;
      const triggerClick = (offset: number, freq: number) => {
        if (!this.ctx || !this.ambientGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(36, now + offset + 0.09);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.linearRampToValueAtTime(0.18, now + offset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.11);
        osc.connect(gain);
        gain.connect(this.ambientGain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      };
      triggerClick(0, 74);
      triggerClick(0.22, 62);
    }, 1550);

    this.synthAmbientRunning = true;
    this.bgmMode = 'synth';
  }

  public startAmbient(): void {
    this.bgmWanted = true;
    if (this.isMuted || typeof window === 'undefined') return;

    const bgmFile = PUBLIC_ASSETS.audio.bgmOldMountainLine;

    // Already playing MP3 BGM
    if (this.bgmMode === 'mp3' && this.bgmAudio) {
      if (this.bgmAudio.paused) {
        this.bgmAudio.play().catch(() => {});
      }
      return;
    }

    // Already confirmed missing MP3 -> use synth ambient
    if (this.missingAudioFiles.has(bgmFile)) {
      this.startSynthAmbient();
      return;
    }

    // Try real MP3 ambient loop first
    if (!this.bgmAudio) {
      const audio = new Audio(resolvePublicAsset(`audio/${bgmFile}`));
      audio.loop = true;
      audio.volume = 0.36;
      audio.preload = 'auto';

      audio.addEventListener(
        'error',
        () => {
          this.missingAudioFiles.add(bgmFile);
          this.bgmAudio = null;
          if (!this.isMuted && this.bgmWanted) {
            this.startSynthAmbient();
          }
        },
        { once: true }
      );

      this.bgmAudio = audio;
    }

    const playPromise = this.bgmAudio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          this.bgmMode = 'mp3';
          // Mute synth ambient if it was running
          if (this.ctx && this.ambientGain) {
            this.ambientGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
          }
        })
        .catch((err: unknown) => {
          const name = (err as { name?: string })?.name;
          if (name !== 'NotAllowedError') {
            this.missingAudioFiles.add(bgmFile);
            this.bgmAudio = null;
            this.startSynthAmbient();
          }
        });
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;

    if (this.bgmAudio) {
      this.bgmAudio.muted = muted;
      if (muted) {
        this.bgmAudio.pause();
      } else if (this.bgmWanted) {
        this.bgmAudio.play().catch(() => {});
      }
    }

    if (!muted) {
      this.ensureContext();
      if (this.bgmMode === 'idle') {
        this.startAmbient();
      }
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, now, 0.08);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // ① 售票機按鍵「喀噠」機械聲（sfx_btn_click.mp3）
  public playSelectClick(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxBtnClick, 0.65, () => {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.045);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.08);
    });
  }

  // ② 售票機按鈕「卡住／無效」提示音（sfx_btn_locked.mp3）
  public playRejectBuzz(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxBtnLocked, 0.65, () => {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(165, now);
      osc.frequency.linearRampToValueAtTime(132, now + 0.14);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.18);
    });
  }

  public playTicketDispense(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    // Mechanical stepper sound sequence
    [0, 0.12, 0.24, 0.38, 0.56].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 + idx * 35, now + offset);
      osc.frequency.exponentialRampToValueAtTime(95, now + offset + 0.07);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.11, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.09);
    });
  }

  // ⑤ 莒光號火車鳴笛聲（sfx_train_whistle.mp3）
  public playTrainWhistle(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxTrainWhistle, 0.7, () => {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) return;
      const now = ctx.currentTime;

      const frequencies = [587.33, 739.99]; // D5 + F#5 chord
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 1.015, now + 0.15);
        osc.frequency.linearRampToValueAtTime(freq * 0.995, now + 0.6);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.13 - i * 0.02, now + 0.08);
        gain.gain.setValueAtTime(0.12 - i * 0.02, now + 0.45);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now);
        osc.stop(now + 1.0);
      });
    });
  }

  // ③ 軋日機「喀嚓！」壓印金屬聲（sfx_dater_stamp.mp3）
  public playMechanicalStamp(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxDaterStamp, 0.75, () => {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) return;
      const now = ctx.currentTime;

      // Part 1: Metallic slide/clank
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(now);
      osc1.stop(now + 0.1);

      // Part 2: Heavy steel punch stamp thud
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(38, now + 0.28);

      gain2.gain.setValueAtTime(0.001, now + 0.06);
      gain2.gain.linearRampToValueAtTime(0.28, now + 0.075);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.33);
    });
  }

  // ④ 閉塞器「叮噹！」金屬鈴聲（sfx_block_bell.mp3）
  public playBlockBell(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxBlockBell, 0.7, () => {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) return;
      const now = ctx.currentTime;

      // Classic Webb & Thompson railway block bell: 2 clear brass rings
      [0, 0.18].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1480, now + offset);
        osc.frequency.exponentialRampToValueAtTime(1470, now + offset + 0.25);

        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.linearRampToValueAtTime(0.2, now + offset + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.48);
      });
    });
  }

  public dispose(): void {
    if (this.pulseInterval !== null) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }
  }
}

export const soundEngine = new ExhibitionSoundEngine();

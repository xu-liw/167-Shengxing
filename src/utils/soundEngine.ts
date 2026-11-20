// Exhibition Sound Engine for 《167次-勝興》
// Supports real MP3 assets placed in /public/audio/ with automatic Web Audio API synthesized fallback.
// Respects Vite base URL (for GitHub Pages `/167-Shengxing/`) and mobile/desktop browser autoplay policies.

import { PUBLIC_ASSETS, resolvePublicAsset } from './assetResolver';

type FileStatus = 'unknown' | 'available' | 'missing';

class ExhibitionSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private synthAmbientRunning = false;
  private isMuted = false;
  private pulseInterval: number | null = null;
  private gestureUnlocked = false;

  // Real MP3 BGM state
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmMode: 'idle' | 'mp3' | 'synth' = 'idle';
  private bgmWanted = false;

  // Availability & decoded Web Audio buffer caches for /public/audio/*.mp3
  private fileStatus = new Map<string, FileStatus>();
  private sfxBuffers = new Map<string, AudioBuffer>();
  private sfxLoading = new Set<string>();
  private probeStarted = false;

  private boundUnlockHandler: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupGlobalGestureUnlock();
      this.probeAllAudioFiles();
    }
  }

  private setupGlobalGestureUnlock(): void {
    const handler = () => {
      this.unlock();
    };
    this.boundUnlockHandler = handler;

    // Keep passive listeners so any tap/click/key unlocks audio on iOS Safari & Chrome
    window.addEventListener('pointerdown', handler, { passive: true });
    window.addEventListener('touchstart', handler, { passive: true });
    window.addEventListener('click', handler, { passive: true });
    window.addEventListener('keydown', handler, { passive: true });
  }

  /**
   * Pre-check which MP3 files exist under `${BASE_URL}audio/` on startup.
   * Prevents 200ms+ 404 round-trips during clicks that would lose the browser user gesture.
   */
  private probeAllAudioFiles(): void {
    if (this.probeStarted || typeof fetch === 'undefined') return;
    this.probeStarted = true;

    const allFiles = Object.values(PUBLIC_ASSETS.audio);
    for (const filename of allFiles) {
      const url = resolvePublicAsset(`audio/${filename}`);
      fetch(url, { method: 'HEAD' })
        .then((res) => {
          const contentType = (res.headers.get('content-type') || '').toLowerCase();
          // Reject SPA/404 HTML fallback responses masquerading as 200
          const isRealAudio = res.ok && !contentType.includes('text/html');
          this.fileStatus.set(filename, isRealAudio ? 'available' : 'missing');

          // Pre-load available SFX into Web Audio buffers once unlocked
          if (isRealAudio && filename !== PUBLIC_ASSETS.audio.bgmOldMountainLine && this.ctx) {
            this.preloadSfxBuffer(filename);
          }
        })
        .catch(() => {
          // Network or CORS issue on HEAD: leave as unknown so runtime fallback handles it
          if (!this.fileStatus.has(filename)) {
            this.fileStatus.set(filename, 'unknown');
          }
        });
    }
  }

  private preloadSfxBuffer(filename: string): void {
    if (!this.ctx || this.sfxBuffers.has(filename) || this.sfxLoading.has(filename)) return;
    this.sfxLoading.add(filename);

    const url = resolvePublicAsset(`audio/${filename}`);
    fetch(url)
      .then((res) => {
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (!res.ok || contentType.includes('text/html')) {
          this.fileStatus.set(filename, 'missing');
          return null;
        }
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (!arrayBuffer || !this.ctx) return null;
        return this.ctx.decodeAudioData(arrayBuffer);
      })
      .then((audioBuffer) => {
        if (audioBuffer) {
          this.sfxBuffers.set(filename, audioBuffer);
          this.fileStatus.set(filename, 'available');
        }
      })
      .catch(() => {
        this.fileStatus.set(filename, 'missing');
      })
      .finally(() => {
        this.sfxLoading.delete(filename);
      });
  }

  /**
   * Must be called synchronously inside a user gesture to unlock AudioContext on iOS/Android/Safari.
   */
  public unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && !this.gestureUnlocked) {
      try {
        // Play a 1-sample silent buffer to reliably wake iOS Safari Web Audio
        const silentBuffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(ctx.destination);
        source.start(0);
        this.gestureUnlocked = true;
      } catch {
        // Ignore if context cannot start yet
      }

      // Trigger pre-decoding for any MP3 SFX already confirmed available
      for (const [filename, status] of this.fileStatus.entries()) {
        if (status === 'available' && filename !== PUBLIC_ASSETS.audio.bgmOldMountainLine) {
          this.preloadSfxBuffer(filename);
        }
      }
    }

    // Retry BGM playback if it was previously blocked by autoplay policy
    if (this.bgmWanted && !this.isMuted) {
      if (this.bgmAudio && this.bgmAudio.paused && this.bgmMode !== 'synth') {
        this.bgmAudio
          .play()
          .then(() => {
            this.bgmMode = 'mp3';
          })
          .catch(() => {});
      } else if (this.bgmMode === 'idle') {
        this.startAmbient();
      }
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.78;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Plays a real MP3 file under /public/audio/ when available, or immediately runs
   * the synthesized Web Audio fallback with zero gesture loss.
   */
  private playMp3OrFallback(
    filename: string,
    volume: number,
    fallbackFn: () => void
  ): void {
    if (this.isMuted || typeof window === 'undefined') return;

    // ALWAYS unlock/resume AudioContext synchronously inside the current user gesture
    const ctx = this.ensureContext();
    if (!this.gestureUnlocked) {
      this.unlock();
    }

    const status = this.fileStatus.get(filename) ?? 'unknown';

    // 1. Confirmed missing MP3 -> play Web Audio fallback immediately & synchronously
    if (status === 'missing') {
      fallbackFn();
      return;
    }

    // 2. Real MP3 already decoded as Web Audio buffer -> 0ms latency, works even inside setTimeout on iOS
    const cachedBuffer = this.sfxBuffers.get(filename);
    if (cachedBuffer && ctx && this.masterGain) {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = cachedBuffer;
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(this.masterGain);
      source.start(0);
      return;
    }

    // Kick off Web Audio pre-decoding if confirmed available
    if (status === 'available' && ctx) {
      this.preloadSfxBuffer(filename);
    }

    // 3. Try HTMLAudioElement playback (with instant fallback if 404 or decode error)
    let didFallback = false;
    const triggerFallback = (markMissing: boolean) => {
      if (markMissing) {
        this.fileStatus.set(filename, 'missing');
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
        playPromise
          .then(() => {
            this.fileStatus.set(filename, 'available');
          })
          .catch((err: unknown) => {
            const name = (err as { name?: string })?.name;
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
    if (!ctx || !this.masterGain) return;

    if (this.synthAmbientRunning && this.ambientGain) {
      this.bgmMode = 'synth';
      this.ambientGain.gain.cancelScheduledValues(ctx.currentTime);
      this.ambientGain.gain.setTargetAtTime(0.085, ctx.currentTime, 0.3);
      return;
    }

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.ambientGain.gain.exponentialRampToValueAtTime(0.085, ctx.currentTime + 1.5);
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
      data[i] *= 2.4;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 280;

    noiseSource.connect(lowpass);
    lowpass.connect(this.ambientGain);
    noiseSource.start();

    // Soft distant railway track rhythm every 1.55s
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
        gain.gain.linearRampToValueAtTime(0.24, now + offset + 0.01);
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

    // Synchronously ensure AudioContext is created/resumed during user gesture
    this.ensureContext();

    const bgmFile = PUBLIC_ASSETS.audio.bgmOldMountainLine;

    // Already playing MP3 BGM
    if (this.bgmMode === 'mp3' && this.bgmAudio) {
      if (this.bgmAudio.paused) {
        this.bgmAudio.play().catch(() => {});
      }
      return;
    }

    // Confirmed missing MP3 -> start synth ambient immediately & synchronously
    if (this.fileStatus.get(bgmFile) === 'missing') {
      this.startSynthAmbient();
      return;
    }

    // Try real MP3 ambient loop first
    if (!this.bgmAudio) {
      const audio = new Audio(resolvePublicAsset(`audio/${bgmFile}`));
      audio.loop = true;
      audio.volume = 0.4;
      audio.preload = 'auto';

      audio.addEventListener(
        'error',
        () => {
          this.fileStatus.set(bgmFile, 'missing');
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
          this.fileStatus.set(bgmFile, 'available');
          this.bgmMode = 'mp3';
          if (this.ctx && this.ambientGain) {
            this.ambientGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
          }
        })
        .catch((err: unknown) => {
          const name = (err as { name?: string })?.name;
          if (name !== 'NotAllowedError') {
            this.fileStatus.set(bgmFile, 'missing');
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
      this.unlock();
      if (this.bgmMode === 'idle') {
        this.startAmbient();
      }
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.78, now, 0.08);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // ① 售票機按鍵「喀噠」機械聲（sfx_btn_click.mp3）
  public playSelectClick(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxBtnClick, 0.7, () => {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.045);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.085);
    });
  }

  // ② 售票機按鈕「卡住／無效」提示音（sfx_btn_locked.mp3）
  public playRejectBuzz(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxBtnLocked, 0.7, () => {
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
      gain.gain.linearRampToValueAtTime(0.12, now + 0.015);
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
    this.unlock();
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
      gain.gain.linearRampToValueAtTime(0.14, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.09);
    });
  }

  // ⑤ 莒光號火車鳴笛聲（sfx_train_whistle.mp3）
  public playTrainWhistle(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxTrainWhistle, 0.75, () => {
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
        gain.gain.linearRampToValueAtTime(0.16 - i * 0.02, now + 0.08);
        gain.gain.setValueAtTime(0.14 - i * 0.02, now + 0.45);
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
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxDaterStamp, 0.8, () => {
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
      gain1.gain.linearRampToValueAtTime(0.22, now + 0.01);
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
      gain2.gain.linearRampToValueAtTime(0.32, now + 0.075);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.33);
    });
  }

  // ④ 閉塞器「叮噹！」金屬鈴聲（sfx_block_bell.mp3）
  public playBlockBell(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxBlockBell, 0.75, () => {
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
        gain.gain.linearRampToValueAtTime(0.24, now + offset + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.48);
      });
    });
  }

  public dispose(): void {
    if (typeof window !== 'undefined' && this.boundUnlockHandler) {
      window.removeEventListener('pointerdown', this.boundUnlockHandler);
      window.removeEventListener('touchstart', this.boundUnlockHandler);
      window.removeEventListener('click', this.boundUnlockHandler);
      window.removeEventListener('keydown', this.boundUnlockHandler);
      this.boundUnlockHandler = null;
    }
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

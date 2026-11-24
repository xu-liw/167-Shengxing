// Exhibition Sound Engine for 《167次-勝興》
// Supports real MP3 assets placed in /public/audio/ with automatic Web Audio API synthesized fallback.
// Respects Vite base URL (for GitHub Pages `/167-Shengxing/`) and iOS Safari audio session / silent-switch rules.
// Automatically suspends all audio contexts, loops, and timers when the page leaves the foreground.

import { PUBLIC_ASSETS, resolvePublicAsset } from './assetResolver';

type FileStatus = 'unknown' | 'available' | 'missing';

function detectIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isPageInBackground(): boolean {
  if (typeof document === 'undefined') return false;
  return document.hidden || document.visibilityState === 'hidden';
}

/**
 * Generates a valid, tiny silent 16-bit PCM WAV data URI (0.15s @ 22050Hz mono).
 * Playing this via an HTMLAudioElement on iOS Safari switches the hardware audio session
 * from "ambient" (muted by the physical Silent Switch) to "playback" (audible like media/video).
 */
function createSilentWavDataUri(): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * 0.15);
  const dataSize = numSamples * 2; // 16-bit mono PCM
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // AudioFormat = 1 (PCM)
  view.setUint16(22, 1, true); // NumChannels = 1
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

class ExhibitionSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private synthAmbientRunning = false;
  private isMuted = false;
  private pulseInterval: number | null = null;
  private isIOS = false;
  private isSuspendedInBackground = false;

  // Silent HTML5 <audio> channel keeper for iOS Safari (bypasses hardware silent switch for Web Audio)
  private iosUnmuteAudio: HTMLAudioElement | null = null;
  private silentWavUri: string | null = null;

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
  private boundVisibilityHandler: (() => void) | null = null;
  private boundPageHideHandler: (() => void) | null = null;
  private boundPageShowHandler: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isIOS = detectIOSDevice();
      this.setupGlobalGestureUnlock();
      this.setupVisibilityHandling();
      this.probeAllAudioFiles();
    }
  }

  private configureAudioSession(type: 'playback' | 'ambient' = 'playback'): void {
    if (typeof navigator === 'undefined') return;
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession && nav.audioSession.type !== type) {
      try {
        nav.audioSession.type = type;
      } catch {
        // Ignore if browser does not allow changing audioSession type
      }
    }
  }

  private ensureIOSPlaybackChannel(): void {
    if (!this.isIOS || this.isMuted || typeof window === 'undefined') return;
    if (isPageInBackground()) return;

    this.configureAudioSession('playback');

    if (!this.iosUnmuteAudio) {
      if (!this.silentWavUri) {
        this.silentWavUri = createSilentWavDataUri();
      }
      const audio = new Audio(this.silentWavUri);
      audio.loop = true;
      audio.preload = 'auto';
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
      audio.volume = 0.01;
      this.iosUnmuteAudio = audio;
    }

    if (this.iosUnmuteAudio.paused) {
      this.iosUnmuteAudio.play().catch(() => {});
    }
  }

  private pauseIOSPlaybackChannel(): void {
    if (this.iosUnmuteAudio && !this.iosUnmuteAudio.paused) {
      try {
        this.iosUnmuteAudio.pause();
      } catch {
        // Ignore
      }
    }
    this.configureAudioSession('ambient');
  }

  private startSynthPulseTimer(): void {
    if (this.pulseInterval !== null || typeof window === 'undefined') return;
    this.pulseInterval = window.setInterval(() => {
      if (
        this.isMuted ||
        this.isSuspendedInBackground ||
        isPageInBackground() ||
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
  }

  private stopSynthPulseTimer(): void {
    if (this.pulseInterval !== null) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
  }

  /**
   * Immediately halts all Web Audio processing, timers, and HTMLAudio streams
   * so iOS Safari does not keep the tab alive or heat up the device in the background.
   */
  public suspendForBackground(): void {
    this.isSuspendedInBackground = true;
    this.stopSynthPulseTimer();
    this.pauseIOSPlaybackChannel();

    if (this.bgmAudio && !this.bgmAudio.paused) {
      try {
        this.bgmAudio.pause();
      } catch {
        // Ignore
      }
    }

    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  /**
   * Restores audio playback only when the page returns to the active foreground and is not muted.
   */
  public resumeFromForeground(): void {
    if (isPageInBackground()) return;
    this.isSuspendedInBackground = false;

    if (this.isMuted) return;

    this.ensureIOSPlaybackChannel();

    if (this.ctx && this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => {});
    }

    if (this.synthAmbientRunning && this.bgmMode === 'synth') {
      this.startSynthPulseTimer();
    }

    if (this.bgmWanted && this.bgmMode === 'mp3' && this.bgmAudio && this.bgmAudio.paused) {
      this.bgmAudio.play().catch(() => {});
    }
  }

  private setupGlobalGestureUnlock(): void {
    const handler = () => {
      if (!isPageInBackground()) {
        this.unlock();
      }
    };
    this.boundUnlockHandler = handler;

    window.addEventListener('touchend', handler, { passive: true, capture: true });
    window.addEventListener('click', handler, { passive: true, capture: true });
    window.addEventListener('keydown', handler, { passive: true, capture: true });
  }

  private setupVisibilityHandling(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const onVisibility = () => {
      if (isPageInBackground()) {
        this.suspendForBackground();
      } else {
        this.resumeFromForeground();
      }
    };

    const onPageHide = () => {
      this.suspendForBackground();
    };

    const onPageShow = () => {
      if (!isPageInBackground()) {
        this.resumeFromForeground();
      }
    };

    this.boundVisibilityHandler = onVisibility;
    this.boundPageHideHandler = onPageHide;
    this.boundPageShowHandler = onPageShow;

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('freeze', onPageHide);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
  }

  /**
   * Pre-check which MP3 files exist under `${BASE_URL}audio/` on startup.
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
          const isRealAudio = res.ok && !contentType.includes('text/html');
          this.fileStatus.set(filename, isRealAudio ? 'available' : 'missing');

          if (isRealAudio && filename !== PUBLIC_ASSETS.audio.bgmOldMountainLine && this.ctx) {
            this.preloadSfxBuffer(filename);
          }
        })
        .catch(() => {
          if (!this.fileStatus.has(filename)) {
            this.fileStatus.set(filename, 'unknown');
          }
        });
    }
  }

  private decodeAudioBufferCompat(
    ctx: AudioContext,
    arrayBuffer: ArrayBuffer
  ): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const onSuccess = (decoded: AudioBuffer) => {
        if (!settled) {
          settled = true;
          resolve(decoded);
        }
      };
      const onError = (err: unknown) => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      };

      try {
        const result = ctx.decodeAudioData(arrayBuffer, onSuccess, onError);
        if (result && typeof result.then === 'function') {
          result.then(onSuccess, onError);
        }
      } catch (err) {
        onError(err);
      }
    });
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
        return this.decodeAudioBufferCompat(this.ctx, arrayBuffer);
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
   * Must be called synchronously inside a user gesture (touchend/click/keydown)
   * to unlock AudioContext and iOS Safari's playback audio session.
   */
  public unlock(): void {
    if (this.isMuted || isPageInBackground() || typeof window === 'undefined') return;
    this.isSuspendedInBackground = false;

    this.configureAudioSession('playback');
    this.ensureIOSPlaybackChannel();

    const ctx = this.ensureContext();
    if (ctx) {
      if (ctx.state !== 'running') {
        try {
          const silentBuffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = silentBuffer;
          source.connect(ctx.destination);
          source.start(0);
        } catch {
          // Ignore if context cannot start yet
        }
        ctx.resume().catch(() => {});
      }

      for (const [filename, status] of this.fileStatus.entries()) {
        if (status === 'available' && filename !== PUBLIC_ASSETS.audio.bgmOldMountainLine) {
          this.preloadSfxBuffer(filename);
        }
      }
    }

    if (this.synthAmbientRunning && this.bgmMode === 'synth') {
      this.startSynthPulseTimer();
    }

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
    if (typeof window === 'undefined' || isPageInBackground()) return null;
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
    if (this.ctx.state !== 'running' && !isPageInBackground()) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private runWithRunningContext(fn: (ctx: AudioContext, masterGain: GainNode) => void): void {
    if (this.isMuted || isPageInBackground()) return;
    const ctx = this.ensureContext();
    const masterGain = this.masterGain;
    if (!ctx || !masterGain) return;

    if (ctx.state === 'running') {
      fn(ctx, masterGain);
      return;
    }

    ctx
      .resume()
      .then(() => {
        if (
          !this.isMuted &&
          !isPageInBackground() &&
          this.ctx &&
          this.masterGain &&
          this.ctx.state === 'running'
        ) {
          fn(this.ctx, this.masterGain);
        }
      })
      .catch(() => {});
  }

  private playMp3OrFallback(
    filename: string,
    volume: number,
    fallbackFn: (ctx: AudioContext, masterGain: GainNode) => void
  ): void {
    if (this.isMuted || isPageInBackground() || typeof window === 'undefined') return;

    this.configureAudioSession('playback');
    this.ensureIOSPlaybackChannel();
    const ctx = this.ensureContext();

    const status = this.fileStatus.get(filename) ?? 'unknown';

    if (status === 'missing') {
      this.runWithRunningContext(fallbackFn);
      return;
    }

    const cachedBuffer = this.sfxBuffers.get(filename);
    if (cachedBuffer && ctx && this.masterGain) {
      this.runWithRunningContext((runningCtx, master) => {
        const source = runningCtx.createBufferSource();
        const gain = runningCtx.createGain();
        source.buffer = cachedBuffer;
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(master);
        source.start(0);
      });
      return;
    }

    if (status === 'available' && ctx) {
      this.preloadSfxBuffer(filename);
    }

    let didFallback = false;
    const triggerFallback = (markMissing: boolean) => {
      if (markMissing) {
        this.fileStatus.set(filename, 'missing');
      }
      if (!didFallback) {
        didFallback = true;
        this.runWithRunningContext(fallbackFn);
      }
    };

    try {
      const audio = new Audio(resolvePublicAsset(`audio/${filename}`));
      audio.volume = volume;
      audio.preload = 'auto';
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;

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
    this.runWithRunningContext((ctx, masterGain) => {
      if (this.synthAmbientRunning && this.ambientGain) {
        this.bgmMode = 'synth';
        this.ambientGain.gain.cancelScheduledValues(ctx.currentTime);
        this.ambientGain.gain.setTargetAtTime(0.085, ctx.currentTime, 0.3);
        this.startSynthPulseTimer();
        return;
      }

      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.085, ctx.currentTime + 1.5);
      this.ambientGain.connect(masterGain);

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

      this.synthAmbientRunning = true;
      this.bgmMode = 'synth';
      this.startSynthPulseTimer();
    });
  }

  public startAmbient(): void {
    this.bgmWanted = true;
    if (this.isMuted || isPageInBackground() || typeof window === 'undefined') return;

    this.configureAudioSession('playback');
    this.ensureIOSPlaybackChannel();
    this.ensureContext();

    const bgmFile = PUBLIC_ASSETS.audio.bgmOldMountainLine;

    if (this.bgmMode === 'mp3' && this.bgmAudio) {
      if (this.bgmAudio.paused) {
        this.bgmAudio.play().catch(() => {});
      }
      return;
    }

    if (this.fileStatus.get(bgmFile) === 'missing') {
      this.startSynthAmbient();
      return;
    }

    if (!this.bgmAudio) {
      const audio = new Audio(resolvePublicAsset(`audio/${bgmFile}`));
      audio.loop = true;
      audio.volume = 0.4;
      audio.preload = 'auto';
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;

      audio.addEventListener(
        'error',
        () => {
          this.fileStatus.set(bgmFile, 'missing');
          this.bgmAudio = null;
          if (!this.isMuted && this.bgmWanted && !isPageInBackground()) {
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

    if (muted) {
      this.pauseIOSPlaybackChannel();
    }

    if (this.bgmAudio) {
      this.bgmAudio.muted = muted;
      if (muted) {
        this.bgmAudio.pause();
      } else if (this.bgmWanted && !isPageInBackground()) {
        this.bgmAudio.play().catch(() => {});
      }
    }

    if (!muted && !isPageInBackground()) {
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
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxBtnClick, 0.7, (ctx, masterGain) => {
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
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.085);
    });
  }

  // ② 售票機按鈕「卡住／無效」提示音（sfx_btn_locked.mp3）
  public playRejectBuzz(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxBtnLocked, 0.7, (ctx, masterGain) => {
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
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.18);
    });
  }

  public playTicketDispense(): void {
    if (this.isMuted || isPageInBackground()) return;
    this.unlock();
    this.runWithRunningContext((ctx, masterGain) => {
      const now = ctx.currentTime;

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
        gain.connect(masterGain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    });
  }

  // ⑤ 莒光號火車鳴笛聲（sfx_train_whistle.mp3）
  public playTrainWhistle(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxTrainWhistle, 0.75, (ctx, masterGain) => {
      const now = ctx.currentTime;

      const frequencies = [587.33, 739.99];
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
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 1.0);
      });
    });
  }

  // ③ 軋日機「喀嚓！」壓印金屬聲（sfx_dater_stamp.mp3）
  public playMechanicalStamp(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxDaterStamp, 0.8, (ctx, masterGain) => {
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.22, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.1);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(38, now + 0.28);

      gain2.gain.setValueAtTime(0.001, now + 0.06);
      gain2.gain.linearRampToValueAtTime(0.32, now + 0.075);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.33);
    });
  }

  // ④ 閉塞器「叮噹！」金屬鈴聲（sfx_block_bell.mp3）
  public playBlockBell(): void {
    this.playMp3OrFallback(PUBLIC_ASSETS.audio.sfxBlockBell, 0.75, (ctx, masterGain) => {
      const now = ctx.currentTime;

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
        gain.connect(masterGain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.48);
      });
    });
  }

  public dispose(): void {
    if (typeof window !== 'undefined') {
      if (this.boundUnlockHandler) {
        window.removeEventListener('touchend', this.boundUnlockHandler, true);
        window.removeEventListener('click', this.boundUnlockHandler, true);
        window.removeEventListener('keydown', this.boundUnlockHandler, true);
        this.boundUnlockHandler = null;
      }
      if (this.boundPageHideHandler) {
        window.removeEventListener('pagehide', this.boundPageHideHandler);
        this.boundPageHideHandler = null;
      }
      if (this.boundPageShowHandler) {
        window.removeEventListener('pageshow', this.boundPageShowHandler);
        this.boundPageShowHandler = null;
      }
    }
    if (typeof document !== 'undefined') {
      if (this.boundVisibilityHandler) {
        document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
        document.removeEventListener('freeze', this.boundVisibilityHandler);
        this.boundVisibilityHandler = null;
      }
    }
    this.stopSynthPulseTimer();
    this.pauseIOSPlaybackChannel();
    this.iosUnmuteAudio = null;
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundEngine = new ExhibitionSoundEngine();
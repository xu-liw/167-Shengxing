import { useEffect, useMemo, useState } from 'react';

const BASE_URL = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');

/**
 * Resolve a path under /public/ respecting Vite's configured base URL
 * (works on both local dev and GitHub Pages `/167-Shengxing/`).
 */
export function resolvePublicAsset(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  return `${BASE_URL}${clean}`;
}

/**
 * Pre-reserved public asset filenames catalog (all located under /public/images/ & /public/audio/).
 * Strictly aligned with the 13 exhibition objects + background texture + 6 audio files.
 * Images automatically accept both .png and .jpg (and .jpeg) regardless of the default extension listed below.
 */
export const PUBLIC_ASSETS = {
  images: {
    // 背景底圖
    bgMapTexture: 'bg_map_texture.jpg',

    // 各站站牌（①–⑤：地圖小圖 + 彈窗/圖鑑大圖）
    signSanyi: 'sign_sanyi.png',
    sceneStSanyi: 'scene_st_sanyi.jpg',

    signShengxing: 'sign_shengxing.png',
    sceneShengxing: 'scene_shengxing.jpg',

    signTaian: 'sign_taian.png',
    sceneTaian: 'scene_taian.jpg',

    signHouli: 'sign_houli.png',
    sceneHouli: 'scene_houli.jpg',

    signFengyuan: 'sign_fengyuan.png',
    sceneFengyuan: 'scene_fengyuan.jpg',

    // 勝興核心區（⑥–⑪：地圖小圖 + 彈窗/圖鑑大圖）
    iconSxStation: 'icon_sx_station.png',
    sceneSxStation: 'scene_sx_station.jpg',

    iconSxSwitchback: 'icon_sx_switchback.png',
    sceneSxSwitchback: 'scene_sx_switchback.jpg',

    iconSxTunnel: 'icon_sx_tunnel.png',
    sceneSxTunnel: 'scene_sx_tunnel.jpg',

    iconSxMonument: 'icon_sx_monument.png',
    sceneSxMonument: 'scene_sx_monument.jpg',

    iconSxCamphor: 'icon_sx_camphor.png',
    sceneSxCamphor: 'scene_sx_camphor.jpg',

    iconSxDater: 'icon_sx_dater.png',
    sceneSxDater: 'scene_sx_dater.png',

    // 介面與列車（⑫–⑬）
    uiTrain167: 'ui_train_167.png',
    sceneTrain167: 'scene_train_167.jpg',

    uiBlockInstrument: 'ui_block_instrument.png',
    sceneBlockInstrument: 'scene_block_instrument.jpg',
  },
  audio: {
    bgmOldMountainLine: 'bgm_old_mountain_line.mp3',
    sfxBtnClick: 'sfx_btn_click.mp3',
    sfxBtnLocked: 'sfx_btn_locked.mp3',
    sfxDaterStamp: 'sfx_dater_stamp.mp3',
    sfxBlockBell: 'sfx_block_bell.mp3',
    sfxTrainWhistle: 'sfx_train_whistle.mp3',
  },
} as const;

/**
 * Given a preferred image filename in /public/images/ (e.g. 'scene_taian.jpg' or 'sign_sanyi.png'),
 * returns an ordered list of candidate URLs trying both .png and .jpg (plus .jpeg),
 * followed by optional bundled fallback URL(s).
 */
export function buildImageCandidates(
  preferredFile?: string,
  fallbackSrc?: string
): string[] {
  const candidates: string[] = [];

  if (preferredFile) {
    if (
      /^(https?:|data:|blob:)/.test(preferredFile) ||
      preferredFile.includes('/assets/')
    ) {
      candidates.push(preferredFile);
    } else {
      const normalized = preferredFile.replace(/^\/+/, '');
      const relPath = normalized.startsWith('images/')
        ? normalized
        : `images/${normalized}`;

      const match = relPath.match(/^(.*)\.(png|jpe?g|webp)$/i);
      if (match) {
        const stem = match[1];
        const ext = match[2].toLowerCase();
        const extOrder =
          ext === 'png'
            ? ['png', 'jpg', 'jpeg']
            : ext === 'jpg' || ext === 'jpeg'
              ? ['jpg', 'png', 'jpeg']
              : [ext, 'png', 'jpg', 'jpeg'];

        for (const e of extOrder) {
          const url = resolvePublicAsset(`${stem}.${e}`);
          if (!candidates.includes(url)) candidates.push(url);
        }
      } else {
        for (const e of ['png', 'jpg', 'jpeg']) {
          const url = resolvePublicAsset(`${relPath}.${e}`);
          if (!candidates.includes(url)) candidates.push(url);
        }
      }
    }
  }

  if (fallbackSrc && !candidates.includes(fallbackSrc)) {
    candidates.push(fallbackSrc);
  }

  return candidates;
}

// In-memory probe cache so tab switches & re-renders resolve instantly without repeated 404s
const resolvedImageCache = new Map<string, string | null>();

function probeSingleImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * React hook that probes candidate image URLs (.png / .jpg / .jpeg / fallback) in order
 * and returns the first URL that loads successfully, or null if none exist yet.
 */
export function useResolvedImage(
  preferredFile?: string,
  fallbackSrc?: string
): { resolvedUrl: string | null; isChecking: boolean } {
  const candidates = useMemo(
    () => buildImageCandidates(preferredFile, fallbackSrc),
    [preferredFile, fallbackSrc]
  );
  const cacheKey = candidates.join('|');

  const [state, setState] = useState<{ resolvedUrl: string | null; isChecking: boolean }>(
    () => {
      if (!cacheKey) return { resolvedUrl: null, isChecking: false };
      if (resolvedImageCache.has(cacheKey)) {
        return { resolvedUrl: resolvedImageCache.get(cacheKey) ?? null, isChecking: false };
      }
      return { resolvedUrl: null, isChecking: true };
    }
  );

  useEffect(() => {
    if (!cacheKey) {
      setState({ resolvedUrl: null, isChecking: false });
      return;
    }

    if (resolvedImageCache.has(cacheKey)) {
      setState({
        resolvedUrl: resolvedImageCache.get(cacheKey) ?? null,
        isChecking: false,
      });
      return;
    }

    let cancelled = false;
    setState((prev) => (prev.isChecking ? prev : { ...prev, isChecking: true }));

    (async () => {
      for (const url of candidates) {
        if (cancelled) return;
        const ok = await probeSingleImage(url);
        if (cancelled) return;
        if (ok) {
          resolvedImageCache.set(cacheKey, url);
          setState({ resolvedUrl: url, isChecking: false });
          return;
        }
      }
      if (!cancelled) {
        resolvedImageCache.set(cacheKey, null);
        setState({ resolvedUrl: null, isChecking: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, candidates]);

  return state;
}

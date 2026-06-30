import type { UploadSide } from "@/features/customer-identify/types/customer-identify.type";

export type CachedCccdImage = {
  file: File;
  previewUrl: string;
};

type CccdImageCache = {
  front: CachedCccdImage | null;
  back: CachedCccdImage | null;
};

declare global {
  var __F88_CCCD_IMAGE_CACHE__: CccdImageCache | undefined;
}

function getCache(): CccdImageCache {
  if (!globalThis.__F88_CCCD_IMAGE_CACHE__) {
    globalThis.__F88_CCCD_IMAGE_CACHE__ = {
      front: null,
      back: null,
    };
  }

  return globalThis.__F88_CCCD_IMAGE_CACHE__;
}

export function getCccdCachedImages() {
  const cache = getCache();

  return {
    front: cache.front,
    back: cache.back,
  };
}

export function setCccdCachedImage(
  side: UploadSide,
  image: CachedCccdImage,
) {
  const cache = getCache();

  if (side === "front") {
    cache.front = image;
  }

  if (side === "back") {
    cache.back = image;
  }
}

export function clearCccdCachedImage(side: UploadSide) {
  const cache = getCache();

  if (side === "front") {
    if (cache.front?.previewUrl) {
      URL.revokeObjectURL(cache.front.previewUrl);
    }

    cache.front = null;
  }

  if (side === "back") {
    if (cache.back?.previewUrl) {
      URL.revokeObjectURL(cache.back.previewUrl);
    }

    cache.back = null;
  }
}

export function clearAllCccdCachedImages() {
  const cache = getCache();

  if (cache.front?.previewUrl) {
    URL.revokeObjectURL(cache.front.previewUrl);
  }

  if (cache.back?.previewUrl) {
    URL.revokeObjectURL(cache.back.previewUrl);
  }

  cache.front = null;
  cache.back = null;
}
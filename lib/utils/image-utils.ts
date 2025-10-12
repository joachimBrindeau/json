/**
 * Generate a base64 encoded shimmer/blur placeholder for images
 */
export const shimmerPlaceholder = (w: number, h: number) => {
  const shimmer = `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f6f7f8" offset="20%" />
          <stop stop-color="#edeef1" offset="50%" />
          <stop stop-color="#f6f7f8" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#f6f7f8" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>`;

  return `data:image/svg+xml;base64,${toBase64(shimmer)}`;
};

/**
 * Convert string to base64
 */
export const toBase64 = (str: string) =>
  typeof window === 'undefined' ? Buffer.from(str).toString('base64') : btoa(str);

/**
 * Generate blur data URL for Next.js Image component
 */
export const blurDataURL = `data:image/svg+xml;base64,${toBase64(
  `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <filter id="blur" x="0" y="0">
      <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
    </filter>
    <rect width="400" height="400" fill="#f3f4f6" filter="url(#blur)" />
  </svg>`
)}`;

/**
 * Preload critical images
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Check if image format is supported
 */
export const supportsImageFormat = (format: 'webp' | 'avif'): boolean => {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;

  return canvas.toDataURL(`image/${format}`).indexOf(`image/${format}`) === 5;
};

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB, per spec
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Load a File into an image bitmap and produce a compressed data URL plus
 * its natural dimensions. Large photos are downscaled so the live relay and
 * reveal animation stay at 60fps.
 *
 * Note: HEIC is accepted but only decodes in browsers with native HEIC
 * support (mainly Safari). For universal HEIC, add heic2any as a fallback —
 * marked as an extension point.
 */
export async function processImage(file, maxEdge = 1600, quality = 0.85) {
  if (!file) throw new Error('No file');
  if (file.size > MAX_BYTES) throw new Error('Image exceeds 50 MB limit');
  if (file.type && !ACCEPT.includes(file.type)) {
    // Some browsers report empty type for HEIC; allow through and let decode fail loudly.
    if (file.type !== '') throw new Error('Unsupported format: ' + file.type);
  }

  const bitmap = await fileToBitmap(file);
  const { width, height } = fit(bitmap.width, bitmap.height, maxEdge);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  if (bitmap.close) bitmap.close();

  const dataUrl = canvas.toDataURL('image/webp', quality);
  return { dataUrl, width, height, name: file.name };
}

function fit(w, h, maxEdge) {
  if (w <= maxEdge && h <= maxEdge) return { width: w, height: h };
  const scale = maxEdge / Math.max(w, h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

async function fileToBitmap(file) {
  if (window.createImageBitmap) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> decode */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

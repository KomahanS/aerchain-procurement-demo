/**
 * Minimal, dependency-free width/height readers for PNG and baseline/
 * progressive JPEG. Reads only the header bytes needed for dimensions --
 * avoids pulling in an image-parsing library for what is otherwise just
 * two fixed-format header reads.
 */

function readPngDimensions(buf: Buffer): { width: number; height: number } | undefined {
  // IHDR is always the first chunk: 8-byte signature, 4-byte length,
  // 4-byte "IHDR", then 4-byte width, 4-byte height (big-endian).
  if (buf.length < 24) return undefined;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readJpegDimensions(buf: Buffer): { width: number; height: number } | undefined {
  // Scan marker segments for the first Start-Of-Frame marker, which holds
  // the image dimensions. Skips APPn/EXIF/other segments via their length.
  let offset = 2; // skip SOI (0xFFD8)
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

    if (isStartOfFrame) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }

    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }

    const segmentLength = buf.readUInt16BE(offset + 2);
    offset += 2 + segmentLength;
  }
  return undefined;
}

export function readImageDimensions(
  buf: Buffer,
  mimeType: string,
): { width: number; height: number } | undefined {
  if (mimeType === "image/png") return readPngDimensions(buf);
  if (mimeType === "image/jpeg") return readJpegDimensions(buf);
  return undefined;
}

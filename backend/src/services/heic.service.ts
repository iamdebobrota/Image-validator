import sharp from 'sharp';

export async function convertToJpegIfNeeded(
  buffer: Buffer
): Promise<{ buffer: Buffer; wasConverted: boolean }> {
  const metadata = await sharp(buffer).metadata();

  if (metadata.format === 'heif') {
    const converted = await sharp(buffer).jpeg({ quality: 92 }).toBuffer();
    return { buffer: converted, wasConverted: true };
  }

  return { buffer, wasConverted: false };
}

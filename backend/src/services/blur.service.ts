import sharp from 'sharp';

export async function computeLaplacianVariance(buffer: Buffer): Promise<number> {
  const grey = await sharp(buffer)
    .greyscale()
    .resize({ width: 512, height: 512, fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const laplacian = await sharp(grey.data, {
    raw: {
      width: grey.info.width,
      height: grey.info.height,
      channels: 1,
    },
  })
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
    })
    .raw()
    .toBuffer();

  const pixels = new Int8Array(laplacian.buffer, laplacian.byteOffset, laplacian.length);
  let sum = 0;
  for (let i = 0; i < pixels.length; i++) {
    sum += pixels[i];
  }
  const mean = sum / pixels.length;

  let varianceSum = 0;
  for (let i = 0; i < pixels.length; i++) {
    varianceSum += (pixels[i] - mean) ** 2;
  }

  return varianceSum / pixels.length;
}

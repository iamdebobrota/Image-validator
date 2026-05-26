import sharp from 'sharp';
import { Repository } from 'typeorm';
import { Image, ImageStatus, RejectionReason } from '../entities/Image';
import { env } from '../config/env';
import { convertToJpegIfNeeded } from './heic.service';
import { computeLaplacianVariance } from './blur.service';
import { detectFaces } from './face.service';
import { computePHash, checkDuplicate } from './hash.service';

export interface ValidationResult {
  passed: boolean;
  status: ImageStatus;
  reason: RejectionReason | null;
  detail: string | null;
  processedBuffer: Buffer;
  metadata: {
    width: number;
    height: number;
    fileSizeBytes: number;
    laplacianVariance: number | null;
    faceCount: number | null;
    faceAreaRatio: number | null;
    pHash: string | null;
  };
}

const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'heif', 'jpg']);

export async function validateImage(
  buffer: Buffer,
  mimetype: string,
  originalname: string,
  imageRepo: Repository<Image>
): Promise<ValidationResult> {
  const thresholds = env.validation;
  const baseMetadata = {
    width: 0,
    height: 0,
    fileSizeBytes: buffer.length,
    laplacianVariance: null as number | null,
    faceCount: null as number | null,
    faceAreaRatio: null as number | null,
    pHash: null as string | null,
  };

  const fail = (reason: RejectionReason, detail: string, processedBuffer?: Buffer): ValidationResult => ({
    passed: false,
    status: ImageStatus.REJECTED,
    reason,
    detail,
    processedBuffer: processedBuffer ?? buffer,
    metadata: baseMetadata,
  });

  // 1. Format check
  let sharpMeta;
  try {
    sharpMeta = await sharp(buffer).metadata();
  } catch {
    return fail(RejectionReason.INVALID_FORMAT, 'Unable to read image. The file may be corrupted or in an unsupported format.');
  }
  if (!sharpMeta.format || !ACCEPTED_FORMATS.has(sharpMeta.format)) {
    return fail(RejectionReason.INVALID_FORMAT, `Format "${sharpMeta.format ?? 'unknown'}" is not supported. Use JPEG, PNG, or HEIC.`);
  }

  // 2. HEIC conversion
  const { buffer: processedBuffer } = await convertToJpegIfNeeded(buffer);

  // 3. File size check
  if (buffer.length < thresholds.minFileSizeBytes) {
    return fail(
      RejectionReason.FILE_TOO_SMALL,
      `File size ${(buffer.length / 1024).toFixed(1)}KB is below minimum ${(thresholds.minFileSizeBytes / 1024).toFixed(1)}KB.`,
      processedBuffer
    );
  }

  // 4. Resolution check
  const processedMeta = await sharp(processedBuffer).metadata();
  const width = processedMeta.width ?? 0;
  const height = processedMeta.height ?? 0;
  baseMetadata.width = width;
  baseMetadata.height = height;

  if (width < thresholds.minWidthPx || height < thresholds.minHeightPx) {
    return fail(
      RejectionReason.RESOLUTION_TOO_SMALL,
      `Resolution ${width}×${height} is below minimum ${thresholds.minWidthPx}×${thresholds.minHeightPx}.`,
      processedBuffer
    );
  }

  // 5. Blur detection
  const laplacianVariance = await computeLaplacianVariance(processedBuffer);
  baseMetadata.laplacianVariance = laplacianVariance;

  if (laplacianVariance < thresholds.laplacianThreshold) {
    return fail(
      RejectionReason.BLURRY_IMAGE,
      `Blur score ${laplacianVariance.toFixed(1)} is below threshold ${thresholds.laplacianThreshold}. Image appears blurry.`,
      processedBuffer
    );
  }

  // 6. Face detection
  const faceResult = await detectFaces(processedBuffer);
  baseMetadata.faceCount = faceResult.faceCount;
  baseMetadata.faceAreaRatio = faceResult.faceAreaRatio;

  if (faceResult.faceCount === 0) {
    return fail(RejectionReason.NO_FACE_DETECTED, 'No face detected in the image.', processedBuffer);
  }

  if (faceResult.faceCount > 1) {
    return fail(
      RejectionReason.MULTIPLE_FACES,
      `${faceResult.faceCount} faces detected. Only single-face images are accepted.`,
      processedBuffer
    );
  }

  if (faceResult.faceAreaRatio !== null && faceResult.faceAreaRatio < thresholds.minFaceAreaRatio) {
    return fail(
      RejectionReason.FACE_TOO_SMALL,
      `Face occupies ${(faceResult.faceAreaRatio * 100).toFixed(1)}% of the image, below minimum ${(thresholds.minFaceAreaRatio * 100).toFixed(1)}%.`,
      processedBuffer
    );
  }

  // 7. Perceptual hash
  const pHash = await computePHash(processedBuffer);
  baseMetadata.pHash = pHash;

  // 8. Duplicate check
  const dupResult = await checkDuplicate(pHash, imageRepo, thresholds.phashThreshold);
  if (dupResult.isDuplicate) {
    return fail(
      RejectionReason.DUPLICATE_IMAGE,
      `Image is too similar to an existing image (ID: ${dupResult.matchId}).`,
      processedBuffer
    );
  }

  return {
    passed: true,
    status: ImageStatus.ACCEPTED,
    reason: null,
    detail: null,
    processedBuffer,
    metadata: baseMetadata,
  };
}

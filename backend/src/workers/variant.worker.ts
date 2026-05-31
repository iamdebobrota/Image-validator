import { Worker, Job } from 'bullmq';
import sharp from 'sharp';
import { redisConnection } from '../config/redis';
import { AppDataSource } from '../config/db';
import { ProcessingJob, PipelineStatus } from '../entities/ProcessingJob';
import { ImageVariant, VariantType } from '../entities/ImageVariant';
import { Image } from '../entities/Image';
import { uploadToCloudinary } from '../services/upload.service';

interface VariantJobData {
  imageId: string;
  jobId: string;
  cloudinaryPublicId: string;
  originalFilename: string;
  compressedBuffer: string; // base64
}

const VARIANT_CONFIGS = [
  { type: VariantType.THUMBNAIL, maxWidth: 150, maxHeight: 150, quality: 70 },
  { type: VariantType.WEB, maxWidth: 800, maxHeight: 800, quality: 80 },
  { type: VariantType.FULL, maxWidth: 1920, maxHeight: 1920, quality: 90 },
] as const;

async function processVariants(job: Job<VariantJobData>): Promise<void> {
  const { imageId, jobId, originalFilename, compressedBuffer } = job.data;
  const jobRepo = AppDataSource.getRepository(ProcessingJob);
  const variantRepo = AppDataSource.getRepository(ImageVariant);
  const imageRepo = AppDataSource.getRepository(Image);

  await jobRepo.update(jobId, {
    status: PipelineStatus.GENERATING_VARIANTS,
    currentStep: 'Generating image variants',
  });

  const buffer = Buffer.from(compressedBuffer, 'base64');

  // Delete old variants for idempotent reprocessing
  await variantRepo.delete({ imageId });

  const baseName = originalFilename.replace(/\.[^/.]+$/, '');

  for (const config of VARIANT_CONFIGS) {
    const resized = await sharp(buffer)
      .resize({
        width: config.maxWidth,
        height: config.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: config.quality })
      .toBuffer();

    const meta = await sharp(resized).metadata();

    const uploaded = await uploadToCloudinary(
      resized,
      `${baseName}-${config.type}`
    );

    const variant = variantRepo.create({
      imageId,
      variantType: config.type,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      fileSizeBytes: resized.length,
      cloudinaryPublicId: uploaded.publicId,
      cloudinaryUrl: uploaded.secureUrl,
    });

    await variantRepo.save(variant);
  }

  await jobRepo.update(jobId, {
    status: PipelineStatus.COMPLETED,
    currentStep: null,
    errorMessage: null,
  });

  await imageRepo.update(imageId, {
    pipelineStatus: PipelineStatus.COMPLETED,
  });
}

export function startVariantWorker(): Worker {
  const worker = new Worker('variant', processVariants, {
    connection: redisConnection,
    concurrency: 3,
  });

  worker.on('failed', async (job, err) => {
    console.error(`Variant generation failed for job ${job?.id}:`, err.message);
    if (job) {
      const jobRepo = AppDataSource.getRepository(ProcessingJob);
      await jobRepo.update(job.data.jobId, {
        status: PipelineStatus.FAILED,
        errorMessage: `Variant generation failed: ${err.message}`,
        currentStep: null,
      });
    }
  });

  console.log('Variant generation worker started');
  return worker;
}

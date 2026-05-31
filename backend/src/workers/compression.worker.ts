import { Worker, Job } from 'bullmq';
import sharp from 'sharp';
import { redisConnection } from '../config/redis';
import { AppDataSource } from '../config/db';
import { ProcessingJob, PipelineStatus } from '../entities/ProcessingJob';
import { variantQueue } from '../queues/queue';

interface CompressionJobData {
  imageId: string;
  jobId: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  originalFilename: string;
  convertedBuffer: string; // base64
  originalSizeBytes: number;
}

async function processCompression(job: Job<CompressionJobData>): Promise<void> {
  const { imageId, jobId, cloudinaryPublicId, originalFilename, convertedBuffer, originalSizeBytes } = job.data;
  const jobRepo = AppDataSource.getRepository(ProcessingJob);

  await jobRepo.update(jobId, {
    status: PipelineStatus.COMPRESSING,
    currentStep: 'Compressing image',
  });

  const buffer = Buffer.from(convertedBuffer, 'base64');

  const compressed = await sharp(buffer)
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  // Keep the smaller of original vs compressed
  const output = compressed.length < buffer.length ? compressed : buffer;
  const compressedSize = output.length;
  const compressionRatio = originalSizeBytes > 0
    ? parseFloat(((1 - compressedSize / originalSizeBytes) * 100).toFixed(1))
    : 0;

  await jobRepo.update(jobId, {
    originalSizeBytes,
    compressedSizeBytes: compressedSize,
    compressionRatio,
  });

  await variantQueue.add('generate-variants', {
    imageId,
    jobId,
    cloudinaryPublicId,
    originalFilename,
    compressedBuffer: output.toString('base64'),
  });
}

export function startCompressionWorker(): Worker {
  const worker = new Worker('compression', processCompression, {
    connection: redisConnection,
    concurrency: 5,
  });

  worker.on('failed', async (job, err) => {
    console.error(`Compression failed for job ${job?.id}:`, err.message);
    if (job) {
      const jobRepo = AppDataSource.getRepository(ProcessingJob);
      await jobRepo.update(job.data.jobId, {
        status: PipelineStatus.FAILED,
        errorMessage: `Compression failed: ${err.message}`,
        currentStep: null,
      });
    }
  });

  console.log('Compression worker started');
  return worker;
}

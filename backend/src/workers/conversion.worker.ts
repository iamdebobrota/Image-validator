import { Worker, Job } from 'bullmq';
import sharp from 'sharp';
import { redisConnection } from '../config/redis';
import { AppDataSource } from '../config/db';
import { ProcessingJob, PipelineStatus } from '../entities/ProcessingJob';
import { compressionQueue } from '../queues/queue';
import type { PipelineJobData } from '../queues/flow';

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processConversion(job: Job<PipelineJobData>): Promise<void> {
  const { imageId, jobId, cloudinaryUrl, cloudinaryPublicId, originalFilename } = job.data;
  const jobRepo = AppDataSource.getRepository(ProcessingJob);

  await jobRepo.update(jobId, {
    status: PipelineStatus.CONVERTING,
    currentStep: 'Downloading and converting image',
  });

  const buffer = await downloadBuffer(cloudinaryUrl);

  const metadata = await sharp(buffer).metadata();
  let convertedBuffer: Buffer;

  if (metadata.format === 'heif') {
    convertedBuffer = await sharp(buffer).jpeg({ quality: 92 }).toBuffer();
  } else if (metadata.format === 'png') {
    convertedBuffer = await sharp(buffer).jpeg({ quality: 92 }).toBuffer();
  } else {
    convertedBuffer = buffer;
  }

  await compressionQueue.add('compress', {
    imageId,
    jobId,
    cloudinaryUrl,
    cloudinaryPublicId,
    originalFilename,
    convertedBuffer: convertedBuffer.toString('base64'),
    originalSizeBytes: buffer.length,
  });
}

export function startConversionWorker(): Worker {
  const worker = new Worker('conversion', processConversion, {
    connection: redisConnection,
    concurrency: 5,
  });

  worker.on('failed', async (job, err) => {
    console.error(`Conversion failed for job ${job?.id}:`, err.message);
    if (job) {
      const jobRepo = AppDataSource.getRepository(ProcessingJob);
      await jobRepo.update(job.data.jobId, {
        status: PipelineStatus.FAILED,
        errorMessage: `Conversion failed: ${err.message}`,
        currentStep: null,
      });
    }
  });

  console.log('Conversion worker started');
  return worker;
}

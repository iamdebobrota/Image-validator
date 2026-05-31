import { conversionQueue } from './queue';
import { AppDataSource } from '../config/db';
import { ProcessingJob, PipelineStatus } from '../entities/ProcessingJob';

export interface PipelineJobData {
  imageId: string;
  jobId: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  originalFilename: string;
}

export async function startPipeline(
  imageId: string,
  cloudinaryUrl: string,
  cloudinaryPublicId: string,
  originalFilename: string
): Promise<ProcessingJob> {
  const jobRepo = AppDataSource.getRepository(ProcessingJob);

  const existing = await jobRepo.findOne({
    where: { imageId, status: PipelineStatus.COMPLETED },
  });
  if (existing) return existing;

  const staleJobs = await jobRepo.find({
    where: { imageId },
  });
  for (const stale of staleJobs) {
    if (stale.status !== PipelineStatus.COMPLETED) {
      stale.status = PipelineStatus.PENDING;
      stale.errorMessage = null;
      stale.currentStep = null;
      stale.attemptCount += 1;
      await jobRepo.save(stale);

      await conversionQueue.add('convert', {
        imageId,
        jobId: stale.id,
        cloudinaryUrl,
        cloudinaryPublicId,
        originalFilename,
      } satisfies PipelineJobData);

      return stale;
    }
  }

  const job = jobRepo.create({
    imageId,
    status: PipelineStatus.PENDING,
    attemptCount: 1,
  });
  await jobRepo.save(job);

  await conversionQueue.add('convert', {
    imageId,
    jobId: job.id,
    cloudinaryUrl,
    cloudinaryPublicId,
    originalFilename,
  } satisfies PipelineJobData);

  return job;
}

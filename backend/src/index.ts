import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { AppDataSource } from './config/db';
import imagesRouter from './routes/images.router';
import { errorHandler } from './middleware/errorHandler';
import { loadModels } from './services/face.service';
import { startConversionWorker } from './workers/conversion.worker';
import { startCompressionWorker } from './workers/compression.worker';
import { startVariantWorker } from './workers/variant.worker';

async function bootstrap() {
  const app = express();

  app.use(cors({ origin: env.frontendUrl }));
  app.use(express.json());

  app.use('/api/images', imagesRouter);
  app.use(errorHandler);

  await AppDataSource.initialize();
  console.log('Database connected');

  loadModels().catch((err) => {
    console.warn('Face model pre-load failed, will retry on first request:', err.message);
  });

  startConversionWorker();
  startCompressionWorker();
  startVariantWorker();
  console.log('Pipeline workers started');

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

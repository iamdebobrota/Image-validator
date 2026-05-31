import { DataSource } from 'typeorm';
import { env } from './env';
import { Image } from '../entities/Image';
import { ProcessingJob } from '../entities/ProcessingJob';
import { ImageVariant } from '../entities/ImageVariant';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  username: env.db.user,
  password: env.db.password,
  entities: [Image, ProcessingJob, ImageVariant],
  synchronize: true,
  logging: false,
});

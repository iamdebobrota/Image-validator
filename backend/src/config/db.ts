import { DataSource } from 'typeorm';
import { env } from './env';
import { Image } from '../entities/Image';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  username: env.db.user,
  password: env.db.password,
  entities: [Image],
  synchronize: true,
  logging: false,
});

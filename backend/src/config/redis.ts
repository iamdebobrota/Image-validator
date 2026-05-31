import { env } from './env';

export const redisConnection = {
  url: env.redis.url,
};

import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    name: process.env.DB_NAME ?? 'argon',
    user: process.env.DB_USER ?? 'argon',
    password: process.env.DB_PASSWORD ?? 'argon_secret',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
  },

  validation: {
    minFileSizeBytes: parseInt(process.env.MIN_FILE_SIZE_BYTES ?? '51200', 10),
    minWidthPx: parseInt(process.env.MIN_WIDTH_PX ?? '300', 10),
    minHeightPx: parseInt(process.env.MIN_HEIGHT_PX ?? '300', 10),
    laplacianThreshold: parseFloat(process.env.LAPLACIAN_THRESHOLD ?? '100'),
    phashThreshold: parseInt(process.env.PHASH_THRESHOLD ?? '10', 10),
    minFaceAreaRatio: parseFloat(process.env.MIN_FACE_AREA_RATIO ?? '0.02'),
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
};

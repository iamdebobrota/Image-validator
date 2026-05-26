import { cloudinary } from '../config/cloudinary';
import { Readable } from 'stream';

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'argon-images',
        public_id: filename.replace(/\.[^/.]+$/, ''),
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('No result from Cloudinary'));
        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
        });
      }
    );

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

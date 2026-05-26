import { Request, Response } from 'express';
import { AppDataSource } from '../config/db';
import { Image } from '../entities/Image';
import { validateImage } from '../services/validation.service';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/upload.service';

const imageRepo = AppDataSource.getRepository(Image);

export async function uploadImage(req: Request, res: Response): Promise<void> {
  try {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded. Use field name "image".' });
    return;
  }

  const { buffer, mimetype, originalname, size } = req.file;

  const result = await validateImage(buffer, mimetype, originalname, imageRepo);

  let cloudinaryPublicId: string | null = null;
  let cloudinaryUrl: string | null = null;

  // Upload all readable images to Cloudinary so rejected ones are also visible
  const isReadable = result.reason !== 'INVALID_FORMAT';
  if (isReadable) {
    try {
      const uploaded = await uploadToCloudinary(result.processedBuffer, originalname);
      cloudinaryPublicId = uploaded.publicId;
      cloudinaryUrl = uploaded.secureUrl;
    } catch (uploadErr) {
      console.warn('Cloudinary upload failed:', uploadErr);
    }
  }

  const entity = imageRepo.create({
    originalFilename: originalname,
    mimeType: mimetype,
    cloudinaryPublicId,
    cloudinaryUrl,
    fileSizeBytes: size,
    width: result.metadata.width,
    height: result.metadata.height,
    pHash: result.metadata.pHash,
    laplacianVariance: result.metadata.laplacianVariance,
    faceCount: result.metadata.faceCount,
    faceAreaRatio: result.metadata.faceAreaRatio,
    status: result.status,
    rejectionReason: result.reason,
    rejectionDetail: result.detail,
  });

  await imageRepo.save(entity);

  res.status(result.passed ? 201 : 200).json({
    id: entity.id,
    status: entity.status,
    originalFilename: entity.originalFilename,
    cloudinaryUrl: entity.cloudinaryUrl,
    width: entity.width,
    height: entity.height,
    rejectionReason: entity.rejectionReason,
    rejectionDetail: entity.rejectionDetail,
    createdAt: entity.createdAt,
  });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload processing failed', detail: String(err) });
  }
}

export async function listImages(_req: Request, res: Response): Promise<void> {
  const images = await imageRepo.find({
    order: { createdAt: 'DESC' },
  });

  res.json(
    images.map((img) => ({
      id: img.id,
      status: img.status,
      originalFilename: img.originalFilename,
      cloudinaryUrl: img.cloudinaryUrl,
      width: img.width,
      height: img.height,
      rejectionReason: img.rejectionReason,
      rejectionDetail: img.rejectionDetail,
      createdAt: img.createdAt,
    }))
  );
}

export async function getImage(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const image = await imageRepo.findOne({ where: { id } });

  if (!image) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  res.json({
    id: image.id,
    status: image.status,
    originalFilename: image.originalFilename,
    mimeType: image.mimeType,
    cloudinaryUrl: image.cloudinaryUrl,
    fileSizeBytes: image.fileSizeBytes,
    width: image.width,
    height: image.height,
    pHash: image.pHash,
    laplacianVariance: image.laplacianVariance,
    faceCount: image.faceCount,
    faceAreaRatio: image.faceAreaRatio,
    rejectionReason: image.rejectionReason,
    rejectionDetail: image.rejectionDetail,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
  });
}

export async function deleteImage(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const image = await imageRepo.findOne({ where: { id } });

  if (!image) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  if (image.cloudinaryPublicId) {
    await deleteFromCloudinary(image.cloudinaryPublicId);
  }

  await imageRepo.remove(image);
  res.status(204).send();
}

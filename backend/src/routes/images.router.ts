import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload.middleware';
import {
  uploadImage,
  listImages,
  getImage,
  deleteImage,
  getJobStatus,
  getVariants,
  reprocessImage,
} from '../controllers/images.controller';

const router = Router();

router.post('/upload', uploadMiddleware.single('image'), uploadImage);
router.get('/', listImages);
router.get('/:id', getImage);
router.delete('/:id', deleteImage);
router.get('/:id/status', getJobStatus);
router.get('/:id/variants', getVariants);
router.post('/:id/reprocess', reprocessImage);

export default router;

import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload.middleware';
import {
  uploadImage,
  listImages,
  getImage,
  deleteImage,
} from '../controllers/images.controller';

const router = Router();

router.post('/upload', uploadMiddleware.single('image'), uploadImage);
router.get('/', listImages);
router.get('/:id', getImage);
router.delete('/:id', deleteImage);

export default router;

export type ImageStatus = 'accepted' | 'rejected';

export type RejectionReason =
  | 'FILE_TOO_SMALL'
  | 'RESOLUTION_TOO_SMALL'
  | 'INVALID_FORMAT'
  | 'DUPLICATE_IMAGE'
  | 'BLURRY_IMAGE'
  | 'NO_FACE_DETECTED'
  | 'FACE_TOO_SMALL'
  | 'MULTIPLE_FACES';

export interface ImageRecord {
  id: string;
  status: ImageStatus;
  originalFilename: string;
  cloudinaryUrl: string | null;
  width: number | null;
  height: number | null;
  rejectionReason: RejectionReason | null;
  rejectionDetail: string | null;
  createdAt: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  result?: ImageRecord;
  error?: string;
}

export const REJECTION_LABELS: Record<RejectionReason, string> = {
  FILE_TOO_SMALL: 'File Too Small',
  RESOLUTION_TOO_SMALL: 'Low Resolution',
  INVALID_FORMAT: 'Invalid Format',
  DUPLICATE_IMAGE: 'Duplicate Image',
  BLURRY_IMAGE: 'Blurry Image',
  NO_FACE_DETECTED: 'No Face Detected',
  FACE_TOO_SMALL: 'Face Too Small',
  MULTIPLE_FACES: 'Multiple Faces',
};

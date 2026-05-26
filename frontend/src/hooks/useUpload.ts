import { useState, useCallback } from 'react';
import type { UploadProgress } from '../types/image';
import { isValidFormat } from '../lib/validators';
import { uploadImage } from '../lib/api';

export function useUpload(onComplete: () => void) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const upload = useCallback(
    async (files: File[]) => {
      const validFiles = files.filter((f) => isValidFormat(f));
      const invalidFiles = files.filter((f) => !isValidFormat(f));

      const newUploads: UploadProgress[] = [
        ...invalidFiles.map(
          (file): UploadProgress => ({
            file,
            progress: 100,
            status: 'error',
            error: `Unsupported format. Use JPEG, PNG, or HEIC.`,
          })
        ),
        ...validFiles.map(
          (file): UploadProgress => ({
            file,
            progress: 0,
            status: 'uploading',
          })
        ),
      ];

      setUploads((prev) => [...newUploads, ...prev]);

      for (const file of validFiles) {
        try {
          const result = await uploadImage(file, (progress) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.file === file ? { ...u, progress } : u
              )
            );
          });

          setUploads((prev) =>
            prev.map((u) =>
              u.file === file
                ? { ...u, progress: 100, status: 'done', result }
                : u
            )
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Upload failed';
          setUploads((prev) =>
            prev.map((u) =>
              u.file === file
                ? { ...u, status: 'error', error: message }
                : u
            )
          );
        }
      }

      onComplete();
    },
    [onComplete]
  );

  const clearUploads = useCallback(() => setUploads([]), []);

  return { uploads, upload, clearUploads };
}

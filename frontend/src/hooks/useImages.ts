import { useState, useEffect, useCallback } from 'react';
import type { ImageRecord } from '../types/image';
import { fetchImages } from '../lib/api';

export function useImages() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchImages();
      setImages(data);
    } catch (err) {
      console.error('Failed to fetch images:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const accepted = images.filter((img) => img.status === 'accepted');
  const rejected = images.filter((img) => img.status === 'rejected');

  return { images, accepted, rejected, loading, refresh };
}

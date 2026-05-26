import axios from 'axios';
import type { ImageRecord } from '../types/image';

const api = axios.create({
  baseURL: '/api',
});

export async function uploadImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ImageRecord> {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await api.post<ImageRecord>('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });

  return data;
}

export async function fetchImages(): Promise<ImageRecord[]> {
  const { data } = await api.get<ImageRecord[]>('/images');
  return data;
}

export async function deleteImage(id: string): Promise<void> {
  await api.delete(`/images/${id}`);
}

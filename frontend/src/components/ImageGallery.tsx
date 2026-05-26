import { useState } from 'react';
import { CheckCircle2, XCircle, ImageIcon, HelpCircle } from 'lucide-react';
import type { ImageRecord } from '../types/image';
import { ImageCard } from './ImageCard';
import { ImageModal } from './ImageModal';

interface Props {
  accepted: ImageRecord[];
  rejected: ImageRecord[];
  loading: boolean;
  onRefresh: () => void;
}

export function ImageGallery({ accepted, rejected, loading, onRefresh }: Props) {
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const total = accepted.length + rejected.length;

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Uploaded Images</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {loading ? 'Loading...' : `${total} photo${total !== 1 ? 's' : ''} uploaded`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-slate-300" />
            <span className="text-sm font-semibold text-slate-900">{total}</span>
          </div>
        </div>

        {!loading && total === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={28} className="text-slate-300" />
            </div>
            <p className="text-[15px] font-medium text-slate-500">No images uploaded yet</p>
            <p className="text-[13px] text-slate-400 mt-1">
              Upload photos using the panel on the left to get started
            </p>
          </div>
        )}

        {accepted.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <h2 className="text-base font-semibold text-slate-900">Accepted</h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                {accepted.length}
              </span>
            </div>
            <p className="text-[13px] text-slate-400 mb-4">
              These photos passed all validation checks and are ready for AI processing.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {accepted.map((img) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  onDelete={onRefresh}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </section>
        )}

        {rejected.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-1.5">
              <XCircle size={18} className="text-red-400" />
              <h2 className="text-base font-semibold text-slate-900">Rejected</h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-600">
                {rejected.length}
              </span>
            </div>
            <p className="text-[13px] text-slate-400 mb-4">
              These photos did not meet the quality requirements. Check the reason on each card.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {rejected.map((img) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  onDelete={onRefresh}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}

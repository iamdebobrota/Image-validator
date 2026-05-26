import { AlertTriangle, Trash2, Maximize2 } from 'lucide-react';
import type { ImageRecord } from '../types/image';
import { REJECTION_LABELS } from '../types/image';
import { deleteImage } from '../lib/api';

interface Props {
  image: ImageRecord;
  onDelete: () => void;
  onClick: () => void;
}

export function ImageCard({ image, onDelete, onClick }: Props) {
  const isAccepted = image.status === 'accepted';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this image?')) return;
    await deleteImage(image.id);
    onDelete();
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-xl overflow-hidden border cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
        ${isAccepted
          ? 'border-slate-200 bg-white hover:border-emerald-300'
          : 'border-red-100 bg-white hover:border-red-300'
        }
      `}
    >
      <div className="aspect-square bg-slate-50 relative overflow-hidden">
        {image.cloudinaryUrl ? (
          <img
            src={image.cloudinaryUrl}
            alt={image.originalFilename}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AlertTriangle size={28} className="text-slate-300" />
          </div>
        )}

        {isAccepted && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="p-2 rounded-full bg-white/90 text-slate-700 shadow-lg">
                <Maximize2 size={16} />
              </div>
            </div>
          </>
        )}

        {!isAccepted && image.rejectionReason && (
          <div className="absolute inset-0 bg-red-900/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <AlertTriangle size={24} className="text-red-300 mb-2" />
            <p className="text-[12px] font-semibold text-white text-center">
              {REJECTION_LABELS[image.rejectionReason]}
            </p>
            {image.rejectionDetail && (
              <p className="text-[11px] text-red-200 text-center mt-1.5 leading-relaxed line-clamp-3">
                {image.rejectionDetail}
              </p>
            )}
            <div className="mt-3 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-medium flex items-center gap-1">
              <Maximize2 size={10} /> View Details
            </div>
          </div>
        )}

        <button
          onClick={handleDelete}
          className="
            absolute top-2 right-2 p-1.5 rounded-lg
            bg-black/40 text-white opacity-0 group-hover:opacity-100
            transition-all duration-150 hover:bg-black/60 cursor-pointer z-10
          "
          aria-label="Delete image"
        >
          <Trash2 size={12} />
        </button>

        <div
          className={`
            absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide
            ${isAccepted
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
            }
          `}
        >
          {isAccepted ? 'Accepted' : 'Rejected'}
        </div>
      </div>

      <div className="p-2.5">
        <p className="text-[12px] font-medium text-slate-800 truncate">
          {image.originalFilename}
        </p>
        {image.width && image.height ? (
          <p className="text-[11px] text-slate-400 mt-0.5">
            {image.width} x {image.height}
          </p>
        ) : null}
        {!isAccepted && image.rejectionReason && (
          <div className="mt-1.5 flex items-center gap-1">
            <AlertTriangle size={10} className="text-red-400 shrink-0" />
            <p className="text-[11px] font-medium text-red-500 truncate">
              {REJECTION_LABELS[image.rejectionReason]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Calendar, Maximize2 } from 'lucide-react';
import type { ImageRecord } from '../types/image';
import { REJECTION_LABELS } from '../types/image';

interface Props {
  image: ImageRecord;
  onClose: () => void;
}

export function ImageModal({ image, onClose }: Props) {
  const isAccepted = image.status === 'accepted';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-overlay-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 bg-slate-100 flex items-center justify-center min-h-[400px] relative">
          {image.cloudinaryUrl ? (
            <img
              src={image.cloudinaryUrl}
              alt={image.originalFilename}
              className="max-w-full max-h-[85vh] object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Maximize2 size={48} />
              <p className="text-sm">No preview available</p>
            </div>
          )}

          <div
            className={`
              absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5
              ${isAccepted
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
              }
            `}
          >
            {isAccepted
              ? <><CheckCircle2 size={12} /> Accepted</>
              : <><XCircle size={12} /> Rejected</>
            }
          </div>
        </div>

        <div className="w-[300px] shrink-0 p-6 flex flex-col border-l border-slate-100">
          <div className="flex items-start justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900 pr-4 break-all leading-tight">
              {image.originalFilename}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            <DetailRow label="Status">
              <span className={`text-sm font-medium ${isAccepted ? 'text-emerald-600' : 'text-red-500'}`}>
                {isAccepted ? 'Accepted' : 'Rejected'}
              </span>
            </DetailRow>

            {image.width && image.height && (
              <DetailRow label="Dimensions">
                <span className="text-sm text-slate-700">{image.width} x {image.height} px</span>
              </DetailRow>
            )}

            <DetailRow label="Uploaded">
              <span className="text-sm text-slate-700 flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-400" />
                {new Date(image.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </DetailRow>

            {!isAccepted && image.rejectionReason && (
              <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-[13px] font-semibold text-red-700">
                    {REJECTION_LABELS[image.rejectionReason]}
                  </span>
                </div>
                {image.rejectionDetail && (
                  <p className="text-[12px] text-red-600/80 leading-relaxed">
                    {image.rejectionDetail}
                  </p>
                )}
              </div>
            )}
          </div>

          {image.cloudinaryUrl && (
            <a
              href={image.cloudinaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full text-center px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors duration-150 cursor-pointer"
            >
              Open Original
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      {children}
    </div>
  );
}

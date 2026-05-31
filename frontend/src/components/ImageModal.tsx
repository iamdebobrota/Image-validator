import { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Calendar, Maximize2, Loader2, Image as ImageIcon, ArrowDownCircle, Layers } from 'lucide-react';
import type { ImageRecord, PipelineJob, ImageVariant } from '../types/image';
import { REJECTION_LABELS } from '../types/image';
import { fetchPipelineStatus, fetchVariants } from '../lib/api';

interface Props {
  image: ImageRecord;
  onClose: () => void;
}

const PIPELINE_STEPS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-slate-500' },
  converting: { label: 'Converting', color: 'text-blue-600' },
  compressing: { label: 'Compressing', color: 'text-blue-600' },
  generating_variants: { label: 'Generating Variants', color: 'text-blue-600' },
  completed: { label: 'Completed', color: 'text-emerald-600' },
  failed: { label: 'Failed', color: 'text-red-600' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function ImageModal({ image, onClose }: Props) {
  const isAccepted = image.status === 'accepted';
  const [pipeline, setPipeline] = useState<PipelineJob | null>(null);
  const [variants, setVariants] = useState<ImageVariant[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!isAccepted) return;

    let cancelled = false;
    setLoading(true);

    async function load() {
      const [pipelineData, variantsData] = await Promise.all([
        fetchPipelineStatus(image.id),
        fetchVariants(image.id),
      ]);
      if (cancelled) return;
      setPipeline(pipelineData);
      setVariants(variantsData);
      setLoading(false);

      if (pipelineData && !['completed', 'failed'].includes(pipelineData.status)) {
        const interval = setInterval(async () => {
          const updated = await fetchPipelineStatus(image.id);
          if (cancelled) { clearInterval(interval); return; }
          if (updated) setPipeline(updated);
          if (updated && ['completed', 'failed'].includes(updated.status)) {
            clearInterval(interval);
            const v = await fetchVariants(image.id);
            if (!cancelled) setVariants(v);
          }
        }, 1500);
        return () => clearInterval(interval);
      }
    }

    const cleanup = load();
    return () => {
      cancelled = true;
      cleanup?.then((fn) => fn?.());
    };
  }, [image.id, isAccepted]);

  const step = pipeline ? PIPELINE_STEPS[pipeline.status] ?? { label: pipeline.status, color: 'text-slate-500' } : null;

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

        <div className="w-[320px] shrink-0 p-6 flex flex-col border-l border-slate-100 overflow-y-auto">
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

            {isAccepted && loading && (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 size={14} className="animate-spin" />
                Loading pipeline...
              </div>
            )}

            {isAccepted && pipeline && (
              <div className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={14} className="text-slate-500" />
                  <span className="text-[13px] font-semibold text-slate-800">Processing Pipeline</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">Status</span>
                    <span className={`text-[12px] font-semibold ${step?.color}`}>
                      {pipeline.status !== 'completed' && pipeline.status !== 'failed' && (
                        <Loader2 size={10} className="inline animate-spin mr-1" />
                      )}
                      {step?.label}
                    </span>
                  </div>

                  {pipeline.currentStep && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">Step</span>
                      <span className="text-[12px] text-blue-600">{pipeline.currentStep}</span>
                    </div>
                  )}

                  {pipeline.errorMessage && (
                    <div className="p-2 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-[11px] text-red-600">{pipeline.errorMessage}</p>
                    </div>
                  )}

                  {pipeline.originalSizeBytes != null && pipeline.compressedSizeBytes != null && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-slate-500">Original</span>
                        <span className="text-[12px] text-slate-700">{formatBytes(pipeline.originalSizeBytes)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-slate-500">Compressed</span>
                        <span className="text-[12px] text-slate-700 flex items-center gap-1">
                          <ArrowDownCircle size={10} className="text-emerald-500" />
                          {formatBytes(pipeline.compressedSizeBytes)}
                        </span>
                      </div>
                    </>
                  )}

                  {pipeline.compressionRatio != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">Saved</span>
                      <span className={`text-[12px] font-semibold ${pipeline.compressionRatio > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {pipeline.compressionRatio > 0 ? `${pipeline.compressionRatio}%` : 'Already optimized'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isAccepted && variants.length > 0 && (
              <div className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon size={14} className="text-slate-500" />
                  <span className="text-[13px] font-semibold text-slate-800">Generated Variants</span>
                </div>

                <div className="space-y-2">
                  {variants.map((v) => (
                    <a
                      key={v.id}
                      href={v.cloudinaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={v.cloudinaryUrl}
                          alt={v.variantType}
                          className="w-8 h-8 rounded object-cover bg-slate-200"
                        />
                        <div>
                          <p className="text-[12px] font-medium text-slate-700 capitalize">{v.variantType}</p>
                          <p className="text-[10px] text-slate-400">{v.width} x {v.height}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">{formatBytes(v.fileSizeBytes)}</span>
                    </a>
                  ))}
                </div>
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

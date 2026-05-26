import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  FileImage,
  Loader2,
  AlertCircle,
  Camera,
  ImagePlus,
  Ruler,
  FileType,
  Eye,
  Users,
  Copy,
  Focus,
} from 'lucide-react';
import type { UploadProgress } from '../types/image';

interface Props {
  onUpload: (files: File[]) => void;
  uploads: UploadProgress[];
  onClear: () => void;
  totalImages: number;
  acceptedCount: number;
  rejectedCount: number;
}

export function Sidebar({
  onUpload,
  uploads,
  onClear,
  totalImages,
  acceptedCount,
  rejectedCount,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onUpload(files);
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length) onUpload(files);
      e.target.value = '';
    },
    [onUpload]
  );

  const activeUploads = uploads.filter((u) => u.status === 'uploading');

  return (
    <aside className="w-[340px] shrink-0 border-r border-slate-200 bg-white h-screen overflow-y-auto flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f87415' }}>
            <Camera size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">Argon</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-[42px]">AI Image Validator</p>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ImagePlus size={18} className="text-orange-500" />
            <h2 className="text-[15px] font-semibold text-slate-900">Upload photos</h2>
          </div>
          <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
            Select at least <span className="font-semibold text-slate-700">6 of your best photos</span>.
            Uploading <span className="font-semibold text-slate-700">a mix of close-ups, selfies and mid-range shots</span> can help the AI better capture your face.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
              transition-all duration-200
              ${dragOver
                ? 'border-orange-400 bg-orange-50'
                : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
              }
            `}
          >
            {activeUploads.length > 0 ? (
              <button className="mx-auto px-5 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Uploading...
              </button>
            ) : (
              <button className="mx-auto px-5 py-2 text-white rounded-full text-sm font-medium hover:opacity-90 transition-colors duration-150 flex items-center gap-2" style={{ background: '#f87415' }}>
                <Upload size={14} />
                Upload Photos
              </button>
            )}
            <p className="text-[13px] font-medium text-slate-600 mt-3">Click to upload or drag and drop</p>
            <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, HEIC up to 20MB</p>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.heic,image/jpeg,image/png,image/heic"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            It can take up to 1 minute to upload
          </p>
        </div>

        {uploads.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-500">
                {activeUploads.length > 0
                  ? `Processing ${activeUploads.length} file${activeUploads.length > 1 ? 's' : ''}...`
                  : 'Upload complete'}
              </span>
              {activeUploads.length === 0 && (
                <button
                  onClick={onClear}
                  className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            {uploads.map((upload, i) => (
              <UploadItem key={`${upload.file.name}-${i}`} upload={upload} />
            ))}
          </div>
        )}

        <div className="pt-2 space-y-2">
          <Accordion
            icon={<CheckCircle2 size={18} className="text-emerald-500" />}
            title="Photo Requirements"
            defaultOpen={false}
          >
            <ul className="space-y-2.5">
              <RequirementItem icon={<Ruler size={14} />} text="Minimum resolution 300 x 300 px" />
              <RequirementItem icon={<FileType size={14} />} text="JPEG, PNG, or HEIC format" />
              <RequirementItem icon={<Eye size={14} />} text="Clear, in-focus image (not blurry)" />
              <RequirementItem icon={<Camera size={14} />} text="One face clearly visible" />
              <RequirementItem icon={<FileImage size={14} />} text="File size at least 50 KB" />
            </ul>
          </Accordion>

          <Accordion
            icon={<XCircle size={18} className="text-red-400" />}
            title="Photo Restrictions"
            defaultOpen={false}
          >
            <ul className="space-y-2.5">
              <RestrictionItem icon={<Eye size={14} />} text="No blurry or out-of-focus images" />
              <RestrictionItem icon={<Users size={14} />} text="No group photos (multiple faces)" />
              <RestrictionItem icon={<Focus size={14} />} text="Face must not be too small in frame" />
              <RestrictionItem icon={<Copy size={14} />} text="No duplicate or very similar photos" />
              <RestrictionItem icon={<Ruler size={14} />} text="No images under 300 x 300 pixels" />
              <RestrictionItem icon={<FileImage size={14} />} text="No files under 50 KB in size" />
            </ul>
          </Accordion>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{totalImages} uploaded</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {acceptedCount}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              {rejectedCount}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Accordion({
  icon,
  title,
  defaultOpen,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-[13px] font-semibold text-slate-800">{title}</span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

function RequirementItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[12px] text-slate-600">
      <span className="text-emerald-500 mt-0.5 shrink-0">{icon}</span>
      <span>{text}</span>
    </li>
  );
}

function RestrictionItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[12px] text-slate-600">
      <span className="text-red-400 mt-0.5 shrink-0">{icon}</span>
      <span>{text}</span>
    </li>
  );
}

function UploadItem({ upload }: { upload: UploadProgress }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
      <FileImage size={16} className="text-slate-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-slate-700 truncate">
          {upload.file.name}
        </p>
        {upload.status === 'uploading' && (
          <div className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        )}
        {upload.status === 'done' && upload.result && (
          <p className={`text-[11px] mt-0.5 ${
            upload.result.status === 'accepted' ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {upload.result.status === 'accepted' ? 'Accepted' : upload.result.rejectionDetail ?? 'Rejected'}
          </p>
        )}
        {upload.status === 'error' && (
          <p className="text-[11px] text-red-500 mt-0.5">{upload.error}</p>
        )}
      </div>
      <div className="shrink-0">
        {upload.status === 'uploading' && <Loader2 size={14} className="text-orange-500 animate-spin" />}
        {upload.status === 'done' && upload.result?.status === 'accepted' && <CheckCircle2 size={14} className="text-emerald-500" />}
        {upload.status === 'done' && upload.result?.status === 'rejected' && <AlertCircle size={14} className="text-amber-500" />}
        {upload.status === 'error' && <AlertCircle size={14} className="text-red-500" />}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  FileText, Download, ExternalLink, Paperclip, X, ZoomIn, ZoomOut, RotateCcw,
  Eye, FileSpreadsheet, FileCode, File, Image as ImageIcon, AlertTriangle, Loader2
} from 'lucide-react';
import { MexoModal } from '../common/MexoModal';

interface FormResourceRendererProps {
  url: string;
  name?: string;
  displayMode?: 'original' | 'banner' | 'compact';
  isPostSubmission?: boolean;
  className?: string;
}

export function isImageFile(url: string, name?: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:image/') || url.includes('image/')) return true;
  const target = (name || url).toLowerCase();
  return /\.(jpg|jpeg|png|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(target);
}

export function isPdfFile(url: string, name?: string): boolean {
  if (!url) return false;
  const target = (name || url).toLowerCase();
  return /\.pdf(\?.*)?$/i.test(target) || url.includes('/pdf') || url.includes('application/pdf');
}

export function isDocFile(url: string, name?: string): boolean {
  if (!url) return false;
  const target = (name || url).toLowerCase();
  return /\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar)(\?.*)?$/i.test(target);
}

export function getFileExtLabel(url: string, name?: string): string {
  if (!url) return 'FILE';
  const target = (name || url).toLowerCase();
  const clean = target.split('?')[0];
  const ext = clean.split('.').pop();
  if (!ext || ext === clean) return 'FILE';
  return ext.toUpperCase();
}

export const FormResourceRenderer: React.FC<FormResourceRendererProps> = ({
  url,
  name,
  displayMode = 'original',
  isPostSubmission = false,
  className = '',
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  if (!url) return null;

  const fileName = name || 'Form Resource';
  const isImg = isImageFile(url, fileName);
  const isPdf = isPdfFile(url, fileName);
  const extLabel = getFileExtLabel(url, fileName);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(url, '_blank');
    }
  };

  /* -------------------------------------------------------------
     1. INLINE IMAGE DISPLAY (JPG, PNG, WEBP, GIF, SVG)
     ------------------------------------------------------------- */
  if (isImg) {
    let modeClass = 'w-full max-h-[480px] object-contain rounded-2xl';
    if (displayMode === 'banner') {
      modeClass = 'w-full h-48 sm:h-64 object-cover rounded-2xl';
    } else if (displayMode === 'compact') {
      modeClass = 'max-h-48 max-w-sm mx-auto object-contain rounded-xl';
    }

    return (
      <div className={`space-y-1.5 my-3 ${className}`}>
        <div className="relative group overflow-hidden rounded-2xl bg-slate-50 border border-app-border cursor-zoom-in transition-all hover:border-indigo-300 hover:shadow-mexo-sm">
          {/* Skeleton loader while image is downloading */}
          {imgLoading && !imgError && (
            <div className="w-full h-48 bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
              <span className="text-xs font-semibold">Loading resource image...</span>
            </div>
          )}

          {imgError ? (
            <div className="p-6 text-center space-y-2 bg-rose-50/50">
              <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
              <p className="text-xs font-semibold text-rose-800">Couldn't load image</p>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                <Download className="w-3.5 h-3.5" /> Download File
              </button>
            </div>
          ) : (
            <>
              <img
                src={url}
                alt={fileName}
                onLoad={() => setImgLoading(false)}
                onError={() => { setImgLoading(false); setImgError(true); }}
                onClick={() => setLightboxOpen(true)}
                className={`${modeClass} ${imgLoading ? 'hidden' : 'block'}`}
              />

              {/* Hover overlay hint */}
              {!imgLoading && (
                <div
                  onClick={() => setLightboxOpen(true)}
                  className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold pointer-events-none"
                >
                  <ZoomIn className="w-5 h-5" /> Click to enlarge
                </div>
              )}
            </>
          )}
        </div>

        {/* Small secondary caption bar */}
        <div className="flex items-center justify-between text-[11px] text-app-muted px-1">
          <span className="truncate font-medium flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[#7C3AED]" /> {fileName}
          </span>
          <button
            type="button"
            onClick={handleDownload}
            className="text-[#7C3AED] hover:underline font-bold flex items-center gap-1 shrink-0"
          >
            <Download className="w-3 h-3" /> Download
          </button>
        </div>

        {/* LIGHTBOX MODAL */}
        <MexoModal
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          title={fileName}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-3">
            {/* Lightbox Controls Toolbar */}
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                  className="p-1.5 rounded-lg hover:bg-white text-app-heading font-bold flex items-center gap-1"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                  className="p-1.5 rounded-lg hover:bg-white text-app-heading font-bold flex items-center gap-1"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="p-1.5 rounded-lg hover:bg-white text-app-muted hover:text-app-heading flex items-center gap-1"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset ({Math.round(zoom * 100)}%)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white font-bold flex items-center gap-1.5 hover:opacity-90"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white border border-app-border text-app-heading font-bold flex items-center gap-1.5 hover:bg-slate-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Original
                </a>
              </div>
            </div>

            {/* Image Stage */}
            <div className="w-full h-[60vh] bg-slate-950 rounded-2xl flex items-center justify-center overflow-auto p-4">
              <img
                src={url}
                alt={fileName}
                style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </MexoModal>
      </div>
    );
  }

  /* -------------------------------------------------------------
     2. PDF DOCUMENT CARD + EMBEDDED PREVIEW MODAL
     ------------------------------------------------------------- */
  if (isPdf) {
    return (
      <div className={`p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3 my-3 ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-extrabold text-xs shadow-2xs">
            PDF
          </div>
          <div className="min-w-0 text-xs">
            <p className="font-bold text-app-heading truncate">{fileName}</p>
            <p className="text-[11px] text-app-muted">PDF Document · Downloadable resource</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPdfModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-[#7C3AED] text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> Preview PDF
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-xl bg-[#7C3AED] text-white hover:opacity-90 transition-opacity"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* PDF VIEWER MODAL */}
        <MexoModal
          open={pdfModalOpen}
          onOpenChange={setPdfModalOpen}
          title={fileName}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl text-xs">
              <span className="font-bold text-app-heading">{fileName}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white font-bold flex items-center gap-1.5 hover:opacity-90"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white border border-app-border text-app-heading font-bold flex items-center gap-1.5 hover:bg-slate-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                </a>
              </div>
            </div>

            <div className="w-full h-[70vh] rounded-2xl overflow-hidden border border-app-border bg-slate-900">
              <iframe
                src={url}
                title={fileName}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </MexoModal>
      </div>
    );
  }

  /* -------------------------------------------------------------
     3. OTHER DOCUMENTS (DOCX, XLSX, PPTX, TXT, ZIP)
     ------------------------------------------------------------- */
  return (
    <div className={`p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 my-3 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0 font-extrabold text-[10px] uppercase shadow-2xs">
          {extLabel}
        </div>
        <div className="min-w-0 text-xs">
          <p className="font-bold text-app-heading truncate">{fileName}</p>
          <p className="text-[11px] text-app-muted">{extLabel} File · Downloadable resource</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleDownload}
          className="px-3 py-1.5 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          title="Open Link"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

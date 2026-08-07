import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react';

export interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;  // data URL of raw selected image
  onClose: () => void;
  onCrop: (blob: Blob) => void;  // called with cropped 512×512 blob
}

const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 3.0;

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCrop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);

  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    setZoom(1.0);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setIsSaving(false);
    loadImage(imageSrc)
      .then(setLoadedImg)
      .catch((err) => console.error('Failed to load image for crop:', err));
  }, [isOpen, imageSrc]);

  const clampOffset = useCallback(
    (ox: number, oy: number, currentZoom: number, currentRotation: number): { x: number; y: number } => {
      const el = cropAreaRef.current;
      if (!el || !loadedImg) return { x: ox, y: oy };

      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw === 0 || ch === 0) return { x: ox, y: oy };

      const circleR = Math.min(cw, ch) * 0.42;

      const isRotated90 = currentRotation === 90 || currentRotation === 270;
      const natW = isRotated90 ? loadedImg.naturalHeight : loadedImg.naturalWidth;
      const natH = isRotated90 ? loadedImg.naturalWidth : loadedImg.naturalHeight;

      const baseScale = (circleR * 2) / Math.min(natW, natH);
      const scale = baseScale * currentZoom;

      const dw = natW * scale;
      const dh = natH * scale;

      const maxX = Math.max(0, (dw - circleR * 2) / 2);
      const maxY = Math.max(0, (dh - circleR * 2) / 2);

      return {
        x: Math.min(maxX, Math.max(-maxX, ox)),
        y: Math.min(maxY, Math.max(-maxY, oy)),
      };
    },
    [loadedImg]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const el = cropAreaRef.current;
    if (!canvas || !el || !loadedImg) return;

    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw === 0 || ch === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cw, ch);

    const circleR = Math.min(cw, ch) * 0.42;
    const cx = cw / 2 + offset.x;
    const cy = ch / 2 + offset.y;

    const isRotated90 = rotation === 90 || rotation === 270;
    const natW = isRotated90 ? loadedImg.naturalHeight : loadedImg.naturalWidth;
    const natH = isRotated90 ? loadedImg.naturalWidth : loadedImg.naturalHeight;

    const baseScale = (circleR * 2) / Math.min(natW, natH);
    const scale = baseScale * zoom;

    const dw = natW * scale;
    const dh = natH * scale;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(loadedImg, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, cw, ch);
    ctx.arc(cw / 2, ch / 2, circleR, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cw / 2, ch / 2, circleR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }, [loadedImg, zoom, rotation, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handler = () => draw();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [draw]);

  const getPointer = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    dragging.current = true;
    const nativeEvt = e.nativeEvent;
    if ('touches' in nativeEvt && nativeEvt.touches.length > 0) {
      lastPointer.current = { x: nativeEvt.touches[0].clientX, y: nativeEvt.touches[0].clientY };
    } else if ('clientX' in nativeEvt) {
      lastPointer.current = { x: (nativeEvt as MouseEvent).clientX, y: (nativeEvt as MouseEvent).clientY };
    }
  };

  const onPointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      if (e.cancelable) e.preventDefault();

      if ('touches' in e && e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (lastPinchDist.current !== null && lastPinchDist.current > 0) {
          const delta = dist / lastPinchDist.current;
          setZoom((z) => {
            const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta));
            setOffset((prev) => clampOffset(prev.x, prev.y, next, rotation));
            return next;
          });
        }
        lastPinchDist.current = dist;
        return;
      }
      lastPinchDist.current = null;

      const pt = getPointer(e);
      const dx = pt.x - lastPointer.current.x;
      const dy = pt.y - lastPointer.current.y;
      lastPointer.current = pt;

      setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy, zoom, rotation));
    },
    [clampOffset, zoom, rotation]
  );

  const onPointerUp = () => {
    dragging.current = false;
    lastPinchDist.current = null;
  };

  const onWheel = useCallback(
    (e: WheelEvent) => {
      if (e.cancelable) e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((z) => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta));
        setOffset((prev) => clampOffset(prev.x, prev.y, next, rotation));
        return next;
      });
    },
    [clampOffset, rotation]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('mousemove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    const el = cropAreaRef.current;
    if (el) {
      el.addEventListener('wheel', onWheel, { passive: false });
    }

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      if (el) el.removeEventListener('wheel', onWheel);
    };
  }, [isOpen, onPointerMove, onWheel]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    setZoom(clamped);
    setOffset((prev) => clampOffset(prev.x, prev.y, clamped, rotation));
  };

  const rotate = (dir: 1 | -1) => {
    setRotation((r) => {
      const next = (r + dir * 90 + 360) % 360;
      setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleSave = async () => {
    if (!loadedImg || isSaving) return;
    setIsSaving(true);

    try {
      const el = cropAreaRef.current!;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const circleR = Math.min(cw, ch) * 0.42;

      const out = document.createElement('canvas');
      out.width = OUTPUT_SIZE;
      out.height = OUTPUT_SIZE;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D canvas context');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const scaleToOutput = OUTPUT_SIZE / (circleR * 2);

      const isRotated90 = rotation === 90 || rotation === 270;
      const natW = isRotated90 ? loadedImg.naturalHeight : loadedImg.naturalWidth;
      const natH = isRotated90 ? loadedImg.naturalWidth : loadedImg.naturalHeight;

      const baseScale = (circleR * 2) / Math.min(natW, natH);
      const scale = baseScale * zoom * scaleToOutput;

      const dw = natW * scale;
      const dh = natH * scale;

      const outCx = OUTPUT_SIZE / 2 + offset.x * scaleToOutput;
      const outCy = OUTPUT_SIZE / 2 + offset.y * scaleToOutput;

      ctx.save();
      ctx.translate(outCx, outCy);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(loadedImg, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();

      out.toBlob(
        (blob) => {
          if (blob) {
            onCrop(blob);
          } else {
            console.error('Canvas toBlob returned null');
          }
          setIsSaving(false);
        },
        'image/webp',
        0.92
      );
    } catch (err) {
      console.error('Crop save error:', err);
      setIsSaving(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  const isMobile = window.innerWidth < 640;

  const cropperContent = (
    <div
      className={`fixed inset-0 z-[200] flex flex-col bg-slate-950 ${isMobile ? '' : 'items-center justify-center'}`}
      style={{ touchAction: 'none' }}
    >
      {!isMobile && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      )}

      <div
        className={`relative flex flex-col bg-slate-950 ${
          isMobile
            ? 'w-full h-full'
            : 'w-full max-w-[580px] max-h-[92dvh] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 mx-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            aria-label="Cancel crop"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-sm font-extrabold text-white tracking-tight">Crop profile photo</h3>
          <div className="w-5" />
        </div>

        <div
          ref={cropAreaRef}
          className="relative flex-1 min-h-0 overflow-hidden cursor-grab active:cursor-grabbing"
          style={{ userSelect: 'none', touchAction: 'none', minHeight: isMobile ? 0 : 320 }}
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ display: 'block' }}
            aria-label="Image crop area — drag to reposition"
          />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <span className="bg-slate-950/80 text-white text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
              Drag to reposition · Pinch or scroll to zoom
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 px-5 py-4 bg-slate-950 border-t border-slate-800 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Zoom</span>
              <span className="font-mono text-indigo-400">{zoom.toFixed(1)}×</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.1)}
                className="p-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.05}
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                aria-label="Zoom level"
              />
              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.1)}
                className="p-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => rotate(-1)}
                className="p-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                aria-label="Rotate 90° counter-clockwise"
                title="Rotate counter-clockwise"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => rotate(1)}
                className="p-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                aria-label="Rotate 90° clockwise"
                title="Rotate clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white text-xs font-extrabold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
                aria-label="Save photo"
              >
                {isSaving ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Cropping...' : 'Save photo'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(cropperContent, document.body);
};

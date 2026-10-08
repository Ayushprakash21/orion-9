import React, { useState, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { X, Camera, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  targetSize = 512
): Promise<string> => {
  if (!pixelCrop || pixelCrop.width === 0 || pixelCrop.height === 0) {
    throw new Error('Invalid crop dimensions');
  }

  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to load image for cropping'));
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is unavailable');
  }

  const outputSize = Math.max(128, Math.min(1024, targetSize));
  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  let dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  // Enforce 2 MB limit on resulting data URL
  const approxSizeBytes = Math.round((dataUrl.length * 3) / 4);
  if (approxSizeBytes > 2 * 1024 * 1024) {
    dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  }

  return dataUrl;
};

export interface AvatarEditorModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onApply: (croppedImageDataUrl: string) => void | Promise<void>;
  onError?: (error: Error) => void;
  title?: string;
  applyButtonText?: string;
  targetSize?: number;
}

export const AvatarEditorModal: React.FC<AvatarEditorModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onApply,
  onError,
  title = 'Adjust Profile Avatar',
  applyButtonText = 'Apply Changes',
  targetSize = 512
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPercent, setCroppedAreaPercent] = useState<any>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPercent(null);
      setCroppedAreaPixels(null);
      setIsProcessing(false);
    }
  }, [isOpen, imageSrc]);

  // Keyboard shortcut listener: Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageSrc) return null;

  const handleSave = async () => {
    if (!croppedAreaPixels || isProcessing) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, targetSize);
      if (!croppedImage) {
        throw new Error('Could not generate cropped image');
      }
      await onApply(croppedImage);
      onClose();
    } catch (err: any) {
      console.error('Failed to crop avatar image:', err);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-editor-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12151a] border border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[calc(100vh-48px)] overflow-x-hidden overflow-y-auto flex flex-col font-sans select-none my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2.5">
            <Camera className="w-4 h-4 text-sky-400" />
            <h3 id="avatar-editor-title" className="font-semibold text-sm text-white tracking-wide">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center gap-5 overflow-x-hidden">
          {/* Constrained Crop Box */}
          <div className="relative w-full max-w-[360px] h-[360px] max-h-[min(360px,calc(100vw-80px))] aspect-square bg-black rounded-xl overflow-hidden border border-white/10 shadow-inner shrink-0 mx-auto">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              restrictPosition={true}
              onCropChange={setCrop}
              onCropComplete={(areaPercent, pixels) => {
                setCroppedAreaPercent(areaPercent);
                setCroppedAreaPixels(pixels);
              }}
              onZoomChange={setZoom}
            />
          </div>
          
          {/* Zoom Slider & Accessible Controls */}
          <div className="w-full max-w-[360px] flex items-center gap-3 px-2">
            <span className="text-xs text-slate-400 font-medium font-mono uppercase tracking-wider shrink-0">Zoom</span>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom(prev => Math.max(1, Math.round((prev - 0.1) * 10) / 10))}
              disabled={zoom <= 1}
              className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer shrink-0"
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <input
              type="range"
              aria-label="Zoom level"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-sky-400 h-1 bg-white/[0.1] rounded-lg cursor-pointer"
            />
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom(prev => Math.min(3, Math.round((prev + 0.1) * 10) / 10))}
              disabled={zoom >= 3}
              className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer shrink-0"
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Real-Time Circular Avatar Preview */}
          <div className="w-full max-w-[360px] flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] shadow-inner">
            <div 
              data-testid="avatar-crop-preview"
              className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-sky-400/80 bg-black shrink-0 shadow-md"
            >
              {imageSrc && croppedAreaPercent ? (
                <img
                  src={imageSrc}
                  alt="Circular crop preview"
                  className="absolute max-w-none pointer-events-none select-none"
                  style={{
                    width: `${(100 / (croppedAreaPercent.width || 100)) * 100}%`,
                    height: `${(100 / (croppedAreaPercent.height || 100)) * 100}%`,
                    left: `-${((croppedAreaPercent.x || 0) / (croppedAreaPercent.width || 100)) * 100}%`,
                    top: `-${((croppedAreaPercent.y || 0) / (croppedAreaPercent.height || 100)) * 100}%`,
                  }}
                />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                  Preview
                </div>
              )}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs font-semibold text-white tracking-wide">Live Circular Preview</span>
              <span className="text-[11px] text-slate-400">Position and framing for final circular avatar</span>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-black bg-sky-400 hover:bg-sky-300 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              <span>{applyButtonText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

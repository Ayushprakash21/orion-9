import React, { useState, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, Camera, Loader2 } from 'lucide-react';

export const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.92);
};

export interface AvatarEditorModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onApply: (croppedImageDataUrl: string) => void | Promise<void>;
  title?: string;
  applyButtonText?: string;
}

export const AvatarEditorModal: React.FC<AvatarEditorModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onApply,
  title = 'Adjust Profile Avatar',
  applyButtonText = 'Apply Changes'
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
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
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      await onApply(croppedImage);
      onClose();
    } catch (err) {
      console.error('Failed to crop avatar image:', err);
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
        <div className="p-6 flex flex-col items-center gap-6 overflow-x-hidden">
          {/* Constrained Crop Box */}
          <div className="relative w-full max-w-[360px] h-[360px] max-h-[min(360px,calc(100vw-80px))] aspect-square bg-black rounded-xl overflow-hidden border border-white/10 shadow-inner shrink-0 mx-auto">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
              onZoomChange={setZoom}
            />
          </div>
          
          {/* Zoom Slider */}
          <div className="w-full max-w-[360px] flex items-center gap-3 px-2">
            <span className="text-xs text-slate-400 font-medium font-mono uppercase tracking-wider shrink-0">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-sky-400 h-1 bg-white/[0.1] rounded-lg cursor-pointer"
            />
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

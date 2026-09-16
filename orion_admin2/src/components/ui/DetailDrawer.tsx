import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  subtitle,
  children,
  footer
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-os-background border-l border-os-border z-50 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-os-border bg-os-surface">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 bg-os-surface-elevated border border-os-border rounded-lg text-os-text-primary">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-os-text-primary uppercase tracking-wide">{title}</h3>
              {subtitle && <div className="mt-1">{subtitle}</div>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-os-surface-hover text-os-text-muted rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6 bg-os-background">
          {children}
        </div>
        
        {footer && (
          <div className="p-4 sm:p-6 border-t border-os-border bg-os-surface">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

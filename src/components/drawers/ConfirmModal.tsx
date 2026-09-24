import React from 'react';
import { createPortal } from 'react-dom';
import { useEntityDrawer } from '../../store/EntityDrawerContext';

export const ConfirmModal: React.FC = () => {
  const { confirmModal, hideConfirmModal } = useEntityDrawer();

  if (!confirmModal || !confirmModal.isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[2147483640] flex items-center justify-center bg-black/70 backdrop-blur-xs transition-opacity animate-fadeIn p-4 select-none">
      <div 
        role="alertdialog"
        aria-modal="true"
        aria-label={confirmModal.title}
        className="bg-os-surface border border-os-border rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl text-os-text-primary animate-in zoom-in-95"
      >
        <div>
          <h3 className="text-base font-medium tracking-tight text-os-text-primary">{confirmModal.title}</h3>
          <p className="text-xs text-os-text-secondary mt-1.5 leading-relaxed">{confirmModal.message}</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={hideConfirmModal}
            className="px-4 py-2 bg-os-surface-elevated border border-os-border text-os-text-secondary hover:text-os-text-primary rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmModal.onConfirm}
            className="px-4 py-2 bg-os-border-inverse text-os-text-primary-inverse hover:bg-[#E0E0E0] rounded-lg text-xs font-mono uppercase tracking-wider font-medium transition-colors cursor-pointer"
          >
            {confirmModal.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content;
};

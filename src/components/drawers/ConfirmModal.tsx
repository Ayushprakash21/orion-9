import React from 'react';
import { useEntityDrawer } from '../../store/EntityDrawerContext';

export const ConfirmModal: React.FC = () => {
  const { confirmModal, hideConfirmModal } = useEntityDrawer();

  if (!confirmModal || !confirmModal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs transition-opacity animate-fadeIn p-4">
      <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl text-[#F5F5F5]">
        <div>
          <h3 className="text-base font-medium tracking-tight text-[#F5F5F5]">{confirmModal.title}</h3>
          <p className="text-xs text-[#B3B3B3] mt-1.5 leading-relaxed">{confirmModal.message}</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={hideConfirmModal}
            className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#B3B3B3] hover:text-[#F5F5F5] rounded-lg text-xs font-mono uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmModal.onConfirm}
            className="px-4 py-2 bg-[#F5F5F5] text-black hover:bg-[#E0E0E0] rounded-lg text-xs font-mono uppercase tracking-wider font-medium transition-colors"
          >
            {confirmModal.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';

interface OrionSleepScreenProps {
  onWake: () => void;
}

export const OrionSleepScreen: React.FC<OrionSleepScreenProps> = ({ onWake }) => {
  useEffect(() => {
    const handleKeyDown = () => {
      onWake();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onWake]);

  return (
    <div
      onClick={onWake}
      className="fixed inset-0 bg-black z-[100000] cursor-pointer flex flex-col items-center justify-center select-none group"
      title="Click or press any key to wake"
    >
      <div className="opacity-0 group-hover:opacity-40 transition-opacity duration-700 flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-os-accent animate-ping mb-3" />
        <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">
          Click or press any key to wake
        </span>
      </div>
    </div>
  );
};

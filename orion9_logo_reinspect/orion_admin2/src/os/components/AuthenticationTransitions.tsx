import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface TransitionProps {
  onComplete: () => void;
}

export function UserAuthenticationTransition({ onComplete }: TransitionProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sequence = [
      { t: 400, s: 1 },
      { t: 1000, s: 2 },
      { t: 1600, s: 3 },
      { t: 2200, s: 4 } // complete
    ];
    
    const timeouts = sequence.map(item => 
      setTimeout(() => {
        if (item.s === 4) onComplete();
        else setStep(item.s);
      }, item.t)
    );
    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-os-bg text-white select-none">
      <div className="flex flex-col items-center">
        <BrandLogo sizePreset="sm" variant="mark" className={cn("transition-all duration-500", step >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-90")} />
        
        <div className="mt-8 flex flex-col items-center h-12">
          <div className={cn("text-[11px] font-mono tracking-widest text-cyan-400 uppercase transition-opacity duration-300", step === 1 ? "opacity-100" : "opacity-0 hidden")}>
            AUTHENTICATION VERIFIED
          </div>
          <div className={cn("text-[11px] font-mono tracking-widest text-cyan-400 uppercase transition-opacity duration-300", step === 2 ? "opacity-100" : "opacity-0 hidden")}>
            IDENTITY VERIFIED
          </div>
          <div className={cn("text-[11px] font-mono tracking-widest text-cyan-400 uppercase transition-opacity duration-300", step === 3 ? "opacity-100" : "opacity-0 hidden")}>
            SESSION CREATED
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminAuthenticationTransition({ onComplete }: TransitionProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sequence = [
      { t: 400, s: 1 },
      { t: 1200, s: 2 },
      { t: 1800, s: 3 } // complete
    ];
    
    const timeouts = sequence.map(item => 
      setTimeout(() => {
        if (item.s === 3) onComplete();
        else setStep(item.s);
      }, item.t)
    );
    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-os-bg text-white select-none relative overflow-hidden">
      <div className="absolute inset-0 bg-red-900/10" />
      
      <div className="flex flex-col items-center relative z-10">
        <BrandLogo sizePreset="sm" variant="mark" className={cn("transition-all duration-500", step >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-90")} />
        
        <div className="mt-8 flex flex-col items-center h-12">
          <div className={cn("text-[11px] font-mono tracking-widest text-os-accent uppercase transition-opacity duration-300", step === 1 ? "opacity-100" : "opacity-0 hidden")}>
            ADMIN IDENTITY VERIFIED
          </div>
          <div className={cn("text-[11px] font-mono tracking-widest text-os-accent uppercase transition-opacity duration-300", step === 2 ? "opacity-100" : "opacity-0 hidden")}>
            PRIVILEGED SESSION ESTABLISHED
          </div>
        </div>
      </div>
    </div>
  );
}

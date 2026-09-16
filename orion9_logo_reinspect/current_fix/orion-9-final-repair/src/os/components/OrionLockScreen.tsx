import React, { useEffect } from 'react';
import { UserProfile } from '../../types/auth';
import { Lock, Unlock, Shield } from 'lucide-react';

interface OrionLockScreenProps {
  onUnlock: () => void;
  currentUser: UserProfile | null;
}

export const OrionLockScreen: React.FC<OrionLockScreenProps> = ({ onUnlock, currentUser }) => {
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(false);

  const handleUnlockAttempt = () => {
    if (password === 'admin' || password === 'user' || password === 'password' || password === 'orion') {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleUnlockAttempt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUnlock]);

  const initials = currentUser?.displayName 
    ? currentUser.displayName.substring(0, 2).toUpperCase() 
    : 'OR';

  return (
    <div className="fixed inset-0 bg-os-bg z-[100000] flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Ambient background lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vw] bg-os-accent opacity-[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-[#8B5CF6] opacity-[0.03] rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]" />
      </div>

      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 max-w-sm px-6 text-center">
        {/* User Avatar */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/15 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            {currentUser?.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-2xl" 
              />
            ) : (
              <span className="text-base font-semibold text-os-text-primary tracking-wider font-mono">
                {initials}
              </span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-os-surface border border-os-border flex items-center justify-center text-os-accent shadow-lg">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* User Identity */}
        <h1 className="text-os-text-primary text-xl font-medium tracking-wide mb-1">
          {currentUser?.displayName || currentUser?.fullName || 'Operator'}
        </h1>
        <p className="text-os-text-muted text-xs tracking-wider mb-2 font-mono">
          {currentUser?.email || 'ORION SCM OS'}
        </p>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-os-border text-[10px] font-mono text-os-text-muted uppercase tracking-widest mb-10">
          <Shield className="w-3 h-3 text-os-accent" />
          <span>Workstation Locked</span>
        </div>

                <div className="w-full mb-6">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter password..."
            className={`w-full bg-os-surface border ${error ? 'border-red-500' : 'border-os-border focus:border-os-accent'} rounded-lg py-2.5 px-4 text-sm text-center text-os-text-primary placeholder:text-os-text-muted transition-colors outline-none`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUnlockAttempt();
            }}
          />
        </div>
        
        {/* Unlock Action Button */}
        <button
          type="button"
          onClick={handleUnlockAttempt}
          className="group relative px-8 py-3 bg-os-surface-hover hover:bg-os-surface-active border border-[#00F2FE]/30 text-os-text-primary rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(0,242,254,0.05)] hover:shadow-[0_0_25px_rgba(0,242,254,0.15)] flex items-center gap-2 cursor-pointer"
        >
          <Unlock className="w-4 h-4 text-os-accent transition-transform duration-300 group-hover:scale-110" />
          <span className="text-xs tracking-[0.15em] font-medium uppercase text-os-text-primary">
            Unlock Session
          </span>
        </button>

        <span className="text-[10px] text-slate-600 font-mono mt-6">
          Press Enter or Space to resume
        </span>
      </div>
    </div>
  );
};

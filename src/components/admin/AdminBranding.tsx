import React, { useState, useEffect, useRef } from 'react';
import { Palette, Camera, Save, Loader2, Check } from 'lucide-react';
import { useToast } from '../../store/ToastContext';
import { brandingRepository } from '../../repositories/BrandingRepository';

export const AdminBranding = () => {
  const [appName, setAppName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoIncludesName, setLogoIncludesName] = useState(false);
  
  // Creator Identity States
  const [creatorName, setCreatorName] = useState('Ayush Prakash');
  const [creatorTitle, setCreatorTitle] = useState('Creator & Supply Chain OS Architect');
  const [creatorQuote, setCreatorQuote] = useState('What if the supply chain had an operating system?');
  const [creatorPhotoUrl, setCreatorPhotoUrl] = useState<string | null>(null);
  const [founderNote, setFounderNote] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [persistenceState, setPersistenceState] = useState<'idle' | 'remote' | 'local' | 'error' | 'unsaved'>('idle');
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const creatorFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const config = await brandingRepository.getBranding();
        setAppName(config.appName || config.productName || config.osName || 'ORION-9');
        setDescription(config.description || config.tagline || 'AI Supply Chain Operating System');
        setLogoUrl(config.logoUrl || config.logo || null);
        setLogoIncludesName(Boolean(config.logoIncludesName || config.logoIncludesWordmark));
        setCreatorName(config.creatorName || 'Ayush Prakash');
        setCreatorTitle(config.creatorTitle || 'Creator & Supply Chain OS Architect');
        setCreatorQuote(config.creatorQuote || 'What if the supply chain had an operating system?');
        setCreatorPhotoUrl(config.creatorPhotoUrl || null);
        setFounderNote(config.founderNote || '');
      } catch (error) {
        showToast('Failed to load branding configuration', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadBranding().catch(() => {});
  }, []);

  useEffect(() => {
    if (persistenceState === 'remote' || persistenceState === 'local' || persistenceState === 'error') {
      setPersistenceState('unsaved');
    }
  }, [appName, description, logoUrl, logoIncludesName, creatorName, creatorTitle, creatorQuote, creatorPhotoUrl, founderNote]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo file is too large. Maximum size is 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatorPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showToast('Invalid photo format. Supported formats: PNG, JPG, WebP.', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast('Creator photo is too large. Maximum size is 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result as string;
        setCreatorPhotoUrl(photoData);
        try {
          window.dispatchEvent(new CustomEvent('CREATOR_IDENTITY_PHOTO_CHANGED', { detail: { photoUrl: photoData } }));
        } catch (err) {}
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setPersistenceState('unsaved');

    const cleanAppName = appName.trim() || 'ORION-9';
    const cleanDescription = description.trim() || 'AI Supply Chain Operating System';

    try {
      const result = await brandingRepository.saveBranding({
        appName: cleanAppName,
        applicationName: cleanAppName,
        productName: cleanAppName,
        osName: cleanAppName,
        description: cleanDescription,
        tagline: cleanDescription,
        logoUrl,
        logo: logoUrl,
        logoIncludesName,
        logoIncludesWordmark: logoIncludesName,
        creatorName: creatorName.trim() || 'Ayush Prakash',
        creatorTitle: creatorTitle.trim() || 'Creator & Supply Chain OS Architect',
        creatorQuote: creatorQuote.trim() || 'What if the supply chain had an operating system?',
        creatorPhotoUrl,
        founderNote: founderNote.trim(),
      });

      setPersistenceState(result.method === 'remote' ? 'remote' : 'local');

      if (result.method === 'remote') {
        showToast('Branding & Creator Identity saved successfully.', 'success');
      } else {
        showToast('Branding & Creator Identity saved locally.', 'success');
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
      }, 2500);
    } catch (error: any) {
      setPersistenceState('error');
      showToast(error?.message || 'Unable to persist branding configuration. Storage may be unavailable or quota exceeded.', 'error');
      console.error('Branding save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset branding & creator identity to defaults?")) {
      const config = await brandingRepository.resetBranding();
      setAppName(config.appName || 'ORION-9');
      setDescription(config.description || 'AI Supply Chain Operating System');
      setLogoUrl(config.logoUrl || null);
      setLogoIncludesName(Boolean(config.logoIncludesName));
      setCreatorName(config.creatorName || 'Ayush Prakash');
      setCreatorTitle(config.creatorTitle || 'Creator & Supply Chain OS Architect');
      setCreatorQuote(config.creatorQuote || 'What if the supply chain had an operating system?');
      setCreatorPhotoUrl(config.creatorPhotoUrl || null);
      setFounderNote(config.founderNote || '');
      setPersistenceState('idle');
      showToast('Branding reset to defaults.', 'info');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-os-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-sm">Loading branding configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
      <div>
        <h1 className="text-2xl font-light tracking-tight mb-2">Platform Branding</h1>
        <p className="text-sm text-os-text-secondary">Customize platform identity, logos, and global nomenclature.</p>
      </div>

      <div className="p-6 rounded-lg border border-os-border bg-os-bg space-y-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-primary mb-4">Core Identity</h2>
          
          <div className="mb-6 p-4 rounded border border-os-border bg-os-surface-secondary flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-os-text-muted font-bold mb-2">LIVE PREVIEW</div>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Platform Logo" className="h-6 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 rounded bg-os-surface border border-os-border flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-os-text-muted">OS</span>
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-[13px] tracking-wider text-os-text-primary whitespace-nowrap">
                      {appName || 'ORION-9'}
                    </span>
                  </div>
                  {(description || 'AI Supply Chain Operating System') && (
                    <span className="text-[9px] font-mono text-os-text-muted uppercase tracking-widest whitespace-nowrap mt-0.5">
                      {description || 'AI Supply Chain Operating System'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Operating System Name</label>
              <input 
                type="text" 
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                placeholder="ORION-9"
              />
              <p className="text-[10px] text-os-text-muted mt-1">Configures the primary platform name throughout the operating system and headers.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Operating System Tagline</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                placeholder="AI Supply Chain Operating System"
              />
              <p className="text-[10px] text-os-text-muted mt-1">Configures the platform tagline and descriptor across login and headers.</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-os-border">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-primary mb-4">Platform Logo</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-xl bg-os-surface border border-os-border overflow-hidden flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                  ) : (
                    <Palette size={32} className="text-os-text-muted" />
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 translate-x-2 translate-y-2 rounded-full bg-os-surface-active border border-os-border flex items-center justify-center text-os-text-primary hover:bg-os-surface-active transition-colors shadow-lg cursor-pointer z-10"
                  title="Upload logo"
                >
                  <Camera size={14} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden" 
                />
              </div>
              
              <div className="text-sm text-os-text-secondary">
                <p>Upload a platform logo (recommended PNG/SVG with transparent background).</p>
                <p className="text-xs text-os-text-muted mt-1">Supported formats: PNG, SVG, JPG, WebP. Max size: 2MB.</p>
                {logoUrl && (
                  <button 
                    onClick={() => setLogoUrl(null)}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer block"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>

            {/* Anti-Duplicate Branding Option */}
            <div className="pt-3 border-t border-os-border">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={logoIncludesName}
                  onChange={(e) => setLogoIncludesName(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-os-border bg-os-surface text-blue-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-medium text-os-text-primary block">
                    Logo already includes product name / wordmark
                  </span>
                  <span className="text-[11px] text-os-text-muted block mt-0.5 leading-relaxed">
                    Prevents duplicate branding by hiding accompanying text when displaying the logo (prevents "[LOGO WITH TEXT] Orion-9").
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* CREATOR IDENTITY & ORIGIN MANAGEMENT SECTION */}
        <div className="pt-6 border-t border-os-border">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-primary mb-4">Creator Identity & System Origin</h2>
          <p className="text-xs text-os-text-muted mb-6 leading-relaxed">
            Governed system identity metadata rendered in the About Orion-9 application, founder notes, and system documentation.
          </p>

          <div className="space-y-5">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-os-surface border border-os-border overflow-hidden flex items-center justify-center">
                  {creatorPhotoUrl ? (
                    <img src={creatorPhotoUrl} alt={creatorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center font-bold text-white text-xl">
                      {creatorName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => creatorFileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 translate-x-1 translate-y-1 rounded-full bg-os-surface-active border border-os-border flex items-center justify-center text-os-text-primary hover:bg-os-surface-active transition-colors shadow-lg cursor-pointer z-10"
                  title="Upload creator photo"
                >
                  <Camera size={13} />
                </button>
                <input 
                  type="file" 
                  ref={creatorFileInputRef}
                  onChange={handleCreatorPhotoUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden" 
                />
              </div>

              <div className="text-sm text-os-text-secondary space-y-1">
                <p className="font-medium text-os-text-primary">Creator Identity Photo</p>
                <p className="text-xs text-os-text-muted">Supported formats: PNG, JPG, WebP. Max size: 2MB.</p>
                {creatorPhotoUrl && (
                  <button 
                    type="button"
                    onClick={() => {
                      setCreatorPhotoUrl(null);
                      try {
                        window.dispatchEvent(new CustomEvent('CREATOR_IDENTITY_PHOTO_CHANGED', { detail: { photoUrl: null } }));
                      } catch (err) {}
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer block pt-1"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Creator Name</label>
                <input 
                  type="text" 
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                  placeholder="Ayush Prakash"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Creator Title / Role</label>
                <input 
                  type="text" 
                  value={creatorTitle}
                  onChange={(e) => setCreatorTitle(e.target.value)}
                  className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                  placeholder="Creator & Supply Chain OS Architect"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Creator Core Statement / Quote</label>
              <input 
                type="text" 
                value={creatorQuote}
                onChange={(e) => setCreatorQuote(e.target.value)}
                className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                placeholder="What if the supply chain had an operating system?"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Founder Note & Vision Statement</label>
              <textarea 
                rows={4}
                value={founderNote}
                onChange={(e) => setFounderNote(e.target.value)}
                className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border resize-y font-sans leading-relaxed"
                placeholder="First-person note on why Orion-9 was created..."
              />
            </div>
          </div>
        </div>
        
        <div className="pt-6 border-t border-os-border flex justify-between items-center">
          <button 
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2 text-os-text-muted hover:text-os-text-primary text-sm transition-colors cursor-pointer"
          >
            Reset to Defaults
          </button>
          
          <div className="flex flex-col items-end gap-2">
            <button 
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-os-border-inverse text-os-text-primary-inverse rounded font-medium text-sm hover:opacity-90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isSaved ? (
                <>
                  <Check size={16} className="text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            
            <div className="text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1.5">
              {persistenceState === 'remote' && <><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-emerald-500">Platform saved</span></>}
              {persistenceState === 'local' && <><span className="w-2 h-2 rounded-full bg-amber-500"></span><span className="text-amber-500">Saved locally</span></>}
              {persistenceState === 'error' && <><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-red-500">Storage unavailable</span></>}
              {persistenceState === 'unsaved' && <><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span><span className="text-os-text-muted">Unsaved changes</span></>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

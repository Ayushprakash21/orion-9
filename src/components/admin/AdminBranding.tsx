import React, { useState, useEffect, useRef } from 'react';
import { Palette, Camera, Save, Loader2 } from 'lucide-react';
import { useToast } from '../../store/ToastContext';
import { brandingRepository } from '../../repositories/BrandingRepository';

export const AdminBranding = () => {
  const [appName, setAppName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoIncludesName, setLogoIncludesName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const config = await brandingRepository.getBranding();
        setAppName(config.appName || 'Orion SCM OS');
        setDescription(config.description);
        setLogoUrl(config.logoUrl || null);
        setLogoIncludesName(Boolean(config.logoIncludesName));
      } catch (error) {
        showToast('Failed to load branding configuration', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadBranding();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await brandingRepository.updateBranding({
        appName: appName.trim() || 'Orion SCM OS',
        applicationName: appName.trim() || 'Orion SCM OS',
        description,
        logoUrl,
        logo: logoUrl,
        logoIncludesName,
      });
      showToast('Platform branding settings saved successfully.', 'success');
      
      // Dispatch a custom event so all listening components update immediately
      window.dispatchEvent(new Event('orion-branding-updated'));
    } catch (error) {
      showToast('Failed to save branding settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#6F6F6F]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-sm">Loading branding configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
      <div>
        <h1 className="text-2xl font-light tracking-tight mb-2">Platform Branding</h1>
        <p className="text-sm text-[#A0A0A0]">Customize platform identity, logos, and global nomenclature.</p>
      </div>

      <div className="p-6 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] space-y-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5] mb-4">Core Identity</h2>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-[#6F6F6F] font-semibold">Software Name</label>
              <input 
                type="text" 
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                placeholder="Orion SCM OS"
              />
              <p className="text-[10px] text-[#6F6F6F] mt-1">This name configures the customer-facing platform name throughout the application.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-[#6F6F6F] font-semibold">Short Description</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                placeholder="AI Supply Chain Operating System"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#2A2A2A]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5F5F5] mb-4">Platform Logo</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-xl bg-[#111111] border border-[#2A2A2A] overflow-hidden flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Palette size={32} className="text-[#6F6F6F]" />
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 translate-x-2 translate-y-2 rounded-full bg-[#2A2A2A] border border-[#444444] flex items-center justify-center text-[#F5F5F5] hover:bg-[#333333] transition-colors shadow-lg cursor-pointer z-10"
                  title="Upload logo"
                >
                  <Camera size={14} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden" 
                />
              </div>
              
              <div className="text-sm text-[#A0A0A0]">
                <p>Upload a platform logo (recommended PNG/SVG with transparent background).</p>
                <p className="text-xs text-[#6F6F6F] mt-1">Supported formats: PNG, SVG, JPG. Max size: 2MB.</p>
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
            <div className="pt-3 border-t border-[#222222]">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={logoIncludesName}
                  onChange={(e) => setLogoIncludesName(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#2A2A2A] bg-[#111111] text-blue-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-medium text-[#F5F5F5] block">
                    Logo already includes product name / wordmark
                  </span>
                  <span className="text-[11px] text-[#6F6F6F] block mt-0.5 leading-relaxed">
                    Prevents duplicate branding by hiding accompanying text when displaying the logo (prevents "[LOGO WITH TEXT] Orion SCM OS").
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="pt-6 border-t border-[#2A2A2A] flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-[#F5F5F5] text-[#0A0A0A] rounded font-medium text-sm hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sliders, ShieldCheck, Upload, Sparkles, Image as ImageIcon, 
  Check, Trash2, Lock, Save, RotateCcw, AlertTriangle, Eye 
} from 'lucide-react';
import { 
  WallpaperRecord, 
  WallpaperPolicy, 
  DEFAULT_WALLPAPER_POLICY, 
  WallpaperCandidate, 
  WallpaperStyle 
} from '../../types/wallpaper';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS } from '../../repositories/WallpaperRepository';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { cn } from '../../lib/utils';

export const AdminWallpaperStudio: React.FC = () => {
  const { showToast } = useToast();
  const { hasRole } = useAuth();

  const [policy, setPolicyState] = useState<WallpaperPolicy>({ ...DEFAULT_WALLPAPER_POLICY });
  const [wallpapers, setWallpapers] = useState<WallpaperRecord[]>([]);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Admin AI Generation State
  const [adminPrompt, setAdminPrompt] = useState('Enterprise global logistics supply chain network artwork');
  const [adminStyle, setAdminStyle] = useState<WallpaperStyle>('Space');
  const [isGenerating, setIsGenerating] = useState(false);
  const [adminCandidates, setAdminCandidates] = useState<WallpaperCandidate[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    const loadAdminData = async () => {
      try {
        const pol = await wallpaperRepository.getPolicy();
        const list = await wallpaperRepository.getAvailableWallpapers('global');
        if (mounted) {
          setPolicyState(pol);
          setWallpapers(list);
        }
      } catch (err) {
        console.warn('Failed to load admin wallpaper studio data:', err);
      }
    };

    loadAdminData();
    return () => { mounted = false; };
  }, []);

  const handleSavePolicy = async () => {
    setIsSavingPolicy(true);
    try {
      const updated = await wallpaperRepository.updatePolicy(policy);
      setPolicyState(updated);
      showToast('System Wallpaper Policy updated successfully.', 'success');
    } catch (err: any) {
      showToast('Failed to update policy: ' + err.message, 'error');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const handleSetDefault = async (wallpaperId: string) => {
    try {
      await wallpaperRepository.updatePolicy({ defaultWallpaperId: wallpaperId });
      await wallpaperRepository.resetToSystemDefault('current_user');
      setPolicyState(prev => ({ ...prev, defaultWallpaperId: wallpaperId }));
      showToast('System default wallpaper updated.', 'success');
    } catch (err: any) {
      showToast('Failed to set default wallpaper: ' + err.message, 'error');
    }
  };

  const handleAdminGenerateCandidates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const candidates = await aiWallpaperGenerator.generateCandidates({
        prompt: adminPrompt,
        style: adminStyle,
        atmosphereIntensity: 0.85,
        motionPreference: 'Atmospheric',
      });
      setAdminCandidates(candidates);
      showToast('3 Admin System Wallpapers generated!', 'success');
    } catch (err: any) {
      showToast('AI Generation failed: ' + err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishCandidate = async (candidate: WallpaperCandidate) => {
    try {
      const record: WallpaperRecord = {
        wallpaperId: candidate.candidateId,
        tenantId: 'global',
        ownerType: 'ADMIN',
        ownerId: 'platform_admin',
        name: candidate.name,
        assetUrl: candidate.assetUrl,
        thumbnailUrl: candidate.thumbnailUrl,
        source: 'AI',
        aiGenerated: true,
        prompt: candidate.prompt,
        style: candidate.style,
        width: 2560,
        height: 1440,
        aspectRatio: '16:9',
        motionProfile: candidate.suggestedMotionProfile,
        runtimeReactive: true,
        environment: 'DEMO',
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await wallpaperRepository.saveWallpaper(record);
      setWallpapers(prev => [...prev, record]);
      showToast(`Published "${candidate.name}" to System Gallery.`, 'success');
    } catch (err: any) {
      showToast('Failed to publish candidate: ' + err.message, 'error');
    }
  };

  const handleAdminUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const resultUrl = reader.result as string;
      const record: WallpaperRecord = {
        wallpaperId: `adm_wp_${Date.now()}`,
        tenantId: 'global',
        ownerType: 'ADMIN',
        ownerId: 'platform_admin',
        name: file.name.replace(/\.[^/.]+$/, ''),
        assetUrl: resultUrl,
        thumbnailUrl: resultUrl,
        source: 'UPLOAD',
        aiGenerated: false,
        width: 2560,
        height: 1440,
        aspectRatio: '16:9',
        motionProfile: { backgroundDrift: 0.04, parallax: 0.12, atmosphere: 0.08, particles: 0.04, lightMovement: 0.06, objectMotion: 0.03 },
        runtimeReactive: true,
        environment: 'DEMO',
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await wallpaperRepository.saveWallpaper(record);
      setWallpapers(prev => [...prev, record]);
      showToast('Admin wallpaper uploaded and published.', 'success');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="admin-wallpaper-studio">
      
      {/* Admin Header */}
      <div className="p-5 rounded-2xl bg-[#12151a] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-sky-600/20 border border-purple-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">OS Wallpaper Administration</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage system default wallpapers, approved gallery, and user AI policies.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSavePolicy}
          disabled={isSavingPolicy}
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSavingPolicy ? 'Saving Policy...' : 'Save Policy'}</span>
        </button>
      </div>

      {/* WALLPAPER GOVERNANCE POLICY CONTROLS */}
      <div className="p-5 rounded-2xl bg-[#12151a] border border-white/[0.08] space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">System Wallpaper Policy Controls</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div>
              <div className="text-xs font-medium text-white">Allow User Customization</div>
              <div className="text-[11px] text-slate-400">Permit non-admin users to change wallpaper</div>
            </div>
            <input
              type="checkbox"
              checked={policy.allowUserCustomization}
              onChange={e => setPolicyState(prev => ({ ...prev, allowUserCustomization: e.target.checked }))}
              className="w-4 h-4 accent-sky-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div>
              <div className="text-xs font-medium text-white">Allow AI Generation</div>
              <div className="text-[11px] text-slate-400">Permit users to synthesize wallpapers via AI</div>
            </div>
            <input
              type="checkbox"
              checked={policy.allowAiGeneration}
              onChange={e => setPolicyState(prev => ({ ...prev, allowAiGeneration: e.target.checked }))}
              className="w-4 h-4 accent-sky-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div>
              <div className="text-xs font-medium text-white">Allow Custom Image Upload</div>
              <div className="text-[11px] text-slate-400">Permit uploading local user assets</div>
            </div>
            <input
              type="checkbox"
              checked={policy.allowUserUpload}
              onChange={e => setPolicyState(prev => ({ ...prev, allowUserUpload: e.target.checked }))}
              className="w-4 h-4 accent-sky-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div>
              <div className="text-xs font-medium text-white">Allow Runtime Reactive Engine</div>
              <div className="text-[11px] text-slate-400">Permit live telemetry wallpaper reactivity</div>
            </div>
            <input
              type="checkbox"
              checked={policy.allowRuntimeReactive}
              onChange={e => setPolicyState(prev => ({ ...prev, allowRuntimeReactive: e.target.checked }))}
              className="w-4 h-4 accent-sky-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ADMIN AI WALLPAPER GENERATOR & PUBLISHER */}
      <div className="p-5 rounded-2xl bg-[#12151a] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Admin AI Wallpaper Publisher</h3>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAdminUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-white font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload System Asset</span>
          </button>
        </div>

        <form onSubmit={handleAdminGenerateCandidates} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={adminPrompt}
            onChange={e => setAdminPrompt(e.target.value)}
            placeholder="Enterprise AI wallpaper prompt..."
            className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60"
          />
          <button
            type="submit"
            disabled={isGenerating || !adminPrompt.trim()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Generating...' : 'Generate 3 Candidates'}</span>
          </button>
        </form>

        {adminCandidates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {adminCandidates.map((cand, idx) => (
              <div key={cand.candidateId} className="rounded-xl border border-white/[0.08] overflow-hidden bg-slate-900 p-3 space-y-2">
                <div className="aspect-[16/9] rounded-lg overflow-hidden relative">
                  <img src={cand.thumbnailUrl || cand.assetUrl} alt={cand.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/70 text-white">
                    OPTION {String.fromCharCode(65 + idx)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white font-medium truncate">{cand.name}</span>
                  <button
                    type="button"
                    onClick={() => handlePublishCandidate(cand)}
                    className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold hover:bg-emerald-500/30 cursor-pointer"
                  >
                    Publish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SYSTEM APPROVED GALLERY MANAGER */}
      <div className="p-5 rounded-2xl bg-[#12151a] border border-white/[0.08] space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Approved System Wallpapers</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallpapers.map((wp) => {
            const isDefault = policy.defaultWallpaperId === wp.wallpaperId;
            return (
              <div key={wp.wallpaperId} className="rounded-xl border border-white/[0.08] overflow-hidden bg-slate-950 p-3 space-y-2">
                <div className="aspect-[16/9] rounded-lg overflow-hidden relative bg-slate-900">
                  <img src={wp.thumbnailUrl || wp.assetUrl} alt={wp.name} className="w-full h-full object-cover" />
                  {isDefault && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-sky-500 text-black">
                      SYSTEM DEFAULT
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h4 className="text-xs font-semibold text-white">{wp.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{wp.ownerType} • {wp.source}</span>
                  </div>
                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(wp.wallpaperId)}
                      className="px-2.5 py-1 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10.5px] font-semibold hover:bg-sky-500/25 cursor-pointer"
                    >
                      Make Default
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

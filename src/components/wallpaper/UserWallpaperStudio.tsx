import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Upload, Image as ImageIcon, Check, 
  RotateCcw, RefreshCw, AlertCircle,
  Lock, Monitor
} from 'lucide-react';
import { 
  WallpaperRecord, 
  WallpaperCandidate, 
  WallpaperStyle, 
  QualityTier,
  WallpaperMode
} from '../../types/wallpaper';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS, WallpaperTarget } from '../../repositories/WallpaperRepository';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { cn } from '../../lib/utils';
import { OrionSettingsSplitLayout } from '../settings/OrionSettingsSplitLayout';

export type StudioLifecycleState = 'LOADING' | 'READY' | 'GENERATING' | 'GENERATED' | 'ERROR';

export const UserWallpaperStudio: React.FC = () => {
  const { showToast } = useToast();
  const { currentUser, organization } = useAuth();
  const tenantId = organization?.id || 'global';
  const userId = currentUser?.id || 'default_user';

  // Target Selection State ('login' vs 'desktop') - Strict Isolation
  const [selectedTarget, setSelectedTarget] = useState<WallpaperTarget>('login');

  // Studio Lifecycle State
  const [studioState, setStudioState] = useState<StudioLifecycleState>('LOADING');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Mode Selection
  const [activeTab, setActiveTab] = useState<'GALLERY' | 'UPLOAD' | 'AI'>('GALLERY');
  
  // Available Gallery Wallpapers & Active Wallpaper
  const [galleryWallpapers, setGalleryWallpapers] = useState<WallpaperRecord[]>(SYSTEM_DEFAULT_WALLPAPERS);
  const [activeWallpaper, setActiveWallpaperState] = useState<WallpaperRecord>(SYSTEM_DEFAULT_WALLPAPERS[0]);

  // AI Generator Form & Provider State
  const [aiProviderConfigured, setAiProviderConfigured] = useState<boolean>(false);
  const [aiProviderStatusCode, setAiProviderStatusCode] = useState<string>('READY');
  const [aiProviderName, setAiProviderName] = useState<string>('Google Gemini');
  const [aiModelName, setAiModelName] = useState<string>('gemini-3.1-flash-image');
  const [prompt, setPrompt] = useState('Futuristic deep-space environment with subtle blue and graphite atmosphere');
  const [style, setStyle] = useState<WallpaperStyle>('Space');
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidates, setCandidates] = useState<WallpaperCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<WallpaperCandidate | null>(null);

  // Preview & Selection State (Static Image Only)
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string>(SYSTEM_DEFAULT_WALLPAPERS[0].assetUrl);
  const [selectedName, setSelectedName] = useState<string>(SYSTEM_DEFAULT_WALLPAPERS[0].name);
  const [isApplying, setIsApplying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active wallpaper & gallery on mount or target switch with target-specific isolation
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setStudioState('LOADING');
      try {
        const available = await wallpaperRepository.getAvailableWallpapers(tenantId, userId);
        const active = await wallpaperRepository.getActiveWallpaper(userId, tenantId, selectedTarget);
        const aiStatus = await aiWallpaperGenerator.checkProviderStatus();
        
        if (mounted) {
          setAiProviderConfigured(aiStatus.configured);
          setAiProviderStatusCode(aiStatus.status || aiStatus.error || 'READY');
          setAiProviderName(aiStatus.providerName || 'Google Gemini');
          setAiModelName(aiStatus.model || 'gemini-3.1-flash-image');
          
          const validGallery = available && available.length > 0 ? available : SYSTEM_DEFAULT_WALLPAPERS;
          setGalleryWallpapers(validGallery);
          
          const validActive = (active && active.assetUrl && active.assetUrl.trim() !== '') 
            ? active 
            : (selectedTarget === 'login' ? SYSTEM_DEFAULT_WALLPAPERS[1] : SYSTEM_DEFAULT_WALLPAPERS[0]);
          setActiveWallpaperState(validActive);
          setSelectedAssetUrl(validActive.assetUrl);
          setSelectedName(validActive.name);

          setStudioState('READY');
          setErrorMessage('');
        }
      } catch (err: any) {
        console.warn('Failed to load wallpaper studio data:', err);
        if (mounted) {
          const fallback = selectedTarget === 'login' ? SYSTEM_DEFAULT_WALLPAPERS[1] : SYSTEM_DEFAULT_WALLPAPERS[0];
          setSelectedAssetUrl(fallback.assetUrl);
          setSelectedName(fallback.name);
          setStudioState('READY');
          setErrorMessage('Database connection warning: Using system default environment preview.');
        }
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [tenantId, userId, selectedTarget]);

  // Handle Switching between LOGIN WALLPAPER and HOME / DESKTOP WALLPAPER targets
  const handleTargetSwitch = async (target: WallpaperTarget) => {
    if (target === selectedTarget) return;
    setSelectedTarget(target);
    try {
      const active = await wallpaperRepository.getActiveWallpaper(userId, tenantId, target);
      const fallback = target === 'login' ? SYSTEM_DEFAULT_WALLPAPERS[1] : SYSTEM_DEFAULT_WALLPAPERS[0];
      const validActive = (active && active.assetUrl && active.assetUrl.trim() !== '') ? active : fallback;
      setActiveWallpaperState(validActive);
      setSelectedAssetUrl(validActive.assetUrl);
      setSelectedName(validActive.name);
    } catch (e) {
      const fallback = target === 'login' ? SYSTEM_DEFAULT_WALLPAPERS[1] : SYSTEM_DEFAULT_WALLPAPERS[0];
      setSelectedAssetUrl(fallback.assetUrl);
      setSelectedName(fallback.name);
    }
  };

  // AI Generation Handler
  const handleGenerateAiCandidates = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt || !prompt.trim()) {
      showToast('Please enter a prompt for AI wallpaper generation.', 'error');
      return;
    }

    setIsGenerating(true);
    setStudioState('GENERATING');
    try {
      const generated = await aiWallpaperGenerator.generateCandidates({
        prompt,
        style,
        width: 2560,
        height: 1440,
      });

      setCandidates(generated);
      if (generated.length > 0) {
        handleSelectCandidate(generated[0]);
      }
      setStudioState('GENERATED');
      showToast('3 AI Wallpaper candidates generated!', 'success');
    } catch (err: any) {
      setStudioState('ERROR');
      setErrorMessage(err.message || 'AI wallpaper generation failed');
      showToast(err.message || 'AI generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Candidate Selection Handler
  const handleSelectCandidate = (candidate: WallpaperCandidate) => {
    setSelectedCandidate(candidate);
    setSelectedAssetUrl(candidate.assetUrl);
    setSelectedName(candidate.name);
  };

  // Image File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        showToast('Image file size must be 15 MB or smaller.', 'error');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setSelectedAssetUrl(dataUrl);
        setSelectedName(file.name.replace(/\.[^/.]+$/, ""));
        setSelectedCandidate(null);
        showToast('Custom image loaded into wallpaper studio.', 'info');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Apply Wallpaper Action (Persists selection to active target environment)
  const handleApplyWallpaper = async () => {
    if (!selectedAssetUrl) return;
    setIsApplying(true);
    try {
      const currentEnv = dbManager.getEnvironment();
      
      const wpRecord: WallpaperRecord = {
        wallpaperId: selectedCandidate?.candidateId || `wp_${Date.now()}`,
        tenantId,
        ownerType: 'USER',
        ownerId: userId,
        name: selectedName || 'Custom Wallpaper',
        assetUrl: selectedAssetUrl,
        thumbnailUrl: selectedAssetUrl,
        source: selectedCandidate ? 'AI' : activeTab === 'UPLOAD' ? 'UPLOAD' : 'SYSTEM',
        aiGenerated: !!selectedCandidate,
        prompt: selectedCandidate?.prompt || prompt,
        style: selectedCandidate?.style || style,
        width: 2560,
        height: 1440,
        aspectRatio: '16:9',
        mode: 'STILL',
        environment: currentEnv,
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await wallpaperRepository.saveWallpaper(wpRecord);
      await wallpaperRepository.setActiveWallpaper(wpRecord.wallpaperId, userId, selectedTarget);
      setActiveWallpaperState(wpRecord);
      const targetLabel = selectedTarget === 'login' ? 'Login Wallpaper' : 'Home / Desktop Wallpaper';
      showToast(`Static wallpaper applied to Orion ${targetLabel}!`, 'success');
    } catch (err: any) {
      showToast('Failed to apply wallpaper: ' + err.message, 'error');
    } finally {
      setIsApplying(false);
    }
  };

  // Reset to System Default Action for selectedTarget
  const handleResetDefault = async () => {
    try {
      const sysDefault = await wallpaperRepository.resetToSystemDefault(userId, selectedTarget);
      setActiveWallpaperState(sysDefault);
      setSelectedAssetUrl(sysDefault.assetUrl);
      setSelectedName(sysDefault.name);
      setStudioState('READY');
      setErrorMessage('');
      const targetLabel = selectedTarget === 'login' ? 'Login default' : 'Home / Desktop default';
      showToast(`Wallpaper reset to ${targetLabel}.`, 'info');
    } catch (err: any) {
      const fallback = selectedTarget === 'login' ? SYSTEM_DEFAULT_WALLPAPERS[1] : SYSTEM_DEFAULT_WALLPAPERS[0];
      setSelectedAssetUrl(fallback.assetUrl);
      setSelectedName(fallback.name);
      showToast('Wallpaper reset to system default.', 'info');
    }
  };

  // Primary Control Pane Content
  const primaryPane = (
    <div className="space-y-5" data-testid="user-wallpaper-studio">
      {/* Target Selector: LOGIN WALLPAPER vs HOME / DESKTOP */}
      <div className="p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-1 select-none">
        <button
          type="button"
          onClick={() => handleTargetSwitch('login')}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2",
            selectedTarget === 'login'
              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>LOGIN WALLPAPER</span>
        </button>
        <button
          type="button"
          onClick={() => handleTargetSwitch('desktop')}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2",
            selectedTarget === 'desktop'
              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>HOME / DESKTOP</span>
        </button>
      </div>

      {/* Target Context Info Banner */}
      <div className="px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] flex items-center justify-between">
        <span className="font-mono">Selected target: <strong className="text-white uppercase font-sans tracking-wide">{selectedTarget === 'login' ? 'LOGIN WALLPAPER' : 'HOME / DESKTOP'}</strong></span>
        <span className="text-[10px] text-slate-400 font-mono">Independent Isolation</span>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Reset
          </button>
        </div>
      )}

      {/* Main Studio Navigation Tabs */}
      <div className="flex border-b border-white/[0.08] text-xs font-medium text-slate-400 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('GALLERY')}
          className={cn(
            "pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer",
            activeTab === 'GALLERY' ? "border-sky-400 text-sky-400 font-semibold" : "border-transparent hover:text-white"
          )}
        >
          <ImageIcon className="w-4 h-4" />
          <span>System Gallery</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AI')}
          className={cn(
            "pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer",
            activeTab === 'AI' ? "border-sky-400 text-sky-400 font-semibold" : "border-transparent hover:text-white"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Create with AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UPLOAD')}
          className={cn(
            "pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer",
            activeTab === 'UPLOAD' ? "border-sky-400 text-sky-400 font-semibold" : "border-transparent hover:text-white"
          )}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM GALLERY */}
      {activeTab === 'GALLERY' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {galleryWallpapers.map((wp) => {
            const isSelected = selectedAssetUrl === wp.assetUrl;
            return (
              <div
                key={wp.wallpaperId}
                onClick={() => {
                  setSelectedAssetUrl(wp.assetUrl);
                  setSelectedName(wp.name);
                  setSelectedCandidate(null);
                }}
                className={cn(
                  "group relative rounded-xl border overflow-hidden cursor-pointer transition-all bg-[#12151a]",
                  isSelected 
                    ? "border-sky-400 ring-2 ring-sky-400/30 shadow-xl" 
                    : "border-white/[0.08] hover:border-white/20"
                )}
              >
                <div className="aspect-[16/9] overflow-hidden bg-slate-900 relative">
                  <img 
                    src={wp.thumbnailUrl || wp.assetUrl} 
                    alt={wp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 bg-sky-500 text-black p-1 rounded-full shadow-lg">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">{wp.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{wp.source} • 2560×1440</span>
                  </div>
                  {wp.isSystemDefault && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      DEFAULT
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: CREATE WITH AI */}
      {activeTab === 'AI' && (
        <div className="space-y-4">
          <div className={cn(
            "p-3.5 rounded-xl border text-xs space-y-1",
            aiProviderConfigured || aiProviderStatusCode === 'READY'
              ? "bg-sky-500/10 border-sky-500/20 text-slate-300"
              : "bg-slate-500/10 border-slate-500/20 text-slate-300"
          )}>
            <div className="flex items-center gap-2 font-semibold text-sky-400">
              <Sparkles className="w-4 h-4" />
              <span>AI Provider: {aiProviderName}</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md font-mono uppercase bg-white/10">
                {aiProviderStatusCode}
              </span>
            </div>
            <p className="text-[11px] opacity-80">
              {aiProviderStatusCode === 'READY' && 'Google Gemini (gemini-3.1-flash-image) is ready for primary generation.'}
              {aiProviderStatusCode === 'GEMINI_CONFIGURED' && 'Google Gemini API is configured and ready for generation.'}
              {aiProviderStatusCode === 'GEMINI_SECRET_MISSING' && 'GEMINI_API_KEY environment variable is not configured.'}
              {aiProviderStatusCode === 'BACKEND_UNREACHABLE' && 'Unable to reach backend server endpoint.'}
            </p>
          </div>

          <form onSubmit={handleGenerateAiCandidates} className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Wallpaper Prompt</label>
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Futuristic deep-space environment with subtle blue nebulae..."
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Style Preset</label>
              <div className="flex flex-wrap gap-2">
                {(['Aurora', 'Space', 'Nature', 'Abstract', 'Custom'] as WallpaperStyle[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStyle(st)}
                    className={cn(
                      "px-3 py-1 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                      style === st 
                        ? "bg-sky-500/15 border-sky-500/40 text-sky-400 font-semibold" 
                        : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing 3 Candidate Wallpapers...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate 3 Wallpapers (2560×1440)</span>
                </>
              )}
            </button>
          </form>

          {candidates.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Select AI Candidate Wallpaper</h3>
              <div className="grid grid-cols-3 gap-2.5">
                {candidates.map((cand) => {
                  const isSelected = selectedCandidate?.candidateId === cand.candidateId;
                  return (
                    <div
                      key={cand.candidateId}
                      onClick={() => handleSelectCandidate(cand)}
                      className={cn(
                        "group relative rounded-xl border overflow-hidden cursor-pointer transition-all bg-[#12151a]",
                        isSelected 
                          ? "border-sky-400 ring-2 ring-sky-400/30 shadow-xl" 
                          : "border-white/[0.08] hover:border-white/20"
                      )}
                    >
                      <div className="aspect-[16/9] overflow-hidden bg-slate-900 relative">
                        <img 
                          src={cand.thumbnailUrl || cand.assetUrl} 
                          alt={cand.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-sky-500 text-black p-1 rounded-full shadow-lg">
                            <Check className="w-3 h-3 font-bold" />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <h4 className="text-[11px] font-semibold text-white truncate">{cand.name}</h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: UPLOAD IMAGE */}
      {activeTab === 'UPLOAD' && (
        <div className="p-6 rounded-xl bg-[#12151a] border border-white/[0.08] border-dashed text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-sky-400">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Upload Custom Wallpaper Image</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">PNG, JPG, or WebP. Optimal 16:9 ratio (2560×1440).</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-sky-500/20"
          >
            Browse Image File
          </button>
        </div>
      )}

      {/* Action Footer: Reset Default & Apply Wallpaper */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] flex items-center justify-between">
        <button
          type="button"
          onClick={handleResetDefault}
          className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default</span>
        </button>

        <button
          type="button"
          onClick={handleApplyWallpaper}
          disabled={isApplying || !selectedAssetUrl}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-500/20 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{isApplying ? 'Applying...' : 'Apply Wallpaper'}</span>
        </button>
      </div>
    </div>
  );

  // Secondary Preview & Status Pane Content (STATIC PREVIEW)
  const secondaryPane = (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          WALLPAPER PREVIEW
        </span>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
          STATIC 16:9 PREVIEW
        </span>
      </div>

      {/* Static Wallpaper Preview Box */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-2xl shrink-0">
        <img
          src={selectedAssetUrl}
          alt={selectedName}
          className="w-full h-full object-cover"
        />
        {/* Subtle CSS Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>{selectedName}</span>
        </div>
      </div>

      {/* Wallpaper Metadata & Target Context Panel */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center text-slate-400 border-b border-white/[0.06] pb-2">
          <span className="text-[10px] uppercase tracking-wider">Target Destination</span>
          <span className="text-sky-400 font-semibold">{selectedTarget === 'login' ? 'LOGIN SCREEN' : 'HOME / DESKTOP'}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Mode</span>
            <span className="text-white font-medium">STATIC (STILL)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Source</span>
            <span className="text-sky-300 font-semibold">
              {selectedCandidate ? 'AI GENERATED' : activeTab === 'UPLOAD' ? 'USER UPLOAD' : 'SYSTEM GALLERY'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Resolution</span>
            <span className="text-slate-300">2560 × 1440 (16:9)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Environment</span>
            <span className="text-slate-300">{dbManager.getEnvironment()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <OrionSettingsSplitLayout
      title="Wallpaper Studio"
      subtitle="Static 16:9 desktop and login wallpapers with AI generation and upload"
      badge="STATIC"
      primary={primaryPane}
      secondary={secondaryPane}
    />
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Upload, Image as ImageIcon, Sliders, Check, 
  RotateCcw, RefreshCw, AlertCircle, Play, Pause, Activity
} from 'lucide-react';
import { 
  WallpaperRecord, 
  WallpaperCandidate, 
  WallpaperStyle, 
  MotionProfile, 
  DEFAULT_MOTION_PROFILE,
  QualityTier
} from '../../types/wallpaper';
import { wallpaperRepository, SYSTEM_DEFAULT_WALLPAPERS } from '../../repositories/WallpaperRepository';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';
import { sceneAnalyzer } from '../../services/wallpaper/SceneAnalyzer';
import { OrionLiveWallpaper } from '../../os/components/OrionLiveWallpaper';
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
  const [aiProviderStatusCode, setAiProviderStatusCode] = useState<string>('GEMINI_CONFIGURED');
  const [aiProviderName, setAiProviderName] = useState<string>('Google Gemini / Nano Banana');
  const [prompt, setPrompt] = useState('Futuristic deep-space environment with subtle blue and graphite atmosphere');
  const [style, setStyle] = useState<WallpaperStyle>('Space');
  const [atmosphereIntensity, setAtmosphereIntensity] = useState(0.8);
  const [motionPref, setMotionPref] = useState<'Subtle' | 'Atmospheric' | 'Dynamic'>('Atmospheric');
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidates, setCandidates] = useState<WallpaperCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<WallpaperCandidate | null>(null);

  // Live Setup & Preview Parameters (Guaranteed non-blank initialization)
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string>(SYSTEM_DEFAULT_WALLPAPERS[0].assetUrl);
  const [selectedName, setSelectedName] = useState<string>(SYSTEM_DEFAULT_WALLPAPERS[0].name);
  const [motionPreviewOn, setMotionPreviewOn] = useState(true);
  const [motionProfile, setMotionProfile] = useState<MotionProfile>({ ...DEFAULT_MOTION_PROFILE });
  const [runtimeReactive, setRuntimeReactive] = useState(true);
  const [quality, setQuality] = useState<QualityTier>('MEDIUM');
  const [isApplying, setIsApplying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active wallpaper & gallery on mount with guaranteed non-blank recovery
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setStudioState('LOADING');
      try {
        const available = await wallpaperRepository.getAvailableWallpapers(tenantId, userId);
        const active = await wallpaperRepository.getActiveWallpaper(userId, tenantId);
        const aiStatus = await aiWallpaperGenerator.checkProviderStatus();
        
        if (mounted) {
          setAiProviderConfigured(aiStatus.configured);
          setAiProviderStatusCode(aiStatus.status || aiStatus.error || 'GEMINI_CONFIGURED');
          setAiProviderName(aiStatus.providerName);
          
          const validGallery = available && available.length > 0 ? available : SYSTEM_DEFAULT_WALLPAPERS;
          setGalleryWallpapers(validGallery);
          
          const validActive = (active && active.assetUrl && active.assetUrl.trim() !== '') ? active : SYSTEM_DEFAULT_WALLPAPERS[0];
          setActiveWallpaperState(validActive);
          setSelectedAssetUrl(validActive.assetUrl);
          setSelectedName(validActive.name);
          setMotionProfile(validActive.motionProfile || { ...DEFAULT_MOTION_PROFILE });
          setRuntimeReactive(validActive.runtimeReactive);
          setStudioState('READY');
          setErrorMessage('');
        }
      } catch (err: any) {
        console.warn('Failed to load wallpaper studio data:', err);
        if (mounted) {
          setSelectedAssetUrl(SYSTEM_DEFAULT_WALLPAPERS[0].assetUrl);
          setSelectedName(SYSTEM_DEFAULT_WALLPAPERS[0].name);
          setMotionProfile(SYSTEM_DEFAULT_WALLPAPERS[0].motionProfile);
          setStudioState('READY');
          setErrorMessage('Database connection warning: Using system default desktop environment preview.');
        }
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [tenantId, userId]);

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
        atmosphereIntensity,
        motionPreference: motionPref,
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

    const analysis = sceneAnalyzer.analyzeScene({
      style: candidate.style,
      prompt: candidate.prompt,
      atmosphereIntensity,
    });
    setMotionProfile(analysis.recommendedProfile);
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
        showToast('Custom image loaded into live wallpaper studio.', 'info');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Apply Wallpaper Action
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
        motionProfile,
        runtimeReactive,
        environment: currentEnv,
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await wallpaperRepository.saveWallpaper(wpRecord);
      await wallpaperRepository.setActiveWallpaper(wpRecord.wallpaperId, userId);
      setActiveWallpaperState(wpRecord);
      showToast('Live Wallpaper applied to Orion Desktop!', 'success');
    } catch (err: any) {
      showToast('Failed to apply wallpaper: ' + err.message, 'error');
    } finally {
      setIsApplying(false);
    }
  };

  // Reset to System Default Action
  const handleResetDefault = async () => {
    try {
      const sysDefault = await wallpaperRepository.resetToSystemDefault(userId);
      setActiveWallpaperState(sysDefault);
      setSelectedAssetUrl(sysDefault.assetUrl);
      setSelectedName(sysDefault.name);
      setMotionProfile(sysDefault.motionProfile);
      setRuntimeReactive(sysDefault.runtimeReactive);
      setStudioState('READY');
      setErrorMessage('');
      showToast('Wallpaper reset to system default.', 'info');
    } catch (err: any) {
      setSelectedAssetUrl(SYSTEM_DEFAULT_WALLPAPERS[0].assetUrl);
      setSelectedName(SYSTEM_DEFAULT_WALLPAPERS[0].name);
      setMotionProfile(SYSTEM_DEFAULT_WALLPAPERS[0].motionProfile);
      showToast('Wallpaper reset to primary system default.', 'info');
    }
  };

  // Primary Control Pane Content
  const primaryPane = (
    <div className="space-y-5" data-testid="user-wallpaper-studio">
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
                  setMotionProfile(wp.motionProfile);
                  setRuntimeReactive(wp.runtimeReactive);
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
            aiProviderConfigured
              ? "bg-sky-500/10 border-sky-500/20 text-slate-300"
              : aiProviderStatusCode === 'GEMINI_SECRET_MISSING'
              ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
              : aiProviderStatusCode === 'GEMINI_AUTH_ERROR'
              ? "bg-red-500/10 border-red-500/20 text-red-200"
              : aiProviderStatusCode === 'GEMINI_RATE_LIMIT'
              ? "bg-purple-500/10 border-purple-500/20 text-purple-200"
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
              {aiProviderStatusCode === 'GEMINI_CONFIGURED' && 'Google Gemini API is configured and ready for generation.'}
              {aiProviderStatusCode === 'GEMINI_SECRET_MISSING' && 'GEMINI_API_KEY environment variable is not configured on the server.'}
              {aiProviderStatusCode === 'GEMINI_AUTH_ERROR' && 'Gemini API authentication failed. Please verify server credentials.'}
              {aiProviderStatusCode === 'GEMINI_RATE_LIMIT' && 'Gemini API quota or rate limit reached. Generation will retry when quota resets.'}
              {aiProviderStatusCode === 'GEMINI_API_UNAVAILABLE' && 'Google Gemini API service is temporarily unavailable.'}
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
                {candidates.map((cand, idx) => {
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

      {/* Action Buttons & Motion Profile Sliders */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Motion Controls</span>
          </div>
          <button
            type="button"
            onClick={() => setRuntimeReactive(!runtimeReactive)}
            className={cn(
              "px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              runtimeReactive 
                ? "bg-sky-500/15 border-sky-500/40 text-sky-400" 
                : "bg-white/[0.03] border-white/[0.08] text-slate-400"
            )}
          >
            <Activity className="w-3 h-3" />
            <span>Reactive: {runtimeReactive ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300">Parallax</span>
              <span className="text-[11px] font-mono text-sky-400">{Math.round(motionProfile.parallax * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.30"
              step="0.01"
              value={motionProfile.parallax}
              onChange={e => setMotionProfile(prev => ({ ...prev, parallax: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300">Glow</span>
              <span className="text-[11px] font-mono text-sky-400">{Math.round(motionProfile.atmosphere * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.25"
              step="0.01"
              value={motionProfile.atmosphere}
              onChange={e => setMotionProfile(prev => ({ ...prev, atmosphere: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300">Particles</span>
              <span className="text-[11px] font-mono text-sky-400">{Math.round(motionProfile.particles * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.25"
              step="0.01"
              value={motionProfile.particles}
              onChange={e => setMotionProfile(prev => ({ ...prev, particles: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
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
    </div>
  );

  // Secondary Preview & Status Pane Content (DOMINANT LIVE PREVIEW)
  const secondaryPane = (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          LIVE WALLPAPER PREVIEW
        </span>
        <button
          type="button"
          onClick={() => setMotionPreviewOn(!motionPreviewOn)}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer border",
            motionPreviewOn 
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" 
              : "bg-white/[0.05] text-slate-400 border-white/10"
          )}
        >
          {motionPreviewOn ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>Motion: {motionPreviewOn ? 'ACTIVE' : 'PAUSED'}</span>
        </button>
      </div>

      {/* Dominant Live Wallpaper Renderer Box */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-2xl shrink-0">
        <OrionLiveWallpaper
          hasOpenWindows={false}
          showLogo={false}
          overrideWallpaper={{
            wallpaperId: 'preview-wp',
            tenantId,
            ownerType: 'USER',
            ownerId: userId,
            name: selectedName,
            assetUrl: selectedAssetUrl,
            source: selectedCandidate ? 'AI' : 'UPLOAD',
            aiGenerated: !!selectedCandidate,
            width: 2560,
            height: 1440,
            aspectRatio: '16:9',
            motionProfile: motionPreviewOn ? motionProfile : { backgroundDrift: 0, parallax: 0, atmosphere: 0, particles: 0, lightMovement: 0, objectMotion: 0 },
            runtimeReactive,
            environment: dbManager.getEnvironment(),
            status: 'APPROVED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
          overrideMotionProfile={motionPreviewOn ? motionProfile : { backgroundDrift: 0, parallax: 0, atmosphere: 0, particles: 0, lightMovement: 0, objectMotion: 0 }}
          overrideRuntimeReactive={runtimeReactive}
          quality={quality}
        />

        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{selectedName}</span>
        </div>
      </div>

      {/* Live Runtime & Environment Telemetry Panel */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center text-slate-400 border-b border-white/[0.06] pb-2">
          <span className="text-[10px] uppercase tracking-wider">Live Engine Status</span>
          <span className="text-emerald-400 font-semibold">{motionPreviewOn ? 'RENDERING 60 FPS' : 'PAUSED'}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Environment</span>
            <span className="text-white font-medium">{dbManager.getEnvironment()}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Runtime Reactive</span>
            <span className={runtimeReactive ? "text-sky-400 font-semibold" : "text-slate-400"}>
              {runtimeReactive ? "ENABLED" : "DISABLED"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Resolution</span>
            <span className="text-slate-300">2560 × 1440 (16:9)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Quality Tier</span>
            <span className="text-slate-300">{quality}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-slate-400 text-[10px]">Render Quality Preset</span>
          <div className="flex items-center gap-1.5">
            {(['LOW', 'MEDIUM', 'HIGH'] as QualityTier[]).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(q)}
                className={cn(
                  "px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-all cursor-pointer",
                  quality === q 
                    ? "bg-white/10 border-white/20 text-white font-bold" 
                    : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <OrionSettingsSplitLayout
      title="Wallpaper Studio"
      subtitle="AI-generated & user-configurable 16:9 Live Desktop Environment"
      badge="LIVE ENGINE"
      primary={primaryPane}
      secondary={secondaryPane}
    />
  );
};

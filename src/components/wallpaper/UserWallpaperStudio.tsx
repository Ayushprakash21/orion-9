import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Upload, Image as ImageIcon, Sliders, Check, 
  RotateCcw, RefreshCw, Eye, Shield, Play, Pause, Activity
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
import { cn } from '../../lib/utils';

export const UserWallpaperStudio: React.FC = () => {
  const { showToast } = useToast();

  // Mode Selection
  const [activeTab, setActiveTab] = useState<'GALLERY' | 'UPLOAD' | 'AI'>('GALLERY');
  
  // Available Gallery Wallpapers
  const [galleryWallpapers, setGalleryWallpapers] = useState<WallpaperRecord[]>([]);
  const [activeWallpaper, setActiveWallpaperState] = useState<WallpaperRecord | null>(null);

  // AI Generator Form State
  const [prompt, setPrompt] = useState('Futuristic deep-space environment with subtle blue and graphite atmosphere');
  const [style, setStyle] = useState<WallpaperStyle>('Space');
  const [atmosphereIntensity, setAtmosphereIntensity] = useState(0.8);
  const [motionPref, setMotionPref] = useState<'Subtle' | 'Atmospheric' | 'Dynamic'>('Atmospheric');
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidates, setCandidates] = useState<WallpaperCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<WallpaperCandidate | null>(null);

  // Live Setup & Preview Parameters
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('Custom Wallpaper');
  const [motionPreviewOn, setMotionPreviewOn] = useState(true);
  const [motionProfile, setMotionProfile] = useState<MotionProfile>({ ...DEFAULT_MOTION_PROFILE });
  const [runtimeReactive, setRuntimeReactive] = useState(true);
  const [quality, setQuality] = useState<QualityTier>('MEDIUM');
  const [isApplying, setIsApplying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active wallpaper & gallery on mount
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const available = await wallpaperRepository.getAvailableWallpapers();
        const active = await wallpaperRepository.getActiveWallpaper();
        
        if (mounted) {
          setGalleryWallpapers(available);
          setActiveWallpaperState(active);
          setSelectedAssetUrl(active.assetUrl);
          setSelectedName(active.name);
          setMotionProfile(active.motionProfile || { ...DEFAULT_MOTION_PROFILE });
          setRuntimeReactive(active.runtimeReactive);
        }
      } catch (err) {
        console.warn('Failed to load wallpaper studio data:', err);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  // AI Generation Handler (Produces exactly 3 candidate wallpapers)
  const handleGenerateAiCandidates = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt || !prompt.trim()) {
      showToast('Please enter a prompt for AI wallpaper generation.', 'error');
      return;
    }

    setIsGenerating(true);
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
      showToast('3 AI Wallpaper candidates generated!', 'success');
    } catch (err: any) {
      showToast('AI generation failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Candidate Selection Handler
  const handleSelectCandidate = (candidate: WallpaperCandidate) => {
    setSelectedCandidate(candidate);
    setSelectedAssetUrl(candidate.assetUrl);
    setSelectedName(candidate.name);

    // AI Scene Analysis for Motion Profile
    const analysis = sceneAnalyzer.analyzeScene({
      style: candidate.style,
      prompt: candidate.prompt,
      atmosphereIntensity,
    });

    setMotionProfile(analysis.recommendedProfile);
  };

  // Image Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Wallpaper image must be 10MB or smaller.', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultUrl = reader.result as string;
      setSelectedAssetUrl(resultUrl);
      setSelectedName(file.name.replace(/\.[^/.]+$/, ''));
      setSelectedCandidate(null);

      // Analyze uploaded image scene
      const analysis = sceneAnalyzer.analyzeScene({
        style: 'Custom',
        prompt: file.name,
      });
      setMotionProfile(analysis.recommendedProfile);
      showToast('Image uploaded and analyzed successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Apply Wallpaper Action
  const handleApplyWallpaper = async () => {
    setIsApplying(true);
    try {
      const timestamp = Date.now();
      const wpRecord: WallpaperRecord = {
        wallpaperId: selectedCandidate ? selectedCandidate.candidateId : `wp_${timestamp}`,
        tenantId: 'global',
        ownerType: 'USER',
        ownerId: 'current_user',
        name: selectedName || 'Custom Live Wallpaper',
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
        environment: 'DEMO',
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await wallpaperRepository.saveWallpaper(wpRecord);
      await wallpaperRepository.setActiveWallpaper(wpRecord.wallpaperId);
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
      const sysDefault = await wallpaperRepository.resetToSystemDefault();
      setActiveWallpaperState(sysDefault);
      setSelectedAssetUrl(sysDefault.assetUrl);
      setSelectedName(sysDefault.name);
      setMotionProfile(sysDefault.motionProfile);
      setRuntimeReactive(sysDefault.runtimeReactive);
      showToast('Wallpaper reset to system default.', 'info');
    } catch (err: any) {
      showToast('Failed to reset wallpaper: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="user-wallpaper-studio">
      
      {/* Studio Header Banner */}
      <div className="p-5 rounded-2xl bg-[#12151a] border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/30 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-sky-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Orion Wallpaper Studio</h2>
            <p className="text-xs text-slate-400 mt-0.5">AI-generated & user-configurable 16:9 Live Desktop Environment.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  "group relative rounded-2xl border overflow-hidden cursor-pointer transition-all bg-[#12151a]",
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
                    <div className="absolute top-3 right-3 bg-sky-500 text-black p-1 rounded-full shadow-lg">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                  )}
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">{wp.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{wp.source} • 2560x1440</span>
                  </div>
                  {wp.isSystemDefault && (
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      DEFAULT
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: CREATE WITH AI (Generates exactly 3 Candidates) */}
      {activeTab === 'AI' && (
        <div className="space-y-6">
          <form onSubmit={handleGenerateAiCandidates} className="p-5 rounded-2xl bg-[#12151a] border border-white/[0.08] space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Wallpaper Prompt</label>
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Futuristic deep-space environment with subtle blue nebulae..."
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60 font-medium"
              />
            </div>

            {/* Style Pills */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Style Preset</label>
              <div className="flex flex-wrap gap-2">
                {(['Aurora', 'Space', 'Nature', 'Abstract', 'Custom'] as WallpaperStyle[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStyle(st)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer",
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

            {/* Atmosphere Slider & Motion Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-300">Atmosphere Density</span>
                  <span className="text-xs font-mono text-sky-400">{Math.round(atmosphereIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={atmosphereIntensity}
                  onChange={e => setAtmosphereIntensity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Motion Preference</label>
                <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 gap-1">
                  {(['Subtle', 'Atmospheric', 'Dynamic'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMotionPref(m)}
                      className={cn(
                        "flex-1 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer text-center",
                        motionPref === m ? "bg-sky-500/20 text-sky-400 font-semibold" : "text-slate-400 hover:text-white"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50 mt-2"
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

          {/* 3 AI Candidate Cards Presentation */}
          {candidates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Select AI Candidate Wallpaper</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {candidates.map((cand, idx) => {
                  const isSelected = selectedCandidate?.candidateId === cand.candidateId;
                  return (
                    <div
                      key={cand.candidateId}
                      onClick={() => handleSelectCandidate(cand)}
                      className={cn(
                        "group relative rounded-2xl border overflow-hidden cursor-pointer transition-all bg-[#12151a]",
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
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md text-white border border-white/10">
                          IMAGE {String.fromCharCode(65 + idx)}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 bg-sky-500 text-black p-1 rounded-full shadow-lg">
                            <Check className="w-3.5 h-3.5 font-bold" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">{cand.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">2560×1440 • {cand.style}</span>
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
        <div className="p-8 rounded-2xl bg-[#12151a] border border-white/[0.08] border-dashed text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-sky-400">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Upload Custom Wallpaper Image</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">Supports PNG, JPG, or WebP. Optimal 16:9 desktop aspect ratio (2560×1440 or 1920×1080).</p>
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
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-sky-500/20"
          >
            Browse Image File
          </button>
        </div>
      )}

      {/* LIVE WALLPAPER SETUP & MOTION PREVIEW PANEL */}
      {selectedAssetUrl && (
        <div className="p-5 rounded-2xl bg-[#12151a] border border-white/[0.08] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Live Wallpaper Engine Setup</h3>
            </div>
            
            <button
              type="button"
              onClick={() => setMotionPreviewOn(!motionPreviewOn)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border",
                motionPreviewOn 
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" 
                  : "bg-white/[0.05] text-slate-400 border-white/10"
              )}
            >
              {motionPreviewOn ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>Motion Preview: {motionPreviewOn ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Interactive Live Wallpaper Preview Canvas Frame */}
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl">
            <OrionLiveWallpaper
              hasOpenWindows={false}
              showLogo={false}
              overrideWallpaper={{
                wallpaperId: 'preview-wp',
                tenantId: 'global',
                ownerType: 'USER',
                ownerId: 'current_user',
                name: selectedName,
                assetUrl: selectedAssetUrl,
                source: selectedCandidate ? 'AI' : 'UPLOAD',
                aiGenerated: !!selectedCandidate,
                width: 2560,
                height: 1440,
                aspectRatio: '16:9',
                motionProfile: motionPreviewOn ? motionProfile : { backgroundDrift: 0, parallax: 0, atmosphere: 0, particles: 0, lightMovement: 0, objectMotion: 0 },
                runtimeReactive,
                environment: 'DEMO',
                status: 'APPROVED',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }}
              overrideMotionProfile={motionPreviewOn ? motionProfile : { backgroundDrift: 0, parallax: 0, atmosphere: 0, particles: 0, lightMovement: 0, objectMotion: 0 }}
              overrideRuntimeReactive={runtimeReactive}
              quality={quality}
            />
          </div>

          {/* Motion Profile Sliders & Config Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
            {/* Depth / Parallax Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-300">Depth / Parallax</span>
                <span className="text-xs font-mono text-sky-400">{Math.round(motionProfile.parallax * 100)}%</span>
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

            {/* Atmosphere Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-300">Atmosphere Glow</span>
                <span className="text-xs font-mono text-sky-400">{Math.round(motionProfile.atmosphere * 100)}%</span>
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

            {/* Particles Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-300">Particles Shimmer</span>
                <span className="text-xs font-mono text-sky-400">{Math.round(motionProfile.particles * 100)}%</span>
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

          {/* Runtime Reactive & Quality Tier Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRuntimeReactive(!runtimeReactive)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
                  runtimeReactive 
                    ? "bg-sky-500/15 border-sky-500/40 text-sky-400 shadow-sm" 
                    : "bg-white/[0.03] border-white/[0.08] text-slate-400"
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Runtime Reactive: {runtimeReactive ? 'ON' : 'OFF'}</span>
              </button>
              <span className="text-[11px] text-slate-400">Responds to real Orion runtime events</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Quality:</span>
              {(['LOW', 'MEDIUM', 'HIGH'] as QualityTier[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer",
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
      )}
    </div>
  );
};

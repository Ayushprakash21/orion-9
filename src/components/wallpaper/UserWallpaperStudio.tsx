import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Upload, Image as ImageIcon, Check, 
  RotateCcw, RefreshCw, AlertCircle,
  Lock, Monitor, Trash2
} from 'lucide-react';
import { 
  WallpaperRecord, 
  WallpaperCandidate, 
  WallpaperStyle, 
  QualityTier,
  WallpaperMode
} from '../../types/wallpaper';
import { 
  wallpaperRepository, 
  SYSTEM_DEFAULT_WALLPAPERS, 
  DEFAULT_DESKTOP_WALLPAPER,
  DEFAULT_LIGHT_DESKTOP_WALLPAPER,
  DEFAULT_LOGIN_WALLPAPER,
  WallpaperTarget,
  resolveRuntimeWallpaper
} from '../../repositories/WallpaperRepository';
import { loadPreferences } from '../../os/theme/OrionThemeStorage';
import { aiWallpaperGenerator } from '../../services/wallpaper/AiWallpaperGenerator';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { cn } from '../../lib/utils';
import { OrionSettingsSplitLayout } from '../settings/OrionSettingsSplitLayout';
import { OrionDialog } from '../ui/OrionDialog';
import { useI18n } from '../../store/LanguageContext';

export type StudioLifecycleState = 'LOADING' | 'READY' | 'GENERATING' | 'GENERATED' | 'ERROR';
export type AiEngineStatus = 'READY' | 'GENERATING' | 'UNAVAILABLE' | 'RATE_LIMITED' | 'ERROR';

export const TARGETS = {
  LOGIN: 'login' as WallpaperTarget,
  DESKTOP: 'desktop' as WallpaperTarget,
} as const;

/**
 * Resilient image renderer that displays an error fallback
 * instead of broken placeholders or empty cards.
 */
const WallpaperCardImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src || src.trim() === '') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-3 text-center">
        <AlertCircle className="w-5 h-5 text-amber-400 mb-1" />
        <span className="text-[10px] font-mono">Image unavailable</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      onError={() => setHasError(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
    />
  );
};

export interface UserWallpaperStudioProps {
  initialTarget?: WallpaperTarget;
}

export const UserWallpaperStudio: React.FC<UserWallpaperStudioProps> = ({
  initialTarget = TARGETS.DESKTOP
}) => {
  const { showToast } = useToast();
  const { currentUser, organization } = useAuth();
  const { t } = useI18n();
  const tenantId = organization?.id || 'global';
  const userId = currentUser?.id || 'default_user';

  // Target Selection State ('login' vs 'desktop') - Strict Isolation (defaults to desktop when in OS)
  const [selectedTarget, setSelectedTarget] = useState<WallpaperTarget>(initialTarget);

  const getTargetFallback = (target: WallpaperTarget): WallpaperRecord => {
    if (target === 'login') return DEFAULT_LOGIN_WALLPAPER;
    const prefs = loadPreferences();
    return prefs.appearanceMode === 'light' ? DEFAULT_LIGHT_DESKTOP_WALLPAPER : DEFAULT_DESKTOP_WALLPAPER;
  };

  // Synchronous initial fallback resolution for zero-flash render
  const initialFallback = getTargetFallback(initialTarget);
  const initialRaw = wallpaperRepository.getActiveWallpaperSync(userId, initialTarget) || initialFallback;
  const initialActive = resolveRuntimeWallpaper(initialRaw, initialTarget, loadPreferences().appearanceMode === 'light' ? 'light' : 'dark');

  // Studio Lifecycle State
  const [studioState, setStudioState] = useState<StudioLifecycleState>('LOADING');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Mode Selection
  const [activeTab, setActiveTab] = useState<'GALLERY' | 'UPLOAD' | 'AI'>('GALLERY');
  
  // Available Gallery Wallpapers & Active Wallpaper
  const [galleryWallpapers, setGalleryWallpapers] = useState<WallpaperRecord[]>(SYSTEM_DEFAULT_WALLPAPERS);
  const [activeWallpaper, setActiveWallpaperState] = useState<WallpaperRecord>(initialActive);

  // Deletion Modal State
  const [wallpaperToDelete, setWallpaperToDelete] = useState<WallpaperRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI Generator Form & Neutral Engine State
  const [aiEngineStatus, setAiEngineStatus] = useState<AiEngineStatus>('READY');
  const [isAiAvailable, setIsAiAvailable] = useState<boolean>(true);
  const [prompt, setPrompt] = useState('Futuristic deep-space environment with subtle blue and graphite atmosphere');
  const [style, setStyle] = useState<WallpaperStyle>('Space');
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidates, setCandidates] = useState<WallpaperCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<WallpaperCandidate | null>(null);

  // Preview & Selection State (Static Image Only)
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string>(initialActive.assetUrl);
  const [selectedName, setSelectedName] = useState<string>(initialActive.name);
  const [selectedWallpaperId, setSelectedWallpaperId] = useState<string>(initialActive.wallpaperId);
  const [isApplying, setIsApplying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active wallpaper & gallery on mount or target switch with target-specific isolation
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setStudioState('LOADING');
      try {
        const available = await wallpaperRepository.getAvailableWallpapers(tenantId, userId, selectedTarget);
        const active = await wallpaperRepository.getActiveWallpaper(userId, tenantId, selectedTarget);
        const aiStatus = await aiWallpaperGenerator.checkProviderStatus();
        
        if (mounted) {
          const availableStatus = Boolean(aiStatus.available ?? aiStatus.configured);
          setIsAiAvailable(availableStatus);
          
          let engineStatus: AiEngineStatus = 'READY';
          if (!availableStatus) {
            engineStatus = 'UNAVAILABLE';
          }
          if (aiStatus.status === 'RATE_LIMITED' || String(aiStatus.status).includes('QUOTA')) {
            engineStatus = 'RATE_LIMITED';
          }
          setAiEngineStatus(engineStatus);
          
          const validGallery = available && available.length > 0 ? available : SYSTEM_DEFAULT_WALLPAPERS;
          setGalleryWallpapers(validGallery);
          
          const fallback = getTargetFallback(selectedTarget);
          const rawActive = (active && active.assetUrl && active.assetUrl.trim() !== '') 
            ? active 
            : fallback;
          const validActive = resolveRuntimeWallpaper(rawActive, selectedTarget, loadPreferences().appearanceMode === 'light' ? 'light' : 'dark');
          setActiveWallpaperState(validActive);
          setSelectedAssetUrl(validActive.assetUrl);
          setSelectedName(validActive.name);
          setSelectedWallpaperId(validActive.wallpaperId);

          setStudioState('READY');
          setErrorMessage('');
        }
      } catch (err: any) {
        console.warn('Failed to load wallpaper studio data:', err);
        if (mounted) {
          const fallback = getTargetFallback(selectedTarget);
          setSelectedAssetUrl(fallback.assetUrl);
          setSelectedName(fallback.name);
          setSelectedWallpaperId(fallback.wallpaperId);
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
      const available = await wallpaperRepository.getAvailableWallpapers(tenantId, userId, target);
      setGalleryWallpapers(available);
      const active = await wallpaperRepository.getActiveWallpaper(userId, tenantId, target);
      const fallback = getTargetFallback(target);
      const rawActive = (active && active.assetUrl && active.assetUrl.trim() !== '') ? active : fallback;
      const validActive = resolveRuntimeWallpaper(rawActive, target, loadPreferences().appearanceMode === 'light' ? 'light' : 'dark');
      setActiveWallpaperState(validActive);
      setSelectedAssetUrl(validActive.assetUrl);
      setSelectedName(validActive.name);
      setSelectedWallpaperId(validActive.wallpaperId);
    } catch (e) {
      const fallback = getTargetFallback(target);
      setSelectedAssetUrl(fallback.assetUrl);
      setSelectedName(fallback.name);
      setSelectedWallpaperId(fallback.wallpaperId);
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
    setAiEngineStatus('GENERATING');

    try {
      const generated = await aiWallpaperGenerator.generateCandidates({
        prompt: prompt.trim(),
        style,
        width: 1920,
        height: 1080,
      });

      setCandidates(generated);
      if (generated.length > 0) {
        handleSelectCandidate(generated[0]);
      }
      setStudioState('GENERATED');
      setAiEngineStatus('READY');
      showToast('3 AI Wallpaper candidates generated!', 'success');
    } catch (err: any) {
      setStudioState('ERROR');
      const rawMsg = String(err?.message || '');
      let sanitizedMsg = 'Wallpaper generation failed. Please try again.';

      if (rawMsg.includes('limit reached') || rawMsg.includes('quota') || rawMsg.includes('RATE_LIMITED')) {
        sanitizedMsg = 'AI generation limit reached. Please try again later.';
        setAiEngineStatus('RATE_LIMITED');
      } else if (rawMsg.includes('temporarily unavailable') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('network') || rawMsg.includes('auth')) {
        sanitizedMsg = 'AI wallpaper generation is temporarily unavailable.';
        setAiEngineStatus('UNAVAILABLE');
      } else {
        setAiEngineStatus('ERROR');
      }

      setErrorMessage(sanitizedMsg);
      showToast(sanitizedMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Candidate Selection Handler (Large preview gets original assetUrl)
  const handleSelectCandidate = (candidate: WallpaperCandidate) => {
    setSelectedCandidate(candidate);
    setSelectedWallpaperId(candidate.candidateId);
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
        setSelectedWallpaperId(`wp_upload_${Date.now()}`);
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
      let appliedWallpaper: WallpaperRecord;
      if (activeTab === 'GALLERY') {
        const existing = galleryWallpapers.find(w => w.wallpaperId === selectedWallpaperId || w.assetUrl === selectedAssetUrl);
        const wpId = existing ? existing.wallpaperId : selectedWallpaperId;
        appliedWallpaper = await wallpaperRepository.setActiveWallpaper(wpId, userId, selectedTarget);
        setActiveWallpaperState(appliedWallpaper);
      } else {
        const currentEnv = dbManager.getEnvironment();
        const activeWidth = selectedCandidate?.width || 1920;
        const activeHeight = selectedCandidate?.height || 1080;

        const wpRecord: WallpaperRecord = {
          wallpaperId: selectedCandidate?.candidateId || selectedWallpaperId || `wp_${Date.now()}`,
          tenantId,
          ownerType: 'USER',
          ownerId: userId,
          name: selectedName || 'Custom Wallpaper',
          assetUrl: selectedAssetUrl,
          thumbnailUrl: selectedCandidate?.thumbnailUrl || selectedAssetUrl,
          source: selectedCandidate ? 'AI' : activeTab === 'UPLOAD' ? 'UPLOAD' : 'SYSTEM',
          target: selectedTarget,
          aiGenerated: !!selectedCandidate,
          prompt: selectedCandidate?.prompt || prompt,
          style: selectedCandidate?.style || style,
          width: activeWidth,
          height: activeHeight,
          sourceWidth: selectedCandidate?.sourceWidth || activeWidth,
          sourceHeight: selectedCandidate?.sourceHeight || activeHeight,
          finalWidth: selectedCandidate?.finalWidth || activeWidth,
          finalHeight: selectedCandidate?.finalHeight || activeHeight,
          aspectRatio: '16:9',
          mode: 'STILL',
          environment: currentEnv,
          status: 'APPROVED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const saved = await wallpaperRepository.saveWallpaper(wpRecord, selectedTarget);
        appliedWallpaper = await wallpaperRepository.setActiveWallpaper(saved.wallpaperId, userId, selectedTarget);
        setActiveWallpaperState(appliedWallpaper);
        const updated = await wallpaperRepository.getAvailableWallpapers(tenantId, userId, selectedTarget);
        setGalleryWallpapers(updated);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('orion-wallpaper-changed', {
            detail: {
              target: selectedTarget,
              wallpaperId: appliedWallpaper.wallpaperId,
              wallpaper: appliedWallpaper
            }
          })
        );
      }

      const targetLabel = selectedTarget === 'login' ? 'Login Wallpaper' : 'Home / Desktop Wallpaper';
      showToast(`Static wallpaper applied to Orion ${targetLabel}!`, 'success');
    } catch (err: any) {
      showToast('Failed to apply wallpaper: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsApplying(false);
    }
  };

  // Delete Wallpaper Handler
  const handleConfirmDelete = async () => {
    if (!wallpaperToDelete) return;
    setIsDeleting(true);
    try {
      const res = await wallpaperRepository.deleteWallpaper(wallpaperToDelete.wallpaperId, userId, selectedTarget);
      if (res.replacementWallpaper) {
        setActiveWallpaperState(res.replacementWallpaper);
        setSelectedAssetUrl(res.replacementWallpaper.assetUrl);
        setSelectedName(res.replacementWallpaper.name);
        setSelectedWallpaperId(res.replacementWallpaper.wallpaperId);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('orion-wallpaper-changed', {
              detail: {
                target: selectedTarget,
                wallpaperId: res.replacementWallpaper.wallpaperId,
                wallpaper: res.replacementWallpaper
              }
            })
          );
        }
      } else if (selectedWallpaperId === wallpaperToDelete.wallpaperId) {
        const fallback = getTargetFallback(selectedTarget);
        setSelectedAssetUrl(fallback.assetUrl);
        setSelectedName(fallback.name);
        setSelectedWallpaperId(fallback.wallpaperId);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('orion-wallpaper-changed', {
              detail: {
                target: selectedTarget,
                wallpaperId: fallback.wallpaperId,
                wallpaper: fallback
              }
            })
          );
        }
      }
      const updated = await wallpaperRepository.getAvailableWallpapers(tenantId, userId, selectedTarget);
      setGalleryWallpapers(updated);
      showToast(`Wallpaper "${wallpaperToDelete.name}" deleted.`, 'success');
      setWallpaperToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete wallpaper.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset to System Default Action for selectedTarget
  const handleResetDefault = async () => {
    try {
      const fallback = getTargetFallback(selectedTarget);
      const sysDefault = await wallpaperRepository.setActiveWallpaper(fallback.wallpaperId, userId, selectedTarget);
      setActiveWallpaperState(sysDefault);
      setSelectedAssetUrl(sysDefault.assetUrl);
      setSelectedName(sysDefault.name);
      setSelectedWallpaperId(sysDefault.wallpaperId);
      setStudioState('READY');
      setErrorMessage('');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('orion-wallpaper-changed', {
            detail: {
              target: selectedTarget,
              wallpaperId: sysDefault.wallpaperId,
              wallpaper: sysDefault
            }
          })
        );
      }

      const targetLabel = selectedTarget === 'login' ? 'Login default' : 'Home / Desktop default';
      showToast(`Wallpaper reset to ${targetLabel}.`, 'info');
    } catch (err: any) {
      const fallback = getTargetFallback(selectedTarget);
      setSelectedAssetUrl(fallback.assetUrl);
      setSelectedName(fallback.name);
      setSelectedWallpaperId(fallback.wallpaperId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('orion-wallpaper-changed', {
            detail: {
              target: selectedTarget,
              wallpaperId: fallback.wallpaperId,
              wallpaper: fallback
            }
          })
        );
      }
      showToast('Wallpaper reset to system default.', 'info');
    }
  };

  // Formatted Resolution for current selection
  const currentResolutionText = selectedCandidate 
    ? `${selectedCandidate.width} × ${selectedCandidate.height} (16:9)`
    : `${activeWallpaper?.width || 1920} × ${activeWallpaper?.height || 1080} (16:9)`;

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
          <span>HOME / DESKTOP WALLPAPER</span>
        </button>
      </div>

      {/* Mode / Tab Switcher: System Gallery | Create with AI | Upload Image */}
      <div className="border-b border-white/[0.08] flex items-center gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('GALLERY')}
          className={cn(
            "pb-3 text-xs font-semibold tracking-wide transition-all border-b-2 cursor-pointer flex items-center gap-2",
            activeTab === 'GALLERY'
              ? "border-sky-400 text-white font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <ImageIcon className="w-4 h-4" />
          <span>System Gallery</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('AI')}
          className={cn(
            "pb-3 text-xs font-semibold tracking-wide transition-all border-b-2 cursor-pointer flex items-center gap-2",
            activeTab === 'AI'
              ? "border-sky-400 text-white font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>Create with AI</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('UPLOAD')}
          className={cn(
            "pb-3 text-xs font-semibold tracking-wide transition-all border-b-2 cursor-pointer flex items-center gap-2",
            activeTab === 'UPLOAD'
              ? "border-sky-400 text-white font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM GALLERY */}
      {activeTab === 'GALLERY' && (
        <div className="grid grid-cols-2 gap-3.5 max-h-[440px] overflow-y-auto pr-1">
          {galleryWallpapers.map((wp) => {
            const isSelected = selectedWallpaperId === wp.wallpaperId || selectedAssetUrl === wp.assetUrl;
            const isSystem = wp.source === 'SYSTEM' || wp.isSystemDefault;
            const isActive = activeWallpaper?.wallpaperId === wp.wallpaperId || activeWallpaper?.assetUrl === wp.assetUrl;
            const cardRes = `${wp.width || 1920}×${wp.height || 1080}`;

            return (
              <div
                key={wp.wallpaperId}
                onClick={() => {
                  setSelectedAssetUrl(wp.assetUrl);
                  setSelectedName(wp.name);
                  setSelectedWallpaperId(wp.wallpaperId);
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
                  <WallpaperCardImage 
                    src={wp.thumbnailUrl || wp.assetUrl} 
                    alt={wp.name}
                  />
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 bg-sky-500 text-black p-1 rounded-full shadow-lg z-10">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                  )}
                  {!isSystem && (
                    <button
                      type="button"
                      title="Delete wallpaper"
                      aria-label="Delete wallpaper"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWallpaperToDelete(wp);
                      }}
                      className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600/90 text-white/80 hover:text-white transition-colors backdrop-blur-sm z-10 opacity-70 group-hover:opacity-100 cursor-pointer shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors truncate">{wp.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{wp.source} • {cardRes}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    )}
                    {isSystem && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        DEFAULT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: CREATE WITH AI (NEUTRAL ENGINE STATUS CARD & GENERATOR) */}
      {activeTab === 'AI' && (
        <div className="space-y-4">
          <div className={cn(
            "p-3.5 rounded-xl border text-xs space-y-1",
            isAiAvailable && (aiEngineStatus === 'READY' || aiEngineStatus === 'GENERATING')
              ? "bg-sky-500/10 border-sky-500/20 text-slate-300"
              : "bg-slate-500/10 border-slate-500/20 text-slate-300"
          )}>
            <div className="flex items-center gap-2 font-semibold text-sky-400">
              <Sparkles className="w-4 h-4" />
              <span>AI IMAGE GENERATION</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md font-mono uppercase bg-white/10">
                {aiEngineStatus === 'RATE_LIMITED' ? 'RATE LIMITED' : aiEngineStatus}
              </span>
            </div>
            <p className="text-[11px] opacity-80">
              {aiEngineStatus === 'READY' && 'Ready for generation'}
              {aiEngineStatus === 'GENERATING' && 'Synthesizing 3 candidate wallpapers...'}
              {aiEngineStatus === 'UNAVAILABLE' && 'AI wallpaper generation is temporarily unavailable.'}
              {aiEngineStatus === 'RATE_LIMITED' && 'AI generation limit reached. Please try again later.'}
              {aiEngineStatus === 'ERROR' && 'Wallpaper generation failed. Please try again.'}
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
                  <span>Generate 3 Wallpapers (16:9)</span>
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
            <p className="text-xs text-slate-400 mt-1 max-w-xs">PNG, JPG, or WebP. Optimal 16:9 ratio.</p>
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
          <span>{isApplying ? 'Applying...' : t('wallpaper.applyWallpaper')}</span>
        </button>
      </div>
    </div>
  );

  // Secondary Preview & Status Pane Content (STATIC PREVIEW WITH ORIGINAL ASSET)
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
            <span className="text-slate-300">{currentResolutionText}</span>
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
    <>
      <OrionSettingsSplitLayout
        title={t('wallpaper.title')}
        subtitle="Static 16:9 desktop and login wallpapers with AI generation and upload"
        badge="STATIC"
        primary={primaryPane}
        secondary={secondaryPane}
      />

      {/* Delete Confirmation Dialog */}
      <OrionDialog
        isOpen={!!wallpaperToDelete}
        onClose={() => !isDeleting && setWallpaperToDelete(null)}
        title="Delete Wallpaper"
        subtitle="Confirm deletion"
        icon={<Trash2 className="w-5 h-5 text-rose-400" />}
        footer={
          <>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setWallpaperToDelete(null)}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Wallpaper</span>
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-slate-300">
            Are you sure you want to delete <strong className="text-white">"{wallpaperToDelete?.name}"</strong>?
          </p>
          {(activeWallpaper?.wallpaperId === wallpaperToDelete?.wallpaperId || activeWallpaper?.assetUrl === wallpaperToDelete?.assetUrl) && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                This wallpaper is currently active for <strong>{selectedTarget === 'login' ? 'Login' : 'Desktop'}</strong>. Deleting it will automatically reset your wallpaper to the system default.
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            This action cannot be undone. System default wallpapers cannot be deleted.
          </p>
        </div>
      </OrionDialog>
    </>
  );
};

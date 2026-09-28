import React, { useState, useEffect, useRef } from "react";
import { useAuth } from '../../store/AuthContext';
import { useLanguage, useI18n, SupportedLanguage } from '../../store/LanguageContext';
import { userService } from '../../services/userService';
import { useLocation } from "react-router-dom";
import { BrandLogo } from '../brand/BrandLogo';
import { UserProfile } from "../../types/auth";
import { dbManager } from "../../core/database/DatabaseConnectionManager";
import { HealthService } from "../../operations/HealthService";
import { getFirebaseAuth } from "../../lib/firebaseClient";
import { DemoPersistentSchedulerService } from "../../services/demo/DemoPersistentSchedulerService";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Lock,
  Globe,
  ChevronDown,
  Power,
  Users,
  LogOut,
  RotateCcw,
  Activity,
  Database,
  ShieldCheck,
  Cpu,
  CheckCircle2
} from "lucide-react";



import { WorldLanguagePanel } from '../i18n/WorldLanguagePanel';
import { SUPPORTED_LOCALES, SupportedLocale, TRANSLATIONS } from '../../i18n';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

// Derived strictly from central authoritative i18n registry
export const SUPPORTED_LANGUAGES: LanguageOption[] = Object.values(SUPPORTED_LOCALES).map(l => ({
  code: l.code,
  name: l.name,
  nativeName: l.nativeName,
}));

export const AUTH_TRANSLATIONS: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(TRANSLATIONS).map(([k, v]) => [k, v.auth || TRANSLATIONS.en.auth])
);

export const Login: React.FC = () => {
  const { login, triggerShutdown, triggerRestart, triggerLock, signOut } = useAuth();
  const location = useLocation();

  // Stage state: 1 = User ID lookup, 2 = Password entry for identified user
  const [stage, setStage] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resolvedUser, setResolvedUser] = useState<UserProfile | null>(null);

  // Focus & typing interaction tracking
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);

  // Live Runtime Environment & Health Probes State
  const [dbEnv, setDbEnv] = useState<'DEMO' | 'LIVE'>(() => dbManager.getEnvironment());
  const [systemHealth, setSystemHealth] = useState<{
    runtimeStatus: 'ONLINE' | 'INITIALIZING';
    authStatus: 'READY' | 'DEGRADED';
    dbStatus: 'CONNECTED' | 'DISCONNECTED';
    controlPlane: 'READY' | 'DEGRADED';
    latencyMs: number;
    activeBatchInfo?: string;
  }>({
    runtimeStatus: 'ONLINE',
    authStatus: 'READY',
    dbStatus: 'CONNECTED',
    controlPlane: 'READY',
    latencyMs: 12,
  });

  // Query authoritative health probes on mount & listen to environment changes
  useEffect(() => {
    let mounted = true;

    const runProbe = async () => {
      try {
        const env = dbManager.getEnvironment();
        const health = await HealthService.getInstance().runHealthCheck();
        const auth = getFirebaseAuth();
        const dbState = dbManager.getState();

        let batchInfo = '';
        if (env === 'DEMO') {
          const scheduler = DemoPersistentSchedulerService.getInstance();
          const state = scheduler.getSchedulerState();
          batchInfo = `${state.lastBatchId} (${state.lastBatchResult})`;
        } else {
          batchInfo = 'Standing By — Control Plane Operational';
        }

        if (mounted) {
          setDbEnv(env);
          setSystemHealth({
            runtimeStatus: health.livenessProbe ? 'ONLINE' : 'INITIALIZING',
            authStatus: auth ? 'READY' : 'DEGRADED',
            dbStatus: dbState.status === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
            controlPlane: health.readinessProbe ? 'READY' : 'DEGRADED',
            latencyMs: dbState.measuredLatencyMs || 12,
            activeBatchInfo: batchInfo,
          });
        }
      } catch (err) {
        if (mounted) {
          setSystemHealth(prev => ({ ...prev, runtimeStatus: 'ONLINE' }));
        }
      }
    };

    runProbe();
    const interval = setInterval(runProbe, 10000);

    const handleEnvChange = () => {
      if (mounted) {
        setDbEnv(dbManager.getEnvironment());
        runProbe();
      }
    };

    window.addEventListener('orion-database-environment-changed', handleEnvChange);
    // Demo auto-login for DEMO environment
    if (dbManager.getEnvironment() === 'DEMO') {
      setUsername('admin');
      setPassword('admin');
    }

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('orion-database-environment-changed', handleEnvChange);
    };
  }, []);

  // Language & Power menu state
  const { locale: currentLang, setLocale: handleSelectLanguage, t: translate } = useI18n();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  const t = {
    signInTitle: translate('auth.signInTitle'),
    userIdLabel: translate('auth.userIdLabel'),
    userIdPlaceholder: translate('auth.userIdPlaceholder'),
    continueBtn: translate('auth.continueBtn'),
    identifying: translate('auth.identifying'),
    userNotFound: translate('auth.userNotFound'),
    enterPassword: translate('auth.enterPassword'),
    enterOrionBtn: translate('auth.enterOrionBtn'),
    otherUser: translate('auth.otherUser'),
    rememberMe: translate('auth.rememberMe'),
    forgotPassword: translate('auth.forgotPassword'),
    invalidCredentials: translate('auth.invalidCredentials'),
    switchUser: translate('auth.switchUser'),
    lock: translate('auth.lock'),
    signOut: translate('auth.signOut'),
    restart: translate('auth.restart'),
    shutDown: translate('auth.shutDown'),
    selectLanguage: translate('auth.selectLanguage'),
    subtitle: translate('auth.subtitle'),
    showPassword: translate('auth.showPassword'),
    hidePassword: translate('auth.hidePassword'),
    enteringOrion: translate('auth.enteringOrion'),
  };



  // Close language menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation & autofocusing
  useEffect(() => {
    if (stage === 2) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
    } else {
      setTimeout(() => {
        usernameInputRef.current?.focus();
      }, 50);
    }
  }, [stage]);

  const handleInputChange = () => {
    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1200);
  };

  const authState = isSubmitting || isIdentifying
    ? 'SIGNING_IN'
    : errorMsg
    ? 'ERROR'
    : isTyping
    ? 'TYPING'
    : isInputFocused
    ? 'FOCUSED'
    : 'INITIAL';

  // STAGE 1 SUBMIT: Perform authoritative user lookup
  const handleStage1Submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = username.trim();

    if (!cleanId) {
      setErrorMsg(t.userNotFound);
      return;
    }

    setIsIdentifying(true);
    setErrorMsg("");

    try {
      // Look up user profile authoritatively
      const found = userService.getUserByIdentifier(cleanId) || userService.getUserByEmail(cleanId);
      
      await new Promise(res => setTimeout(res, 150));

      if (found) {
        setResolvedUser(found);
        setStage(2);
        setErrorMsg("");
      } else {
        // Proceed to password step with user identifier for Firebase Auth verification
        const email = cleanId.includes('@') ? cleanId : `${cleanId}@orion.network`;
        setResolvedUser({
          id: cleanId,
          username: cleanId.split('@')[0],
          displayName: cleanId.split('@')[0],
          fullName: cleanId.split('@')[0],
          email: email,
          role: 'user',
          status: 'active',
          organizationId: 'ORION_PLATFORM',
          organizationName: 'ORION_PLATFORM',
          onboardingCompleted: true,
        });
        setStage(2);
        setErrorMsg("");
      }
    } catch (err: any) {
      setErrorMsg(t.userNotFound);
    } finally {
      setIsIdentifying(false);
    }
  };

  // STAGE 2 SUBMIT: Perform password authentication
  const handleStage2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !password.trim()) {
      setErrorMsg(t.invalidCredentials);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const rawFrom = (location.state as any)?.from?.pathname;
      const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
      const defaultDest = isMobileDevice ? "/mobile/home" : "/";
      const from = (rawFrom && !rawFrom.startsWith('/admin') && rawFrom !== '/login') ? rawFrom : defaultDest;
      await login(username, password, { destination: from });
    } catch (err: any) {
      console.warn("Login authentication error:", err.message);
      setErrorMsg(t.invalidCredentials);
      setIsSubmitting(false);
    }
  };

  // Switch back to STAGE 1 ("Other user")
  const handleBackToStage1 = () => {
    setStage(1);
    setPassword("");
    setErrorMsg("");
    setResolvedUser(null);
  };

  // Bottom Bar — Switch User Action
  const handleSwitchUser = () => {
    signOut();
    handleBackToStage1();
    setUsername("");
  };

  return (
    <div 
      className="w-screen h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden font-sans relative selection:bg-blue-500/30 bg-transparent text-white"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && stage === 2) {
          handleBackToStage1();
        }
      }}
    >
      

      {/* Header — Top Bar */}
      <header className="relative z-10 w-full flex items-center justify-end px-4 sm:px-8 py-3.5 sm:py-6 pt-[calc(14px+env(safe-area-inset-top,0px))] select-none">
        {/* Top Right Functional Language Selector Dropdown */}
        <div className="relative" ref={langMenuRef} data-testid="language-selector">
          <button
            type="button"
            onClick={() => setIsLangMenuOpen(prev => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsLangMenuOpen(prev => !prev);
              } else if (e.key === 'Escape') {
                setIsLangMenuOpen(false);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur-md transition-all duration-200 cursor-pointer text-white/90 hover:text-white text-xs font-medium group shadow-lg"
            aria-label={t.selectLanguage}
            aria-haspopup="dialog"
            aria-expanded={isLangMenuOpen}
          >
            <Globe className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
            <span>{SUPPORTED_LOCALES[currentLang]?.nativeName || 'English'}</span>
            <ChevronDown className={`w-3 h-3 text-white/50 group-hover:text-white transition-transform duration-200 ml-0.5 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* World Language Panel */}
          <WorldLanguagePanel
            isOpen={isLangMenuOpen}
            onClose={() => setIsLangMenuOpen(false)}
            currentLocale={currentLang}
            onSelectLocale={(loc) => {
              handleSelectLanguage(loc as any);
              setIsLangMenuOpen(false);
            }}
          />
        </div>
      </header>

      {/* Main Content — Compact Acrylic Authentication Surface */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full my-auto">
        


        <div className="backdrop-blur-2xl bg-[#070e1c]/75 border border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.85)] rounded-[22px] p-8 sm:p-10 w-full max-w-[500px] flex flex-col justify-center mx-auto relative overflow-hidden transition-all duration-300">
          
          {/* Inner Content Column Wrapper for balanced vertical and horizontal distribution */}
          <div className="flex h-full flex-col justify-center w-full">
            <div className="w-full max-w-[380px] mx-auto flex flex-col justify-center">
              
              {/* STAGE 1: USER ID STAGE */}
              {stage === 1 && (
                <div className="animate-fadeIn w-full">
                  <div className="flex flex-col items-center justify-center mb-8 select-none text-center">
                    <BrandLogo variant="mark" sizePreset="lg" width={136} className="mx-auto mb-5" />
                    <h1 className="text-white font-bold tracking-normal text-[21px] sm:text-[22px] leading-tight">
                      {t.signInTitle}
                    </h1>
                    <p className="text-white/65 text-[13px] font-normal mt-2 max-w-[320px] leading-relaxed">
                      {t.subtitle}
                    </p>
                  </div>

                  <form className="space-y-4" onSubmit={handleStage1Submit} noValidate>
                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-white text-xs flex items-start gap-2 font-medium backdrop-blur-md">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                    
                    {/* User ID Field */}
                    <div className="relative">
                      <label htmlFor="username" className="block text-xs sm:text-[13px] font-medium text-white/75 mb-2 select-none">
                        {t.userIdLabel}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          ref={usernameInputRef}
                          id="username"
                          name="username"
                          type="text"
                          autoComplete="username"
                          required
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            handleInputChange();
                            if (errorMsg) setErrorMsg("");
                          }}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          className="w-full h-12 pl-10 pr-4 bg-[#111622]/90 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all shadow-inner"
                          placeholder={t.userIdPlaceholder}
                        />
                      </div>
                    </div>

                    {/* Continue Button */}
                    <button
                      type="submit"
                      disabled={isIdentifying}
                      className="h-[52px] w-full px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-200 rounded-[14px] shadow-[0_0_24px_rgba(37,99,235,0.45)] hover:shadow-[0_0_32px_rgba(37,99,235,0.6)] disabled:opacity-50 cursor-pointer border border-blue-400/40 flex items-center justify-center gap-2 mt-4"
                    >
                      {isIdentifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>{t.identifying}</span>
                        </>
                      ) : (
                        <>
                          <span>{t.continueBtn}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* STAGE 2: USER RECOGNIZED & PASSWORD STAGE */}
              {stage === 2 && (
                <div className="animate-fadeIn w-full">
                  {/* Resolved User Photo & Name Display */}
                  <div className="flex flex-col items-center justify-center mb-6 select-none text-center">
                    {/* Avatar Photo */}
                    <div className="w-20 h-20 rounded-full border-2 border-cyan-500/30 shadow-xl bg-[#111622] flex items-center justify-center overflow-hidden mb-3 backdrop-blur-md">
                      {resolvedUser?.avatarUrl || (resolvedUser as any)?.photoURL ? (
                        <img 
                          src={resolvedUser?.avatarUrl || (resolvedUser as any)?.photoURL} 
                          alt={resolvedUser?.displayName || username} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-9 h-9 text-white/80" />
                      )}
                    </div>

                    {/* Display Name & Username Handle */}
                    <h2 className="text-white font-bold tracking-normal text-lg sm:text-[19px] leading-tight">
                      {resolvedUser?.displayName || resolvedUser?.fullName || username}
                    </h2>
                    <span className="text-white/60 text-xs font-mono mt-1">
                      @{resolvedUser?.username || username}
                    </span>
                  </div>

                  <form className="space-y-4" onSubmit={handleStage2Submit} noValidate>
                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-white text-xs flex items-start gap-2 font-medium backdrop-blur-md">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                    
                    {/* Password Input */}
                    <div className="relative">
                      <label htmlFor="password" className="block text-xs sm:text-[13px] font-medium text-white/75 mb-2 select-none">
                        {t.enterPassword}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          ref={passwordInputRef}
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            handleInputChange();
                            if (errorMsg) setErrorMsg("");
                          }}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          className="w-full h-12 pl-10 pr-10 bg-[#111622]/90 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all shadow-inner"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors cursor-pointer"
                          aria-label={showPassword ? t.hidePassword : t.showPassword}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Enter Orion Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-[52px] w-full px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-200 rounded-[14px] shadow-[0_0_24px_rgba(37,99,235,0.45)] hover:shadow-[0_0_32px_rgba(37,99,235,0.6)] disabled:opacity-50 cursor-pointer border border-blue-400/40 flex items-center justify-center gap-2 mt-4"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t.enteringOrion}</span>
                        </>
                      ) : (
                        <>
                          <span>{t.enterOrionBtn}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Form Link Options */}
                    <div className="flex items-center justify-between pt-1 select-none text-xs">
                      <label className="flex items-center gap-2 cursor-pointer group text-white/70 hover:text-white transition-colors">
                        <input 
                          type="checkbox" 
                          className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-blue-600"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span>{t.rememberMe}</span>
                      </label>
                      
                      <button type="button" className="text-white/60 hover:text-white transition-colors cursor-pointer">
                        {t.forgotPassword}
                      </button>
                    </div>

                    {/* Other User Button */}
                    <div className="pt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={handleBackToStage1}
                        className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors cursor-pointer group py-1 px-3 rounded-lg hover:bg-white/5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>{t.otherUser}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
            </div>
          </div>
          
        </div>
      </main>

      {/* Footer — Bottom Bar */}
      <footer className="relative z-10 w-full px-4 sm:px-8 py-3.5 sm:py-6 pb-[calc(14px+env(safe-area-inset-bottom,0px))] flex items-center justify-between select-none">
        
        {/* Bottom Left Power Button & OS Shutdown Control */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              setIsPowerMenuOpen(prev => !prev);
              triggerShutdown();
            }}
            title={t.shutDown}
            aria-label={t.shutDown}
            className="group flex items-center h-9 px-2.5 rounded-full bg-white/5 hover:bg-red-950/80 border border-white/15 hover:border-red-500/60 transition-all duration-300 backdrop-blur-md shadow-md cursor-pointer text-white/70 hover:text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.55)] overflow-hidden"
          >
            <Power className="w-4 h-4 shrink-0 text-white/70 group-hover:text-red-400 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] transition-colors duration-300" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out text-xs font-medium text-red-400 select-none">
              {t.shutDown}
            </span>
          </button>
        </div>

        {/* Bottom Right User Switch Button */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleSwitchUser}
            title={t.switchUser}
            aria-label={t.switchUser}
            className="group flex items-center h-9 px-2.5 rounded-full bg-white/5 hover:bg-blue-950/80 border border-white/15 hover:border-blue-500/60 transition-all duration-300 backdrop-blur-md shadow-md cursor-pointer text-white/70 hover:text-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.55)] overflow-hidden"
          >
            <User className="w-4 h-4 shrink-0 text-white/70 group-hover:text-blue-400 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.9)] transition-colors duration-300" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out text-xs font-medium text-blue-400 select-none">
              {t.switchUser}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};

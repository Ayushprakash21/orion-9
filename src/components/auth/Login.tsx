import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from '../../store/AuthContext';
import { useLanguage, useI18n, SupportedLanguage } from '../../store/LanguageContext';
import { userService } from '../../services/userService';
import { useLocation, useNavigate } from "react-router-dom";
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
  Mail,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  KeyRound,
  UserPlus
} from "lucide-react";

import { WorldLanguagePanel } from '../i18n/WorldLanguagePanel';
import { SUPPORTED_LOCALES, SupportedLocale, TRANSLATIONS } from '../../i18n';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export interface LoginProps {
  initialTab?: 'login' | 'signup';
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

// Password Strength Evaluator Helper
function getPasswordStrength(pass: string): { score: number; label: string; color: string; widthPct: string } {
  if (!pass) return { score: 0, label: '', color: 'bg-white/10', widthPct: '0%' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', color: 'bg-red-500', widthPct: '25%' };
    case 2:
      return { score: 2, label: 'Fair', color: 'bg-amber-500', widthPct: '50%' };
    case 3:
      return { score: 3, label: 'Good', color: 'bg-yellow-400', widthPct: '75%' };
    case 4:
    default:
      return { score: 4, label: 'Strong', color: 'bg-emerald-400', widthPct: '100%' };
  }
}

export const Login: React.FC<LoginProps> = () => {
  const { login, triggerShutdown, triggerRestart, triggerLock, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Stage state for Login: 1 = User ID lookup, 2 = Password entry for identified user
  const [stage, setStage] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
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
        const newEnv = dbManager.getEnvironment();
        setDbEnv(newEnv);
        if (newEnv === 'DEMO') {
          setUsername('admin');
          setPassword('admin');
        }
        runProbe();
      }
    };

    window.addEventListener('orion-database-environment-changed', handleEnvChange);
    // Demo auto-login default for DEMO environment
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
    setSuccessMsg("");

    try {
      // Look up user profile authoritatively
      const found = userService.getUserByIdentifier(cleanId) || userService.getUserByEmail(cleanId);
      
      await new Promise(res => setTimeout(res, 150));

      if (found) {
        setResolvedUser(found);
        setStage(2);
        setErrorMsg("");
        if (dbManager.getEnvironment() === 'DEMO') {
          const lower = cleanId.toLowerCase();
          if (lower === 'admin' || lower === 'admin@orion.network') {
            if (!password) setPassword('admin');
          } else if (lower === 'user' || lower === 'user@orion.network') {
            if (!password) setPassword('user');
          }
        }
      } else {
        if (dbManager.getEnvironment() === 'DEMO') {
          setErrorMsg(t.userNotFound);
          setIsIdentifying(false);
          return;
        }
        // In LIVE environment: proceed to password step with user identifier for Firebase Auth verification
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
    setSuccessMsg("");

    try {
      const rawFrom = (location.state as any)?.from?.pathname;
      const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
      const defaultDest = isMobileDevice ? "/mobile/home" : "/";
      const from = (rawFrom && !rawFrom.startsWith('/admin') && rawFrom !== '/login') ? rawFrom : defaultDest;
      await login(username, password, { destination: from });
    } catch (err: any) {
      console.warn("Login authentication error:", err.message);
      if (err.message && err.message.includes('DEMO credentials are not permitted in the LIVE environment.')) {
        setErrorMsg('DEMO credentials are not permitted in the LIVE environment.');
      } else {
        setErrorMsg(t.invalidCredentials);
      }
      setIsSubmitting(false);
    }
  };

  // Switch back to STAGE 1 ("Other user")
  const handleBackToStage1 = () => {
    setStage(1);
    setPassword("");
    setErrorMsg("");
    setSuccessMsg("");
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
      className="w-screen h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden font-sans relative selection:bg-cyan-500/30 bg-transparent text-white"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && stage === 2) {
          handleBackToStage1();
        }
      }}
    >
      {/* FLOWLOGIN Decorative Ambient Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.15, 1],
            x: [0, 25, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-sky-950/20 via-slate-900/10 to-transparent blur-[120px]"
        />
        <motion.div
          animate={shouldReduceMotion ? {} : {
            scale: [1.1, 1, 1.1],
            x: [0, -30, 0],
            y: [0, 25, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-slate-900/20 via-sky-950/10 to-transparent blur-[140px]"
        />
      </div>

      {/* Header — Top Bar */}
      <header className="relative z-50 w-full flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-6 pt-[calc(14px+env(safe-area-inset-top,0px))] select-none">
        {/* Environment Badge & Quick Switcher */}
        <div className="flex items-center gap-2">
          <div
            data-testid="environment-badge"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md text-xs font-semibold shadow-lg transition-all ${
              dbEnv === 'DEMO'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${dbEnv === 'DEMO' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span>{dbEnv === 'DEMO' ? 'DEMO SANDBOX' : 'LIVE ENVIRONMENT'}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const target = dbEnv === 'DEMO' ? 'LIVE' : 'DEMO';
              dbManager.setEnvironment(target);
              setDbEnv(target);
              setErrorMsg('');
              setSuccessMsg('');
              if (target === 'DEMO') {
                setUsername('admin');
                setPassword('admin');
              } else {
                setUsername('');
                setPassword('');
              }
            }}
            className="text-[11px] font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-full border border-white/15 backdrop-blur-md transition-colors cursor-pointer"
          >
            {dbEnv === 'DEMO' ? 'Switch to LIVE' : 'Switch to DEMO'}
          </button>
        </div>

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

      {/* Main Content — Enterprise Native Minimal Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full my-auto">
        <motion.div
          layout
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="backdrop-blur-2xl bg-[#0c1017]/90 border border-white/[0.12] shadow-[0_24px_60px_rgba(0,0,0,0.7)] rounded-[20px] p-7 sm:p-9 w-full max-w-[480px] flex flex-col justify-center mx-auto relative overflow-hidden"
        >
          <div className="flex h-full flex-col justify-center w-full">
            <div className="w-full max-w-[380px] mx-auto flex flex-col justify-center">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key="login-mode"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
                >
                  {/* STAGE 1: USER ID STAGE */}
                  {stage === 1 && (
                    <div className="w-full">
                      <div className="flex flex-col items-center justify-center mb-6 select-none text-center">
                        <BrandLogo variant="mark" sizePreset="lg" width={128} className="mx-auto mb-4" />
                        <h1 className="text-white font-bold tracking-normal text-[21px] sm:text-[22px] leading-tight">
                          {t.signInTitle}
                        </h1>
                        <p className="text-white/60 text-[13px] font-normal mt-1.5 max-w-[320px] leading-relaxed">
                          {t.subtitle}
                        </p>
                      </div>

                      <form className="space-y-4" onSubmit={handleStage1Submit} noValidate>
                        <AnimatePresence>
                          {errorMsg && (
                            <motion.div
                              initial={{ opacity: 0, y: -6, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, y: -6, height: 0 }}
                              className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-white text-xs flex items-start gap-2 font-medium backdrop-blur-md overflow-hidden"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                              <span>{errorMsg}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* User ID Field */}
                        <div className="relative">
                          <label htmlFor="username" className="block text-xs sm:text-[13px] font-medium text-white/75 mb-2 select-none">
                            {t.userIdLabel}
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                              <User className="w-4 h-4 text-white/40" />
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
                              className="w-full h-11 pl-10 pr-4 bg-[#141923] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-all shadow-inner"
                              placeholder={t.userIdPlaceholder}
                            />
                          </div>
                        </div>

                        {/* Continue Button */}
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={isIdentifying}
                          className="h-[48px] w-full px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-all duration-200 rounded-xl disabled:opacity-50 cursor-pointer border border-sky-400/20 shadow-[0_0_24px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 mt-4"
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
                        </motion.button>
                      </form>
                    </div>
                  )}

                  {/* STAGE 2: USER RECOGNIZED & PASSWORD STAGE */}
                  {stage === 2 && (
                    <div className="w-full">
                      {/* Resolved User Photo & Name Display */}
                      <div className="flex flex-col items-center justify-center mb-5 select-none text-center">
                        {/* Avatar Photo */}
                        <div className="w-18 h-18 rounded-full border-2 border-cyan-400/40 shadow-xl bg-[#0f172a] flex items-center justify-center overflow-hidden mb-3 backdrop-blur-md">
                          {resolvedUser?.avatarUrl || (resolvedUser as any)?.photoURL ? (
                            <img 
                              src={resolvedUser?.avatarUrl || (resolvedUser as any)?.photoURL} 
                              alt={resolvedUser?.displayName || username} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-9 h-9 text-white/50" />
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
                        <AnimatePresence>
                          {errorMsg && (
                            <motion.div
                              initial={{ opacity: 0, y: -6, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, y: -6, height: 0 }}
                              className="p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-white text-xs flex items-start gap-2 font-medium backdrop-blur-md overflow-hidden"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                              <span>{errorMsg}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {/* Password Input */}
                        <div className="relative">
                          <label htmlFor="password" className="block text-xs sm:text-[13px] font-medium text-white/75 mb-2 select-none">
                            {t.enterPassword}
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                              <Lock className="w-4 h-4 text-white/40" />
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
                              className="w-full h-11 pl-10 pr-10 bg-[#141923] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-all shadow-inner"
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
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={isSubmitting}
                          className="h-[48px] w-full px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-all duration-200 rounded-xl disabled:opacity-50 cursor-pointer border border-sky-400/20 shadow-[0_0_24px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 mt-4"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>{t.enteringOrion}</span>
                            </>
                          ) : (
                            <>
                              <span>{t.enterOrionBtn}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </motion.button>

                        {/* Form Link Options */}
                        <div className="flex items-center justify-between pt-1 select-none text-xs">
                          <label className="flex items-center gap-2 cursor-pointer group text-white/70 hover:text-white transition-colors">
                            <input 
                              type="checkbox" 
                              className="rounded border-white/20 bg-white/10 text-sky-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-sky-500"
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
                </motion.div>
              </AnimatePresence>

            </div>
          </div>
        </motion.div>
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
            className="group flex items-center h-8 px-2.5 rounded-full bg-white/5 hover:bg-red-950/80 border border-white/10 hover:border-red-500/60 transition-all duration-200 backdrop-blur-md cursor-pointer text-white/70 hover:text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.55)] overflow-hidden"
          >
            <Power className="w-3.5 h-3.5 shrink-0 text-white/70 group-hover:text-red-400 transition-colors" />
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
            className="group flex items-center h-8 px-2.5 rounded-full bg-white/5 hover:bg-blue-950/80 border border-white/10 hover:border-blue-500/60 transition-all duration-200 backdrop-blur-md cursor-pointer text-white/70 hover:text-blue-400 overflow-hidden"
          >
            <User className="w-3.5 h-3.5 shrink-0 text-white/70 group-hover:text-blue-400 transition-colors" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out text-xs font-medium text-blue-400 select-none">
              {t.switchUser}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};


import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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
  Sparkles,
  KeyRound,
} from "lucide-react";

import { WorldLanguagePanel } from '../i18n/WorldLanguagePanel';
import { SUPPORTED_LOCALES, SupportedLocale, TRANSLATIONS } from '../../i18n';
import { cn } from '../../lib/utils';

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
export function getPasswordStrength(pass: string): { score: number; label: string; color: string; widthPct: string } {
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
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Focus & typing interaction tracking
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);

  // Subtle pointer parallax offset (stars: 1-2px, atmospheric: 3-4px, subject: 2-3px)
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (shouldReduceMotion) return;
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isTouch) return;

    const handlePointerMove = (e: PointerEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const nx = (e.clientX - cx) / cx; // -1 to 1
      const ny = (e.clientY - cy) / cy; // -1 to 1
      setParallax({ x: nx, y: ny });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [shouldReduceMotion]);

  // Health Probes State
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

  // Query authoritative health probes on mount
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
        runProbe();
      }
    };

    window.addEventListener('orion-database-environment-changed', handleEnvChange);

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
    signInTitle: translate('auth.signInTitle') || 'Sign in to Orion',
    userIdLabel: translate('auth.userIdLabel') || 'User ID',
    userIdPlaceholder: translate('auth.userIdPlaceholder') || 'Username or email',
    continueBtn: translate('auth.continueBtn') || 'Continue',
    identifying: translate('auth.identifying') || 'Identifying user...',
    userNotFound: translate('auth.userNotFound') || 'User not found',
    enterPassword: translate('auth.enterPassword') || 'Password',
    enterOrionBtn: translate('auth.enterOrionBtn') || 'Enter Orion',
    otherUser: translate('auth.otherUser') || 'Other user',
    rememberMe: translate('auth.rememberMe') || 'Remember me',
    forgotPassword: translate('auth.forgotPassword') || 'Forgot password?',
    invalidCredentials: translate('auth.invalidCredentials') || 'Invalid password or credentials.',
    switchUser: translate('auth.switchUser') || 'Switch User',
    lock: translate('auth.lock') || 'Lock',
    signOut: translate('auth.signOut') || 'Sign Out',
    restart: translate('auth.restart') || 'Restart',
    shutDown: translate('auth.shutDown') || 'Shut Down',
    selectLanguage: translate('auth.selectLanguage') || 'Select language',
    subtitle: translate('auth.subtitle') || 'Enter your User ID to access your workspace',
    showPassword: translate('auth.showPassword') || 'Show password',
    hidePassword: translate('auth.hidePassword') || 'Hide password',
    enteringOrion: translate('auth.enteringOrion') || 'ENTERING ORION...',
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
    if (isIdentifying) return;
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
      
      await new Promise(res => setTimeout(res, 120));

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
    if (isSubmitting) return;

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
      setIsUnlocked(true);
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

  // Staggered Entrance Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.4,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <div 
      className="w-screen h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden font-sans relative selection:bg-[var(--orion-accent,#38BDF8)]/30 bg-transparent text-white"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && stage === 2) {
          handleBackToStage1();
        }
      }}
    >
      {/* LAYERED CINEMATIC BACKGROUND SYSTEM */}
      {/* Dedicated background treatment: base dark overlay + gradient + vignette (~15–20% darker) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Layer 2A: Base cinematic dark overlay (18–24% uniform darkening) */}
        <div className="absolute inset-0 bg-black/[0.20]" />

        {/* Layer 2B: Subtle Dark Translucent Gradient & Depth Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/60" />
        
        {/* Layer 3: Atmospheric Vignette around screen edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.40)_70%,rgba(0,0,0,0.80)_100%)]" />

        {/* Layer 4: Soft Focus & Ambient Light Halo behind Login Subject */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full bg-[var(--orion-accent,#38BDF8)]/[0.05] blur-[140px]"
          style={shouldReduceMotion ? undefined : {
            transform: `translate3d(calc(-50% + ${parallax.x * 4}px), calc(-50% + ${parallax.y * 4}px), 0)`,
            transition: 'transform 0.15s ease-out',
          }}
        />

        {/* Subtle Star Dust Depth Layer */}
        <div 
          className="absolute inset-0 opacity-45 mix-blend-screen"
          style={shouldReduceMotion ? undefined : {
            transform: `translate3d(${parallax.x * 2}px, ${parallax.y * 2}px, 0)`,
            transition: 'transform 0.2s ease-out',
          }}
        >
          <div className="absolute top-[18%] left-[22%] w-1 h-1 rounded-full bg-white/60 blur-[0.5px]" />
          <div className="absolute top-[28%] right-[25%] w-1.5 h-1.5 rounded-full bg-cyan-200/50 blur-[0.5px]" />
          <div className="absolute top-[68%] left-[15%] w-1 h-1 rounded-full bg-white/40 blur-[0.5px]" />
          <div className="absolute top-[75%] right-[18%] w-1 h-1 rounded-full bg-sky-200/50 blur-[0.5px]" />
          <div className="absolute top-[12%] right-[42%] w-1 h-1 rounded-full bg-white/50 blur-[0.5px]" />
        </div>
      </div>

      {/* HEADER — TOP NATIVE OS BAR */}
      <header className="relative z-50 w-full flex items-center justify-between px-6 sm:px-10 py-4 sm:py-6 pt-[calc(16px+env(safe-area-inset-top,0px))] select-none">
        {/* Left header spacer */}
        <div className="flex items-center gap-2" />

        {/* Top Right Native OS Language Selector Dropdown [ ◉ English ˅ ] */}
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
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 backdrop-blur-2xl transition-all duration-200 cursor-pointer text-white/90 hover:text-white text-xs font-medium group shadow-lg active:scale-97"
            aria-label={t.selectLanguage}
            aria-haspopup="dialog"
            aria-expanded={isLangMenuOpen}
          >
            <span className="w-2 h-2 rounded-full bg-[var(--orion-accent,#38BDF8)] ring-2 ring-[var(--orion-accent,#38BDF8)]/30 group-hover:scale-110 transition-transform" />
            <Globe className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
            <span>{SUPPORTED_LOCALES[currentLang]?.nativeName || 'English'}</span>
            <ChevronDown className={cn("w-3 h-3 text-white/50 group-hover:text-white transition-transform duration-200 ml-0.5", isLangMenuOpen && "rotate-180")} />
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

      {/* CENTRAL FLOATING OS LOGIN COMPOSITION — MAC-STYLE SPATIAL UNLOCK */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full my-auto">
        <motion.div
          initial="hidden"
          animate={isUnlocked ? { opacity: 0, scale: 1.04, filter: 'blur(8px)' } : "visible"}
          variants={containerVariants}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[480px] flex flex-col items-center justify-center mx-auto relative select-none"
          style={shouldReduceMotion ? undefined : {
            transform: `translate3d(${parallax.x * -3}px, ${parallax.y * -3}px, 0)`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* 1. ORION-9 LOGO — Floating Naturally Above Identity (+5–10% visual clarity & contrast) */}
          <motion.div variants={itemVariants} className="mb-5 flex flex-col items-center justify-center text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[var(--orion-accent,#38BDF8)]/22 blur-2xl scale-125 pointer-events-none" />
              <BrandLogo variant="mark" sizePreset="md" width={138} className="relative z-10 mx-auto drop-shadow-[0_10px_32px_rgba(0,0,0,0.85)] filter brightness-[1.08] contrast-[1.06]" />
            </div>
          </motion.div>

          {/* 2. USER AVATAR / IDENTITY — 88–96px Circular Glass Frame (+10% clarity & float) */}
          <motion.div variants={itemVariants} className="relative mb-4 flex items-center justify-center">
            {/* Ambient soft glow ring */}
            <div className="absolute inset-0 rounded-full bg-[var(--orion-accent,#38BDF8)]/25 blur-xl scale-115 pointer-events-none transition-all duration-500" />
            
            {/* Glass surround ring */}
            <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full p-[2px] bg-gradient-to-b from-white/40 via-white/20 to-white/10 shadow-[0_20px_48px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-2xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-black/60 border border-white/25 flex items-center justify-center backdrop-blur-md">
                {stage === 2 && (resolvedUser?.avatarUrl || (resolvedUser as any)?.photoURL) ? (
                  <img 
                    src={resolvedUser?.avatarUrl || (resolvedUser as any)?.photoURL} 
                    alt={resolvedUser?.displayName || username} 
                    className="w-full h-full object-cover"
                  />
                ) : stage === 2 && resolvedUser ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/25 to-white/10 text-white font-medium text-2xl tracking-wider drop-shadow-md">
                    {(resolvedUser.displayName || resolvedUser.username || 'U').charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-white/[0.14] to-transparent text-white">
                    <User className="w-10 h-10 text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* 3. WELCOME TYPOGRAPHY — Understated, Semibold, Native OS Hierarchy (+10% contrast) */}
          <motion.div variants={itemVariants} className="text-center mb-6 select-none">
            <h1 className="text-white font-semibold tracking-tight text-[28px] sm:text-[34px] leading-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
              {stage === 2 && resolvedUser 
                ? (resolvedUser?.displayName || resolvedUser?.fullName || username)
                : t.signInTitle}
            </h1>
            <p className="text-white/80 text-[13px] sm:text-[14px] font-normal mt-1 tracking-wide drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
              {stage === 2 && resolvedUser
                ? `@${resolvedUser?.username || username}`
                : 'Unlock ORION-9'}
            </p>
          </motion.div>

          {/* 4. COMPACT FLOATING IDENTITY / PASSWORD FIELD (macOS Capsule Interaction Model) */}
          <motion.div variants={itemVariants} className="w-full max-w-[340px] sm:max-w-[360px]">
            <AnimatePresence mode="wait">
              {/* STAGE 1: USER ID STAGE */}
              {stage === 1 && (
                <motion.div
                  key="stage-1"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  <form onSubmit={handleStage1Submit} noValidate className="w-full">
                    {/* User ID Label for accessibility / testing */}
                    <label htmlFor="username" className="sr-only">
                      User ID
                    </label>

                    {/* Floating Glass Capsule (+10% prominence: brighter glass, clearer edge, subtle depth) */}
                    <div className={cn(
                      "relative flex items-center h-[48px] sm:h-[52px] rounded-full",
                      "bg-white/[0.14] hover:bg-white/[0.18] transition-all duration-300",
                      "backdrop-blur-2xl border shadow-[0_16px_44px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.28)]",
                      isInputFocused 
                        ? "border-[var(--orion-accent,#38BDF8)]/85 ring-4 ring-[var(--orion-accent,#38BDF8)]/25 bg-white/[0.18]" 
                        : "border-white/30",
                      errorMsg && "border-red-400/80 ring-4 ring-red-400/25"
                    )}>
                      <div className="pl-4.5 pr-2 flex items-center pointer-events-none text-white/75">
                        <User className="w-4 h-4 text-white/75" />
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
                        className="flex-1 bg-transparent border-none text-white text-[14px] sm:text-[15px] placeholder:text-white/60 focus:outline-none focus:ring-0 px-2 font-normal"
                        placeholder={t.userIdPlaceholder || "Username or email"}
                      />

                      {/* Circular Action Button [ → ] (+10% clarity, slightly brighter accent & stronger glow) */}
                      <button
                        type="submit"
                        disabled={isIdentifying || !username.trim()}
                        aria-label={t.continueBtn || "Continue"}
                        title={t.continueBtn || "Continue"}
                        className={cn(
                          "w-[38px] h-[38px] mr-1.5 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer",
                          "text-white shadow-md disabled:opacity-35 disabled:cursor-not-allowed",
                          "bg-[var(--orion-accent,#0284C7)] hover:bg-[var(--orion-accent,#38BDF8)] active:scale-[0.96] hover:scale-[1.04] shadow-[0_0_24px_rgba(37,99,235,0.4)]",
                          "border border-white/30"
                        )}
                      >
                        <span className="sr-only">Continue</span>
                        {isIdentifying ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Inline OS Error Feedback */}
                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="mt-3 text-center text-xs text-red-300/90 font-medium tracking-wide flex items-center justify-center gap-1.5"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                          <span>{errorMsg}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </motion.div>
              )}

              {/* STAGE 2: PASSWORD STAGE */}
              {stage === 2 && (
                <motion.div
                  key="stage-2"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  <form onSubmit={handleStage2Submit} noValidate className="w-full">
                    {/* Password Label for accessibility / testing */}
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>

                    {/* Floating Glass Capsule with Password Input (+10% prominence) */}
                    <div className={cn(
                      "relative flex items-center h-[48px] sm:h-[52px] rounded-full",
                      "bg-white/[0.14] hover:bg-white/[0.18] transition-all duration-300",
                      "backdrop-blur-2xl border shadow-[0_16px_44px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.28)]",
                      isInputFocused 
                        ? "border-[var(--orion-accent,#38BDF8)]/85 ring-4 ring-[var(--orion-accent,#38BDF8)]/25 bg-white/[0.18]" 
                        : "border-white/30",
                      errorMsg && "border-red-400/80 ring-4 ring-red-400/25"
                    )}>
                      <div className="pl-4.5 pr-2 flex items-center pointer-events-none text-white/75">
                        <Lock className="w-4 h-4 text-white/75" />
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
                        className="flex-1 bg-transparent border-none text-white text-[14px] sm:text-[15px] placeholder:text-white/60 focus:outline-none focus:ring-0 px-2 font-normal"
                        placeholder={t.enterPassword || "Password"}
                      />

                      {/* Password visibility toggle */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="px-2 text-white/60 hover:text-white transition-colors cursor-pointer"
                        aria-label={showPassword ? t.hidePassword : t.showPassword}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>

                      {/* Circular Action Button [ → ] */}
                      <button
                        type="submit"
                        disabled={isSubmitting || !password.trim()}
                        aria-label={t.enterOrionBtn || "Enter Orion"}
                        title={t.enterOrionBtn || "Enter Orion"}
                        className={cn(
                          "w-[38px] h-[38px] mr-1.5 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer",
                          "text-white shadow-md disabled:opacity-35 disabled:cursor-not-allowed",
                          "bg-[var(--orion-accent,#0284C7)] hover:bg-[var(--orion-accent,#38BDF8)] active:scale-[0.96] hover:scale-[1.04] shadow-[0_0_24px_rgba(37,99,235,0.4)]",
                          "border border-white/30"
                        )}
                      >
                        <span className="sr-only">{t.enterOrionBtn || "Enter Orion"}</span>
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Inline OS Error Feedback */}
                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="mt-3 text-center text-xs text-red-300/90 font-medium tracking-wide flex items-center justify-center gap-1.5"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                          <span>{errorMsg}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Helper Navigation Links: Other User */}
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs select-none">
                      <button
                        type="button"
                        onClick={handleBackToStage1}
                        className="text-white/60 hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-1 px-3 rounded-full hover:bg-white/[0.08]"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>{t.otherUser}</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>

      {/* FOOTER — BOTTOM NATIVE OS BAR */}
      <footer className="relative z-10 w-full px-6 sm:px-10 py-4 sm:py-6 pb-[calc(16px+env(safe-area-inset-bottom,0px))] flex items-center justify-between select-none">
        {/* Bottom Left Subtle Circular Glass Power Button */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              setIsPowerMenuOpen(prev => !prev);
              triggerShutdown();
            }}
            title="Shut Down"
            aria-label="Shut Down"
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] hover:bg-red-950/80 border border-white/10 hover:border-red-500/60 transition-all duration-200 backdrop-blur-2xl cursor-pointer text-white/70 hover:text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.55)] active:scale-95"
          >
            <Power className="w-4 h-4 shrink-0 text-white/70 group-hover:text-red-400 transition-colors" />
            <span className="sr-only">{t.shutDown}</span>
          </button>
        </div>

        {/* Bottom Right Subtle Circular Glass Switch User Button */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleSwitchUser}
            title="Switch User"
            aria-label="Switch User"
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] hover:bg-blue-950/80 border border-white/10 hover:border-blue-500/60 transition-all duration-200 backdrop-blur-2xl cursor-pointer text-white/70 hover:text-blue-400 hover:shadow-[0_0_24px_rgba(59,130,246,0.45)] active:scale-95"
          >
            <User className="w-4 h-4 shrink-0 text-white/70 group-hover:text-blue-400 transition-colors" />
            <span className="sr-only">{t.switchUser}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Login;

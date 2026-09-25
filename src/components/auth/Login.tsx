import React, { useState, useEffect, useRef } from "react";
import { useAuth } from '../../store/AuthContext';
import { userService } from '../../services/userService';
import { useLocation } from "react-router-dom";
import { OrionLiveLoginBackground } from "../brand/OrionLiveLoginBackground";
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

export type SupportedLanguage = 'en' | 'hi' | 'es' | 'de';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

export const AUTH_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    signInTitle: "Sign in to Orion",
    userIdLabel: "User ID",
    userIdPlaceholder: "Username or email",
    continueBtn: "Continue",
    identifying: "Identifying user...",
    userNotFound: "User not found",
    enterPassword: "Password",
    enterOrionBtn: "Enter Orion",
    otherUser: "Other user",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    invalidCredentials: "Invalid password or credentials.",
    switchUser: "Switch User",
    lock: "Lock",
    signOut: "Sign Out",
    restart: "Restart",
    shutDown: "Shut Down",
    selectLanguage: "Select language",
    subtitle: "Enter your User ID to access your workspace"
  },
  hi: {
    signInTitle: "Orion में साइन इन करें",
    userIdLabel: "यूज़र ID",
    userIdPlaceholder: "उपयोगकर्ता नाम या ईमेल",
    continueBtn: "आगे बढ़ें",
    identifying: "उपयोगकर्ता पहचाना जा रहा है...",
    userNotFound: "उपयोगकर्ता नहीं मिला",
    enterPassword: "पासवर्ड",
    enterOrionBtn: "Orion में प्रवेश करें",
    otherUser: "अन्य उपयोगकर्ता",
    rememberMe: "मुझे याद रखें",
    forgotPassword: "पासवर्ड भूल गए?",
    invalidCredentials: "गलत पासवर्ड या क्रेडेंशियल।",
    switchUser: "उपयोगकर्ता बदलें",
    lock: "लॉक करें",
    signOut: "साइन आउट",
    restart: "रीस्टार्ट करें",
    shutDown: "शट डाउन",
    selectLanguage: "भाषा चुनें",
    subtitle: "अपने वर्कस्पेस तक पहुँचने के लिए यूज़र ID दर्ज करें"
  },
  es: {
    signInTitle: "Iniciar sesión en Orion",
    userIdLabel: "ID de usuario",
    userIdPlaceholder: "Nombre de usuario o correo",
    continueBtn: "Continuar",
    identifying: "Identificando usuario...",
    userNotFound: "Usuario no encontrado",
    enterPassword: "Contraseña",
    enterOrionBtn: "Entrar a Orion",
    otherUser: "Otro usuario",
    rememberMe: "Recordarme",
    forgotPassword: "¿Olvidó su contraseña?",
    invalidCredentials: "Contraseña o credenciales incorrectas.",
    switchUser: "Cambiar de usuario",
    lock: "Bloquear",
    signOut: "Cerrar sesión",
    restart: "Reiniciar",
    shutDown: "Apagar",
    selectLanguage: "Seleccionar idioma",
    subtitle: "Ingrese su ID de usuario para acceder a su espacio de trabajo"
  },
  de: {
    signInTitle: "Anmelden bei Orion",
    userIdLabel: "Benutzer-ID",
    userIdPlaceholder: "Benutzername oder E-Mail",
    continueBtn: "Weiter",
    identifying: "Benutzer wird identifiziert...",
    userNotFound: "Benutzer nicht gefunden",
    enterPassword: "Passwort",
    enterOrionBtn: "Orion betreten",
    otherUser: "Anderer Benutzer",
    rememberMe: "Angemeldet bleiben",
    forgotPassword: "Passwort vergessen?",
    invalidCredentials: "Ungültiges Passwort oder Anmeldedaten.",
    switchUser: "Benutzer wechseln",
    lock: "Sperren",
    signOut: "Abmelden",
    restart: "Neustarten",
    shutDown: "Herunterfahren",
    selectLanguage: "Sprache auswählen",
    subtitle: "Geben Sie Ihre Benutzer-ID ein, um auf Ihren Arbeitsbereich zuzugreifen"
  },
};

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

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('orion-database-environment-changed', handleEnvChange);
    };
  }, []);

  // Language & Power Menu dropdown state
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orion_language') as SupportedLanguage;
      if (saved && AUTH_TRANSLATIONS[saved]) return saved;
    }
    return 'en';
  });
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const powerMenuRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  const t = AUTH_TRANSLATIONS[currentLang] || AUTH_TRANSLATIONS.en;

  // Save selected language to localStorage
  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    setCurrentLang(langCode);
    setIsLangMenuOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('orion_language', langCode);
    }
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
      if (powerMenuRef.current && !powerMenuRef.current.contains(e.target as Node)) {
        setIsPowerMenuOpen(false);
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
      const found = userService.getUserByIdentifier(cleanId);
      
      // Simulate slight realistic OS network delay (150-300ms)
      await new Promise(res => setTimeout(res, 200));

      if (found) {
        setResolvedUser(found);
        setStage(2);
        setErrorMsg("");
      } else {
        // Fallback check for standard demo identities if user matches admin/user keywords
        const lower = cleanId.toLowerCase();
        if (lower === 'admin' || lower === 'user') {
          const fallbackUser: UserProfile = {
            id: lower === 'admin' ? 'local-admin' : 'local-user',
            username: lower,
            displayName: lower === 'admin' ? 'Orion-9 Administrator' : 'Orion-9 User',
            fullName: lower === 'admin' ? 'Orion-9 Administrator' : 'Orion-9 User',
            email: `${lower}@orion.network`,
            role: lower === 'admin' ? 'platform_admin' : 'user',
            status: 'active',
            organizationId: 'ORION_PLATFORM',
            organizationName: 'ORION_PLATFORM',
            onboardingCompleted: true,
          };
          setResolvedUser(fallbackUser);
          setStage(2);
          setErrorMsg("");
        } else {
          setErrorMsg(t.userNotFound);
        }
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
      const from = (rawFrom && !rawFrom.startsWith('/admin')) ? rawFrom : "/";
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

  // Power Menu — Switch User Action
  const handleSwitchUser = () => {
    setIsPowerMenuOpen(false);
    signOut();
    handleBackToStage1();
    setUsername("");
  };

  return (
    <div 
      className="w-screen h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden font-sans relative selection:bg-blue-500/30 bg-[#02050a] text-white"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && stage === 2) {
          handleBackToStage1();
        }
      }}
    >
      
      {/* Subtle Live Orion Star Environment Background */}
      <OrionLiveLoginBackground 
        authState={authState}
        isInputFocused={isInputFocused} 
        isTyping={isTyping}
      />

      {/* Header — Top Bar */}
      <header className="relative z-10 w-full flex items-center justify-between px-8 py-6 select-none">
        {/* Top Left OS Branding & Environment Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3.5">
            <img 
              src="/orion-9-brand-logo.png" 
              alt="Orion-9 Logo" 
              className="h-8 w-auto drop-shadow-[0_0_12px_rgba(59,130,246,0.5)] orion-brand-image" 
            />
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-wider leading-none drop-shadow-sm">
                ORION-9
              </span>
              <span className="text-white/60 text-[9.5px] uppercase tracking-[0.25em] font-medium mt-1">
                SUPPLY CHAIN OPERATING SYSTEM
              </span>
            </div>
          </div>

          {/* Authoritative Environment Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] font-mono select-none">
            <span className={`w-2 h-2 rounded-full animate-pulse ${dbEnv === 'DEMO' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'}`} />
            <span className="text-white/90 font-semibold tracking-wider">{dbEnv} MODE</span>
          </div>
        </div>
        
        {/* Top Right Functional Language Selector Dropdown */}
        <div className="relative" ref={langMenuRef}>
          <div 
            role="button"
            tabIndex={0}
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsLangMenuOpen(!isLangMenuOpen);
              }
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur-md transition-all duration-200 cursor-pointer text-white/90 hover:text-white text-xs font-medium group shadow-lg"
            aria-label={t.selectLanguage}
            aria-expanded={isLangMenuOpen}
          >
            <Globe className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
            <span>{SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.nativeName || 'English'}</span>
            <ChevronDown className={`w-3 h-3 text-white/50 group-hover:text-white transition-transform duration-200 ml-0.5 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Language Menu Dropdown */}
          {isLangMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-[#090d16]/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-xl py-1.5 z-50 text-xs animate-fadeIn">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-white/10 transition-colors ${
                    currentLang === lang.code ? 'text-blue-400 font-semibold bg-white/5' : 'text-white/80'
                  }`}
                >
                  <span>{lang.nativeName}</span>
                  <span className="text-[10px] text-white/40 uppercase">{lang.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content — Clean Floating Authentication Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full my-auto">
        
        <div className="backdrop-blur-2xl bg-[#090d16]/75 border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.85)] rounded-2xl p-8 max-w-[380px] w-full mx-4 relative overflow-hidden transition-all duration-300">
          
          {/* STAGE 1: USER ID STAGE */}
          {stage === 1 && (
            <div className="animate-fadeIn">
              <div className="flex flex-col items-center justify-center mb-6 select-none text-center">
                <h1 className="text-white font-bold tracking-wide text-xl">
                  {t.signInTitle}
                </h1>
                <p className="text-white/60 text-xs font-normal mt-1.5 max-w-[260px]">
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
                  <label htmlFor="username" className="block text-xs font-medium text-white/70 mb-1.5 select-none">
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
                      className="w-full pl-10 pr-4 py-3 bg-[#111622]/90 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all shadow-inner"
                      placeholder={t.userIdPlaceholder}
                    />
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  type="submit"
                  disabled={isIdentifying}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:from-blue-700 active:to-blue-600 text-white font-medium text-sm transition-all duration-200 rounded-xl shadow-[0_0_25px_rgba(37,99,235,0.45)] disabled:opacity-50 cursor-pointer border border-blue-400/40 flex items-center justify-center gap-2 mt-2"
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
            <div className="animate-fadeIn">
              {/* Resolved User Photo & Name Display */}
              <div className="flex flex-col items-center justify-center mb-6 select-none text-center">
                {/* 72-96px Avatar Photo */}
                <div className="w-20 h-20 rounded-full border-2 border-white/20 shadow-xl bg-[#111622] flex items-center justify-center overflow-hidden mb-3.5 backdrop-blur-md">
                  {resolvedUser?.avatarUrl || (resolvedUser as any)?.photoURL ? (
                    <img 
                      src={resolvedUser?.avatarUrl || (resolvedUser as any)?.photoURL} 
                      alt={resolvedUser?.displayName || username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white/80" />
                  )}
                </div>

                {/* Display Name & Username Handle */}
                <h2 className="text-white font-bold tracking-wide text-lg leading-tight">
                  {resolvedUser?.displayName || resolvedUser?.fullName || username}
                </h2>
                <span className="text-white/60 text-xs font-mono mt-0.5">
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
                  <label htmlFor="password" className="block text-xs font-medium text-white/70 mb-1.5 select-none">
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
                      className="w-full pl-10 pr-10 py-3 bg-[#111622]/90 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all shadow-inner"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {/* Enter Orion Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:from-blue-700 active:to-blue-600 text-white font-medium text-sm transition-all duration-200 rounded-xl shadow-[0_0_25px_rgba(37,99,235,0.45)] disabled:opacity-50 cursor-pointer border border-blue-400/40 flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.identifying}</span>
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
                  
                  <a href="#" className="text-white/60 hover:text-white transition-colors">
                    {t.forgotPassword}
                  </a>
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
      </main>

      {/* Footer — Bottom Bar */}
      <footer className="relative z-10 w-full px-8 py-6 flex items-center justify-between select-none">
        
        {/* Bottom Left Power Button & OS Session Power Menu + Telemetry */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={powerMenuRef}>
            <button
              type="button"
              onClick={() => setIsPowerMenuOpen(!isPowerMenuOpen)}
              title="Shut Down"
              aria-label="Shut Down"
              aria-expanded={isPowerMenuOpen}
              className="group flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-red-950/80 border border-white/15 hover:border-red-500/60 transition-all duration-300 backdrop-blur-md shadow-md cursor-pointer text-white/70 hover:text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.55)]"
            >
              <Power className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
            </button>

            {/* OS Power / Session Menu Popup */}
            {isPowerMenuOpen && (
              <div className="absolute bottom-12 left-0 w-48 bg-[#090d16]/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-xl py-1.5 z-50 text-xs animate-fadeIn">
                <button
                  type="button"
                  onClick={handleSwitchUser}
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>{t.switchUser}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsPowerMenuOpen(false); triggerLock(); }}
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>{t.lock}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsPowerMenuOpen(false); signOut(); }}
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-orange-400" />
                  <span>{t.signOut}</span>
                </button>

                <div className="my-1 border-t border-white/10" />

                <button
                  type="button"
                  onClick={() => { setIsPowerMenuOpen(false); triggerRestart(); }}
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span>{t.restart}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsPowerMenuOpen(false); triggerShutdown(); }}
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-medium"
                >
                  <Power className="w-4 h-4 text-red-400" />
                  <span>{t.shutDown}</span>
                </button>
              </div>
            )}
          </div>

          {/* Live Control Plane Runtime Telemetry */}
          <div className="hidden md:flex flex-col text-[10.5px] font-mono text-white/50 space-y-0.5 select-none">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/80 font-semibold tracking-wider">CONTROL PLANE</span>
              <span className="text-white/30">•</span>
              <span className="text-emerald-400 font-semibold">{systemHealth.runtimeStatus}</span>
              <span className="text-white/30">•</span>
              <span className="text-blue-400">{systemHealth.latencyMs}ms</span>
            </div>
            {systemHealth.activeBatchInfo && (
              <div className="text-white/40 truncate max-w-xs text-[10px]">
                {systemHealth.activeBatchInfo}
              </div>
            )}
          </div>
        </div>

        {/* System Subsystems Readiness Status Chips */}
        <div className="hidden lg:flex items-center gap-3 text-[10.5px] font-mono text-white/60 select-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 backdrop-blur-md">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Auth: <strong className="text-white/90">{systemHealth.authStatus}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 backdrop-blur-md">
            <Database className="w-3 h-3 text-blue-400" />
            <span>DB: <strong className="text-white/90">{systemHealth.dbStatus}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 backdrop-blur-md">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>Kernel: <strong className="text-white/90">{systemHealth.controlPlane}</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

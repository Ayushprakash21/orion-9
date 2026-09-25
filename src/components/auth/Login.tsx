import React, { useState } from "react";
import { useAuth } from '../../store/AuthContext';
import { useLocation } from "react-router-dom";
import { OrionLiveLoginBackground } from "../brand/OrionLiveLoginBackground";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  User,
  Lock,
  Globe,
  ChevronDown,
  Power
} from "lucide-react";

export const Login: React.FC = () => {
  const { login, triggerShutdown } = useAuth();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = React.useRef<any>(null);

  const handleInputChange = () => {
    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1200);
  };

  const authState = isSubmitting
    ? 'SIGNING_IN'
    : errorMsg
    ? 'ERROR'
    : isTyping
    ? 'TYPING'
    : isInputFocused
    ? 'FOCUSED'
    : 'INITIAL';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !username.trim() || !password || !password.trim()) {
      setErrorMsg("Please enter both username and password.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const rawFrom = (location.state as any)?.from?.pathname;
      const from = (rawFrom && !rawFrom.startsWith('/admin')) ? rawFrom : "/";
      await login(username, password, { destination: from });
    } catch (err: any) {
      console.warn("Login error:", err.message);
      setErrorMsg(err.message || "Invalid credentials or authentication error.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-screen h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden font-sans relative selection:bg-blue-500/30 bg-[#02050a] text-white">
      
      {/* Subtle Live Orion Star Environment Background */}
      <OrionLiveLoginBackground 
        authState={authState}
        isInputFocused={isInputFocused} 
        isTyping={isTyping}
      />

      {/* Header — Top Bar */}
      <header className="relative z-10 w-full flex items-center justify-between px-8 py-6 select-none">
        {/* Top Left Branding */}
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
        
        {/* Top Right Language Selector */}
        <div 
          role="button"
          tabIndex={0}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur-md transition-all duration-200 cursor-pointer text-white/90 hover:text-white text-xs font-medium group shadow-lg"
          aria-label="Select language"
        >
          <Globe className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
          <span>English</span>
          <ChevronDown className="w-3 h-3 text-white/50 group-hover:text-white transition-colors ml-0.5" />
        </div>
      </header>

      {/* Main Content — Floating Center Authentication Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full my-auto">
        
        <div className="backdrop-blur-2xl bg-[#090d16]/70 border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.85)] rounded-2xl p-8 max-w-[400px] w-full mx-4 relative overflow-hidden transition-all duration-300">
          
          {/* Card Top Brand & Greeting */}
          <div className="flex flex-col items-center justify-center mb-7 select-none">
            <img 
              src="/orion-9-brand-logo.png" 
              alt="Orion-9" 
              className="h-10 w-auto mb-2.5 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
            />
            <span className="text-white font-extrabold tracking-[0.25em] text-lg leading-tight">
              ORION - 9
            </span>
            <span className="text-white/60 text-xs font-normal mt-1 tracking-wide">
              Welcome back
            </span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-white text-xs flex items-start gap-2 font-medium backdrop-blur-md animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {/* Username Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <User className="w-4 h-4" />
              </div>
              <input
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
                className="w-full pl-10 pr-4 py-3 bg-[#111622]/80 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all shadow-inner"
                placeholder="user"
              />
            </div>
            
            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Lock className="w-4 h-4" />
              </div>
              <input
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
                className="w-full pl-10 pr-10 py-3 bg-[#111622]/80 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all shadow-inner"
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
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:from-blue-700 active:to-blue-600 text-white font-medium text-sm transition-all duration-200 rounded-xl shadow-[0_0_25px_rgba(37,99,235,0.45)] disabled:opacity-50 cursor-pointer border border-blue-400/40 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Enter Orion</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Bottom Form Links */}
            <div className="flex items-center justify-between pt-1.5 select-none">
              <label className="flex items-center gap-2 cursor-pointer group text-white/70 hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-blue-600"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-xs font-normal">Remember me</span>
              </label>
              
              <a href="#" className="text-white/60 hover:text-white text-xs font-normal transition-colors">
                Forgot password?
              </a>
            </div>
          </form>
          
        </div>
      </main>

      {/* Footer — Bottom Bar */}
      <footer className="relative z-10 w-full px-8 py-6 flex items-center justify-between select-none">
        
        {/* Bottom Left Power Control Button with Hover Red Glow */}
        <button
          type="button"
          onClick={triggerShutdown}
          title="Shut Down"
          aria-label="Shut Down"
          className="group flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-red-950/80 border border-white/15 hover:border-red-500/60 transition-all duration-300 backdrop-blur-md shadow-md cursor-pointer text-white/70 hover:text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.55)]"
        >
          <Power className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
        </button>

        {/* Bottom Right Legal Links */}
        <div className="flex items-center gap-3 text-white/50 text-xs font-normal">
          <a href="#" className="hover:text-white/90 transition-colors">Privacy</a>
          <span className="text-white/30">|</span>
          <a href="#" className="hover:text-white/90 transition-colors">Terms</a>
          <span className="text-white/30">|</span>
          <a href="#" className="hover:text-white/90 transition-colors">Help</a>
        </div>
      </footer>
    </div>
  );
};

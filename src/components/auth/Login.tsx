import React, { useState } from "react";
import { useAuth } from '../../store/AuthContext';
import { useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  User,
  Lock,
  Globe,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
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
    <div className="w-screen h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden font-sans relative selection:bg-blue-500/30">
      
      {/* Background Image & Vignette */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/orion-login-wallpaper.jpg")' }}
      >
        <div className="absolute inset-0 bg-black/40 sm:bg-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 w-full flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="/orion-9-brand-logo.png" alt="Orion-9 Logo" className="h-9 w-auto drop-shadow-md" />
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg leading-tight tracking-wide drop-shadow-sm">ORION-9</span>
            <span className="text-white/80 text-[10px] uppercase tracking-widest font-medium drop-shadow-sm">Supply Chain Operating System</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-colors cursor-pointer text-white text-xs font-medium">
          <Globe className="w-4 h-4" />
          <span>English ⌄</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full">
        
        {/* Center Hero */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-7xl font-light text-white drop-shadow-lg mb-4 tracking-tight">Orion-9</h1>
          <p className="tracking-[0.3em] text-white/80 text-xs sm:text-sm font-medium uppercase drop-shadow-md">
            A   S M A R T E R   S U P P L Y   C H A I N   W O R L D
          </p>
        </div>

        {/* Center Card */}
        <div className="backdrop-blur-xl bg-white/20 dark:bg-black/30 border border-white/30 dark:border-white/15 shadow-2xl rounded-2xl p-8 max-w-md w-full mx-4">
          
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-md">
              <User className="w-8 h-8 text-white/90" />
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-white text-xs flex items-start gap-2 font-medium backdrop-blur-md">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {/* Username */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/60">
                <User className="w-5 h-5" />
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
                  if (errorMsg) setErrorMsg("");
                }}
                className="w-full pl-11 pr-4 py-3.5 bg-white/40 dark:bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/50 focus:border-white/50 transition-all shadow-sm"
                placeholder="Username or email"
              />
            </div>
            
            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/60">
                <Lock className="w-5 h-5" />
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
                  if (errorMsg) setErrorMsg("");
                }}
                className="w-full pl-11 pr-11 py-3.5 bg-white/40 dark:bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/50 focus:border-white/50 transition-all shadow-sm"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/60 hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-sm transition-all duration-200 rounded-xl shadow-lg disabled:opacity-50 cursor-pointer border border-blue-400/50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Bottom Form Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4 rounded border border-white/40 bg-white/10 group-hover:bg-white/20 transition-colors">
                  <input 
                    type="checkbox" 
                    className="absolute opacity-0 cursor-pointer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  {rememberMe && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
                <span className="text-white text-xs font-medium">Remember me</span>
              </label>
              
              <a href="#" className="text-white/80 hover:text-white text-xs font-medium transition-colors">
                Forgot password?
              </a>
            </div>
          </form>
          
        </div>
      </main>

      {/* Bottom Bar */}
      <footer className="relative z-10 w-full px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={triggerShutdown}
            title="Shut Down"
            className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/80 border border-white/20 transition-all duration-200 backdrop-blur-md shadow-md cursor-pointer text-white/80 hover:text-white"
          >
            <Power className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 text-white/70 text-[11px] uppercase tracking-wider font-medium">
            <span>Built for a More Resilient Tomorrow</span>
            <div className="w-12 h-px bg-white/20 hidden sm:block" />
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-white/70 text-xs font-medium">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <span className="text-white/30">|</span>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <span className="text-white/30">|</span>
          <a href="#" className="hover:text-white transition-colors">Help</a>
        </div>
      </footer>
    </div>
  );
};

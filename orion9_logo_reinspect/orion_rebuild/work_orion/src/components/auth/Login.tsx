import React, { useState, useEffect } from "react";
import { useAuth } from '../../store/AuthContext';
import { useBranding } from '../../store/BrandingContext';
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "../brand/BrandLogo";
import { ScmNetworkTwin } from "./ScmNetworkTwin";

export const Login: React.FC = () => {
  const { login, isAuthenticated, isPostLoginInitializing } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  

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
      // Post-login initialization is handled authoritatively by AppBootstrap above Login.
    } catch (err: any) {
      console.warn("Login error:", err.message);
      setErrorMsg(err.message || "Invalid credentials or authentication error.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-screen h-[100dvh] max-h-[100dvh] bg-os-bg text-os-text-primary flex flex-col md:flex-row overflow-hidden font-sans relative selection:bg-[#00F2FE]/30">
      
      {/* LEFT PANEL: AUTHENTICATION & ORION SCM IDENTITY */}
      <div className="w-full md:w-[420px] lg:w-[460px] xl:w-[480px] h-full min-h-0 flex flex-col relative z-20 bg-os-bg border-b md:border-b-0 md:border-r border-os-border shrink-0 overflow-hidden">
        
        {/* TOP SAFE AREA */}
        <div className="w-full h-6 sm:h-8 lg:h-10 shrink-0" />

        {/* MAIN COMPOSITION (BRANDING + FORM) */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-4 w-full max-w-[380px] mx-auto">
          
          {/* BRANDING ZONE */}
          <div className="flex flex-col items-center text-center">
            <BrandLogo sizePreset="hero" variant="full-descriptor" className="flex-col items-center justify-center gap-4" />
            <p className="text-[11px] sm:text-xs text-os-text-muted mt-5 font-sans tracking-wide">
              Sign in to your supply chain operating system.
            </p>
          </div>
          
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-7" />

          {/* FORM ZONE */}
          <div className="w-full">
            <div className="text-center mb-6">
              <div className="text-base sm:text-lg font-bold tracking-[0.14em] text-white uppercase mb-2">
                USER
              </div>
              <h2 className="text-sm sm:text-base font-medium tracking-[0.2em] text-white/95 uppercase">
                WELCOME BACK
              </h2>
            </div>
            
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              
              <div>
                <label
                  htmlFor="username"
                  className="block text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-os-text-secondary font-semibold mb-1.5 text-left"
                >
                  USERNAME OR EMAIL
                </label>
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
                  className="w-full px-3.5 py-3 bg-[#111622] border border-[#202938] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-all font-mono"
                  placeholder="Enter username or email"
                />
              </div>
              
              <div>
                <label
                  htmlFor="password"
                  className="block text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-os-text-secondary font-semibold mb-1.5 text-left"
                >
                  PASSWORD
                </label>
                <div className="relative">
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
                    className="w-full px-3.5 py-3 bg-[#111622] border border-[#202938] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-all font-mono pr-11"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-os-text-muted hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-[#00F2FE] hover:bg-[#38BDF8] active:bg-[#0284C7] text-black font-bold text-xs tracking-widest uppercase transition-all duration-200 rounded-lg shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_25px_rgba(0,242,254,0.5)] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AUTHENTICATING...</span>
                    </>
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
        </div>

        {/* BOTTOM NAVIGATION BAR: USER LOGIN (LEFT) & ADMIN CONSOLE (RIGHT) */}
        <div className="w-full min-h-[64px] p-3 sm:p-4 lg:p-6 flex items-center justify-between shrink-0 border-t border-white/5">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-mono font-bold tracking-widest uppercase text-os-text-secondary hover:text-white bg-os-surface/90 hover:bg-os-surface rounded-xl border border-os-border hover:border-[#00F2FE]/50 shadow-lg backdrop-blur-md transition-all cursor-pointer"
          >
            <span>ADMIN CONSOLE</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* RIGHT PANEL: SUPPLY CHAIN DIGITAL TWIN / NETWORK VISUALIZATION */}
      <div className="hidden md:flex flex-1 relative bg-[#06080D] overflow-hidden select-none flex-col">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #1a2332 1px, transparent 1px), linear-gradient(to bottom, #1a2332 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Ambient atmospheric lighting */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#00F2FE]/[0.03] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-sky-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

        {/* The Digital Twin Network Component */}
        <ScmNetworkTwin variant="desktop" mode="user" className="flex-1" />
      </div>
    </div>
  );
};

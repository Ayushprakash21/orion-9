import React, { useState, useEffect } from "react";
import { useAuth } from '../../store/AuthContext';
import { useBranding } from '../../store/BrandingContext';
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Lock,
  User,
  CheckCircle2,
} from "lucide-react";
import { AdminPlatformControlTwin } from "./AdminPlatformControlTwin";

export const AdminLogin: React.FC = () => {
  const { login, isAuthenticated, hasRole, isPostLoginInitializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticatingSuccess, setIsAuthenticatingSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<"username" | "password" | null>(null);

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg("Please enter both administrator username and password.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const rawFrom = (location.state as any)?.from?.pathname;
      const from = (rawFrom && rawFrom.startsWith('/admin')) ? rawFrom : "/admin";
      await login(username, password, {
        destination: from,
        requiredRoles: ["platform_admin", "organization_admin"],
      });
      // Authoritative 5-second ORION initialization is now handled globally in AppBootstrap
      setIsAuthenticatingSuccess(true);
    } catch (err: any) {
      console.warn("Admin login error:", err.message);
      setErrorMsg(err.message || "Authentication failed. Verify administrator credentials.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-screen h-[100dvh] max-h-[100dvh] bg-os-bg text-os-text-primary flex flex-col lg:flex-row overflow-hidden font-sans relative selection:bg-os-accent/30">
      {/* ========================================================================= */}
      {/* MAIN LEFT AREA (~68-70% ON DESKTOP): IMMERSIVE ORION-9 CONTROL PLANE */}
      {/* ========================================================================= */}
      <div className="flex-1 min-w-0 h-full min-h-0 relative bg-os-bg overflow-hidden select-none flex flex-col border-b lg:border-b-0 lg:border-r border-os-border">
        <AdminPlatformControlTwin
          variant="desktop"
          focusedField={focusedField}
          isAuthenticatingSuccess={isAuthenticatingSuccess}
          className="flex-1"
        />

      </div>

      {/* ========================================================================= */}
      {/* RIGHT AUTHENTICATION AREA (~30-32%): PLATFORM ADMINISTRATION LOGIN CARD   */}
      {/* EXACTLY MATCHING THE USER'S PROVIDED SCREENSHOT                           */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[380px] xl:w-[420px] 2xl:w-[450px] h-full min-h-0 flex flex-col relative z-20 bg-os-bg justify-center overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 xl:px-10 py-10 w-full max-w-[420px] mx-auto">
          {/* Card Container with subtle cyan border and rounded-2xl corners */}
          <div className="rounded-2xl bg-os-surface/95 border border-[#17263C] p-7 sm:p-8 xl:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            {/* Top Pill Badge: PLATFORM ADMIN */}
            <div className="flex items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-os-accent/10 border border-os-accent/30 text-os-accent text-xs font-mono font-bold tracking-widest uppercase">
                <ShieldCheck className="w-4 h-4 text-os-accent" />
                <span>PLATFORM ADMIN</span>
              </div>
            </div>

            {/* Heading matching screenshot */}
            <div className="text-left mb-6">
              <h2 className="text-2xl sm:text-3xl font-light tracking-[0.06em] text-white uppercase leading-tight font-sans">
                PLATFORM
                <br />
                ADMINISTRATION
              </h2>
              <p className="text-xs sm:text-sm text-os-text-muted mt-2 font-sans font-normal leading-relaxed">
                Secure access to the Orion-9 control plane.
              </p>
            </div>

            {/* Authentication Form */}
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 font-mono animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Field 1: ADMINISTRATOR IDENTITY */}
              <div>
                <label
                  htmlFor="admin-identity"
                  className="block text-[11px] font-mono uppercase tracking-wider text-os-text-secondary font-semibold mb-2 text-left"
                >
                  ADMINISTRATOR IDENTITY
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-os-text-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-identity"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    className="w-full pl-10 pr-3.5 py-3 bg-os-input-bg border border-os-border rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-all font-mono"
                    placeholder="Enter admin username"
                  />
                </div>
              </div>

              {/* Field 2: PASSWORD */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-[11px] font-mono uppercase tracking-wider text-os-text-secondary font-semibold mb-2 text-left"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-os-text-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    className="w-full pl-10 pr-12 py-3 bg-os-input-bg border border-os-border rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F2FE] focus:ring-1 focus:ring-[#00F2FE] transition-all font-mono"
                    placeholder="Enter admin password"
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

              {/* CTA Action Button: ENTER CONTROL PLANE -> */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isAuthenticatingSuccess}
                  className="group w-full h-12 flex items-center justify-center gap-2 bg-os-accent hover:bg-[#38BDF8] active:bg-[#0284C7] text-black font-bold text-xs tracking-widest uppercase transition-all duration-200 rounded-lg shadow-[0_0_24px_rgba(0,242,254,0.35)] hover:shadow-[0_0_32px_rgba(0,242,254,0.55)] hover:brightness-105 disabled:opacity-50 cursor-pointer"
                >
                  {isAuthenticatingSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black animate-bounce" />
                      <span>ENTERING CONTROL PLANE...</span>
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>AUTHENTICATING IDENTITY...</span>
                    </>
                  ) : (
                    <>
                      <span>ENTER CONTROL PLANE</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* RESTRICTED ACCESS DISCLOSURE MATCHING SCREENSHOT EXACTLY */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3.5 text-left">
              <div className="w-8 h-8 rounded-lg bg-os-accent/10 border border-os-accent/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-os-accent" />
              </div>
              <div className="font-mono">
                <div className="text-[10px] font-bold text-white tracking-wider uppercase">
                  RESTRICTED ACCESS
                </div>
                <div className="text-[8.5px] text-os-text-muted tracking-wider uppercase">
                  AUTHORIZED ADMINISTRATORS ONLY
                </div>
                <div className="text-[8px] text-slate-500 tracking-widest uppercase">
                  ENCRYPTED ADMINISTRATIVE CHANNEL
                </div>
              </div>
            </div>
          </div>

          {/* USER LOGIN — RIGHT AUTH RAIL, BOTTOM, BELOW THE ADMIN CARD */}
          <div className="w-full flex justify-center pt-5 pb-1 shrink-0">
            <Link
              to="/login"
              replace
              className="inline-flex items-center justify-center gap-2 min-w-[190px] px-5 py-3 rounded-xl border border-os-border bg-os-surface/90 text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-os-text-secondary hover:text-white hover:border-os-accent/60 hover:bg-os-surface transition-all duration-200 shadow-lg backdrop-blur-md"
              aria-label="Return to User Login"
            >
              <span aria-hidden="true">←</span>
              <span>USER LOGIN</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

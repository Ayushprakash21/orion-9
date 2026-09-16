const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowRight, Activity, Shield, Database, Cpu, Network, FileKey, Zap } from 'lucide-react';
import { AppLogo } from '../brand/AppLogo';
import { authService } from '../../services/authService';
import { LoadingScreen } from '../LoadingScreen';
import { brandingRepository } from '../../repositories/BrandingRepository';
import { cn } from '../../lib/utils';

export const AdminLogin = () => {
  const { isAuthenticated, isLoading, profile, login, signIn } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [appName] = useState(() => {
    const config = brandingRepository.getBrandingSync();
    return config.applicationName || config.appName || 'Orion SCM OS';
  });

  if (isLoading) {
    return <LoadingScreen message="LOADING WORKSPACE..." />;
  }

  if (isAuthenticated) {
    if (profile?.role === 'platform_admin' || profile?.role === 'organization_admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!username.trim()) {
      setErrorMsg('Enter your username or email.');
      return;
    }
    if (!password) {
      setErrorMsg('Enter your password.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const loginMethod = login || signIn;
      const userProfile = await loginMethod(username, password);
      if (userProfile.role === 'platform_admin' || userProfile.role === 'organization_admin') {
        navigate('/admin', { replace: true });
      } else {
        setErrorMsg('Access denied. Administrator privileges required.');
        await authService.logout();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const center = { x: 400, y: 400 };
  const radius = 220;
  const nodes = [
    { label: "DATA FABRIC", icon: Database },
    { label: "AI / GEMINI", icon: Cpu },
    { label: "DECISION ENGINE", icon: Zap },
    { label: "WORKFLOW ENGINE", icon: Activity },
    { label: "INTEGRATIONS", icon: Network },
    { label: "AUDIT", icon: FileKey },
    { label: "SECURITY", icon: Shield }
  ].map((node, i, arr) => {
    const angle = (i * 360) / arr.length - 90;
    const rad = (angle * Math.PI) / 180;
    return {
      ...node,
      x: center.x + radius * Math.cos(rad),
      y: center.y + radius * Math.sin(rad),
    };
  });

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#080A0B] text-[#E8E8E5] font-sans selection:bg-cyan-900/30">
      
      {/* LEFT PANEL: AUTHENTICATION */}
      <div className="w-full md:w-[50%] lg:w-[45%] xl:w-[42%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative z-10 shrink-0 border-b md:border-b-0 md:border-r border-[#282C2F] bg-[#080A0B]">
        
        {/* TOP: LOGO */}
        <div className="flex items-center gap-3">
          <AppLogo size={32} variant="mark" />
        </div>

        {/* MIDDLE: AUTH FORM */}
        <div className="w-full max-w-[400px] mx-auto mt-16 md:mt-0 flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#101214] border border-[#282C2F] mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                Platform Admin
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-light tracking-tight text-[#E8E8E5] mb-2 uppercase">
              Platform Administration
            </h1>
            <p className="text-sm text-[#9A9D9F]">
              Secure access to the Orion platform control plane.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md text-xs">
                <span className="font-bold uppercase tracking-wider block mb-0.5 text-[10px]">Administrative Access Denied</span>
                {errorMsg}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="block text-[11px] font-mono tracking-widest text-[#9A9D9F] mb-1.5 uppercase">
                Username or Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-4 py-3 bg-[#101214] border border-[#282C2F] rounded-md shadow-sm placeholder-[#6F6F6F] focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm text-[#E8E8E5] transition-colors"
                placeholder="Enter administrator username or email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-mono tracking-widest text-[#9A9D9F] mb-1.5 uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-[#101214] border border-[#282C2F] rounded-md shadow-sm placeholder-[#6F6F6F] focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 sm:text-sm text-[#E8E8E5] transition-colors pr-10"
                  placeholder="Enter administrator password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9A9D9F] hover:text-[#E8E8E5] focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full group flex items-center justify-between py-3 px-4 rounded-md shadow-sm text-xs font-bold font-mono tracking-widest text-black bg-[#E8E8E5] hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080A0B] focus:ring-[#E8E8E5] disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In To Admin Console'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />}
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            </div>
            
            <div className="mt-6 flex items-start gap-3 p-3 rounded-md bg-[#101214] border border-[#282C2F]">
              <div className="mt-0.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">Secure Administrative Access</div>
                <div className="text-xs text-[#9A9D9F] mt-0.5">Platform authorization required</div>
              </div>
            </div>
          </form>
        </div>

        {/* BOTTOM: BRANDING */}
        <div className="mt-16 md:mt-0 text-center">
          <div className="text-sm tracking-[0.2em] font-medium text-[#E8E8E5] uppercase">{appName}</div>
          <div className="text-[10px] tracking-widest text-[#9A9D9F] font-mono uppercase mt-1">Platform Control Plane</div>
        </div>
      </div>

      {/* RIGHT PANEL: VISUALIZATION */}
      <div className="hidden md:flex flex-1 flex-col relative bg-[#0a0c0e] overflow-hidden">
        
        {/* Background Grid */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(to right, #282C2F 1px, transparent 1px), linear-gradient(to bottom, #282C2F 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.1
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#0a0c0e_70%)]" />

        {/* Status Overlay */}
        <div className="absolute top-8 right-8 z-20 flex flex-col gap-2">
          <div className="text-[10px] font-mono tracking-widest text-[#9A9D9F] uppercase mb-2">Platform Status</div>
          {['Core Operational', 'Authentication Ready', 'AI Engine Ready'].map((status, i) => (
            <div key={i} className="flex items-center gap-2 bg-[#101214]/80 backdrop-blur border border-[#282C2F] px-3 py-1.5 rounded text-xs text-[#E8E8E5] font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="uppercase tracking-wider">{status}</span>
            </div>
          ))}
        </div>

        {/* Control Plane Info Overlay */}
        <div className="absolute bottom-8 left-8 z-20 w-64">
          <div className="bg-[#101214]/80 backdrop-blur border border-[#282C2F] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#282C2F] bg-[#151719]/80">
              <div className="text-[10px] font-mono tracking-widest text-[#9A9D9F] uppercase">Admin Control Plane</div>
            </div>
            <div className="p-2 flex flex-col gap-1">
              {['Authentication', 'Authorization', 'Audit', 'Policy', 'Agents', 'Integrations'].map((item) => (
                <div key={item} className="px-2 py-1.5 text-xs text-[#E8E8E5] font-mono uppercase tracking-wider flex items-center justify-between hover:bg-[#282C2F]/50 rounded cursor-default transition-colors">
                  <span>{item}</span>
                  <div className="w-1 h-1 rounded-full bg-[#9A9D9F]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SVG Network */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <svg viewBox="0 0 800 800" className="w-full h-full max-w-[800px] max-h-[800px] opacity-70">
            <defs>
              <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
              <filter id="blur">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>

            {/* Connections */}
            {nodes.map((node, i) => (
              <g key={\`line-\${i}\`}>
                {/* Base Line */}
                <line x1={center.x} y1={center.y} x2={node.x} y2={node.y} stroke="#282C2F" strokeWidth="1" strokeDasharray="4 4" />
                {/* Data Pulses */}
                <circle cx={center.x} cy={center.y} r="2" fill="#22d3ee">
                  <animate attributeName="cx" values={\`\${center.x};\${node.x}\`} dur={\`\${3 + (i % 3)}s\`} repeatCount="indefinite" />
                  <animate attributeName="cy" values={\`\${center.y};\${node.y}\`} dur={\`\${3 + (i % 3)}s\`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur={\`\${3 + (i % 3)}s\`} repeatCount="indefinite" />
                </circle>
              </g>
            ))}

            {/* Outer Nodes */}
            {nodes.map((node, i) => (
              <g key={\`node-\${i}\`} transform={\`translate(\${node.x}, \${node.y})\`}>
                <circle r="24" fill="#101214" stroke="#282C2F" strokeWidth="1" />
                <circle r="20" fill="#151719" />
                <g fill="#9A9D9F" opacity="0.6" transform="translate(-10, -10)">
                  <node.icon width="20" height="20" strokeWidth="1.5" />
                </g>
                <text y="40" textAnchor="middle" fill="#9A9D9F" fontSize="10" fontFamily="monospace" letterSpacing="1">{node.label}</text>
                
                {/* Subtle pulse on nodes */}
                <circle r="24" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0">
                  <animate attributeName="r" values="24;36" dur="4s" begin={\`\${i * 0.5}s\`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0" dur="4s" begin={\`\${i * 0.5}s\`} repeatCount="indefinite" />
                </circle>
              </g>
            ))}

            {/* Center Node (ORION CORE) */}
            <g transform={\`translate(\${center.x}, \${center.y})\`}>
              <circle r="80" fill="url(#core-glow)" />
              
              <circle r="48" fill="#101214" stroke="#22d3ee" strokeWidth="1" opacity="0.5" className="animate-[spin_10s_linear_infinite]" strokeDasharray="10 10" />
              <circle r="40" fill="#151719" stroke="#282C2F" strokeWidth="1" />
              
              {/* Inner core pulse */}
              <circle r="30" fill="#22d3ee" opacity="0.1">
                <animate attributeName="r" values="30;38;30" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.1;0.2;0.1" dur="4s" repeatCount="indefinite" />
              </circle>
              
              <g fill="#22d3ee" opacity="0.8" transform="translate(-16, -16)">
                <AppLogo size={32} variant="mark" />
              </g>
              <text y="70" textAnchor="middle" fill="#E8E8E5" fontSize="12" fontFamily="monospace" letterSpacing="2" fontWeight="bold">ORION CORE</text>
            </g>
          </svg>
        </div>
      </div>
      
    </div>
  );
};
`

fs.writeFileSync('src/components/auth/AdminLogin.tsx', code);

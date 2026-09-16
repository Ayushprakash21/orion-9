const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { brandingRepository } from '../../repositories/BrandingRepository';
import { BrandLogo } from '../brand/BrandLogo';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [branding, setBranding] = useState(() => brandingRepository.getBrandingSync());

  useEffect(() => {
    const handleBrandingUpdate = () => {
      setBranding(brandingRepository.getBrandingSync());
    };
    window.addEventListener('orion-branding-updated', handleBrandingUpdate);
    window.addEventListener('storage', handleBrandingUpdate);
    return () => {
      window.removeEventListener('orion-branding-updated', handleBrandingUpdate);
      window.removeEventListener('storage', handleBrandingUpdate);
    };
  }, []);

  const appName = branding.applicationName || branding.appName || 'ORION SCM OS';
  const description = branding.description || 'AI Supply Chain Operating System';

  // Automatically redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = await login(username, password);
      
      if (!result.success) {
        setErrorMsg(result.error || 'Authentication failed.');
      } else {
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('An unexpected error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-os-bg flex flex-col relative overflow-hidden font-sans">
      
      {/* Subtle Abstract SCM Environment */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
        
        {/* Very faint abstract supply chain structure */}
        <svg className="absolute inset-0 w-full h-full opacity-5 dark:opacity-[0.03]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0,20 L 40,20 L 60,80 L 100,80" fill="none" stroke="currentColor" strokeWidth="0.1" />
          <path d="M 0,40 L 30,40 L 50,60 L 100,60" fill="none" stroke="currentColor" strokeWidth="0.1" />
          <path d="M 0,60 L 20,60 L 40,40 L 100,40" fill="none" stroke="currentColor" strokeWidth="0.1" />
          <circle cx="40" cy="20" r="0.5" fill="currentColor" />
          <circle cx="60" cy="80" r="0.5" fill="currentColor" />
          <circle cx="30" cy="40" r="0.5" fill="currentColor" />
          <circle cx="50" cy="60" r="0.5" fill="currentColor" />
          <circle cx="20" cy="60" r="0.5" fill="currentColor" />
          <circle cx="40" cy="40" r="0.5" fill="currentColor" />
        </svg>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full">
        
        {/* Header / Brand */}
        <div className="flex flex-col items-center mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <BrandLogo size={56} variant="mark" className="mb-6 drop-shadow-sm" />
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-os-text-primary mb-2">
            {appName}
          </h1>
          <div className="text-sm text-os-text-secondary opacity-90">
            {description}
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          <div className="bg-os-surface/90 backdrop-blur-xl border border-os-border rounded-2xl p-8 shadow-sm">
            
            <div className="mb-8 text-center">
               <h2 className="text-lg font-medium text-os-text-primary mb-1">
                  Welcome back
               </h2>
               <p className="text-sm text-os-text-secondary">
                  Sign in to your supply chain operating system.
               </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                
               {errorMsg && (
                  <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-start gap-3">
                     <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                     <div>{errorMsg}</div>
                  </div>
               )}

               <div className="space-y-4">
                 <div>
                    <label htmlFor="username" className="block text-sm font-medium text-os-text-primary mb-2">
                       Email or Username
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
                          if (errorMsg) setErrorMsg('');
                       }}
                       className="block w-full px-4 py-3 bg-os-input-bg border border-os-border rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-sm text-os-text-primary transition-all shadow-sm"
                       placeholder="Enter your email or username"
                    />
                 </div>

                 <div>
                    <label htmlFor="password" className="block text-sm font-medium text-os-text-primary mb-2">
                       Password
                    </label>
                    <div className="relative">
                       <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => {
                             setPassword(e.target.value);
                             if (errorMsg) setErrorMsg('');
                          }}
                          className="block w-full px-4 py-3 bg-os-input-bg border border-os-border rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-sm text-os-text-primary transition-all pr-11 shadow-sm"
                          placeholder="Enter your password"
                       />
                       <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-os-text-muted hover:text-os-text-primary focus:outline-none transition-colors cursor-pointer"
                       >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                    </div>
                 </div>
               </div>

               <div className="pt-2">
                  <button
                     type="submit"
                     disabled={isSubmitting}
                     className="w-full h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer shadow-sm"
                  >
                     {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                     ) : (
                        <span>Sign In &rarr;</span>
                     )}
                  </button>
               </div>
            </form>
          </div>
          
          {/* Footer Link */}
          <div className="mt-8 text-center">
             <Link
                to="/admin/login"
                className="text-xs text-os-text-muted hover:text-os-text-primary transition-colors inline-block"
             >
                Admin Console
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/auth/Login.tsx', content);

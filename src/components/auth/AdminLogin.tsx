import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { AppLogo } from '../brand/AppLogo';
import { authService } from '../../services/authService';
import { LoadingScreen } from '../LoadingScreen';
import { brandingRepository } from '../../repositories/BrandingRepository';

export const AdminLogin = () => {
  const { isAuthenticated, isLoading, profile, user, signIn } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [appName, setAppName] = useState(() => {
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
      const userProfile = await signIn(username, password);
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="mb-6 flex justify-center">
          <AppLogo size={48} variant="mark" />
        </div>
        <h2 className="mt-2 text-center text-2xl font-light tracking-tight text-[#F5F5F5]">
          {appName} Administration
        </h2>
        <p className="mt-2 text-center text-sm text-[#A1A1A1]">
          Platform Administration Console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111111] py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-[#2A2A2A]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-sm text-center">
                {errorMsg}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#F5F5F5]">
                Username or Email
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[#2A2A2A] rounded-md shadow-sm placeholder-[#6F6F6F] focus:outline-none focus:ring-1 focus:ring-[#F5F5F5] focus:border-[#F5F5F5] sm:text-sm bg-[#161616] text-[#F5F5F5]"
                  placeholder="Enter username or email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#F5F5F5]">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-[#2A2A2A] rounded-md shadow-sm placeholder-[#6F6F6F] focus:outline-none focus:ring-1 focus:ring-[#F5F5F5] focus:border-[#F5F5F5] sm:text-sm bg-[#161616] text-[#F5F5F5]"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A1A1A1] hover:text-[#F5F5F5] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#808080]">
              <span>Restricted Access</span>
              <Link to="/login" className="text-blue-400 hover:underline">
                User Login
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#F5F5F5] hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F5F5F5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


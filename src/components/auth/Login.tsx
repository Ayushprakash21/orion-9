import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { AppLogo } from '../brand/AppLogo';
import { LoadingScreen } from '../LoadingScreen';
import { brandingRepository } from '../../repositories/BrandingRepository';

export const Login = () => {
  const { isAuthenticated, isLoading, profile, user, signIn } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!username.trim()) {
      showToast('Enter your username or email.', 'error');
      return;
    }
    if (!password) {
      showToast('Enter your password.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const userProfile = await signIn(username, password);
      showToast('Successfully signed in', 'success');
      
      if (userProfile.role === 'platform_admin' || userProfile.role === 'organization_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      showToast(error.message || 'Invalid credentials', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#000000]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-[#111111] border border-[#2A2A2A] rounded-lg flex items-center justify-center shadow-lg">
            <AppLogo size={28} variant="mark" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-light tracking-tight text-[#F5F5F5]">
          Sign in to {appName}
        </h2>
        <p className="mt-2 text-center text-xs uppercase tracking-wider font-mono text-[#A0A0A0]">
          AI SUPPLY CHAIN OPERATING SYSTEM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0A0A0A] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#2A2A2A]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#A0A0A0]">
                Username or Email
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username or email"
                  className="appearance-none block w-full px-3 py-2 border border-[#2A2A2A] rounded-md shadow-sm placeholder-[#6F6F6F] focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#111111] text-[#F5F5F5]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#A0A0A0]">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-[#2A2A2A] rounded-md shadow-sm placeholder-[#6F6F6F] focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#111111] text-[#F5F5F5]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A0A0A0] hover:text-[#F5F5F5] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#808080]">
              <span>Authorized Personnel Only</span>
              <Link to="/admin/login" className="text-blue-400 hover:underline">
                Admin Console
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


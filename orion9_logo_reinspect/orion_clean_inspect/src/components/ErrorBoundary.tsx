import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut, Database, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ORION-9] Uncaught runtime exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleClearSession = () => {
    try {
      localStorage.removeItem('orion_auth_session');
      sessionStorage.removeItem('orion_auth_session');
    } catch (e) {
      console.warn('Failed to clear session storage:', e);
    }
    window.location.href = '/login';
  };

  private handleResetLocalData = () => {
    try {
      localStorage.removeItem('orion_auth_session');
      localStorage.removeItem('orion_settings');
      sessionStorage.clear();
      indexedDB.deleteDatabase('SC_DB');
    } catch (e) {
      console.warn('Failed to reset local database:', e);
    }
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected runtime fault occurred.';
      
      return (
        <div 
          id="orion-error-boundary-screen"
          className="min-h-screen w-full bg-[#07090E] text-os-text-primary flex flex-col items-center justify-center p-6 select-none font-sans"
          style={{ backgroundColor: 'var(--os-surface)', color: '#E2E8F0', minHeight: '100vh' }}
        >
          <div className="w-full max-w-xl bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            {/* Top glowing accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />

            {/* Header with Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-mono font-bold text-white uppercase tracking-wider">
                  {this.props.fallbackTitle || 'SYSTEM RUNTIME FAULT RECOVERED'}
                </h1>
                <p className="text-xs text-os-text-muted font-mono">
                  ORION-9 • KERNEL PROTECTION ENGAGED
                </p>
              </div>
            </div>

            <p className="text-sm text-os-text-secondary mb-6 leading-relaxed">
              The operating system encountered an unexpected fault in this view. Your data is preserved. You can reload the system or return to the Command Center below.
            </p>

            {/* Fault Error Box */}
            <div className="bg-[#05070C] border border-[#182030] rounded-lg p-3.5 mb-6 font-mono text-xs text-red-400 overflow-x-auto max-h-32">
              <div className="font-semibold mb-1 text-os-text-muted text-[10px] uppercase tracking-wider">Exception Details:</div>
              <div className="break-words">{errorMsg}</div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                id="btn-error-reload"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00F2FE] hover:bg-[#38BDF8] text-black font-bold text-xs tracking-wider uppercase rounded-lg transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,242,254,0.2)]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload System</span>
              </button>

              <button
                id="btn-error-home"
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white font-medium text-xs tracking-wider uppercase rounded-lg transition-colors cursor-pointer border border-[#334155]"
              >
                <Home className="w-4 h-4" />
                <span>Command Center</span>
              </button>

              <button
                id="btn-error-session"
                onClick={this.handleClearSession}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-transparent hover:bg-white/5 text-os-text-secondary font-mono text-xs tracking-wider uppercase rounded-lg transition-colors cursor-pointer border border-[#1E293B]"
              >
                <LogOut className="w-3.5 h-3.5 text-os-text-muted" />
                <span>Reset Session</span>
              </button>

              <button
                id="btn-error-data"
                onClick={this.handleResetLocalData}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-transparent hover:bg-white/5 text-amber-400/90 font-mono text-xs tracking-wider uppercase rounded-lg transition-colors cursor-pointer border border-amber-500/20"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Demo State</span>
              </button>
            </div>

            {/* Collapsible Stack Trace */}
            <div className="border-t border-[#1E293B] pt-4">
              <button
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] font-mono text-slate-500 hover:text-os-text-secondary transition-colors uppercase tracking-wider cursor-pointer"
              >
                {this.state.showDetails ? 'Hide Diagnostics [-]' : 'View Technical Diagnostics [+]'}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 bg-[#05070C] p-3 rounded border border-[#182030] text-[11px] font-mono text-os-text-muted overflow-x-auto max-h-48 whitespace-pre-wrap">
                  {this.state.error?.stack || 'No stack trace available.'}
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-2 text-slate-500">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

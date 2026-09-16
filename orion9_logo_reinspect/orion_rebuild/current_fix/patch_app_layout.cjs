const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We need to import OrionLiveWallpaper in App.tsx
if (!code.includes('OrionLiveWallpaper')) {
  code = code.replace(
    /import \{ OrionSleepScreen \} from '\.\/os\/components\/OrionSleepScreen';/,
    "import { OrionSleepScreen } from './os/components/OrionSleepScreen';\nimport { OrionLiveWallpaper } from './os/components/OrionLiveWallpaper';"
  );
}

// Replace the return structures
const replaceRegex = /\/\/ 1\. SYSTEM HALTED \/ SHUT DOWN:[\s\S]*?<\/div>\n  \);\n\}/m;

const newLayout = `
  const renderContent = () => {
    // 1. SYSTEM HALTED / SHUT DOWN:
    if (bootState === 'SHUTTING_DOWN') {
      return (
        <OrionShutdownScreen
          onComplete={() => {
            completeShutdown();
            navigate('/login', { replace: true });
          }}
        />
      );
    }
  
    // 1.5 & 1.6 POWER ON & INITIALIZATION
    if (bootState === 'POWERED_OFF' || bootState === 'SYSTEM_INITIALIZING') {
      return (
        <OrionPowerOnScreen 
           isInitializing={bootState === 'SYSTEM_INITIALIZING'} 
           onPowerOn={powerOn} 
           onComplete={completeSystemInitialization}
        />
      );
    }
  
    // 2. SYSTEM REBOOT SEQUENCE:
    if (bootState === 'RESTARTING') {
      return (
        <div className="w-full h-full min-h-screen bg-os-bg flex items-center justify-center">
          <LoadingSpinner size="lg" className="text-os-accent" />
        </div>
      );
    }
  
    // 3. CORE INITIALIZATION / LAUNCHING (Initial Load):
    if (bootState === 'BOOTING' && !initTimedOut) {
      return (
        <LoadingScreen 
          isFadingOut={isFadingOut}
          message="INITIALIZING ORION SCM PLATFORM..."
        />
      );
    }
  
    // 4. POST-LOGIN WARMUP SEQUENCE
    if (bootState === 'POST_LOGIN_INITIALIZING') {
      return (
        <LoadingScreen 
          isFadingOut={isFadingOut}
          message="ALLOCATING WORKSPACE & CONSTRUCTING DOMAINS..."
        />
      );
    }
  
    // 5. UNAUTHENTICATED / AUTHENTICATING:
    if (bootState === 'LOGIN_REQUIRED' || bootState === 'AUTHENTICATING') {
      return (
        <div className="w-full h-full min-h-screen bg-os-bg animate-in fade-in duration-300 relative z-20">
          <ErrorBoundary fallbackTitle="AUTHENTICATION PORTAL EXCEPTION">
            <UnauthenticatedApplication />
          </ErrorBoundary>
        </div>
      );
    }
  
    // 6. SUPPLY CHAIN DATA INITIALIZATION (post-login / app data load):
    if (isSupplyChainInitializing && !initTimedOut) {
      return (
        <LoadingScreen 
          isFadingOut={isFadingOut}
          message="CONNECTING SUPPLY CHAIN KERNEL..."
        />
      );
    }
  
    // 7. READY / AUTHENTICATED / LOCKED / SLEEPING:
    return (
      <div className="w-full h-full min-h-screen animate-in fade-in duration-300 relative">
        <ErrorBoundary fallbackTitle="ORION SCM APPLICATION EXCEPTION">
          <AuthenticatedApplication />
        </ErrorBoundary>
        
        {bootState === 'LOCKED' && (
          <OrionLockScreen onUnlock={unlock} currentUser={currentUser} />
        )}
  
        {bootState === 'SLEEPING' && (
          <OrionSleepScreen onWake={wake} />
        )}
      </div>
    );
  };

  const showWallpaper = ['POWERED_OFF', 'SYSTEM_INITIALIZING', 'RESTARTING', 'SHUTTING_DOWN', 'READY', 'LOCKED', 'SLEEPING'].includes(bootState);

  return (
    <div className="w-full h-full min-h-screen bg-os-bg relative overflow-hidden">
      {showWallpaper && <OrionLiveWallpaper />}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto h-full w-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}`;

code = code.replace(replaceRegex, newLayout);

fs.writeFileSync('src/App.tsx', code);

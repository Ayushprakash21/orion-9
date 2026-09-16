const fs = require('fs');
let code = fs.readFileSync('src/components/LoadingScreen.tsx', 'utf8');

const regexProps = /export interface LoadingScreenProps \{[\s\S]*?\}/;
const newProps = `export interface LoadingScreenProps {
  message?: string;
  isFadingOut?: boolean;
  className?: string;
  variant?: 'default' | 'orion-initialization';
  destination?: string;
  onComplete?: () => void;
  duration?: number;
  isAdmin?: boolean;
}`;

code = code.replace(regexProps, newProps);

const regexView = /const OrionInitializationView: React\.FC<\{[\s\S]*?\}\> = \(\{ onComplete, duration = 5000 \}\) => \{/;
const newView = `const OrionInitializationView: React.FC<{
  onComplete?: () => void;
  destination?: string;
  duration?: number;
  isAdmin?: boolean;
}> = ({ onComplete, duration = 8500, isAdmin = false }) => {`;

code = code.replace(regexView, newView);

const regexReturn = /<SafeCoreBoundary>\s*<IntelligenceCore elapsed=\{elapsed\} duration=\{duration\} \/>\s*<\/SafeCoreBoundary>/;

const newReturn = `
      <div className="flex flex-col items-center justify-center relative w-full h-full">
        {/* Safe Core Boundary for the reactor */}
        <SafeCoreBoundary>
          <IntelligenceCore elapsed={elapsed} duration={duration} />
        </SafeCoreBoundary>
        
        {/* Cinematic status text below the core */}
        <div className="absolute bottom-[20%] text-center">
          <span className="text-xs tracking-[0.2em] font-mono text-[#00F2FE] uppercase opacity-80 animate-pulse transition-all duration-300">
            {getInitializationStatusText(elapsed, duration, isAdmin)}
          </span>
        </div>
      </div>
`;

code = code.replace(regexReturn, newReturn);

const regexHelper = /const SafeCoreBoundary[\s\S]*/;

const helperInsert = `
function getInitializationStatusText(elapsed: number, duration: number, isAdmin: boolean) {
  const percent = elapsed / duration;
  
  if (isAdmin) {
    if (percent < 0.15) return "PLATFORM CORE ONLINE";
    if (percent < 0.3) return "DATA FABRIC CONNECTED";
    if (percent < 0.45) return "AI ENGINE ONLINE";
    if (percent < 0.6) return "DECISION FABRIC ONLINE";
    if (percent < 0.75) return "GOVERNANCE ENGINE ONLINE";
    if (percent < 0.85) return "AUDIT FABRIC ONLINE";
    return "PLATFORM CONTROL PLANE READY";
  } else {
    if (percent < 0.15) return "SUPPLY CHAIN CORE ONLINE";
    if (percent < 0.3) return "DATA FABRIC CONNECTED";
    if (percent < 0.45) return "WORLD MODEL ONLINE";
    if (percent < 0.55) return "PREDICTION ENGINE ONLINE";
    if (percent < 0.65) return "RISK ENGINE ONLINE";
    if (percent < 0.75) return "DECISION ENGINE ONLINE";
    if (percent < 0.85) return "WORKFLOW FABRIC ONLINE";
    return "SUPPLY CHAIN INTELLIGENCE READY";
  }
}

`;

code = code.replace('const SafeCoreBoundary', helperInsert + 'const SafeCoreBoundary');


const regexLoadingScreen = /export const LoadingScreen: React\.FC<LoadingScreenProps> = \(\{[\s\S]*?\}\) => \{/;

const newLoadingScreen = `export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'INITIALIZING SYSTEM...',
  isFadingOut = false,
  className = '',
  variant = 'default',
  destination = '/',
  onComplete,
  duration = 8500,
  isAdmin = false,
}) => {`;

code = code.replace(regexLoadingScreen, newLoadingScreen);

const regexOrionViewInvoke = /<OrionInitializationView\s*destination=\{destination\}\s*onComplete=\{onComplete\}\s*duration=\{duration\}\s*\/>/;

const newOrionViewInvoke = `<OrionInitializationView
        destination={destination}
        onComplete={onComplete}
        duration={duration}
        isAdmin={isAdmin}
      />`;

code = code.replace(regexOrionViewInvoke, newOrionViewInvoke);

fs.writeFileSync('src/components/LoadingScreen.tsx', code);

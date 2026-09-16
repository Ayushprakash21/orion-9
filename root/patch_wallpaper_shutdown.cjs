const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

code = code.replace(
  /export function OrionLiveWallpaper\(\) \{/,
  "export function OrionLiveWallpaper({ isShuttingDown }: { isShuttingDown?: boolean }) {"
);

// Add shutdown time tracking
code = code.replace(
  /const startTime = Date\.now\(\);/,
  "const startTime = Date.now();\n    let shutdownStartTime: number | null = null;"
);

code = code.replace(
  /const draw = \(\) => \{/g,
  `const draw = () => {
      if (isShuttingDown && !shutdownStartTime) {
        shutdownStartTime = Date.now();
      }`
);

// Spawn packet control - stop during shutdown
code = code.replace(
  /const elapsed = Date\.now\(\) - startTime;\n      if \(elapsed < 3500\) return;/g,
  `const elapsed = Date.now() - startTime;
      if (elapsed < 3500 || isShuttingDown) return;`
);

// Globe fade-in / out
code = code.replace(
  /const globeAlpha = Math\.min\(1, Math\.max\(0, \(elapsed - 2000\) \/ 2000\)\);/g,
  `let globeAlpha = Math.min(1, Math.max(0, (elapsed - 2000) / 2000));
      if (shutdownStartTime) {
        globeAlpha = Math.min(1, Math.max(0, 1 - (Date.now() - shutdownStartTime - 1000) / 1000));
      }`
);

// Orbit fade-in / out
code = code.replace(
  /const orbitAlpha = Math\.min\(1, Math\.max\(0, \(elapsed - 1000\) \/ 1500\)\);/g,
  `let orbitAlpha = Math.min(1, Math.max(0, (elapsed - 1000) / 1500));
      if (shutdownStartTime) {
        orbitAlpha = Math.min(1, Math.max(0, 1 - (Date.now() - shutdownStartTime - 500) / 1000));
      }`
);

// Paths fade-in / out
code = code.replace(
  /const pathAlpha = Math\.min\(1, Math\.max\(0, \(elapsed - 2500\) \/ 1500\)\);/g,
  `let pathAlpha = Math.min(1, Math.max(0, (elapsed - 2500) / 1500));
      if (shutdownStartTime) {
        pathAlpha = Math.min(1, Math.max(0, 1 - (Date.now() - shutdownStartTime) / 1000));
      }`
);

// Nodes fade-in / out
code = code.replace(
  /const nodeAlpha = Math\.min\(1, Math\.max\(0, \(elapsed - 3000\) \/ 1000\)\);/g,
  `let nodeAlpha = Math.min(1, Math.max(0, (elapsed - 3000) / 1000));
      if (shutdownStartTime) {
        nodeAlpha = Math.min(1, Math.max(0, 1 - (Date.now() - shutdownStartTime - 1500) / 1000));
      }`
);

// Update dependency array for useEffect
code = code.replace(
  /\}, \[\]\);/g,
  "}, [isShuttingDown, branding]);"
);

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);

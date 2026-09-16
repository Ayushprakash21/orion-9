const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const showWallpaper = \['POWERED_OFF', 'SYSTEM_INITIALIZING', 'RESTARTING', 'SHUTTING_DOWN', 'READY', 'LOCKED', 'SLEEPING'\]\.includes\(bootState\);/,
  "const showWallpaper = bootState !== 'LOGIN_REQUIRED' && bootState !== 'AUTHENTICATING';\n  const isShuttingDown = bootState === 'SHUTTING_DOWN';"
);

code = code.replace(
  /\{showWallpaper && <OrionLiveWallpaper \/>\}/,
  "{showWallpaper && <OrionLiveWallpaper isShuttingDown={isShuttingDown} />}"
);

fs.writeFileSync('src/App.tsx', code);

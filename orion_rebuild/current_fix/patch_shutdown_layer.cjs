const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const showWallpaper = bootState !== 'LOGIN_REQUIRED' && bootState !== 'AUTHENTICATING';/g,
  "const showWallpaper = bootState !== 'LOGIN_REQUIRED' && bootState !== 'AUTHENTICATING' && bootState !== 'SHUTTING_DOWN' && bootState !== 'RESTARTING' && bootState !== 'BOOTING' && bootState !== 'POST_LOGIN_INITIALIZING';"
);

code = code.replace(
  /<div className="w-full h-full min-h-screen bg-os-bg flex items-center justify-center">/g,
  '<div className="fixed inset-0 z-[100000] w-full h-full bg-[#03060E] flex items-center justify-center">'
);

fs.writeFileSync('src/App.tsx', code);

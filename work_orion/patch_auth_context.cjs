const fs = require('fs');
let code = fs.readFileSync('src/store/AuthContext.tsx', 'utf8');

// When boot fails to find session, go to SYSTEM_INITIALIZING instead of POWERED_OFF
code = code.replace(
  /setBootState\('POWERED_OFF'\);/g,
  "setBootState('SYSTEM_INITIALIZING');"
);

// We need shutdown to go to LOGIN_REQUIRED, so completeShutdown should do that.
// But wait, the replace above changed completeShutdown to SYSTEM_INITIALIZING.
// Let's fix completeShutdown specifically.
code = code.replace(
  /const completeShutdown = useCallback\(\(\) => \{\s*clearSessionState\(\);\s*setBootState\('SYSTEM_INITIALIZING'\);\s*\}, \[clearSessionState\]\);/,
  `const completeShutdown = useCallback(() => {
    clearSessionState();
    setBootState('LOGIN_REQUIRED');
  }, [clearSessionState]);`
);

fs.writeFileSync('src/store/AuthContext.tsx', code);

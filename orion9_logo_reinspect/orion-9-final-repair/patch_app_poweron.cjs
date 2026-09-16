const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace OrionPowerOnScreen with LoadingScreen variant="orion-initialization"
const powerOnRegex = /\/\/ 1\.5 & 1\.6 POWER ON & INITIALIZATION\s*if \(bootState === 'POWERED_OFF' \|\| bootState === 'SYSTEM_INITIALIZING'\) \{\s*return \(\s*<OrionPowerOnScreen[\s\S]*?\/>\s*\);\s*\}/;

const powerOnReplacement = `// 1.5 & 1.6 POWER ON & INITIALIZATION
    if (bootState === 'POWERED_OFF' || bootState === 'SYSTEM_INITIALIZING') {
      return (
        <LoadingScreen 
          variant="orion-initialization" 
          duration={5000} 
          onComplete={completeSystemInitialization} 
        />
      );
    }`;

code = code.replace(powerOnRegex, powerOnReplacement);

// Let's also fix POST_LOGIN_INITIALIZING duration to 5000 as requested: "The post-login initialization must be approximately 5 seconds."
code = code.replace(
  /duration=\{8500\}/g,
  "duration={5000}"
);

fs.writeFileSync('src/App.tsx', code);

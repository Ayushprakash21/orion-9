const fs = require('fs');
let code = fs.readFileSync('src/types/settings.ts', 'utf8');

code = code.replace(
  /\/\/ Audio/g,
  "// Audio\n  soundEnabled?: boolean;\n  soundVolume?: number; // 0 - 100"
);

code = code.replace(
  /reducedMotion: false,/g,
  "reducedMotion: false,\n  soundEnabled: true,\n  soundVolume: 75,"
);

fs.writeFileSync('src/types/settings.ts', code);

const fs = require('fs');
let code = fs.readFileSync('src/os/WindowManagerContext.tsx', 'utf8');

// Replace state: 'active' with state: 'maximized' for newly opened windows
code = code.replace(
  /id,\s*state: 'active',\s*zIndex: 45,/g,
  "id,\n            state: 'maximized',\n            zIndex: 45,"
);

// For restoring minimized windows when openApplication is called
code = code.replace(
  /state: existing\.state === 'maximized' \? 'maximized' : 'active'/g,
  "state: existing.state === 'minimized' ? 'maximized' : existing.state"
);

fs.writeFileSync('src/os/WindowManagerContext.tsx', code);

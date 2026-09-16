const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

// I replaced About item with settings.appName, but settings wasn't in scope.
code = code.replace(
  "{ name: `About ${settings.applicationName || 'ORION SCM OS'}`, path: '/about', icon: 'about' }",
  "{ name: 'About OS', path: '/about', icon: 'about' }"
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionPowerOnScreen.tsx', 'utf8');

code = code.replace(
  /className="fixed inset-0 w-full h-full z-\[10000\] bg-transparent /g,
  'className="fixed inset-0 w-full h-full z-[10000] bg-[#03060E] '
);

// Remove the top-left logo zone
code = code.replace(
  /<div className="absolute top-\[10%\] left-\[10%\] w-\[80%\] flex flex-col items-start gap-4">[\s\S]*?<\/div>/g,
  ''
);
// Also it might not be top-[10%] left-[10%]. Let's find it properly.

fs.writeFileSync('src/os/components/OrionPowerOnScreen.tsx', code);

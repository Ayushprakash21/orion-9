const fs = require('fs');
let sidebarStr = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

sidebarStr = sidebarStr.replace(
  "import React from 'react';",
  "import React from 'react';\nimport { NavLink, useLocation } from 'react-router-dom';"
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarStr);

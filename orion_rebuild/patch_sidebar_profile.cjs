const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

// The user wants to "reduce it to a minimal identity indicator and make the top-right profile the primary account control."
// Let's just remove it entirely from the sidebar, since we put it in the header, or at least remove AccountMenu.
code = code.replace(/<AccountMenu closeSidebar=\{closeSidebar\} \/>/g, "<div></div>");

fs.writeFileSync('src/components/layout/Sidebar.tsx', code);

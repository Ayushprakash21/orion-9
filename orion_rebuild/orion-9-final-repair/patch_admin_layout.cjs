const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');

// Remove AccountMenu from the bottom of the sidebar
code = code.replace(
  /\s*{\/\* Profile Menu at bottom of sidebar \*\/}\s*<AccountMenu closeSidebar={\(\) => setSidebarOpen\(false\)} \/>/,
  ''
);

// Add AccountMenu to the top header right after NavLink
code = code.replace(
  /(<span className="sm:hidden">App<\/span>\s*<\/NavLink>)/,
  '$1\n            <AccountMenu />'
);

// We should also remove the Back to app link in the sidebar since the user said "The sidebar may contain: Admin navigation, Back to App if that is part of the current navigation structure, BUT: NO USER ACCOUNT FOOTER". Wait, the prompt says "Keep all Admin navigation... Only remove the duplicated Account/Profile control from the sidebar/footer". So I'll just remove the AccountMenu from the sidebar. Wait, the prompt says "Do not move it to the sidebar. It must remain in the Admin Console header. Final: TOP RIGHT: [ <- Back to App ] [ AD Admin ]". The NavLink in the sidebar is duplicate but maybe I shouldn't touch it unless requested. Ah, actually the prompt said "Do not move it to the sidebar. It must remain in the Admin Console header" referring to the Back to App button. So I should just make sure the top right has both.

fs.writeFileSync('src/components/admin/AdminLayout.tsx', code);

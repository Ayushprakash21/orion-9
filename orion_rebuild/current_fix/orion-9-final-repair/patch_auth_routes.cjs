const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the <AuthenticatedApplication /> routes for /login and /admin/login to navigate away
const authenticatedLoginRoutesRegex = /<Route\s*path="\/login"\s*element=\{<Login \/>\}\s*\/>\s*<Route path="\/admin\/login" element=\{<AdminLogin \/>\} \/>\s*<Route path="\/admin-login" element=\{<AdminLogin \/>\} \/>/;

const authenticatedLoginRoutesReplacement = `      {/* If already authenticated, navigating to login should send them to their dashboard */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
      <Route path="/admin-login" element={<Navigate to="/admin" replace />} />`;

code = code.replace(authenticatedLoginRoutesRegex, authenticatedLoginRoutesReplacement);
fs.writeFileSync('src/App.tsx', code);

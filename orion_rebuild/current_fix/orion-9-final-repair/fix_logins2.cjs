const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/await login\(username, password\);\n\s*\/\/ login throws on failure, so if we reach here it succeeded\s*const from = \(location.state as any\)\?\.from\?\.pathname \|\| "\/";\n\s*navigate\(from, \{ replace: true \}\);\n\s*\}\n\s*\}/g, 
  `await login(username, password);
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }`);
  fs.writeFileSync(file, code);
}
fix('src/components/auth/Login.tsx');

function fixAdmin(file) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/await login\(username, password\);\n\s*const from = \(location.state as any\)\?\.from\?\.pathname \|\| "\/admin";\n\s*navigate\(from, \{ replace: true \}\);\n\s*\}\n\s*\}/g, 
  `await login(username, password);
      const from = (location.state as any)?.from?.pathname || "/admin";
      navigate(from, { replace: true });
    }`);
  fs.writeFileSync(file, code);
}
fixAdmin('src/components/auth/AdminLogin.tsx');

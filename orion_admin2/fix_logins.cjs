const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace:
  // const result = await login(username, password);
  // if (!result.success) {
  //   setErrorMsg(result.error || "Authentication failed.");
  //   setIsSubmitting(false); // only in admin
  //   return; // only in admin
  // } else {
  //   ...
  // }
  
  code = code.replace(/const result = await login\([^)]+\);\s*if \(!result\.success\) \{\s*setErrorMsg\([^)]+\);\s*(?:setIsSubmitting\(false\);\s*return;\s*)?\} else \{/g,
  `await login(username, password);
      // login throws on failure, so if we reach here it succeeded`);
      
  code = code.replace(/const result = await login\(username, password\);\s*if \(!result\.success\) \{\s*setErrorMsg\([^)]+\);\s*(?:setIsSubmitting\(false\);\s*return;\s*)?\}/g,
  `await login(username, password);`);
      
  fs.writeFileSync(file, code);
}

fix('src/components/auth/Login.tsx');
fix('src/components/auth/AdminLogin.tsx');

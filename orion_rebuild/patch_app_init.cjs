const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /if \(bootState === 'POST_LOGIN_INITIALIZING'\) \{\s*return \(\s*<LoadingScreen\s*isFadingOut=\{isFadingOut\}\s*message="ALLOCATING WORKSPACE & CONSTRUCTING DOMAINS\.\.\."\s*\/>\s*\);\s*\}/;

const replacement = `if (bootState === 'POST_LOGIN_INITIALIZING') {
      return (
        <LoadingScreen 
          variant="orion-initialization"
          destination={postLoginDestination || '/'}
          onComplete={completePostLoginInitialization}
          duration={8500}
        />
      );
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);

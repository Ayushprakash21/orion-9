const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<LoadingScreen \s*variant="orion-initialization"\s*destination=\{postLoginDestination \|\| '\/'\}\s*onComplete=\{completePostLoginInitialization\}\s*duration=\{8500\}\s*\/>/m;

const replacement = `<LoadingScreen 
          variant="orion-initialization"
          destination={postLoginDestination || '/'}
          onComplete={completePostLoginInitialization}
          duration={8500}
          isAdmin={isAdmin}
        />`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);

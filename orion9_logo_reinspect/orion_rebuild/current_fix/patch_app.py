import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Make sure OrionBootSequence, UserAuthenticationTransition, AdminAuthenticationTransition are imported
if 'OrionBootSequence' not in content:
    content = content.replace("import { LoadingScreen } from './components/LoadingScreen';", 
        "import { LoadingScreen } from './components/LoadingScreen';\nimport { OrionBootSequence } from './os/components/OrionBootSequence';\nimport { UserAuthenticationTransition, AdminAuthenticationTransition } from './os/components/AuthenticationTransitions';")

# Find the SYSTEM_INITIALIZING block and replace its return
system_init_pattern = re.compile(r"if\s*\(bootState\s*===\s*'SYSTEM_INITIALIZING'\)\s*\{\s*return\s*\(\s*<OrionBootSequence\b[^>]*>.*?<\/OrionBootSequence>\s*\);\s*\}", re.DOTALL)
if not system_init_pattern.search(content):
    system_init_pattern = re.compile(r"if\s*\(bootState\s*===\s*'SYSTEM_INITIALIZING'\)\s*\{\s*return\s*\(\s*<LoadingScreen\b[^>]*>.*?<\/LoadingScreen>\s*\);\s*\}", re.DOTALL)

replacement = """if (bootState === 'SYSTEM_INITIALIZING') {
      return (
        <OrionBootSequence
          onComplete={completeSystemInitialization}
        />
      );
    }"""

content = system_init_pattern.sub(replacement, content)

# Find POST_LOGIN_INITIALIZING
post_login_pattern = re.compile(r"if\s*\(bootState\s*===\s*'POST_LOGIN_INITIALIZING'\)\s*\{\s*return\s*\(\s*<OrionBootSequence\b[^>]*>.*?<\/OrionBootSequence>\s*\);\s*\}", re.DOTALL)
if not post_login_pattern.search(content):
    post_login_pattern = re.compile(r"if\s*\(bootState\s*===\s*'POST_LOGIN_INITIALIZING'\)\s*\{\s*return\s*\(\s*<LoadingScreen\b[^>]*>.*?<\/LoadingScreen>\s*\);\s*\}", re.DOTALL)

post_login_replacement = """if (bootState === 'POST_LOGIN_INITIALIZING') {
      const handleComplete = () => {
        const dest = postLoginDestination || (isAdmin ? '/admin' : '/');
        completePostLoginInitialization();
        navigate(dest, { replace: true });
      };

      if (isAdmin) {
        return <AdminAuthenticationTransition onComplete={handleComplete} />;
      }
      return <UserAuthenticationTransition onComplete={handleComplete} />;
    }"""

content = post_login_pattern.sub(post_login_replacement, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLockScreen.tsx', 'utf8');

code = code.replace(
  /export const OrionLockScreen: React\.FC<OrionLockScreenProps> = \(\{ onUnlock, currentUser \}\) => \{/,
  `export const OrionLockScreen: React.FC<OrionLockScreenProps> = ({ onUnlock, currentUser }) => {
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(false);

  const handleUnlockAttempt = () => {
    if (password === 'admin' || password === 'user' || password === 'password' || password === 'orion') {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };`
);

code = code.replace(
  /if \(e\.key === 'Enter' \|\| e\.key === ' '\) \{\s*onUnlock\(\);\s*\}/,
  `if (e.key === 'Enter') {
        handleUnlockAttempt();
      }`
);

// Add the password input before the button
const buttonRegex = /\{\/\* Unlock Action Button \*\/\}\s*<button[\s\S]*?<\/button>/;
const buttonCode = `        <div className="w-full mb-6">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter password..."
            className={\`w-full bg-os-surface border \${error ? 'border-red-500' : 'border-os-border focus:border-os-accent'} rounded-lg py-2.5 px-4 text-sm text-center text-os-text-primary placeholder:text-os-text-muted transition-colors outline-none\`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUnlockAttempt();
            }}
          />
        </div>
        
        {/* Unlock Action Button */}
        <button
          type="button"
          onClick={handleUnlockAttempt}
          className="group relative px-8 py-3 bg-os-surface-hover hover:bg-os-surface-active border border-[#00F2FE]/30 text-os-text-primary rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(0,242,254,0.05)] hover:shadow-[0_0_25px_rgba(0,242,254,0.15)] flex items-center gap-2 cursor-pointer"
        >
          <Unlock className="w-4 h-4 text-os-accent transition-transform duration-300 group-hover:scale-110" />
          <span className="text-xs tracking-[0.15em] font-medium uppercase text-os-text-primary">
            Unlock Session
          </span>
        </button>`;

code = code.replace(buttonRegex, buttonCode);

fs.writeFileSync('src/os/components/OrionLockScreen.tsx', code);

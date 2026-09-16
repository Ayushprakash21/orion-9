const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminBranding.tsx', 'utf8');

code = code.replace(/setPersistenceState\('idle'\)/g, "setPersistenceState('unsaved')");

code = code.replace(/const \[persistenceState, setPersistenceState\] = useState<'idle' \| 'remote' \| 'local' \| 'error'>\('idle'\);/,
"const [persistenceState, setPersistenceState] = useState<'idle' | 'remote' | 'local' | 'error' | 'unsaved'>('idle');");

// Add onChange effect
const effect = `
  useEffect(() => {
    if (persistenceState === 'remote' || persistenceState === 'local' || persistenceState === 'error') {
      setPersistenceState('unsaved');
    }
  }, [appName, description, logoUrl, logoIncludesName]);
`;
code = code.replace(/const handleLogoUpload/g, effect + '\n  const handleLogoUpload');

code = code.replace(/\{persistenceState === 'error' && <><span className="w-2 h-2 rounded-full bg-red-500"><\/span><span className="text-red-500">Storage unavailable<\/span><\/>\}/,
`{persistenceState === 'error' && <><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-red-500">Storage unavailable</span></>}
            {persistenceState === 'unsaved' && <><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span><span className="text-os-text-muted">Unsaved changes</span></>}`);

fs.writeFileSync('src/components/admin/AdminBranding.tsx', code);

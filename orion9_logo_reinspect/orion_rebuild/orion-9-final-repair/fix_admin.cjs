const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminBranding.tsx', 'utf8');

// Add persistence state
if (!code.includes('persistenceState')) {
  code = code.replace(/const \[isSaving, setIsSaving\] = useState\(false\);/, 
    "const [isSaving, setIsSaving] = useState(false);\n  const [persistenceState, setPersistenceState] = useState<'idle' | 'remote' | 'local' | 'error'>('idle');");

  code = code.replace(/const handleSave = async \(\) => \{[\s\S]*?setIsSaving\(true\);/, 
    "const handleSave = async () => {\n    setIsSaving(true);\n    setPersistenceState('idle');");

  code = code.replace(/showToast\(result\.method === 'remote' \? 'Branding saved successfully\.' : 'Branding saved locally\.', 'success'\);/, 
    "setPersistenceState(result.method === 'remote' ? 'remote' : 'local');\n      showToast(result.method === 'remote' ? 'Branding saved successfully.' : 'Branding saved locally. Remote platform storage unavailable.', 'success');");
    
  code = code.replace(/showToast\(error\.message \|\| 'Unable to persist branding configuration\.', 'error'\);/, 
    "setPersistenceState('error');\n      showToast(error.message || 'Unable to persist branding configuration.', 'error');");

  const saveButtonsHtml = `<div className="flex flex-col items-end gap-2">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-os-border-inverse text-os-text-primary-inverse rounded font-medium text-sm hover:opacity-90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          
          <div className="text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1.5">
            {persistenceState === 'remote' && <><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-emerald-500">Platform saved</span></>}
            {persistenceState === 'local' && <><span className="w-2 h-2 rounded-full bg-amber-500"></span><span className="text-amber-500">Saved locally</span></>}
            {persistenceState === 'error' && <><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-red-500">Storage unavailable</span></>}
          </div>
        </div>`;

  code = code.replace(/<button \n            onClick=\{handleSave\}[\s\S]*?<\/button>/, saveButtonsHtml);
  fs.writeFileSync('src/components/admin/AdminBranding.tsx', code);
}

const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// Replace activeCategory type
code = code.replace(
  /type SettingsCategory = '[^']+';/g,
  "type SettingsCategory = 'operational' | 'localization' | 'appearance' | 'sound' | 'privacy';"
);

// Add Sound button to sidebar
const soundButton = `
          <button
            onClick={() => setActiveCategory('sound')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              activeCategory === 'sound' ? "bg-os-accent/10 text-os-accent border border-os-accent/20" : "text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary"
            )}
          >
            <Sliders size={16} /> Sound
          </button>
`;

code = code.replace(
  /<button\s+onClick=\{\(\) => setActiveCategory\('privacy'\)\}/,
  soundButton + "\n          <button\n            onClick={() => setActiveCategory('privacy')}"
);

// Add sound section
const soundContent = `      case 'sound':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-sm font-medium text-os-text-primary mb-1">Sound Preferences</h3>
              <p className="text-xs text-os-text-muted mb-6">Manage system audio and volume.</p>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg bg-os-input-bg border border-os-border">
                  <div>
                    <div className="text-sm font-medium text-os-text-primary">Master UI Sound</div>
                    <div className="text-xs text-os-text-muted mt-1">Enable or disable all interface sounds.</div>
                  </div>
                  <div className="flex bg-os-surface border border-os-border rounded-sm p-1 gap-1 mt-3 sm:mt-0 w-full sm:w-48 shrink-0">
                    <button type="button" onClick={() => { setLocalSettings(prev => ({...prev, soundEnabled: false})); updateSettings({ soundEnabled: false }); }} className={\`flex-1 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors \${!localSettings.soundEnabled ? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'}\`}>OFF</button>
                    <button type="button" onClick={() => { setLocalSettings(prev => ({...prev, soundEnabled: true})); updateSettings({ soundEnabled: true }); }} className={\`flex-1 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors \${localSettings.soundEnabled ? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'}\`}>ON</button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg bg-os-input-bg border border-os-border">
                  <div className="mb-3 sm:mb-0">
                    <div className="text-sm font-medium text-os-text-primary">Volume</div>
                    <div className="text-xs text-os-text-muted mt-1">Adjust system volume levels.</div>
                  </div>
                  <div className="w-full sm:w-64 shrink-0">
                    <input
                      type="range" min="0" max="100" value={localSettings.soundVolume ?? 75}
                      onChange={(e) => { const val = parseInt(e.target.value); setLocalSettings(prev => ({...prev, soundVolume: val})); }}
                      onMouseUp={(e) => updateSettings({ soundVolume: parseInt((e.target as HTMLInputElement).value) })}
                      onTouchEnd={(e) => updateSettings({ soundVolume: parseInt((e.target as HTMLInputElement).value) })}
                      className="w-full h-2 bg-os-surface-active rounded-lg appearance-none cursor-pointer accent-os-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );`;

code = code.replace(
  /case 'privacy':/,
  soundContent + "\n      case 'privacy':"
);

fs.writeFileSync('src/components/Settings.tsx', code);

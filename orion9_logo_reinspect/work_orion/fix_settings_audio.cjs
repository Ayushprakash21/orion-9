const fs = require('fs');

let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const audioBlock = `

      <div className="bg-os-surface rounded-xl border border-os-border shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-os-border">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-os-text-primary flex items-center gap-2">
            <Volume2 size={14} className="text-os-text-secondary" /> Audio
          </h3>
          <p className="text-xs text-os-text-muted mt-1">Configure ORION sound feedback.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Sound Effects</label>
              <div className="flex bg-os-input-bg border border-os-border rounded-sm p-1 gap-1">
                <button
                  type="button"
                  onClick={() => { setLocalSettings(prev => ({...prev, soundEffects: false})); updateSettings({ soundEffects: false }); }}
                  className={\`flex-1 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors \${!localSettings.soundEffects ? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'}\`}
                >
                  OFF
                </button>
                <button
                  type="button"
                  onClick={() => { setLocalSettings(prev => ({...prev, soundEffects: true})); updateSettings({ soundEffects: true }); }}
                  className={\`flex-1 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors \${localSettings.soundEffects ? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'}\`}
                >
                  ON
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Master Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                value={localSettings.masterVolume ?? 35}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setLocalSettings(prev => ({...prev, masterVolume: val}));
                }}
                onMouseUp={(e) => updateSettings({ masterVolume: parseInt((e.target as HTMLInputElement).value) })}
                onTouchEnd={(e) => updateSettings({ masterVolume: parseInt((e.target as HTMLInputElement).value) })}
                className="w-full h-2 bg-os-surface-active rounded-lg appearance-none cursor-pointer accent-os-accent"
              />
              <div className="flex justify-between mt-1 text-[9px] text-os-text-muted font-mono">
                <span>0%</span>
                <span>{localSettings.masterVolume ?? 35}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
`;

content = content.replace(
  /<\/div>\s*<\/div>\s*<div className="flex justify-end gap-3 items-center pt-2">/,
  '</div>\n      </div>' + audioBlock + '\n      <div className="flex justify-end gap-3 items-center pt-2 mt-6">'
);

if (!content.includes('Volume2')) {
  content = content.replace(/Monitor,/, 'Monitor, Volume2,');
}

fs.writeFileSync('src/components/Settings.tsx', content);

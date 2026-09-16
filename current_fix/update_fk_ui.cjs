const fs = require('fs');
let code = fs.readFileSync('src/components/DataCenter.tsx', 'utf8');

const warningUI = `
                  {importPreview.warnings && importPreview.warnings.length > 0 && (
                    <div className="mb-6 border border-amber-500/20 rounded-sm bg-amber-500/5 overflow-hidden">
                      <div className="bg-amber-500/10 px-4 py-2 border-b border-amber-500/20">
                        <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Warnings ({importPreview.warnings.length})</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-4">
                        <ul className="space-y-2">
                          {importPreview.warnings.map((warn, i) => (
                            <li key={i} className="text-xs text-amber-400 font-mono">Row {warn.row}: {warn.message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {importPreview.errors.length > 0 && (
`;

code = code.replace('{importPreview.errors.length > 0 && (', warningUI);

// Let's also update the "successful rows / failed rows" count in context importData
// Since warnings don't fail a row, we should add warnings to the ImportHistory structure?
// The prompt says: "Every successful or failed import must record: ... warnings"
// Let's check ImportHistory interface in types.ts.

fs.writeFileSync('src/components/DataCenter.tsx', code);

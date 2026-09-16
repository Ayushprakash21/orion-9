const fs = require('fs');
let code = fs.readFileSync('src/components/DataCenter.tsx', 'utf8');

const manualSelectUI = `          {manualEntitySelection && !importPreview && (
            <div className="space-y-6">
              <div className="border border-white/10 p-6 rounded-sm bg-black/40">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4">Manual Entity Selection</h3>
                <p className="text-xs text-slate-400 mb-6 font-mono">Entity type could not be detected automatically. Please select the correct entity type for this file.</p>
                
                <div className="mb-6">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Detected Headers</div>
                  <div className="flex flex-wrap gap-2">
                    {manualEntitySelection.headers.map((h, i) => (
                      <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-sm text-xs font-mono text-cyan-400">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 block">Select Entity Type</label>
                    <select 
                      value={selectedEntityType}
                      onChange={(e) => setSelectedEntityType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="">-- Select Entity --</option>
                      <option value="products">Products</option>
                      <option value="inventory">Inventory</option>
                      <option value="warehouses">Warehouses</option>
                      <option value="suppliers">Suppliers</option>
                      <option value="purchaseOrders">Purchase Orders</option>
                      <option value="shipments">Shipments</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleManualEntityConfirm}
                    disabled={!selectedEntityType}
                    className="px-6 py-2 bg-cyan-500 text-black text-[10px] uppercase tracking-widest font-bold rounded-sm disabled:opacity-50 hover:bg-cyan-400 transition-colors"
                  >
                    Continue
                  </button>
                  <button 
                    onClick={() => { setManualEntitySelection(null); setStatusMsg(null); }}
                    className="px-6 py-2 border border-white/10 text-slate-300 text-[10px] uppercase tracking-widest rounded-sm hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {importPreview && (`;

code = code.replace(`{!importPreview ? (`, `{!importPreview && !manualEntitySelection ? (`).replace(`{importPreview && (`, manualSelectUI);

// Now add row preview and headers in the preview section
const headerPreviewInfo = `                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-sm">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Total Rows</div>
                      <div className="text-xl font-mono text-slate-200">{importPreview.validData.length + importPreview.errors.length}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-sm">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Columns</div>
                      <div className="text-xl font-mono text-slate-200">{importPreview.headers.length}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-sm">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Status</div>
                      <div className="text-xl font-mono text-cyan-400">READY</div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Detected Headers</div>
                    <div className="flex flex-wrap gap-2">
                      {importPreview.headers.map((h, i) => (
                        <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-sm text-xs font-mono text-cyan-400">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>`;

const dataPreview = `
                  <div className="mb-6 border border-white/10 rounded-sm bg-black/40 overflow-hidden">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Data Preview (First 10 Rows)</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-500 bg-black/60">
                            {Object.keys(importPreview.validData[0] || {}).map((k) => (
                              <th key={k} className="p-2 truncate max-w-[150px]">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-slate-300">
                          {importPreview.validData.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                              {Object.values(row).map((v: any, i) => (
                                <td key={i} className="p-2 truncate max-w-[150px]">{String(v)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
`;

code = code.replace(`                  <div className="grid grid-cols-2 gap-4">`, headerPreviewInfo + `\n                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">`);
code = code.replace(`{importPreview.errors.length > 0 && (`, dataPreview + `\n                  {importPreview.errors.length > 0 && (`);

// Remove the inline Entity text
code = code.replace(`<p className="text-xs text-cyan-400 font-mono mt-1">Entity Detected: {importPreview.entityType.toUpperCase()}</p>`, ``);

fs.writeFileSync('src/components/DataCenter.tsx', code);

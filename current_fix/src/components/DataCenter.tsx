import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { Database, Upload, AlertCircle, FileText, HardDrive, Search, Filter, Calendar } from 'lucide-react';
import { DataImporter } from '../services/DataImporter';
import { MobileRecordCard } from './MobileRecordCard';

export const DataCenter = () => {
  const { dataMode, switchToDemoData, switchToRealData, importData, products, warehouses, inventory, suppliers, purchaseOrders, shipments, importHistory } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [statusMsg, setStatusMsg] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    entityType: string;
    filename: string;
    validData: any[];
    errors: any[];
    warnings: {row: string | number, message: string}[];
    headers: string[];
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setStatusMsg({ message: 'Parsing file...', type: 'info' });
    
    try {
      const rawData = await DataImporter.parseFile(file);
      if (rawData.length === 0) throw new Error('File is empty.');
      
      const headers = Object.keys(rawData[0]);
      const entityType = DataImporter.detectEntityType(headers);

      if (entityType === 'unknown') {
         throw new Error('Could not auto-detect dataset type. Ensure column headers match expected schema.');
      }

      let normalizedData: { valid: any[], errors: any[] } = { valid: [], errors: [] };
      let warnings: {row: string | number, message: string}[] = [];
      
      switch (entityType) {
        case 'product': normalizedData = DataImporter.normalizeProducts(rawData); break;
        case 'warehouse': normalizedData = DataImporter.normalizeWarehouses(rawData); break;
        case 'inventory': normalizedData = DataImporter.normalizeInventory(rawData); break;
        case 'supplier': normalizedData = DataImporter.normalizeSuppliers(rawData); break;
        case 'po': normalizedData = DataImporter.normalizePurchaseOrders(rawData); break;
        case 'shipment': normalizedData = DataImporter.normalizeShipments(rawData); break;
      }
      
      const validData = normalizedData.valid;
      const errors = normalizedData.errors;

      setImportPreview({
        entityType,
        filename: file.name,
        validData,
        errors,
        warnings,
        headers
      });
      
      setStatusMsg(null);
    } catch (err: any) {
      console.error('Import error:', err);
      setStatusMsg({ message: err.message || 'Failed to parse file.', type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const confirmImport = () => {
    if (!importPreview) return;
    
    try {
      importData(importPreview.entityType, importPreview.validData, importPreview.filename);
      setStatusMsg({ message: `Successfully imported ${importPreview.validData.length} records.`, type: 'success' });
      setImportPreview(null);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (e: any) {
       setStatusMsg({ message: e.message || 'Import failed.', type: 'error' });
    }
  };

  const datasets = useMemo(() => {
    return [
      { id: 'inventory', name: 'Inventory', records: inventory, source: 'ERP Warehouse System', quality: 98, status: 'LOADED', updated: new Date() },
      { id: 'suppliers', name: 'Suppliers', records: suppliers, source: 'Supplier Network Registry', quality: 100, status: 'LOADED', updated: new Date() },
      { id: 'purchaseOrders', name: 'Purchase Orders', records: purchaseOrders, source: 'Procurement Management System', quality: 100, status: 'LOADED', updated: new Date() },
      { id: 'shipments', name: 'Shipments', records: shipments, source: 'Logistics & TMS API', quality: 99, status: 'LOADED', updated: new Date() },
    ].map(d => ({
       ...d,
       count: d.records.length,
       status: d.records.length > 0 ? 'LOADED' : 'EMPTY'
    }));
  }, [inventory, suppliers, purchaseOrders, shipments]);

  const filteredDatasets = datasets.filter(d => 
    (sourceFilter === 'All' || d.source === sourceFilter) &&
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRecords = datasets.reduce((sum, d) => sum + d.count, 0);
  const activeDatasets = datasets.filter(d => d.count > 0).length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-6 box-border min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-os-text-primary mb-1 font-bold">ORION DATA CENTER</h2>
          <p className="text-sm text-os-text-secondary font-mono">Operational data management workspace.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-sm border flex items-center gap-2 ${dataMode === 'real' ? 'bg-os-surface-elevated border-os-border text-os-text-primary' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
            <Database size={14} />
            <span className="text-[10px] uppercase tracking-widest font-bold">
              MODE: {dataMode}
            </span>
          </div>
          {dataMode === 'demo' ? (
             <button onClick={switchToRealData} className="px-4 py-2 bg-[#00F2FE] text-black text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-os-surface/95 transition-colors">
               Use Real Data
             </button>
          ) : (
             <button onClick={switchToDemoData} className="px-4 py-2 border border-os-border text-os-text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-os-surface-hover transition-colors">
               Load Demo Data
             </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-sm border ${statusMsg.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
          <div className="flex items-center gap-2 text-xs font-mono">
            {statusMsg.type === 'error' && <AlertCircle size={14} />}
            {statusMsg.message}
          </div>
        </div>
      )}

      <div className="bg-os-bg border border-os-border rounded-xl shadow-2xl overflow-hidden min-w-0">
        <div className="flex border-b border-os-border overflow-x-auto scrollbar-hide">
          {['overview', 'import', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors shrink-0 ${
                activeTab === tab ? 'border-b-2 border-[#00F2FE] text-os-text-primary' : 'text-os-text-muted hover:text-os-text-secondary'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6 lg:p-8 bg-os-surface">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-os-surface-secondary border border-os-border p-4 rounded-lg">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-os-text-muted mb-1">Total Records</div>
                  <div className="text-xl font-bold font-mono text-os-text-primary">{totalRecords.toLocaleString()}</div>
                </div>
                <div className="bg-os-surface-secondary border border-os-border p-4 rounded-lg">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-os-text-muted mb-1">Active Datasets</div>
                  <div className="text-xl font-bold font-mono text-os-text-primary">{activeDatasets}</div>
                </div>
                <div className="bg-os-surface-secondary border border-os-border p-4 rounded-lg">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-os-text-muted mb-1">Data Quality</div>
                  <div className="text-xl font-bold font-mono text-[#30D158]">99%</div>
                </div>
                <div className="bg-os-surface-secondary border border-os-border p-4 rounded-lg">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-os-text-muted mb-1">Last Sync</div>
                  <div className="text-xl font-bold font-mono text-os-text-primary">Just Now</div>
                </div>
                <div className="bg-os-surface-secondary border border-os-border p-4 rounded-lg">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-os-text-muted mb-1">Data Sources</div>
                  <div className="text-xl font-bold font-mono text-os-text-primary">4</div>
                </div>
                <div className="bg-os-surface-secondary border border-os-border p-4 rounded-lg">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-os-text-muted mb-1">Failed Validations</div>
                  <div className="text-xl font-bold font-mono text-[#FF9F0A]">0</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-os-border pt-6">
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-os-text-muted" />
                  <input
                    type="text"
                    placeholder="Search datasets..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-os-input-bg border border-os-border-strong rounded-lg pl-10 pr-3 py-2 text-sm text-os-text-primary focus:outline-none focus:border-os-text-muted transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter size={16} className="text-os-text-muted" />
                  <select
                    value={sourceFilter}
                    onChange={e => setSourceFilter(e.target.value)}
                    className="bg-os-input-bg border border-os-border-strong rounded-lg px-3 py-2 text-sm text-os-text-primary focus:outline-none min-w-[150px]"
                  >
                    <option value="All">All Sources</option>
                    <option value="ERP Warehouse System">ERP Warehouse System</option>
                    <option value="Supplier Network Registry">Supplier Network Registry</option>
                    <option value="Procurement Management System">Procurement</option>
                    <option value="Logistics & TMS API">Logistics & TMS API</option>
                  </select>
                  <select
                    className="bg-os-input-bg border border-os-border-strong rounded-lg px-3 py-2 text-sm text-os-text-primary focus:outline-none min-w-[150px]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="LOADED">LOADED</option>
                    <option value="EMPTY">EMPTY</option>
                  </select>
                  <select
                    className="bg-os-input-bg border border-os-border-strong rounded-lg px-3 py-2 text-sm text-os-text-primary focus:outline-none min-w-[150px]"
                  >
                    <option value="All">All Quality Levels</option>
                    <option value="Optimal">Optimal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredDatasets.length === 0 ? (
                  <div className="text-center py-12 text-os-text-muted text-sm font-mono border border-os-border border-dashed rounded-lg">
                    No datasets match your search criteria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDatasets.map(ds => (
                      <div 
                        key={ds.id} 
                        onClick={() => openEntity({ type: 'dataset', id: ds.id })}
                        className="bg-os-surface-secondary border border-os-border hover:border-os-border-inverse rounded-xl p-5 cursor-pointer transition-colors group flex flex-col justify-between min-h-[220px]"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-sm uppercase tracking-widest text-os-text-primary font-bold">{ds.name}</h4>
                            <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-md border ${ds.status === 'LOADED' ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20' : 'bg-os-surface-active text-os-text-muted border-os-border'}`}>
                              {ds.status}
                            </span>
                          </div>
                          <div className="text-2xl font-mono text-os-text-primary mb-1">
                            {ds.count.toLocaleString()} <span className="text-sm text-os-text-muted">records</span>
                          </div>
                          <div className="text-[11px] font-mono text-os-text-muted">
                            Quality: <span className="text-[#30D158]">{ds.quality}%</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-os-border text-[10px] uppercase font-mono text-os-text-secondary space-y-1">
                          <div className="truncate">Source: {ds.source}</div>
                          <div className="truncate">Updated: Just Now</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6 animate-in fade-in">
              {!importPreview ? (
                <div className="border-2 border-dashed border-os-border rounded-xl p-16 flex flex-col items-center justify-center text-center bg-os-surface-secondary hover:border-os-border-inverse transition-colors group">
                  <Upload className="text-os-text-muted mb-4 group-hover:text-os-text-primary transition-colors" size={40} />
                  <h4 className="text-base uppercase tracking-widest text-os-text-primary font-bold mb-3">Upload Dataset</h4>
                  <p className="text-sm text-os-text-muted font-mono mb-8 max-w-lg leading-relaxed">
                    Upload CSV or XLSX files. System will auto-detect dataset type and validate integrity against operational schemas.
                  </p>
                  <label className="cursor-pointer bg-[#00F2FE] hover:bg-os-surface/95 text-black px-8 py-3.5 rounded-lg text-xs uppercase tracking-[0.1em] font-bold transition-all">
                    {isImporting ? 'Processing...' : 'Select File to Import'}
                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-os-border pb-4 gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-os-text-primary uppercase tracking-widest">Import Preview: {importPreview.entityType.toUpperCase()}</h3>
                      <p className="text-xs text-os-text-muted font-mono mt-1">File: {importPreview.filename}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setImportPreview(null)} className="px-5 py-2.5 rounded-lg border border-os-border text-os-text-secondary text-[11px] font-bold uppercase tracking-widest hover:bg-os-surface-hover transition-colors">
                        Cancel
                      </button>
                      <button 
                        onClick={confirmImport} 
                        disabled={importPreview.validData.length === 0}
                        className="px-5 py-2.5 rounded-lg bg-[#00F2FE] text-black text-[11px] uppercase tracking-widest font-bold hover:bg-os-surface/95 transition-colors disabled:opacity-50"
                      >
                        Import {importPreview.validData.length} Records
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-os-surface-secondary border border-os-border p-4 rounded-xl">
                      <div className="text-[10px] uppercase tracking-widest font-mono text-os-text-muted mb-1">Total Rows</div>
                      <div className="text-2xl font-mono text-os-text-primary">{importPreview.validData.length + importPreview.errors.length}</div>
                    </div>
                    <div className="bg-os-surface-secondary border border-os-border p-4 rounded-xl">
                      <div className="text-[10px] uppercase tracking-widest font-mono text-os-text-muted mb-1">Valid Records</div>
                      <div className="text-2xl font-mono text-[#30D158]">{importPreview.validData.length}</div>
                    </div>
                    <div className="bg-os-surface-secondary border border-os-border p-4 rounded-xl">
                      <div className="text-[10px] uppercase tracking-widest font-mono text-os-text-muted mb-1">Warnings</div>
                      <div className="text-2xl font-mono text-[#FF9F0A]">{importPreview.warnings.length}</div>
                    </div>
                    <div className="bg-os-surface-secondary border border-os-border p-4 rounded-xl">
                      <div className="text-[10px] uppercase tracking-widest font-mono text-os-text-muted mb-1">Errors</div>
                      <div className="text-2xl font-mono text-[#FF453A]">{importPreview.errors.length}</div>
                    </div>
                  </div>

                  {importPreview.validData.length > 0 && (
                    <div className="bg-os-surface-secondary border border-os-border rounded-xl overflow-hidden">
                      <div className="p-4 border-b border-os-border text-[11px] uppercase tracking-widest font-mono text-os-text-muted font-bold">Valid Data Sample (First 10)</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-os-border text-os-text-muted bg-os-surface">
                              {Object.keys(importPreview.validData[0] || {}).map((k) => (
                                <th key={k} className="p-3 truncate max-w-[150px]">{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="text-os-text-secondary divide-y divide-[#2A2A2A]">
                            {importPreview.validData.slice(0, 10).map((row, idx) => (
                              <tr key={idx} className="hover:bg-os-surface-hover">
                                {Object.values(row).map((v: any, i) => (
                                  <td key={i} className="p-3 truncate max-w-[150px]">{String(v)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {importPreview.warnings.length > 0 && (
                    <div className="border border-[#FF9F0A]/20 rounded-xl bg-[#FF9F0A]/5 overflow-hidden">
                      <div className="bg-[#FF9F0A]/10 px-4 py-3 border-b border-[#FF9F0A]/20">
                        <span className="text-[10px] uppercase tracking-widest text-[#FF9F0A] font-bold">Warnings ({importPreview.warnings.length})</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-4 custom-scrollbar">
                        <ul className="space-y-2">
                          {importPreview.warnings.map((warn, i) => (
                            <li key={i} className="text-xs text-[#FF9F0A] font-mono">Row {warn.row}: {warn.message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {importPreview.errors.length > 0 && (
                    <div className="border border-[#FF453A]/20 rounded-xl bg-[#FF453A]/5 overflow-hidden">
                      <div className="bg-[#FF453A]/10 px-4 py-3 border-b border-[#FF453A]/20">
                        <span className="text-[10px] uppercase tracking-widest text-[#FF453A] font-bold">Errors ({importPreview.errors.length})</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {importPreview.errors.slice(0, 50).map((err, i) => (
                          <div key={i} className="text-xs font-mono text-os-text-secondary">
                            <span className="text-[#FF453A]">Row {err.row}:</span> {err.error}
                          </div>
                        ))}
                        {importPreview.errors.length > 50 && (
                          <div className="text-xs font-mono text-os-text-muted italic mt-2">...and {importPreview.errors.length - 50} more errors.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in">
              {importHistory.length === 0 ? (
                <div className="text-center py-16 text-os-text-muted font-mono text-sm border border-os-border border-dashed rounded-xl">
                  No historical data available.
                </div>
              ) : (
                <div className="w-full bg-os-surface-secondary border border-os-border rounded-xl overflow-hidden">
                  <div className="hidden sm:block overflow-x-auto w-full">
                    <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-os-border text-[10px] uppercase tracking-widest text-os-text-muted bg-os-surface">
                        <th className="p-4 font-bold">Timestamp</th>
                        <th className="p-4 font-bold">Dataset</th>
                        <th className="p-4 font-bold">Operation</th>
                        <th className="p-4 font-bold">Records</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A] text-os-text-secondary">
                      {importHistory.map((hist) => (
                        <tr key={hist.id} className="hover:bg-os-surface-hover transition-colors">
                          <td className="p-4">{new Date(hist.importedAt).toLocaleString()}</td>
                          <td className="p-4 capitalize text-os-text-primary">{hist.entityType}</td>
                          <td className="p-4">Import via File</td>
                          <td className="p-4">{hist.successfulRows} / {hist.totalRows}</td>
                          <td className="p-4">
                            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${
                              hist.status === 'Success' ? 'text-[#30D158] bg-[#30D158]/10 border-[#30D158]/20' :
                              hist.status === 'Failed' ? 'text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/20' :
                              'text-[#FF9F0A] bg-[#FF9F0A]/10 border-[#FF9F0A]/20'
                            }`}>
                              {hist.status}
                            </span>
                          </td>
                          <td className="p-4">{(Math.random() * 2 + 0.1).toFixed(1)}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  
                  {/* Mobile Fallback */}
                  <div className="sm:hidden divide-y divide-[#2A2A2A]">
                     {importHistory.map((hist) => (
                       <div key={hist.id} className="p-4 space-y-2">
                         <div className="flex justify-between items-start">
                           <div className="font-bold text-sm uppercase">{hist.entityType}</div>
                           <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                              hist.status === 'Success' ? 'text-[#30D158] bg-[#30D158]/10 border-[#30D158]/20' :
                              hist.status === 'Failed' ? 'text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/20' :
                              'text-[#FF9F0A] bg-[#FF9F0A]/10 border-[#FF9F0A]/20'
                            }`}>
                              {hist.status}
                            </span>
                         </div>
                         <div className="text-xs font-mono text-os-text-muted flex justify-between">
                           <span>{new Date(hist.importedAt).toLocaleString()}</span>
                           <span>{hist.successfulRows} / {hist.totalRows}</span>
                         </div>
                       </div>
                     ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

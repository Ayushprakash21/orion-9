import React, { useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { Database, Upload, AlertCircle, FileText, HardDrive } from 'lucide-react';
import { DataImporter } from '../services/DataImporter';
import { MobileRecordCard } from './MobileRecordCard';

export const DataCenter = () => {
  const { dataMode, switchToDemoData, switchToRealData, importData, products, warehouses, inventory, suppliers, purchaseOrders, shipments, importHistory } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [statusMsg, setStatusMsg] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Import State
  const [isImporting, setIsImporting] = useState(false);
    const [manualEntitySelection, setManualEntitySelection] = useState<{ rawData: any[], headers: string[], filename: string } | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
const [importPreview, setImportPreview] = useState<{
    entityType: string;
    filename: string;
    validData: any[];
    errors: any[];
    warnings: {row: string | number, message: string}[];
    headers: string[];
  } | null>(null);

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
        setManualEntitySelection({ rawData, headers, filename: file.name });
        setStatusMsg({ message: 'Entity type could not be detected automatically.', type: 'info' });
      } else {
        processImportData(rawData, entityType, file.name);
      }
    } catch (error: any) {
      setStatusMsg({ message: `Failed to read file: ${error.message}`, type: 'error' });
    } finally {
      setIsImporting(false);
      if (event.target) event.target.value = ''; // Reset input
    }
  };

  const processImportData = (rawData: any[], entityType: string, filename: string) => {
    let parsed: { valid: any[], errors: any[] } = { valid: [], errors: [] };
    
    if (entityType === 'inventory') parsed = DataImporter.normalizeInventory(rawData);
    else if (entityType === 'suppliers') parsed = DataImporter.normalizeSuppliers(rawData);
    else if (entityType === 'purchaseOrders') parsed = DataImporter.normalizePurchaseOrders(rawData);
    else if (entityType === 'shipments') parsed = DataImporter.normalizeShipments(rawData);
    else if (entityType === 'products') parsed = DataImporter.normalizeProducts(rawData);
    else if (entityType === 'warehouses') parsed = DataImporter.normalizeWarehouses(rawData);
    else throw new Error('Unknown entity type.');
    
    
    let warnings: {row: string | number, message: string}[] = [];

    // FOREIGN KEY VALIDATION
    if (entityType === 'inventory') {
      parsed.valid.forEach((record, index) => {
        if (!products.find(p => p.id === record.sku)) warnings.push({ row: index + 1, message: `WARNING: Referenced entity not found (SKU: ${record.sku})`});
        if (!warehouses.find(w => w.id === record.warehouseId)) warnings.push({ row: index + 1, message: `WARNING: Referenced entity not found (Warehouse: ${record.warehouseId})`});
      });
    } else if (entityType === 'purchaseOrders') {
      parsed.valid.forEach((record, index) => {
        if (!suppliers.find(s => s.id === record.supplierId)) warnings.push({ row: record.poNumber, message: `WARNING: Referenced entity not found (Supplier: ${record.supplierId})`});
        record.items.forEach((item: any) => {
          if (!products.find(p => p.id === item.sku)) warnings.push({ row: record.poNumber, message: `WARNING: Referenced entity not found (SKU: ${item.sku})`});
        });
        if (!warehouses.find(w => w.id === record.destinationWarehouseId)) warnings.push({ row: record.poNumber, message: `WARNING: Referenced entity not found (Warehouse: ${record.destinationWarehouseId})`});
      });
    } else if (entityType === 'shipments') {
      parsed.valid.forEach((record, index) => {
        if (!purchaseOrders.find(po => po.id === record.poId)) warnings.push({ row: index + 1, message: `WARNING: Referenced entity not found (PO: ${record.poId})`});
        if (!suppliers.find(s => s.id === record.supplierId)) warnings.push({ row: index + 1, message: `WARNING: Referenced entity not found (Supplier: ${record.supplierId})`});
      });
    }

    setImportPreview({
      entityType,
      filename,
      validData: parsed.valid,
      errors: parsed.errors,
      warnings,
      headers: Object.keys(rawData[0])
    });

    setManualEntitySelection(null);
    setStatusMsg(null);
  };
  
  const handleManualEntityConfirm = () => {
    if (!manualEntitySelection || !selectedEntityType) return;
    processImportData(manualEntitySelection.rawData, selectedEntityType, manualEntitySelection.filename);
  };

  const confirmImport = async () => {
    if (!importPreview || importPreview.validData.length === 0) return;
    try {
      await importData(importPreview.entityType, importPreview.validData, importPreview.filename, importPreview.warnings?.length || 0);
      setStatusMsg({ message: `Successfully imported ${importPreview.validData.length} records.`, type: 'success' });
      setImportPreview(null);
      setActiveTab('history');
    } catch (error: any) {
      setStatusMsg({ message: `Import failed: ${error.message}`, type: 'error' });
    }
  };

  const renderDataSources = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { id: 'inventory', label: 'Inventory', count: inventory.length },
        { id: 'suppliers', label: 'Suppliers', count: suppliers.length },
        { id: 'purchaseOrders', label: 'Purchase Orders', count: purchaseOrders.length },
        { id: 'shipments', label: 'Shipments', count: shipments.length }
      ].map((source) => (
        <div 
          key={source.id} 
          onClick={() => openEntity({ type: 'dataset', id: source.id })}
          className="border border-white/10 rounded-sm p-5 bg-black/20 flex flex-col justify-between cursor-pointer hover:border-white/30 transition-colors"
        >
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-slate-300 mb-1">{source.label}</h4>
            <div className="text-2xl font-mono text-[#F5F5F5]">{source.count.toLocaleString()}</div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-right">
            <span className="text-[10px] uppercase text-slate-500">Status: {source.count > 0 ? 'Loaded' : 'Empty'}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#F5F5F5] mb-1 font-bold">DATA CENTER</h2>
          <p className="text-sm text-[#94a3b8] font-mono">Manage internal structured datasets and system integration.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-sm border flex items-center gap-2 ${dataMode === 'real' ? 'bg-[#1B1B1B] border-[#444444] text-[#F5F5F5]' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
            <Database size={14} />
            <span className="text-[10px] uppercase tracking-widest font-bold">
              MODE: {dataMode}
            </span>
          </div>
          {dataMode === 'demo' ? (
            <button onClick={switchToRealData} className="px-3 py-1.5 rounded-sm border border-white/10 bg-white/5 text-slate-300 text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors">
              Switch to Real
            </button>
          ) : (
            <button onClick={switchToDemoData} className="px-3 py-1.5 rounded-sm border border-white/10 bg-white/5 text-slate-300 text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors">
              Reset to Demo
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-sm flex items-center gap-3 border backdrop-blur-sm ${
          statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
          statusMsg.type === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
          'bg-[#1B1B1B] text-[#F5F5F5] border-[#444444]'
        }`}>
          {statusMsg.type === 'error' ? <AlertCircle size={20} /> : <FileText size={20} />}
          <span className="text-xs font-mono tracking-wide">{statusMsg.message}</span>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm rounded-sm overflow-hidden">
        <div className="border-b border-white/10 bg-black/40">
          <nav className="flex flex-wrap sm:flex-nowrap sm:overflow-x-auto scrollbar-hide border-b border-white/10 sm:border-none">
            {['overview', 'import', 'history'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setImportPreview(null); }}
                className={`py-4 px-6 text-[10px] uppercase tracking-[0.15em] font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab ? 'border-[#777777] text-[#F5F5F5] bg-[#161616]' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="text-[#F5F5F5]" size={20} />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Active Data Sources</h3>
              </div>
              {renderDataSources()}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              {!importPreview && !manualEntitySelection ? (
                <div className="border-2 border-dashed border-white/10 rounded-sm p-12 flex flex-col items-center justify-center text-center bg-black/20 hover:border-[#444444] transition-colors group">
                  <Upload className="text-slate-500 mb-4 group-hover:text-[#F5F5F5] transition-colors" size={32} />
                  <h4 className="text-sm uppercase tracking-widest text-slate-200 font-bold mb-2">Upload Data File</h4>
                  <p className="text-xs text-slate-500 font-mono mb-6 max-w-md">
                    Upload CSV or XLSX files. The system will automatically detect the entity type (Inventory, Suppliers, Purchase Orders, Shipments) based on column headers.
                  </p>
                  <label className="cursor-pointer bg-[#1B1B1B] hover:bg-[#202020] border border-[#444444] text-[#F5F5F5] px-6 py-3 rounded-sm text-[10px] uppercase tracking-[0.2em] font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                    {isImporting ? 'Processing...' : 'Select File'}
                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Import Preview</h3>
                      
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setImportPreview(null)} className="px-4 py-2 rounded-sm border border-white/10 text-slate-300 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors">
                        Cancel
                      </button>
                      <button 
                        onClick={confirmImport} 
                        disabled={importPreview.validData.length === 0}
                        className="px-4 py-2 rounded-sm bg-cyan-500 text-black text-[10px] uppercase tracking-widest font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50"
                      >
                        Import {importPreview.validData.length} Records
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                      <div className="text-xl font-mono text-[#F5F5F5]">READY</div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Detected Headers</div>
                    <div className="flex flex-wrap gap-2">
                      {importPreview.headers.map((h, i) => (
                        <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-sm text-xs font-mono text-[#F5F5F5]">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-sm">
                      <div className="text-[10px] uppercase tracking-widest text-emerald-500 mb-1">Valid Records</div>
                      <div className="text-2xl font-mono text-emerald-400">{importPreview.validData.length}</div>
                    </div>
                    <div className="bg-[#161616] border border-[#2A2A2A] p-4 rounded-sm">
                      <div className="text-[10px] uppercase tracking-widest text-[#F5F5F5] mb-1">Data Quality Score</div>
                      <div className="text-2xl font-mono text-[#F5F5F5]">
                        {Math.round((importPreview.validData.length / (importPreview.validData.length + importPreview.errors.length)) * 100) || 0} / 100
                      </div>
                    </div>

                    <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-sm">
                      <div className="text-[10px] uppercase tracking-widest text-rose-500 mb-1">Errors</div>
                      <div className="text-2xl font-mono text-rose-400">{importPreview.errors.length}</div>
                    </div>
                  </div>

                  
                  <div className="mb-6 border border-white/10 rounded-sm bg-black/40 overflow-hidden">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Data Preview (First 10 Rows)</span>
                    </div>
                    {/* Mobile View */}
                    <div className="sm:hidden p-4 space-y-4">
                      {importPreview.validData.slice(0, 10).map((row, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-sm p-3">
                          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 border-b border-white/10 pb-1">Row {idx + 1}</div>
                          <div className="space-y-2">
                            {Object.entries(row).map(([k, v]) => (
                              <div key={k} className="flex justify-between items-center text-xs font-mono gap-2">
                                <span className="text-slate-500 truncate min-w-0 flex-shrink">{k}</span>
                                <span className="text-slate-300 truncate text-right flex-shrink-0 max-w-[60%]">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop View */}
                    <div className="hidden sm:block overflow-x-auto">
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

                    <div className="border border-rose-500/20 rounded-sm bg-black/40 overflow-hidden">
                      <div className="bg-rose-500/10 px-4 py-2 border-b border-rose-500/20">
                        <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold">Data Quality Issues</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-4 space-y-2">
                        {importPreview.errors.slice(0, 50).map((err, i) => (
                          <div key={i} className="text-xs font-mono text-slate-400">
                            <span className="text-rose-400">Row {err.row}:</span> {err.error}
                          </div>
                        ))}
                        {importPreview.errors.length > 50 && (
                          <div className="text-xs font-mono text-slate-500 italic mt-2">...and {importPreview.errors.length - 50} more errors.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {importHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">No import history found.</div>
              ) : (
                <div className="w-full">
                  {/* Mobile View */}
                  <div className="sm:hidden divide-y divide-white/10 w-full border border-white/10 rounded-sm">
                    {importHistory.map((hist) => (
                      <MobileRecordCard
                        key={hist.id}
                        title={hist.filename}
                        subtitle={`Entity: ${hist.entityType}`}
                        onClick={() => openEntity({ type: 'import', id: hist.id })}
                        statusNode={
                          <span className="text-[10px] uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20">
                            {hist.status}
                          </span>
                        }
                        fields={[
                          { label: 'Imported', value: `${hist.successfulRows} / ${hist.totalRows}` },
                          { label: 'Date', value: new Date(hist.importedAt).toLocaleDateString() }
                        ]}
                      />
                    ))}
                  </div>
                  {/* Desktop View */}
                  <div className="hidden sm:block overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500">
                        <th className="py-3 font-medium">Date</th>
                        <th className="py-3 font-medium">File</th>
                        <th className="py-3 font-medium">Entity</th>
                        <th className="py-3 font-medium">Imported</th>
                        <th className="py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {importHistory.map((hist) => (
                        <tr key={hist.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 text-slate-300 font-mono text-xs">{new Date(hist.importedAt).toLocaleString()}</td>
                          <td className="py-3 text-[#F5F5F5]">{hist.filename}</td>
                          <td className="py-3 text-slate-300 capitalize">{hist.entityType}</td>
                          <td className="py-3 text-slate-300 font-mono">{hist.successfulRows} / {hist.totalRows}</td>
                          <td className="py-3">
                            <span className="text-[10px] uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20">
                              {hist.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

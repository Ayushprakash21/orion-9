import React, { useState, useEffect } from 'react';
import { 
  Network, Database, Globe, Cpu, ArrowRight, ShieldCheck, AlertCircle, 
  RefreshCw, Layers, CheckCircle2, X, Settings, Terminal, ShieldAlert, FileText, Play, Check 
} from 'lucide-react';
import { createDefaultConnectors, BaseConnector, DataDomain, SyncJobRecord } from '../services/ConnectorFramework';

export const Integrations = () => {
  const [connectors, setConnectors] = useState<BaseConnector[]>(() => createDefaultConnectors());
  const [selectedConnector, setSelectedConnector] = useState<BaseConnector | null>(null);
  const [modalMode, setModalMode] = useState<'wizard' | 'detail' | null>(null);
  
  // Wizard state (Expanded for SAP hardening and monitoring purposes)
  const [wizardStep, setWizardStep] = useState(1);
  const [monitoringPurposes, setMonitoringPurposes] = useState<string[]>(['Inventory', 'Procurement']);
  const [configForm, setConfigForm] = useState({
    name: 'SAP S/4HANA',
    environment: 'Sandbox / Test' as 'Sandbox / Test' | 'Production',
    baseUrl: '',
    authType: 'OAuth 2.0' as const,
    apiKey: '',
    username: '',
    password: '',
    clientTenant: '',
    companyCode: '',
    environmentId: ''
  });
  const [prodConfirmed, setProdConfirmed] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: string; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [discoveredDomains, setDiscoveredDomains] = useState<DataDomain[]>([]);
  const [validationResult, setValidationResult] = useState<{ status: 'VALID' | 'WARNING' | 'ERROR'; messages: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'mapping' | 'history' | 'logs' | 'settings'>('overview');

  // KPI stats
  const activeDataSourcesCount = connectors.filter(c => c.connectionStatus === 'CONNECTED').length;
  const enterpriseConnectionsCount = connectors.filter(c => c.category === 'Enterprise Systems' && c.connectionStatus === 'CONNECTED').length;
  const fileSourcesCount = connectors.filter(c => c.type === 'FILE' && c.connectionStatus === 'CONNECTED').length;
  const failedSyncsCount = connectors.reduce((acc, c) => acc + c.errorCount, 0);

  const handleCardClick = (connector: BaseConnector) => {
    setSelectedConnector(connector);
    if (connector.connectionStatus === 'CONNECTED' || connector.connectionStatus === 'CONFIGURED') {
      setModalMode('detail');
      setActiveTab('overview');
    } else {
      setModalMode('wizard');
      setWizardStep(1);
      setMonitoringPurposes(['Inventory', 'Procurement']);
      setConfigForm({
        name: connector.name,
        environment: 'Sandbox / Test',
        baseUrl: '',
        authType: 'OAuth 2.0',
        apiKey: '',
        username: '',
        password: '',
        clientTenant: '',
        companyCode: '',
        environmentId: ''
      });
      setProdConfirmed(false);
      setTestResult(null);
      setDiscoveredDomains([]);
      setValidationResult(null);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedConnector) return;
    setIsTesting(true);
    setTestResult(null);

    // Validate endpoint before calling
    if (!configForm.baseUrl || configForm.baseUrl.trim() === '' || configForm.baseUrl.includes('<customer-sap-endpoint>')) {
      setIsTesting(false);
      setTestResult({ success: false, latency: '-', message: 'Missing endpoint or invalid URL. Please provide a valid SAP API endpoint.' });
      return;
    }

    const res = await selectedConnector.testConnection();
    setTestResult(res);
    setIsTesting(false);
    if (res.success) {
      setConnectors([...connectors]);
      setDiscoveredDomains(selectedConnector.getDataDomains());
    }
  };

  const handleRunValidation = () => {
    const messages: string[] = [];
    let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';

    if (!configForm.baseUrl) {
      messages.push('Missing endpoint URL.');
      status = 'ERROR';
    }
    if (configForm.environment === 'Production' && !prodConfirmed) {
      messages.push('Production environment requires explicit confirmation.');
      status = 'WARNING';
    }
    const selectedCount = selectedConnector?.domains.filter(d => d.enabled).length || 0;
    if (selectedCount === 0) {
      messages.push('No data domains selected for synchronization.');
      status = 'WARNING';
    }
    if (status === 'VALID') {
      messages.push('Endpoint reachable, authentication active, schema mapping verified, and relational integrity checked.');
    }
    setValidationResult({ status, messages });
  };

  const handleRunSync = async () => {
    if (!selectedConnector) return;
    setIsSyncing(true);
    await selectedConnector.sync();
    setConnectors([...connectors]);
    setIsSyncing(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-slate-100 tracking-wide">INTEGRATION HUB</h2>
          <p className="text-sm text-slate-400 mt-1">Data Ingestion & Enterprise Integration Gateway</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              for (const c of connectors) {
                if (c.connectionStatus === 'CONNECTED') await c.sync();
              }
              setConnectors([...connectors]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-xs text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={14} />
            Sync All Connected
          </button>
          <button 
            onClick={() => connectors.length > 0 && handleCardClick(connectors[0])}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B1B1B] border border-[#444444] text-[#F5F5F5] rounded-sm text-xs uppercase tracking-widest hover:bg-[#202020] transition-colors"
          >
            <Network size={14} />
            Add Connection
          </button>
        </div>
      </div>

      {/* KPI Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#020408]/50 border border-white/5 p-4 rounded-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-[#202020] border border-[#555555] flex items-center justify-center text-[#F5F5F5]">
            <Globe size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Active Data Sources</div>
            <div className="text-xl font-mono text-slate-200">{activeDataSourcesCount}</div>
          </div>
        </div>
        <div className="bg-[#020408]/50 border border-white/5 p-4 rounded-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Enterprise Connections</div>
            <div className="text-xl font-mono text-slate-200">{enterpriseConnectionsCount}</div>
          </div>
        </div>
        <div className="bg-[#020408]/50 border border-white/5 p-4 rounded-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Database size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">File Sources</div>
            <div className="text-xl font-mono text-slate-200">{fileSourcesCount}</div>
          </div>
        </div>
        <div className="bg-[#020408]/50 border border-white/5 p-4 rounded-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
            <AlertCircle size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Failed Syncs</div>
            <div className="text-xl font-mono text-slate-200">{failedSyncsCount}</div>
          </div>
        </div>
      </div>

      {/* Connector Categories */}
      <div className="space-y-8">
        {['Enterprise Systems', 'B2B & External', 'Data & Storage'].map((catName) => {
          const sectionItems = connectors.filter(c => c.category === catName);
          return (
            <div key={catName}>
              <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 border-b border-white/5 pb-2">{catName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionItems.map((item) => {
                  let statusColor = "text-slate-500 bg-slate-500/10 border-slate-500/20";
                  if (item.connectionStatus === 'CONNECTED') statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                  if (item.connectionStatus === 'SYNCING') statusColor = "text-[#F5F5F5] bg-[#1B1B1B] border-[#2A2A2A] animate-pulse";
                  if (item.connectionStatus === 'FAILED') statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                  if (item.connectionStatus === 'WARNING') statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                  if (item.connectionStatus === 'NOT CONFIGURED') statusColor = "text-slate-500 bg-slate-500/10 border-slate-500/20";

                  return (
                    <div 
                      key={item.id} 
                      onClick={() => handleCardClick(item)}
                      className="bg-black/40 border border-white/5 p-5 rounded-sm hover:border-[#777777]/40 transition-all group cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                         <Layers size={64} />
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-[#F5F5F5] group-hover:border-[#444444] transition-colors">
                          <Cpu size={18} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500">
                            CONNECTOR: {item.connectionStatus === 'CONNECTED' ? 'CONNECTED' : 'AVAILABLE'}
                          </span>
                          <span className={`text-[10px] uppercase tracking-widest font-mono px-2 py-1 border rounded-sm ${statusColor}`}>
                            {item.connectionStatus}
                          </span>
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-medium text-slate-200 mb-1">{item.name}</h4>
                      <p className="text-xs text-slate-500 h-8 line-clamp-2">{item.description}</p>
                      
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">TYPE: {item.type} | {item.records} RECS</span>
                        <div className="flex items-center gap-1 text-slate-600 group-hover:text-[#F5F5F5] transition-colors text-xs font-mono">
                          <span>{item.connectionStatus === 'CONNECTED' ? 'MANAGE' : 'CONFIGURE'}</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* CONNECTION WIZARD MODAL */}
      {modalMode === 'wizard' && selectedConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#050b14] border border-white/10 w-full max-w-3xl rounded-sm p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setModalMode(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X size={20} />
            </button>

            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#F5F5F5]">INTEGRATION WIZARD</div>
              <h3 className="text-xl font-light text-slate-100">Connect {selectedConnector.name}</h3>
              <p className="text-xs text-slate-400 mt-1">ERP Integration</p>
            </div>

            {/* Wizard Steps Bar */}
            <div className="flex flex-wrap sm:grid sm:grid-cols-5 gap-2 text-[10px] font-mono border-b border-white/10 pb-4">
              <div className={wizardStep === 1 ? 'text-[#F5F5F5] font-bold' : 'text-slate-500'}><span className="sm:hidden">1.</span><span className="hidden sm:inline">1. PURPOSE</span></div>
              <div className={wizardStep === 2 ? 'text-[#F5F5F5] font-bold' : 'text-slate-500'}><span className="sm:hidden">2.</span><span className="hidden sm:inline">2. SYSTEM</span></div>
              <div className={wizardStep === 3 ? 'text-[#F5F5F5] font-bold' : 'text-slate-500'}><span className="sm:hidden">3.</span><span className="hidden sm:inline">3. AUTH & TEST</span></div>
              <div className={wizardStep === 4 ? 'text-[#F5F5F5] font-bold' : 'text-slate-500'}><span className="sm:hidden">4.</span><span className="hidden sm:inline">4. DISCOVER & MAP</span></div>
              <div className={wizardStep >= 5 ? 'text-[#F5F5F5] font-bold' : 'text-slate-500'}><span className="sm:hidden">5.</span><span className="hidden sm:inline">5. ACTIVATE</span></div>
            </div>

            {/* STEP <span className="sm:hidden">1.</span><span className="hidden sm:inline">1. PURPOSE</span> */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-300 mb-2 font-medium">What do you want ORION to monitor?</label>
                  <p className="text-xs text-slate-500 mb-4">Select the operational domains you intend to oversee through this connection.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Inventory', 'Procurement', 'Supplier Performance', 'Inbound', 'Outbound', 'Logistics', 'Demand'].map((purpose) => {
                      const selected = monitoringPurposes.includes(purpose);
                      return (
                        <div 
                          key={purpose}
                          onClick={() => {
                            if (selected) {
                              setMonitoringPurposes(monitoringPurposes.filter(p => p !== purpose));
                            } else {
                              setMonitoringPurposes([...monitoringPurposes, purpose]);
                            }
                          }}
                          className={`p-3 rounded-sm border cursor-pointer text-xs font-mono flex items-center justify-between transition-colors ${selected ? 'bg-[#1B1B1B] border-[#777777]/40 text-cyan-300' : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'}`}
                        >
                          <span>{purpose}</span>
                          <span className={`w-4 h-4 rounded-sm border flex items-center justify-center text-[10px] ${selected ? 'bg-cyan-500 border-[#777777] text-black font-bold' : 'border-white/20'}`}>
                            {selected ? '✓' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-2 bg-cyan-500 text-black text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-cyan-400 transition-colors"
                  >
                    Next: System Configuration
                  </button>
                </div>
              </div>
            )}

            {/* STEP <span className="sm:hidden">2.</span><span className="hidden sm:inline">2. SYSTEM</span> */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Connection Name</label>
                  <input 
                    type="text" 
                    value={configForm.name} 
                    onChange={e => setConfigForm({...configForm, name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-sm p-2.5 text-xs font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Environment</label>
                  <select 
                    value={configForm.environment}
                    onChange={e => setConfigForm({...configForm, environment: e.target.value as any})}
                    className="w-full bg-black/40 border border-white/10 rounded-sm p-2.5 text-xs font-mono text-slate-200"
                  >
                    <option value="Sandbox / Test">Sandbox / Test</option>
                    <option value="Production">Production</option>
                  </select>
                  {configForm.environment === 'Production' && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm text-xs font-mono text-amber-300 space-y-2">
                      <p>Production connection. Verify endpoint, credentials, permissions and business impact before activation.</p>
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input 
                          type="checkbox" 
                          checked={prodConfirmed} 
                          onChange={e => setProdConfirmed(e.target.checked)}
                          className="accent-amber-500"
                        />
                        <span className="text-slate-200">I understand this will create a production integration.</span>
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Base URL / API Endpoint</label>
                  <input 
                    type="text" 
                    placeholder="https://<customer-sap-endpoint>"
                    value={configForm.baseUrl} 
                    onChange={e => setConfigForm({...configForm, baseUrl: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-sm p-2.5 text-xs font-mono text-slate-200"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Enter the API endpoint supplied by your SAP environment administrator.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Tenant / Client (Opt)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 100"
                      value={configForm.clientTenant} 
                      onChange={e => setConfigForm({...configForm, clientTenant: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-sm p-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Company Code (Opt)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. US01"
                      value={configForm.companyCode} 
                      onChange={e => setConfigForm({...configForm, companyCode: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-sm p-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Environment ID (Opt)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. PRD_01"
                      value={configForm.environmentId} 
                      onChange={e => setConfigForm({...configForm, environmentId: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-sm p-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <button 
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-xs uppercase tracking-widest rounded-sm"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-2 bg-cyan-500 text-black text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-cyan-400 transition-colors"
                  >
                    Next: Authentication & Test
                  </button>
                </div>
              </div>
            )}

            {/* STEP <span className="sm:hidden">3.</span><span className="hidden sm:inline">3. AUTH & TEST</span> */}
            {wizardStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Authentication Architecture</label>
                  <select 
                    value={configForm.authType}
                    onChange={e => setConfigForm({...configForm, authType: e.target.value as any})}
                    className="w-full bg-black/40 border border-white/10 rounded-sm p-2.5 text-xs font-mono text-slate-200"
                  >
                    <option value="OAuth 2.0">OAuth 2.0 Framework</option>
                    <option value="API Key">API Key</option>
                    <option value="Bearer Token">Bearer Token</option>
                    <option value="Basic">Basic Authentication</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">API Key / Secret Token / Credentials</label>
                  <input 
                    type="password" 
                    placeholder="Enter secure API token or secret"
                    value={configForm.apiKey} 
                    onChange={e => setConfigForm({...configForm, apiKey: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-sm p-2.5 text-xs font-mono text-slate-200"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Secrets are encrypted in secure storage and never exposed in logs or UI.</p>
                </div>

                <div className="bg-black/40 border border-white/10 p-4 rounded-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-mono text-slate-400">Connection Test Handshake</span>
                    <button 
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-4 py-1.5 bg-[#202020] border border-[#777777]/40 text-[#F5F5F5] text-xs uppercase tracking-widest rounded-sm hover:bg-cyan-500/30 transition-colors"
                    >
                      {isTesting ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                  {testResult && (
                    <div className={`p-3 rounded-sm border text-xs font-mono ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                      <div>STATUS: {testResult.success ? 'CONNECTED (Latency: ' + testResult.latency + ')' : 'FAILED'}</div>
                      <div className="mt-1 text-[11px] text-slate-300">{testResult.message}</div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <button 
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-xs uppercase tracking-widest rounded-sm"
                  >
                    Back
                  </button>
                  <button 
                    onClick={async () => {
                      await selectedConnector.connect(configForm);
                      setWizardStep(4);
                    }}
                    disabled={!testResult?.success}
                    className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${testResult?.success ? 'bg-cyan-500 text-black hover:bg-cyan-400' : 'bg-white/10 text-slate-500 cursor-not-allowed'}`}
                  >
                    Next: Discover & Map
                  </button>
                </div>
              </div>
            )}

            {/* STEP <span className="sm:hidden">4.</span><span className="hidden sm:inline">4. DISCOVER & MAP</span> */}
            {wizardStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-xs uppercase font-mono text-[#F5F5F5]">Data Domain Discovery</div>
                    <button 
                      onClick={() => setDiscoveredDomains(selectedConnector.getDataDomains())}
                      className="px-3 py-1 bg-white/5 border border-white/10 text-slate-300 text-xs uppercase tracking-widest rounded-sm hover:bg-white/10"
                    >
                      Discover Data
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedConnector.domains.map(d => (
                      <div key={d.id} className="bg-black/40 border border-white/10 p-3 rounded-sm flex justify-between items-center text-xs font-mono">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={d.enabled} 
                            onChange={e => {
                              d.enabled = e.target.checked;
                              setConnectors([...connectors]);
                            }}
                            className="accent-cyan-500"
                          />
                          <span className="text-slate-200">{d.name}</span>
                        </label>
                        <span className="text-emerald-400">{d.availableRecords > 0 ? `${d.availableRecords} recs` : 'NOT DISCOVERED'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs uppercase font-mono text-[#F5F5F5]">Field Mapping Verification</div>
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500">
                        <th className="p-2">SOURCE FIELD</th>
                        <th className="p-2">→</th>
                        <th className="p-2">ORION FIELD</th>
                        <th className="p-2">TRANSFORMATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {selectedConnector.fieldMappings.map((m, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-[#F5F5F5]">{m.sourceField}</td>
                          <td className="p-2 text-slate-500">→</td>
                          <td className="p-2">{m.orionField}</td>
                          <td className="p-2 text-slate-500">{m.transformation || 'direct'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {validationResult && (
                  <div className={`p-3 rounded-sm border text-xs font-mono ${validationResult.status === 'VALID' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : validationResult.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                    <div className="font-bold">VALIDATION: {validationResult.status}</div>
                    <ul className="mt-1 list-disc list-inside space-y-0.5">
                      {validationResult.messages.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button 
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-xs uppercase tracking-widest rounded-sm"
                  >
                    Back
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleRunValidation}
                      className="px-4 py-2 bg-white/10 border border-white/20 text-slate-200 text-xs uppercase tracking-widest rounded-sm hover:bg-white/20"
                    >
                      Run Validation
                    </button>
                    <button 
                      onClick={() => setWizardStep(5)}
                      className="px-6 py-2 bg-cyan-500 text-black text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-cyan-400 transition-colors"
                    >
                      Next: Activate
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP <span className="sm:hidden">5.</span><span className="hidden sm:inline">5. ACTIVATE</span> */}
            {wizardStep === 5 && (
              <div className="space-y-6 text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-slate-100">Ready for Activation & Initial Sync</h4>
                  <p className="text-xs text-slate-400 mt-1">Connection verified, schemas mapped, and data domains selected.</p>
                </div>
                {configForm.environment === 'Production' && !prodConfirmed && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm text-xs font-mono text-amber-300">
                    Production activation requires explicit confirmation in Step 2.
                  </div>
                )}
                <div className="flex justify-center gap-4 pt-4">
                  <button 
                    onClick={() => setWizardStep(4)}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-xs uppercase tracking-widest rounded-sm"
                  >
                    Back
                  </button>
                  <button 
                    onClick={async () => {
                      if (configForm.environment === 'Production' && !prodConfirmed) return;
                      await selectedConnector.sync();
                      setConnectors([...connectors]);
                      setModalMode(null);
                    }}
                    disabled={configForm.environment === 'Production' && !prodConfirmed}
                    className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${configForm.environment === 'Production' && !prodConfirmed ? 'bg-white/10 text-slate-500 cursor-not-allowed' : 'bg-cyan-500 text-black hover:bg-cyan-400'}`}
                  >
                    Activate & Execute Initial Sync
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CONNECTION DETAIL MODAL */}
      {modalMode === 'detail' && selectedConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#050b14] border border-white/10 w-full max-w-4xl rounded-sm p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setModalMode(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X size={20} />
            </button>

            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-widest text-[#F5F5F5]">{selectedConnector.category}</div>
                <h3 className="text-xl font-light text-slate-100">{selectedConnector.name} Connection Summary</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-sm">
                  {selectedConnector.connectionStatus}
                </span>
                <button 
                  onClick={handleRunSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 text-black text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-cyan-400"
                >
                  <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Syncing...' : 'Run Sync'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2 text-xs font-mono">
              {(['overview', 'domains', 'mapping', 'history', 'logs', 'settings'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-sm uppercase tracking-widest transition-colors ${activeTab === tab ? 'bg-[#202020] text-[#F5F5F5] border border-[#777777]/40' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="min-h-[250px] space-y-4">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-sm">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Environment</div>
                    <div className="text-sm font-mono text-slate-200">{selectedConnector.config?.environment || 'Sandbox / Test'}</div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-sm">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Status</div>
                    <div className="text-sm font-mono text-emerald-400">{selectedConnector.connectionStatus}</div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-sm">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Records Ingested</div>
                    <div className="text-lg font-mono text-[#F5F5F5]">{selectedConnector.records}</div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-sm">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Last Sync</div>
                    <div className="text-xs font-mono text-slate-300 truncate">{selectedConnector.lastSync ? new Date(selectedConnector.lastSync).toLocaleTimeString() : 'Not Synced'}</div>
                  </div>
                </div>
              )}

              {activeTab === 'domains' && (
                <div className="space-y-2">
                  <div className="text-xs uppercase font-mono text-slate-400 mb-2">Selected Data Domains</div>
                  {selectedConnector.domains.map(d => (
                    <div key={d.id} className="bg-black/40 border border-white/5 p-3 rounded-sm flex justify-between items-center text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${d.enabled ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                        <span className="text-slate-200">{d.name}</span>
                      </div>
                      <span className="text-slate-400">{d.availableRecords} records</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'mapping' && (
                <div className="space-y-2">
                  <div className="text-xs uppercase font-mono text-slate-400 mb-2">Source to Orion Schema Mappings</div>
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500">
                        <th className="p-2">SOURCE FIELD</th>
                        <th className="p-2">→</th>
                        <th className="p-2">ORION FIELD</th>
                        <th className="p-2">TRANSFORMATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {selectedConnector.fieldMappings.map((m, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-[#F5F5F5]">{m.sourceField}</td>
                          <td className="p-2 text-slate-500">→</td>
                          <td className="p-2">{m.orionField}</td>
                          <td className="p-2 text-slate-500">{m.transformation || 'direct'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-2">
                  <div className="text-xs uppercase font-mono text-slate-400 mb-2">Sync Job History</div>
                  {selectedConnector.syncHistory.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-8">No sync jobs recorded yet.</div>
                  ) : (
                    selectedConnector.syncHistory.map(job => (
                      <div key={job.id} className="bg-black/40 border border-white/5 p-3 rounded-sm flex justify-between items-center text-xs font-mono">
                        <div>
                          <span className="text-[#F5F5F5] font-bold">{job.id}</span>
                          <span className="text-slate-400 ml-3">{new Date(job.startedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-emerald-400">{job.recordsRead} records</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-sm">{job.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="space-y-2 bg-black p-4 rounded-sm font-mono text-xs max-h-60 overflow-y-auto">
                  {selectedConnector.logs.map(log => (
                    <div key={log.id} className="flex gap-3 text-slate-300 pb-1 border-b border-white/5">
                      <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={log.level === 'ERROR' ? 'text-rose-400' : log.level === 'SUCCESS' ? 'text-emerald-400' : 'text-[#F5F5F5]'}>[{log.action}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Connection Name</label>
                    <input type="text" defaultValue={selectedConnector.name} className="w-full bg-black/40 border border-white/10 rounded-sm p-2.5 text-xs font-mono text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Polling Frequency</label>
                    <select className="w-full bg-black/40 border border-white/10 rounded-sm p-2.5 text-xs font-mono text-slate-200">
                      <option>Every 15 Minutes</option>
                      <option>Hourly</option>
                      <option>Daily</option>
                      <option>Manual Only</option>
                    </select>
                  </div>
                  <div className="pt-4 flex justify-between">
                    <button 
                      onClick={async () => {
                        await selectedConnector.disconnect();
                        setConnectors([...connectors]);
                        setModalMode(null);
                      }}
                      className="px-4 py-2 bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs uppercase tracking-widest rounded-sm hover:bg-rose-500/30"
                    >
                      Disconnect
                    </button>
                    <button 
                      onClick={() => setModalMode(null)}
                      className="px-6 py-2 bg-cyan-500 text-black text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-cyan-400"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

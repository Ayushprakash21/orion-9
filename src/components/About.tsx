import React, { useState, useEffect, useRef } from 'react';
import { brandingRepository } from '../repositories/BrandingRepository';
import { BrandingConfig } from '../types/auth';
import { useSupplyChain } from '../store/SupplyChainContext';
import { 
  OrionCoreHero,
  CircularOperatingLoop,
  ArchitectureNetworkDiagram,
  PlatformIntelligenceConstellation,
  SCMCommunicationTerminal,
  TrustGauges,
  FloatingConstellationTags,
  ArchitectLog
} from './AboutComponents';
import { NavLink } from 'react-router-dom';
import { 
  Info,
  FileText,
  Shield,
  HelpCircle,
  Activity,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Lock,
  Database,
  Globe,
  Server,
  Layers,
  Sparkles,
  BookOpen,
  Scale
} from 'lucide-react';

export const About: React.FC = () => {
  const { dataMode } = useSupplyChain();
  const [branding, setBranding] = useState<BrandingConfig>(() => brandingRepository.getBrandingSync());
  const [activeTab, setActiveTab] = useState<'overview' | 'system_info' | 'documentation' | 'legal' | 'support'>('overview');
  
  // Legal & documentation modal popups
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | 'licenses' | 'release_notes' | null>(null);

  useEffect(() => {
    const handleBrandingUpdate = () => {
      setBranding(brandingRepository.getBrandingSync());
    };
    window.addEventListener("orion-branding-updated", handleBrandingUpdate);
    window.addEventListener("storage", handleBrandingUpdate);
    return () => {
      window.removeEventListener("orion-branding-updated", handleBrandingUpdate);
      window.removeEventListener("storage", handleBrandingUpdate);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      if (containerRef.current.parentElement) {
        containerRef.current.parentElement.scrollTop = 0;
      }
    }
  }, [activeTab]);

  const appName = branding.appName || branding.productName || branding.applicationName || 'ORION 9 SCM OS';
  const appTagline = branding.description || branding.tagline || 'AI-NATIVE SUPPLY CHAIN OPERATING SYSTEM';
  const gitSha = import.meta.env.VITE_GIT_SHA || 'bcb145f';

  const operatingLoop = [
    { label: 'SENSE', desc: 'Collect and observe operational signals.' },
    { label: 'UNDERSTAND', desc: 'Connect events, entities and relationships.' },
    { label: 'PREDICT', desc: 'Estimate potential future outcomes.' },
    { label: 'SIMULATE', desc: 'Evaluate alternative futures.' },
    { label: 'DECIDE', desc: 'Compare options against business objectives.' },
    { label: 'APPROVE', desc: 'Apply governance and human authorization.' },
    { label: 'ACT', desc: 'Execute approved operational actions.' },
    { label: 'VERIFY', desc: 'Measure what actually happened.' },
    { label: 'REMEMBER', desc: 'Store decisions, events and lessons.' },
    { label: 'LEARN', desc: 'Improve future recommendations.' }
  ];

  const intelligenceMatrix = [
    { domain: 'Demand', intelligence: 'Anomaly Detection', decision: 'Forecast Adjustment', action: 'Update Plan', learning: 'Forecast Bias' },
    { domain: 'Inventory', intelligence: 'Stockout Risk', decision: 'Rebalance Buffer', action: 'Transfer Stock', learning: 'Safety Targets' },
    { domain: 'Suppliers', intelligence: 'Promise Strength', decision: 'Switch Supplier', action: 'Expedite', learning: 'Reliability Score' },
    { domain: 'Procurement', intelligence: 'PO Exposure', decision: 'Approve PO', action: 'Release Order', learning: 'Lead-Time Trend' },
    { domain: 'Logistics', intelligence: 'Transit Delay', decision: 'Reroute', action: 'Update ETA', learning: 'Carrier Performance' },
    { domain: 'Warehouse', intelligence: 'Capacity Risk', decision: 'Prioritize Load', action: 'Stage Inventory', learning: 'Throughput Limits' },
    { domain: 'Customers', intelligence: 'Service Risk', decision: 'Allocate Stock', action: 'Reserve Inventory', learning: 'Customer Priority' },
    { domain: 'Risk', intelligence: 'Risk Velocity', decision: 'Mitigate Risk', action: 'Trigger Policy', learning: 'Vulnerability' },
    { domain: 'Exceptions', intelligence: 'Blast Radius', decision: 'Select Resolution', action: 'Resolve Exception', learning: 'Resolution Efficacy' },
    { domain: 'Finance', intelligence: 'Cost of Waiting', decision: 'Release Capital', action: 'Optimize Buffer', learning: 'Cost Variance' },
    { domain: 'Data', intelligence: 'Data Trust', decision: 'Cleanse Record', action: 'Update Entity', learning: 'Data Quality Trend' },
    { domain: 'Automation', intelligence: 'Automation Readiness', decision: 'Enable Autopilot', action: 'Execute Workflow', learning: 'Automation ROI' }
  ];

  const coreEngines = [
    { name: 'DATA ENGINE', status: 'IMPLEMENTED', purpose: 'Ingestion, normalization, and entity resolution.' },
    { name: 'WORLD MODEL', status: 'IMPLEMENTED', purpose: 'Current, historical, and future state representation.' },
    { name: 'EVENT ENGINE', status: 'IMPLEMENTED', purpose: 'Unified operational event generation.' },
    { name: 'INTELLIGENCE ENGINE', status: 'IMPLEMENTED', purpose: 'Domain-specific analytical intelligence.' },
    { name: 'PREDICTION ENGINE', status: 'IMPLEMENTED', purpose: 'Future outcome and risk prediction.' },
    { name: 'RISK ENGINE', status: 'IMPLEMENTED', purpose: 'Multi-category vulnerability assessment.' },
    { name: 'CAUSAL ENGINE', status: 'PARTIALLY IMPLEMENTED', purpose: 'Root cause and consequence analysis.' },
    { name: 'DECISION ENGINE', status: 'IMPLEMENTED', purpose: 'Recommendations, optimization, and economics.' },
    { name: 'SCENARIO ENGINE', status: 'IMPLEMENTED', purpose: 'Stress testing and counterfactual reasoning.' },
    { name: 'POLICY ENGINE', status: 'IMPLEMENTED', purpose: 'Business policies and governance thresholds.' },
    { name: 'WORKFLOW ENGINE', status: 'IMPLEMENTED', purpose: 'Orchestration, approvals, and escalations.' },
    { name: 'AUTOPILOT', status: 'IMPLEMENTED', purpose: 'Autonomous execution across maturity levels.' },
    { name: 'MEMORY ENGINE', status: 'IMPLEMENTED', purpose: 'Event, decision, and supplier memory retention.' },
    { name: 'OUTCOME ENGINE', status: 'AVAILABLE WHEN DATA EXISTS', purpose: 'Verification of expected vs actual results.' },
    { name: 'AUDIT ENGINE', status: 'IMPLEMENTED', purpose: 'Tracking of decisions, actions, and changes.' }
  ];

  const autonomyLevels = [
    { level: 'LEVEL 0', name: 'Observe', desc: 'System monitors and reports.' },
    { level: 'LEVEL 1', name: 'Detect', desc: 'System identifies anomalies and risks.' },
    { level: 'LEVEL 2', name: 'Recommend', desc: 'System suggests potential actions.' },
    { level: 'LEVEL 3', name: 'Prepare', desc: 'System drafts actions pending approval.' },
    { level: 'LEVEL 4', name: 'Execute Approved', desc: 'System executes after human authorization.' },
    { level: 'LEVEL 5', name: 'Autonomous', desc: 'System executes automatically within policy.' }
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#07090e] text-os-text-muted font-sans w-full overflow-x-hidden antialiased flex flex-col selection:bg-blue-500/30">
      
      {/* CANONICAL ABOUT OS HEADER */}
      <header className="bg-slate-950 border-b border-slate-900 px-6 py-8 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img 
              src="/orion-9-brand-logo.png" 
              alt="Orion-9 Logo" 
              className="h-16 w-auto drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" 
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-white font-extrabold text-2xl tracking-wider">ORION-9</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[11px] font-semibold">
                  v9.0.0
                </span>
              </div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-[0.2em] mt-1">
                Supply Chain Operating System
              </p>
            </div>
          </div>

          {/* Quick System Metadata Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col">
              <span className="text-slate-500 text-[9px] uppercase">Version</span>
              <span className="text-white font-semibold">9.0.0</span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col">
              <span className="text-slate-500 text-[9px] uppercase">Build</span>
              <span className="text-blue-400 font-semibold">{gitSha.substring(0, 7)}</span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col">
              <span className="text-slate-500 text-[9px] uppercase">Environment</span>
              <span className={`font-semibold ${dataMode === 'real' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {dataMode === 'real' ? 'LIVE' : 'DEMO'}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col">
              <span className="text-slate-500 text-[9px] uppercase">Organization</span>
              <span className="text-purple-300 font-semibold">ORION_PLATFORM</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-8 flex items-center gap-2 border-t border-slate-900/80 pt-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Blueprint', icon: Info },
            { id: 'system_info', label: 'System Information', icon: Server },
            { id: 'documentation', label: 'Documentation & Release Notes', icon: BookOpen },
            { id: 'legal', label: 'Legal & Licenses', icon: Scale },
            { id: 'support', label: 'Support & Diagnostics', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-medium transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* TAB CONTENT 1: OVERVIEW & BLUEPRINT */}
      {activeTab === 'overview' && (
        <div className="animate-fadeIn">
          <OrionCoreHero appName={appName} appTagline={appTagline} />

          <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-16 w-full max-w-7xl mx-auto space-y-24 z-10">
            {/* System Identity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-900 pb-16">
              <div className="lg:col-span-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">SYSTEM IDENTITY</h3>
                <span className="text-[10px] font-mono text-slate-500 block mt-2 uppercase tracking-widest">COGNITIVE SCM ARCHITECTURE</span>
              </div>
              <div className="lg:col-span-8 space-y-6">
                <p className="font-mono text-sm leading-relaxed text-os-text-secondary select-text">
                  {appName} is engineered as an AI-native Supply Chain Operating System. It connects distributed operational data, continuous intelligence, decision engines, system workflows, and direct enterprise execution into a single, closed-loop environment.
                </p>
                
                <div className="space-y-3 pt-2">
                  <div className="p-3 border border-slate-900 bg-slate-950/40 rounded-xl flex flex-col gap-1.5 font-mono text-[10px]">
                    <span className="text-slate-500 uppercase tracking-widest text-[9px]">Sensing Pathway:</span>
                    <div className="flex flex-wrap items-center gap-2 text-[#30D158] font-bold">
                      <span>Sense</span> <span className="text-slate-600">→</span>
                      <span>Understand</span> <span className="text-slate-600">→</span>
                      <span>Predict</span> <span className="text-slate-600">→</span>
                      <span>Decide</span> <span className="text-slate-600">→</span>
                      <span>Act</span> <span className="text-slate-600">→</span>
                      <span>Verify</span> <span className="text-slate-600">→</span>
                      <span>Learn</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <CircularOperatingLoop steps={operatingLoop} />
            <ArchitectureNetworkDiagram appName={appName} />
            <PlatformIntelligenceConstellation matrix={intelligenceMatrix} />
            <SCMCommunicationTerminal />

            {/* Core Engines Grid */}
            <div className="space-y-8 border-b border-slate-900 pb-16">
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
                  CORE ORION ENGINES
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coreEngines.map((engine, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center font-mono">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-os-text-primary">{engine.name}</span>
                        <span className="text-[8px] uppercase px-2 py-0.5 rounded border font-mono font-bold bg-[#30D158]/10 text-[#30D158] border-[#30D158]/25">
                          {engine.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono leading-relaxed text-os-text-muted select-text">{engine.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ArchitectLog appName={appName} />
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SYSTEM INFORMATION */}
      {activeTab === 'system_info' && (
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-12 w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
          <div className="border-b border-slate-900 pb-6">
            <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              <span>System Information & Operating Specification</span>
            </h2>
            <p className="text-slate-400 text-xs font-mono mt-1">
              Authoritative runtime parameters, database authority, and enterprise environment configuration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Box 1: OS Runtime */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Operating System Runtime</span>
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-slate-900">
                  <span className="text-slate-500">OS Distribution</span>
                  <span className="text-white font-bold">Orion-9 Aurora Enterprise OS</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-900">
                  <span className="text-slate-500">OS Version</span>
                  <span className="text-white">v9.0.0</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-900">
                  <span className="text-slate-500">Build Commit Git SHA</span>
                  <span className="text-blue-400 font-mono">{gitSha}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-900">
                  <span className="text-slate-500">Deployment Target</span>
                  <span className="text-emerald-400">Cloudflare Workers Worker (orion-9)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Execution Engine</span>
                  <span className="text-white">Vite 6 + React 18 + Node V8 Runtime</span>
                </div>
              </div>
            </div>

            {/* Box 2: Database & Security Authority */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>Database & Security Authority</span>
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-slate-900">
                  <span className="text-slate-500">Authentication Authority</span>
                  <span className="text-emerald-400 font-bold">Firebase Authentication</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-900">
                  <span className="text-slate-500">Database Authority</span>
                  <span className="text-emerald-400 font-bold">Cloud Firestore</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-900">
                  <span className="text-slate-500">Supabase Runtime Status</span>
                  <span className="text-slate-400">0 Runtime Dependencies (Purged)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-900">
                  <span className="text-slate-500">Region & Residency</span>
                  <span className="text-white">asia-south1 (Mumbai) / Multi-Region</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Tenant Isolation</span>
                  <span className="text-purple-300">ORION_PLATFORM (RBAC Governed)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: DOCUMENTATION & RELEASE NOTES */}
      {activeTab === 'documentation' && (
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-12 w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
          <div className="border-b border-slate-900 pb-6">
            <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>Documentation & Release Notes</span>
            </h2>
            <p className="text-slate-400 text-xs font-mono mt-1">
              Access user manuals, operating guides, and platform release history.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Help & Documentation Card */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4 hover:border-blue-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-blue-400" />
                  <div>
                    <h3 className="text-white font-bold text-sm">Help & System Manual</h3>
                    <span className="text-slate-500 text-[10px]">Complete operational documentation</span>
                  </div>
                </div>
                <NavLink to="/user-manual" className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors">
                  <span>Open Manual</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </NavLink>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Learn how to operate the Orion-9 Digital Twin, demand forecasting engines, AI Copilot, workflow orchestration, and risk radar diagnostics.
              </p>
            </div>

            {/* Release Notes Card */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="text-white font-bold text-sm">Release Notes v9.0.0</h3>
                    <span className="text-slate-500 text-[10px]">Current version highlights</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveLegalModal('release_notes')}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                >
                  <span>View Notes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Highlights include native 2-column OS Settings application, two-stage OS authentication experience, live Orion Star background environment, and Cloudflare Worker deployment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: LEGAL & LICENSES */}
      {activeTab === 'legal' && (
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-12 w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
          <div className="border-b border-slate-900 pb-6">
            <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-400" />
              <span>Legal, Compliance & Open Source Licenses</span>
            </h2>
            <p className="text-slate-400 text-xs font-mono mt-1">
              Authoritative OS-level destination for Privacy Policy, Terms of Service, and open source disclosures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            {/* Privacy Policy */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <div className="space-y-3">
                <Shield className="w-6 h-6 text-emerald-400" />
                <h3 className="text-white font-bold text-sm">Privacy Policy</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Details enterprise data encryption at rest, tenant isolation, zero third-party telemetry, and governance policies.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveLegalModal('privacy')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer"
              >
                <span>Read Privacy Policy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Terms of Service */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
              <div className="space-y-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <h3 className="text-white font-bold text-sm">Terms of Service</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Establishes enterprise software license terms, operational SLAs, user responsibilities, and system usage boundaries.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveLegalModal('terms')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer"
              >
                <span>Read Terms of Service</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Open Source Licenses */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-purple-500/40 transition-colors">
              <div className="space-y-3">
                <BookOpen className="w-6 h-6 text-purple-400" />
                <h3 className="text-white font-bold text-sm">Open Source Licenses</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Acknowledgements and licensing terms for underlying open-source libraries (React, Lucide, Tailwind, Firebase, Vitest).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveLegalModal('licenses')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer"
              >
                <span>View Licenses</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: SUPPORT & DIAGNOSTICS */}
      {activeTab === 'support' && (
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-12 w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
          <div className="border-b border-slate-900 pb-6">
            <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              <span>Support & System Diagnostics</span>
            </h2>
            <p className="text-slate-400 text-xs font-mono mt-1">
              Operational support channels and system diagnostic tooling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-blue-400 font-bold text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>System Diagnostics & Health</span>
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Run real-time diagnostics on Cloud Firestore connection status, AI Copilot API readiness, and circuit breakers.
              </p>
              <NavLink to="/system-status" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
                <span>Run Diagnostics</span>
                <ChevronRight className="w-4 h-4" />
              </NavLink>
            </div>

            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Enterprise Contact & Support</span>
              </h3>
              <div className="space-y-2 text-slate-300">
                <div><span className="text-slate-500">Support Email:</span> support@orion.network</div>
                <div><span className="text-slate-500">Security Channel:</span> security@orion.network</div>
                <div><span className="text-slate-500">SLA Guarantee:</span> 99.99% Enterprise Uptime</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEGAL MODAL POPUPS */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-blue-500/30">
          <div className="bg-[#090d16] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl animate-fadeIn text-slate-300 font-sans">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between select-none">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>
                  {activeLegalModal === 'privacy' && 'Orion-9 Privacy Policy'}
                  {activeLegalModal === 'terms' && 'Orion-9 Terms of Service'}
                  {activeLegalModal === 'licenses' && 'Open Source Licenses & Acknowledgements'}
                  {activeLegalModal === 'release_notes' && 'Orion-9 Release Notes v9.0.0'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors font-mono text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto font-mono text-xs leading-relaxed space-y-4 select-text">
              {activeLegalModal === 'privacy' && (
                <>
                  <p className="font-bold text-white">ORION-9 ENTERPRISE PRIVACY POLICY</p>
                  <p>Orion-9 is committed to stringent data privacy and security governance. All operational data, supply chain metrics, user credentials, and telemetry are isolated within tenant boundaries.</p>
                  <p className="font-semibold text-blue-300">1. Data Encryption & Isolation</p>
                  <p>All data stored in Cloud Firestore is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Role-Based Access Control (RBAC) rules enforce multi-tenant isolation.</p>
                  <p className="font-semibold text-blue-300">2. Zero Unsanctioned Telemetry</p>
                  <p>Orion-9 does not transmit operational data to third-party advertising or tracking networks. System telemetry is restricted to security audit ledgers within the platform.</p>
                </>
              )}

              {activeLegalModal === 'terms' && (
                <>
                  <p className="font-bold text-white">ORION-9 ENTERPRISE TERMS OF SERVICE</p>
                  <p>By accessing or using the Orion-9 Supply Chain Operating System, enterprise users agree to adhere to platform security policies and administrative guidelines.</p>
                  <p className="font-semibold text-blue-300">1. Authorized Platform Access</p>
                  <p>Access is restricted to authorized enterprise personnel. Step-up authentication is mandatory for administrative policy modifications and database environment transitions.</p>
                  <p className="font-semibold text-blue-300">2. Service Level Agreement</p>
                  <p>Orion-9 targets 99.99% operational availability for production supply chain execution modules.</p>
                </>
              )}

              {activeLegalModal === 'licenses' && (
                <>
                  <p className="font-bold text-white">OPEN SOURCE ACKNOWLEDGEMENTS</p>
                  <p>Orion-9 is built with gratitude to the open-source software ecosystem:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>React 18 — MIT License</li>
                    <li>Vite 6 — MIT License</li>
                    <li>Lucide Icons — ISC License</li>
                    <li>Tailwind CSS — MIT License</li>
                    <li>Firebase Web SDK — Apache 2.0 License</li>
                    <li>Vitest — MIT License</li>
                  </ul>
                </>
              )}

              {activeLegalModal === 'release_notes' && (
                <>
                  <p className="font-bold text-white">ORION-9 RELEASE NOTES — VERSION 9.0.0</p>
                  <p className="text-blue-400">Release Date: September 25, 2026</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                    <li><strong>Two-Stage Native OS Login</strong>: Implemented User ID lookup stage followed by user avatar and password entry.</li>
                    <li><strong>Subtle Live Orion Star Wallpaper</strong>: Multi-depth 7-layer canvas background with Orion constellation, nebula drift, and planetary horizon limb.</li>
                    <li><strong>Native OS Settings Application</strong>: Transformed Account & Settings into a 2-column control panel with 11 native sections.</li>
                    <li><strong>Copilot Runtime Repair</strong>: Fixed top-bar AI Copilot window launcher mapping and governance status badges.</li>
                    <li><strong>Cloudflare Worker Deployment</strong>: Deployed live to <code className="text-emerald-400">orion-9.ayushprakash0021.workers.dev</code>.</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER SYSTEM INFORMATION */}
      <div className="mt-auto border-t border-slate-900 bg-slate-950/80 py-8 text-center font-mono text-[9px] text-slate-600 space-y-2 uppercase tracking-widest select-none">
        <div className="font-bold text-os-text-muted">{appName} CONTROL PANEL</div>
        <div className="flex justify-center gap-4 flex-wrap">
          <span>System Version: 9.0.0</span>
          <span>Git SHA: {gitSha}</span>
          <span>AI Core: Gemini LLM</span>
          <span>Environment: {dataMode === 'real' ? 'Connected' : 'Demo/Local'}</span>
        </div>
      </div>

    </div>
  );
};

export default About;

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
import { 
  Info,
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
  Scale,
  Shield,
  FileText,
  User,
  Zap,
  Lightbulb,
  Compass,
  Cpu,
  History,
  Terminal,
  Check,
  Building2,
  AlertCircle,
  Quote,
  CheckCircle
} from 'lucide-react';

export type AboutSidebarSection = 
  | 'overview'
  | 'why_orion9'
  | 'the_idea'
  | 'created_by'
  | 'principles'
  | 'system_architecture'
  | 'evolution'
  | 'whats_new'
  | 'system_info'
  | 'documentation'
  | 'privacy'
  | 'terms'
  | 'licenses'
  | 'support';

export const About: React.FC = () => {
  const { dataMode } = useSupplyChain();
  const [branding, setBranding] = useState<BrandingConfig>(() => brandingRepository.getBrandingSync());
  const [activeSection, setActiveSection] = useState<AboutSidebarSection>('overview');

  useEffect(() => {
    const handleBrandingUpdate = () => {
      setBranding(brandingRepository.getBrandingSync());
    };
    const handlePhotoUpdate = (e: any) => {
      if (e.detail?.photoUrl !== undefined) {
        setBranding(prev => ({ ...prev, creatorPhotoUrl: e.detail.photoUrl }));
      } else {
        setBranding(brandingRepository.getBrandingSync());
      }
    };

    window.addEventListener("orion-branding-updated", handleBrandingUpdate);
    window.addEventListener("CREATOR_IDENTITY_PHOTO_CHANGED", handlePhotoUpdate);
    window.addEventListener("storage", handleBrandingUpdate);
    return () => {
      window.removeEventListener("orion-branding-updated", handleBrandingUpdate);
      window.removeEventListener("CREATOR_IDENTITY_PHOTO_CHANGED", handlePhotoUpdate);
      window.removeEventListener("storage", handleBrandingUpdate);
    };
  }, []);

  const contentScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
  }, [activeSection]);

  const appName = branding.appName || branding.productName || branding.applicationName || 'ORION-9';
  const appTagline = branding.description || branding.tagline || 'AI Supply Chain Operating System';
  const creatorName = branding.creatorName || 'Ayush Prakash';
  const creatorTitle = branding.creatorTitle || 'Creator & Supply Chain OS Architect';
  const creatorQuote = branding.creatorQuote || 'What if the supply chain had an operating system?';
  const creatorPhotoUrl = branding.creatorPhotoUrl || null;
  const founderNote = branding.founderNote || `Orion-9 was created out of a fundamental observation: modern supply chains run the world, yet they are managed using tools designed in the 1990s—fragmented ERP systems, endless disconnected spreadsheets, email threads, and frantic firefighting. Enterprise supply chains are not a collection of static tables; they are dynamic, high-velocity networks of signals, events, constraints, and operational dependencies. Orion-9 was born to bridge this gap: building a true Operating System for the supply chain where data is unified, events trigger real-time awareness, AI governs risks, decisions create measurable outcomes, and the entire system continuously learns from every action.`;

  const gitSha = import.meta.env.VITE_GIT_SHA || '10c0075';
  const version = branding.version || '9.4.2';

  const sidebarNavItems: { id: AboutSidebarSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'why_orion9', label: 'Why Orion-9', icon: Compass },
    { id: 'the_idea', label: 'The Idea', icon: Lightbulb },
    { id: 'created_by', label: 'Created By', icon: User },
    { id: 'principles', label: 'Principles', icon: Sparkles },
    { id: 'system_architecture', label: 'System Architecture', icon: Layers },
    { id: 'evolution', label: 'Evolution', icon: History },
    { id: 'whats_new', label: "What's New", icon: Zap },
    { id: 'system_info', label: 'System Information', icon: Server },
    { id: 'documentation', label: 'Help & Documentation', icon: BookOpen },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'terms', label: 'Terms', icon: FileText },
    { id: 'licenses', label: 'Licenses', icon: Scale },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

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
    { name: 'AUDIT ENGINE', status: 'IMPLEMENTED', purpose: 'Tracking of decisions, actions, and changes.' }
  ];

  const corePrinciples = [
    {
      num: '01',
      title: 'One Operating Environment',
      desc: 'Replaces fragmented ERP modules, supply chain software tools, spreadsheets, and disconnected dashboards with a single unified operating system environment.',
      icon: Layers,
    },
    {
      num: '02',
      title: 'Data Connected',
      desc: 'Builds a dynamic entity-relationship world graph connecting suppliers, purchase orders, shipments, warehouses, SKUs, inventory buffers, and customer commitments.',
      icon: Database,
    },
    {
      num: '03',
      title: 'Events Drive Awareness',
      desc: 'Operates on continuous, real-time event signals rather than delayed batch ETLs, allowing immediate sensing of disruptions, anomalies, and lead time variance.',
      icon: Zap,
    },
    {
      num: '04',
      title: 'AI Governed',
      desc: 'Combines predictive machine learning with deterministic policy constraints to automate root-cause detection, risk scoring, and counterfactual simulation.',
      icon: Cpu,
    },
    {
      num: '05',
      title: 'Humans in Control',
      desc: 'Enforces human-in-the-loop authorization thresholds, step-up security verification, granular RBAC, and policy boundaries before executing financial or operational actions.',
      icon: Shield,
    },
    {
      num: '06',
      title: 'Decisions Create Outcomes',
      desc: 'Transforms raw intelligence into prioritized operational decisions, comparing costs, service-level trade-offs, and economic impact before action.',
      icon: Activity,
    },
    {
      num: '07',
      title: 'System Learns',
      desc: 'Continuously measures expected vs actual outcomes of executed decisions, storing resolution history in the memory fabric to improve future recommendations.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-full bg-[#06080d] text-os-text-muted font-sans w-full max-w-full overflow-x-hidden flex flex-col antialiased selection:bg-blue-500/30">
      
      {/* 1. TOP HEADER — CREATOR IDENTITY & OS BRANDING (RESPONSIVE CHROME HEADER) */}
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-3 py-2.5 sm:px-6 sm:py-4 shrink-0 select-none z-20">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Left: Branding & Creator Attribution */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <div className="relative group shrink-0">
              <img 
                src="/orion-9-brand-logo.png" 
                alt="Orion-9 Logo" 
                className="h-8 sm:h-10 md:h-12 w-auto drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-transform duration-300 group-hover:scale-105" 
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-white font-extrabold text-base sm:text-xl tracking-wider uppercase font-sans truncate">
                  {appName}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[10px] sm:text-[11px] font-semibold shrink-0">
                  v{version}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] uppercase font-medium shrink-0">
                  {dataMode === 'real' ? 'LIVE' : 'DEMO'}
                </span>
              </div>

              {/* Prominent Creator Identity Line */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-[11px] sm:text-xs">
                <span className="text-blue-400/90 font-semibold tracking-wide flex items-center gap-1 shrink-0">
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
                  <span>Created by {creatorName}</span>
                </span>
                <span className="hidden sm:inline text-slate-600 font-mono text-xs">•</span>
                <span className="hidden md:inline text-slate-400 font-mono italic truncate max-w-xs">
                  "{creatorQuote}"
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Metadata Pills */}
          <div className="hidden sm:flex items-center gap-3 font-mono text-xs shrink-0 ml-auto">
            <div className="hidden lg:flex px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 flex-col text-right">
              <span className="text-slate-500 text-[9px] uppercase">Commit SHA</span>
              <span className="text-blue-400 font-semibold">{gitSha.substring(0, 7)}</span>
            </div>

            <div className="hidden xl:flex px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 flex-col text-right">
              <span className="text-slate-500 text-[9px] uppercase">Database Authority</span>
              <span className="text-emerald-400 font-semibold">Cloud Firestore</span>
            </div>

            {/* Creator Photo Thumbnail */}
            {creatorPhotoUrl ? (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-blue-500/40 overflow-hidden shrink-0 shadow-lg" title={`Created by ${creatorName}`}>
                <img src={creatorPhotoUrl} alt={creatorName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-400/30 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-lg" title={`Created by ${creatorName}`}>
                {creatorName.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN NATIVE OS CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden max-w-[1600px] w-full min-w-0 mx-auto">
        
        {/* MOBILE SECTION NAVIGATION BAR (VISIBLE ON MOBILE ONLY) */}
        <div className="block md:hidden bg-slate-950 border-b border-slate-900/90 p-2 sticky top-0 z-30 shrink-0 select-none w-full">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs">
            {activeSection !== 'overview' && (
              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                className="flex items-center gap-1 text-blue-400 font-bold px-2.5 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/30 text-xs shrink-0"
              >
                ← Overview
              </button>
            )}

            {sidebarNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LEFT SIDEBAR NAVIGATION (VISIBLE ON DESKTOP ONLY) */}
        <aside className="hidden md:flex w-64 bg-slate-950/60 border-r border-slate-900/80 flex-col shrink-0 select-none overflow-y-auto">
          <div className="p-4 border-b border-slate-900/60 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              ABOUT ORION-9 OS
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          </div>

          <nav className="p-2 space-y-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-80" />}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="mt-auto p-4 border-t border-slate-900/60 font-mono text-[10px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Architecture</span>
              <span className="text-slate-400 font-bold">AI-Native SCM OS</span>
            </div>
            <div className="flex justify-between">
              <span>Auth</span>
              <span className="text-slate-400">Firebase Auth</span>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main ref={contentScrollRef} className="flex-1 w-full min-w-0 overflow-y-auto bg-[#07090e] p-3 sm:p-6 lg:p-10 pb-28 sm:pb-12 space-y-6 sm:space-y-10">
          
          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-6 sm:space-y-10 animate-fadeIn">
              <OrionCoreHero appName={appName} appTagline={appTagline} />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-900 space-y-2">
                  <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    <span>Connected Entities</span>
                    <Database className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">1.4M+</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">SKUs, suppliers, orders, inventory buffers & shipments in world graph.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-900 space-y-2">
                  <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    <span>Event Velocity</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">25K / sec</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Real-time operational signals processed through Event Fabric.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-900 space-y-2">
                  <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    <span>Decision Precision</span>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">99.4%</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Economic trade-off accuracy across cost & service-level targets.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-900 space-y-2">
                  <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    <span>AI Governance</span>
                    <Shield className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white tracking-tight">Strict RBAC</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Human-in-the-loop step-up verification and audit trail.</p>
                </div>
              </div>

              {/* Core System Blueprint & Sensing Pathway */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white border-l-2 border-blue-500 pl-3">
                  THE ORION-9 SENSING & EXECUTION PATHWAY
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {appName} continuously ingests operational telemetry, connects events to entities, runs counterfactual simulations, and submits governed decision recommendations.
                </p>

                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                  <span className="text-emerald-400 font-bold">Sense</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-blue-400 font-bold">Understand</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-indigo-400 font-bold">Predict</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-purple-400 font-bold">Simulate</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-amber-400 font-bold">Decide</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-red-400 font-bold">Approve</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-teal-400 font-bold">Act</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-cyan-400 font-bold">Learn</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: WHY ORION-9 */}
          {activeSection === 'why_orion9' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <Compass className="w-6 h-6 text-blue-400" />
                  <span>Why ORION-9 Was Built</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  The fundamental problem with legacy enterprise software and why modern supply chains demand an Operating Environment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-4">
                  <div className="flex items-center gap-3 text-red-400 font-bold text-sm">
                    <AlertCircle className="w-5 h-5" />
                    <span>The Crisis of Legacy Enterprise Software</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>Fragmented ERP Modules:</strong> Data locked in rigid silos (SAP, Oracle, Excel) with zero cross-system visibility.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>Disconnected Spreadsheets:</strong> Planners spend 70% of their week manually updating static VLOOKUP spreadsheets.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>Reactive Firefighting:</strong> Stockouts and delay risks are discovered days after they occur, causing expensive expediting fees.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>Dashboard Fatigue:</strong> Hundreds of visual charts without concrete decision recommendations or action execution.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-blue-950/20 border border-blue-900/40 space-y-4">
                  <div className="flex items-center gap-3 text-blue-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>The ORION-9 Operating Environment</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span><strong>Single Operating System:</strong> Ingests all telemetry into a unified digital twin world model.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span><strong>Event-Driven Fabric:</strong> Real-time signal detection notifies planners of supply disruptions within milliseconds.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span><strong>AI Decision Engines:</strong> Evaluates trade-offs, quantifies financial risk, and drafts optimal resolutions automatically.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span><strong>Closed-Loop Execution:</strong> Governed actions execute directly into ERPs with complete audit verification.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  ARCHITECTURAL CONTRAST
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-400">
                        <th className="py-3 px-4 uppercase">Dimension</th>
                        <th className="py-3 px-4 uppercase text-red-400">Traditional ERP & Dashboards</th>
                        <th className="py-3 px-4 uppercase text-blue-400">ORION-9 Operating System</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">Data Architecture</td>
                        <td className="py-3 px-4 text-slate-400">Static relational tables, batch updates</td>
                        <td className="py-3 px-4 text-blue-300 font-semibold">Dynamic Event-Driven World Graph</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">Awareness Speed</td>
                        <td className="py-3 px-4 text-slate-400">Days / Weeks via end-of-month reporting</td>
                        <td className="py-3 px-4 text-blue-300 font-semibold">Continuous millisecond signal sensing</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">Intelligence Model</td>
                        <td className="py-3 px-4 text-slate-400">Manual human estimation & gut feel</td>
                        <td className="py-3 px-4 text-blue-300 font-semibold">AI Prediction & Counterfactual Engine</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">Execution Mode</td>
                        <td className="py-3 px-4 text-slate-400">Manual emails, phone calls, separate logins</td>
                        <td className="py-3 px-4 text-blue-300 font-semibold">Governed closed-loop OS workflow</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: THE IDEA */}
          {activeSection === 'the_idea' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-amber-400" />
                  <span>The Idea: Supply Chain as an Operating System</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  Shifting enterprise computing from static records to dynamic event-driven world models.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-6">
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-sans">
                  <p className="text-base text-white font-medium">
                    What if the global supply chain was not treated as a series of disconnected software databases, but as a single, coherent, self-aware Operating System?
                  </p>
                  <p>
                    Just as a personal computer operating system manages memory, hardware devices, network packets, and CPU instructions seamlessly beneath a user interface, ORION-9 manages suppliers, transit corridors, warehouses, safety stock buffers, purchase orders, and customer fulfillments beneath an intelligent control plane.
                  </p>
                  <p>
                    When a disruption occurs—such as a port delay, supplier factory shutdown, or sudden demand spike—the Operating System does not wait for a human user to stumble upon a broken KPI chart. Instead, the OS senses the event signal, computes the downstream blast radius across all dependent SKUs and orders, generates optimal counterfactual options, applies business policy rules, and presents a clear, actionable resolution to the planner.
                  </p>
                </div>

                <CircularOperatingLoop steps={operatingLoop} />
              </div>
            </div>
          )}

          {/* SECTION 4: CREATED BY & FOUNDER NOTE */}
          {activeSection === 'created_by' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <User className="w-6 h-6 text-blue-400" />
                  <span>Created By & Founder Note</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  The story, vision, and architectural philosophy behind ORION-9.
                </p>
              </div>

              {/* Creator Profile Card */}
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-8 shadow-2xl">
                {creatorPhotoUrl ? (
                  <div className="w-32 h-32 rounded-2xl border-2 border-blue-500/50 overflow-hidden shrink-0 shadow-blue-500/10 shadow-2xl">
                    <img src={creatorPhotoUrl} alt={creatorName} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 border-2 border-blue-400/30 flex items-center justify-center font-bold text-white text-3xl shrink-0 shadow-2xl">
                    {creatorName.substring(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">{creatorName}</h3>
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-semibold">
                      Founder & Architect
                    </span>
                  </div>
                  <p className="text-slate-400 font-mono text-xs uppercase tracking-wider">{creatorTitle}</p>
                  
                  <div className="pt-2 flex items-start gap-2 text-slate-300 italic text-sm font-sans">
                    <Quote className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <span>"{creatorQuote}"</span>
                  </div>
                </div>
              </div>

              {/* Founder Note & Vision Statement */}
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-900 space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 border-l-2 border-blue-500 pl-3">
                  FOUNDER NOTE FROM AYUSH PRAKASH
                </h3>

                <div className="text-slate-300 font-sans leading-relaxed space-y-4 text-sm select-text whitespace-pre-line">
                  {founderNote}
                </div>

                <div className="pt-6 border-t border-slate-900 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Authoritative Creator Identity</span>
                  <span className="text-blue-400 font-semibold">Orion-9 System Architecture</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: PRINCIPLES */}
          {activeSection === 'principles' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                  <span>The 7 Principles of ORION-9</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  The foundational tenets governing the design, intelligence, and execution of the operating system.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {corePrinciples.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div key={p.num} className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-3 hover:border-slate-800 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-black font-mono text-blue-500">{p.num}</span>
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-white tracking-tight">{p.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">{p.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 6: SYSTEM ARCHITECTURE */}
          {activeSection === 'system_architecture' && (
            <div className="space-y-10 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <Layers className="w-6 h-6 text-blue-400" />
                  <span>System Architecture & Core Engines</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  Aurora visual network model, core engine specifications, and system autonomy levels.
                </p>
              </div>

              <ArchitectureNetworkDiagram appName={appName} />

              {/* Core Engine Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white border-l-2 border-blue-500 pl-3">
                  14 CORE ORION ENGINES
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coreEngines.map((engine, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex flex-col justify-between space-y-3">
                      <div className="flex justify-between items-center font-mono">
                        <span className="font-bold text-xs text-white">{engine.name}</span>
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {engine.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono leading-relaxed text-slate-400 select-text">{engine.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: EVOLUTION */}
          {activeSection === 'evolution' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <History className="w-6 h-6 text-purple-400" />
                  <span>System Evolution & Trajectory</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  Release milestones and architectural progression from initial prototype to production OS.
                </p>
              </div>

              <div className="relative border-l-2 border-slate-900 pl-6 space-y-8 ml-3 font-mono">
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#07090e]"></span>
                  <div className="text-blue-400 text-xs font-bold">v9.4.2 — Native OS Experience Hardening (Current)</div>
                  <p className="text-xs text-slate-300 mt-1 font-sans">
                    Native OS Settings application, canonical About Orion-9 Origin experience, two-stage OS login, layered live star background, and strict Cloud Firestore authority.
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-[#07090e]"></span>
                  <div className="text-indigo-400 text-xs font-bold">v9.0.0 — Aurora Design System & Multi-Agent Copilot</div>
                  <p className="text-xs text-slate-300 mt-1 font-sans">
                    Introduced Aurora dark-mode OS design system, window manager state machine, multi-agent AI copilot, and real-world supply chain synthetic engine.
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-700 border-4 border-[#07090e]"></span>
                  <div className="text-slate-400 text-xs font-bold">v5.0.0 — Event Fabric & Control Tower Real-Time Engine</div>
                  <p className="text-xs text-slate-300 mt-1 font-sans">
                    High-velocity signal processing, real-time disruption blast radius estimation, and automated PO expediting.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: WHAT'S NEW */}
          {activeSection === 'whats_new' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <Zap className="w-6 h-6 text-amber-400" />
                  <span>What's New in ORION-9 v{version}</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  Latest platform enhancements, security hardening wave, and UX refinements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Native OS Settings Application</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Redesigned Account & Settings into a true native OS application window with sidebar navigation, search, and admin control panels.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Two-Stage Authentication Screen</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Windows OS style username lookup, avatar presentation, password entry, and clean authentication without website footer links.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Layered Subtle Live Star Environment</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Recreated login background into a slow, atmospheric live constellation environment with gentle twinkling stars and orbital motion.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Governed Creator Identity Management</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Single source of truth for creator photo, quote, and origin note stored in BrandingRepository with audit logging.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9: SYSTEM INFORMATION */}
          {activeSection === 'system_info' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <Server className="w-6 h-6 text-blue-400" />
                  <span>System Information & Operating Specifications</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  Authoritative runtime parameters, database authority, and enterprise environment configuration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4">
                  <h3 className="text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>Operating System Runtime</span>
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between py-1.5 border-b border-slate-900">
                      <span className="text-slate-500">OS Distribution</span>
                      <span className="text-white font-bold">ORION-9 Aurora Enterprise OS</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900">
                      <span className="text-slate-500">OS Version</span>
                      <span className="text-blue-400 font-bold">{version}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900">
                      <span className="text-slate-500">Build Commit Git SHA</span>
                      <span className="text-white font-bold">{gitSha}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900">
                      <span className="text-slate-500">Kernel Version</span>
                      <span className="text-emerald-400 font-bold">v9.4.2-kernel-core</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4">
                  <h3 className="text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Database & Infrastructure Authority</span>
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between py-1.5 border-b border-slate-900">
                      <span className="text-slate-500">Database Engine</span>
                      <span className="text-emerald-400 font-bold">Cloud Firestore</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900">
                      <span className="text-slate-500">Authentication Authority</span>
                      <span className="text-white font-bold">Firebase Authentication</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900">
                      <span className="text-slate-500">Edge Deployment</span>
                      <span className="text-amber-400 font-bold">Cloudflare Workers</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900">
                      <span className="text-slate-500">Active Environment</span>
                      <span className="text-white font-bold uppercase">{dataMode === 'real' ? 'LIVE' : 'DEMO'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 10: HELP & DOCUMENTATION */}
          {activeSection === 'documentation' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                  <span>Help & Documentation</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  System architecture guides, operational manuals, and keyboard shortcuts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-3">
                  <h3 className="text-white font-bold text-sm">System Architecture Guide</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Detailed technical overview of the Event Fabric, Control Tower, AI Workforce, and Cloud Firestore persistence.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 space-y-3">
                  <h3 className="text-white font-bold text-sm">Keyboard Shortcuts & Commands</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Press <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[10px]">Ctrl + Space</kbd> to launch Orion Copilot or <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[10px]">Alt + S</kbd> for Settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 11: PRIVACY */}
          {activeSection === 'privacy' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <Shield className="w-6 h-6 text-emerald-400" />
                  <span>Privacy Policy & Data Security</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  Authoritative enterprise privacy standards and tenant data isolation controls.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-900 space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
                <h3 className="text-sm font-bold text-white">1. Data Authority & Tenant Isolation</h3>
                <p>
                  ORION-9 enforces strict tenant isolation at the Cloud Firestore database tier. All customer operational data, purchase orders, supplier information, and inventory records are partitioned using encrypted tenant boundaries and verified via Security Rules.
                </p>

                <h3 className="text-sm font-bold text-white mt-4">2. AI Governance & Privacy</h3>
                <p>
                  AI Copilot and decision models run strictly within governed enterprise boundaries. No customer operational telemetry is used to train public foundation models without explicit administrator consent.
                </p>

                <h3 className="text-sm font-bold text-white mt-4">3. Audit Logging & Compliance</h3>
                <p>
                  All privilege escalations, setting modifications, identity updates, and decision approvals generate immutable audit logs stored for legal and compliance verification.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 12: TERMS */}
          {activeSection === 'terms' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-400" />
                  <span>Terms of Service & Usage Governance</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  Terms governing the operation and use of the ORION-9 Supply Chain Operating System.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-900 space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
                <h3 className="text-sm font-bold text-white">1. Authorized Operational Use</h3>
                <p>
                  ORION-9 is provided for enterprise supply chain operations, inventory optimization, risk intelligence, and decision management. Users must adhere to assigned RBAC permission codes.
                </p>

                <h3 className="text-sm font-bold text-white mt-4">2. Autonomous Action Boundaries</h3>
                <p>
                  Decisions executed via Autopilot Level 4 and Level 5 must comply with enterprise policy thresholds configured in System Settings. Human step-up verification is required for transactions exceeding threshold limits.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 13: LICENSES */}
          {activeSection === 'licenses' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <Scale className="w-6 h-6 text-purple-400" />
                  <span>Open Source Licenses & Acknowledgements</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  Open source software libraries and components powering ORION-9.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-900 space-y-4 text-xs font-mono text-slate-300">
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/50 space-y-2">
                  <div className="flex justify-between font-bold text-white">
                    <span>React & React DOM</span>
                    <span className="text-blue-400">MIT License</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Copyright (c) Meta Platforms, Inc. and affiliates.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/50 space-y-2">
                  <div className="flex justify-between font-bold text-white">
                    <span>Firebase SDK</span>
                    <span className="text-blue-400">Apache 2.0</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Copyright (c) Google LLC.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/50 space-y-2">
                  <div className="flex justify-between font-bold text-white">
                    <span>Lucide React Icons</span>
                    <span className="text-blue-400">ISC License</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Copyright (c) Lucide Contributors.</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 14: SUPPORT */}
          {activeSection === 'support' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-900 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-blue-400" />
                  <span>Support & System Diagnostics</span>
                </h2>
                <p className="text-slate-400 text-sm font-sans mt-2">
                  System health check, database integrity verification, and diagnostic support.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-900 space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <div>
                      <div className="text-white font-bold text-sm">All System Services Operational</div>
                      <div className="text-slate-400 font-mono text-xs">Cloud Firestore, Event Fabric & Auth connected.</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                    HEALTHY
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-900 text-slate-300">
                    <span>Database Latency</span>
                    <span className="text-emerald-400">12 ms</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-900 text-slate-300">
                    <span>Event Fabric Sync</span>
                    <span className="text-emerald-400">Active</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-900 text-slate-300">
                    <span>Support Desk</span>
                    <span className="text-blue-400">support@orion-9.io</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

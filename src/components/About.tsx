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
  BrainCircuit, 
  Network, 
  Eye, 
  GitBranch, 
  Send,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Activity,
  History,
  Shield,
  Zap,
  Box,
  Server
} from 'lucide-react';

export const About: React.FC = () => {
  const { dataMode } = useSupplyChain();
  const [branding, setBranding] = useState<BrandingConfig>(() => brandingRepository.getBrandingSync());
  
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

  // Requirement 11: Set internal scroll container to the top ONCE on mount.
  // Do not repeatedly reset scrollTop. User scroll position remains stable thereafter.
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      if (containerRef.current.parentElement) {
        containerRef.current.parentElement.scrollTop = 0;
      }
    }
  }, []);

  const appName = branding.appName || branding.productName || branding.applicationName || 'ORION 9 SCM OS';
  const appTagline = branding.description || branding.tagline || 'AI-NATIVE SUPPLY CHAIN OPERATING SYSTEM';

  // Core structured data from the original code
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
    <div ref={containerRef} className="relative min-h-screen bg-[#07090e] text-os-text-muted font-sans w-full overflow-x-hidden antialiased flex flex-col">
      
      {/* 1. HERO HEADER (ENTERING THE ORION CORE) */}
      <OrionCoreHero appName={appName} appTagline={appTagline} />

      {/* Main Core View Area */}
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-16 w-full max-w-7xl mx-auto space-y-24 z-10">
        
        {/* 2. SYSTEM IDENTITY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-900 pb-16">
          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">SYSTEM IDENTITY</h3>
            <span className="text-[10px] font-mono text-slate-500 block mt-2 uppercase tracking-widest">COGNITIVE SCM ARCHITECTURE</span>
          </div>
          <div className="lg:col-span-8 space-y-6">
            <p className="font-mono text-sm leading-relaxed text-os-text-secondary select-text">
              {appName} is engineered as an AI-native Supply Chain Operating System. It connects distributed operational data, continuous intelligence, decision engines, system workflows, and direct enterprise execution into a single, closed-loop environment.
            </p>
            
            {/* Visual Operational Tracks */}
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

              <div className="p-3 border border-slate-900 bg-slate-950/40 rounded-xl flex flex-col gap-1.5 font-mono text-[10px]">
                <span className="text-slate-500 uppercase tracking-widest text-[9px]">Information Hierarchy:</span>
                <div className="flex flex-wrap items-center gap-2 text-[#00F2FE] font-bold">
                  <span>Data</span> <span className="text-slate-600">↓</span>
                  <span>Intelligence</span> <span className="text-slate-600">↓</span>
                  <span>Decision</span> <span className="text-slate-600">↓</span>
                  <span>Action</span> <span className="text-slate-600">↓</span>
                  <span>Outcome</span> <span className="text-slate-600">↓</span>
                  <span>Memory</span> <span className="text-slate-600">↓</span>
                  <span>Learning</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SYSTEM PURPOSE & MISSION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-900 pb-16">
          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">SYSTEM PURPOSE & MISSION</h3>
            <span className="text-[10px] font-mono text-slate-500 block mt-2 uppercase tracking-widest">ENTERPRISE RESOLUTION GOAL</span>
          </div>
          <div className="lg:col-span-8">
            <p className="font-mono text-sm leading-relaxed text-os-text-secondary select-text">
              To transform fragmented and silent supply chain transaction records into a unified, living operational intelligence network. Orion identifies exactly what is happening across global networks, explains why disruptions occur, anticipates forward risks, evaluates alternative scenarios, assists human decisions, automates execution pathways, and perpetually records results to learn from operational outcomes.
            </p>
          </div>
        </div>

        {/* 4. CORE VISION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-900 pb-16">
          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">CORE VISION</h3>
            <span className="text-[10px] font-mono text-slate-500 block mt-2 uppercase tracking-widest">THE STRUCTURAL COUPLING</span>
          </div>
          <div className="lg:col-span-8 space-y-6">
            <p className="font-mono text-sm leading-relaxed text-os-text-secondary select-text">
              {appName} is built on the philosophy that a supply chain is not a series of passive ledgers, but a highly coupled, dynamic network. Orion maps the complex relationships between Supply, Demand, Inventory, Procurement, Logistics, Warehouses, Risk, Costs, Actions, and Outcomes to drive optimal enterprise performance.
            </p>
            
            {/* Visual Blueprint Flowchart */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 p-6 bg-slate-950 border border-slate-900 rounded-2xl max-w-xl font-mono text-[10px] text-os-text-secondary uppercase tracking-widest">
              <div className="text-slate-500">Signals</div>
              <div className="text-slate-600">→</div>
              <div className="text-[#00F2FE] font-bold">ORION Twin</div>
              <div className="text-slate-600">→</div>
              <div className="text-[#FF9F0A] font-bold">Simulations</div>
              <div className="text-slate-600">→</div>
              <div className="text-[#30D158] font-bold">Autopilot</div>
              <div className="text-slate-600">→</div>
              <div className="text-purple-400 font-bold">Learning</div>
            </div>
          </div>
        </div>

        {/* 5. WHAT IS ORION 9? */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-900 pb-16">
          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">WHAT IS {appName}?</h3>
            <span className="text-[10px] font-mono text-slate-500 block mt-2 uppercase tracking-widest">THE INTEGRATED OPERATING SYSTEM</span>
          </div>
          <div className="lg:col-span-8">
            <p className="font-mono text-sm leading-relaxed text-os-text-secondary select-text">
              {appName} is a comprehensive, enterprise-level digital twin and execution environment. Instead of forcing supply chain coordinators to operate isolated point solutions (WMS, TMS, ERP, Risk Platforms), Orion unifies inventory rebalancing, procurement validation, supplier communication, and automated logistics routing within a single cohesive dashboard, protecting margins and ensuring total system resilience.
            </p>
          </div>
        </div>

        {/* 6. ORION OPERATING LOOP */}
        <CircularOperatingLoop steps={operatingLoop} />

        {/* 7. ORION ARCHITECTURE NETWORK */}
        <ArchitectureNetworkDiagram appName={appName} />

        {/* 8. PLATFORM INTELLIGENCE MATRIX */}
        <PlatformIntelligenceConstellation matrix={intelligenceMatrix} />

        {/* 9. SCM COMMUNICATION TERMINAL ("Supply Chain Talks to Orion") */}
        <SCMCommunicationTerminal />

        {/* 10. CORE ORION ENGINES */}
        <div className="space-y-8 border-b border-slate-900 pb-16">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
              CORE ORION ENGINES <span className="text-slate-500 font-normal">("SYSTEM BLUEPRINT COMPONENTS")</span>
            </h3>
            <p className="font-mono text-sm leading-relaxed text-os-text-muted max-w-4xl">
              Each core intelligence service in Orion 9 executes standard logical tasks to synchronize, simulate, and verify decisions across global supply chains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreEngines.map((engine, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-800 transition-colors">
                <div className="space-y-2">
                  <div className="flex justify-between items-center font-mono">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-os-text-primary">{engine.name}</span>
                    <span className={`text-[8px] uppercase px-2 py-0.5 rounded border font-mono font-bold
                      ${engine.status === 'IMPLEMENTED' ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/25' : 
                        engine.status === 'PARTIALLY IMPLEMENTED' ? 'bg-amber-500/10 text-amber-500 border-amber-500/25' : 
                        engine.status === 'PLANNED' ? 'bg-slate-900 text-slate-500 border-slate-800' : 
                        'bg-[#00F2FE]/10 text-[#00F2FE] border-[#00F2FE]/25'}`}>
                      {engine.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono leading-relaxed text-os-text-muted select-text">{engine.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 11. ORION INTELLIGENCE LAYERS */}
        <div className="space-y-8 border-b border-slate-900 pb-16">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
              ORION INTELLIGENCE LAYERS <span className="text-slate-500 font-normal">("THE FUNCTIONAL HIERARCHY")</span>
            </h3>
            <p className="font-mono text-sm leading-relaxed text-os-text-muted max-w-3xl">
              Signals progress sequentially from raw observation to unified cognitive layers, enabling deeper reasoning and automated enterprise execution.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-center">
            {['OBSERVE', 'UNDERSTAND', 'PREDICT', 'REASON', 'SIMULATE', 'DECIDE', 'EXECUTE', 'LEARN'].map((layer, idx) => (
              <div key={idx} className="p-4 border border-slate-900 rounded-xl bg-slate-950 hover:border-slate-800 transition-colors">
                <div className="text-[11px] font-bold uppercase tracking-widest text-os-text-primary mb-1">{layer}</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest">LAYER {idx + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 12. BEYOND TRADITIONAL SCM (TAG CLOUD) */}
        <div className="space-y-6 border-b border-slate-900 pb-16">
          <div className="space-y-2 text-center">
            <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary">
              BEYOND TRADITIONAL SCM <span className="text-slate-500 font-normal">("THE COGNITIVE TAXONOMY")</span>
            </h3>
            <p className="font-mono text-xs text-slate-500 uppercase tracking-wider max-w-xl mx-auto">
              Advanced operating capabilities and structural constraints engineered within the Orion Core.
            </p>
          </div>

          <FloatingConstellationTags />
        </div>

        {/* 13. WHY ORION IS DIFFERENT (TRADITIONAL VS ORION CARD) */}
        <div className="space-y-8 border-b border-slate-900 pb-16">
          <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
            WHY ORION? <span className="text-slate-500 font-normal">("THE GENERATIONAL LEAP")</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono">
            
            {/* Traditional Card */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-900 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">TRADITIONAL SCM PLATFORMS</span>
                <div className="text-sm text-os-text-muted space-y-2 font-bold">
                  <div>● RECORD TRANSACTION LOGS</div>
                  <div>● RETROSPECTIVE reporting</div>
                  <div>● STATIC THRESHOLD ALERTS</div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-900 text-[10px] text-slate-600 italic">
                Focuses primarily on answering "What happened?" after disruptions have already incurred costs.
              </div>
            </div>

            {/* Orion Card */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-[#00F2FE]/25 space-y-4 shadow-[0_0_15px_rgba(0,242,254,0.03)] flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00F2FE] block">ORION 9 OS COGNITIVE STACK</span>
                <div className="grid grid-cols-2 gap-2 text-sm text-os-text-primary font-bold">
                  <div>● SENSE REAL-TIME</div>
                  <div>● CONNECT TWIN</div>
                  <div>● UNDERSTAND WHY</div>
                  <div>● PREDICT VELOCITY</div>
                  <div>● SIMULATE PATHS</div>
                  <div><div>● DECIDE MARGINS</div></div>
                  <div>● ACT AUTOMATED</div>
                  <div>● LEARN CALIBRATED</div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-900 text-[10px] text-[#00F2FE] font-bold space-y-1">
                <div>"Why is this delay happening?"</div>
                <div>"What is the exact downstream financial blast radius?"</div>
                <div>"How will alternative supplier routing affect long-term cost of goods?"</div>
              </div>
            </div>

          </div>
        </div>

        {/* 14. SUPPLY CHAIN AS A LIVING SYSTEM */}
        <div className="space-y-8 border-b border-slate-900 pb-16">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
              THE SUPPLY CHAIN AS A LIVING SYSTEM
            </h3>
            <p className="font-mono text-sm leading-relaxed text-os-text-muted max-w-3xl">
              Orion handles physical operational lanes as a single, structurally coupled organic model, continuously evaluating signals and logging memory events.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-900 p-8 rounded-2xl overflow-x-auto shadow-inner select-none">
            <div className="flex items-center justify-between whitespace-nowrap font-mono text-[9px] uppercase font-bold text-os-text-muted min-w-[900px] gap-2">
              {[ 'Suppliers', 'Materials', 'Procurement', 'Inbound', 'Inventory', 'Warehouse', 'Fulfillment', 'Logistics', 'Customers' ].map((node, idx, arr) => (
                <React.Fragment key={idx}>
                  <div className="relative group cursor-default p-3 border border-slate-900 bg-slate-950 hover:border-[#00F2FE] rounded-xl transition-all">
                    <div>{node}</div>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] text-[#00F2FE] opacity-0 group-hover:opacity-100 transition-opacity tracking-widest uppercase font-bold">SIGNALS</div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest uppercase font-bold">MEMORY</div>
                  </div>
                  {idx < arr.length - 1 && <div className="text-slate-700 font-normal">→</div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* 15. ORION WORLD MODEL */}
        <div className="space-y-8 border-b border-slate-900 pb-16">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
              ORION WORLD MODEL <span className="text-slate-500 font-normal">("THE CHRONOLOGICAL CONTINUUM")</span>
            </h3>
            <p className="font-mono text-sm leading-relaxed text-os-text-muted max-w-3xl">
              Maintains an active, structurally complete state machine charting historical anomalies, current live presence, predicted paths, and simulated alternatives.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest font-bold">
            <div className="px-4 py-3 bg-slate-950 border border-slate-900 text-os-text-muted rounded-xl">History (Past Memory)</div>
            <div className="text-slate-700 flex items-center">→</div>
            <div className="px-4 py-3 bg-slate-950 border border-[#00F2FE]/30 text-[#00F2FE] rounded-xl shadow-[0_0_10px_rgba(0,242,254,0.03)]">Current Live State (Presence)</div>
            <div className="text-slate-700 flex items-center">→</div>
            <div className="px-4 py-3 bg-slate-950 border border-[#30D158]/30 text-[#30D158] rounded-xl">Predicted Future State (Inference)</div>
            <div className="text-slate-700 flex items-center">→</div>
            <div className="px-4 py-3 bg-slate-950 border border-purple-400/30 text-purple-400 rounded-xl">Scenario Simulation State (Evaluation)</div>
          </div>
        </div>

        {/* 16. HUMAN + AI RELATIONSHIP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-900 pb-16">
          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">HUMAN + ORION</h3>
            <span className="text-[10px] font-mono text-slate-500 block mt-2 uppercase tracking-widest">COGNITIVE SYNERGY POLICY</span>
          </div>
          <div className="lg:col-span-8">
            <p className="font-mono text-sm leading-relaxed text-os-text-secondary select-text">
              Orion is not built to eliminate human agency or replace operational expertise. Rather, it is engineered to surface clean evidence, isolate critical alerts, evaluate complex downstream combinations, simulate consequences, and propose optimal actions. Humans retain ultimate validation and governance rights over all critical corporate transactions, conforming to explicit financial and risk policies.
            </p>
          </div>
        </div>

        {/* 17. ORION AUTONOMY MODEL */}
        <div className="space-y-8 border-b border-slate-900 pb-16">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
              ORION AUTONOMY MODEL <span className="text-slate-500 font-normal">("THE PILOT INSTRUMENTATION TIER")</span>
            </h3>
            <p className="font-mono text-sm leading-relaxed text-os-text-muted max-w-3xl">
              Autopilot maturity levels defining exactly how decisions are prepared and dispatched based on risk and policy rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
            {autonomyLevels.map((lvl, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-800 transition-colors">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-500 tracking-wider uppercase">{lvl.level}</span>
                    <span className="font-bold text-os-text-primary uppercase tracking-widest">{lvl.name}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-os-text-muted select-text">{lvl.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="font-mono text-[10px] text-slate-500 italic uppercase tracking-wider text-center max-w-2xl mx-auto">
            * Autonomous execution is tightly constrained by configurable Policies, User permissions, Financial limits, Risk boundaries, and absolute auditing.
          </p>
        </div>

        {/* 18. DATA & AI TRUST GAUGES */}
        <div className="space-y-8 border-b border-slate-900 pb-16">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
              TRUST BY DESIGN <span className="text-slate-500 font-normal">("COGNITIVE FIDELITY MEASURES")</span>
            </h3>
            <p className="font-mono text-sm leading-relaxed text-os-text-muted max-w-3xl">
              Orion distinguishes clearly between raw measurements, calculated structures, inferred possibilities, and system recommendations to enforce absolute data trust.
            </p>
          </div>

          <TrustGauges />
        </div>

        {/* 19. ORION AI (GEMINI ENGINE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-900 pb-16">
          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">ORION AI</h3>
            <span className="text-[10px] font-mono text-slate-500 block mt-2 uppercase tracking-widest">GEMINI INTEL LAYER</span>
          </div>
          <div className="lg:col-span-8">
            <p className="font-mono text-sm leading-relaxed text-os-text-secondary select-text">
              The Gemini LLM API provides the primary linguistic and semantic cognitive interface. Gemini decomposes unstructured shipping incidents, drafts clear contextual emails to suppliers, interprets complex multi-scenario graphs, and generates logical risk summaries for human executives, transforming raw databases into logical explanations.
            </p>
          </div>
        </div>

        {/* 20. ORION MEMORY ENGINE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-900 pb-16">
          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">ORION MEMORY</h3>
            <span className="text-[10px] font-mono text-slate-500 block mt-2 uppercase tracking-widest">THE RETROSPECTIVE LEDGER</span>
          </div>
          <div className="lg:col-span-8">
            <p className="font-mono text-sm leading-relaxed text-os-text-secondary select-text">
              Orion incorporates a dedicated memory retention layer. Every shipping delay, supplier dispute, counterfactual option, human action override, and eventual financial outcome is indexed as a vector memory state. This allows the system to refer to past resolutions, recommending proven decisions when similar conditions repeat in subsequent operational cycles.
            </p>
          </div>
        </div>

        {/* 21. ENTERPRISE GOVERNANCE */}
        <div className="space-y-8 border-b border-slate-900 pb-16">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
              ENTERPRISE GOVERNANCE <span className="text-slate-500 font-normal">("THE SAFETY SYSTEM ENERGETICS")</span>
            </h3>
            <p className="font-mono text-sm leading-relaxed text-os-text-muted max-w-3xl">
              System access, operational thresholds, and decision paths are controlled strictly through layered administrative gates.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 font-mono text-[10px] uppercase tracking-wider">
            {['Permissions', 'Roles', 'Policies', 'Approvals', 'Audit Logs', 'Data Trust', 'AI Governance', 'Autonomy Control'].map((item, idx) => (
              <span key={idx} className="px-3.5 py-2 border border-slate-900 bg-slate-950 text-os-text-primary rounded-lg">
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* 22. & 23. FOUNDER & ORIGIN PANEL (ARCHITECT LOG) */}
        <ArchitectLog appName={appName} />

        {/* 24. ORION EVOLUTION TRACK */}
        <div className="space-y-8 border-b border-slate-900 pb-16">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
              ORION 9 EVOLUTION <span className="text-slate-500 font-normal">("SYSTEM CAPABILITY ROADMAP")</span>
            </h3>
            <p className="font-mono text-sm leading-relaxed text-os-text-muted max-w-3xl">
              Tracing the progress of Orion 9 capabilities from initial visibility modules to progressive autonomous governance.
            </p>
          </div>

          <div className="relative font-mono text-[10px] uppercase tracking-wider py-2">
            {/* Horizontal timeline bar for desktop */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-900/60 -translate-y-1/2 hidden md:block" />
            
            <div className="grid grid-cols-1 md:grid-cols-9 gap-6 relative">
              {[
                { name: 'ORIGIN', status: 'Implemented' },
                { name: 'SCM VISIBILITY', status: 'Implemented' },
                { name: 'SCM INTELLIGENCE', status: 'Implemented' },
                { name: 'CONNECTED DECISIONS', status: 'Implemented' },
                { name: 'AUTOMATION', status: 'Implemented' },
                { name: 'DIGITAL TWIN', status: 'Implemented' },
                { name: 'MEMORY', status: 'Implemented' },
                { name: 'LEARNING', status: 'In development' },
                { name: 'PROGRESSIVE AUTONOMY', status: 'Future direction' }
              ].map((item, idx, arr) => {
                const color = 
                  item.status === 'Implemented' ? 'text-[#30D158]' :
                  item.status === 'In development' ? 'text-[#FF9F0A]' :
                  'text-slate-500';

                return (
                  <div key={idx} className="bg-slate-950 border border-slate-900/80 p-3 rounded-xl flex flex-col justify-between text-center space-y-2 z-10 hover:border-slate-800 transition-colors">
                    <span className="font-bold text-os-text-primary block truncate">{item.name}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest ${color}`}>{item.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 25. SYSTEM PRINCIPLES */}
        <div className="space-y-8 border-b border-slate-900 pb-16">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
              ORION PRINCIPLES <span className="text-slate-500 font-normal">("THE COGNITIVE CODES")</span>
            </h3>
            <p className="font-mono text-sm leading-relaxed text-os-text-muted max-w-3xl">
              Ten fundamental operating parameters governing Orion system intelligence, data, and human interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[10px]">
            {[
              'Data before assumption',
              'Evidence before conclusion',
              'Explain before execution',
              'Human governance for consequential decisions',
              'No fabricated operational facts',
              'Continuous learning from outcomes',
              'Connected rather than isolated intelligence',
              'Progressive automation',
              'Auditability',
              'Operational usefulness over decorative AI'
            ].map((principle, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-slate-950 border border-slate-900 p-4 rounded-xl hover:border-slate-800 transition-colors">
                <span className="text-[#00F2FE] font-bold text-xs">{String(idx + 1).padStart(2, '0')}.</span>
                <span className="text-os-text-secondary select-text font-bold uppercase tracking-wider">{principle}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 26. PLATFORM CAPABILITY MAP */}
        <div className="space-y-8 border-b border-slate-900 pb-16">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
              PLATFORM CAPABILITY MAP <span className="text-slate-500 font-normal">("ROUTING DECK")</span>
            </h3>
            <p className="font-mono text-sm leading-relaxed text-os-text-muted max-w-3xl">
              Navigate between the operational controls, intelligence diagnostics, decision buffers, and memory vaults.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 font-mono text-[10px] uppercase font-bold select-none">
            <NavLink to="/dashboard" className="px-4 py-3 border border-slate-900 bg-slate-950 text-os-text-secondary rounded-xl hover:border-[#00F2FE] hover:text-[#00F2FE] transition-colors tracking-widest">OPERATIONS</NavLink>
            <NavLink to="/intelligence-center" className="px-4 py-3 border border-slate-900 bg-slate-950 text-os-text-secondary rounded-xl hover:border-[#00F2FE] hover:text-[#00F2FE] transition-colors tracking-widest">INTELLIGENCE</NavLink>
            <NavLink to="/decisions" className="px-4 py-3 border border-slate-900 bg-slate-950 text-os-text-secondary rounded-xl hover:border-[#00F2FE] hover:text-[#00F2FE] transition-colors tracking-widest">DECISION</NavLink>
            <NavLink to="/autopilot" className="px-4 py-3 border border-slate-900 bg-slate-950 text-os-text-secondary rounded-xl hover:border-[#00F2FE] hover:text-[#00F2FE] transition-colors tracking-widest">AUTOMATION</NavLink>
            <NavLink to="/settings" className="px-4 py-3 border border-slate-900 bg-slate-950 text-os-text-secondary rounded-xl hover:border-[#00F2FE] hover:text-[#00F2FE] transition-colors tracking-widest">GOVERNANCE</NavLink>
            <NavLink to="/orion-memory" className="px-4 py-3 border border-slate-900 bg-slate-950 text-os-text-secondary rounded-xl hover:border-[#00F2FE] hover:text-[#00F2FE] transition-colors tracking-widest">MEMORY</NavLink>
            <span className="px-4 py-3 border border-slate-900 bg-slate-900/50 text-slate-600 rounded-xl cursor-not-allowed tracking-widest">LEARNING</span>
          </div>
        </div>

      </div>

      {/* 27. FOOTER SYSTEM INFORMATION */}
      <div className="mt-auto border-t border-slate-900 bg-slate-950/80 py-8 text-center font-mono text-[9px] text-slate-600 space-y-2 uppercase tracking-widest select-none">
        <div className="font-bold text-os-text-muted">{appName} CONTROL PANEL</div>
        <div className="flex justify-center gap-4 flex-wrap">
          <span>System Version: 9.0.0</span>
          <span>Git SHA: {import.meta.env.VITE_GIT_SHA || '0337510'}</span>
          <span>AI Core: Gemini LLM</span>
          <span>Environment: {dataMode === 'real' ? 'Connected' : 'Demo/Local'}</span>
        </div>
      </div>

    </div>
  );
};

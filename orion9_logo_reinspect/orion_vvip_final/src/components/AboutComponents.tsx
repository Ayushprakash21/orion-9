import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { BrandLogo } from './brand/BrandLogo';
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
  Camera,
  Code,
  Activity,
  History,
  Shield,
  Zap,
  Box,
  Server,
  Terminal,
  Sliders,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

// ==========================================
// 1. TECHNICAL BACKGROUND CANVAS
// ==========================================
export const TechnicalBackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    // Stars/Nodes setup
    const starCount = 45;
    const stars: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.4 + 0.1
      });
    }

    // Grid coordinates
    const gridCols = Math.ceil(width / 180);
    const gridRows = Math.ceil(height / 180);

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const draw = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Coordinates Grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.025)';
      ctx.lineWidth = 1;
      for (let i = 0; i < gridCols; i++) {
        const x = i * 180;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Print technical coords text at some intersections
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
          ctx.font = '8px monospace';
          ctx.fillText(`X:${x.toFixed(0)}`, x + 5, 12);
        }
      }
      for (let j = 0; j < gridRows; j++) {
        const y = j * 180;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        if (j % 2 === 0) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
          ctx.font = '8px monospace';
          ctx.fillText(`Y:${y.toFixed(0)}`, 5, y - 5);
        }
      }

      // 2. Slow concentric orbital paths in background
      const centerX = width / 2;
      const centerY = height / 2.5;
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.012)';
      ctx.lineWidth = 1;
      [200, 400, 600].forEach(radius => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 3. Stars update and draw
      ctx.fillStyle = 'rgba(0, 242, 254, 0.6)';
      stars.forEach(star => {
        star.x += star.speedX;
        star.y += star.speedY;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        ctx.fillStyle = `rgba(0, 242, 254, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80" />;
};


// ==========================================
// 2. ORION CORE HERO VISUALIZATION & TELEMETRY
// ==========================================
interface CoreSector {
  id: string;
  name: string;
  status: string;
  description: string;
  load: string;
  intensity: string;
  syslog: string;
}

export const OrionCoreHero: React.FC<{ appName: string; appTagline: string }> = ({ appName, appTagline }) => {
  const [activeSector, setActiveSector] = useState<string>('alpha');

  const sectors: Record<string, CoreSector> = {
    alpha: {
      id: 'alpha',
      name: 'CORE SENSORS (Sector Alpha)',
      status: 'ACTIVE',
      description: 'Monitoring and ingesting 1,248 concurrent SCM data feeds from multi-tier ERP and IoT relays.',
      load: '32.1% Base Load',
      intensity: '98.42% Data Fidelity',
      syslog: 'SYSLOG: [OK] Sensor array calibrate completed. Drift index < 0.0012ms. Unified telemetry feed connected.'
    },
    beta: {
      id: 'beta',
      name: 'REASONING CORE (Sector Beta)',
      status: 'ENGAGED',
      description: 'Active digital twin evaluation, predicting downstream impact, causal chains, and counterfactual pathways.',
      load: '74.8% Active Load',
      intensity: '99.95% Reasoning Accuracy',
      syslog: 'SYSLOG: [REASON] Simulating 12 scenarios. Gemini analysis online. Causal constraints calibrated.'
    },
    gamma: {
      id: 'gamma',
      name: 'DECISION SHIELD (Sector Gamma)',
      status: 'ARMED',
      description: 'Applying real-time governance, human validation, approval gates, and automated policy verification.',
      load: '12.5% Ready State',
      intensity: '100% Policy Bound',
      syslog: 'SYSLOG: [GOVERN] Multi-approval gates active. Risk thresholds aligned with enterprise policies. Autopilot safe.'
    }
  };

  const currentSector = sectors[activeSector];

  return (
    <div className="relative w-full flex flex-col items-center justify-center min-h-[640px] border-b border-slate-800 pb-16 pt-8 z-10 select-none">
      <TechnicalBackgroundCanvas />

      {/* Dynamic Telemetry HUD Left */}
      <div className="absolute top-4 left-4 hidden xl:block font-mono text-[9px] text-slate-500 space-y-1 bg-slate-950/40 p-3 border border-slate-900 rounded select-none pointer-events-none">
        <div className="text-[#00F2FE] font-bold">SYSTEM STATS</div>
        <div>SYS_LOAD: OPTIMAL [38.2%]</div>
        <div>GEMINI_LATENCY: 42ms</div>
        <div>ORION_MATRIX_STABILITY: 1.0000</div>
        <div>WORLD_TWIN_NODES: 8,492</div>
        <div>MEMORY_CAPACITY: 4.8 TB</div>
      </div>

      {/* Dynamic Telemetry HUD Right */}
      <div className="absolute top-4 right-4 hidden xl:block font-mono text-[9px] text-slate-500 space-y-1 bg-slate-950/40 p-3 border border-slate-900 rounded select-none pointer-events-none text-right">
        <div className="text-purple-400 font-bold">CORE ORBITAL ALIGNMENT</div>
        <div>ALPHA_ORBIT: 0.12 RAD/S</div>
        <div>BETA_ORBIT: -0.08 RAD/S</div>
        <div>GAMMA_ORBIT: 0.04 RAD/S</div>
        <div>SYNC_RATIO: 100%</div>
        <div>AUTHENTICATED: SECURE</div>
      </div>

      {/* Animated Core SVG Visualization */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center mb-8">
        {/* Animated concentric SVG circles */}
        <svg className="absolute w-full h-full inset-0 pointer-events-none" viewBox="0 0 200 200">
          <defs>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 242, 254, 0.15)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="95" fill="url(#coreGlow)" />
          
          {/* Outer Segment Ring (Gamma - 0.04 rad/s) */}
          <circle 
            cx="100" 
            cy="100" 
            r="85" 
            stroke="rgba(48, 209, 88, 0.25)" 
            strokeWidth="0.5" 
            fill="none" 
            strokeDasharray="6 24 12 6" 
            style={{ 
              transformOrigin: 'center', 
              animation: 'spin 18s linear infinite' 
            }} 
          />
          {/* Middle Segment Ring (Beta - -0.08 rad/s) */}
          <circle 
            cx="100" 
            cy="100" 
            r="70" 
            stroke="rgba(168, 85, 247, 0.35)" 
            strokeWidth="0.75" 
            fill="none" 
            strokeDasharray="20 10 5 15" 
            style={{ 
              transformOrigin: 'center', 
              animation: 'spin-reverse 12s linear infinite' 
            }} 
          />
          {/* Inner Segment Ring (Alpha - 0.12 rad/s) */}
          <circle 
            cx="100" 
            cy="100" 
            r="55" 
            stroke="rgba(0, 242, 254, 0.5)" 
            strokeWidth="1" 
            fill="none" 
            strokeDasharray="40 10" 
            style={{ 
              transformOrigin: 'center', 
              animation: 'spin 8s linear infinite' 
            }} 
          />
        </svg>

        {/* Central Glowing Core Container */}
        <div 
          onClick={() => {
            const keys: ('alpha' | 'beta' | 'gamma')[] = ['alpha', 'beta', 'gamma'];
            const next = keys[(keys.indexOf(activeSector as any) + 1) % keys.length];
            setActiveSector(next);
          }}
          className="w-32 h-32 rounded-full bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative cursor-pointer group hover:border-[#00F2FE]/60 transition-all shadow-[0_0_20px_rgba(0,242,254,0.05)] hover:shadow-[0_0_35px_rgba(0,242,254,0.15)] duration-500"
        >
          {/* Pulse Layer */}
          <div className="absolute inset-0 rounded-full border border-[#00F2FE]/30 animate-ping opacity-20 group-hover:opacity-40" />
          <BrandLogo sizePreset="md" variant="mark" className="text-os-text-primary group-hover:text-[#00F2FE] transition-all duration-500 justify-center" />
          <span className="text-[9px] font-mono tracking-widest text-[#00F2FE] mt-2 animate-pulse uppercase">ORION CORE</span>
        </div>
      </div>

      {/* App Branding HUD Title */}
      <div className="text-center max-w-2xl px-4 space-y-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-os-text-primary tracking-tight leading-none drop-shadow-sm">
          {appName}
        </h1>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded font-mono text-[10px] tracking-widest text-[#00F2FE] uppercase">
          <span className="inline-block w-2 h-2 rounded-full bg-[#30D158] animate-pulse"></span>
          ENTERING THE ORION CORE SYSTEM
        </div>
        <p className="text-sm sm:text-base text-os-text-muted font-mono tracking-wide uppercase max-w-lg mx-auto">
          {appTagline}
        </p>
      </div>

      {/* Core Sector Interactive HUD Selector Controls */}
      <div className="mt-12 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
        {Object.values(sectors).map(sector => (
          <div
            key={sector.id}
            onClick={() => setActiveSector(sector.id)}
            className={`p-4 border rounded-xl font-mono cursor-pointer transition-all duration-300 flex flex-col justify-between select-none
              ${activeSector === sector.id 
                ? 'bg-slate-950 border-slate-700 shadow-[0_0_15px_rgba(0,242,254,0.04)] text-os-text-primary' 
                : 'bg-slate-950/40 border-slate-900/60 hover:bg-slate-900/20 text-slate-500 hover:text-os-text-muted'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">{sector.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 border rounded-full font-bold
                ${activeSector === sector.id 
                  ? 'bg-[#00F2FE]/10 border-[#00F2FE]/20 text-[#00F2FE]' 
                  : 'bg-slate-900 border-slate-800 text-slate-600'}`}
              >
                {sector.status}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-os-text-muted mb-3 select-none">{sector.description}</p>
            <div className="flex justify-between items-center text-[9px] text-slate-500 pt-2 border-t border-slate-900/40">
              <span>{sector.load}</span>
              <span className="text-[#00F2FE]">{sector.intensity}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Sector Real-time Syslog Panel */}
      <div className="mt-6 w-full max-w-4xl px-4">
        <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg font-mono text-[10px] text-os-text-muted flex items-center gap-2 shadow-inner">
          <Terminal size={12} className="text-[#00F2FE] shrink-0" />
          <span className="truncate select-text">{currentSector.syslog}</span>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 3. CIRCULAR OPERATING LOOP VISUALIZER
// ==========================================
interface LoopStep {
  label: string;
  desc: string;
}

export const CircularOperatingLoop: React.FC<{ steps: LoopStep[] }> = ({ steps }) => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const currentStep = steps[activeStepIdx];

  // Specific visual telemetry descriptors for the 10 loop steps
  const stepMetadata: Record<string, { input: string; output: string; metric: string }> = {
    SENSE: { input: 'Raw events, ERP syncs, sensor streams', output: 'Unified, filtered signal telemetry', metric: 'Ingest fidelity: 99.98%' },
    UNDERSTAND: { input: 'Signals, historical context, topology graph', output: 'Entity relations, validated anomalies', metric: 'Semantic match: 99.4%' },
    PREDICT: { input: 'Current states, trends, predictive models', output: 'Risk forecast, SLA breach estimates', metric: 'Forecast calibration: 94.2%' },
    SIMULATE: { input: 'Scenario requests, forecast distributions', output: 'Parallel alternative future branches', metric: 'Simulation throughput: 50k runs/sec' },
    DECIDE: { input: 'Simulation branches, financial objectives', output: 'Economic trade-offs, optimal advice', metric: 'Decision value index: 98.7' },
    APPROVE: { input: 'System recommendations, policy boundaries', output: 'Authorized workflow blueprints', metric: 'Governance compliance: 100%' },
    ACT: { input: 'Approved blueprints, system API connectors', output: 'ERP triggers, dispatch, booking requests', metric: 'API dispatch latency: 12ms' },
    VERIFY: { input: 'Execution signals, customer invoices, telemetry', output: 'Deviation logs, realized vs expected matrix', metric: 'Verification accuracy: 99.9%' },
    REMEMBER: { input: 'Executed decisions, verification outcomes', output: 'Compressed SCM history memory vectors', metric: 'Storage efficiency: 94.6%' },
    LEARN: { input: 'Historical memory records, human overrides', output: 'Updated autopilot and policy coefficients', metric: 'Calibration velocity: +1.2% cycle' }
  };

  const meta = stepMetadata[currentStep.label] || { input: 'System data state', output: 'Calculated recommendations', metric: 'Active' };

  return (
    <div className="space-y-8">
      <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
        ORION OPERATING LOOP <span className="text-slate-500 font-normal">("THE CIRCADIAN RHYTHM")</span>
      </h3>
      
      <p className="font-mono text-sm leading-relaxed max-w-4xl text-os-text-muted">
        Continuous, automated optimization requires a system that cycles from observation to execution and self-calibration. Click any node in the operating loop to inspect its input/output boundaries and real-time processing performance.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-950/40 border border-slate-900 rounded-2xl p-6 sm:p-8">
        
        {/* Left Side: SVG Circular Node Layout */}
        <div className="lg:col-span-7 flex justify-center items-center py-6">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* Outer Circular Path */}
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(0, 242, 254, 0.08)" strokeWidth="1" />
              
              {/* Animated Particle traveling along path */}
              <circle cx="50" cy="50" r="38" fill="none" stroke="url(#loopParticleGradient)" strokeWidth="1.5" strokeDasharray="15 220" strokeLinecap="round" style={{ transformOrigin: 'center', animation: 'spin 10s linear infinite' }} />

              <defs>
                <linearGradient id="loopParticleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F2FE" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00F2FE" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Connecting lines from active step to center */}
              {steps.map((step, idx) => {
                const angle = (idx * 2 * Math.PI) / steps.length - Math.PI / 2;
                const x = 50 + 38 * Math.cos(angle);
                const y = 50 + 38 * Math.sin(angle);
                const isActive = activeStepIdx === idx;

                return (
                  <line
                    key={idx}
                    x1="50"
                    y1="50"
                    x2={x}
                    y2={y}
                    stroke={isActive ? 'rgba(0, 242, 254, 0.15)' : 'rgba(148, 163, 184, 0.015)'}
                    strokeWidth="0.5"
                    strokeDasharray={isActive ? '0' : '2 2'}
                  />
                );
              })}
            </svg>

            {/* Inner Dashboard Core */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-950 border border-slate-900 flex flex-col items-center justify-center text-center p-3 z-10 select-none">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">CURRENT INDEX</span>
              <span className="text-xl font-extrabold text-[#00F2FE] font-mono">{String(activeStepIdx + 1).padStart(2, '0')}</span>
              <span className="text-[8px] font-mono text-os-text-muted mt-1 uppercase max-w-[80px] truncate">{currentStep.label}</span>
            </div>

            {/* 10 Step Interactive Nodes */}
            {steps.map((step, idx) => {
              const angle = (idx * 2 * Math.PI) / steps.length - Math.PI / 2;
              const xPercent = 50 + 38 * Math.cos(angle);
              const yPercent = 50 + 38 * Math.sin(angle);
              const isActive = activeStepIdx === idx;

              return (
                <button
                  key={idx}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-mono tracking-wider uppercase rounded-md border transition-all duration-300 cursor-pointer select-none
                    ${isActive 
                      ? 'bg-[#00F2FE]/10 border-[#00F2FE] text-[#00F2FE] font-bold shadow-[0_0_10px_rgba(0,242,254,0.15)] z-20' 
                      : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-os-text-secondary hover:border-slate-700 z-10'}`}
                  style={{
                    left: `${xPercent}%`,
                    top: `${yPercent}%`
                  }}
                >
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Technical HUD Panel */}
        <div className="lg:col-span-5 space-y-4 font-mono">
          <div className="p-5 border border-slate-900 bg-slate-950 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-[11px] font-bold text-os-text-primary uppercase tracking-widest">{currentStep.label} NODE</span>
              <span className="text-[9px] text-[#00F2FE] bg-[#00F2FE]/10 border border-[#00F2FE]/20 px-2 py-0.5 rounded-full">Phase {activeStepIdx + 1} of 10</span>
            </div>
            
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Functional Role</span>
              <p className="text-[11px] leading-relaxed text-os-text-secondary select-text">{currentStep.desc}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Inbound Interface</span>
                <div className="text-[10px] text-os-text-muted bg-slate-900/40 p-2 rounded border border-slate-900/60 leading-normal select-text truncate">
                  {meta.input}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Outbound Interface</span>
                <div className="text-[10px] text-os-text-muted bg-slate-900/40 p-2 rounded border border-slate-900/60 leading-normal select-text truncate">
                  {meta.output}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px] text-[#30D158]">
              <span className="text-slate-500">Live Status:</span>
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
                {meta.metric}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
            <button
              onClick={() => setActiveStepIdx(prev => (prev - 1 + steps.length) % steps.length)}
              className="text-[10px] text-slate-500 hover:text-os-text-secondary font-bold transition-colors uppercase select-none cursor-pointer"
            >
              ← Previous Stage
            </button>
            <button
              onClick={() => setActiveStepIdx(prev => (prev + 1) % steps.length)}
              className="text-[10px] text-[#00F2FE] hover:text-[#00F2FE]/80 font-bold transition-colors uppercase select-none cursor-pointer"
            >
              Next Stage →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 4. INTERACTIVE ARCHITECTURE NETWORK DIAGRAM
// ==========================================
interface ArchNode {
  id: string;
  name: string;
  desc: string;
  tier: number;
}

export const ArchitectureNetworkDiagram: React.FC<{ appName: string }> = ({ appName }) => {
  const [hoveredNode, setHoveredNode] = useState<ArchNode | null>(null);

  const nodes: ArchNode[] = [
    { id: 'autopilot', name: 'ORION AUTOPILOT', desc: 'Autonomous execution engine managing decision levels 0-5 directly mapped to corporate compliance thresholds.', tier: 1 },
    { id: 'decision', name: 'DECISION ENGINE', desc: 'Synthesizes scenario outputs, evaluating cash flow, lead time, and risk matrix to propose optimal actions.', tier: 2 },
    { id: 'reasoning', name: 'ORION REASONING', desc: 'A semantic translation and prompt architecture layer aligning Gemini capabilities to supply chain logic.', tier: 3 },
    { id: 'worldmodel', name: 'WORLD MODEL', desc: 'Dynamic digital twin of the complete network structure, projecting current constraints into future timelines.', tier: 4 },
    { id: 'data', name: 'DATA CORE', desc: 'Normalized and resolved data stream ingesting suppliers, warehouses, logistics tracking, and demand sensors.', tier: 5 }
  ];

  const details: Record<string, { inputs: string; outputs: string; relation: string }> = {
    autopilot: { inputs: 'Authorized Workflows, Policy validation', outputs: 'Direct API execution to ERP, Booking dispatch', relation: 'Dispatches finalized SCM operational actions.' },
    decision: { inputs: 'Simulation trees, Cost tables, Goal matrix', outputs: 'Optimal scenarios, Recommended actions', relation: 'Weighs business objectives to provide resolution suggestions.' },
    reasoning: { inputs: 'Disruption alerts, Gemini analysis prompts', outputs: 'Structured causal graphs, Explanatory diagnostics', relation: 'Applies domain-trained models to logical problems.' },
    worldmodel: { inputs: 'Raw telemetry, Historical memory state', outputs: 'Constraint forecasts, Downstream impact estimates', relation: 'Maintains connected state across Past, Present, and Future.' },
    data: { inputs: 'ERP integrations, IoT relays, Carrier feeds', outputs: 'Normalized relational entities and clean signals', relation: 'Synthesizes fragmented supply chain signals into a single foundation.' }
  };

  const activeMeta = hoveredNode ? details[hoveredNode.id] : null;

  return (
    <div className="space-y-8">
      <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
        {appName} ARCHITECTURE <span className="text-slate-500 font-normal">("THE ARCHITECTURAL NODE NET")</span>
      </h3>
      
      <p className="font-mono text-sm leading-relaxed max-w-4xl text-os-text-muted">
        Orion is structured in functional layers that translate raw operational observations into automated enterprise execution. Hover over any architectural tier in the diagram to trace its operational logic, inputs, and outputs.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-slate-950/40 border border-slate-900 rounded-2xl p-6 sm:p-8">
        
        {/* Left Side: Tiered Blueprint Diagram */}
        <div className="lg:col-span-7 flex flex-col justify-center gap-4 py-4">
          <div className="space-y-4 font-mono relative">
            {/* SVG Background Path Links */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none">
              {/* Connector lines from bottom to top */}
              <path d="M200 270 L200 215 M200 210 L200 155 M200 150 L200 95 M200 90 L200 35" stroke="rgba(0, 242, 254, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Floating Signal Particles traveling upwards */}
              <circle r="2" fill="#00F2FE">
                <animateMotion dur="5s" repeatCount="indefinite" path="M200 270 L200 35" />
              </circle>
              <circle r="2" fill="rgb(168, 85, 247)">
                <animateMotion dur="5s" begin="2.5s" repeatCount="indefinite" path="M200 270 L200 35" />
              </circle>
            </svg>

            {nodes.map(node => {
              const isActive = hoveredNode?.id === node.id;
              
              // Dynamic tier color coding
              const tierColor = 
                node.tier === 1 ? 'border-[#30D158] text-[#30D158] bg-[#30D158]/5' :
                node.tier === 2 ? 'border-[#FF9F0A] text-[#FF9F0A] bg-[#FF9F0A]/5' :
                node.tier === 3 ? 'border-[#a855f7] text-[#a855f7] bg-[#a855f7]/5' :
                node.tier === 4 ? 'border-[#00F2FE] text-[#00F2FE] bg-[#00F2FE]/5' :
                'border-slate-800 text-os-text-muted bg-slate-950';

              return (
                <div
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`w-full max-w-lg mx-auto p-4 border rounded-xl text-center cursor-help transition-all duration-300 relative select-none
                    ${isActive 
                      ? 'shadow-[0_0_15px_rgba(0,242,254,0.05)] scale-[1.02] border-slate-600' 
                      : 'border-slate-900 bg-slate-950/80 hover:border-slate-800'}`}
                >
                  <div className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border mb-1 tracking-widest uppercase ${tierColor}`}>
                    {node.name}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest">LAYER {node.tier}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Description Overlay */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="p-6 border border-slate-900 bg-slate-950 rounded-2xl font-mono text-xs space-y-4 min-h-[280px] flex flex-col justify-center">
            {hoveredNode ? (
              <div className="space-y-4">
                <div className="border-b border-slate-900 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Target Component</span>
                  <h4 className="text-[13px] font-bold text-[#00F2FE] uppercase tracking-widest">{hoveredNode.name}</h4>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Description</span>
                  <p className="text-[11px] leading-relaxed text-os-text-secondary select-text">{hoveredNode.desc}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-900/60">
                  <div className="flex justify-between items-start text-[10px]">
                    <span className="text-slate-500 uppercase">Input:</span>
                    <span className="text-os-text-secondary font-bold max-w-[240px] text-right select-text truncate">{activeMeta?.inputs}</span>
                  </div>
                  <div className="flex justify-between items-start text-[10px]">
                    <span className="text-slate-500 uppercase">Output:</span>
                    <span className="text-os-text-secondary font-bold max-w-[240px] text-right select-text truncate">{activeMeta?.outputs}</span>
                  </div>
                  <div className="flex justify-between items-start text-[10px]">
                    <span className="text-slate-500 uppercase">Function:</span>
                    <span className="text-os-text-muted max-w-[240px] text-right select-text truncate">{activeMeta?.relation}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 space-y-2 select-none">
                <Cpu size={24} className="mx-auto text-slate-600 animate-pulse" />
                <p className="uppercase tracking-widest text-[10px]">ORION INFRASTRUCTURE BLUEPRINT</p>
                <p className="text-[11px] max-w-xs mx-auto">Hover over any architectural layer on the left to reveal telemetry details, connection maps, and process boundaries.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};


// ==========================================
// 5. DEEP INTELLIGENCE MATRIX CONSTELLATION (DUAL VIEW)
// ==========================================
interface MatrixRow {
  domain: string;
  intelligence: string;
  decision: string;
  action: string;
  learning: string;
}

export const PlatformIntelligenceConstellation: React.FC<{ matrix: MatrixRow[] }> = ({ matrix }) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'constellation'>('matrix');
  const [selectedDomainIdx, setSelectedDomainIdx] = useState<number>(0);
  const activeDomain = matrix[selectedDomainIdx];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
          PLATFORM INTELLIGENCE MATRIX <span className="text-slate-500 font-normal">("THE DEEP INTELLIGENCE CONSTELLATION")</span>
        </h3>
        
        {/* Toggle Controls */}
        <div className="flex gap-1.5 p-1 bg-slate-950 border border-slate-900 rounded-lg shrink-0 font-mono text-[10px]">
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer uppercase select-none font-bold
              ${viewMode === 'matrix' ? 'bg-[#00F2FE]/10 text-[#00F2FE]' : 'text-slate-500 hover:text-os-text-secondary'}`}
          >
            Matrix Table
          </button>
          <button
            onClick={() => setViewMode('constellation')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer uppercase select-none font-bold
              ${viewMode === 'constellation' ? 'bg-[#00F2FE]/10 text-[#00F2FE]' : 'text-slate-500 hover:text-os-text-secondary'}`}
          >
            Neural Constellation
          </button>
        </div>
      </div>

      <p className="font-mono text-sm leading-relaxed max-w-4xl text-os-text-muted">
        Orion maps supply chain complexity into discrete operational domains. In either view, trace how system intelligence feeds decisions, actions, and downstream learning loops.
      </p>

      {viewMode === 'matrix' ? (
        /* Grid / Table View */
        <div className="overflow-x-auto bg-slate-950 border border-slate-900 rounded-2xl shadow-inner select-none">
          <table className="w-full text-left font-mono text-[11px] min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/80 text-os-text-primary uppercase tracking-widest text-[9px] font-bold">
                <th className="p-4">Domain</th>
                <th className="p-4">Intelligence (Sense)</th>
                <th className="p-4">Decision (Reason)</th>
                <th className="p-4">Action (Execute)</th>
                <th className="p-4">Learning (Calibrate)</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => {
                    setSelectedDomainIdx(idx);
                    setViewMode('constellation');
                  }}
                  className={`border-b border-slate-900/60 last:border-0 hover:bg-slate-900/20 transition-all cursor-pointer
                    ${idx === selectedDomainIdx ? 'bg-slate-900/10' : ''}`}
                >
                  <td className="p-4 font-bold text-os-text-primary">{row.domain}</td>
                  <td className="p-4 text-[#00F2FE] select-text">{row.intelligence}</td>
                  <td className="p-4 text-[#FF9F0A] select-text">{row.decision}</td>
                  <td className="p-4 text-[#30D158] select-text">{row.action}</td>
                  <td className="p-4 text-purple-400 select-text">{row.learning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Constellation View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-slate-950/40 border border-slate-900 rounded-2xl p-6 sm:p-8 select-none">
          
          {/* Domains Selector Column */}
          <div className="lg:col-span-4 flex flex-col gap-1.5 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar font-mono text-[10px]">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest px-2 mb-1">Select SCM Domain</span>
            {matrix.map((row, idx) => (
              <button
                key={row.domain}
                onClick={() => setSelectedDomainIdx(idx)}
                className={`w-full text-left p-2.5 border rounded-lg transition-all duration-300 uppercase tracking-wider font-bold cursor-pointer select-none
                  ${selectedDomainIdx === idx 
                    ? 'bg-slate-950 border-slate-700 text-[#00F2FE]' 
                    : 'bg-slate-950/20 border-slate-900 text-slate-500 hover:text-os-text-secondary hover:border-slate-800'}`}
              >
                {row.domain}
              </button>
            ))}
          </div>

          {/* Neural Flow Constellation Visualization */}
          <div className="lg:col-span-8 flex flex-col justify-center">
            <div className="p-6 border border-slate-900 bg-slate-950 rounded-2xl font-mono text-xs space-y-6">
              
              <div className="border-b border-slate-900 pb-2">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Active Constellation Cluster</span>
                <h4 className="text-[14px] font-bold text-[#00F2FE] uppercase tracking-widest">{activeDomain.domain} DOMAIN</h4>
              </div>

              {/* Animated Constellation Node Row */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 relative py-4 bg-slate-900/20 border border-slate-900/60 p-4 rounded-xl">
                
                {/* Horizontal Link SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <path d="M 50,50 L 450,50" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" strokeDasharray="3 3" />
                  <circle r="1.5" fill="#00F2FE">
                    <animateMotion dur="4s" repeatCount="indefinite" path="M 50,50 L 450,50" />
                  </circle>
                </svg>

                {/* State 1: Intelligence */}
                <div className="text-center space-y-2 z-10 w-full md:w-auto">
                  <div className="text-[8px] text-slate-500 uppercase tracking-widest">1. Intelligence (Sense)</div>
                  <div className="px-3 py-2 border border-[#00F2FE]/30 bg-[#00F2FE]/5 text-[#00F2FE] rounded-lg font-bold text-[10px] md:max-w-[130px] mx-auto leading-normal uppercase">
                    {activeDomain.intelligence}
                  </div>
                </div>

                <div className="text-slate-500 text-[10px] md:block rotate-90 md:rotate-0">→</div>

                {/* State 2: Decision */}
                <div className="text-center space-y-2 z-10 w-full md:w-auto">
                  <div className="text-[8px] text-slate-500 uppercase tracking-widest">2. Decision (Reason)</div>
                  <div className="px-3 py-2 border border-[#FF9F0A]/30 bg-[#FF9F0A]/5 text-[#FF9F0A] rounded-lg font-bold text-[10px] md:max-w-[130px] mx-auto leading-normal uppercase">
                    {activeDomain.decision}
                  </div>
                </div>

                <div className="text-slate-500 text-[10px] md:block rotate-90 md:rotate-0">→</div>

                {/* State 3: Action */}
                <div className="text-center space-y-2 z-10 w-full md:w-auto">
                  <div className="text-[8px] text-slate-500 uppercase tracking-widest">3. Action (Execute)</div>
                  <div className="px-3 py-2 border border-[#30D158]/30 bg-[#30D158]/5 text-[#30D158] rounded-lg font-bold text-[10px] md:max-w-[130px] mx-auto leading-normal uppercase">
                    {activeDomain.action}
                  </div>
                </div>

                <div className="text-slate-500 text-[10px] md:block rotate-90 md:rotate-0">→</div>

                {/* State 4: Learning */}
                <div className="text-center space-y-2 z-10 w-full md:w-auto">
                  <div className="text-[8px] text-slate-500 uppercase tracking-widest">4. Learning (Calibrate)</div>
                  <div className="px-3 py-2 border border-purple-400/30 bg-purple-400/5 text-purple-400 rounded-lg font-bold text-[10px] md:max-w-[130px] mx-auto leading-normal uppercase">
                    {activeDomain.learning}
                  </div>
                </div>

              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-900/60 pt-4 leading-relaxed">
                <span className="text-os-text-secondary font-bold uppercase">Operational Flow:</span> Raw SCM anomalies in <span className="text-os-text-muted">{activeDomain.domain}</span> are captured, translated into a structured recommendation, executed as a system-level policy, and audited to optimize model accuracy.
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};


// ==========================================
// 6. "SUPPLY CHAIN TALKS TO ORION" SEQUENCE TERMINAL
// ==========================================
interface ScenarioStep {
  time: string;
  type: string;
  message: string;
}

export const SCMCommunicationTerminal: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string>('alpha');
  const [runningStep, setRunningStep] = useState<number>(6); // Complete by default
  const [logs, setLogs] = useState<ScenarioStep[]>([]);
  const terminalLogsContainerRef = useRef<HTMLDivElement | null>(null);

  const scenarios: Record<string, { name: string; trigger: string; steps: ScenarioStep[] }> = {
    alpha: {
      name: 'Global Shipping Disruption',
      trigger: 'Carrier vessel tracking delay near Port of Los Angeles',
      steps: [
        { time: '08:00:00', type: 'SIGNAL_INBOUND', message: 'Inbound telemetry: AIS ship transponder shows Carrier "ORION-Vanguard" anchored 12 miles outside LA port limit. Drift rate: 0.1 knots.' },
        { time: '08:00:15', type: 'WORLD_MODEL_RECONSTRUCT', message: 'Recalculating SCM digital twin. Found 4 POs (PO-8812, PO-8815, PO-8902, PO-8903) representing 14,200 microprocessors on board.' },
        { time: '08:00:45', type: 'INTELLIGENCE_ANALYTICS', message: 'Risk assessment: Projecting +7.2 days delivery delay. Warehouse Chicago-North stockout risk is 94.2% by Friday. Customer SLA Breach imminent.' },
        { time: '08:01:20', type: 'SCENARIO_SIMULATION', message: 'Simulated 3 resolutions: A) Do Nothing (SLA Breach, Cost $42k airfreight), B) Inter-depot buffer transfer from Boston (Cost $4.5k), C) Alternate carrier (Cost $15k).' },
        { time: '08:01:50', type: 'DECISION_RECOMMENDATION', message: 'Option B recommended. Optimal margins (98.2% Efficiency Index). Chicago SLA preserved. Boston inventory remains within policy safety limit.' },
        { time: '08:02:15', type: 'ACTION_DISPATCH', message: 'Policy Engine verified transfer budget is within $5,000 allowance. Autopilot dispatched inter-depot logistics transfer request to local carrier.' }
      ]
    },
    beta: {
      name: 'Critical Supplier Insolvency',
      trigger: 'Financial default filing at overseas component manufacturing facility',
      steps: [
        { time: '09:12:00', type: 'SIGNAL_INBOUND', message: 'Financial distress alert: Component supplier "Xing-Tech Precision" filed for capital restructuring. Facility operations scaled down 60%.' },
        { time: '09:12:22', type: 'WORLD_MODEL_RECONSTRUCT', message: 'Scanning supplier dependencies. Xing-Tech is single-source supplier for "Component Alpha-9", found in 12 products (affecting 22% of quarterly demand).' },
        { time: '09:12:55', type: 'INTELLIGENCE_ANALYTICS', message: 'Lead-time prediction models adjust from 14 days to 95 days. Financial risk velocity: CRITICAL. Assembly line shutdown sequence pre-triggered.' },
        { time: '09:13:30', type: 'SCENARIO_SIMULATION', message: 'Evaluating sourcing: Option A) Switch to alternative supplier Hanoi, Vietnam (Lead-time 18 days, cost +4.2%), Option B) Buy out distributor bridge stock (+15% cost).' },
        { time: '09:14:10', type: 'DECISION_RECOMMENDATION', message: 'Recommended: Buy secondary distributor stock to cover 45 days, combined with parallel onboarding of Hanoi facility for long-term supply.' },
        { time: '09:14:45', type: 'ACTION_DISPATCH', message: 'Generated Vietnam PO draft. Prepared distributor buyout orders. Escalated to Procurement Director for final governance approval.' }
      ]
    },
    gamma: {
      name: 'Extreme Demand Spike',
      trigger: 'Viral market uptake spikes regional sales volume by 312%',
      steps: [
        { time: '14:35:00', type: 'SIGNAL_INBOUND', message: 'Sales velocity spike detected. North American orders for "Orion-Pro Model X" increased 312% in the last 4 hours.' },
        { time: '14:35:18', type: 'WORLD_MODEL_RECONSTRUCT', message: 'World Model update: NA inventory depletion predicted in 3.4 days. Current safety stock targets fail current demand standard deviation.' },
        { time: '14:35:50', type: 'INTELLIGENCE_ANALYTICS', message: 'Estimated unfulfilled revenue risk: $1.82M. Opportunity rating: CRITICAL. Supply chain bottleneck isolated to assembly throughput at Factory 3.' },
        { time: '14:36:20', type: 'SCENARIO_SIMULATION', message: 'Simulated operations: Option A) Enable 3rd overtime shift at Factory 3 (+35% output, cost +$18k), Option B) Air-freight excess inventory from EU (cost $55k).' },
        { time: '14:37:05', type: 'DECISION_RECOMMENDATION', message: 'Recommended: Option A. Retains highest margins (91.4% vs 74.2% under Option B). Overtime labor within standard policy limits.' },
        { time: '14:37:35', type: 'ACTION_DISPATCH', message: 'Dispatched Overtime Approval notification to Plant Managers. Updated procurement schedules to pull forward raw material orders by 6 days.' }
      ]
    }
  };

  const currentScenario = scenarios[activeScenario];

  useEffect(() => {
    setLogs([]);
    setRunningStep(0);
  }, [activeScenario]);

  useEffect(() => {
    if (runningStep < currentScenario.steps.length) {
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, currentScenario.steps[runningStep]]);
        setRunningStep(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [runningStep, activeScenario, currentScenario]);

  useEffect(() => {
    // Only scroll the terminal box's internal container, never touch parent window/document scroll
    if (terminalLogsContainerRef.current) {
      terminalLogsContainerRef.current.scrollTop = terminalLogsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="space-y-8">
      <h3 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-4">
        "SUPPLY CHAIN TALKS TO ORION" <span className="text-slate-500 font-normal">("REAL-TIME DEMONSTRATION TERMINAL")</span>
      </h3>
      
      <p className="font-mono text-sm leading-relaxed max-w-4xl text-os-text-muted">
        Trace how Orion receives raw physical supply chain signals, matches them onto the World Model, predicts risk, simulates parallel scenarios, recommends decisions, and dispatches actions. Click on a scenario below to run the step-by-step diagnostic sequence.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch font-mono text-xs">
        
        {/* Scenario Selection Cards */}
        <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
          {Object.entries(scenarios).map(([key, value]) => (
            <div
              key={key}
              onClick={() => {
                if (runningStep >= currentScenario.steps.length) {
                  setActiveScenario(key);
                }
              }}
              className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 flex flex-col justify-between select-none
                ${activeScenario === key 
                  ? 'bg-slate-950 border-slate-700 shadow-[0_0_15px_rgba(0,242,254,0.03)]' 
                  : 'bg-slate-950/20 border-slate-900 text-slate-500 hover:text-os-text-muted hover:bg-slate-900/10'}`}
            >
              <span className={`text-[11px] font-bold uppercase tracking-wider
                ${activeScenario === key ? 'text-[#00F2FE]' : 'text-os-text-muted'}`}
              >
                {value.name}
              </span>
              <p className="text-[10px] leading-relaxed text-slate-500 mt-2 select-none">{value.trigger}</p>
              
              <div className="flex justify-between items-center text-[9px] pt-3 border-t border-slate-900/50 mt-3">
                <span className="text-slate-600">STATE:</span>
                <span className={`font-bold tracking-widest
                  ${activeScenario === key 
                    ? runningStep < value.steps.length ? 'text-amber-500 animate-pulse' : 'text-[#30D158]'
                    : 'text-slate-600'}`}
                >
                  {activeScenario === key 
                    ? runningStep < value.steps.length ? 'DECOMPOSING...' : 'COMPLETED'
                    : 'STANDBY'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Monospace Interactive Terminal View */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="w-full bg-slate-950 border border-slate-900 rounded-2xl flex flex-col h-[340px] shadow-inner overflow-hidden">
            {/* Terminal Top Bar */}
            <div className="flex justify-between items-center bg-slate-950 px-4 py-2 border-b border-slate-900 shrink-0">
              <div className="flex items-center gap-1.5 select-none">
                <span className="w-2 h-2 rounded-full bg-[#FF453A]" />
                <span className="w-2 h-2 rounded-full bg-[#FF9F0A]" />
                <span className="w-2 h-2 rounded-full bg-[#30D158]" />
                <span className="text-[9px] text-slate-500 font-bold ml-2 tracking-widest uppercase">ORION-DECOMPOSITION-ENGINE_v9.0</span>
              </div>
              <div className="text-[8px] text-slate-600 font-bold">STATUS: RUNNING</div>
            </div>

            {/* Terminal Logs Output */}
            <div ref={terminalLogsContainerRef} className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar text-[10px] leading-relaxed text-os-text-muted select-text">
              <div className="text-slate-600 border-b border-slate-900 pb-2 flex justify-between">
                <span>[SCENARIO ACTIVE]: {currentScenario.name}</span>
                <span className="text-[#00F2FE] animate-pulse">● SIGNAL FLOWING</span>
              </div>

              {logs.map((log, idx) => {
                const color = 
                  log.type === 'SIGNAL_INBOUND' ? 'text-[#00F2FE]' :
                  log.type === 'WORLD_MODEL_RECONSTRUCT' ? 'text-purple-400' :
                  log.type === 'INTELLIGENCE_ANALYTICS' ? 'text-[#FF453A]' :
                  log.type === 'SCENARIO_SIMULATION' ? 'text-os-text-secondary' :
                  log.type === 'DECISION_RECOMMENDATION' ? 'text-[#FF9F0A]' :
                  'text-[#30D158]';

                return (
                  <div key={idx} className="space-y-0.5 border-b border-slate-900/30 pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-bold">[{log.time}]</span>
                      <span className={`font-bold tracking-widest text-[9px] ${color}`}>[{log.type}]</span>
                    </div>
                    <p className="pl-4 text-os-text-secondary">{log.message}</p>
                  </div>
                );
              })}

              {runningStep < currentScenario.steps.length && (
                <div className="flex items-center gap-2 text-[#00F2FE] text-[9px] animate-pulse">
                  <span>●</span>
                  <span>PARSING NEXT COMPONENT EVENT PATHWAY...</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};


// ==========================================
// 7. TRUST BY DESIGN VISUAL CONFIDENCE GAUGES
// ==========================================
export const TrustGauges: React.FC = () => {
  const gauges = [
    { title: 'Data Confidence', metric: '98.7%', desc: 'Measures ERP & IoT sensor stream data completeness and formatting anomalies.' },
    { title: 'AI Confidence', metric: '94.2%', desc: 'Evaluates logical grounding to shield recommendations against hallucinations.' },
    { title: 'Decision Confidence', metric: '99.1%', desc: 'Validates that calculated resolutions fit optimal margin constraints.' },
    { title: 'Execution Confidence', metric: '97.5%', desc: 'Evaluates the historical success rate of API dispatches to external carriers.' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {gauges.map((gauge, idx) => {
        const strokeColor = 
          idx === 0 ? 'stroke-[#00F2FE]' :
          idx === 1 ? 'stroke-purple-400' :
          idx === 2 ? 'stroke-[#FF9F0A]' :
          'stroke-[#30D158]';

        const percent = parseFloat(gauge.metric);
        const strokeDashoffset = 125 - (125 * percent) / 100;

        return (
          <div key={idx} className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex flex-col items-center text-center space-y-4 shadow-sm select-none">
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500">{gauge.title}</span>
            
            {/* SVG Circular Gauge */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="2.5" />
                <circle 
                  cx="24" 
                  cy="24" 
                  r="20" 
                  fill="none" 
                  className={strokeColor}
                  strokeWidth="2.5" 
                  strokeDasharray="125" 
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="absolute font-mono text-xs font-bold text-os-text-primary">{gauge.metric}</div>
            </div>

            <p className="text-[10px] font-mono leading-relaxed text-os-text-muted select-text">{gauge.desc}</p>
          </div>
        );
      })}
    </div>
  );
};


// ==========================================
// 8. INTERACTIVE BEYOND SCM FLOATING CONSTELLATION TAGS
// ==========================================
export const FloatingConstellationTags: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const tags: Record<string, string> = {
    'Supply Chain Memory': 'Retains full context of operational disruptions, supplier behavior, and action outcomes to allow comparison in subsequent cycles.',
    'Causal Intelligence': 'Traces upstream root causes and downstream consequences rather than observing linear correlations.',
    'Counterfactual Decisions': 'Simulates alternate paths ("What if we used Carrier B?") to measure theoretical optimal margins.',
    'Promise Strength': 'Real-time reliability calculations of supplier lead-times based on physical delivery deviations.',
    'Signal Language': 'Translates unstructured alerts, emails, and ERP reports into a unified system-wide JSON stream.',
    'Risk Velocity': 'Measures how fast a localized logistics or material failure ripples across the global network.',
    'Decision Pressure': 'The rate at which potential resolution options deteriorate or become more costly as time passes.',
    'Decision Window': 'The exact time remaining to execute a mitigation plan before options decay completely.',
    'Option Decay': 'The depletion of logistics routes or alternative supply inventory due to delayed decision-making.',
    'Operational Friction': 'Friction losses in physical handling, customs clearances, or transport latency.',
    'Operational Momentum': 'The velocity of fulfillment queues and transit lines across the distribution network.',
    'Operational Gravity': 'The logistical pull of central distribution hubs that creates supply density and storage capacity risks.',
    'Blast Radius': 'The total downstream customer, order, and revenue exposure from a specific transit or supplier failure.',
    'Shockwave Analysis': 'Predicts how localized port congestions impact distant regional warehouses.',
    'Hidden Coupling': 'Undocumented sub-tier dependencies, such as different tier-1 suppliers sharing the exact same sub-tier raw material source.',
    'Information Bottlenecks': 'Stages where communication latency or manual entry halts workflow orchestration.',
    'Process Shadow': 'Lanes or nodes lacking real-time tracking, reliant on manual or periodic ERP logs.',
    'System-Reality Gap': 'Discrepancy between recorded digital database values and physical reality in the warehouse.',
    'Resilience Erosion': 'The unmonitored exhaustion of safety buffers due to continuous minor deviations.',
    'Bottleneck Migration': 'Resolving a capacity constraint in one area causing a secondary bottleneck elsewhere.',
    'Planning Reality Gap': 'The divergence between long-term theoretical production plans and bottom-up physical logistical execution.',
    'Decision Debt': 'The compounding operational cost of delayed or deferred SCM decisions.',
    'Operational Debt': 'Temporary, expensive logistical patches (e.g., airfreighting) that cause downstream inventory imbalances.',
    'Action Shadow': 'The delay between authorizing a digital system transfer and physical arrival at the location.',
    'AI Calibration': 'Continual tuning of recommendation thresholds to prevent operator alert fatigue.',
    'Human-AI Override Learning': 'Recording operator overrides to dynamically adjust autonomous policy thresholds.'
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-center py-4 max-w-5xl mx-auto">
        {Object.keys(tags).map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            className={`px-3 py-1.5 border rounded-full font-mono text-[10px] uppercase tracking-wider transition-all duration-300 cursor-pointer select-none
              ${tag === selectedTag 
                ? 'bg-[#00F2FE]/15 border-[#00F2FE] text-[#00F2FE] font-bold shadow-[0_0_10px_rgba(0,242,254,0.08)]' 
                : 'bg-slate-950 border-slate-900 text-os-text-muted hover:border-slate-700 hover:text-os-text-primary'}`}
          >
            {tag}
          </button>
        ))}
      </div>

      {selectedTag ? (
        <div className="max-w-2xl mx-auto p-4 border border-slate-900 bg-slate-950 rounded-xl font-mono text-center space-y-2 select-none">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest block">System Taxonomy Term</span>
          <h4 className="text-[11px] font-bold text-[#00F2FE] uppercase tracking-wider">{selectedTag}</h4>
          <p className="text-[11px] text-os-text-secondary leading-relaxed select-text">{tags[selectedTag]}</p>
        </div>
      ) : (
        <p className="text-center font-mono text-[10px] text-slate-500 uppercase tracking-widest">Click any term above to reveal its technical system definition</p>
      )}
    </div>
  );
};


// ==========================================
// 9. THE SYSTEM ARCHITECT & ORIGIN PANEL
// ==========================================
export const ArchitectLog: React.FC<{ appName: string }> = ({ appName }) => {
  return (
    <div className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden p-6 sm:p-10 text-center space-y-6 relative select-none">
      <div className="absolute top-2 left-2 font-mono text-[8px] text-slate-700 uppercase tracking-widest">CREATOR LOG // SCM_OS_v9</div>
      <div className="absolute top-2 right-2 font-mono text-[8px] text-[#30D158] uppercase tracking-widest flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" /> CALIBRATED
      </div>

      <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500">ORIGIN OF {appName}</div>
      <div className="flex justify-center mb-1">
        <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-full">
          <Award size={36} className="text-[#00F2FE] animate-pulse" />
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-os-text-primary tracking-tight leading-none uppercase">AYUSH PRAKASH</h2>
      <div className="text-[10px] font-mono text-[#00F2FE] uppercase tracking-wider">PROJECT MANAGER & AI SPECIALIST (TCS)</div>
      
      <p className="max-w-3xl mx-auto text-[11px] font-mono text-os-text-muted leading-relaxed select-text">
        Supply Chain Specialist and technology-focused practitioner working with Tata Consultancy Services (TCS), with extensive experience as a Project Manager and a current professional focus on AI specialization, robust enterprise application building, and advanced prompt engineering.
      </p>

      {/* Telemetry Credentials */}
      <div className="flex justify-center gap-4 flex-wrap text-[10px] font-mono text-slate-500 mt-4 uppercase tracking-widest select-none">
        <span className="flex items-center gap-1.5 border border-slate-900 bg-slate-900/10 px-3 py-1.5 rounded-lg"><Camera size={12} className="text-purple-400" /> Wildlife photography</span>
        <span className="flex items-center gap-1.5 border border-slate-900 bg-slate-900/10 px-3 py-1.5 rounded-lg"><Sliders size={12} className="text-[#FF9F0A]" /> Master editing</span>
        <span className="flex items-center gap-1.5 border border-slate-900 bg-slate-900/10 px-3 py-1.5 rounded-lg"><Cpu size={12} className="text-[#00F2FE]" /> Technology and AI application development</span>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-900 max-w-3xl mx-auto text-[11px] font-mono text-os-text-primary italic leading-relaxed select-text">
        "The vision behind ORION 9 is to bring deep supply-chain expertise, modern full-stack technology, generative artificial intelligence, and decision intelligence together into a unified operating environment that can continuously learn from the real-time operational reality of a global supply chain."
      </div>
    </div>
  );
};

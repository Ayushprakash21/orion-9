import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Database,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Settings,
  Factory,
  Package,
  Truck,
  FileText,
  Warehouse,
  Users,
  CheckCircle2,
  Lock,
  Radio,
  Zap,
} from "lucide-react";
import { BrandLogo } from "../brand/BrandLogo";
import { useBranding } from "../../store/BrandingContext";

export interface AdminNodeInfo {
  id: string;
  name: string;
  role: string;
  layer: string;
  tags: string[];
  description: string;
  coordination: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  upstream?: string;
  downstream?: string;
  angleDeg?: number; // for circular arrangement around ORION CORE
  side?: "left" | "right"; // for SCM domain cards
}

export const PLATFORM_ENGINES: AdminNodeInfo[] = [
  {
    id: "data-engine",
    name: "DATA ENGINE",
    role: "Telemetry Ingestion · Event Streaming",
    layer: "Input Pipeline Plane",
    tags: ["UNIFY", "PROCESS", "MODEL"],
    description:
      "High-throughput stream ingestion aggregating real-time enterprise ERP telemetry, vendor EDI feeds, and physical IoT sensors.",
    coordination: "Unified Multi-Source State Telemetry",
    icon: Database,
    accentColor: "#00F2FE",
    upstream: "ERP Endpoints, EDI Feeds, Edge IoT",
    downstream: "Orion Core Kernel & AI Model Mesh",
    angleDeg: 270, // 12 o'clock
  },
  {
    id: "decision-engine",
    name: "DECISION ENGINE",
    role: "Autonomous Optimization Policy",
    layer: "Strategic Control Plane",
    tags: ["ANALYZE", "SIMULATE", "RECOMMEND"],
    description:
      "Resolves multi-objective optimization constraints across service level agreements, procurement costs, and supply transit lead times.",
    coordination: "Autonomous Constraint Resolution",
    icon: BarChart3,
    accentColor: "#38BDF8",
    upstream: "Orion Core & AI Inference Mesh",
    downstream: "Workflow Engine Execution Bus",
    angleDeg: 330, // 2 o'clock
  },
  {
    id: "risk-engine",
    name: "RISK ENGINE",
    role: "Threat & Anomaly Detection",
    layer: "Security & Governance Plane",
    tags: ["DETECT", "ASSESS", "MITIGATE"],
    description:
      "Continuous geopolitical variance scoring, tier-N supplier disruption modeling, and administrative credential verification.",
    coordination: "Real-Time Risk Scoring & Policy Gating",
    icon: ShieldAlert,
    accentColor: "#F59E0B",
    upstream: "Global Disruption Feeds, Facility Status",
    downstream: "Decision Engine & Policy Enforcement",
    angleDeg: 30, // 4 o'clock
  },
  {
    id: "audit-engine",
    name: "AUDIT ENGINE",
    role: "Immutable Trace & Governance Ledger",
    layer: "Compliance & Governance Plane",
    tags: ["TRACE", "COMPLY", "GOVERN"],
    description:
      "Cryptographic journaling of all platform state transitions, administrative directives, and autonomous agent dispatch actions.",
    coordination: "Cryptographic Trace Verification",
    icon: Layers,
    accentColor: "#00F2FE",
    upstream: "Workflow Engine Execution Bus",
    downstream: "Immutable Platform Compliance Journal",
    angleDeg: 90, // 6 o'clock
  },
  {
    id: "workflow-engine",
    name: "WORKFLOW ENGINE",
    role: "Event Bus & Deterministic State Machine",
    layer: "Execution Orchestration Plane",
    tags: ["AUTOMATE", "ORCHESTRATE", "MONITOR"],
    description:
      "Deterministic state machine execution dispatching validated policies across operational warehouse, procurement, and logistics domains.",
    coordination: "Deterministic State Dispatch",
    icon: Settings,
    accentColor: "#00F2FE",
    upstream: "Orion Core & Decision Engine",
    downstream: "Audit Engine & Operational SCM Execution",
    angleDeg: 150, // 8 o'clock
  },
  {
    id: "ai-engine",
    name: "AI ENGINE",
    role: "Cognitive Neural Synthesis",
    layer: "Intelligence Synthesis Plane",
    tags: ["PREDICT", "OPTIMIZE", "LEARN"],
    description:
      "Deep multimodal neural inference and predictive demand forecasting with closed-loop parameter feedback to the Orion Core kernel.",
    coordination: "Neural Pattern Synthesis & Inference",
    icon: Brain,
    accentColor: "#00F2FE",
    upstream: "Orion Core Unified State Stream",
    downstream: "Decision Engine & Predictive Feedback",
    angleDeg: 210, // 10 o'clock
  },
];

export const SCM_DOMAIN_NODES: AdminNodeInfo[] = [
  // Left Column
  {
    id: "scm-supply",
    name: "SUPPLY",
    role: "Tier-1 / Tier-2 Supplier Visibility",
    layer: "Operational Execution Plane",
    tags: ["SUPPLIERS", "RAW MATERIALS", "CAPACITY"],
    description: "Upstream vendor capacity, purchase commitments, and material availability feeds.",
    coordination: "Vendor Allocation Dispatch",
    icon: Factory,
    accentColor: "#38BDF8",
    upstream: "Raw Material Vendors",
    downstream: "Inventory Core & AI Engine",
    side: "left",
  },
  {
    id: "scm-inventory",
    name: "INVENTORY",
    role: "Global Multi-Echelon Stock State",
    layer: "Operational Execution Plane",
    tags: ["STOCK", "BUFFERS", "TURNS"],
    description: "Real-time visibility across distribution centers, buffer nodes, and replenishment cycles.",
    coordination: "Dynamic Buffer Optimization",
    icon: Package,
    accentColor: "#38BDF8",
    upstream: "Supply Feed & Procurement Orders",
    downstream: "Logistics Routing & Fulfillment",
    side: "left",
  },
  {
    id: "scm-logistics",
    name: "LOGISTICS",
    role: "Multimodal Fleet & Route Routing",
    layer: "Operational Execution Plane",
    tags: ["FREIGHT", "FLEET", "ETA"],
    description: "In-transit telematics, ETA milestone tracking, dynamic carrier rerouting, and cold-chain compliance.",
    coordination: "Continuous Milestone Tracking",
    icon: Truck,
    accentColor: "#38BDF8",
    upstream: "Warehouse Fulfillment Dispatch",
    downstream: "Customer Delivery Endpoints",
    side: "left",
  },
  // Right Column
  {
    id: "scm-procurement",
    name: "PROCUREMENT",
    role: "Automated Requisition & PO Lifecycle",
    layer: "Operational Execution Plane",
    tags: ["PURCHASE ORDERS", "CONTRACTS", "BIDS"],
    description: "Automated contract intelligence, spend optimization, and purchase order reconciliation.",
    coordination: "Automated PO Ingestion & Gating",
    icon: FileText,
    accentColor: "#38BDF8",
    upstream: "Supply Demand Signals",
    downstream: "Decision Engine Policy Checks",
    side: "right",
  },
  {
    id: "scm-warehouse",
    name: "WAREHOUSE",
    role: "Automated Storage & Cross-Docking",
    layer: "Operational Execution Plane",
    tags: ["CROSS-DOCK", "PICK-PACK", "AUTOMATION"],
    description: "WMS synchronization, robotic picking throughput, pallet allocation, and staging optimization.",
    coordination: "WMS Orchestration",
    icon: Warehouse,
    accentColor: "#38BDF8",
    upstream: "Inventory State & Logistics Feeds",
    downstream: "Logistics Dispatch & Risk Engine",
    side: "right",
  },
  {
    id: "scm-customer",
    name: "CUSTOMER",
    role: "Demand Signals & SLA Governance",
    layer: "Operational Execution Plane",
    tags: ["FULFILLMENT", "SLAS", "ORDERS"],
    description: "End-customer demand signals, delivery proof verification, and SLA performance tracking.",
    coordination: "Demand Stream Harmonization",
    icon: Users,
    accentColor: "#38BDF8",
    upstream: "Logistics In-Transit Feeds",
    downstream: "Demand Forecasting & AI Engine",
    side: "right",
  },
];

interface AdminPlatformControlTwinProps {
  variant?: "desktop" | "mobile";
  className?: string;
  focusedField?: "username" | "password" | null;
  isAuthenticatingSuccess?: boolean;
}

export const AdminPlatformControlTwin: React.FC<AdminPlatformControlTwinProps> = ({
  variant = "desktop",
  className = "",
  focusedField = null,
  isAuthenticatingSuccess = false,
}) => {
  const [inspectedNode, setInspectedNode] = useState<AdminNodeInfo | null>(null);
  const { branding } = useBranding();
  const appName = branding.appName || "ORION SCM OS";
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia) {
      const hoverQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
      setIsTouchDevice(hoverQuery.matches);
      const hoverHandler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
      hoverQuery.addEventListener("change", hoverHandler);
      return () => hoverQuery.removeEventListener("change", hoverHandler);
    }
  }, []);

  const handleNodeMouseEnter = (node: AdminNodeInfo) => {
    if (isTouchDevice) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setInspectedNode(node);
  };

  const handleNodeMouseLeave = () => {
    if (isTouchDevice) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setInspectedNode(null);
      closeTimerRef.current = null;
    }, 200);
  };

  const handleNodeTouchOrClick = (
    e: React.MouseEvent | React.TouchEvent,
    node: AdminNodeInfo
  ) => {
    e.stopPropagation();
    if (inspectedNode?.id === node.id) {
      setInspectedNode(null);
    } else {
      setInspectedNode(node);
    }
  };

  // Center coordinate of engine orbit in SVG coordinate system (viewBox 0 0 1000 680)
  const CX = 500;
  const CY = 300;
  const RADIUS = 188;

  // Helper to calculate engine positions
  const getEngineCoords = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: CX + RADIUS * Math.cos(rad),
      y: CY + RADIUS * Math.sin(rad),
    };
  };

  return (
    <div
      ref={containerRef}
      className={`h-full w-full relative flex flex-col justify-between select-none overflow-hidden bg-[#020712] text-os-text-primary ${className}`}
      onClick={() => setInspectedNode(null)}
    >
      {/* 1. TOP BRANDING & STATUS HEADER */}
      <div className="relative z-20 flex items-start justify-between px-6 pb-2" style={{ paddingTop: 'clamp(24px, 4vh, 56px)' }}>
        {/* Left Brand Identity */}
        <div className="flex flex-col items-start text-left">
          {/* Brand Logo replacing manual image handling */}
          <div className="mb-2">
             <BrandLogo sizePreset="xl" variant="full-descriptor" className="items-start flex-col gap-2" />
          </div>

          <div className="text-xs lg:text-sm font-bold tracking-[0.16em] text-[#00F2FE] uppercase mt-1.5 drop-shadow-[0_0_12px_rgba(0,242,254,0.5)]">
            PLATFORM CONTROL PLANE
          </div>
          <div className="text-[9px] lg:text-[10px] font-mono text-os-text-muted tracking-[0.18em] uppercase mt-1 flex items-center gap-1.5 font-medium">
            <span>DATA</span>
            <span className="text-cyan-500">·</span>
            <span>INTELLIGENCE</span>
            <span className="text-cyan-500">·</span>
            <span>DECISION</span>
            <span className="text-cyan-500">·</span>
            <span>EXECUTION</span>
            <span className="text-cyan-500">·</span>
            <span>GOVERNANCE</span>
          </div>
        </div>

        {/* Right Status Indicator matching screenshot */}
        <div className="flex flex-col items-end text-right pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 tracking-wider uppercase drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10B981]" />
            <span>SYSTEM OPERATIONAL</span>
          </div>
          <div className="text-[9.5px] font-mono text-os-text-muted tracking-[0.18em] uppercase mt-1 font-medium">
            SECURE <span className="text-slate-600">·</span> STABLE <span className="text-slate-600">·</span> ONLINE
          </div>
        </div>
      </div>

      {/* 2. MAIN GRAPHICAL CANVAS (ORION CORE, 6 ENGINES, FLANKING SCM CARDS, DATA PACKETS, TOPOGRAPHY) */}
      <div className="relative flex-1 w-full h-full min-h-[460px] lg:min-h-[520px] xl:min-h-[560px] flex items-center justify-center">
        {/* Ambient Glows */}
        <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[#00F2FE]/[0.06] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-blue-600/[0.08] rounded-full blur-[90px] pointer-events-none" />

        {/* ========================================================================= */}
        {/* SVG LAYER: CONNECTORS, RINGS, MOVING PACKETS, WIREFRAME TOPOGRAPHY       */}
        {/* ========================================================================= */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 680"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="p-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="core-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="orion-core-sphere" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#0B2F52" />
              <stop offset="45%" stopColor="#051930" />
              <stop offset="85%" stopColor="#020914" />
              <stop offset="100%" stopColor="#00040A" />
            </radialGradient>
            <radialGradient id="orion-core-halo" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#00F2FE" stopOpacity="0" />
              <stop offset="92%" stopColor="#00F2FE" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00F2FE" stopOpacity="0.8" />
            </radialGradient>
            <linearGradient id="terrain-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#0284C7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#020712" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="amber-trace" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#00F2FE" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* ========================================================================= */}
          {/* 3D WIREFRAME MOUNTAIN / CONTOUR TOPOGRAPHY MESH (BOTTOM 30%)             */}
          {/* ========================================================================= */}
          <g opacity="0.85">
            {/* Topography Contour Wave 1 */}
            <path
              d="M -50 630 Q 150 540 320 590 T 640 560 T 920 600 T 1050 580"
              stroke="#00F2FE"
              strokeWidth="1.2"
              strokeOpacity="0.45"
              fill="none"
            />
            {/* Topography Contour Wave 2 */}
            <path
              d="M -50 645 Q 120 565 280 610 T 580 575 T 840 615 T 1050 595"
              stroke="#0284C7"
              strokeWidth="1"
              strokeOpacity="0.35"
              fill="none"
            />
            {/* Topography Contour Wave 3 */}
            <path
              d="M -50 660 Q 180 580 380 625 T 720 590 T 980 630 T 1050 610"
              stroke="#38BDF8"
              strokeWidth="0.9"
              strokeOpacity="0.3"
              fill="none"
            />
            {/* Topography Contour Wave 4 */}
            <path
              d="M -50 675 Q 220 605 440 640 T 780 610 T 1050 635"
              stroke="#00F2FE"
              strokeWidth="0.8"
              strokeOpacity="0.25"
              fill="none"
            />

            {/* Crosshatch Perspective Grid Lines for 3D Mesh look */}
            {Array.from({ length: 22 }).map((_, i) => {
              const xStart = 20 + i * 46;
              const xTop = 50 + i * 42;
              return (
                <line
                  key={`mesh-grid-${i}`}
                  x1={xStart}
                  y1="675"
                  x2={xTop}
                  y2={570 + Math.sin(i * 0.7) * 20}
                  stroke="#00F2FE"
                  strokeWidth="0.6"
                  strokeOpacity="0.2"
                />
              );
            })}

            {/* Glowing Embers / Particles across terrain */}
            <circle cx="95" cy="580" r="2.2" fill="#00F2FE" filter="url(#p-glow)" opacity="0.9" />
            <circle cx="180" cy="565" r="1.8" fill="#F59E0B" filter="url(#p-glow)" opacity="0.8" />
            <circle cx="270" cy="610" r="2.5" fill="#00F2FE" filter="url(#p-glow)" opacity="0.95" />
            <circle cx="390" cy="570" r="1.8" fill="#38BDF8" opacity="0.7" />
            <circle cx="480" cy="605" r="3.2" fill="#F59E0B" filter="url(#p-glow)" opacity="0.95" />
            <circle cx="620" cy="565" r="2.5" fill="#00F2FE" filter="url(#p-glow)" opacity="0.85" />
            <circle cx="750" cy="600" r="2" fill="#38BDF8" opacity="0.8" />
            <circle cx="860" cy="575" r="2.8" fill="#F59E0B" filter="url(#p-glow)" opacity="0.9" />
            <circle cx="940" cy="615" r="2" fill="#00F2FE" opacity="0.75" />
          </g>

          {/* ========================================================================= */}
          {/* ORBITAL ENGINE RINGS & SPOKES AROUND ORION CORE                           */}
          {/* ========================================================================= */}
          {/* Outer Orbital Ring connecting all 6 engines */}
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            stroke="#00F2FE"
            strokeWidth="1.6"
            strokeDasharray="6 4"
            strokeOpacity="0.5"
            fill="none"
          />
          {/* Concentric Decorative Rings */}
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS + 18}
            stroke="#0284C7"
            strokeWidth="0.8"
            strokeDasharray="2 6"
            strokeOpacity="0.3"
            fill="none"
          />
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS - 24}
            stroke="#38BDF8"
            strokeWidth="0.8"
            strokeDasharray="4 8"
            strokeOpacity="0.25"
            fill="none"
          />

          {/* Radial Spokes connecting each of the 6 engines to the core */}
          {PLATFORM_ENGINES.map((engine) => {
            const { x, y } = getEngineCoords(engine.angleDeg!);
            return (
              <line
                key={`spoke-${engine.id}`}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke="#00F2FE"
                strokeWidth="1.4"
                strokeOpacity="0.45"
                strokeDasharray={engine.id === "risk-engine" ? "3 3" : undefined}
              />
            );
          })}

          {/* Moving Packets along the Engine Orbit Ring */}
          <circle r="3" fill="#00F2FE" filter="url(#p-glow)">
            <animateMotion
              dur="9s"
              repeatCount="indefinite"
              path={`M ${CX + RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 1 1 ${CX + RADIUS - 0.1} ${CY} Z`}
            />
          </circle>
          <circle r="2.5" fill="#F59E0B" filter="url(#p-glow)">
            <animateMotion
              dur="12s"
              repeatCount="indefinite"
              path={`M ${CX} ${CY - RADIUS} A ${RADIUS} ${RADIUS} 0 1 0 ${CX + 0.1} ${CY - RADIUS} Z`}
            />
          </circle>

          {/* Moving Radial Packets between Core and Engines */}
          {/* Data Engine -> Core */}
          <circle r="2.8" fill="#00F2FE" filter="url(#p-glow)">
            <animateMotion dur="2.4s" repeatCount="indefinite" path={`M 500 112 L 500 240`} />
          </circle>
          {/* Core -> Decision Engine */}
          <circle r="2.8" fill="#38BDF8" filter="url(#p-glow)">
            <animateMotion dur="2.6s" repeatCount="indefinite" begin="-0.7s" path={`M 545 275 L 663 206`} />
          </circle>
          {/* Risk Engine -> Core */}
          <circle r="2.8" fill="#F59E0B" filter="url(#p-glow)">
            <animateMotion dur="2.8s" repeatCount="indefinite" begin="-1.2s" path={`M 663 394 L 545 325`} />
          </circle>
          {/* Core -> Workflow Engine */}
          <circle r="2.8" fill="#00F2FE" filter="url(#p-glow)">
            <animateMotion dur="2.5s" repeatCount="indefinite" begin="-0.4s" path={`M 455 325 L 337 394`} />
          </circle>
          {/* AI Engine -> Core */}
          <circle r="2.8" fill="#00F2FE" filter="url(#p-glow)">
            <animateMotion dur="2.5s" repeatCount="indefinite" begin="-1.5s" path={`M 337 206 L 455 275`} />
          </circle>
          {/* Core -> Audit Engine */}
          <circle r="2.6" fill="#00F2FE" filter="url(#p-glow)">
            <animateMotion dur="2.6s" repeatCount="indefinite" begin="-1.8s" path={`M 500 360 L 500 488`} />
          </circle>

          {/* ========================================================================= */}
          {/* FIBER-OPTIC CIRCUIT TRACES: FLANKING SCM NODES TO CENTRAL ENGINES         */}
          {/* ========================================================================= */}
          {/* LEFT SIDE: SUPPLY, INVENTORY, LOGISTICS -> AI & WORKFLOW ENGINES */}
          {/* 1. SUPPLY (90, 195) -> AI ENGINE (337, 206) */}
          <path
            id="path-supply"
            d="M 90 195 C 170 195, 230 190, 310 206"
            stroke="#00F2FE"
            strokeWidth="1.4"
            strokeOpacity="0.55"
            fill="none"
          />
          {/* 2. INVENTORY (90, 325) -> AI ENGINE & WORKFLOW */}
          <path
            id="path-inv-ai"
            d="M 90 325 C 160 325, 200 230, 310 215"
            stroke="#00F2FE"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            fill="none"
          />
          <path
            id="path-inv-wf"
            d="M 90 325 C 170 325, 220 375, 310 395"
            stroke="#00F2FE"
            strokeWidth="1.4"
            strokeOpacity="0.5"
            fill="none"
          />
          {/* 3. LOGISTICS (90, 455) -> WORKFLOW ENGINE (337, 394) */}
          <path
            id="path-logistics"
            d="M 90 455 C 170 455, 230 425, 310 400"
            stroke="#00F2FE"
            strokeWidth="1.4"
            strokeOpacity="0.55"
            fill="none"
          />

          {/* RIGHT SIDE: PROCUREMENT, WAREHOUSE, CUSTOMER -> DECISION & RISK ENGINES */}
          {/* 4. PROCUREMENT (910, 195) -> DECISION ENGINE (663, 206) */}
          <path
            id="path-procurement"
            d="M 910 195 C 830 195, 770 190, 690 206"
            stroke="#00F2FE"
            strokeWidth="1.4"
            strokeOpacity="0.55"
            fill="none"
          />
          {/* 5. WAREHOUSE (910, 325) -> DECISION & RISK */}
          <path
            id="path-wh-dec"
            d="M 910 325 C 840 325, 800 230, 690 215"
            stroke="#00F2FE"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            fill="none"
          />
          <path
            id="path-wh-risk"
            d="M 910 325 C 830 325, 780 375, 690 395"
            stroke="#F59E0B"
            strokeWidth="1.3"
            strokeOpacity="0.55"
            fill="none"
          />
          {/* 6. CUSTOMER (910, 455) -> RISK ENGINE (663, 394) */}
          <path
            id="path-customer"
            d="M 910 455 C 830 455, 770 425, 690 400"
            stroke="#38BDF8"
            strokeWidth="1.4"
            strokeOpacity="0.55"
            fill="none"
          />

          {/* Data Packets along the SCM Traces */}
          <circle r="2.8" fill="#00F2FE" filter="url(#p-glow)">
            <animateMotion dur="3.2s" repeatCount="indefinite" path="M 90 195 C 170 195, 230 190, 310 206" />
          </circle>
          <circle r="2.5" fill="#F59E0B" filter="url(#p-glow)">
            <animateMotion dur="3.6s" repeatCount="indefinite" begin="-1.2s" path="M 90 325 C 160 325, 200 230, 310 215" />
          </circle>
          <circle r="2.8" fill="#00F2FE" filter="url(#p-glow)">
            <animateMotion dur="3.1s" repeatCount="indefinite" begin="-0.6s" path="M 90 325 C 170 325, 220 375, 310 395" />
          </circle>
          <circle r="2.8" fill="#38BDF8" filter="url(#p-glow)">
            <animateMotion dur="3.4s" repeatCount="indefinite" begin="-1.8s" path="M 90 455 C 170 455, 230 425, 310 400" />
          </circle>

          <circle r="2.8" fill="#00F2FE" filter="url(#p-glow)">
            <animateMotion dur="3.2s" repeatCount="indefinite" path="M 910 195 C 830 195, 770 190, 690 206" />
          </circle>
          <circle r="2.5" fill="#00F2FE" filter="url(#p-glow)">
            <animateMotion dur="3.5s" repeatCount="indefinite" begin="-1s" path="M 910 325 C 840 325, 800 230, 690 215" />
          </circle>
          <circle r="2.8" fill="#F59E0B" filter="url(#p-glow)">
            <animateMotion dur="3.3s" repeatCount="indefinite" begin="-0.8s" path="M 910 325 C 830 325, 780 375, 690 395" />
          </circle>
          <circle r="2.8" fill="#38BDF8" filter="url(#p-glow)">
            <animateMotion dur="3.5s" repeatCount="indefinite" begin="-1.5s" path="M 910 455 C 830 455, 770 425, 690 400" />
          </circle>
        </svg>

        {/* ========================================================================= */}
        {/* CENTERPIECE: LARGE CENTERED ORION-9 LOGO & TAGLINE                        */}
        {/* ========================================================================= */}
        <div
          style={{ left: "50%", top: "42%" }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center text-center select-none"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              setInspectedNode({
                id: "orion-core",
                name: "ORION CORE",
                role: "Central Operating System Kernel",
                layer: "Core Kernel Plane",
                tags: ["ORCHESTRATE", "SYNCHRONIZE", "DISPATCH"],
                description:
                  "Supervises all subordinate engines, synchronizing state across continuous telemetry, AI inference, and deterministic workflow dispatch.",
                coordination: "Distributed State Synchronization",
                icon: Zap,
                accentColor: "#00F2FE",
                upstream: "Data Engine, Risk Engine, AI Engine",
                downstream: "Decision Engine, Workflow Engine, Audit Engine",
              });
            }}
            className={`cursor-pointer group flex flex-col items-center transition-transform duration-300 ${
              focusedField === "username"
                ? "scale-105"
                : focusedField === "password"
                ? "scale-105"
                : "hover:scale-105"
            }`}
          >
            {/* Large centered ORION-9 logo with zero border around logo, no rectangular card */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center bg-[radial-gradient(circle_at_35%_30%,#0e3e68_0%,#071f3a_45%,#030e1d_85%,#01060f_100%)] border-2 border-[#00F2FE]/90 shadow-[0_0_60px_rgba(0,242,254,0.55)] relative overflow-hidden">
              <svg className="absolute inset-0 w-full h-full opacity-65 animate-[spin_60s_linear_infinite]" viewBox="0 0 160 160">
                <ellipse cx="80" cy="80" rx="72" ry="32" stroke="#00F2FE" strokeWidth="0.8" fill="none" strokeDasharray="3 3" />
                <ellipse cx="80" cy="80" rx="72" ry="52" stroke="#00F2FE" strokeWidth="0.6" fill="none" strokeDasharray="2 4" />
                <ellipse cx="80" cy="80" rx="36" ry="72" stroke="#00F2FE" strokeWidth="0.8" fill="none" strokeDasharray="3 3" />
                <line x1="8" y1="80" x2="152" y2="80" stroke="#00F2FE" strokeWidth="0.9" />
                <line x1="80" y1="8" x2="80" y2="152" stroke="#00F2FE" strokeWidth="0.9" />
              </svg>
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.3)_0%,rgba(0,242,254,0.15)_30%,transparent_65%)] pointer-events-none" />
              <div className="relative z-10 text-xl sm:text-2xl font-black font-sans tracking-[0.22em] text-white uppercase drop-shadow-[0_0_16px_rgba(0,242,254,0.95)]">
                ORION-9
              </div>
            </div>
          </div>

          {/* Tagline placed below with deliberate 28px visual gap */}
          <div className="mt-7 font-mono text-[10px] sm:text-[11px] tracking-[0.28em] text-cyan-300 uppercase whitespace-nowrap drop-shadow-[0_0_12px_rgba(0,242,254,0.5)] font-semibold">
            CONNECTED INTELLIGENCE FOR A MORE RESILIENT TOMORROW
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THE 6 PLATFORM ENGINE NODES (HEXAGONAL ORBIT MATCHING SCREENSHOT)         */}
        {/* ========================================================================= */}
        {PLATFORM_ENGINES.map((engine) => {
          const { x, y } = getEngineCoords(engine.angleDeg!);
          // Convert viewBox coordinate (1000 x 680) to percentage of container
          const leftPct = (x / 1000) * 100;
          const topPct = (y / 680) * 100;
          const IconComp = engine.icon;
          const isInspected = inspectedNode?.id === engine.id;

          return (
            <div
              key={engine.id}
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <button
                type="button"
                onMouseEnter={() => handleNodeMouseEnter(engine)}
                onMouseLeave={handleNodeMouseLeave}
                onClick={(e) => handleNodeTouchOrClick(e, engine)}
                className={`group flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 cursor-pointer focus:outline-none ${
                  isInspected
                    ? "scale-110 drop-shadow-[0_0_24px_rgba(0,242,254,0.7)]"
                    : "hover:scale-105"
                }`}
                aria-label={`Inspect ${engine.name}`}
              >
                {/* Glowing Circular Icon Pod matching the screenshot */}
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 mb-1.5 shadow-lg ${
                    engine.id === "risk-engine"
                      ? "bg-os-surface/95 border-amber-400 text-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.55)] group-hover:border-amber-300"
                      : engine.id === "decision-engine"
                      ? "bg-os-surface/95 border-sky-400 text-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.55)] group-hover:border-sky-300"
                      : "bg-os-surface/95 border-[#00F2FE] text-[#00F2FE] shadow-[0_0_18px_rgba(0,242,254,0.55)] group-hover:border-cyan-300"
                  }`}
                >
                  <IconComp className="w-5 h-5 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                </div>

                {/* Engine Card Box matching screenshot */}
                <div
                  className={`px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-200 text-center ${
                    engine.id === "risk-engine"
                      ? "bg-os-surface/95 border-amber-500/40 group-hover:border-amber-400"
                      : "bg-os-surface/95 border-cyan-500/40 group-hover:border-cyan-400"
                  }`}
                >
                  <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-white uppercase whitespace-nowrap leading-none font-sans">
                    {engine.name}
                  </div>
                  {/* Capabilities Pill: UNIFY · PROCESS · MODEL */}
                  <div
                    className={`text-[7px] sm:text-[7.5px] font-mono tracking-widest uppercase mt-1 font-semibold ${
                      engine.id === "risk-engine" ? "text-amber-400/90" : "text-cyan-400/90"
                    }`}
                  >
                    {engine.tags.join(" · ")}
                  </div>
                </div>
              </button>
            </div>
          );
        })}

        {/* ========================================================================= */}
        {/* FLANKING SCM DOMAIN CARDS (LEFT & RIGHT COLUMNS)                          */}
        {/* ========================================================================= */}
        {/* LEFT COLUMN: SUPPLY, INVENTORY, LOGISTICS */}
        {SCM_DOMAIN_NODES.filter((n) => n.side === "left").map((node, idx) => {
          const IconComp = node.icon;
          const isInspected = inspectedNode?.id === node.id;
          const topPercentages = ["28.7%", "47.8%", "66.9%"];
          return (
            <div
              key={node.id}
              style={{ left: "9%", top: topPercentages[idx] }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <button
                type="button"
                onMouseEnter={() => handleNodeMouseEnter(node)}
                onMouseLeave={handleNodeMouseLeave}
                onClick={(e) => handleNodeTouchOrClick(e, node)}
                className={`w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-2xl flex flex-col items-center justify-center p-2 transition-all duration-300 cursor-pointer focus:outline-none border ${
                  isInspected
                    ? "bg-[#09152B] border-[#00F2FE] shadow-[0_0_24px_rgba(0,242,254,0.6)] scale-105"
                    : "bg-os-surface/95 border-slate-700/60 hover:border-cyan-400/70 hover:shadow-[0_0_18px_rgba(0,242,254,0.3)] hover:scale-105"
                }`}
                aria-label={`Inspect ${node.name}`}
              >
                <IconComp className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 mb-1.5 transition-transform group-hover:scale-110" />
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-os-text-primary uppercase font-sans">
                  {node.name}
                </span>
              </button>
            </div>
          );
        })}

        {/* RIGHT COLUMN: PROCUREMENT, WAREHOUSE, CUSTOMER */}
        {SCM_DOMAIN_NODES.filter((n) => n.side === "right").map((node, idx) => {
          const IconComp = node.icon;
          const isInspected = inspectedNode?.id === node.id;
          const topPercentages = ["28.7%", "47.8%", "66.9%"];
          return (
            <div
              key={node.id}
              style={{ left: "91%", top: topPercentages[idx] }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <button
                type="button"
                onMouseEnter={() => handleNodeMouseEnter(node)}
                onMouseLeave={handleNodeMouseLeave}
                onClick={(e) => handleNodeTouchOrClick(e, node)}
                className={`w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-2xl flex flex-col items-center justify-center p-2 transition-all duration-300 cursor-pointer focus:outline-none border ${
                  isInspected
                    ? "bg-[#09152B] border-[#00F2FE] shadow-[0_0_24px_rgba(0,242,254,0.6)] scale-105"
                    : "bg-os-surface/95 border-slate-700/60 hover:border-cyan-400/70 hover:shadow-[0_0_18px_rgba(0,242,254,0.3)] hover:scale-105"
                }`}
                aria-label={`Inspect ${node.name}`}
              >
                <IconComp className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 mb-1.5 transition-transform group-hover:scale-110" />
                <span className="text-[7.5px] sm:text-[8.5px] font-bold tracking-wider text-os-text-primary uppercase font-sans">
                  {node.name}
                </span>
              </button>
            </div>
          );
        })}

        {/* ========================================================================= */}
        {/* HOVER / CLICK INSPECTOR POPOVER (ZERO-SHIFT OVERLAY)                      */}
        {/* ========================================================================= */}
        {inspectedNode && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute z-30 bottom-14 left-1/2 -translate-x-1/2 w-[90%] max-w-[440px] bg-os-surface/95 border border-[#00F2FE]/60 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.9),0_0_24px_rgba(0,242,254,0.25)] backdrop-blur-xl text-left animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-os-border pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: inspectedNode.accentColor }}
                />
                <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                  {inspectedNode.name}
                </span>
                <span className="text-[9px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 uppercase">
                  {inspectedNode.layer}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectedNode(null)}
                className="text-[10px] font-mono text-os-text-muted hover:text-white px-2 py-0.5 rounded bg-white/5 uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="text-[10px] font-mono text-cyan-300 font-semibold mb-1">
              {inspectedNode.role}
            </div>
            <p className="text-[11px] text-os-text-secondary leading-relaxed font-sans mb-3">
              {inspectedNode.description}
            </p>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono border-t border-white/5 pt-2">
              <div>
                <span className="text-slate-500 uppercase block">Upstream Inflow:</span>
                <span className="text-os-text-secondary">{inspectedNode.upstream || "Autonomous Telemetry"}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block">Downstream Target:</span>
                <span className="text-os-text-secondary">{inspectedNode.downstream || "Execution Mesh"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM TELEMETRY STATUS BAR MATCHING SCREENSHOT EXACTLY */}
      <div className="relative z-20 w-full px-6 pb-4 pt-1 flex items-center justify-between gap-4 border-t border-cyan-900/20 bg-[#020712]/80 backdrop-blur-sm">
        {/* Left: Global Operations Brackets */}
        <div className="text-left font-mono shrink-0">
          <div className="text-[9px] lg:text-[10px] text-cyan-400 font-bold tracking-widest flex items-center gap-1 uppercase">
            <span>┌</span>
            <span>GLOBAL OPERATIONS</span>
            <span>┐</span>
          </div>
          <div className="text-[8px] lg:text-[8.5px] text-os-text-muted tracking-wider uppercase pl-2 mt-0.5">
            REAL-TIME INTELLIGENCE
          </div>
          <div className="text-[8px] lg:text-[8.5px] text-os-text-muted tracking-wider uppercase pl-2">
            AI-DRIVEN DECISIONS
          </div>
        </div>

        {/* Center: 4 Telemetry Widget Cards */}
        <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
          {/* Card 1: DATA FLOW */}
          <div className="h-13 w-28 sm:w-32 bg-os-surface/95 border border-slate-700/50 rounded-xl px-2.5 py-1.5 flex flex-col justify-between shrink-0 shadow-md">
            <span className="text-[8px] font-mono tracking-widest text-os-text-muted uppercase font-semibold">
              DATA FLOW
            </span>
            <div className="flex items-center justify-between h-4 gap-0.5">
              {[6, 12, 8, 14, 10, 16, 9, 13, 7, 15, 11, 8].map((h, idx) => (
                <span
                  key={`df-${idx}`}
                  style={{ height: `${h}px` }}
                  className="w-1 bg-[#00F2FE] rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Card 2: ENGINE HEALTH */}
          <div className="h-13 w-28 sm:w-32 bg-os-surface/95 border border-slate-700/50 rounded-xl px-2.5 py-1.5 flex flex-col justify-between shrink-0 shadow-md">
            <span className="text-[8px] font-mono tracking-widest text-os-text-muted uppercase font-semibold">
              ENGINE HEALTH
            </span>
            <div className="flex items-end justify-between h-4 gap-0.5">
              {[8, 14, 11, 15, 9, 16, 12, 14, 10, 15, 13, 9].map((h, idx) => (
                <span
                  key={`eh-${idx}`}
                  style={{ height: `${h}px` }}
                  className="w-1 bg-emerald-400 rounded-sm"
                />
              ))}
            </div>
          </div>

          {/* Card 3: RISK MONITORING */}
          <div className="h-13 w-28 sm:w-32 bg-os-surface/95 border border-amber-500/30 rounded-xl px-2.5 py-1.5 flex flex-col justify-between shrink-0 shadow-md">
            <span className="text-[8px] font-mono tracking-widest text-amber-400/90 uppercase font-semibold">
              RISK MONITORING
            </span>
            {/* ECG Pulse Wave in Amber */}
            <svg className="w-full h-4 overflow-visible" viewBox="0 0 100 20">
              <path
                d="M 0 10 L 25 10 L 35 2 L 45 18 L 55 10 L 100 10"
                stroke="#F59E0B"
                strokeWidth="1.8"
                fill="none"
              />
            </svg>
          </div>

          {/* Card 4: SYSTEM SYNC */}
          <div className="h-13 w-28 sm:w-32 bg-os-surface/95 border border-slate-700/50 rounded-xl px-2.5 py-1.5 flex flex-col justify-between shrink-0 shadow-md">
            <span className="text-[8px] font-mono tracking-widest text-os-text-muted uppercase font-semibold">
              SYSTEM SYNC
            </span>
            {/* Sine Wave in Cyan */}
            <svg className="w-full h-4 overflow-visible" viewBox="0 0 100 20">
              <path
                d="M 0 10 Q 25 0 50 10 T 100 10"
                stroke="#00F2FE"
                strokeWidth="1.8"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Right: Versioning Footer */}
        <div className="text-right font-mono shrink-0">
          <div className="text-[9px] lg:text-[10px] text-white font-bold tracking-widest uppercase">
            {appName}
          </div>
          <div className="text-[8px] lg:text-[8.5px] text-os-text-muted tracking-wider uppercase mt-0.5">
            CONTROL PLANE
          </div>
          <div className="text-[8px] lg:text-[8.5px] text-cyan-400 tracking-wider font-semibold">
            v9.4
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import {
  Factory,
  Target,
  Zap,
  Package,
  PackageSearch,
  Truck,
  CheckCircle2,
  X,
  Activity,
  Cpu,
  Radio,
  Sliders,
  Layers,
} from "lucide-react";

export interface ScmNode {
  id: string;
  name: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  coords: { x: number; y: number };
  mobileCoords: { x: number; y: number };
  telemetry: {
    status: string;
    throughput: string;
    latency: string;
    efficiency: string;
    aiOptimization: string;
    activeTransactions: string;
  };
}

const SCM_NODES: ScmNode[] = [
  {
    id: "supplier",
    name: "Supplier Network",
    label: "SUPPLIER NETWORK",
    category: "Tier-1 / Tier-2 Raw Materials & Inbound Feed",
    icon: Factory,
    coords: { x: 180, y: 180 },
    mobileCoords: { x: 80, y: 70 },
    telemetry: {
      status: "Operational · 14 Active Facilities Connected",
      throughput: "1,240 MT Inbound Scheduled",
      latency: "18ms",
      efficiency: "98.4%",
      aiOptimization: "Lead-time variance buffer engaged",
      activeTransactions: "38 PO transmissions in flight",
    },
  },
  {
    id: "procurement",
    name: "Procurement Hub",
    label: "PROCUREMENT",
    category: "Dynamic PO & Contract Execution Core",
    icon: Target,
    coords: { x: 500, y: 165 },
    mobileCoords: { x: 250, y: 55 },
    telemetry: {
      status: "Active Automated Sourcing Engine",
      throughput: "312 POs generated today",
      latency: "12ms",
      efficiency: "99.1%",
      aiOptimization: "Price spike hedging applied",
      activeTransactions: "142 vendor SLA validations pending",
    },
  },
  {
    id: "orion-ai",
    name: "Orion AI Engine",
    label: "ORION AI ENGINE",
    category: "Predictive Digital Twin Neural Orchestrator",
    icon: Zap,
    coords: { x: 550, y: 295 },
    mobileCoords: { x: 260, y: 145 },
    telemetry: {
      status: "Neural Inference Engine · Model v9.4",
      throughput: "8.4M signals evaluated / sec",
      latency: "4.2ms",
      efficiency: "99.8%",
      aiOptimization: "Autonomous global rebalancing",
      activeTransactions: "12,400 active predictions",
    },
  },
  {
    id: "fulfillment",
    name: "Fulfillment Center",
    label: "FULFILLMENT CENTER",
    category: "Automated Sorting & Pack Consolidation",
    icon: Package,
    coords: { x: 840, y: 240 },
    mobileCoords: { x: 420, y: 110 },
    telemetry: {
      status: "Robotic Sortation Active · Capacity at 84%",
      throughput: "8,920 packages / hr",
      latency: "16ms",
      efficiency: "96.8%",
      aiOptimization: "Batch pick path minimization",
      activeTransactions: "87 picking zones active",
    },
  },
  {
    id: "inventory",
    name: "Inventory Core",
    label: "INVENTORY CORE",
    category: "Multi-Echelon Buffer Management",
    icon: PackageSearch,
    coords: { x: 300, y: 380 },
    mobileCoords: { x: 130, y: 215 },
    telemetry: {
      status: "Optimal Stock Health · Stockout Risk 0.02%",
      throughput: "450,000 tracked SKUs",
      latency: "9ms",
      efficiency: "97.5%",
      aiOptimization: "Dynamic Safety Stock adjusted",
      activeTransactions: "12 warehouse nodes balanced",
    },
  },
  {
    id: "logistics",
    name: "Logistics Transit",
    label: "LOGISTICS",
    category: "Multimodal Fleet & Route Dispatch",
    icon: Truck,
    coords: { x: 620, y: 435 },
    mobileCoords: { x: 295, y: 240 },
    telemetry: {
      status: "In Transit · Real-time GPS & Telematics",
      throughput: "1,420 loads on route",
      latency: "22ms",
      efficiency: "95.7%",
      aiOptimization: "Weather & traffic dynamic reroute",
      activeTransactions: "94 dispatches active",
    },
  },
  {
    id: "customer",
    name: "Customer Demand",
    label: "CUSTOMER",
    category: "Downstream Consumption Sensing",
    icon: CheckCircle2,
    coords: { x: 920, y: 395 },
    mobileCoords: { x: 435, y: 220 },
    telemetry: {
      status: "Sensing Active · Demand Variance 1.1%",
      throughput: "24,800 orders fulfilled today",
      latency: "14ms",
      efficiency: "99.6%",
      aiOptimization: "Predictive forward-positioning",
      activeTransactions: "18,400 connected customer accounts",
    },
  },
];

// MATHEMATICAL SVG PATH STRINGS
const DESKTOP_PATHS = {
  supplier_to_procurement: "M 180 180 Q 320 145, 500 165",
  supplier_to_inventory: "M 180 180 Q 210 290, 300 380",
  supplier_to_ai: "M 180 180 Q 360 250, 550 295",
  procurement_to_fulfillment: "M 500 165 Q 670 170, 840 240",
  procurement_to_ai: "M 500 165 Q 520 230, 550 295",
  ai_to_inventory: "M 550 295 Q 420 330, 300 380",
  ai_to_fulfillment: "M 550 295 Q 690 260, 840 240",
  ai_to_logistics: "M 550 295 Q 580 370, 620 435",
  fulfillment_to_logistics: "M 840 240 Q 750 360, 620 435",
  fulfillment_to_customer: "M 840 240 Q 890 310, 920 395",
  inventory_to_logistics: "M 300 380 Q 460 410, 620 435",
  inventory_to_customer_sweep: "M 300 380 Q 600 500, 920 395",
  logistics_to_customer: "M 620 435 Q 770 420, 920 395",
};

const MOBILE_PATHS = {
  supplier_to_procurement: "M 80 70 Q 160 50, 250 55",
  supplier_to_inventory: "M 80 70 Q 95 140, 130 215",
  supplier_to_ai: "M 80 70 Q 170 120, 260 145",
  procurement_to_fulfillment: "M 250 55 Q 340 60, 420 110",
  procurement_to_ai: "M 250 55 Q 255 100, 260 145",
  ai_to_inventory: "M 260 145 Q 190 170, 130 215",
  ai_to_fulfillment: "M 260 145 Q 340 125, 420 110",
  ai_to_logistics: "M 260 145 Q 280 200, 295 240",
  fulfillment_to_logistics: "M 420 110 Q 370 190, 295 240",
  fulfillment_to_customer: "M 420 110 Q 430 170, 435 220",
  inventory_to_logistics: "M 130 215 Q 210 230, 295 240",
  logistics_to_customer: "M 295 240 Q 370 235, 435 220",
};

// LIGHTWEIGHT, HARDWARE-ACCELERATED SVG DATA PACKET
interface DataPacketProps {
  path: string;
  dur: string;
  begin?: string;
  size?: number;
  color?: string;
  withTrail?: boolean;
}

const DataPacket: React.FC<DataPacketProps> = ({
  path,
  dur,
  begin = "0s",
  size = 3.5,
  color = "#00F2FE",
  withTrail = true,
}) => {
  // Compute lag for trailing secondary packet
  const trailOffset = 0.16;
  const numBegin = parseFloat(begin) || 0;
  const trailBegin = `${(numBegin - trailOffset).toFixed(2)}s`;

  return (
    <g className="scm-packet-group pointer-events-none">
      {/* Subtle trailing packet */}
      {withTrail && (
        <circle r={size * 0.55} fill={color} opacity={0.35}>
          <animateMotion
            path={path}
            dur={dur}
            repeatCount="indefinite"
            begin={trailBegin}
          />
          <animate
            attributeName="opacity"
            values="0;0.45;0.45;0"
            keyTimes="0;0.08;0.92;1"
            dur={dur}
            repeatCount="indefinite"
            begin={trailBegin}
          />
        </circle>
      )}

      {/* Main luminous packet */}
      <circle
        r={size}
        fill={color}
        className="drop-shadow-[0_0_6px_#00F2FE]"
      >
        <animateMotion
          path={path}
          dur={dur}
          repeatCount="indefinite"
          begin={begin}
        />
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          keyTimes="0;0.08;0.92;1"
          dur={dur}
          repeatCount="indefinite"
          begin={begin}
        />
      </circle>
    </g>
  );
};

export interface ScmNetworkTwinProps {
  variant?: "desktop" | "mobile";
  className?: string;
  mode?: "user" | "admin";
}

// Map which connection paths connect to which node for subtle path highlighting
const NODE_CONNECTED_PATHS: Record<string, string[]> = {
  supplier: ["supplier_to_procurement", "supplier_to_inventory", "supplier_to_ai"],
  procurement: [
    "supplier_to_procurement",
    "procurement_to_fulfillment",
    "procurement_to_ai",
  ],
  "orion-ai": [
    "supplier_to_ai",
    "procurement_to_ai",
    "ai_to_inventory",
    "ai_to_fulfillment",
    "ai_to_logistics",
  ],
  inventory: [
    "supplier_to_inventory",
    "ai_to_inventory",
    "inventory_to_logistics",
    "inventory_to_customer_sweep",
  ],
  fulfillment: [
    "procurement_to_fulfillment",
    "ai_to_fulfillment",
    "fulfillment_to_logistics",
    "fulfillment_to_customer",
  ],
  logistics: [
    "ai_to_logistics",
    "fulfillment_to_logistics",
    "inventory_to_logistics",
    "logistics_to_customer",
  ],
  customer: [
    "fulfillment_to_customer",
    "inventory_to_customer_sweep",
    "logistics_to_customer",
  ],
};

export const ScmNetworkTwin: React.FC<ScmNetworkTwinProps> = ({
  variant = "desktop",
  className = "",
  mode = "user",
}) => {
  const [inspectedNode, setInspectedNode] = useState<ScmNode | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Close timer ref for smooth hover bridge tolerance
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Detect motion preference & touch capability
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia) {
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(motionQuery.matches);
      const motionHandler = (e: MediaQueryListEvent) =>
        setPrefersReducedMotion(e.matches);
      motionQuery.addEventListener("change", motionHandler);

      // Check if device is primarily touch with no hover capability
      const hoverQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
      setIsTouchDevice(hoverQuery.matches);
      const hoverHandler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
      hoverQuery.addEventListener("change", hoverHandler);

      return () => {
        motionQuery.removeEventListener("change", motionHandler);
        hoverQuery.removeEventListener("change", hoverHandler);
      };
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Close on outside tap for touch devices
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setInspectedNode(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Desktop Hover handlers with bridge tolerance
  const handleNodeMouseEnter = (node: ScmNode) => {
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
    // 160ms bridge window to allow moving cursor into the inspection card comfortably
    closeTimerRef.current = setTimeout(() => {
      setInspectedNode(null);
      closeTimerRef.current = null;
    }, 160);
  };

  const handlePopoverMouseEnter = () => {
    if (isTouchDevice) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    if (isTouchDevice) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setInspectedNode(null);
      closeTimerRef.current = null;
    }, 160);
  };

  // Keyboard accessibility
  const handleNodeFocus = (node: ScmNode) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setInspectedNode(node);
  };

  const handleNodeBlur = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setInspectedNode(null);
      closeTimerRef.current = null;
    }, 160);
  };

  // Touch device fallback: tap to inspect, tap again to close
  const handleNodeTouchOrClick = (
    e: React.MouseEvent | React.TouchEvent,
    node: ScmNode
  ) => {
    // If device supports hover, clicking should NOT close or cause unintended action
    if (!isTouchDevice) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    if (inspectedNode?.id === node.id) {
      setInspectedNode(null);
    } else {
      setInspectedNode(node);
    }
  };

  // Helper to check if a path is connected to currently inspected node
  const isPathHighlighted = (pathKey: string) => {
    if (!inspectedNode) return false;
    const paths = NODE_CONNECTED_PATHS[inspectedNode.id] || [];
    return paths.includes(pathKey);
  };

  // Smart popover positioning calculation (Desktop)
  const getPopoverPlacement = (node: ScmNode) => {
    const xPct = (node.coords.x / 1000) * 100;
    const yPct = (node.coords.y / 600) * 100;

    // If in the lower half (y >= 48%), place above the node
    const isAbove = yPct >= 48;

    // Horizontal offset logic to prevent overflowing canvas boundaries
    let translateX = "-50%";
    if (xPct < 28) {
      translateX = "-15%";
    } else if (xPct > 75) {
      translateX = "-85%";
    }

    return {
      left: `${xPct}%`,
      ...(isAbove
        ? { bottom: `calc(${100 - yPct}% + 42px)` }
        : { top: `calc(${yPct}% + 42px)` }),
      transform: `translateX(${translateX})`,
      isAbove,
    };
  };

  // MOBILE COMPACT VIEWPORT
  if (variant === "mobile") {
    return (
      <div
        ref={containerRef}
        className={`w-full flex flex-col items-center select-none ${className}`}
      >
        {/* Mobile Header Banner */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-os-border">
          <div className="flex items-center gap-1.5 text-[#00F2FE] font-mono text-[10px] uppercase tracking-widest font-semibold">
            <Zap className="w-3.5 h-3.5 text-[#00F2FE] fill-current" />
            <span>{mode === "admin" ? "ORION CONTROL PLANE" : "ORION INTELLIGENCE"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>TELEMETRY ACTIVE</span>
          </div>
        </div>

        {/* Compact Canvas with Responsive SVG */}
        <div className="w-full relative aspect-[16/10] rounded-xl bg-[#07090E] border border-os-border overflow-hidden shadow-inner">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 500 300"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Mobile Connection Paths */}
            <path
              d={MOBILE_PATHS.supplier_to_procurement}
              stroke={isPathHighlighted("supplier_to_procurement") ? "#00F2FE" : "#173449"}
              strokeWidth={isPathHighlighted("supplier_to_procurement") ? "2" : "1.5"}
              strokeOpacity={isPathHighlighted("supplier_to_procurement") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />
            <path
              d={MOBILE_PATHS.supplier_to_inventory}
              stroke={isPathHighlighted("supplier_to_inventory") ? "#00F2FE" : "#132433"}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity={isPathHighlighted("supplier_to_inventory") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />
            <path
              d={MOBILE_PATHS.supplier_to_ai}
              stroke={isPathHighlighted("supplier_to_ai") ? "#00F2FE" : "#132433"}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity={isPathHighlighted("supplier_to_ai") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />
            <path
              d={MOBILE_PATHS.procurement_to_fulfillment}
              stroke={isPathHighlighted("procurement_to_fulfillment") ? "#00F2FE" : "#173449"}
              strokeWidth={isPathHighlighted("procurement_to_fulfillment") ? "2" : "1.5"}
              strokeOpacity={isPathHighlighted("procurement_to_fulfillment") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />
            <path
              d={MOBILE_PATHS.procurement_to_ai}
              stroke={isPathHighlighted("procurement_to_ai") ? "#00F2FE" : "#173449"}
              strokeWidth={isPathHighlighted("procurement_to_ai") ? "2" : "1.5"}
              strokeOpacity={isPathHighlighted("procurement_to_ai") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />
            <path
              d={MOBILE_PATHS.ai_to_inventory}
              stroke={isPathHighlighted("ai_to_inventory") ? "#00F2FE" : "#173449"}
              strokeWidth={isPathHighlighted("ai_to_inventory") ? "2" : "1.5"}
              strokeOpacity={isPathHighlighted("ai_to_inventory") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />
            <path
              d={MOBILE_PATHS.ai_to_fulfillment}
              stroke={isPathHighlighted("ai_to_fulfillment") ? "#00F2FE" : "#132433"}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity={isPathHighlighted("ai_to_fulfillment") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />
            <path
              d={MOBILE_PATHS.ai_to_logistics}
              stroke={isPathHighlighted("ai_to_logistics") ? "#00F2FE" : "#132433"}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity={isPathHighlighted("ai_to_logistics") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />
            <path
              d={MOBILE_PATHS.fulfillment_to_logistics}
              stroke={isPathHighlighted("fulfillment_to_logistics") ? "#00F2FE" : "#173449"}
              strokeWidth={isPathHighlighted("fulfillment_to_logistics") ? "2" : "1.5"}
              strokeOpacity={isPathHighlighted("fulfillment_to_logistics") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />
            <path
              d={MOBILE_PATHS.fulfillment_to_customer}
              stroke={isPathHighlighted("fulfillment_to_customer") ? "#00F2FE" : "#132433"}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity={isPathHighlighted("fulfillment_to_customer") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />
            <path
              d={MOBILE_PATHS.inventory_to_logistics}
              stroke={isPathHighlighted("inventory_to_logistics") ? "#00F2FE" : "#132433"}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              strokeOpacity={isPathHighlighted("inventory_to_logistics") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />
            <path
              d={MOBILE_PATHS.logistics_to_customer}
              stroke={isPathHighlighted("logistics_to_customer") ? "#00F2FE" : "#173449"}
              strokeWidth={isPathHighlighted("logistics_to_customer") ? "2" : "1.5"}
              strokeOpacity={isPathHighlighted("logistics_to_customer") ? 0.9 : 0.6}
              fill="none"
              className="transition-all duration-200"
            />

            {/* ANIMATED PACKETS TRAVELING ALONG MOBILE PATHS */}
            {!prefersReducedMotion ? (
              <>
                <DataPacket path={MOBILE_PATHS.supplier_to_procurement} dur="5.0s" begin="-1.0s" size={2.8} />
                <DataPacket path={MOBILE_PATHS.procurement_to_ai} dur="4.2s" begin="-2.1s" size={2.8} />
                <DataPacket path={MOBILE_PATHS.ai_to_inventory} dur="4.6s" begin="-0.8s" size={2.8} />
                <DataPacket path={MOBILE_PATHS.ai_to_logistics} dur="4.4s" begin="-2.9s" size={2.8} />
                <DataPacket path={MOBILE_PATHS.inventory_to_logistics} dur="5.2s" begin="-1.7s" size={2.8} />
                <DataPacket path={MOBILE_PATHS.logistics_to_customer} dur="4.5s" begin="-3.2s" size={2.8} />
                <DataPacket path={MOBILE_PATHS.procurement_to_fulfillment} dur="5.5s" begin="-2.4s" size={2.8} />
                <DataPacket path={MOBILE_PATHS.fulfillment_to_logistics} dur="4.8s" begin="-0.5s" size={2.8} />
              </>
            ) : (
              <>
                <circle cx="160" cy="58" r="3" fill="#00F2FE" />
                <circle cx="340" cy="78" r="3" fill="#00F2FE" />
                <circle cx="256" cy="100" r="3" fill="#00F2FE" />
                <circle cx="190" cy="180" r="3" fill="#00F2FE" />
                <circle cx="365" cy="180" r="3" fill="#00F2FE" />
              </>
            )}
          </svg>

          {/* Interactive Mobile Nodes (Tap to inspect, tap again to close) */}
          {SCM_NODES.map((node) => {
            const Icon = node.icon;
            const isInspected = inspectedNode?.id === node.id;
            const isAi = node.id === "orion-ai";

            return (
              <button
                key={node.id}
                type="button"
                onClick={(e) => handleNodeTouchOrClick(e, node)}
                onMouseEnter={() => handleNodeMouseEnter(node)}
                onMouseLeave={handleNodeMouseLeave}
                onFocus={() => handleNodeFocus(node)}
                onBlur={handleNodeBlur}
                style={{
                  left: `${(node.mobileCoords.x / 500) * 100}%`,
                  top: `${(node.mobileCoords.y / 300) * 100}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer focus:outline-none"
                aria-label={`Inspect ${node.name} details`}
                aria-expanded={isInspected}
              >
                <div
                  className={`w-8 h-8 rounded-lg bg-os-surface/95 border transition-all duration-200 ${
                    isInspected
                      ? "border-[#00F2FE] bg-[#0e1f2f] shadow-[0_0_12px_rgba(0,242,254,0.4)] ring-1 ring-[#00F2FE]"
                      : isAi
                      ? "border-[#00F2FE]/60 bg-[#0e1724]"
                      : "border-os-border hover:border-[#00F2FE]/50"
                  } flex items-center justify-center shadow relative`}
                >
                  {isAi && (
                    <span
                      className="absolute -inset-1 rounded-lg border border-[#00F2FE]/40 animate-ping opacity-35 pointer-events-none"
                      style={{ animationDuration: "3.5s" }}
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 ${
                      isInspected || isAi
                        ? "text-[#00F2FE]"
                        : "text-os-text-secondary group-hover:text-[#00F2FE]"
                    } transition-colors`}
                  />
                </div>
                <div
                  className={`mt-1 px-1.5 py-0.5 rounded text-[7.5px] font-mono uppercase tracking-wider whitespace-nowrap transition-colors ${
                    isInspected
                      ? "bg-[#00F2FE]/15 border border-[#00F2FE] text-[#00F2FE] font-bold"
                      : "bg-os-surface/95 border border-os-border text-os-text-secondary"
                  }`}
                >
                  {node.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile Telemetry Inspection Sheet (Overlay style to prevent layout shift) */}
        {inspectedNode && (
          <div
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
            className="mt-2 p-3 rounded-lg bg-[#0E131C] border border-[#00F2FE]/40 text-left animate-in fade-in slide-in-from-bottom-2 duration-200 w-full shadow-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-os-border">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#00F2FE]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FE] animate-pulse" />
                <span>{inspectedNode.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectedNode(null)}
                className="text-os-text-muted hover:text-os-text-primary p-0.5 cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[10px] font-mono text-os-text-muted mt-1.5">
              {inspectedNode.category}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] font-mono">
              <div className="p-1.5 rounded bg-os-surface-active dark:bg-white/[0.03] border border-white/5">
                <span className="text-slate-500 block text-[8px] uppercase">STATUS</span>
                <span className="text-emerald-400 font-medium">{inspectedNode.telemetry.status}</span>
              </div>
              <div className="p-1.5 rounded bg-os-surface-active dark:bg-white/[0.03] border border-white/5">
                <span className="text-slate-500 block text-[8px] uppercase">THROUGHPUT</span>
                <span className="text-os-text-primary font-medium">{inspectedNode.telemetry.throughput}</span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-[8.5px] font-mono text-os-text-muted">
              <span className="text-[#00F2FE]">{inspectedNode.telemetry.aiOptimization}</span>
              <span>{inspectedNode.telemetry.latency}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DESKTOP PIXEL-PERFECT GRAPH WITH HOVER INSPECTION & CONTINUOUS DATA PACKETS
  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col justify-between select-none ${className}`}
    >
      {/* 1. TOP-LEFT: ORION SENSING & CONTROL INTELLIGENCE */}
      <div
        className={`absolute ${
          mode === "admin"
            ? "top-24 left-8 sm:top-28 sm:left-10"
            : "top-8 left-10"
        } z-20 pointer-events-none`}
      >
        <div className="flex items-center gap-2 mb-1.5 text-[#00F2FE] font-mono font-bold text-xs uppercase tracking-widest">
          <Zap className="w-4 h-4 text-[#00F2FE] fill-current" />
          <span>{mode === "admin" ? "ORION CONTROL PLANE" : "ORION INTELLIGENCE"}</span>
        </div>
        <div className="space-y-0.5 font-mono text-xs text-os-text-muted uppercase tracking-wider">
          {mode === "admin" ? (
            <>
              <p className="text-os-text-secondary font-semibold tracking-widest text-[11px]">
                PLATFORM ARCHITECTURE
              </p>
              <p className="text-[10px] text-[#00F2FE]/70 tracking-widest">
                DATA · AI · DECISION · WORKFLOW · AUDIT
              </p>
            </>
          ) : (
            <>
              <p>SENSING THE SUPPLY CHAIN.</p>
              <p>PREDICTING WHAT COMES NEXT.</p>
              <p>DRIVING BETTER DECISIONS.</p>
            </>
          )}
        </div>
      </div>

      {/* 2. TOP-RIGHT: ORION SIGNAL TELEMETRY STATUS */}
      <div className="absolute top-8 right-10 z-20 pointer-events-auto">
        <div className="px-4 py-2.5 rounded-xl bg-os-surface/95 border border-os-border backdrop-blur-md shadow-xl flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-os-text-primary uppercase">
              {mode === "admin" ? "ORION SIGNAL · CONTROL PLANE" : "ORION SIGNAL"}
            </div>
            <div className="text-[10px] font-mono tracking-wider text-emerald-400/90 uppercase flex items-center gap-1.5">
              <span>{mode === "admin" ? "SUPERVISORY FEED" : "NETWORK OPERATIONAL"}</span>
              <span className="text-os-text-primary/30">•</span>
              <span className="text-os-text-secondary">REAL-TIME TELEMETRY</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CENTER SCM NETWORK SVG CONNECTIONS & LIVE TRAVELING DATA PACKETS */}
      <div className="relative w-full h-full min-h-[540px] flex items-center justify-center">
        {/* SVG Bezier Curves and Continuously Moving Cyan Packets */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="cyan-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00F2FE" stopOpacity="1" />
              <stop offset="60%" stopColor="#00F2FE" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00F2FE" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* BASE DRAWN SCM CONNECTION LINES (DYNAMIC HIGHLIGHT ON HOVER) */}
          {/* Path 1: Supplier Network -> Procurement */}
          <path
            d={DESKTOP_PATHS.supplier_to_procurement}
            stroke={isPathHighlighted("supplier_to_procurement") ? "#00F2FE" : "#162c3e"}
            strokeWidth={isPathHighlighted("supplier_to_procurement") ? "2.2" : "1.8"}
            strokeOpacity={isPathHighlighted("supplier_to_procurement") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 2: Supplier Network -> Inventory Core (Dashed) */}
          <path
            d={DESKTOP_PATHS.supplier_to_inventory}
            stroke={isPathHighlighted("supplier_to_inventory") ? "#00F2FE" : "#132332"}
            strokeWidth={isPathHighlighted("supplier_to_inventory") ? "1.8" : "1.3"}
            strokeDasharray="4 4"
            strokeOpacity={isPathHighlighted("supplier_to_inventory") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 3: Supplier Network -> Orion AI Engine (Dashed) */}
          <path
            d={DESKTOP_PATHS.supplier_to_ai}
            stroke={isPathHighlighted("supplier_to_ai") ? "#00F2FE" : "#132332"}
            strokeWidth={isPathHighlighted("supplier_to_ai") ? "1.8" : "1.3"}
            strokeDasharray="4 4"
            strokeOpacity={isPathHighlighted("supplier_to_ai") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 4: Procurement -> Fulfillment Center */}
          <path
            d={DESKTOP_PATHS.procurement_to_fulfillment}
            stroke={isPathHighlighted("procurement_to_fulfillment") ? "#00F2FE" : "#162c3e"}
            strokeWidth={isPathHighlighted("procurement_to_fulfillment") ? "2.2" : "1.8"}
            strokeOpacity={isPathHighlighted("procurement_to_fulfillment") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 5: Procurement -> Orion AI Engine */}
          <path
            d={DESKTOP_PATHS.procurement_to_ai}
            stroke={isPathHighlighted("procurement_to_ai") ? "#00F2FE" : "#162c3e"}
            strokeWidth={isPathHighlighted("procurement_to_ai") ? "2.2" : "1.8"}
            strokeOpacity={isPathHighlighted("procurement_to_ai") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 6: Orion AI Engine -> Inventory Core */}
          <path
            d={DESKTOP_PATHS.ai_to_inventory}
            stroke={isPathHighlighted("ai_to_inventory") ? "#00F2FE" : "#162c3e"}
            strokeWidth={isPathHighlighted("ai_to_inventory") ? "2.2" : "1.8"}
            strokeOpacity={isPathHighlighted("ai_to_inventory") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 7: Orion AI Engine -> Fulfillment Center (Dashed) */}
          <path
            d={DESKTOP_PATHS.ai_to_fulfillment}
            stroke={isPathHighlighted("ai_to_fulfillment") ? "#00F2FE" : "#132332"}
            strokeWidth={isPathHighlighted("ai_to_fulfillment") ? "1.8" : "1.3"}
            strokeDasharray="4 4"
            strokeOpacity={isPathHighlighted("ai_to_fulfillment") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 8: Orion AI Engine -> Logistics (Dashed) */}
          <path
            d={DESKTOP_PATHS.ai_to_logistics}
            stroke={isPathHighlighted("ai_to_logistics") ? "#00F2FE" : "#132332"}
            strokeWidth={isPathHighlighted("ai_to_logistics") ? "1.8" : "1.3"}
            strokeDasharray="4 4"
            strokeOpacity={isPathHighlighted("ai_to_logistics") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 9: Fulfillment Center -> Logistics */}
          <path
            d={DESKTOP_PATHS.fulfillment_to_logistics}
            stroke={isPathHighlighted("fulfillment_to_logistics") ? "#00F2FE" : "#162c3e"}
            strokeWidth={isPathHighlighted("fulfillment_to_logistics") ? "2.2" : "1.8"}
            strokeOpacity={isPathHighlighted("fulfillment_to_logistics") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 10: Fulfillment Center -> Customer (Dashed) */}
          <path
            d={DESKTOP_PATHS.fulfillment_to_customer}
            stroke={isPathHighlighted("fulfillment_to_customer") ? "#00F2FE" : "#132332"}
            strokeWidth={isPathHighlighted("fulfillment_to_customer") ? "1.8" : "1.3"}
            strokeDasharray="4 4"
            strokeOpacity={isPathHighlighted("fulfillment_to_customer") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 11: Inventory Core -> Logistics (Dashed) */}
          <path
            d={DESKTOP_PATHS.inventory_to_logistics}
            stroke={isPathHighlighted("inventory_to_logistics") ? "#00F2FE" : "#132332"}
            strokeWidth={isPathHighlighted("inventory_to_logistics") ? "1.8" : "1.3"}
            strokeDasharray="4 4"
            strokeOpacity={isPathHighlighted("inventory_to_logistics") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 12: Inventory Core -> Customer (Dashed sweep) */}
          <path
            d={DESKTOP_PATHS.inventory_to_customer_sweep}
            stroke={isPathHighlighted("inventory_to_customer_sweep") ? "#00F2FE" : "#101e2b"}
            strokeWidth="1.2"
            strokeDasharray="4 4"
            strokeOpacity={isPathHighlighted("inventory_to_customer_sweep") ? 0.9 : 0.5}
            fill="none"
            className="transition-all duration-200"
          />
          {/* Path 13: Logistics -> Customer */}
          <path
            d={DESKTOP_PATHS.logistics_to_customer}
            stroke={isPathHighlighted("logistics_to_customer") ? "#00F2FE" : "#162c3e"}
            strokeWidth={isPathHighlighted("logistics_to_customer") ? "2.2" : "1.8"}
            strokeOpacity={isPathHighlighted("logistics_to_customer") ? 0.9 : 0.6}
            fill="none"
            className="transition-all duration-200"
          />

          {/* ============================================================ */}
          {/* LIVE CONTINUOUS DATA PACKETS TRAVELING ALONG SCM PATHS        */}
          {/* MUST CONTINUE UNINTERRUPTED DURING HOVER INSPECTION          */}
          {/* ============================================================ */}
          {!prefersReducedMotion ? (
            <>
              {/* 1. SUPPLIER -> PROCUREMENT */}
              <DataPacket path={DESKTOP_PATHS.supplier_to_procurement} dur="5.2s" begin="-1.0s" />
              <DataPacket path={DESKTOP_PATHS.supplier_to_procurement} dur="5.2s" begin="-3.6s" />

              {/* 2. SUPPLIER -> INVENTORY CORE */}
              <DataPacket path={DESKTOP_PATHS.supplier_to_inventory} dur="6.4s" begin="-2.5s" />

              {/* 3. SUPPLIER -> ORION AI ENGINE */}
              <DataPacket path={DESKTOP_PATHS.supplier_to_ai} dur="5.8s" begin="-0.7s" />

              {/* 4. PROCUREMENT -> ORION AI ENGINE */}
              <DataPacket path={DESKTOP_PATHS.procurement_to_ai} dur="4.4s" begin="-0.4s" />
              <DataPacket path={DESKTOP_PATHS.procurement_to_ai} dur="4.4s" begin="-2.6s" />

              {/* 5. PROCUREMENT -> FULFILLMENT CENTER */}
              <DataPacket path={DESKTOP_PATHS.procurement_to_fulfillment} dur="6.6s" begin="-3.1s" />

              {/* 6. ORION AI ENGINE -> INVENTORY CORE */}
              <DataPacket path={DESKTOP_PATHS.ai_to_inventory} dur="4.8s" begin="-1.8s" />
              <DataPacket path={DESKTOP_PATHS.ai_to_inventory} dur="4.8s" begin="-4.2s" />

              {/* 7. ORION AI ENGINE -> FULFILLMENT CENTER */}
              <DataPacket path={DESKTOP_PATHS.ai_to_fulfillment} dur="5.4s" begin="-2.0s" />

              {/* 8. ORION AI ENGINE -> LOGISTICS */}
              <DataPacket path={DESKTOP_PATHS.ai_to_logistics} dur="4.6s" begin="-0.8s" />
              <DataPacket path={DESKTOP_PATHS.ai_to_logistics} dur="4.6s" begin="-3.1s" />

              {/* 9. FULFILLMENT CENTER -> LOGISTICS */}
              <DataPacket path={DESKTOP_PATHS.fulfillment_to_logistics} dur="5.4s" begin="-2.8s" />

              {/* 10. INVENTORY CORE -> LOGISTICS */}
              <DataPacket path={DESKTOP_PATHS.inventory_to_logistics} dur="5.6s" begin="-1.5s" />

              {/* 11. LOGISTICS -> CUSTOMER */}
              <DataPacket path={DESKTOP_PATHS.logistics_to_customer} dur="4.6s" begin="-1.2s" />
              <DataPacket path={DESKTOP_PATHS.logistics_to_customer} dur="4.6s" begin="-3.5s" />

              {/* 12. FULFILLMENT CENTER -> CUSTOMER */}
              <DataPacket path={DESKTOP_PATHS.fulfillment_to_customer} dur="5.2s" begin="-1.7s" />

              {/* 13. INVENTORY CORE -> CUSTOMER SWEEP */}
              <DataPacket path={DESKTOP_PATHS.inventory_to_customer_sweep} dur="7.5s" begin="-4.1s" />

              {/* In ADMIN mode: Add high-frequency policy & control loops */}
              {mode === "admin" && (
                <>
                  <DataPacket
                    path={DESKTOP_PATHS.ai_to_inventory}
                    dur="3.8s"
                    begin="-0.6s"
                    color="#38BDF8"
                  />
                  <DataPacket
                    path={DESKTOP_PATHS.ai_to_logistics}
                    dur="3.6s"
                    begin="-1.9s"
                    color="#38BDF8"
                  />
                  <DataPacket
                    path={DESKTOP_PATHS.procurement_to_ai}
                    dur="4.0s"
                    begin="-1.5s"
                    color="#38BDF8"
                  />
                  <DataPacket
                    path={DESKTOP_PATHS.ai_to_fulfillment}
                    dur="4.2s"
                    begin="-0.9s"
                    color="#38BDF8"
                  />
                </>
              )}
            </>
          ) : (
            /* Reduced motion fallback: Static checkpoint dots */
            <>
              <circle cx="335" cy="155" r="4" fill="#00F2FE" className="drop-shadow-[0_0_6px_#00F2FE]" />
              <circle cx="685" cy="180" r="4" fill="#00F2FE" className="drop-shadow-[0_0_6px_#00F2FE]" />
              <circle cx="518" cy="235" r="4" fill="#00F2FE" className="drop-shadow-[0_0_6px_#00F2FE]" />
              <circle cx="410" cy="340" r="4" fill="#00F2FE" className="drop-shadow-[0_0_6px_#00F2FE]" />
              <circle cx="760" cy="325" r="4" fill="#00F2FE" className="drop-shadow-[0_0_6px_#00F2FE]" />
            </>
          )}
        </svg>

        {/* INTERACTIVE NODES (HOVER TO INSPECT — NO CLICK REQUIRED ON DESKTOP) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          {SCM_NODES.map((node) => {
            const Icon = node.icon;
            const isInspected = inspectedNode?.id === node.id;
            const isAi = node.id === "orion-ai";

            return (
              <div
                key={node.id}
                style={{
                  left: `${(node.coords.x / 1000) * 100}%`,
                  top: `${(node.coords.y / 600) * 100}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto"
              >
                {/* Node Box Button: Hover opens inspection, click does not force toggle on desktop */}
                <button
                  type="button"
                  onMouseEnter={() => handleNodeMouseEnter(node)}
                  onMouseLeave={handleNodeMouseLeave}
                  onFocus={() => handleNodeFocus(node)}
                  onBlur={handleNodeBlur}
                  onClick={(e) => handleNodeTouchOrClick(e, node)}
                  className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none ${
                    isInspected
                      ? "bg-[#00F2FE]/25 border-2 border-[#00F2FE] shadow-[0_0_24px_rgba(0,242,254,0.5)] ring-1 ring-[#00F2FE]/50 scale-105"
                      : isAi
                      ? "bg-os-surface/95 border border-[#00F2FE]/60 hover:border-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.2)]"
                      : "bg-os-surface/95 border border-white/15 hover:border-[#00F2FE]/60 hover:bg-[#0f1724]"
                  }`}
                  aria-label={`Inspect ${node.name} telemetry`}
                  aria-expanded={isInspected}
                >
                  {/* Subtle pulsing halo when inspected or when packets arrive at Orion AI */}
                  {isAi && (
                    <>
                      <div
                        className="absolute -inset-3 rounded-2xl bg-[#00F2FE]/10 blur-md pointer-events-none animate-pulse"
                        style={{ animationDuration: "3.5s" }}
                      />
                      <span
                        className="absolute -inset-1 rounded-xl border border-[#00F2FE]/40 pointer-events-none opacity-40 animate-ping"
                        style={{ animationDuration: "3.5s" }}
                      />
                    </>
                  )}

                  {/* Active node inspected pulse */}
                  {isInspected && !isAi && (
                    <span className="absolute -inset-1 rounded-xl border border-[#00F2FE]/60 animate-pulse pointer-events-none" />
                  )}

                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isInspected || isAi
                        ? "text-[#00F2FE] drop-shadow-[0_0_8px_#00F2FE]"
                        : "text-os-text-secondary group-hover:text-os-text-primary"
                    }`}
                  />
                </button>

                {/* Node Label Tag */}
                <div
                  onMouseEnter={() => handleNodeMouseEnter(node)}
                  onMouseLeave={handleNodeMouseLeave}
                  className={`mt-2 px-2.5 py-1 rounded-md border text-[9px] font-mono tracking-wider uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isInspected
                      ? "bg-[#00F2FE]/15 border-[#00F2FE] text-[#00F2FE] font-bold shadow-[0_0_10px_rgba(0,242,254,0.2)]"
                      : isAi
                      ? "bg-os-surface/95 border-[#00F2FE]/40 text-[#00F2FE] font-semibold"
                      : "bg-os-surface/95 border-os-border text-os-text-secondary hover:border-[#00F2FE]/40 hover:text-os-text-primary"
                  }`}
                >
                  {node.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* FLOATING HOVER DETAIL POPOVER (POSITIONED NEAR HOVERED NODE — NO LAYOUT SHIFT) */}
        {inspectedNode && (
          (() => {
            const placement = getPopoverPlacement(inspectedNode);
            return (
              <div
                onMouseEnter={handlePopoverMouseEnter}
                onMouseLeave={handlePopoverMouseLeave}
                style={{
                  position: "absolute",
                  left: placement.left,
                  top: (placement as any).top,
                  bottom: (placement as any).bottom,
                  transform: placement.transform,
                  zIndex: 40,
                }}
                className="w-[340px] max-w-[90vw] p-4 rounded-xl bg-os-surface/95 border border-[#00F2FE]/50 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
                role="region"
                aria-label={`${inspectedNode.name} details`}
              >
                {/* Arrow / caret pointing toward the node */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#0A0E17] border-cyan-400/50 rotate-45 pointer-events-none ${
                    placement.isAbove
                      ? "-bottom-1.5 border-b border-r"
                      : "-top-1.5 border-t border-l"
                  }`}
                />

                <div className="flex items-start justify-between pb-2.5 border-b border-os-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00F2FE] animate-pulse" />
                    <span className="font-mono text-xs font-bold tracking-wider text-[#00F2FE] uppercase">
                      {inspectedNode.name}
                    </span>
                  </div>
                  {isTouchDevice && (
                    <button
                      type="button"
                      onClick={() => setInspectedNode(null)}
                      className="text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer p-0.5"
                      aria-label="Close telemetry view"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-mono text-os-text-secondary mt-2 mb-3">
                  {inspectedNode.category}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-os-surface-active dark:bg-white/[0.03] border border-white/5">
                    <span className="text-slate-500 text-[9px] block uppercase font-semibold">STATUS</span>
                    <span className="text-emerald-400 font-semibold">{inspectedNode.telemetry.status}</span>
                  </div>
                  <div className="p-2 rounded bg-os-surface-active dark:bg-white/[0.03] border border-white/5">
                    <span className="text-slate-500 text-[9px] block uppercase font-semibold">THROUGHPUT</span>
                    <span className="text-os-text-primary font-semibold">{inspectedNode.telemetry.throughput}</span>
                  </div>
                  <div className="p-2 rounded bg-os-surface-active dark:bg-white/[0.03] border border-white/5">
                    <span className="text-slate-500 text-[9px] block uppercase font-semibold">LATENCY</span>
                    <span className="text-[#00F2FE]">{inspectedNode.telemetry.latency}</span>
                  </div>
                  <div className="p-2 rounded bg-os-surface-active dark:bg-white/[0.03] border border-white/5">
                    <span className="text-slate-500 text-[9px] block uppercase font-semibold">EFFICIENCY</span>
                    <span className="text-os-text-primary">{inspectedNode.telemetry.efficiency}</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-os-text-muted">
                  <span className="text-[#00F2FE]">{inspectedNode.telemetry.aiOptimization}</span>
                  <span>{inspectedNode.telemetry.activeTransactions}</span>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* 4. BOTTOM-RIGHT: PROMPT TO INSPECT TELEMETRY */}
      <div className="absolute bottom-8 right-10 z-20 pointer-events-none">
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-os-text-muted flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FE]/60 animate-ping" />
          <span>HOVER NODE TO INSPECT TELEMETRY · TAP ON TOUCH</span>
        </div>
      </div>
    </div>
  );
};

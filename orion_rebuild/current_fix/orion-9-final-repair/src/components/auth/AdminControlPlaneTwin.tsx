import React from "react";
import {
  Network,
  Box,
  Database,
  Cpu,
  Truck,
  Users,
  Layers,
  ShieldAlert,
  GitBranch,
  Activity,
  ShieldCheck,
} from "lucide-react";

interface AdminControlPlaneTwinProps {
  variant?: "desktop" | "mobile";
  className?: string;
}

export const AdminControlPlaneTwin: React.FC<AdminControlPlaneTwinProps> = ({
  variant = "desktop",
  className = "",
}) => {
  if (variant === "mobile") {
    // COMPACT CONTROL PLANE ARCHITECTURE FOR MOBILE (< md)
    return (
      <div className={`w-full relative select-none ${className}`}>
        {/* Subtle status header for mobile */}
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00F2FE] tracking-widest font-semibold uppercase">
            <Layers className="w-3 h-3 text-[#00F2FE]" />
            PLATFORM CONTROL PLANE
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            CONTROL PLANE ACTIVE
          </div>
        </div>

        {/* Compact Responsive SVG Architecture Canvas */}
        <div className="w-full relative aspect-[16/9] sm:aspect-[2/1] rounded-xl bg-os-surface-active dark:bg-black/50 border border-os-border overflow-hidden shadow-inner">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #00F2FE 1px, transparent 1px), linear-gradient(to bottom, #00F2FE 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 500 280"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Bus paths */}
            <path d="M 80 55 L 250 45" stroke="#00F2FE" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
            <path d="M 250 45 L 250 135" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.6" fill="none" />
            <path d="M 80 55 L 110 200" stroke="#00F2FE" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />
            <path d="M 250 135 L 110 200" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
            <path d="M 250 135 L 390 120" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
            <path d="M 110 200 L 400 225" stroke="#00F2FE" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
            <path d="M 390 120 L 400 225" stroke="#00F2FE" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />

            {/* Moving Packets */}
            <circle r="2.5" fill="#00F2FE">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 80 55 L 250 45" />
            </circle>
            <circle r="2.5" fill="#10B981">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 250 45 L 250 135" />
            </circle>
            <circle r="2.5" fill="#10B981">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 250 135 L 390 120" />
            </circle>
            <circle r="2.5" fill="#00F2FE">
              <animateMotion dur="3.5s" repeatCount="indefinite" path="M 110 200 L 400 225" />
            </circle>
          </svg>

          {/* Nodes with technical badges */}
          <div className="absolute top-[20%] left-[16%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-os-surface/95 border border-[#00F2FE]/40 px-2 py-1 rounded shadow">
            <Network className="w-3 h-3 text-[#00F2FE]" />
            <span className="text-[9px] font-mono font-semibold text-os-text-primary">SUPPLIER</span>
          </div>

          <div className="absolute top-[16%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-os-surface/95 border border-[#00F2FE]/40 px-2 py-1 rounded shadow">
            <Box className="w-3 h-3 text-[#00F2FE]" />
            <span className="text-[9px] font-mono font-semibold text-os-text-primary">PROCURE</span>
          </div>

          <div className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-os-surface/95 border border-emerald-500/60 px-2.5 py-1.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-emerald-300">DECISION BUS</span>
          </div>

          <div className="absolute top-[72%] left-[22%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-os-surface/95 border border-[#00F2FE]/50 px-2 py-1 rounded shadow">
            <Database className="w-3 h-3 text-[#00F2FE]" />
            <span className="text-[9px] font-mono font-semibold text-os-text-primary">INVENTORY</span>
          </div>

          <div className="absolute top-[43%] left-[78%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-os-surface/95 border border-[#00F2FE]/40 px-2 py-1 rounded shadow">
            <Truck className="w-3 h-3 text-[#00F2FE]" />
            <span className="text-[9px] font-mono font-semibold text-os-text-primary">LOGISTICS</span>
          </div>

          <div className="absolute top-[80%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-os-surface/95 border border-[#00F2FE]/40 px-2 py-1 rounded shadow">
            <Users className="w-3 h-3 text-[#00F2FE]" />
            <span className="text-[9px] font-mono font-semibold text-os-text-primary">CUSTOMER</span>
          </div>
        </div>

        <div className="text-[8px] font-mono text-os-text-muted text-center uppercase tracking-widest mt-1.5">
          DATA ENGINE · AI ENGINE · DECISION ENGINE · WORKFLOW · AUDIT
        </div>
      </div>
    );
  }

  // DESKTOP & TABLET TWO-ZONE ADVANCED TECHNICAL CONTROL PLANE
  return (
    <div className={`flex flex-col justify-between h-full p-8 sm:p-12 lg:p-14 select-none relative z-10 ${className}`}>
      {/* Ambient atmospheric glows */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-[#00F2FE]/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/[0.04] rounded-full blur-[140px] pointer-events-none" />

      {/* Top-Right Control Plane Status Header */}
      <div className="flex items-center justify-between z-20 animate-in fade-in duration-700">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            CONTROL PLANE ACTIVE
          </span>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-mono text-[#00F2FE] uppercase tracking-[0.2em] mb-1 flex items-center justify-end gap-2 font-bold">
            <Layers className="w-3.5 h-3.5 text-[#00F2FE]" />
            ORION CONTROL PLANE
          </div>
          <div className="text-[10px] font-mono text-os-text-muted tracking-wider">
            PLATFORM INTELLIGENCE · GOVERNANCE · DECISION ENGINE · WORKFLOW · AUDIT
          </div>
        </div>
      </div>

      {/* SCM Control Plane Architecture Topology Pipeline */}
      <div className="my-auto py-8 max-w-2xl w-full mx-auto animate-in fade-in duration-700 z-10">
        <div className="mb-5">
          <div className="text-[11px] font-mono text-[#00F2FE] uppercase tracking-[0.2em] font-semibold flex items-center gap-2 mb-1">
            <Network className="w-3.5 h-3.5 text-[#00F2FE]" />
            SCM CONTROL PLANE ARCHITECTURE
          </div>
          <h1 className="text-lg font-light tracking-tight text-os-text-primary/90">
            End-to-End Supply Chain Operational Topology
          </h1>
        </div>

        {/* Primary Execution Pipeline Nodes */}
        <div className="space-y-3">
          <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-widest flex items-center justify-between">
            <span>Primary Execution Pipeline</span>
            <span className="text-[#00F2FE]/70">SUPPLY → CUSTOMER</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { name: "Supplier Network", role: "Upstream Tier 1-3", icon: Network, code: "SUPPLY NETWORK" },
              { name: "Procurement", role: "Inbound Contracts", icon: Box, code: "DATA ENGINE" },
              { name: "Inventory Core", role: "Multi-Echelon State", icon: Database, code: "CONTROL PLANE" },
              { name: "Warehouse", role: "Fulfillment Facilities", icon: Layers, code: "WORKFLOW ENGINE" },
              { name: "Logistics", role: "Multimodal Transit", icon: Truck, code: "DISPATCH ENGINE" },
              { name: "Customer", role: "Downstream Demand", icon: Users, code: "DEMAND SENSING" },
            ].map((domain) => (
              <div
                key={domain.name}
                className="p-3.5 rounded-lg bg-os-surface-active dark:bg-white/[0.02] border border-os-border hover:border-[#00F2FE]/40 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-md bg-os-surface-active dark:bg-white/5 text-[#00F2FE] shrink-0 mt-0.5 group-hover:bg-[#00F2FE]/10 transition-colors">
                  <domain.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-mono font-medium text-os-text-primary truncate">
                    {domain.name}
                  </div>
                  <div className="text-[10px] font-mono text-os-text-muted truncate mt-0.5">
                    {domain.role}
                  </div>
                  <div className="text-[9px] font-mono text-[#00F2FE]/70 tracking-wider uppercase mt-1">
                    {domain.code}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence & Decision Engine layer */}
        <div className="mt-5 pt-5 border-t border-os-border space-y-3">
          <div className="text-[10px] font-mono text-emerald-400/90 uppercase tracking-widest flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Intelligence & Decision Engine Layer
            </span>
            <span className="text-emerald-400/70">AUTONOMOUS ORCHESTRATION</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "Data Engine", desc: "Telemetry & Events", icon: Database },
              { name: "AI Engine", desc: "Predictive Neural Bus", icon: Cpu },
              { name: "Decision Engine", desc: "Prescriptive Optimization", icon: GitBranch },
              { name: "Audit & Telemetry", desc: "Cryptographic Trace", icon: ShieldAlert },
            ].map((engine) => (
              <div
                key={engine.name}
                className="p-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-950/15 border border-emerald-500/25 flex flex-col justify-between hover:border-emerald-400/40 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-medium text-emerald-300">
                    {engine.name}
                  </span>
                  <engine.icon className="w-3.5 h-3.5 text-emerald-400/80" />
                </div>
                <div className="text-[9px] font-mono text-emerald-400/60 leading-tight">
                  {engine.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Technical Meta Note */}
      <div className="text-[10px] font-mono text-os-text-muted tracking-wider flex items-center justify-between pt-4 border-t border-os-border z-20">
        <span>ORION CONTROL PLANE KERNEL v9.4.2</span>
        <span className="text-os-text-muted">SUPPLIER ↓ PROCUREMENT ↓ INVENTORY ↓ WAREHOUSE ↓ LOGISTICS ↓ CUSTOMER</span>
      </div>
    </div>
  );
};

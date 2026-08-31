import React from 'react';
import { OrionMark } from './brand/OrionLogo';
import { 
  BrainCircuit, Network, Compass, CheckCircle2, Award, Workflow 
} from 'lucide-react';

export const About: React.FC = () => {
  const coreCapabilities = [
    { label: 'Inventory Intelligence', desc: 'Real-time stock velocity, safety stock depletion, and critical stock-out alerts.' },
    { label: 'Supplier Reliability', desc: 'Predictive OTIF monitoring, defect rate scoring, and vendor risk matrix.' },
    { label: 'Procurement & POs', desc: 'Automated overdue tracking, vendor commitment audits, and schedule adjustments.' },
    { label: 'Logistics & Transit', desc: 'Live carrier delay telemetry, freight exposure, and multihop shipment tracking.' },
    { label: 'Exceptions & Actions', desc: 'Deterministic root-cause linking with confidence-weighted decision recommendations.' },
    { label: 'Scenario Simulation', desc: 'In-memory stress testing for port disruptions, supplier strikes, and demand surges.' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="border-b border-[#2A2A2A] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-[0.2em] px-2 py-0.5 bg-[#1B1B1B] text-[#30D158] border border-[#2A2A2A] rounded">
              SYSTEM ARCHITECTURE & ORIGIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-[#F5F5F5] tracking-tight">About ORION-9</h1>
          <p className="text-xs text-[#777777] font-mono mt-1">AI-Powered Supply Chain Operating System</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-[#151515] border border-[#2A2A2A] text-xs font-mono text-[#F5F5F5] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#30D158]"></span>
            SYSTEM V2.4 PROD
          </div>
        </div>
      </div>

      {/* Main Mission Card */}
      <div className="bg-[#151515] border border-[#2A2A2A] p-6 sm:p-8 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <OrionMark size={240} />
        </div>
        
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold flex items-center gap-2">
            <BrainCircuit size={16} className="text-[#30D158]" />
            System Purpose & Mission
          </div>
          <h2 className="text-lg sm:text-xl font-medium text-[#F5F5F5] leading-snug">
            ORION-9 is an AI-powered Supply Chain Operating System designed to transform complex supply-chain data into predictive intelligence, operational visibility, risk detection, and actionable decisions.
          </h2>
          <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed font-mono">
            The system is designed to move beyond traditional static dashboards by identifying operational risks, connecting root causes across multi-tier networks, simulating scenarios, and helping decision-makers understand what requires immediate attention.
          </p>
        </div>
      </div>

      {/* FOUNDER & CREATOR SECTION */}
      <div className="bg-[#151515] border-2 border-[#333333] hover:border-[#777777] transition-colors p-6 sm:p-8 rounded-xl relative overflow-hidden group">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#111111] border border-[#2A2A2A] flex items-center justify-center text-[#F5F5F5] shrink-0 font-mono text-xl font-semibold tracking-wider">
              AP
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#30D158] font-semibold mb-1">
                FOUNDED & BUILT BY
              </div>
              <h2 className="text-2xl font-semibold text-[#F5F5F5] tracking-tight">
                AYUSH PRAKASH
              </h2>
              <p className="text-xs font-mono text-[#B3B3B3] mt-0.5">
                Founder & Creator, ORION-9
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#111111] border border-[#2A2A2A] rounded-lg">
            <Award size={14} className="text-[#30D158]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#F5F5F5]">Founder Attribution</span>
          </div>
        </div>

        {/* Founder Quote */}
        <div className="mt-6 space-y-4">
          <div className="p-4 sm:p-5 bg-[#111111] border border-[#2A2A2A] rounded-lg relative">
            <p className="text-xs sm:text-sm font-mono text-[#F5F5F5] italic leading-relaxed">
              "ORION-9 was conceived and built to bring intelligence, prediction, and decision-making together in a single operational environment for modern supply chains."
            </p>
            <div className="mt-2 text-[10px] uppercase font-mono text-[#777777] tracking-wider text-right">
              — AYUSH PRAKASH, Founder & Creator of ORION-9
            </div>
          </div>
        </div>
      </div>

      {/* Vision Statement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#151515] border border-[#2A2A2A] p-6 rounded-xl space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold flex items-center gap-2">
            <Compass size={16} className="text-[#B3B3B3]" />
            Core Vision
          </div>
          <p className="text-xs font-mono text-[#F5F5F5] leading-relaxed italic bg-[#111111] p-4 rounded-lg border border-[#2A2A2A]">
            "Build an intelligent operating layer for the supply chain — one that doesn't just report what happened, but helps organizations understand what is happening, what could happen next, and what action should be considered."
          </p>
        </div>

        <div className="bg-[#151515] border border-[#2A2A2A] p-6 rounded-xl space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold flex items-center gap-2">
            <Network size={16} className="text-[#B3B3B3]" />
            What is ORION-9?
          </div>
          <p className="text-xs font-mono text-[#B3B3B3] leading-relaxed">
            ORION-9 connects supply-chain intelligence across:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#F5F5F5]">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#30D158]" /> Inventory</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#30D158]" /> Suppliers</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#30D158]" /> Procurement</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#30D158]" /> Purchase Orders</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#30D158]" /> Shipments</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#30D158]" /> Logistics</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#30D158]" /> Exceptions</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#30D158]" /> Demand & Risk</span>
          </div>
        </div>
      </div>

      {/* Capabilities Matrix */}
      <div className="bg-[#151515] border border-[#2A2A2A] p-6 rounded-xl space-y-4">
        <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold flex items-center gap-2">
          <Workflow size={16} className="text-[#B3B3B3]" />
          Platform Intelligence Matrix
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreCapabilities.map((cap, idx) => (
            <div key={idx} className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-lg space-y-1.5">
              <div className="text-xs font-medium text-[#F5F5F5]">{cap.label}</div>
              <p className="text-[11px] text-[#777777] leading-relaxed font-mono">{cap.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-[#2A2A2A] pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-[#777777] gap-2">
        <div>ORION-9 AI SUPPLY CHAIN OPERATING SYSTEM</div>
        <div>CONCEIVED & DEVELOPED BY AYUSH PRAKASH</div>
      </div>
    </div>
  );
};
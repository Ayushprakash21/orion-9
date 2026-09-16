import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, ShieldCheck, Users, Settings, ScrollText, BrainCircuit } from 'lucide-react';

const sections = [
 ['Autonomous Operations Control Plane','Use this as the central map for platform intelligence, autonomy governance, agents, integrations, data, finance and audit.','/admin/autonomous-operations',BrainCircuit],
 ['Users & Organizations','Manage identities, organization membership, account status and administrative access.','/admin/users',Users],
 ['Roles & Access','Define who can operate, approve or administer governed capabilities.','/admin/roles',ShieldCheck],
 ['Platform Intelligence','Review platform-level intelligence, AI status and operational controls.','/admin/platform-intelligence',BrainCircuit],
 ['Branding','Manage the canonical ORION-9 platform identity and visual configuration.','/admin/branding',Settings],
 ['Settings','Configure platform-level administrative settings and safeguards.','/admin/settings',Settings],
 ['Audit Activity','Review administrative activity and traceability for control-plane changes.','/admin/audit-logs',ScrollText],
];
export const AdminManual: React.FC = () => { const navigate=useNavigate(); return <div className="space-y-6"><header className="border-b border-os-border pb-6"><div className="flex items-center gap-2 text-os-accent text-[10px] uppercase tracking-[0.2em] font-mono"><BookOpen size={14}/> Admin Manual</div><h1 className="mt-2 text-2xl sm:text-3xl font-light text-os-text-primary">ORION-9 Platform Administration Guide</h1><p className="mt-2 text-sm text-os-text-secondary">Govern the platform without confusing administrative controls with day-to-day supply-chain operations.</p></header><div className="space-y-3">{sections.map(([t,d,p,I]:any)=><button key={t} onClick={()=>navigate(p)} className="w-full text-left p-4 rounded-xl border border-os-border bg-os-surface hover:bg-os-surface-hover flex items-center gap-4"><I size={18} className="text-os-accent shrink-0"/><div className="flex-1"><div className="text-sm font-medium text-os-text-primary">{t}</div><p className="mt-1 text-xs leading-5 text-os-text-muted">{d}</p></div><ArrowRight size={15} className="text-os-text-muted"/></button>)}</div></div> };

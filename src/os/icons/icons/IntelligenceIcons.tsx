import React from 'react';
import { OrionSquircleBase } from '../OrionIconRegistry';

// 27. World Model
export const IconWorldModel: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-world-model" from="#0E7490" to="#083344" {...props}>
    {/* Omniscient Planetary Geodesic Simulation Sphere */}
    <circle cx="64" cy="64" r="34" stroke="#22D3EE" strokeWidth="2.5" fill="none" opacity="0.6" />
    <ellipse cx="64" cy="64" rx="34" ry="14" stroke="#67E8F9" strokeWidth="2" fill="none" />
    <ellipse cx="64" cy="64" rx="14" ry="34" stroke="#67E8F9" strokeWidth="2" fill="none" />
    <circle cx="64" cy="64" r="8" fill="#A5F3FC" />
    <circle cx="82" cy="54" r="3" fill="#FFFFFF" />
    <circle cx="48" cy="74" r="3" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 28. Orion AI (Neural Core)
export const IconOrionAi: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-orion-ai" from="#7E22CE" to="#3B0764" {...props}>
    {/* Cognitive Intelligence Core Spark & Neural Nodes */}
    <circle cx="64" cy="64" r="28" stroke="#D8B4FE" strokeWidth="2" strokeDasharray="6 4" fill="none" />
    {/* Four-point Radiant Star */}
    <path d="M 64 28 Q 64 64 28 64 Q 64 64 64 100 Q 64 64 100 64 Q 64 64 64 28 Z" fill="#C084FC" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="64" cy="64" r="6" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 29. Predictions
export const IconPredictions: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-predictions" from="#8B5CF6" to="#4C1D95" {...props}>
    {/* Horizon Projection Arc & Confidence Interval Fan */}
    <path d="M 28 88 L 52 70 L 74 76 L 100 38" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Prediction Cone */}
    <path d="M 74 76 L 102 26 L 102 58 Z" fill="#DDD6FE" opacity="0.3" />
    <circle cx="100" cy="38" r="5" fill="#FDE047" stroke="#FFFFFF" strokeWidth="2" />
  </OrionSquircleBase>
);

// 30. Demand Forecasting
export const IconDemandForecasting: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-demand-fc" from="#9333EA" to="#581C87" {...props}>
    {/* Seasonal Demand Curve with Neural Peaks */}
    <path d="M 24 80 Q 44 20 64 64 T 104 36" stroke="#F0ABFC" strokeWidth="4" strokeLinecap="round" fill="none" />
    <line x1="24" y1="92" x2="104" y2="92" stroke="#A855F7" strokeWidth="2" />
    <circle cx="48" cy="40" r="4.5" fill="#FFFFFF" />
    <circle cx="84" cy="50" r="4.5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 31. Inventory Optimization
export const IconInventoryOptimization: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-inv-opt" from="#0D9488" to="#115E59" {...props}>
    {/* Multi-echelon Stock Curve & Golden Ratio Buffer */}
    <rect x="30" y="60" width="16" height="34" rx="3" fill="#5EEAD4" />
    <rect x="56" y="44" width="16" height="50" rx="3" fill="#2DD4BF" />
    <rect x="82" y="32" width="16" height="62" rx="3" fill="#14B8A6" />
    {/* Optimal Stock Threshold Line */}
    <path d="M 26 48 Q 64 42 102 24" stroke="#FDE047" strokeWidth="3.5" strokeDasharray="4 3" fill="none" />
  </OrionSquircleBase>
);

// 32. Scenarios
export const IconScenarios: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-scenarios" from="#0284C7" to="#0369A1" {...props}>
    {/* Branching Multi-Scenario Tree Fork */}
    <circle cx="36" cy="64" r="7" fill="#FFFFFF" />
    <path d="M 43 64 L 64 64 Q 74 64 80 44 L 92 44" stroke="#BAE6FD" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M 64 64 L 92 64" stroke="#BAE6FD" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M 43 64 L 64 64 Q 74 64 80 84 L 92 84" stroke="#BAE6FD" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <circle cx="94" cy="44" r="6" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="94" cy="64" r="6" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="94" cy="84" r="6" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
  </OrionSquircleBase>
);

// 33. Digital Twin
export const IconDigitalTwin: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-digital-twin" from="#0891B2" to="#155E75" {...props}>
    {/* Mirrored Physical & Digital Duplex Octahedron */}
    <g transform="translate(64,64)">
      {/* Upper Physical Polyhedron */}
      <polygon points="0,-36 28,-14 0,4 -28,-14" fill="#67E8F9" stroke="#FFFFFF" strokeWidth="1.5" />
      {/* Lower Digital Wireframe */}
      <polygon points="0,36 28,14 0,-4 -28,14" fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeDasharray="3 3" />
      <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" />
    </g>
  </OrionSquircleBase>
);

// 34. Risk Radar
export const IconRiskRadar: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-risk-radar" from="#B91C1C" to="#450A0A" {...props}>
    {/* 360-degree Threat Sweep & Critical Warning Node */}
    <circle cx="64" cy="64" r="34" stroke="#FCA5A5" strokeWidth="2" fill="none" opacity="0.4" />
    <circle cx="64" cy="64" r="20" stroke="#F87171" strokeWidth="2" fill="none" />
    <circle cx="64" cy="64" r="6" fill="#EF4444" />
    {/* Threat Blip */}
    <circle cx="82" cy="46" r="5.5" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="2" />
    <line x1="64" y1="64" x2="82" y2="46" stroke="#FEF08A" strokeWidth="2.5" strokeDasharray="3 2" />
  </OrionSquircleBase>
);

// 35. Memory
export const IconMemory: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-memory" from="#6D28D9" to="#2E1065" {...props}>
    {/* Cognitive Episodic Memory Vault / Neural Memory Bank */}
    <rect x="32" y="32" width="64" height="64" rx="10" fill="#4C1D95" stroke="#A78BFA" strokeWidth="2.5" />
    {/* Memory Grid Cells */}
    <rect x="40" y="40" width="18" height="18" rx="4" fill="#C4B5FD" />
    <rect x="70" y="40" width="18" height="18" rx="4" fill="#A78BFA" />
    <rect x="40" y="70" width="18" height="18" rx="4" fill="#A78BFA" />
    <rect x="70" y="70" width="18" height="18" rx="4" fill="#C4B5FD" />
    <circle cx="64" cy="64" r="7" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 36. Intelligence Center
export const IconIntelligenceCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-intel-center" from="#581C87" to="#1E1B4B" {...props}>
    {/* Multi-Agent Synthesis Command Prism */}
    <polygon points="64,24 100,84 28,84" fill="#7E22CE" stroke="#E9D5FF" strokeWidth="2.5" />
    <polygon points="64,44 84,78 44,78" fill="#C084FC" />
    <circle cx="64" cy="64" r="5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 37. Signal Language
export const IconSignalLanguage: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-signal-lang" from="#7C3AED" to="#3B0764" {...props}>
    {/* Signal Waveform & Semantic Grammar Token */}
    <path d="M 26 64 L 40 64 L 48 34 L 60 94 L 72 44 L 80 74 L 88 64 L 102 64" stroke="#F5D0FE" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <text x="64" y="28" fontSize="16" fontWeight="bold" textAnchor="middle" fill="#FFFFFF" fontFamily="monospace">&lt;SIG&gt;</text>
  </OrionSquircleBase>
);

// 38. Network Intelligence
export const IconNetworkIntelligence: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-net-intel" from="#4338CA" to="#1E1B4B" {...props}>
    {/* Topology Network Graph & Neural Flow */}
    <line x1="42" y1="42" x2="86" y2="42" stroke="#818CF8" strokeWidth="2.5" />
    <line x1="42" y1="42" x2="64" y2="86" stroke="#818CF8" strokeWidth="2.5" />
    <line x1="86" y1="42" x2="64" y2="86" stroke="#818CF8" strokeWidth="2.5" />
    <circle cx="42" cy="42" r="9" fill="#A5B4FC" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="86" cy="42" r="9" fill="#A5B4FC" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="64" cy="86" r="9" fill="#A5B4FC" stroke="#FFFFFF" strokeWidth="2" />
  </OrionSquircleBase>
);

// 39. Decision Science
export const IconDecisionScience: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-dec-sci" from="#B45309" to="#451A03" {...props}>
    {/* Mathematical Optimization Polyhedron & Sigma */}
    <circle cx="64" cy="64" r="32" stroke="#FDE68A" strokeWidth="2.5" fill="none" />
    <text x="64" y="74" fontSize="30" fontWeight="bold" textAnchor="middle" fill="#FFFFFF" fontFamily="serif">∑</text>
  </OrionSquircleBase>
);

// 40. Event Fabric
export const IconEventFabric: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-event-fabric" from="#0284C7" to="#082F49" {...props}>
    {/* Intertwined Event Mesh & Streaming Ribbon */}
    <path d="M 24 44 C 44 44 44 84 64 84 C 84 84 84 44 104 44" stroke="#7DD3FC" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M 24 84 C 44 84 44 44 64 44 C 84 44 84 84 104 84" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
    <circle cx="64" cy="64" r="6" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 41. Causal Intelligence
export const IconCausalIntelligence: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-causal" from="#0D9488" to="#042F2E" {...props}>
    {/* Directed Acyclic Causal Graph Flow */}
    <circle cx="36" cy="46" r="8" fill="#5EEAD4" />
    <circle cx="92" cy="46" r="8" fill="#5EEAD4" />
    <circle cx="64" cy="84" r="8" fill="#2DD4BF" />
    <path d="M 42 50 L 58 78" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    <path d="M 86 50 L 70 78" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    <path d="M 46 46 L 82 46" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 42. Counterfactual
export const IconCounterfactual: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-counterfactual" from="#1D4ED8" to="#172554" {...props}>
    {/* Dual Parallel Timeline Fork Delta */}
    <line x1="28" y1="44" x2="100" y2="44" stroke="#93C5FD" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="28" y1="84" x2="100" y2="84" stroke="#60A5FA" strokeWidth="3.5" strokeDasharray="6 4" strokeLinecap="round" />
    {/* Connecting Delta Divergence */}
    <path d="M 44 44 L 68 84" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="44" cy="44" r="4.5" fill="#FFFFFF" />
    <circle cx="68" cy="84" r="4.5" fill="#FDE047" />
  </OrionSquircleBase>
);

// 43. Decision Economics
export const IconDecisionEconomics: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-dec-econ" from="#15803D" to="#052E16" {...props}>
    {/* Marginal Supply/Demand Value Curves & Equilibrium Point */}
    <path d="M 28 88 L 100 28" stroke="#86EFAC" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M 28 28 L 100 88" stroke="#4ADE80" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="64" cy="58" r="7" fill="#FEF08A" stroke="#166534" strokeWidth="2.5" />
  </OrionSquircleBase>
);

// 44. Information Gaps
export const IconInformationGaps: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-info-gaps" from="#BE185D" to="#500724" {...props}>
    {/* Missing Signal Puzzle & Epistemic Probe */}
    <rect x="34" y="34" width="26" height="26" rx="4" fill="#F472B6" />
    <rect x="68" y="34" width="26" height="26" rx="4" fill="#F472B6" />
    <rect x="34" y="68" width="26" height="26" rx="4" fill="#F472B6" />
    {/* Missing Dotted Slot */}
    <rect x="68" y="68" width="26" height="26" rx="4" stroke="#FBCFE8" strokeWidth="2.5" strokeDasharray="4 3" fill="none" />
    <text x="81" y="86" fontSize="16" fontWeight="bold" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">?</text>
  </OrionSquircleBase>
);

// 45. Outcomes
export const IconOutcomes: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-outcomes" from="#047857" to="#064E3B" {...props}>
    {/* Decision Accuracy Bullseye & Verified Metric */}
    <circle cx="64" cy="64" r="32" stroke="#A7F3D0" strokeWidth="3" fill="none" />
    <circle cx="64" cy="64" r="18" fill="#10B981" />
    <path d="M 54 64 L 62 72 L 76 56" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </OrionSquircleBase>
);

// 46. Decision Replay
export const IconDecisionReplay: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-dec-replay" from="#6D28D9" to="#2E1065" {...props}>
    {/* Step-by-Step Decision Scrubber & Play Triangle */}
    <circle cx="64" cy="64" r="30" stroke="#DDD6FE" strokeWidth="3" strokeDasharray="16 6" fill="none" />
    <polygon points="58,50 78,64 58,78" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 47. Time Machine
export const IconTimeMachine: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-time-mach" from="#0369A1" to="#082F49" {...props}>
    {/* Chronological State Rewind Dial & Hourglass */}
    <circle cx="64" cy="64" r="32" stroke="#BAE6FD" strokeWidth="3" fill="none" />
    <path d="M 64 42 L 64 64 L 78 72" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M 38 46 L 34 36 L 46 36" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" fill="none" />
  </OrionSquircleBase>
);

// 48. Decision DNA
export const IconDecisionDna: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-dec-dna" from="#4338CA" to="#1E1B4B" {...props}>
    {/* Heuristic Evolution Double Helix */}
    <path d="M 44 26 Q 64 46 44 66 T 44 102" stroke="#A5B4FC" strokeWidth="3.5" fill="none" />
    <path d="M 84 26 Q 64 46 84 66 T 84 102" stroke="#A5B4FC" strokeWidth="3.5" fill="none" />
    <line x1="44" y1="36" x2="84" y2="36" stroke="#FFFFFF" strokeWidth="2.5" />
    <line x1="56" y1="56" x2="72" y2="56" stroke="#FFFFFF" strokeWidth="2.5" />
    <line x1="44" y1="76" x2="84" y2="76" stroke="#FFFFFF" strokeWidth="2.5" />
    <line x1="56" y1="96" x2="72" y2="96" stroke="#FFFFFF" strokeWidth="2.5" />
  </OrionSquircleBase>
);

// 49. Human-AI Teaming
export const IconHumanAi: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-human-ai" from="#D97706" to="#78350F" {...props}>
    {/* Bionic Human Silhouette & Neural Copilot Ring */}
    <circle cx="48" cy="48" r="12" fill="#FDE68A" />
    <path d="M 30 84 C 30 70 40 66 48 66 C 56 66 66 70 66 84 Z" fill="#FDE68A" />
    {/* AI Brain Ring */}
    <circle cx="80" cy="54" r="16" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="5 3" fill="none" />
    <circle cx="80" cy="54" r="6" fill="#F59E0B" />
  </OrionSquircleBase>
);

// 50. Quiet Risk
export const IconQuietRisk: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-quiet-risk" from="#C2410C" to="#431407" {...props}>
    {/* Sub-Threshold Latent Fragility Sonar */}
    <circle cx="64" cy="64" r="32" stroke="#FDBA74" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
    <circle cx="64" cy="64" r="20" stroke="#FB923C" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <circle cx="64" cy="64" r="8" fill="#EA580C" />
    <line x1="64" y1="32" x2="64" y2="64" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 51. Workflow Monitor
export const IconWorkflowMonitor: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-wf-mon" from="#0284C7" to="#075985" {...props}>
    {/* Flamegraph Trace Waterfall Spans */}
    <rect x="28" y="32" width="72" height="12" rx="3" fill="#38BDF8" />
    <rect x="36" y="48" width="48" height="12" rx="3" fill="#7DD3FC" />
    <rect x="44" y="64" width="56" height="12" rx="3" fill="#BAE6FD" />
    <rect x="52" y="80" width="32" height="12" rx="3" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 52. Digital Twin Center
export const IconDigitalTwinCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-dt-center" from="#0891B2" to="#164E63" {...props}>
    {/* 3D Wireframe Cyber-Physical Topology Sphere */}
    <circle cx="64" cy="64" r="32" stroke="#67E8F9" strokeWidth="2.5" fill="none" />
    <line x1="32" y1="64" x2="96" y2="64" stroke="#67E8F9" strokeWidth="1.5" />
    <line x1="64" y1="32" x2="64" y2="96" stroke="#67E8F9" strokeWidth="1.5" />
    <polygon points="64,32 96,64 64,96 32,64" stroke="#FFFFFF" strokeWidth="2" fill="none" />
  </OrionSquircleBase>
);

// 53. Scenario Lab
export const IconScenarioLab: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-scen-lab" from="#4F46E5" to="#1E1B4B" {...props}>
    {/* Simulation Flask & Chemical Branching Reaction */}
    <path d="M 54 28 L 74 28 L 74 44 L 92 84 C 94 88 90 94 84 94 L 44 94 C 38 94 34 88 36 84 L 54 44 Z" fill="#6366F1" stroke="#E0E7FF" strokeWidth="2.5" />
    <circle cx="60" cy="74" r="4" fill="#FFFFFF" />
    <circle cx="72" cy="80" r="3" fill="#FFFFFF" />
    <circle cx="50" cy="82" r="2.5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 54. Scenario Results
export const IconScenarioResult: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-scen-res" from="#4338CA" to="#1E1B4B" {...props}>
    {/* Comparative Pareto Frontier Matrix */}
    <line x1="28" y1="92" x2="100" y2="92" stroke="#818CF8" strokeWidth="2.5" />
    <line x1="28" y1="28" x2="28" y2="92" stroke="#818CF8" strokeWidth="2.5" />
    {/* Pareto Curve */}
    <path d="M 36 36 Q 44 76 96 84" stroke="#FDE047" strokeWidth="3" fill="none" />
    <circle cx="52" cy="62" r="5" fill="#FFFFFF" />
    <circle cx="78" cy="80" r="5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 55. Learning Center
export const IconLearningCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-learning" from="#7E22CE" to="#3B0764" {...props}>
    {/* Continuous Model Reinforcement Loop & Graduation Cap */}
    <polygon points="64,36 96,50 64,64 32,50" fill="#E9D5FF" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M 44 57 L 44 76 C 44 84 64 88 64 88 C 64 88 84 84 84 76 L 84 57" stroke="#E9D5FF" strokeWidth="2.5" fill="none" />
  </OrionSquircleBase>
);

// 56. Drift Center
export const IconDriftCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-drift" from="#9333EA" to="#3B0764" {...props}>
    {/* Concept Drift Bell Curve Shift Delta */}
    <path d="M 24 84 Q 48 30 72 84" stroke="#DDD6FE" strokeWidth="3" fill="none" />
    <path d="M 48 84 Q 72 30 96 84" stroke="#F472B6" strokeWidth="3" strokeDasharray="5 3" fill="none" />
  </OrionSquircleBase>
);

// 57. Network Design
export const IconNetworkDesign: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-net-design" from="#4F46E5" to="#1E1B4B" {...props}>
    {/* Geometric Supply Chain Facility Coordinates Grid */}
    <rect x="28" y="28" width="72" height="72" rx="8" stroke="#818CF8" strokeWidth="2" strokeDasharray="6 4" fill="none" />
    <polygon points="64,38 86,76 42,76" fill="#A5B4FC" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="64" cy="58" r="4" fill="#1E1B4B" />
  </OrionSquircleBase>
);

// 58. Sustainability
export const IconSustainability: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-sustainability" from="#15803D" to="#052E16" {...props}>
    {/* Circular Green Economy Leaf & Carbon Zero Loop */}
    <path d="M 64 26 C 42 26 30 46 32 68 C 34 90 64 98 64 98 C 64 98 94 90 96 68 C 98 46 86 26 64 26 Z" fill="#22C55E" stroke="#86EFAC" strokeWidth="2" />
    <path d="M 64 36 L 64 88 M 64 54 L 46 44 M 64 68 L 82 58" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
  </OrionSquircleBase>
);

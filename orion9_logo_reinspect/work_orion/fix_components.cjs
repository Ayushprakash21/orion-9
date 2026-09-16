const fs = require('fs');
let code = fs.readFileSync('src/components/LoadingScreen.tsx', 'utf8');

const componentsToInsert = `
function getInitializationStatusText(elapsed: number, duration: number, isAdmin: boolean) {
  const percent = elapsed / duration;
  
  if (isAdmin) {
    if (percent < 0.15) return "PLATFORM CORE ONLINE";
    if (percent < 0.3) return "DATA FABRIC CONNECTED";
    if (percent < 0.45) return "AI ENGINE ONLINE";
    if (percent < 0.6) return "DECISION FABRIC ONLINE";
    if (percent < 0.75) return "GOVERNANCE ENGINE ONLINE";
    if (percent < 0.85) return "AUDIT FABRIC ONLINE";
    return "PLATFORM CONTROL PLANE READY";
  } else {
    if (percent < 0.15) return "SUPPLY CHAIN CORE ONLINE";
    if (percent < 0.3) return "DATA FABRIC CONNECTED";
    if (percent < 0.45) return "WORLD MODEL ONLINE";
    if (percent < 0.55) return "PREDICTION ENGINE ONLINE";
    if (percent < 0.65) return "RISK ENGINE ONLINE";
    if (percent < 0.75) return "DECISION ENGINE ONLINE";
    if (percent < 0.85) return "WORKFLOW FABRIC ONLINE";
    return "SUPPLY CHAIN INTELLIGENCE READY";
  }
}

const SUPPLY_CHAIN_NODES = [
  { id: 'suppliers', label: 'SUPPLIERS', angle: -135, r: 240, activeAt: 0.1 },
  { id: 'materials', label: 'MATERIALS', angle: -90, r: 210, activeAt: 0.2 },
  { id: 'procurement', label: 'PROCUREMENT', angle: -45, r: 230, activeAt: 0.3 },
  { id: 'warehouse', label: 'WAREHOUSE', angle: 0, r: 220, activeAt: 0.4 },
  { id: 'inventory', label: 'INVENTORY', angle: 45, r: 240, activeAt: 0.5 },
  { id: 'logistics', label: 'LOGISTICS', angle: 90, r: 200, activeAt: 0.6 },
  { id: 'demand', label: 'DEMAND', angle: 135, r: 230, activeAt: 0.7 },
  { id: 'customers', label: 'CUSTOMERS', angle: 180, r: 250, activeAt: 0.8 },
];

const SupplyChainConvergence: React.FC<{ elapsed: number; duration: number }> = ({ elapsed, duration }) => {
  const percent = Math.min(1, elapsed / duration);
  
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-10">
      <svg className="w-[800px] h-[800px] absolute opacity-80" viewBox="-400 -400 800 800">
        <defs>
          <filter id="glow-convergence" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <g>
          {SUPPLY_CHAIN_NODES.map((node, i) => {
            const rad = (node.angle * Math.PI) / 180;
            const x = node.r * Math.cos(rad);
            const y = node.r * Math.sin(rad);
            
            const isVisible = percent > node.activeAt;
            const opacity = isVisible ? Math.min(1, (percent - node.activeAt) * 5) : 0;
            
            const pathD = \`M \${x} \${y} C \${x * 0.5} \${y * 0.5}, \${x * 0.2} \${y * 0.2}, 0 0\`;
            
            const packetPhase = (percent - node.activeAt) * 3;
            const showPacket = isVisible && packetPhase > 0 && packetPhase < 1;
            
            return (
              <g key={node.id} style={{ opacity, transition: 'opacity 0.3s ease-in' }}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(0, 242, 254, 0.2)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                
                {isVisible && (
                  <circle r="4" fill="#00F2FE" filter="url(#glow-convergence)">
                    <animateMotion
                      dur="1.5s"
                      repeatCount="indefinite"
                      path={pathD}
                      keyPoints="0;1"
                      keyTimes="0;1"
                      calcMode="linear"
                    />
                  </circle>
                )}

                <circle cx={x} cy={y} r="6" fill="#03060E" stroke="#00F2FE" strokeWidth="2" filter="url(#glow-convergence)" />
                <text 
                  x={x + (x > 0 ? 12 : -12)} 
                  y={y + 4} 
                  fill="#00F2FE" 
                  fontSize="10" 
                  fontFamily="monospace"
                  textAnchor={x > 0 ? "start" : "end"}
                  opacity="0.8"
                  letterSpacing="0.1em"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
`;

code = code.replace('const OrionInitializationView', componentsToInsert + '\nconst OrionInitializationView');
fs.writeFileSync('src/components/LoadingScreen.tsx', code);

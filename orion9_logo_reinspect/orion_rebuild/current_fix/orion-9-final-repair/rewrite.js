const fs = require('fs');

const code = `import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

type NodeType = 'SUPPLY' | 'LOGISTICS' | 'INTELLIGENCE' | 'CUSTOMER';
type EdgeType = 'normal' | 'supply' | 'logistics' | 'ai' | 'decision' | 'risk' | 'audit' | 'memory';

interface Node {
  id: string;
  label: string;
  type: NodeType;
  depth: number;
  normX: number;
  normY: number;
}

interface Edge {
  source: string;
  target: string;
  curvature: number;
  type: EdgeType;
}

const NODES: Node[] = [
  // Supply Chain (Primary)
  { id: 'SUP', label: 'SUPPLIERS', type: 'SUPPLY', depth: 0.9, normX: 0.1, normY: 0.15 },
  { id: 'MAT', label: 'MATERIALS', type: 'SUPPLY', depth: 0.85, normX: 0.15, normY: 0.35 },
  { id: 'PRO', label: 'PROCUREMENT', type: 'SUPPLY', depth: 0.95, normX: 0.1, normY: 0.55 },
  { id: 'WAR', label: 'WAREHOUSE', type: 'LOGISTICS', depth: 0.85, normX: 0.15, normY: 0.8 },
  { id: 'INV', label: 'INVENTORY', type: 'LOGISTICS', depth: 0.9, normX: 0.3, normY: 0.85 },
  { id: 'LOG', label: 'LOGISTICS', type: 'LOGISTICS', depth: 0.95, normX: 0.75, normY: 0.8 },
  { id: 'CUS', label: 'CUSTOMERS', type: 'CUSTOMER', depth: 0.9, normX: 0.85, normY: 0.6 },
  { id: 'DEM', label: 'DEMAND', type: 'CUSTOMER', depth: 0.8, normX: 0.9, normY: 0.45 },
  
  // Intelligence (Secondary)
  { id: 'DAT', label: 'DATA', type: 'INTELLIGENCE', depth: 0.6, normX: 0.45, normY: 0.15 },
  { id: 'AI', label: 'AI', type: 'INTELLIGENCE', depth: 0.7, normX: 0.6, normY: 0.1 },
  { id: 'RSK', label: 'RISK', type: 'INTELLIGENCE', depth: 0.5, normX: 0.75, normY: 0.15 },
  { id: 'DEC', label: 'DECISION', type: 'INTELLIGENCE', depth: 0.6, normX: 0.85, normY: 0.25 },
  { id: 'WRK', label: 'WORKFLOW', type: 'INTELLIGENCE', depth: 0.5, normX: 0.25, normY: 0.25 },
  { id: 'MEM', label: 'MEMORY', type: 'INTELLIGENCE', depth: 0.4, normX: 0.55, normY: 0.25 },
  { id: 'AUD', label: 'AUDIT', type: 'INTELLIGENCE', depth: 0.5, normX: 0.85, normY: 0.85 },
];

const EDGES: Edge[] = [
  { source: 'SUP', target: 'MAT', curvature: 0.15, type: 'supply' },
  { source: 'MAT', target: 'PRO', curvature: -0.1, type: 'supply' },
  { source: 'PRO', target: 'WAR', curvature: 0.15, type: 'supply' },
  { source: 'WAR', target: 'INV', curvature: -0.15, type: 'logistics' },
  { source: 'INV', target: 'LOG', curvature: 0.25, type: 'logistics' },
  { source: 'LOG', target: 'CUS', curvature: -0.15, type: 'logistics' },
  { source: 'CUS', target: 'DEM', curvature: 0.1, type: 'normal' },
  
  { source: 'SUP', target: 'DAT', curvature: -0.2, type: 'normal' },
  { source: 'PRO', target: 'WRK', curvature: 0.2, type: 'normal' },
  { source: 'INV', target: 'DAT', curvature: 0.15, type: 'normal' },
  { source: 'LOG', target: 'AUD', curvature: 0.1, type: 'audit' },
  { source: 'DEM', target: 'AI', curvature: -0.2, type: 'ai' },
  
  { source: 'DAT', target: 'AI', curvature: 0.1, type: 'ai' },
  { source: 'AI', target: 'RSK', curvature: -0.1, type: 'risk' },
  { source: 'AI', target: 'DEC', curvature: 0.15, type: 'decision' },
  { source: 'AI', target: 'MEM', curvature: -0.1, type: 'memory' },
  { source: 'RSK', target: 'DEC', curvature: 0.1, type: 'decision' },
  { source: 'DEC', target: 'WRK', curvature: -0.2, type: 'decision' },
  { source: 'WRK', target: 'PRO', curvature: 0.15, type: 'normal' },
  { source: 'DEC', target: 'LOG', curvature: 0.1, type: 'decision' },
];

const COLORS: Record<string, {r:number, g:number, b:number}> = {
  normal: { r: 0, g: 195, b: 255 },
  supply: { r: 0, g: 242, b: 254 },
  logistics: { r: 56, g: 189, b: 248 },
  ai: { r: 125, g: 255, b: 255 },
  decision: { r: 224, g: 242, b: 254 },
  risk: { r: 251, g: 146, b: 60 },
  audit: { r: 167, g: 139, b: 250 },
  memory: { r: 139, g: 92, b: 246 },
};

function getColorStr(type: EdgeType, alpha: number) {
  const c = COLORS[type] || COLORS.normal;
  return \`rgba(\${c.r}, \${c.g}, \${c.b}, \${alpha})\`;
}

interface Particle {
  id: number;
  edgeIndex: number;
  progress: number;
  speed: number;
  type: EdgeType;
  active: boolean;
}

export const OrionLiveWallpaper: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;
    
    const nodeActivations = new Map<string, number>();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;
    const handleMotionPreference = (e: MediaQueryListEvent) => { prefersReducedMotion = e.matches; };
    mediaQuery.addEventListener('change', handleMotionPreference);

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = \`\${width}px\`;
      canvas.style.height = \`\${height}px\`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Particles
    const particles: Particle[] = [];
    let particleIdCounter = 0;

    const spawnParticle = (forceType?: EdgeType) => {
      if (prefersReducedMotion && particles.length > 10) return;
      if (particles.length > 50) return;
      
      const edgeIndex = Math.floor(Math.random() * EDGES.length);
      const edge = EDGES[edgeIndex];
      const type = forceType || (Math.random() > 0.8 ? edge.type : 'normal');
      
      // Rare risk
      if (type === 'risk' && Math.random() > 0.1) return;
      
      particles.push({
        id: particleIdCounter++,
        edgeIndex,
        progress: 0,
        speed: prefersReducedMotion ? 0.001 : 0.002 + Math.random() * 0.003,
        type,
        active: true
      });
    };

    let lastSpawn = 0;
    
    // Orbital Arcs
    const ORBITALS = [
      { cx: 0.5, cy: 0.5, rx: 0.6, ry: 0.4, angle: 15, speed: 0.0001, alpha: 0.03 },
      { cx: 0.3, cy: 0.6, rx: 0.8, ry: 0.5, angle: -20, speed: -0.00008, alpha: 0.02 },
      { cx: 0.7, cy: 0.4, rx: 0.5, ry: 0.7, angle: 45, speed: 0.00012, alpha: 0.015 },
    ];

    const ENV_PARTICLES = Array.from({ length: 40 }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.5 + 0.5,
      speedY: -0.0001 - Math.random() * 0.0002,
      phase: Math.random() * Math.PI * 2,
    }));

    const getNodePos = (node: Node) => {
      const cx = width / 2;
      const cy = height / 2;
      const dx = mouseRef.current.x > 0 ? (mouseRef.current.x - cx) : 0;
      const dy = mouseRef.current.y > 0 ? (mouseRef.current.y - cy) : 0;
      
      const parallaxFactor = prefersReducedMotion ? 0 : (node.depth - 0.5) * 0.03;
      
      return {
        x: node.normX * width - dx * parallaxFactor,
        y: node.normY * height - dy * parallaxFactor
      };
    };

    const getBezierCurve = (p1: {x:number, y:number}, p2: {x:number, y:number}, curvature: number) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      
      const nx = -dy / dist;
      const ny = dx / dist;
      
      const cpX = midX + nx * dist * curvature;
      const cpY = midY + ny * dist * curvature;
      
      return { cpX, cpY };
    };

    const getPointOnQuadraticBezier = (p0: {x:number, y:number}, p1: {x:number, y:number}, p2: {x:number, y:number}, t: number) => {
      const x = Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x;
      const y = Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y;
      return { x, y };
    };

    const render = (now: number) => {
      time = now;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw atmospheric center glow
      const cx = width / 2;
      const cy = height / 2;
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.7);
      bgGrad.addColorStop(0, 'rgba(0, 242, 254, 0.03)');
      bgGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.01)');
      bgGrad.addColorStop(1, 'rgba(2, 5, 10, 0)');
      
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Orbital Arcs
      ORBITALS.forEach((orb) => {
        ctx.save();
        ctx.translate(orb.cx * width, orb.cy * height);
        ctx.rotate((orb.angle + now * orb.speed) * Math.PI / 180);
        ctx.beginPath();
        ctx.ellipse(0, 0, orb.rx * width, orb.ry * height, 0, 0, Math.PI * 2);
        ctx.strokeStyle = \`rgba(255, 255, 255, \${orb.alpha})\`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });

      // 3. Draw Environmental Particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ENV_PARTICLES.forEach(p => {
        p.y += p.speedY;
        if (p.y < 0) p.y = 1;
        const px = p.x * width;
        const py = p.y * height;
        const alpha = 0.1 + Math.sin(now * 0.001 + p.phase) * 0.1;
        ctx.globalAlpha = prefersReducedMotion ? 0.05 : alpha;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Spawning
      if (now - lastSpawn > (prefersReducedMotion ? 2000 : 300)) {
        spawnParticle();
        lastSpawn = now;
      }

      const nodePositions = new Map<string, {x:number, y:number}>();
      NODES.forEach(n => nodePositions.set(n.id, getNodePos(n)));

      // 4. Draw Edges
      EDGES.forEach((edge) => {
        const p1 = nodePositions.get(edge.source)!;
        const p2 = nodePositions.get(edge.target)!;
        const { cpX, cpY } = getBezierCurve(p1, p2, edge.curvature);
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(cpX, cpY, p2.x, p2.y);
        
        let edgeAlpha = 0.05;
        if (edge.type === 'supply' || edge.type === 'logistics') edgeAlpha = 0.15;
        if (edge.type === 'ai' || edge.type === 'decision') edgeAlpha = 0.1;

        ctx.strokeStyle = getColorStr(edge.type, edgeAlpha);
        ctx.lineWidth = edge.type === 'supply' || edge.type === 'logistics' ? 1.5 : 1;
        ctx.stroke();
      });

      for (const [id, val] of nodeActivations.entries()) {
        if (val > 0) {
          nodeActivations.set(id, val - 0.02);
        } else {
          nodeActivations.delete(id);
        }
      }

      // 5. Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;
        
        if (p.progress >= 1) {
          const targetId = EDGES[p.edgeIndex].target;
          nodeActivations.set(targetId, 1.0);
          particles.splice(i, 1);
          continue;
        }

        const edge = EDGES[p.edgeIndex];
        const p1 = nodePositions.get(edge.source)!;
        const p2 = nodePositions.get(edge.target)!;
        const { cpX, cpY } = getBezierCurve(p1, p2, edge.curvature);
        
        const pos = getPointOnQuadraticBezier(p1, p2, {x: cpX, y: cpY}, p.progress);
        
        const trailLength = 0.15;
        const trailStart = Math.max(0, p.progress - trailLength);
        
        ctx.beginPath();
        const startPos = getPointOnQuadraticBezier(p1, p2, {x: cpX, y: cpY}, trailStart);
        ctx.moveTo(startPos.x, startPos.y);
        
        let steps = 5;
        for (let j = 1; j <= steps; j++) {
          const t = trailStart + (p.progress - trailStart) * (j / steps);
          const tp = getPointOnQuadraticBezier(p1, p2, {x: cpX, y: cpY}, t);
          ctx.lineTo(tp.x, tp.y);
        }
        
        const grad = ctx.createLinearGradient(startPos.x, startPos.y, pos.x, pos.y);
        grad.addColorStop(0, getColorStr(p.type, 0));
        grad.addColorStop(1, getColorStr(p.type, 0.8));
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = getColorStr(p.type, 0.4);
        ctx.fill();
      }

      // 6. Draw Nodes
      NODES.forEach(node => {
        const pos = nodePositions.get(node.id)!;
        const isPrimary = node.type === 'SUPPLY' || node.type === 'LOGISTICS' || node.type === 'CUSTOMER';
        const activation = nodeActivations.get(node.id) || 0;
        
        const baseColor = COLORS[node.type.toLowerCase()] || COLORS.normal;
        
        const r = isPrimary ? 4.5 : 3;
        
        const haloR = r + 4 + (activation * 6);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = \`rgba(\${baseColor.r}, \${baseColor.g}, \${baseColor.b}, \${0.1 + activation * 0.3})\`;
        ctx.fill();
        
        if (isPrimary) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + 2 + activation, 0, Math.PI * 2);
          ctx.strokeStyle = \`rgba(\${baseColor.r}, \${baseColor.g}, \${baseColor.b}, \${0.3 + activation * 0.4})\`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = \`rgba(\${baseColor.r}, \${baseColor.g}, \${baseColor.b}, \${0.8 + activation * 0.2})\`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillStyle = \`rgba(255, 255, 255, \${0.4 + activation * 0.4})\`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, pos.x, pos.y + 16 + (activation * 2));
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      mediaQuery.removeEventListener('change', handleMotionPreference);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#02050A]">
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-none"
      />
    </div>
  );
};
`
fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);

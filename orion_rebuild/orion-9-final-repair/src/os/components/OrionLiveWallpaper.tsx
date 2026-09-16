import React, { useRef, useEffect } from 'react';
import { useBranding } from '../../store/BrandingContext';
import { cn } from '../../lib/utils';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface NodeDef {
  id: string;
  label: string;
  rx: number; // offset from globe center (-1 to 1)
  ry: number;
  color: string;
  radius: number;
}

interface PathDef {
  from: string;
  to: string;
  curvature: number;
}

const NODES: NodeDef[] = [
  // Surrounding the globe
  { id: 'suppliers', label: 'SUPPLIERS', rx: -0.7, ry: -0.35, color: 'cyan', radius: 4 },
  { id: 'materials', label: 'MATERIALS', rx: -0.85, ry: -0.1, color: 'cyan', radius: 4 },
  { id: 'procurement', label: 'PROCUREMENT', rx: -0.7, ry: 0.15, color: 'cyan', radius: 5 },
  { id: 'warehouse', label: 'WAREHOUSE', rx: -0.5, ry: 0.35, color: 'cyan', radius: 6 },
  { id: 'inventory', label: 'INVENTORY', rx: -0.2, ry: 0.45, color: 'cyan', radius: 5 },
  { id: 'logistics', label: 'LOGISTICS', rx: 0.15, ry: 0.3, color: 'cyan', radius: 5 },
  { id: 'customers', label: 'CUSTOMERS', rx: 0.4, ry: 0.25, color: 'cyan', radius: 4 },
  
  // Intelligence closer to the globe
  { id: 'data', label: 'DATA', rx: -0.3, ry: -0.4, color: 'violet', radius: 4 },
  { id: 'ai', label: 'AI', rx: 0.1, ry: -0.35, color: 'blue', radius: 4 },
  { id: 'risk', label: 'RISK', rx: 0.25, ry: -0.15, color: 'amber', radius: 4 },
  { id: 'decision', label: 'DECISION', rx: 0.05, ry: 0.0, color: 'purple', radius: 5 },
  { id: 'workflow', label: 'WORKFLOW', rx: -0.15, ry: 0.1, color: 'blue', radius: 4 },
  { id: 'audit', label: 'AUDIT', rx: 0.3, ry: 0.1, color: 'blue', radius: 3 },
  { id: 'memory', label: 'MEMORY', rx: -0.45, ry: -0.15, color: 'violet', radius: 3 },
  { id: 'demand', label: 'DEMAND', rx: 0.45, ry: -0.05, color: 'cyan', radius: 4 },
];

const PATHS: PathDef[] = [
  { from: 'suppliers', to: 'materials', curvature: 0.2 },
  { from: 'materials', to: 'procurement', curvature: 0.2 },
  { from: 'procurement', to: 'warehouse', curvature: 0.2 },
  { from: 'warehouse', to: 'inventory', curvature: 0.2 },
  { from: 'inventory', to: 'logistics', curvature: 0.2 },
  { from: 'logistics', to: 'customers', curvature: 0.2 },
  
  { from: 'data', to: 'ai', curvature: 0.1 },
  { from: 'ai', to: 'risk', curvature: 0.1 },
  { from: 'risk', to: 'decision', curvature: 0.1 },
  { from: 'decision', to: 'workflow', curvature: -0.1 },
  { from: 'workflow', to: 'audit', curvature: 0.1 },
  { from: 'memory', to: 'decision', curvature: 0.1 },
  { from: 'decision', to: 'procurement', curvature: 0.1 },
  
  // Cross routes
  { from: 'suppliers', to: 'data', curvature: 0.1 },
  { from: 'customers', to: 'demand', curvature: 0.1 },
  { from: 'demand', to: 'procurement', curvature: -0.2 },
  { from: 'workflow', to: 'warehouse', curvature: 0.1 },
];

interface Particle {
  pathIndex: number;
  progress: number;
  speed: number;
  color: string;
}

export function OrionLiveWallpaper({ isShuttingDown }: { isShuttingDown?: boolean }) {
  const shuttingDownRef = useRef(isShuttingDown);
  useEffect(() => {
    shuttingDownRef.current = isShuttingDown;
  }, [isShuttingDown]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { branding } = useBranding();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId: number;
    
    // System State
    const particles: Particle[] = [];
    const nodeState: Record<string, { pulse: number, active: number }> = {};
    NODES.forEach(n => {
      nodeState[n.id] = { pulse: 0, active: 0 };
    });
    
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    window.addEventListener('resize', resize);
    resize();

    // Mouse Parallax
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let parallaxX = 0;
    let parallaxY = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      targetParallaxX = (mouseX / width - 0.5) * 20; // max 10px parallax
      targetParallaxY = (mouseY / height - 0.5) * 20;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const isReducedMotion = () => document.documentElement.classList.contains('reduced-motion');
        const isTrueTone = () => document.documentElement.classList.contains('true-tone');

    const getColor = (colorStr: string, alpha: number = 1) => {
      const light = false;
      const trueTone = isTrueTone();
      switch(colorStr) {
        case 'cyan': return light ? (trueTone ? `rgba(0, 140, 170, ${alpha})` : `rgba(0, 160, 190, ${alpha})`) : (trueTone ? `rgba(0, 220, 235, ${alpha})` : `rgba(0, 242, 254, ${alpha})`);
        case 'blue': return light ? (trueTone ? `rgba(2, 110, 170, ${alpha})` : `rgba(2, 132, 199, ${alpha})`) : (trueTone ? `rgba(40, 170, 230, ${alpha})` : `rgba(56, 189, 248, ${alpha})`);
        case 'violet': return light ? (trueTone ? `rgba(120, 80, 220, ${alpha})` : `rgba(139, 92, 246, ${alpha})`) : (trueTone ? `rgba(150, 120, 230, ${alpha})` : `rgba(167, 139, 250, ${alpha})`);
        case 'purple': return light ? (trueTone ? `rgba(150, 50, 200, ${alpha})` : `rgba(168, 85, 247, ${alpha})`) : (trueTone ? `rgba(190, 120, 255, ${alpha})` : `rgba(216, 180, 254, ${alpha})`);
        case 'amber': return light ? (trueTone ? `rgba(190, 100, 5, ${alpha})` : `rgba(217, 119, 6, ${alpha})`) : (trueTone ? `rgba(230, 170, 30, ${alpha})` : `rgba(251, 191, 36, ${alpha})`);
        case 'green': return light ? (trueTone ? `rgba(10, 150, 80, ${alpha})` : `rgba(16, 185, 129, ${alpha})`) : (trueTone ? `rgba(60, 230, 140, ${alpha})` : `rgba(52, 211, 153, ${alpha})`);
        case 'red': return light ? (trueTone ? `rgba(200, 40, 40, ${alpha})` : `rgba(239, 68, 68, ${alpha})`) : (trueTone ? `rgba(255, 100, 100, ${alpha})` : `rgba(248, 113, 113, ${alpha})`);
        case 'white-cyan': return light ? (trueTone ? `rgba(10, 95, 120, ${alpha})` : `rgba(14, 116, 144, ${alpha})`) : (trueTone ? `rgba(180, 230, 235, ${alpha})` : `rgba(207, 250, 254, ${alpha})`);
        default: return trueTone ? `rgba(245, 240, 235, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
      }
    };

    const getBaseColor = (colorStr: string) => {
      switch(colorStr) {
        case 'cyan': return '#00F2FE';
        case 'blue': return '#38BDF8';
        case 'violet': return '#A78BFA';
        case 'purple': return '#D8B4FE';
        case 'amber': return '#FBBF24';
        case 'green': return '#34D399';
        case 'red': return '#F87171';
        case 'white-cyan': return '#CFFAFE';
        default: return '#FFFFFF';
      }
    }

    // Stars
    const numStars = 150;
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.0005,
    }));

    let time = 0;
    const startTime = Date.now();
    let shutdownStartTime: number | null = null;

    const spawnPacket = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 3500 || shuttingDownRef.current) return; // Wait until phase 4
      const reduced = isReducedMotion();
      const density = reduced ? 0.01 : 0.03;
      if (Math.random() > density) return;
      
      const pathIndex = Math.floor(Math.random() * PATHS.length);
      const path = PATHS[pathIndex];
      const sourceNode = NODES.find(n => n.id === path.from);
      
      // Select color logic based on destination
      let pColor = sourceNode?.color || 'cyan';
      if (path.to === 'risk') pColor = 'amber';
      if (path.to === 'decision') pColor = 'purple';
      if (path.to === 'ai') pColor = 'blue';

      particles.push({
        pathIndex,
        progress: 0,
        speed: reduced ? (0.001 + Math.random() * 0.0015) : (0.002 + Math.random() * 0.002),
        color: pColor
      });
    };

    const getGlobeCenter = () => {
      // Globe on the right
      const cx = width * 0.65;
      const cy = height * 0.55;
      return { cx, cy };
    };

    const getNodePos = (n: NodeDef, cx: number, cy: number, pX: number, pY: number) => {
      // rx and ry are relative to half width/height
      const x = cx + n.rx * (width * 0.5) + pX * (1 + Math.abs(n.rx));
      const y = cy + n.ry * (height * 0.5) + pY * (1 + Math.abs(n.ry));
      return { x, y };
    };

    const getCurve = (p1: any, p2: any, curvature: number) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const midX = p1.x + dx / 2;
      const midY = p1.y + dy / 2;
      // Normal vector
      const nx = -dy;
      const ny = dx;
      
      const cpX = midX + nx * curvature;
      const cpY = midY + ny * curvature;
      return { cpX, cpY };
    };

    const draw = () => {
      if (shuttingDownRef.current && !shutdownStartTime) {
        shutdownStartTime = Date.now();
      }
      time += 0.01;
      const light = false;
      const trueTone = isTrueTone();
      const reduced = isReducedMotion();

      parallaxX += (targetParallaxX - parallaxX) * 0.05;
      parallaxY += (targetParallaxY - parallaxY) * 0.05;

      const { cx: globeX, cy: globeY } = getGlobeCenter();
      const globeRadius = Math.min(width, height) * 0.35;

      // 1. BACKGROUND
      if (light) {
        ctx.fillStyle = trueTone ? '#F7F6F1' : '#F4F5F3';
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#02050A');
        bgGrad.addColorStop(1, '#050A14');
        ctx.fillStyle = bgGrad;
      }
      ctx.fillRect(0, 0, width, height);

      // 1.5 Nebula / Glows (Dark Mode Only)
      if (!light) {
        const drawNebula = (x: number, y: number, r: number, color1: string, color2: string) => {
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, color1);
          g.addColorStop(0.5, color2);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, width, height);
        };
        drawNebula(width * 0.3 + parallaxX * 0.5, height * 0.4 + parallaxY * 0.5, width * 0.4, 'rgba(0, 242, 254, 0.03)', 'rgba(0, 160, 190, 0.01)');
        drawNebula(width * 0.8 + parallaxX * 0.3, height * 0.7 + parallaxY * 0.3, width * 0.5, 'rgba(139, 92, 246, 0.02)', 'rgba(109, 40, 217, 0.005)');
      }

      // 2. STARS
      if (!light) {
        ctx.fillStyle = '#FFF';
        stars.forEach(s => {
          if (!reduced) s.x -= s.speed;
          if (s.x < 0) s.x = 1;
          const sx = s.x * width + parallaxX * 0.2;
          const sy = s.y * height + parallaxY * 0.2;
          ctx.globalAlpha = s.opacity + Math.sin(time * 2 + s.x * 100) * 0.1;
          ctx.beginPath();
          ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }

      // 3. EARTH / GLOBE / WORLD MODEL
      const elapsed = Date.now() - startTime;
      let globeAlpha = Math.min(1, Math.max(0, (elapsed - 2000) / 2000));
      if (shutdownStartTime) {
        globeAlpha = Math.min(1, Math.max(0, 1 - (Date.now() - shutdownStartTime - 1000) / 1000));
      }
      ctx.globalAlpha = globeAlpha;
      const gX = globeX + parallaxX * 0.8;
      const gY = globeY + parallaxY * 0.8;
      
      ctx.beginPath();
      ctx.arc(gX, gY, globeRadius, 0, Math.PI * 2);
      
      // Globe fill
      if (light) {
        const globeGrad = ctx.createRadialGradient(gX - globeRadius * 0.3, gY - globeRadius * 0.3, 0, gX, gY, globeRadius);
        globeGrad.addColorStop(0, '#FFFFFF');
        globeGrad.addColorStop(0.7, '#E2E8F0');
        globeGrad.addColorStop(1, '#CBD5E1');
        ctx.fillStyle = globeGrad;
      } else {
        const globeGrad = ctx.createRadialGradient(gX - globeRadius * 0.3, gY - globeRadius * 0.3, 0, gX, gY, globeRadius);
        globeGrad.addColorStop(0, '#0F172A');
        globeGrad.addColorStop(0.6, '#020617');
        globeGrad.addColorStop(1, '#000000');
        ctx.fillStyle = globeGrad;
      }
      ctx.fill();

      // Globe Rim Glow
      ctx.beginPath();
      ctx.arc(gX, gY, globeRadius, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = getColor('cyan', light ? 0.2 : 0.3);
      ctx.stroke();

      if (!light) {
        // Inner shadow / atmospheric edge
        const atmosGrad = ctx.createRadialGradient(gX, gY, globeRadius * 0.8, gX, gY, globeRadius);
        atmosGrad.addColorStop(0, 'transparent');
        atmosGrad.addColorStop(1, 'rgba(0, 242, 254, 0.15)');
        ctx.fillStyle = atmosGrad;
        ctx.fill();
        
        // City Lights / Network on Globe
        // A simple pattern of dots mapped inside the sphere
        ctx.save();
        ctx.clip();
        ctx.fillStyle = 'rgba(251, 191, 36, 0.6)'; // Amber lights
        const lightsSeed = 12345; // Deterministic pseudo-random
        let lr = lightsSeed;
        const random = () => { lr = (lr * 9301 + 49297) % 233280; return lr / 233280; };
        for(let i=0; i<300; i++) {
          const u = random();
          const v = random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          // Rotation
          const rotTheta = theta + (reduced ? 0 : time * 0.05);
          
          const sinPhi = Math.sin(phi);
          const x = sinPhi * Math.cos(rotTheta);
          const y = sinPhi * Math.sin(rotTheta);
          const z = Math.cos(phi);
          
          if (z > 0) { // Front hemisphere
            const px = gX + x * globeRadius;
            const py = gY + y * globeRadius;
            ctx.globalAlpha = Math.max(0, z) * (0.3 + 0.7 * random());
            ctx.beginPath();
            ctx.arc(px, py, random() * 1.2 + 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      ctx.globalAlpha = 1;

      // Orbital Rings
      let orbitAlpha = Math.min(1, Math.max(0, (elapsed - 1000) / 1500));
      if (shutdownStartTime) {
        orbitAlpha = Math.min(1, Math.max(0, 1 - (Date.now() - shutdownStartTime - 500) / 1000));
      }
      const drawOrbit = (rx: number, ry: number, angle: number, opacity: number) => {
        ctx.globalAlpha = orbitAlpha;
        ctx.beginPath();
        ctx.ellipse(gX, gY, rx, ry, angle, 0, Math.PI * 2);
        ctx.strokeStyle = getColor('cyan', opacity);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      };
      
      drawOrbit(globeRadius * 1.3, globeRadius * 1.8, Math.PI / 6, light ? 0.1 : 0.05);
      drawOrbit(globeRadius * 1.5, globeRadius * 1.2, -Math.PI / 8, light ? 0.08 : 0.04);
      drawOrbit(globeRadius * 1.8, globeRadius * 1.6, Math.PI / 3, light ? 0.05 : 0.03);

      // ORION CORE (Inside the globe or slightly overlaid)
      const coreX = gX;
      const coreY = gY;
      ctx.beginPath();
      ctx.arc(coreX, coreY, 6, 0, Math.PI * 2);
      ctx.fillStyle = getColor('cyan', light ? 0.6 : 0.8);
      ctx.shadowColor = getColor('cyan', 1);
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // 4. PATHS
      let pathAlpha = Math.min(1, Math.max(0, (elapsed - 2500) / 1500));
      if (shutdownStartTime) {
        pathAlpha = Math.min(1, Math.max(0, 1 - (Date.now() - shutdownStartTime) / 1000));
      }
      ctx.globalAlpha = pathAlpha;
      PATHS.forEach(path => {
        const fromN = NODES.find(n => n.id === path.from)!;
        const toN = NODES.find(n => n.id === path.to)!;
        const p1 = getNodePos(fromN, gX, gY, parallaxX, parallaxY);
        const p2 = getNodePos(toN, gX, gY, parallaxX, parallaxY);
        const { cpX, cpY } = getCurve(p1, p2, path.curvature);
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(cpX, cpY, p2.x, p2.y);
        ctx.strokeStyle = getColor(fromN.color, light ? 0.15 : 0.1);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      ctx.globalAlpha = 1;

      // 5. PACKETS
      spawnPacket();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;
        
        const path = PATHS[p.pathIndex];
        const fromN = NODES.find(n => n.id === path.from)!;
        const toN = NODES.find(n => n.id === path.to)!;
        
        if (p.progress >= 1) {
          nodeState[path.to].pulse = 1.0;
          particles.splice(i, 1);
          continue;
        }
        
        const p1 = getNodePos(fromN, gX, gY, parallaxX, parallaxY);
        const p2 = getNodePos(toN, gX, gY, parallaxX, parallaxY);
        const { cpX, cpY } = getCurve(p1, p2, path.curvature);
        
        const t = p.progress;
        const x = Math.pow(1-t, 2) * p1.x + 2 * (1-t) * t * cpX + Math.pow(t, 2) * p2.x;
        const y = Math.pow(1-t, 2) * p1.y + 2 * (1-t) * t * cpY + Math.pow(t, 2) * p2.y;
        
        // Packet Trail
        ctx.beginPath();
        ctx.moveTo(x, y);
        const trailLen = 0.1;
        const t2 = Math.max(0, p.progress - trailLen);
        const tailX = Math.pow(1-t2, 2) * p1.x + 2 * (1-t2) * t2 * cpX + Math.pow(t2, 2) * p2.x;
        const tailY = Math.pow(1-t2, 2) * p1.y + 2 * (1-t2) * t2 * cpY + Math.pow(t2, 2) * p2.y;
        
        const grad = ctx.createLinearGradient(x, y, tailX, tailY);
        grad.addColorStop(0, getColor(p.color, light ? 0.9 : 1));
        grad.addColorStop(1, getColor(p.color, 0));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        
        // Packet Head
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = light ? '#FFF' : getColor(p.color, 1);
        ctx.shadowColor = getColor(p.color, 1);
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 6. NODES
      let nodeAlpha = Math.min(1, Math.max(0, (elapsed - 3000) / 1000));
      if (shutdownStartTime) {
        nodeAlpha = Math.min(1, Math.max(0, 1 - (Date.now() - shutdownStartTime - 1500) / 1000));
      }
      ctx.globalAlpha = nodeAlpha;
      NODES.forEach(n => {
        const pos = getNodePos(n, gX, gY, parallaxX, parallaxY);
        const state = nodeState[n.id];
        
        // Decay
        if (state.pulse > 0) state.pulse = Math.max(0, state.pulse - (reduced ? 0.05 : 0.03));
        
        // Outer Rings (Idle)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, n.radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = getColor(n.color, light ? 0.2 : 0.15);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pulse Ring
        if (state.pulse > 0) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, n.radius + 4 + (1 - state.pulse) * 12, 0, Math.PI * 2);
          ctx.strokeStyle = getColor(n.color, state.pulse * 0.5);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Core
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, n.radius + (state.pulse * 2), 0, Math.PI * 2);
        ctx.fillStyle = getColor(n.color, 0.4 + state.pulse * 0.6);
        ctx.shadowColor = getColor(n.color, 1);
        ctx.shadowBlur = (state.pulse > 0) ? 12 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = getColor(n.color, light ? 0.7 : 0.6);
        ctx.font = `${light ? '500' : '400'} 9px 'JetBrains Mono', monospace`;
        ctx.fillText(n.label, pos.x + 12, pos.y + 3);
      });

      ctx.globalAlpha = 1;

      // 7. BRANDING & STATIC OVERLAYS (Handled by React mostly, but we can draw some technical accents)
      ctx.fillStyle = getColor('cyan', light ? 0.3 : 0.2);
      ctx.font = "300 9px 'JetBrains Mono', monospace";
      ctx.fillText("OBSERVE", width - 100, 80);
      ctx.fillText("ANALYZE", width - 100, 95);
      ctx.fillText("ANTICIPATE", width - 100, 110);
      ctx.fillText("ACT", width - 100, 125);
      
      ctx.fillText("INTELLIGENCE IN MOTION", width - 150, height - 80);
      
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Removed dependencies so it doesn't remount

  return (
    <>
      <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
    <div className="absolute top-[12vh] left-[5vw] pointer-events-none z-10 hidden md:block animate-in fade-in duration-1000 delay-1000 fill-mode-both">
      <div className="flex flex-col gap-3">
        <div className="drop-shadow-2xl scale-125 origin-top-left mb-2"><BrandLogo sizePreset="xl" variant="mark" /></div>
        <div className="text-left">
          <h2 className="font-mono text-[10px] sm:text-xs tracking-[0.2em] text-os-text-secondary uppercase whitespace-nowrap">CONNECTED INTELLIGENCE FOR A MORE RESILIENT TOMORROW</h2>
          <div className="w-8 h-0.5 bg-os-accent mt-3 opacity-50" />
        </div>
      </div>
    </div>
    </>
  );
}

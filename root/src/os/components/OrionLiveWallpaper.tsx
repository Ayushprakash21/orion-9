import React, { useEffect, useRef } from 'react';
import { useBranding } from '../../store/BrandingContext';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface NodeDef {
  id: string;
  label: string;
  rx: number;
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
  { id: 'suppliers', label: 'SUPPLIERS', rx: -0.72, ry: -0.50, color: 'cyan', radius: 5 },
  { id: 'materials', label: 'MATERIALS', rx: -0.92, ry: -0.08, color: 'cyan', radius: 6 },
  { id: 'procurement', label: 'PROCUREMENT', rx: -0.68, ry: 0.25, color: 'cyan', radius: 6 },
  { id: 'warehouse', label: 'WAREHOUSE', rx: -0.46, ry: 0.58, color: 'cyan', radius: 6 },
  { id: 'inventory', label: 'INVENTORY', rx: -0.04, ry: 0.68, color: 'cyan', radius: 5 },
  { id: 'logistics', label: 'LOGISTICS', rx: 0.46, ry: 0.45, color: 'cyan', radius: 5 },
  { id: 'customers', label: 'CUSTOMERS', rx: 0.82, ry: 0.48, color: 'cyan', radius: 5 },
  { id: 'data', label: 'DATA', rx: -0.34, ry: -0.78, color: 'violet', radius: 5 },
  { id: 'ai', label: 'AI', rx: 0.35, ry: -0.68, color: 'blue', radius: 5 },
  { id: 'risk', label: 'RISK', rx: 0.78, ry: -0.26, color: 'amber', radius: 5 },
  { id: 'decision', label: 'DECISION', rx: 0.14, ry: -0.02, color: 'purple', radius: 6 },
  { id: 'workflow', label: 'WORKFLOW', rx: -0.08, ry: 0.17, color: 'blue', radius: 5 },
  { id: 'audit', label: 'AUDIT', rx: 0.70, ry: 0.10, color: 'blue', radius: 4 },
  { id: 'memory', label: 'MEMORY', rx: -0.58, ry: -0.30, color: 'violet', radius: 4 },
  { id: 'demand', label: 'DEMAND', rx: 1.02, ry: -0.02, color: 'cyan', radius: 6 },
];

const PATHS: PathDef[] = [
  { from: 'suppliers', to: 'materials', curvature: 0.12 },
  { from: 'materials', to: 'procurement', curvature: 0.10 },
  { from: 'procurement', to: 'warehouse', curvature: 0.08 },
  { from: 'warehouse', to: 'inventory', curvature: 0.08 },
  { from: 'inventory', to: 'logistics', curvature: 0.10 },
  { from: 'logistics', to: 'customers', curvature: 0.08 },
  { from: 'data', to: 'ai', curvature: 0.08 },
  { from: 'ai', to: 'risk', curvature: 0.08 },
  { from: 'risk', to: 'decision', curvature: 0.08 },
  { from: 'decision', to: 'workflow', curvature: -0.08 },
  { from: 'workflow', to: 'audit', curvature: 0.08 },
  { from: 'memory', to: 'decision', curvature: 0.08 },
  { from: 'decision', to: 'procurement', curvature: 0.08 },
  { from: 'suppliers', to: 'data', curvature: 0.08 },
  { from: 'customers', to: 'demand', curvature: 0.06 },
  { from: 'demand', to: 'procurement', curvature: -0.12 },
  { from: 'workflow', to: 'warehouse', curvature: 0.06 },
];

interface Particle {
  pathIndex: number;
  progress: number;
  speed: number;
  color: string;
}

const COLORS: Record<string, string> = {
  cyan: '#00E7FF',
  blue: '#49AFFF',
  violet: '#9D7BFF',
  purple: '#D29BFF',
  amber: '#FFC857',
};

function mulberry32(seed: number) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function OrionLiveWallpaper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { branding } = useBranding();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 1;
    let height = 1;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;
    let raf = 0;
    let time = 0;
    const start = performance.now();
    const particles: Particle[] = [];
    const nodePulse: Record<string, number> = Object.fromEntries(NODES.map(n => [n.id, 0]));
    const rand = mulberry32(9029);
    const stars = Array.from({ length: 260 }, () => ({
      x: rand(),
      y: rand(),
      r: 0.25 + rand() * 1.25,
      a: 0.12 + rand() * 0.68,
      tw: 0.4 + rand() * 1.8,
      phase: rand() * Math.PI * 2,
    }));
    const dust = Array.from({ length: 120 }, () => ({ x: rand(), y: rand(), r: 8 + rand() * 70, a: 0.01 + rand() * 0.025 }));

    let mouseX = 0;
    let mouseY = 0;
    let parallaxX = 0;
    let parallaxY = 0;
    let targetPX = 0;
    let targetPY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const move = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      targetPX = (mouseX / Math.max(width, 1) - 0.5) * 12;
      targetPY = (mouseY / Math.max(height, 1) - 0.5) * 8;
    };

    const isReduced = () => document.documentElement.classList.contains('reduced-motion');

    const color = (name: string, alpha: number) => {
      const hex = COLORS[name] || '#FFFFFF';
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
    };

    const getGlobe = () => {
      // The globe is deliberately weighted to the right, leaving the exact left branding lane clear.
      const radius = Math.min(width * 0.245, height * 0.39);
      return {
        x: width * 0.58 + parallaxX * 0.45,
        y: height * 0.51 + parallaxY * 0.35,
        r: Math.max(150, radius),
      };
    };

    const nodePos = (n: NodeDef, g: { x: number; y: number; r: number }) => ({
      x: g.x + n.rx * g.r * 1.35 + parallaxX * (0.4 + Math.abs(n.rx) * 0.25),
      y: g.y + n.ry * g.r * 1.18 + parallaxY * (0.4 + Math.abs(n.ry) * 0.25),
    });

    const curve = (a: { x: number; y: number }, b: { x: number; y: number }, amount: number) => {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      return { x: mx - dy * amount, y: my + dx * amount };
    };

    const drawNebula = (x: number, y: number, r: number, inner: string, outer: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, inner);
      g.addColorStop(0.45, outer);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    };

    const drawEarth = (g: { x: number; y: number; r: number }) => {
      // Deep spherical body with a luminous atmosphere; all geometry is generated in code.
      const sphere = ctx.createRadialGradient(g.x - g.r * 0.34, g.y - g.r * 0.34, g.r * 0.04, g.x, g.y, g.r * 1.08);
      sphere.addColorStop(0, '#173B59');
      sphere.addColorStop(0.35, '#0A2034');
      sphere.addColorStop(0.72, '#020A12');
      sphere.addColorStop(1, '#000207');
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fillStyle = sphere;
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r - 1, 0, Math.PI * 2);
      ctx.clip();

      // Day/night terminator.
      const day = ctx.createLinearGradient(g.x - g.r, g.y, g.x + g.r * 0.45, g.y);
      day.addColorStop(0, 'rgba(0,0,0,0.72)');
      day.addColorStop(0.45, 'rgba(2,15,26,0.18)');
      day.addColorStop(0.72, 'rgba(10,40,60,0.04)');
      day.addColorStop(1, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = day;
      ctx.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);

      // Procedural landmasses: stable organic polygons, not a raster image.
      const landRand = mulberry32(44);
      const landmasses = [
        { x: -0.28, y: -0.14, sx: 0.26, sy: 0.48 },
        { x: 0.12, y: -0.31, sx: 0.24, sy: 0.28 },
        { x: 0.27, y: 0.02, sx: 0.22, sy: 0.42 },
        { x: -0.02, y: 0.27, sx: 0.38, sy: 0.20 },
        { x: 0.50, y: -0.28, sx: 0.10, sy: 0.16 },
        { x: -0.48, y: 0.32, sx: 0.15, sy: 0.22 },
      ];
      landmasses.forEach((m, mi) => {
        const cx = g.x + m.x * g.r;
        const cy = g.y + m.y * g.r;
        ctx.beginPath();
        const points = 11;
        for (let i = 0; i < points; i++) {
          const a = (i / points) * Math.PI * 2;
          const wobble = 0.72 + landRand() * 0.48;
          const px = cx + Math.cos(a) * g.r * m.sx * wobble;
          const py = cy + Math.sin(a) * g.r * m.sy * (0.78 + landRand() * 0.35);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        const land = ctx.createLinearGradient(cx, cy - g.r * m.sy, cx + g.r * m.sx, cy + g.r * m.sy);
        land.addColorStop(0, `rgba(86,135,115,${0.28 - mi * 0.018})`);
        land.addColorStop(0.65, `rgba(43,92,78,${0.20 - mi * 0.012})`);
        land.addColorStop(1, 'rgba(11,45,44,0.02)');
        ctx.fillStyle = land;
        ctx.fill();
      });

      // City lights concentrated on the night-side hemisphere.
      const cityRand = mulberry32(713);
      for (let i = 0; i < 420; i++) {
        const a = cityRand() * Math.PI * 2;
        const rr = Math.sqrt(cityRand()) * 0.92;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (x < -0.10) continue;
        const px = g.x + x * g.r;
        const py = g.y + y * g.r;
        const glow = 0.15 + cityRand() * 0.65;
        ctx.fillStyle = `rgba(255,196,104,${glow * 0.55})`;
        ctx.fillRect(px, py, 0.8 + cityRand() * 1.1, 0.8 + cityRand() * 1.1);
      }

      // Fine atmospheric cloud bands.
      ctx.lineWidth = Math.max(0.6, g.r * 0.004);
      for (let i = 0; i < 9; i++) {
        const y = g.y - g.r * 0.72 + i * g.r * 0.18;
        ctx.beginPath();
        ctx.ellipse(g.x + Math.sin(time * 0.18 + i) * g.r * 0.08, y, g.r * (0.74 - i * 0.025), g.r * 0.035, -0.10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(120,196,220,${0.025 + (i % 3) * 0.008})`;
        ctx.stroke();
      }
      ctx.restore();

      // Rim and atmosphere.
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(55,190,255,0.34)';
      ctx.lineWidth = Math.max(1, g.r * 0.006);
      ctx.shadowColor = 'rgba(0,180,255,0.50)';
      ctx.shadowBlur = Math.max(8, g.r * 0.05);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const draw = (now: number) => {
      frame += 1;
      const reduced = isReduced();
      time = (now - start) * 0.001;
      parallaxX += (targetPX - parallaxX) * 0.035;
      parallaxY += (targetPY - parallaxY) * 0.035;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#01050A');
      bg.addColorStop(0.52, '#020812');
      bg.addColorStop(1, '#000205');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // A restrained Milky Way band gives the same cosmic language as the supplied reference.
      ctx.save();
      ctx.translate(width * 0.62 + parallaxX * 0.2, height * 0.42 + parallaxY * 0.15);
      ctx.rotate(-0.42);
      const mw = ctx.createLinearGradient(-width * 0.65, 0, width * 0.65, 0);
      mw.addColorStop(0, 'rgba(20,80,125,0)');
      mw.addColorStop(0.28, 'rgba(20,90,140,0.02)');
      mw.addColorStop(0.50, 'rgba(110,155,205,0.075)');
      mw.addColorStop(0.72, 'rgba(30,100,160,0.025)');
      mw.addColorStop(1, 'rgba(20,80,125,0)');
      ctx.fillStyle = mw;
      ctx.filter = 'blur(28px)';
      ctx.fillRect(-width * 0.7, -height * 0.13, width * 1.4, height * 0.26);
      ctx.filter = 'none';
      ctx.restore();

      drawNebula(width * 0.84 + parallaxX, height * 0.20 + parallaxY, width * 0.34, 'rgba(36,92,160,0.055)', 'rgba(16,48,92,0.018)');
      drawNebula(width * 0.08 - parallaxX * 0.4, height * 0.78, width * 0.30, 'rgba(20,78,130,0.035)', 'rgba(4,22,42,0.015)');
      drawNebula(width * 0.70, height * 0.72, width * 0.38, 'rgba(70,45,130,0.028)', 'rgba(30,25,80,0.010)');

      // Stars and subtle moving dust.
      stars.forEach((s) => {
        const drift = reduced ? 0 : time * 0.0015;
        const sx = ((s.x - drift) % 1 + 1) % 1 * width + parallaxX * 0.12;
        const sy = s.y * height + parallaxY * 0.10;
        const twinkle = reduced ? 1 : 0.72 + Math.sin(time * s.tw + s.phase) * 0.28;
        ctx.fillStyle = `rgba(210,235,255,${s.a * twinkle})`;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      dust.forEach((d) => {
        const x = d.x * width + parallaxX * 0.15;
        const y = d.y * height + parallaxY * 0.10;
        const g = ctx.createRadialGradient(x, y, 0, x, y, d.r);
        g.addColorStop(0, `rgba(70,140,190,${d.a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - d.r, y - d.r, d.r * 2, d.r * 2);
      });

      const globe = getGlobe();
      const elapsed = now - start;
      const reveal = Math.min(1, Math.max(0, (elapsed - 300) / 1200));
      ctx.globalAlpha = reveal;
      drawEarth(globe);

      // Orbital intelligence rings.
      const orbitOpacity = 0.18 + Math.sin(time * 0.32) * 0.025;
      [
        [globe.r * 1.28, globe.r * 0.78, 0.14],
        [globe.r * 1.52, globe.r * 1.02, -0.24],
        [globe.r * 1.72, globe.r * 0.72, 0.48],
      ].forEach(([rx, ry, angle], i) => {
        ctx.save();
        ctx.translate(globe.x, globe.y);
        ctx.rotate(angle + (reduced ? 0 : time * (0.003 + i * 0.001)));
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${i === 1 ? '120,95,240' : '0,205,255'},${orbitOpacity * (i === 1 ? 0.65 : 1)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });

      // Network paths and packets.
      const positions = new Map(NODES.map(n => [n.id, nodePos(n, globe)]));
      ctx.globalAlpha = reveal;
      PATHS.forEach((path) => {
        const a = positions.get(path.from)!;
        const b = positions.get(path.to)!;
        const cp = curve(a, b, path.curvature);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cp.x, cp.y, b.x, b.y);
        ctx.strokeStyle = color(NODES.find(n => n.id === path.from)?.color || 'cyan', 0.15);
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      if (!reduced && frame % 2 === 0 && Math.random() < 0.055) {
        const pathIndex = Math.floor(Math.random() * PATHS.length);
        const from = NODES.find(n => n.id === PATHS[pathIndex].from)!;
        particles.push({ pathIndex, progress: 0, speed: 0.0017 + Math.random() * 0.0021, color: from.color });
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;
        const path = PATHS[p.pathIndex];
        const a = positions.get(path.from)!;
        const b = positions.get(path.to)!;
        const cp = curve(a, b, path.curvature);
        if (p.progress >= 1) {
          nodePulse[path.to] = 1;
          particles.splice(i, 1);
          continue;
        }
        const t = p.progress;
        const x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * cp.x + t ** 2 * b.x;
        const y = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * cp.y + t ** 2 * b.y;
        ctx.fillStyle = color(p.color, 0.95);
        ctx.shadowColor = color(p.color, 1);
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      NODES.forEach((n) => {
        const p = positions.get(n.id)!;
        nodePulse[n.id] = Math.max(0, nodePulse[n.id] - (reduced ? 0.035 : 0.022));
        const pulse = nodePulse[n.id];
        ctx.beginPath();
        ctx.arc(p.x, p.y, n.radius + 5 + pulse * 10, 0, Math.PI * 2);
        ctx.strokeStyle = color(n.color, 0.22 + pulse * 0.25);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, n.radius + pulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = color(n.color, 0.52 + pulse * 0.32);
        ctx.shadowColor = color(n.color, 0.8);
        ctx.shadowBlur = 7 + pulse * 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(224,241,250,0.78)';
        ctx.font = "500 9px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textBaseline = 'middle';
        ctx.fillText(n.label, p.x + 12, p.y);
      });

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', move, { passive: true });
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  const logoSrc = branding.logo || branding.logoUrl;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Fixed reference composition: logo and tagline stay in the left visual lane and never move with the globe. */}
      <div className="absolute left-[clamp(40px,4.7vw,80px)] top-[-68px] w-[clamp(270px,19vw,320px)]">
        {logoSrc ? (
          <img src={logoSrc} alt="ORION-9" className="block w-full h-auto object-contain drop-shadow-[0_0_18px_rgba(0,170,255,0.18)]" />
        ) : (
          <BrandLogo sizePreset="hero" variant="mark" />
        )}
      </div>

      <div className="absolute left-[clamp(40px,4.7vw,80px)] top-[clamp(205px,25vh,250px)] w-[clamp(290px,22vw,390px)]">
        <div className="text-[10px] sm:text-[11px] md:text-xs font-mono font-medium tracking-[0.24em] leading-[1.7] text-white/80 uppercase">
          CONNECTED INTELLIGENCE<br />FOR A MORE RESILIENT<br />TOMORROW
        </div>
        <div className="mt-4 h-[2px] w-12 bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 opacity-90" />
      </div>

      <div className="absolute right-[clamp(36px,4vw,68px)] top-[clamp(20px,2.4vh,28px)] border-l border-cyan-300/35 pl-3 font-mono text-[8px] tracking-[0.24em] leading-[2] text-white/55 uppercase">
        <div>OBSERVE</div><div>ANALYZE</div><div>ANTICIPATE</div><div>ACT</div>
      </div>

      <div className="absolute left-[clamp(40px,2.4vw,48px)] bottom-[clamp(54px,8vh,78px)] font-mono uppercase tracking-[0.22em] text-white/45">
        <div className="mb-2 h-[2px] w-10 bg-cyan-300/70" />
        <div className="text-[8px] sm:text-[9px]">SUPPLY CHAIN OPERATING SYSTEM</div>
        <div className="mt-2 text-[7px] tracking-[0.34em]">PEOPLE · DATA · INTELLIGENCE · IMPACT</div>
      </div>

      <div className="absolute right-[clamp(36px,3.8vw,64px)] bottom-[clamp(54px,8vh,78px)] font-mono text-[8px] tracking-[0.24em] text-white/35 uppercase">
        <span className="mr-3 inline-block h-[2px] w-9 align-middle bg-cyan-300/65" /> INTELLIGENCE IN MOTION
      </div>
    </div>
  );
}

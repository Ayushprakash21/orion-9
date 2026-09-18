import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * ORION-9 CINEMATIC HOME LIVE WALLPAPER
 *
 * Belongs to the SAME VISUAL WORLD as the Orion-9 login screen:
 * - Deep midnight blue / charcoal atmosphere
 * - Realistic global supply chain landscape (continents, ports, industrial clusters)
 * - Visual supply chain flow: Supplier -> Factory -> Port -> Transport -> Warehouse -> Customer
 * - Official metallic Orion-9 logo watermark in upper-left corner
 * - Subtle motion only: slow route illumination, occasional node breathing, atmospheric movement
 * - Automatic intensity reduction when application windows are open
 * - Enhanced visibility when desktop is idle
 * - Strictly NO cyberpunk, NO glowing grids, NO HUD cards, NO KPI text
 */

const WALLPAPER_IMAGE = '/orion-desktop-global-network.jpg';
const LOGO_IMAGE = '/orion-9-official-logo.png';

interface OrionLiveWallpaperProps {
  hasOpenWindows?: boolean;
}

interface SCMNode {
  name: string;
  tier: 'supplier' | 'factory' | 'port' | 'transport' | 'warehouse' | 'customer';
  nx: number; // 0..1 normalized coordinate on 16:9 map
  ny: number;
  pulseOffset: number;
  pulseSpeed: number;
  color: string;
  size: number;
}

interface SCMRoute {
  name: string;
  p0: [number, number]; // start [nx, ny]
  cp: [number, number]; // control point [nx, ny]
  p1: [number, number]; // end [nx, ny]
  speed: number;
  offset: number;
  color: string;
}

export function OrionLiveWallpaper({ hasOpenWindows = false }: OrionLiveWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<any>(null);

  // Desktop Idle Detection (18 seconds of user inactivity)
  useEffect(() => {
    const resetIdle = () => {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 18000);
    };

    resetIdle();

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];
    events.forEach(ev => window.addEventListener(ev, resetIdle, { passive: true }));

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach(ev => window.removeEventListener(ev, resetIdle));
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let running = true;

    // Environmental supply chain nodes mapped to the global geography
    const nodes: SCMNode[] = [
      // SUPPLIERS (Raw materials, advanced semiconductors, minerals)
      { name: 'East Asia Silicon Basin', tier: 'supplier', nx: 0.825, ny: 0.420, pulseOffset: 0.1, pulseSpeed: 0.35, color: '#f59e0b', size: 2.2 },
      { name: 'Nordic Advanced Metallurgy', tier: 'supplier', nx: 0.525, ny: 0.205, pulseOffset: 1.4, pulseSpeed: 0.28, color: '#f59e0b', size: 1.8 },
      { name: 'Atacama Chemical Basin', tier: 'supplier', nx: 0.300, ny: 0.680, pulseOffset: 2.2, pulseSpeed: 0.30, color: '#f59e0b', size: 1.8 },
      { name: 'Western Australia Critical Minerals', tier: 'supplier', nx: 0.840, ny: 0.720, pulseOffset: 3.0, pulseSpeed: 0.25, color: '#f59e0b', size: 2.0 },

      // FACTORIES (Advanced industrial manufacturing complexes)
      { name: 'Pearl River Megacomplex', tier: 'factory', nx: 0.793, ny: 0.355, pulseOffset: 0.8, pulseSpeed: 0.40, color: '#38bdf8', size: 2.4 },
      { name: 'Ruhr / Stuttgart Industrial Basin', tier: 'factory', nx: 0.510, ny: 0.285, pulseOffset: 1.9, pulseSpeed: 0.33, color: '#38bdf8', size: 2.2 },
      { name: 'Monterrey Manufacturing Basin', tier: 'factory', nx: 0.215, ny: 0.415, pulseOffset: 2.7, pulseSpeed: 0.35, color: '#38bdf8', size: 2.0 },
      { name: 'Bangalore Precision Instrumentation', tier: 'factory', nx: 0.705, ny: 0.490, pulseOffset: 3.5, pulseSpeed: 0.32, color: '#38bdf8', size: 2.0 },

      // PORTS (Global maritime ocean gateways)
      { name: 'Port of Shanghai', tier: 'port', nx: 0.815, ny: 0.375, pulseOffset: 0.4, pulseSpeed: 0.38, color: '#60a5fa', size: 2.6 },
      { name: 'Port of Rotterdam', tier: 'port', nx: 0.495, ny: 0.272, pulseOffset: 1.1, pulseSpeed: 0.32, color: '#60a5fa', size: 2.5 },
      { name: 'Port of Singapore', tier: 'port', nx: 0.775, ny: 0.575, pulseOffset: 2.0, pulseSpeed: 0.36, color: '#60a5fa', size: 2.5 },
      { name: 'Port of Los Angeles / Long Beach', tier: 'port', nx: 0.165, ny: 0.385, pulseOffset: 2.8, pulseSpeed: 0.34, color: '#60a5fa', size: 2.4 },
      { name: 'Port of Dubai / Jebel Ali', tier: 'port', nx: 0.625, ny: 0.435, pulseOffset: 3.6, pulseSpeed: 0.31, color: '#60a5fa', size: 2.3 },

      // TRANSPORT (Intermodal freight arteries & straits)
      { name: 'Malacca Maritime Strait', tier: 'transport', nx: 0.760, ny: 0.560, pulseOffset: 0.7, pulseSpeed: 0.42, color: '#93c5fd', size: 1.8 },
      { name: 'Suez Maritime Artery', tier: 'transport', nx: 0.565, ny: 0.385, pulseOffset: 1.6, pulseSpeed: 0.38, color: '#93c5fd', size: 1.8 },
      { name: 'Chicago Intermodal Rail Junction', tier: 'transport', nx: 0.235, ny: 0.345, pulseOffset: 2.5, pulseSpeed: 0.35, color: '#93c5fd', size: 2.0 },
      { name: 'Duisburg Inland Rail Hub', tier: 'transport', nx: 0.505, ny: 0.275, pulseOffset: 3.2, pulseSpeed: 0.33, color: '#93c5fd', size: 1.9 },

      // WAREHOUSES (Fulfillment centers & logistics depots)
      { name: 'Frankfurt Central Fulfillment Hub', tier: 'warehouse', nx: 0.515, ny: 0.278, pulseOffset: 0.5, pulseSpeed: 0.30, color: '#fbbf24', size: 2.1 },
      { name: 'Dallas / Fort Worth Regional DC', tier: 'warehouse', nx: 0.220, ny: 0.390, pulseOffset: 1.7, pulseSpeed: 0.32, color: '#fbbf24', size: 2.0 },
      { name: 'Tokyo Kanto Automated Logistics Hub', tier: 'warehouse', nx: 0.865, ny: 0.370, pulseOffset: 2.6, pulseSpeed: 0.36, color: '#fbbf24', size: 2.2 },
      { name: 'Memphis Global Cargo Hub', tier: 'warehouse', nx: 0.245, ny: 0.370, pulseOffset: 3.4, pulseSpeed: 0.34, color: '#fbbf24', size: 2.1 },

      // CUSTOMERS (Global metropolitan consumer demand centers)
      { name: 'Greater London Metropolitan Basin', tier: 'customer', nx: 0.485, ny: 0.268, pulseOffset: 0.2, pulseSpeed: 0.28, color: '#fef08a', size: 2.3 },
      { name: 'Greater New York Metropolitan Basin', tier: 'customer', nx: 0.275, ny: 0.335, pulseOffset: 1.3, pulseSpeed: 0.31, color: '#fef08a', size: 2.4 },
      { name: 'Tokyo Metropolis Consumption Core', tier: 'customer', nx: 0.870, ny: 0.365, pulseOffset: 2.1, pulseSpeed: 0.35, color: '#fef08a', size: 2.4 },
      { name: 'Paris Metropolitan Basin', tier: 'customer', nx: 0.490, ny: 0.285, pulseOffset: 2.9, pulseSpeed: 0.29, color: '#fef08a', size: 2.2 },
      { name: 'Mumbai Metropolitan Basin', tier: 'customer', nx: 0.695, ny: 0.470, pulseOffset: 3.7, pulseSpeed: 0.33, color: '#fef08a', size: 2.3 },
      { name: 'São Paulo Metropolitan Basin', tier: 'customer', nx: 0.335, ny: 0.725, pulseOffset: 4.2, pulseSpeed: 0.27, color: '#fef08a', size: 2.2 },
    ];

    // Primary global logistics arteries (Supplier -> Factory -> Port -> Transport -> Warehouse -> Customer)
    const routes: SCMRoute[] = [
      // Trans-Atlantic Artery (Rotterdam <-> NY/NJ)
      { name: 'Trans-Atlantic Artery', p0: [0.495, 0.272], cp: [0.380, 0.220], p1: [0.275, 0.335], speed: 0.024, offset: 0.15, color: '#e2b36b' },
      // Trans-Pacific Artery (Shanghai <-> LA/Long Beach)
      { name: 'Trans-Pacific Artery', p0: [0.815, 0.375], cp: [0.980, 0.240], p1: [0.165, 0.385], speed: 0.018, offset: 0.60, color: '#38bdf8' },
      // Europe-Asia Maritime Silk Corridor (Rotterdam -> Suez -> Singapore -> Shanghai)
      { name: 'Eurasian Maritime Corridor West', p0: [0.495, 0.272], cp: [0.520, 0.350], p1: [0.565, 0.385], speed: 0.032, offset: 0.30, color: '#e2b36b' },
      { name: 'Eurasian Maritime Corridor Mid', p0: [0.565, 0.385], cp: [0.660, 0.500], p1: [0.775, 0.575], speed: 0.028, offset: 0.75, color: '#e2b36b' },
      { name: 'Eurasian Maritime Corridor East', p0: [0.775, 0.575], cp: [0.810, 0.480], p1: [0.815, 0.375], speed: 0.035, offset: 0.10, color: '#38bdf8' },
      // North American Inland Freight (LA -> Dallas -> Chicago -> NY)
      { name: 'North American Inland Artery', p0: [0.165, 0.385], cp: [0.200, 0.360], p1: [0.220, 0.390], speed: 0.040, offset: 0.45, color: '#e2b36b' },
      { name: 'Heartland Intermodal Link', p0: [0.220, 0.390], cp: [0.230, 0.360], p1: [0.235, 0.345], speed: 0.045, offset: 0.85, color: '#e2b36b' },
      { name: 'East Coast Distribution Link', p0: [0.235, 0.345], cp: [0.255, 0.335], p1: [0.275, 0.335], speed: 0.050, offset: 0.20, color: '#fef08a' },
      // South-North Americas Logistics Artery (Atacama/Santos -> Monterrey -> Dallas)
      { name: 'Latin American Freight Corridor', p0: [0.335, 0.725], cp: [0.260, 0.560], p1: [0.215, 0.415], speed: 0.026, offset: 0.55, color: '#38bdf8' },
      // Intra-Asia High-Density Corridor (Bangalore -> Singapore -> Pearl River -> Tokyo)
      { name: 'Indo-Singapore Maritime Lane', p0: [0.705, 0.490], cp: [0.730, 0.550], p1: [0.775, 0.575], speed: 0.034, offset: 0.40, color: '#38bdf8' },
      { name: 'East Asian Industrial Arc', p0: [0.793, 0.355], cp: [0.835, 0.350], p1: [0.865, 0.370], speed: 0.038, offset: 0.90, color: '#38bdf8' },
      // Australasia Resource Artery (Western Australia -> East Asia)
      { name: 'Australasia Logistics Artery', p0: [0.840, 0.720], cp: [0.830, 0.550], p1: [0.815, 0.375], speed: 0.022, offset: 0.05, color: '#e2b36b' },
    ];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Quadratic Bézier curve point evaluator
    const getBezierPoint = (p0: [number, number], cp: [number, number], p1: [number, number], t: number) => {
      const invT = 1 - t;
      const x = invT * invT * p0[0] + 2 * invT * t * cp[0] + t * t * p1[0];
      const y = invT * invT * p0[1] + 2 * invT * t * cp[1] + t * t * p1[1];
      return [x * width, y * height];
    };

    const draw = (now: number) => {
      if (!running) return;
      const time = now * 0.001;
      const reduced = document.documentElement.classList.contains('reduced-motion');

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Global atmosphere intensity factor
      const intensityFactor = hasOpenWindows ? 0.6 : isIdle ? 1.2 : 0.95;

      // 1. Draw Subtle Routes (extremely faint baseline curves)
      for (const route of routes) {
        const p0x = route.p0[0] * width;
        const p0y = route.p0[1] * height;
        const cpx = route.cp[0] * width;
        const cpy = route.cp[1] * height;
        const p1x = route.p1[0] * width;
        const p1y = route.p1[1] * height;

        // Base route path
        ctx.beginPath();
        ctx.moveTo(p0x, p0y);
        ctx.quadraticCurveTo(cpx, cpy, p1x, p1y);
        ctx.strokeStyle = route.color === '#38bdf8' 
          ? `rgba(56, 189, 248, ${0.04 * intensityFactor})` 
          : `rgba(226, 179, 107, ${0.04 * intensityFactor})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // 2. Slow Route Illumination (gentle luminous bead traveling along the curve)
        if (!reduced) {
          const t = ((time * route.speed + route.offset) % 1 + 1) % 1;
          const [bx, by] = getBezierPoint(route.p0, route.cp, route.p1, t);

          // Soft ambient pulse bead
          const beadGradient = ctx.createRadialGradient(bx, by, 0, bx, by, 8);
          const isGold = route.color === '#e2b36b';
          const r = isGold ? 245 : 56;
          const g = isGold ? 190 : 189;
          const b = isGold ? 115 : 248;

          beadGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.55 * intensityFactor})`);
          beadGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${0.25 * intensityFactor})`);
          beadGradient.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(bx, by, 8, 0, Math.PI * 2);
          ctx.fillStyle = beadGradient;
          ctx.fill();

          // Intense core point
          ctx.beginPath();
          ctx.arc(bx, by, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * intensityFactor})`;
          ctx.fill();
        }
      }

      // 3. Draw Environmental Supply Chain Nodes (calm sinusoidal breathing)
      for (const node of nodes) {
        const nx = node.nx * width;
        const ny = node.ny * height;

        // Slow sinusoidal breath: period 8..14 seconds
        const pulse = reduced ? 0.5 : (Math.sin(time * node.pulseSpeed + node.pulseOffset) + 1) * 0.5;
        const alpha = (0.20 + pulse * 0.45) * intensityFactor;
        const haloRadius = (node.size * 2) + pulse * (node.size * 2.5);

        // Soft outer ambient halo
        const haloGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, haloRadius);
        haloGrad.addColorStop(0, `${node.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`);
        haloGrad.addColorStop(0.5, `${node.color}${Math.round(alpha * 0.35 * 255).toString(16).padStart(2, '0')}`);
        haloGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(nx, ny, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        // Solid core node
        ctx.beginPath();
        ctx.arc(nx, ny, node.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. Extremely Slow Atmospheric Movement (planetary atmosphere breathing sweep)
      if (!reduced) {
        const sweepX = width * (0.5 + Math.sin(time * 0.015) * 0.45);
        const atmGrad = ctx.createRadialGradient(sweepX, height * 0.45, width * 0.1, sweepX, height * 0.45, width * 0.85);
        atmGrad.addColorStop(0, `rgba(56, 189, 248, ${0.025 * intensityFactor})`);
        atmGrad.addColorStop(0.5, `rgba(30, 58, 138, ${0.015 * intensityFactor})`);
        atmGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = atmGrad;
        ctx.fillRect(0, 0, width, height);
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [hasOpenWindows, isIdle]);

  return (
    <div 
      className={cn(
        "orion-live-wallpaper absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#06080e]",
        "transition-all duration-700 ease-out"
      )} 
      aria-hidden="true"
    >
      {/* 1. Global Logistics Network Master Photography / Environmental Base */}
      <img
        src={WALLPAPER_IMAGE}
        alt=""
        className={cn(
          "orion-live-wallpaper-reference absolute inset-0 w-full h-full object-cover object-center",
          "transition-all duration-700 ease-out",
          hasOpenWindows 
            ? "opacity-65 brightness-[0.80] saturate-[0.85]" 
            : isIdle 
              ? "opacity-100 brightness-[1.06] saturate-[1.05]" 
              : "opacity-92 brightness-100 saturate-100"
        )}
        draggable={false}
      />

      {/* 2. Deep Midnight Blue & Charcoal Cinematic Grading Overlay */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-700",
          hasOpenWindows ? "opacity-90" : isIdle ? "opacity-60" : "opacity-75"
        )}
        style={{
          background: `
            radial-gradient(ellipse at 50% 48%, rgba(8, 12, 22, 0.15) 0%, rgba(6, 8, 14, 0.65) 60%, rgba(3, 4, 8, 0.94) 100%),
            linear-gradient(to bottom, rgba(7, 10, 18, 0.40) 0%, transparent 20%, transparent 80%, rgba(4, 6, 12, 0.70) 100%)
          `
        }}
      />

      {/* 3. Soft Atmospheric Horizon / Rim Highlight */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 50%)'
        }}
      />

      {/* 4. Canvas for Route Illumination, Node Activity, and Atmospheric Motion */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />

      {/* 5. Official Orion-9 Metallic Logo Watermark in Left Corner (2nd Image) */}
      <div 
        className={cn(
          "absolute top-14 left-8 z-[2] select-none pointer-events-none transition-all duration-700 ease-out",
          hasOpenWindows 
            ? "opacity-35 scale-95" 
            : isIdle 
              ? "opacity-95 scale-[1.02]" 
              : "opacity-85 scale-100"
        )}
      >
        <img
          src={LOGO_IMAGE}
          alt="ORION-9 Supply Chain Intelligence"
          className="w-44 sm:w-48 lg:w-52 h-auto object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] filter brightness-105"
          draggable={false}
        />
      </div>
    </div>
  );
}


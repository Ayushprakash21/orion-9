import React, { useEffect, useRef } from 'react';

/**
 * ORION-9 HOME LIVE WALLPAPER
 *
 * The supplied ORION-9 master wallpaper is the visual source of truth.
 * It is rendered as the full-screen base so composition, logo, typography,
 * globe and tagline remain exactly as designed. A transparent canvas adds
 * restrained live motion on top without replacing or redrawing the artwork.
 */
const REFERENCE_WALLPAPER = '/orion-9-live-wallpaper-reference.png';

interface Spark {
  x: number;
  y: number;
  size: number;
  alpha: number;
  phase: number;
  speed: number;
}

interface OrbitPacket {
  orbit: number;
  progress: number;
  speed: number;
  direction: 1 | -1;
}

export function OrionLiveWallpaper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    let time = 0;

    const seed = 9029;
    let randomState = seed;
    const random = () => {
      randomState = (randomState * 1664525 + 1013904223) >>> 0;
      return randomState / 4294967296;
    };

    const sparks: Spark[] = Array.from({ length: 90 }, () => ({
      x: random(),
      y: random(),
      size: 0.35 + random() * 1.15,
      alpha: 0.08 + random() * 0.28,
      phase: random() * Math.PI * 2,
      speed: 0.12 + random() * 0.45,
    }));

    const packets: OrbitPacket[] = Array.from({ length: 10 }, (_, i) => ({
      orbit: i % 3,
      progress: random(),
      speed: 0.035 + random() * 0.045,
      direction: i % 2 ? -1 : 1,
    }));

    const reducedMotion = () => document.documentElement.classList.contains('reduced-motion');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawPacket = (cx: number, cy: number, rx: number, ry: number, angle: number, p: OrbitPacket) => {
      const theta = p.progress * Math.PI * 2 * p.direction;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const localX = rx * cos;
      const localY = ry * sin;
      const x = cx + localX * Math.cos(angle) - localY * Math.sin(angle);
      const y = cy + localX * Math.sin(angle) + localY * Math.cos(angle);

      ctx.save();
      ctx.shadowColor = 'rgba(0, 225, 255, 0.9)';
      ctx.shadowBlur = 9;
      ctx.fillStyle = 'rgba(72, 226, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(x, y, 1.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const draw = (now: number) => {
      if (!running) return;
      time = now * 0.001;
      const reduced = reducedMotion();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Very restrained stellar motion over the reference artwork.
      for (const s of sparks) {
        const drift = reduced ? 0 : time * s.speed * 0.00045;
        const x = ((s.x - drift) % 1 + 1) % 1 * width;
        const y = s.y * height;
        const pulse = reduced ? 1 : 0.72 + Math.sin(time * s.speed + s.phase) * 0.28;
        ctx.fillStyle = `rgba(215,238,255,${s.alpha * pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // The supplied wallpaper's globe is centered around the right-hand side.
      // Motion is deliberately confined to that globe so the exact logo/tagline
      // composition remains untouched.
      const globeR = Math.min(width, height) * 0.29;
      const globeX = width * 0.56;
      const globeY = height * 0.51;

      ctx.save();
      ctx.beginPath();
      ctx.arc(globeX, globeY, globeR * 0.985, 0, Math.PI * 2);
      ctx.clip();

      // Slowly moving atmospheric light across the existing Earth artwork.
      if (!reduced) {
        const sweepX = globeX - globeR * 1.35 + ((time * globeR * 0.12) % (globeR * 2.7));
        const sweep = ctx.createLinearGradient(sweepX - globeR * 0.38, 0, sweepX + globeR * 0.38, 0);
        sweep.addColorStop(0, 'rgba(0,220,255,0)');
        sweep.addColorStop(0.5, 'rgba(80,205,255,0.035)');
        sweep.addColorStop(1, 'rgba(0,220,255,0)');
        ctx.fillStyle = sweep;
        ctx.fillRect(globeX - globeR, globeY - globeR, globeR * 2, globeR * 2);
      }

      // Subtle latitude/longitude scan lines make the globe feel alive without
      // replacing the reference globe with synthetic geometry.
      ctx.lineWidth = 0.55;
      for (let i = -3; i <= 3; i++) {
        const yy = globeY + i * globeR * 0.22;
        const rx = globeR * Math.sqrt(Math.max(0.08, 1 - (i * 0.22) ** 2));
        ctx.beginPath();
        ctx.ellipse(globeX, yy, rx, globeR * 0.018, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(45,180,225,0.045)';
        ctx.stroke();
      }
      for (let i = -3; i <= 3; i++) {
        const xx = globeX + i * globeR * 0.22;
        const ry = globeR * Math.sqrt(Math.max(0.08, 1 - (i * 0.22) ** 2));
        ctx.beginPath();
        ctx.ellipse(xx, globeY, globeR * 0.018, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(45,180,225,0.035)';
        ctx.stroke();
      }
      ctx.restore();

      // Live intelligence packets use the same restrained cyan language as the
      // reference artwork. They sit on existing orbital geometry rather than
      // introducing a second wallpaper composition.
      const orbits = [
        [globeR * 1.20, globeR * 0.64, -0.15],
        [globeR * 1.48, globeR * 0.82, 0.23],
        [globeR * 1.66, globeR * 0.58, -0.38],
      ] as const;

      packets.forEach((p) => {
        if (!reduced) p.progress = (p.progress + p.speed * 0.016) % 1;
        const [rx, ry, angle] = orbits[p.orbit];
        drawPacket(globeX, globeY, rx, ry, angle, p);
      });

      // A tiny atmospheric rim pulse is the only additional globe-wide effect.
      const rimAlpha = 0.035 + (reduced ? 0 : (Math.sin(time * 0.42) + 1) * 0.012);
      ctx.save();
      ctx.beginPath();
      ctx.arc(globeX, globeY, globeR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,220,255,${rimAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

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
  }, []);

  return (
    <div className="orion-live-wallpaper absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <img
        src={REFERENCE_WALLPAPER}
        alt=""
        className="orion-live-wallpaper-reference absolute inset-0 w-full h-full"
        draggable={false}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

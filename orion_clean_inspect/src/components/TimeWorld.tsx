import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe2, Clock3, Search, MapPin, RotateCcw } from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { timezones } from '../lib/timezones';

const R = 2.45;

// Real Earth imagery from the Three.js planet asset set. These are equirectangular
// satellite-derived Earth maps, so the sphere is an actual textured Earth rather
// than a procedural blue sphere. The URL is intentionally remote so the project
// ZIP stays small; the browser caches these assets after the first load.
const EARTH_TEXTURE_URL = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';
const EARTH_NORMAL_URL = 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg';
const EARTH_SPECULAR_URL = 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg';
const EARTH_LIGHTS_URL = 'https://threejs.org/examples/textures/planets/earth_lights_2048.png';
const EARTH_CLOUDS_URL = 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png';

function getOffsetMinutes(tz: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(date);
  const value = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT';
  const m = value.match(/GMT([+-])(\d{2})(?::(\d{2}))?/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0));
}

function getTimeParts(tz: string) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'long' }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || tz;
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || 'GMT';
  return { time: fmt.format(now), name, offset };
}

function longitudeForTimezone(tz: string, date = new Date()) {
  return (getOffsetMinutes(tz, date) / 60) * 15;
}

export const TimeWorldPanel: React.FC = () => {
  const { settings, updateSettings } = useSupplyChain();
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; globe: THREE.Group; frame: number; targetY: number } | null>(null);
  const [selected, setSelected] = useState(settings?.timezone || 'Asia/Kolkata');
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const tz = settings?.timezone || 'Asia/Kolkata';
    setSelected(tz);
  }, [settings?.timezone]);

  const selectedInfo = useMemo(() => {
    const found = timezones.find(t => t.value === selected);
    const p = getTimeParts(selected);
    return { label: found?.label || selected, city: found?.city || selected.split('/').pop()?.replace(/_/g, ' ') || selected, region: found?.region || 'World', ...p };
  }, [selected, now]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = q ? timezones.filter(t => t.label.toLowerCase().includes(q) || t.value.toLowerCase().includes(q) || t.city.toLowerCase().includes(q)) : timezones;
    return arr;
  }, [query]);

  const selectedIndex = Math.max(0, timezones.findIndex(t => t.value === selected));

  const selectZone = (tz: string) => {
    setSelected(tz);
    updateSettings({ timezone: tz });
    const longitude = longitudeForTimezone(tz);
    const globe = sceneRef.current?.globe;
    if (globe) {
      const current = globe.rotation.y;
      const desired = -THREE.MathUtils.degToRad(longitude);
      const twoPi = Math.PI * 2;
      const delta = ((desired - current + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
      sceneRef.current!.targetY = current + delta;
    }
  };

  const selectIndex = (index: number) => {
    const tz = timezones[Math.max(0, Math.min(timezones.length - 1, index))];
    if (tz) selectZone(tz.value);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02070d);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.15, 8.3);

    // Keep the globe fully visible on every aspect ratio, including ultrawide
    // and 4K displays. The camera distance is recalculated from the smaller
    // horizontal/vertical field of view instead of relying on a fixed zoom.
    const fitCameraToGlobe = (w: number, h: number) => {
      const aspect = Math.max(0.1, w / Math.max(1, h));
      camera.aspect = aspect;
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      const limitingFov = Math.min(vFov, hFov);
      const distance = (R / Math.tan(limitingFov / 2)) * 1.12;
      camera.position.z = THREE.MathUtils.clamp(distance, 6.2, 16);
      camera.updateProjectionMatrix();
    };

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x02070d, 0);
    mount.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    scene.add(globe);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    // Start with a deep-space ocean sphere so the globe never flashes white while
    // the real satellite textures are loading. The maps replace it progressively.
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0x07111a),
      emissiveIntensity: 0.34,
      shininess: 28,
      specular: new THREE.Color(0x2a5b7a)
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), earthMaterial);
    globe.add(sphere);

    // Real day-side satellite texture.
    textureLoader.load(EARTH_TEXTURE_URL, (map) => {
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      map.minFilter = THREE.LinearMipmapLinearFilter;
      map.magFilter = THREE.LinearFilter;
      earthMaterial.map = map;
      earthMaterial.color.set(0xffffff);
      earthMaterial.needsUpdate = true;
    });
    textureLoader.load(EARTH_NORMAL_URL, (map) => {
      earthMaterial.normalMap = map;
      earthMaterial.normalScale.set(0.45, 0.45);
      earthMaterial.needsUpdate = true;
    });
    textureLoader.load(EARTH_SPECULAR_URL, (map) => {
      earthMaterial.specularMap = map;
      earthMaterial.needsUpdate = true;
    });
    textureLoader.load(EARTH_LIGHTS_URL, (map) => {
      map.colorSpace = THREE.SRGBColorSpace;
      earthMaterial.emissiveMap = map;
      earthMaterial.emissive.set(0xffffff);
      earthMaterial.emissiveIntensity = 0.32;
      earthMaterial.needsUpdate = true;
    });

    // Thin moving cloud layer keeps the globe visibly alive without hiding the
    // actual continents/oceans.
    textureLoader.load(EARTH_CLOUDS_URL, (map) => {
      map.colorSpace = THREE.SRGBColorSpace;
      const cloudMaterial = new THREE.MeshPhongMaterial({
        map,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        side: THREE.FrontSide
      });
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 48, 48), cloudMaterial);
      clouds.name = 'earth-cloud-layer';
      globe.add(clouds);
    });

    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.003, 48, 24),
      new THREE.MeshBasicMaterial({ color: 0x00d9ff, wireframe: true, transparent: true, opacity: 0.035 })
    );
    globe.add(wire);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.045, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x4dbdff, transparent: true, opacity: 0.09, side: THREE.BackSide, depthWrite: false })
    );
    globe.add(atmosphere);

    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x45bfe8, transparent: true, opacity: 0.055, depthWrite: false });
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const ring = new THREE.RingGeometry(R * Math.sin(phi) * 0.999, R * Math.sin(phi) * 1.001, 128);
      const line = new THREE.LineLoop(ring, gridMaterial);
      line.rotation.x = Math.PI / 2;
      line.position.y = R * Math.cos(phi);
      globe.add(line);
    }
    for (let lon = -180; lon < 180; lon += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 3) {
        const a = THREE.MathUtils.degToRad(lat), b = THREE.MathUtils.degToRad(lon);
        pts.push(new THREE.Vector3(R * Math.cos(a) * Math.cos(b), R * Math.sin(a), R * Math.cos(a) * Math.sin(b)));
      }
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMaterial));
    }

    const markerGroup = new THREE.Group();
    globe.add(markerGroup);
    const step = Math.max(1, Math.floor(timezones.length / 80));
    timezones.filter((_, i) => i % step === 0).forEach(tz => {
      const lon = THREE.MathUtils.degToRad(longitudeForTimezone(tz.value));
      const lat = THREE.MathUtils.degToRad(((tz.city.length * 17) % 120) - 60);
      const pos = new THREE.Vector3(R * Math.cos(lat) * Math.cos(lon), R * Math.sin(lat), R * Math.cos(lat) * Math.sin(lon));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00d9ff }));
      dot.position.copy(pos);
      dot.userData.tz = tz.value;
      markerGroup.add(dot);
    });

    const selectedDot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    selectedDot.userData.selected = true;
    markerGroup.add(selectedDot);

    scene.add(new THREE.AmbientLight(0x7fbfff, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 3, 6);
    scene.add(key);

    const resize = () => {
      const w = Math.max(1, mount.clientWidth), h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      fitCameraToGlobe(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let dragging = false, didDrag = false, lastX = 0, lastY = 0;
    let angularVelocity = 0.055; // radians/sec — intentionally slow and smooth
    let lastFrame = performance.now();
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      didDrag = false;
      lastX = e.clientX;
      lastY = e.clientY;
      angularVelocity = 0;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) didDrag = true;
      globe.rotation.y += dx * 0.0045;
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + dy * 0.0025, -0.8, 0.8);
      if (sceneRef.current) sceneRef.current.targetY = globe.rotation.y;
      // Carry a small amount of horizontal drag momentum into the idle rotation.
      angularVelocity = THREE.MathUtils.lerp(angularVelocity, dx * 0.012, 0.18);
      lastX = e.clientX; lastY = e.clientY;
    };
    const up = (e?: PointerEvent) => {
      dragging = false;
      if (e && renderer.domElement.hasPointerCapture(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = mount.getBoundingClientRect();
      const aspect = Math.max(0.1, rect.width / Math.max(1, rect.height));
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      const minFit = (R / Math.tan(Math.min(vFov, hFov) / 2)) * 0.82;
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.0025, minFit, 18);
    };
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerup', up);
    renderer.domElement.addEventListener('pointercancel', up);
    renderer.domElement.addEventListener('wheel', wheel, { passive: false });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const click = (e: PointerEvent) => {
      if (dragging || didDrag) {
        didDrag = false;
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(markerGroup.children, false);
      const tz = hits.find(h => typeof h.object.userData.tz === 'string')?.object.userData.tz as string | undefined;
      if (tz) {
        setSelected(tz);
        updateSettings({ timezone: tz });
      }
    };
    renderer.domElement.addEventListener('click', click);

    const animate = (time: number) => {
      const dt = Math.min(0.05, Math.max(0, (time - lastFrame) / 1000));
      lastFrame = time;

      if (!dragging) {
        angularVelocity = THREE.MathUtils.lerp(angularVelocity, 0.055, 1 - Math.exp(-dt * 2.2));
        const targetY = sceneRef.current?.targetY ?? globe.rotation.y;
        globe.rotation.y += (targetY - globe.rotation.y) * (1 - Math.exp(-dt * 10));
        globe.rotation.y += angularVelocity * dt;
        if (sceneRef.current) sceneRef.current.targetY = globe.rotation.y;
      }

      const lon = THREE.MathUtils.degToRad(longitudeForTimezone(selected));
      selectedDot.position.set(R * Math.cos(0) * Math.cos(lon), 0, R * Math.cos(0) * Math.sin(lon));
      renderer.render(scene, camera);
      sceneRef.current!.frame = requestAnimationFrame(animate);
    };
    sceneRef.current = { renderer, scene, camera, globe, targetY: globe.rotation.y, frame: requestAnimationFrame(animate) };

    return () => {
      cancelAnimationFrame(sceneRef.current?.frame || 0);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('pointercancel', up);
      renderer.domElement.removeEventListener('wheel', wheel);
      renderer.domElement.removeEventListener('click', click);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse(obj => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (Array.isArray(m.material)) m.material.forEach(x => x.dispose()); else if (m.material) m.material.dispose();
      });
      sceneRef.current = null;
    };
  }, []);

  return (
    <div className="time-world-panel h-full w-full min-h-0 bg-[#02070d] text-os-text-primary flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3"><Globe2 className="w-5 h-5 text-cyan-300" /><div><h1 className="text-lg font-medium">Time & World</h1><p className="text-[11px] text-os-text-muted">Global time zones and local time</p></div></div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-os-text-muted"><Clock3 size={14} /> LIVE</div>
      </div>
      <div className="time-world-layout flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(300px,24vw,420px)] 2xl:grid-cols-[minmax(0,1fr)_clamp(340px,22vw,460px)]">
        <div className="relative min-h-0 h-full border-r border-white/10 overflow-hidden">
          <div ref={mountRef} className="absolute inset-0" />
          <div className="absolute left-[clamp(16px,1.5vw,28px)] top-[clamp(14px,1.4vw,24px)] pointer-events-none z-10"><div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">World time field</div><div className="text-xs text-os-text-muted mt-1">Live Earth · drag to rotate · wheel to zoom</div></div>
          <div className="absolute left-1/2 bottom-[clamp(14px,1.5vw,26px)] -translate-x-1/2 text-center pointer-events-none z-10"><div className="font-mono text-2xl tracking-wider">{selectedInfo.time}</div><div className="text-xs text-os-text-secondary mt-1">{selectedInfo.name}</div><div className="text-[10px] font-mono text-cyan-300 mt-1">{selectedInfo.offset}</div></div>
        </div>
        <aside className="min-h-0 flex flex-col bg-black/20">
          <div className="p-[clamp(12px,1vw,20px)] border-b border-white/10">
            <div className="text-[10px] uppercase tracking-widest text-os-text-muted mb-2">Selected time zone</div>
            <div className="text-sm font-medium">{selectedInfo.city}</div><div className="text-[11px] text-os-text-muted mt-1">{selected}</div>
            <div className="mt-3 flex items-center gap-2"><MapPin size={13} className="text-cyan-300" /><span className="text-[10px] font-mono text-cyan-300">{selectedInfo.offset}</span></div>
          </div>
          <div className="p-[clamp(12px,1vw,20px)] border-b border-white/10">
            <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-os-text-muted" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search time zones..." className="w-full h-9 pl-9 pr-3 rounded-md bg-os-input-bg border border-os-border text-xs outline-none focus:border-cyan-400/60" /></div>
          </div>
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-os-text-muted">Timezone navigator</span>
              <span className="text-[9px] font-mono text-os-text-muted">{selectedIndex + 1} / {timezones.length}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, timezones.length - 1)}
              step={1}
              value={selectedIndex}
              onChange={e => selectIndex(Number(e.target.value))}
              className="w-full h-1.5 accent-cyan-400 cursor-pointer"
              aria-label="Select time zone"
            />
            <div className="flex justify-between mt-1 text-[8px] font-mono text-os-text-muted"><span>UTC−12</span><span>UTC</span><span>UTC+14</span></div>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {filtered.map(tz => {
              const offset = getTimeParts(tz.value).offset;
              return <button key={tz.value} onClick={() => selectZone(tz.value)} className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-colors ${selected === tz.value ? 'bg-cyan-400/10 border border-cyan-400/30' : 'border border-transparent hover:bg-white/[0.04]'}`}><div className="flex justify-between gap-3"><span className="text-[11px] text-os-text-primary truncate">{tz.city.replace(/_/g, ' ')}</span><span className="text-[9px] font-mono text-cyan-300 shrink-0">{offset}</span></div><div className="text-[9px] text-os-text-muted truncate">{tz.value}</div></button>;
            })}
          </div>
          <div className="p-3 border-t border-white/10 flex justify-end"><button onClick={() => selectZone('UTC')} className="text-[10px] text-os-text-muted hover:text-cyan-300 flex items-center gap-1.5"><RotateCcw size={12}/> Reset to UTC</button></div>
        </aside>
      </div>
    </div>
  );
};

export const TimeWorld = () => <TimeWorldPanel />;

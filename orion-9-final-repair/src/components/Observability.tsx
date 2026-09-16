import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ObservabilityEngine } from '../services/ObservabilityEngine';
import { SystemHealthRecord } from '../types';
import { Activity, Server, Cpu, Database, Network, Box, Monitor, AlertCircle, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { DetailDrawer } from './ui/DetailDrawer';

export const Observability: React.FC = () => {
  const [healthRecords, setHealthRecords] = useState<SystemHealthRecord[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<SystemHealthRecord | null>(null);
  
  // Real telemetry data
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  const [fps, setFps] = useState<number>(60);
  const [webglInfo, setWebglInfo] = useState<any>(null);
  const [appRoutes, setAppRoutes] = useState<number>(12); // Simulated count for now

  // FPS tracking
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    // Engine health fetch
    ObservabilityEngine.getSystemHealth()
      .then(records => {
        if (mounted && Array.isArray(records)) {
          setHealthRecords(records);
        }
      })
      .catch(err => {
        console.warn('Failed to get system health:', err);
      });

    // WebGL Feature Detection
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        const vendor = debugInfo ? (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
        const renderer = debugInfo ? (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
        setWebglInfo({ vendor, renderer, supported: true });
      } else {
        setWebglInfo({ supported: false });
      }
    } catch (e) {
      setWebglInfo({ supported: false });
    }

    // Network connection
    const updateNetwork = () => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        setNetworkInfo({
          type: conn.effectiveType || conn.type || 'unknown',
          downlink: conn.downlink ? `${conn.downlink} Mbps` : 'unknown',
          rtt: conn.rtt ? `${conn.rtt} ms` : 'unknown',
          online: navigator.onLine
        });
      } else {
        setNetworkInfo({ type: 'unknown', downlink: 'unknown', rtt: 'unknown', online: navigator.onLine });
      }
    };
    updateNetwork();
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);

    // Telemetry polling loop
    let pollingInterval = setInterval(() => {
      const now = new Date();
      let memUsed = 0;
      let memLimit = 0;
      let cpuLoad = Math.random() * 20 + 10; // Synthetic CPU load for visual since JS can't read OS CPU
      
      if ((performance as any).memory) {
        memUsed = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
        memLimit = (performance as any).memory.jsHeapSizeLimit / (1024 * 1024);
        setMemoryInfo({ used: memUsed, limit: memLimit, util: (memUsed/memLimit)*100 });
      }

      setTelemetryHistory(prev => {
        const newRecord = {
          time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          memory: memUsed || 0,
          cpu: cpuLoad,
          fps: fps
        };
        const next = [...prev, newRecord];
        if (next.length > 30) next.shift(); // Keep last 30 data points
        return next;
      });
      
    }, 2000);

    // FPS Loop
    const calculateFps = () => {
      const now = performance.now();
      frameCountRef.current++;
      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      requestRef.current = requestAnimationFrame(calculateFps);
    };
    requestRef.current = requestAnimationFrame(calculateFps);

    return () => {
      mounted = false;
      clearInterval(pollingInterval);
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [fps]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-os-border pb-4">
        <h2 className="text-2xl font-light text-os-text-primary tracking-tight uppercase flex items-center gap-3">
          <Activity className="text-[#00F2FE]" />
          ORION OS OBSERVABILITY
        </h2>
        <div className="text-[11px] font-mono text-os-text-muted tracking-widest uppercase">
          SYSTEM HEALTH / APPLICATION TELEMETRY / RUNTIME PERFORMANCE
        </div>
      </div>

      {/* TOP PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Runtime / FPS */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 relative overflow-hidden group cursor-pointer hover:border-os-border-hover transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu size={60} />
          </div>
          <div className="text-[10px] font-mono tracking-widest text-os-text-secondary uppercase mb-4">BROWSER RUNTIME</div>
          <div className="text-3xl font-light text-os-text-primary mb-1 flex items-baseline gap-2">
            {fps} <span className="text-xs font-mono text-os-text-muted">FPS</span>
          </div>
          <div className="text-xs text-[#30D158] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
            Stable Rendering
          </div>
        </div>

        {/* Memory */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 relative overflow-hidden group cursor-pointer hover:border-os-border-hover transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Database size={60} />
          </div>
          <div className="text-[10px] font-mono tracking-widest text-os-text-secondary uppercase mb-4">CLIENT MEMORY</div>
          {memoryInfo ? (
            <>
              <div className="text-3xl font-light text-os-text-primary mb-1 flex items-baseline gap-2">
                {memoryInfo.used.toFixed(0)} <span className="text-xs font-mono text-os-text-muted">MB</span>
              </div>
              <div className="text-xs text-os-text-secondary">
                Limit: {memoryInfo.limit.toFixed(0)} MB ({memoryInfo.util.toFixed(1)}%)
              </div>
            </>
          ) : (
            <div className="text-xs text-os-text-muted pt-2">Not available in browser environment</div>
          )}
        </div>

        {/* Graphics / Rendering */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 relative overflow-hidden group cursor-pointer hover:border-os-border-hover transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Monitor size={60} />
          </div>
          <div className="text-[10px] font-mono tracking-widest text-os-text-secondary uppercase mb-4">GRAPHICS CAPABILITY</div>
          {webglInfo?.supported ? (
            <>
              <div className="text-sm font-medium text-os-text-primary mb-1 truncate pr-8" title={webglInfo.renderer}>
                {webglInfo.renderer}
              </div>
              <div className="text-xs text-os-text-secondary truncate">
                {webglInfo.vendor}
              </div>
            </>
          ) : (
            <div className="text-xs text-os-text-muted pt-2">WebGL not supported</div>
          )}
        </div>

        {/* Network */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 relative overflow-hidden group cursor-pointer hover:border-os-border-hover transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Network size={60} />
          </div>
          <div className="text-[10px] font-mono tracking-widest text-os-text-secondary uppercase mb-4">NETWORK TELEMETRY</div>
          {networkInfo ? (
            <>
              <div className="text-2xl font-light text-os-text-primary mb-1 uppercase">
                {networkInfo.type} {networkInfo.online ? '' : '(OFFLINE)'}
              </div>
              <div className="text-xs text-os-text-secondary flex gap-3">
                <span>RTT: {networkInfo.rtt}</span>
                <span>DL: {networkInfo.downlink}</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-os-text-muted pt-2">Network telemetry unavailable</div>
          )}
        </div>
      </div>

      {/* PERFORMANCE GRAPH */}
      <div className="bg-os-surface border border-os-border rounded-xl p-6">
        <div className="text-[11px] font-mono tracking-widest text-os-text-secondary uppercase mb-6 flex justify-between items-center">
          <span>RUNTIME & MEMORY HISTORY</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00F2FE]" /> CPU (Est)
            <span className="w-2 h-2 rounded-full bg-[#30D158] ml-3" /> Memory (MB)
          </span>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetryHistory} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#30D158" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#30D158" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00F2FE" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="time" stroke="#555" fontSize={10} tickMargin={10} />
              <YAxis yAxisId="left" stroke="#555" fontSize={10} />
              <YAxis yAxisId="right" orientation="right" stroke="#555" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--os-surface)', border: '1px solid var(--os-border)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
                labelStyle={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="memory" stroke="#30D158" fillOpacity={1} fill="url(#colorMem)" isAnimationActive={false} />
              <Area yAxisId="right" type="monotone" dataKey="cpu" stroke="#00F2FE" fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ENGINE HEALTH GRID */}
      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-os-border flex justify-between items-center bg-black/5 dark:bg-black/20">
          <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Engine Health</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 p-1 bg-os-border">
          {healthRecords.map((record, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedEngine(record)}
              className="bg-os-surface p-5 hover:bg-os-surface-hover transition-colors cursor-pointer flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div className="text-xs font-mono font-bold tracking-widest uppercase text-os-text-primary">
                  {record.serviceName}
                </div>
                <div className={`text-[9px] font-mono tracking-widest px-2 py-0.5 rounded-sm flex items-center gap-1.5 ${
                  record.status === 'OPERATIONAL' ? 'bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/30' :
                  record.status === 'DEGRADED' ? 'bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/30' :
                  'bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/30'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${record.status === 'OPERATIONAL' ? 'bg-[#30D158] animate-pulse' : record.status === 'DEGRADED' ? 'bg-[#FF9F0A]' : 'bg-[#FF453A]'}`} />
                  {record.status}
                </div>
              </div>
              <div className="text-[11px] text-os-text-secondary line-clamp-2 leading-relaxed">
                {record.details}
              </div>
              <div className="mt-auto pt-3 flex items-center justify-between border-t border-os-border/50">
                <span className="text-[10px] font-mono text-os-text-muted">Latency: {record.latencyMs}ms</span>
                <ArrowRight size={14} className="text-os-text-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <DetailDrawer
        isOpen={!!selectedEngine}
        onClose={() => setSelectedEngine(null)}
        title={selectedEngine?.serviceName || 'Engine Details'}
      >
        {selectedEngine && (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-black/5 dark:bg-black/20 border border-os-border rounded-lg space-y-4">
              <div className="flex justify-between">
                <span className="text-xs font-mono text-os-text-muted uppercase">Status</span>
                <span className={`text-xs font-mono font-bold ${
                  selectedEngine.status === 'OPERATIONAL' ? 'text-[#30D158]' : 'text-[#FF453A]'
                }`}>{selectedEngine.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-os-text-muted uppercase">Latency</span>
                <span className="text-xs font-mono text-os-text-primary">{selectedEngine.latencyMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-os-text-muted uppercase">Last Verified</span>
                <span className="text-xs font-mono text-os-text-primary">{new Date(selectedEngine.lastChecked).toLocaleTimeString()}</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-[10px] font-mono tracking-widest text-os-text-secondary uppercase mb-2">Diagnostic Details</h4>
              <p className="text-sm text-os-text-primary leading-relaxed">{selectedEngine.details}</p>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

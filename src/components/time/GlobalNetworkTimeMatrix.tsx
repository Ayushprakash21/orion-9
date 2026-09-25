import React, { useState, useEffect } from 'react';
import { Globe, Clock, MapPin, Activity } from 'lucide-react';
import { TimeWorldPanel } from '../TimeWorld';

interface GlobalHub {
  city: string;
  country: string;
  tz: string;
  code: string;
}

const GLOBAL_HUBS: GlobalHub[] = [
  { city: 'London', country: 'United Kingdom', tz: 'Europe/London', code: 'LHR' },
  { city: 'New York', country: 'United States', tz: 'America/New_York', code: 'JFK' },
  { city: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo', code: 'HND' },
  { city: 'Singapore', country: 'Singapore', tz: 'Asia/Singapore', code: 'SIN' },
  { city: 'Dubai', country: 'United Arab Emirates', tz: 'Asia/Dubai', code: 'DXB' },
  { city: 'Paris', country: 'France', tz: 'Europe/Paris', code: 'CDG' },
  { city: 'Frankfurt', country: 'Germany', tz: 'Europe/Berlin', code: 'FRA' },
  { city: 'Mumbai', country: 'India', tz: 'Asia/Kolkata', code: 'BOM' },
  { city: 'Hong Kong', country: 'Hong Kong', tz: 'Asia/Hong_Kong', code: 'HKG' },
  { city: 'Sydney', country: 'Australia', tz: 'Australia/Sydney', code: 'SYD' },
];

function getTimeData(tz: string) {
  const now = new Date();
  try {
    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);

    const offsetParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset'
    }).formatToParts(now);

    const offset = offsetParts.find(p => p.type === 'timeZoneName')?.value || 'UTC';
    
    // Day vs Night check based on hour
    const hourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false
    }).format(now);
    const hour = parseInt(hourStr, 10);
    const isDay = hour >= 6 && hour < 18;

    return { timeStr, offset, isDay };
  } catch (e) {
    return { timeStr: '--:--:--', offset: 'UTC', isDay: true };
  }
}

export const GlobalNetworkTimeMatrix: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 h-full flex flex-col font-sans select-none">
      <div className="flex items-center justify-between shrink-0 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            GLOBAL NETWORK TIME MATRIX
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          SYNCHRONIZED
        </span>
      </div>

      {/* 3D Live Earth Interactive Map Box */}
      <div className="h-[220px] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#02070d] shrink-0 shadow-2xl relative">
        <TimeWorldPanel />
      </div>

      {/* Multi-City Live Hub Matrix Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-1">
          Key Operational Hub Clocks
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {GLOBAL_HUBS.map(hub => {
            const data = getTimeData(hub.tz);
            return (
              <div 
                key={hub.city}
                className="p-3 rounded-xl bg-[#12151a] border border-white/[0.08] hover:border-sky-500/30 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">{hub.city}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400">
                      {hub.code}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin size={10} className="text-sky-400" />
                    <span>{hub.country}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-sky-400 tracking-wider">
                    {data.timeStr}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${data.isDay ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                    <span>{data.offset}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

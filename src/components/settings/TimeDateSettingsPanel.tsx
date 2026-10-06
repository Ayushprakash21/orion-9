/**
 * ORION-9 OS TIME & DATE PANEL
 * 
 * Clean, de-congested OS Settings view for Operating Clock, Timezone, 
 * Date & Time controls, and Responsive World Clocks matrix.
 */

import React, { useState, useEffect } from 'react';
import { Clock, Globe, Calendar, Check, Sliders } from 'lucide-react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useToast } from '../../store/ToastContext';
import { timezones } from '../../lib/timezones';
import { SearchableDropdown } from '../ui/SearchableDropdown';
import { cn } from '../../lib/utils';

interface WorldClockCity {
  city: string;
  country: string;
  tz: string;
  code: string;
}

const WORLD_CITIES: WorldClockCity[] = [
  { city: 'London', country: 'United Kingdom', tz: 'Europe/London', code: 'LHR' },
  { city: 'New York', country: 'United States', tz: 'America/New_York', code: 'JFK' },
  { city: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo', code: 'HND' },
  { city: 'Singapore', country: 'Singapore', tz: 'Asia/Singapore', code: 'SIN' },
  { city: 'Dubai', country: 'UAE', tz: 'Asia/Dubai', code: 'DXB' },
  { city: 'Mumbai', country: 'India', tz: 'Asia/Kolkata', code: 'BOM' },
  { city: 'Frankfurt', country: 'Germany', tz: 'Europe/Berlin', code: 'FRA' },
  { city: 'Hong Kong', country: 'Hong Kong', tz: 'Asia/Hong_Kong', code: 'HKG' },
  { city: 'Sydney', country: 'Australia', tz: 'Australia/Sydney', code: 'SYD' },
];

function getFormattedTime(tz: string, hour12: boolean) {
  const now = new Date();
  try {
    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: hour12
    }).format(now);

    const offsetParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset'
    }).formatToParts(now);

    const offset = offsetParts.find(p => p.type === 'timeZoneName')?.value || 'UTC';
    return { timeStr, offset };
  } catch (e) {
    return { timeStr: '--:--:--', offset: 'UTC' };
  }
}

export const TimeDateSettingsPanel: React.FC = () => {
  const { settings, updateSettings } = useSupplyChain();
  const { showToast } = useToast();

  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [autoTime, setAutoTime] = useState<boolean>(settings?.autoTime !== false);
  const [is24Hour, setIs24Hour] = useState<boolean>(settings?.timeFormat !== '12h');
  const [selectedTimezone, setSelectedTimezone] = useState<string>(settings?.timezone || 'Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState<string>(settings?.dateFormat || 'DD/MM/YYYY');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<string>(settings?.firstDayOfWeek || 'Monday');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setCurrentTimeStr(d.toLocaleTimeString('en-US', {
        timeZone: selectedTimezone,
        hour12: !is24Hour,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));

      setCurrentDateStr(d.toLocaleDateString('en-US', {
        timeZone: selectedTimezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [selectedTimezone, is24Hour]);

  return (
    <div className="space-y-5 font-sans text-white max-w-full">
      {/* SECTION 1 — CURRENT TIME HERO CARD */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">System Clock</span>
            <h3 className="text-xl font-mono font-bold text-sky-400 tracking-tight">{currentTimeStr || '12:00:00'}</h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{currentDateStr}</p>
          </div>
        </div>

        <div className="text-left sm:text-right text-xs border-t sm:border-t-0 border-white/[0.06] pt-2 sm:pt-0">
          <span className="text-slate-400 block text-[10px] uppercase font-mono">Active Timezone</span>
          <span className="text-white font-mono font-semibold">{selectedTimezone}</span>
        </div>
      </div>

      {/* SECTION 2 — DATE & TIME SETTINGS */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Date & Time Settings</h4>

        <div className="divide-y divide-white/[0.06] text-xs">
          {/* Automatic Date & Time */}
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <span className="text-slate-300 font-medium block">Automatic Date & Time</span>
              <span className="text-[11px] text-slate-400">Sync clock automatically using network time protocol (NTP).</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !autoTime;
                setAutoTime(next);
                updateSettings({ autoTime: next });
                showToast(`Automatic time ${next ? 'enabled' : 'disabled'}.`, 'info');
              }}
              className={cn(
                "px-3 py-1 rounded-lg border text-xs font-mono font-semibold transition cursor-pointer",
                autoTime ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-white/[0.05] border-white/10 text-slate-400"
              )}
            >
              {autoTime ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Timezone Selection */}
          <div className="py-3 space-y-1.5">
            <span className="text-slate-300 font-medium block">Time Zone</span>
            <SearchableDropdown
              value={selectedTimezone}
              options={timezones}
              onChange={(val) => {
                setSelectedTimezone(val);
                updateSettings({ timezone: val });
                showToast(`Timezone set to ${val}.`, 'success');
              }}
            />
          </div>

          {/* 24-Hour Clock Toggle */}
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <span className="text-slate-300 font-medium block">24-Hour Clock</span>
              <span className="text-[11px] text-slate-400">Use 24-hour time format (19:44) instead of 12-hour (7:44 PM).</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !is24Hour;
                setIs24Hour(next);
                updateSettings({ timeFormat: next ? '24h' : '12h' });
              }}
              className={cn(
                "px-3 py-1 rounded-lg border text-xs font-mono font-semibold transition cursor-pointer",
                is24Hour ? "bg-sky-500/20 border-sky-500/40 text-sky-400" : "bg-white/[0.05] border-white/10 text-slate-400"
              )}
            >
              {is24Hour ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Date Format */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-300 font-medium">Date Format</span>
            <select
              value={dateFormat}
              onChange={(e) => {
                setDateFormat(e.target.value);
                updateSettings({ dateFormat: e.target.value });
              }}
              className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500/50 font-mono"
            >
              <option value="DD/MM/YYYY" className="bg-[#12151a]">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY" className="bg-[#12151a]">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD" className="bg-[#12151a]">YYYY-MM-DD</option>
            </select>
          </div>

          {/* First Day of Week */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-300 font-medium">First Day of Week</span>
            <select
              value={firstDayOfWeek}
              onChange={(e) => {
                setFirstDayOfWeek(e.target.value);
                updateSettings({ firstDayOfWeek: e.target.value });
              }}
              className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500/50"
            >
              <option value="Monday" className="bg-[#12151a]">Monday</option>
              <option value="Sunday" className="bg-[#12151a]">Sunday</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3 — WORLD CLOCKS */}
      <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Globe size={14} className="text-sky-400" />
            <span>World Clocks</span>
          </h4>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            LIVE SYNCHRONIZED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {WORLD_CITIES.map(city => {
            const data = getFormattedTime(city.tz, !is24Hour);
            return (
              <div
                key={city.city}
                className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-sky-500/30 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <span>{city.city}</span>
                    <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-1 py-0.2 rounded">{city.code}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{city.country}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-sky-400 text-xs">{data.timeStr}</div>
                  <div className="text-[9px] font-mono text-slate-400">{data.offset}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

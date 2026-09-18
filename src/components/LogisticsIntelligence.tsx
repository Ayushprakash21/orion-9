import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { useToast } from '../store/ToastContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { 
  MultimodalFreightShipment, 
  YardDockAppointment, 
  FreightConsolidationPlan, 
  FreightMode, 
  IoTTelemetrySample 
} from '../types/logistics';
import {
  Truck, Navigation, Clock, DollarSign, AlertTriangle, CheckCircle2,
  TrendingDown, Globe, Shuffle, BarChart2, ShieldCheck, ArrowRight,
  Plane, Ship, Train, Anchor, Compass, Activity, Thermometer, Droplets,
  Zap, Cpu, ShieldAlert, Sparkles, Filter, Search, Plus, Eye, RefreshCw,
  Layers, Package, Check, X, Building2, MapPin, Gauge
} from 'lucide-react';

export const LogisticsIntelligence: React.FC = () => {
  const { 
    freightShipments, 
    yardAppointments, 
    consolidationPlans, 
    laneCongestion,
    dispatchFreightConsignment,
    recordIoTTelemetry,
    checkInYardGate,
    dispatchConsolidationPlan,
    approveConsolidationPlan,
    triggerEmergencyReroute,
    currency 
  } = useSupplyChain();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'fleet' | 'telemetry' | 'yard' | 'consolidation'>('fleet');
  const [selectedConsignmentId, setSelectedConsignmentId] = useState<string>(freightShipments[0]?.id || 'FRT-2026-881');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('WH-ORD-01');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [inspectorConsignment, setInspectorConsignment] = useState<MultimodalFreightShipment | null>(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookConsignmentNo, setBookConsignmentNo] = useState<string>('');
  const [bookMode, setBookMode] = useState<FreightMode>('AIR');
  const [bookCarrier, setBookCarrier] = useState<string>('Lufthansa Cargo Special Logistics');
  const [bookCarrierScac, setBookCarrierScac] = useState<string>('GEC');
  const [bookOrigin, setBookOrigin] = useState<string>('Frankfurt CargoCity (EDDF)');
  const [bookDest, setBookDest] = useState<string>('Chicago O’Hare (KORD)');
  const [bookCost, setBookCost] = useState<number>(24500);
  const [bookColdChain, setBookColdChain] = useState<boolean>(true);
  const [bookMinTemp, setBookMinTemp] = useState<number>(-25);
  const [bookMaxTemp, setBookMaxTemp] = useState<number>(-18);

  // Emergency Reroute Modal State
  const [showRerouteModal, setShowRerouteModal] = useState<boolean>(false);
  const [rerouteConsignmentId, setRerouteConsignmentId] = useState<string>('');
  const [rerouteNewPort, setRerouteNewPort] = useState<string>('Tanjung Pelepas Secondary Bypass Hub');
  const [rerouteCost, setRerouteCost] = useState<number>(4500);
  const [rerouteReason, setRerouteReason] = useState<string>('Malacca Strait Monsoon Congestion Avoidance');

  // Currently selected consignment for telemetry tab
  const activeConsignment = useMemo(() => {
    return freightShipments.find(c => c.id === selectedConsignmentId) || freightShipments[0];
  }, [freightShipments, selectedConsignmentId]);

  // Operational HUD Metrics
  const hudMetrics = useMemo(() => {
    const totalConsignments = freightShipments.length;
    const inTransitConsignments = freightShipments.filter(c => c.status === 'IN_TRANSIT');
    const inTransitFreightValue = inTransitConsignments.reduce((sum, c) => sum + c.freightCost, 0);

    const criticalLanes = laneCongestion.filter(l => l.status === 'CRITICAL_BOTTLENECK');
    const totalDemurrageRisk = freightShipments
      .filter(c => c.demurrageRisk.isAtRisk)
      .reduce((sum, c) => sum + c.demurrageRisk.accruedPenalty + c.demurrageRisk.estimatedAccrualDaily, 0);

    const coldChainShipments = freightShipments.filter(c => c.coldChain && c.coldChain.required);
    const coldChainCompliant = coldChainShipments.filter(c => !c.coldChain.isBreached);
    const coldChainSlaPercent = coldChainShipments.length > 0 
      ? Math.round((coldChainCompliant.length / coldChainShipments.length) * 1000) / 10 
      : 100;

    return {
      totalConsignments,
      inTransitConsignments: inTransitConsignments.length,
      inTransitFreightValue,
      criticalLanesCount: criticalLanes.length,
      primaryChoke: criticalLanes[0] || laneCongestion[0],
      totalDemurrageRisk,
      coldChainSlaPercent,
      activeSensorsCount: freightShipments.length * 4
    };
  }, [freightShipments, laneCongestion]);

  // Filtered Consignments for Tab 1
  const filteredConsignments = useMemo(() => {
    return freightShipments.filter(c => {
      if (modeFilter !== 'ALL' && c.mode !== modeFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesNo = c.consignmentNumber.toLowerCase().includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesCarrier = c.carrierName.toLowerCase().includes(q);
        const matchesOrigin = c.origin.name.toLowerCase().includes(q);
        const matchesDest = c.destination.name.toLowerCase().includes(q);
        if (!matchesId && !matchesNo && !matchesTitle && !matchesCarrier && !matchesOrigin && !matchesDest) {
          return false;
        }
      }
      return true;
    });
  }, [freightShipments, modeFilter, statusFilter, searchQuery]);

  // Filtered Yard Appointments for Tab 3
  const currentFacilityAppointments = useMemo(() => {
    return yardAppointments.filter(a => a.facilityId === selectedFacilityId);
  }, [yardAppointments, selectedFacilityId]);

  // Handle Dispatch from Modal
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) {
      showToast('Consignment title is required.', 'error');
      return;
    }

    const newConsignment: MultimodalFreightShipment = {
      id: `FRT-${Date.now().toString().slice(-6)}`,
      consignmentNumber: bookConsignmentNo.trim() || `BOL-${Math.floor(100000 + Math.random() * 900000)}`,
      title: bookTitle.trim(),
      mode: bookMode,
      carrierId: `c-${Math.floor(Math.random() * 10)}`,
      carrierName: bookCarrier,
      carrierScac: bookCarrierScac,
      origin: {
        name: bookOrigin,
        code: 'ORIG',
        country: 'Transit Hub',
        coordinates: [50.0379, 8.5622],
      },
      destination: {
        name: bookDest,
        code: 'DEST',
        country: 'United States',
        coordinates: [41.9742, -87.9073],
      },
      status: 'BOOKED',
      containerNumber: `ULD-${Math.floor(10000 + Math.random() * 90000)}`,
      vesselOrFlight: 'Dedicated Charter Express',
      totalWeightKg: 1850,
      totalVolumeCbm: 8.5,
      commodity: 'High-Value Strategic Sub-Assemblies',
      carbonFootprintKg: 1200,
      bookingDate: new Date().toISOString(),
      estimatedArrival: new Date(Date.now() + 86400000 * 2).toISOString(),
      freightCost: bookCost,
      currency: 'USD',
      progressPercent: 10,
      coldChain: {
        required: bookColdChain,
        minTempCelsius: bookMinTemp,
        maxTempCelsius: bookMaxTemp,
        targetHumidityPercent: 35,
        isBreached: false,
      },
      demurrageRisk: {
        isAtRisk: false,
        freeTimeDaysRemaining: 7,
        estimatedAccrualDaily: 300,
        accruedPenalty: 0,
        chokePoint: 'Standard Clear Transit',
        lastUpdated: new Date().toISOString(),
      },
      latestTelemetry: {
        timestamp: new Date().toISOString(),
        latitude: 50.0379,
        longitude: 8.5622,
        locationName: bookOrigin,
        temperatureCelsius: (bookMinTemp + bookMaxTemp) / 2,
        humidityPercent: 32,
        shockGForce: 0.08,
        batteryPercent: 100,
        tamperSealIntact: true,
        geofenceStatus: 'AT_WAYPOINT',
      },
      telemetryHistory: [],
      policyCompliance: {
        cleared: bookCost <= 20000,
        requiresApproval: bookCost > 20000,
        sha256Seal: 'pending-evaluation',
      }
    };

    try {
      const dispatched = await dispatchFreightConsignment(newConsignment);
      setShowBookingModal(false);
      if (dispatched.policyCompliance.requiresApproval) {
        showToast(`Consignment ${dispatched.id} ($${formatNumber(dispatched.freightCost)}) routed to Approval Center under POL-LOG-001.`, 'warning');
      } else {
        showToast(`Consignment ${dispatched.id} dispatched successfully.`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch consignment.', 'error');
    }
  };

  // Simulate Telemetry Ping (Breach or Normal)
  const handleSimulateTelemetry = async (isBreach: boolean) => {
    if (!activeConsignment) return;

    const currentTemp = isBreach ? 14.5 : (activeConsignment.coldChain?.minTempCelsius ? (activeConsignment.coldChain.minTempCelsius + activeConsignment.coldChain.maxTempCelsius) / 2 : 21.0);
    const currentShock = isBreach ? 3.4 : 0.15;
    const sample: IoTTelemetrySample = {
      timestamp: new Date().toISOString(),
      latitude: activeConsignment.latestTelemetry.latitude + (Math.random() - 0.5) * 0.2,
      longitude: activeConsignment.latestTelemetry.longitude + (Math.random() - 0.5) * 0.2,
      locationName: isBreach ? 'High-G Impact Detected in Transit' : activeConsignment.latestTelemetry.locationName,
      temperatureCelsius: currentTemp,
      humidityPercent: activeConsignment.latestTelemetry.humidityPercent,
      shockGForce: currentShock,
      batteryPercent: Math.max(10, activeConsignment.latestTelemetry.batteryPercent - 1),
      tamperSealIntact: !isBreach,
      geofenceStatus: isBreach ? 'DEVIATED' : 'INSIDE_CORRIDOR',
    };

    try {
      await recordIoTTelemetry(activeConsignment.id, sample);
      if (isBreach) {
        showToast(`CRITICAL: IoT Sensor breach recorded for ${activeConsignment.id}. Quarantined under POL-LOG-002!`, 'error');
      } else {
        showToast(`IoT Telemetry refreshed for ${activeConsignment.id}. Signals optimal.`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to record telemetry.', 'error');
    }
  };

  // Handle Emergency Reroute Submission
  const handleExecuteReroute = async () => {
    if (!rerouteConsignmentId) return;
    try {
      const updated = await triggerEmergencyReroute(
        rerouteConsignmentId,
        rerouteNewPort,
        rerouteCost,
        rerouteReason
      );
      setShowRerouteModal(false);
      showToast(`Emergency Reroute executed for ${updated.id}. Choke point bypassed.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to execute emergency reroute.', 'error');
    }
  };

  // Helper for Mode Icons
  const renderModeIcon = (mode: FreightMode, size = 16) => {
    switch (mode) {
      case 'OCEAN': return <Ship size={size} className="text-blue-400" />;
      case 'AIR': return <Plane size={size} className="text-amber-400" />;
      case 'RAIL': return <Train size={size} className="text-emerald-400" />;
      case 'ROAD_FTL':
      case 'ROAD_LTL': return <Truck size={size} className="text-orange-400" />;
      default: return <Navigation size={size} className="text-cyan-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#07090E] text-slate-100 overflow-hidden select-none font-sans">
      {/* TOP OPERATIONAL HUD */}
      <div className="flex-none px-6 py-4 border-b border-white/[0.08] bg-[#0B0F17]/90 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[#00F2FE]">
                <Navigation size={20} />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                  Logistics & Multimodal Freight Dispatch
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Layer 4 Kernel / YMS / TMS
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Multimodal linehauls, cold-chain IoT telemetry, yard dock scheduling & AI consolidation engine
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBookingModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Book Multimodal Freight</span>
            </button>

            <button
              onClick={() => handleSimulateTelemetry(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title="Ping all active IoT telemetry beacons"
            >
              <RefreshCw size={13} className="text-cyan-400" />
              <span>Sensor Ping</span>
            </button>
          </div>
        </div>

        {/* 4 HUD Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Card 1: Active Fleet */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">In-Transit Freight</div>
              <div className="text-xl font-bold text-white mt-0.5 flex items-baseline gap-2">
                {hudMetrics.inTransitConsignments} <span className="text-xs font-normal text-slate-400">/ {hudMetrics.totalConsignments} total</span>
              </div>
              <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                ${formatNumber(hudMetrics.inTransitFreightValue)} active value
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Truck size={18} />
            </div>
          </div>

          {/* Card 2: Lane Choke Point */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={12} />
                <span>Transit Bottlenecks</span>
              </div>
              <div className="text-sm font-semibold text-white mt-1 truncate">
                {hudMetrics.primaryChoke?.originPort} → {hudMetrics.primaryChoke?.destinationPort}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                Congestion Index: <span className="text-amber-400 font-bold">{hudMetrics.primaryChoke?.congestionIndex}/100</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 flex-none">
              <Anchor size={18} />
            </div>
          </div>

          {/* Card 3: Cold Chain SLA */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Thermometer size={12} />
                <span>Cold Chain SLA</span>
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">
                {hudMetrics.coldChainSlaPercent}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {hudMetrics.activeSensorsCount} sensors reporting intact
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={18} />
            </div>
          </div>

          {/* Card 4: Demurrage Risk */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} />
                <span>Demurrage Risk Clock</span>
              </div>
              <div className="text-xl font-bold text-rose-400 mt-0.5">
                ${formatNumber(hudMetrics.totalDemurrageRisk)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                2 maritime containers near detention
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
              <DollarSign size={18} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 mt-4 border-t border-white/[0.06] pt-3 text-xs font-medium">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`pb-2 transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'fleet'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>Multimodal Fleet & Consignments ({freightShipments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`pb-2 transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'telemetry'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity size={14} />
            <span>IoT Live Telemetry & Cold Chain</span>
          </button>

          <button
            onClick={() => setActiveTab('yard')}
            className={`pb-2 transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'yard'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 size={14} />
            <span>Yard Management & Dock Doors ({yardAppointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('consolidation')}
            className={`pb-2 transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'consolidation'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>AI Freight Consolidation & Rate Optimizer ({consolidationPlans.length})</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: MULTIMODAL FLEET & CONSIGNMENTS                                     */}
        {/* ========================================================================= */}
        {activeTab === 'fleet' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.08]">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search consignment ID, B/L, carrier, origin, destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white">
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Mode Filter */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Filter size={12} />
                  <span>Mode:</span>
                  <select
                    value={modeFilter}
                    onChange={(e) => setModeFilter(e.target.value)}
                    className="bg-black/50 border border-white/[0.1] text-xs text-slate-200 rounded-md px-2.5 py-1 focus:outline-none"
                  >
                    <option value="ALL">All Modes</option>
                    <option value="OCEAN">Ocean</option>
                    <option value="AIR">Air</option>
                    <option value="RAIL">Rail</option>
                    <option value="ROAD_FTL">Road FTL</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-black/50 border border-white/[0.1] text-xs text-slate-200 rounded-md px-2.5 py-1 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="CUSTOMS_HOLD">Customs Hold</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="EXCEPTION_DIVERTED">Exception Diverted</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Consignments Table */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0B0F17]/60 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
                    <tr>
                      <th className="py-3 px-4">Consignment / Mode</th>
                      <th className="py-3 px-4">Origin & Destination</th>
                      <th className="py-3 px-4">Carrier & Vessel/Flight</th>
                      <th className="py-3 px-4">Transit Progress</th>
                      <th className="py-3 px-4">Telemetry / Cold Chain</th>
                      <th className="py-3 px-4">Demurrage Risk</th>
                      <th className="py-3 px-4">Policy & Freight Cost</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredConsignments.map((c) => {
                      const isBreached = c.coldChain?.isBreached;
                      const hasDemurrageRisk = c.demurrageRisk?.isAtRisk;

                      return (
                        <tr 
                          key={c.id} 
                          className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                          onClick={() => {
                            setInspectorConsignment(c);
                            setIsInspectorOpen(true);
                          }}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                                {renderModeIcon(c.mode, 15)}
                              </div>
                              <div>
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  {c.id}
                                  {isBreached && (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-mono border border-rose-500/30">
                                      HOLD
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {c.consignmentNumber}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-slate-300 font-medium">
                                <span className="text-cyan-400 font-mono text-[10px]">{c.origin.code}</span>
                                <ArrowRight size={11} className="text-slate-500" />
                                <span className="text-cyan-400 font-mono text-[10px]">{c.destination.code}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {c.destination.name}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div>
                              <div className="text-slate-200 font-medium truncate max-w-[170px]">
                                {c.carrierName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {c.vesselOrFlight}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="w-28 space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span>{c.progressPercent}%</span>
                                <span>{c.status.replace('_', ' ')}</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    c.status === 'DELIVERED' 
                                      ? 'bg-emerald-400' 
                                      : isBreached 
                                      ? 'bg-rose-500' 
                                      : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                  }`} 
                                  style={{ width: `${c.progressPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {c.coldChain?.required ? (
                              <div className="space-y-0.5">
                                <div className={`flex items-center gap-1 font-mono text-[11px] font-semibold ${
                                  isBreached ? 'text-rose-400' : 'text-emerald-400'
                                }`}>
                                  <Thermometer size={12} />
                                  <span>{c.latestTelemetry.temperatureCelsius.toFixed(1)}°C</span>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Range: {c.coldChain.minTempCelsius}°C to {c.coldChain.maxTempCelsius}°C
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-500 text-[11px] italic">Ambient (Standard)</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {hasDemurrageRisk ? (
                              <div className="space-y-0.5">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono text-[10px] border border-rose-500/20">
                                  <Clock size={10} />
                                  <span>{c.demurrageRisk.freeTimeDaysRemaining}d Free Time</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  +${c.demurrageRisk.estimatedAccrualDaily}/day accrual
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                                <CheckCircle2 size={10} />
                                <span>Zero Risk</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono text-white font-semibold">
                              ${formatNumber(c.freightCost)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[110px]" title={c.policyCompliance.sha256Seal}>
                              SHA: {c.policyCompliance.sha256Seal.slice(0, 8)}...
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedConsignmentId(c.id);
                                  setActiveTab('telemetry');
                                }}
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-cyan-400 transition-colors"
                                title="Open Live IoT Telemetry"
                              >
                                <Activity size={13} />
                              </button>

                              {hasDemurrageRisk && (
                                <button
                                  onClick={() => {
                                    setRerouteConsignmentId(c.id);
                                    setShowRerouteModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
                                  title="Emergency Reroute"
                                >
                                  <Shuffle size={13} />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setInspectorConsignment(c);
                                  setIsInspectorOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
                                title="Inspect Manifest"
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: IOT LIVE TELEMETRY & COLD CHAIN                                    */}
        {/* ========================================================================= */}
        {activeTab === 'telemetry' && activeConsignment && (
          <div className="space-y-6">
            {/* Consignment Selector Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {renderModeIcon(activeConsignment.mode, 20)}
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono">ACTIVE SENSOR STREAM FOR</div>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    {activeConsignment.title}
                    <span className="text-xs font-mono font-normal text-cyan-400">({activeConsignment.id})</span>
                  </div>
                </div>
              </div>

              {/* Selector and Simulation Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <select
                  value={selectedConsignmentId}
                  onChange={(e) => setSelectedConsignmentId(e.target.value)}
                  className="bg-black/50 border border-white/[0.1] text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  {freightShipments.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.carrierName} ({c.mode})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleSimulateTelemetry(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium cursor-pointer transition-colors"
                >
                  <CheckCircle2 size={13} />
                  <span>Simulate Healthy Ping</span>
                </button>

                <button
                  onClick={() => handleSimulateTelemetry(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-medium cursor-pointer transition-colors"
                >
                  <AlertTriangle size={13} />
                  <span>Simulate Shock Breach (POL-LOG-002)</span>
                </button>
              </div>
            </div>

            {/* 4 Live Sensor Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gauge 1: Temperature */}
              <div className="p-4 rounded-xl bg-[#0B0F17]/80 border border-white/[0.08] relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Thermal Probe A1</span>
                    <h3 className="text-sm font-semibold text-white mt-0.5">Core Cargo Temp</h3>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    activeConsignment.coldChain?.isBreached ? 'bg-rose-500/10 text-rose-400' : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    <Thermometer size={18} />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold font-mono ${
                    activeConsignment.coldChain?.isBreached ? 'text-rose-400' : 'text-white'
                  }`}>
                    {activeConsignment.latestTelemetry.temperatureCelsius.toFixed(1)}°C
                  </span>
                  {activeConsignment.coldChain?.required && (
                    <span className="text-xs text-slate-400">
                      Target: {activeConsignment.coldChain.minTempCelsius}°C - {activeConsignment.coldChain.maxTempCelsius}°C
                    </span>
                  )}
                </div>

                <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${activeConsignment.coldChain?.isBreached ? 'bg-rose-500' : 'bg-cyan-400'}`} 
                    style={{ width: '68%' }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Sensor ID: TH-991</span>
                  <span>{activeConsignment.coldChain?.isBreached ? 'EXCURSION BREACH' : 'CALIBRATED OK'}</span>
                </div>
              </div>

              {/* Gauge 2: Relative Humidity */}
              <div className="p-4 rounded-xl bg-[#0B0F17]/80 border border-white/[0.08]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Moisture Sensor</span>
                    <h3 className="text-sm font-semibold text-white mt-0.5">Relative Humidity</h3>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Droplets size={18} />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {activeConsignment.latestTelemetry.humidityPercent.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400">RH Safe</span>
                </div>

                <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${activeConsignment.latestTelemetry.humidityPercent}%` }} />
                </div>

                <div className="mt-2 flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Threshold: &lt; 65%</span>
                  <span>CONDENSATION SAFE</span>
                </div>
              </div>

              {/* Gauge 3: 3-Axis Shock Accelerometer */}
              <div className="p-4 rounded-xl bg-[#0B0F17]/80 border border-white/[0.08]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Impact Meter</span>
                    <h3 className="text-sm font-semibold text-white mt-0.5">3-Axis Shock (G)</h3>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    activeConsignment.latestTelemetry.shockGForce > 2.5 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    <Activity size={18} />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold font-mono ${
                    activeConsignment.latestTelemetry.shockGForce > 2.5 ? 'text-rose-400' : 'text-white'
                  }`}>
                    {activeConsignment.latestTelemetry.shockGForce.toFixed(2)}G
                  </span>
                  <span className="text-xs text-slate-400">Max Peak</span>
                </div>

                <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      activeConsignment.latestTelemetry.shockGForce > 2.5 ? 'bg-rose-500' : 'bg-amber-400'
                    }`} 
                    style={{ width: `${Math.min(100, activeConsignment.latestTelemetry.shockGForce * 25)}%` }} 
                  />
                </div>

                <div className="mt-2 flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Gate: 2.50G</span>
                  <span>{activeConsignment.latestTelemetry.shockGForce > 2.5 ? 'CRITICAL IMPACT' : 'SMOOTH RIDE'}</span>
                </div>
              </div>

              {/* Gauge 4: Tamper Seal & Geofence */}
              <div className="p-4 rounded-xl bg-[#0B0F17]/80 border border-white/[0.08]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Security Beacon</span>
                    <h3 className="text-sm font-semibold text-white mt-0.5">Cryptographic Seal</h3>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    activeConsignment.latestTelemetry.tamperSealIntact ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    <ShieldCheck size={18} />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className={`text-xl font-bold font-mono ${
                    activeConsignment.latestTelemetry.tamperSealIntact ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {activeConsignment.latestTelemetry.tamperSealIntact ? 'SEAL INTACT' : 'TAMPER BREACH'}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-300 flex items-center gap-1.5 font-mono">
                  <MapPin size={12} className="text-cyan-400" />
                  <span>Geofence: {activeConsignment.latestTelemetry.geofenceStatus}</span>
                </div>

                <div className="mt-2 flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Battery: {activeConsignment.latestTelemetry.batteryPercent}%</span>
                  <span>GPS 3D Fix OK</span>
                </div>
              </div>
            </div>

            {/* Historical Telemetry Trail */}
            <div className="p-5 rounded-xl bg-[#0B0F17]/60 border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Cryptographic IoT In-Transit Event Ledger</h3>
                  <p className="text-xs text-slate-400">Time-stamped waypoint telemetry pings and environmental checkpoints</p>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  {activeConsignment.telemetryHistory?.length || 1} checkpoints logged
                </span>
              </div>

              <div className="space-y-2.5">
                {[activeConsignment.latestTelemetry, ...(activeConsignment.telemetryHistory || [])].map((sample, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 flex-none" />
                      <div>
                        <div className="text-white font-medium">{sample.locationName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(sample.timestamp).toLocaleString()} • Lat: {sample.latitude.toFixed(4)}, Lon: {sample.longitude.toFixed(4)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-[11px]">
                      <span className={sample.temperatureCelsius > 15 ? 'text-amber-400' : 'text-cyan-300'}>
                        {sample.temperatureCelsius.toFixed(1)}°C
                      </span>
                      <span className="text-blue-300">{sample.humidityPercent.toFixed(0)}% RH</span>
                      <span className={sample.shockGForce > 2.0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {sample.shockGForce.toFixed(2)}G
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 text-[10px]">
                        {sample.geofenceStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: YARD MANAGEMENT & DOCK DOORS (YMS)                                  */}
        {/* ========================================================================= */}
        {activeTab === 'yard' && (
          <div className="space-y-6">
            {/* Facility Hub Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Building2 size={16} className="text-cyan-400" />
                  Facility Yard & Dock Door Operations
                </h3>
                <p className="text-xs text-slate-400">Real-time bay occupancy, gate check-in, trailer strip time & demurrage minimization</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Active DC:</span>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="bg-black/50 border border-white/[0.1] text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  <option value="WH-ORD-01">Chicago O’Hare Master Logistics Hub</option>
                  <option value="WH-FRA-02">Frankfurt Gateway Logistics Park</option>
                  <option value="WH-SIN-03">Singapore Jurong East Free Trade Hub</option>
                  <option value="WH-AUS-01">Austin High-Tech Distribution Center</option>
                </select>
              </div>
            </div>

            {/* Visual Dock Door Grid (Bays 1-8) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-mono uppercase text-[11px]">Facility Dock Bay Topology</span>
                <span>8 Active High-Velocity Unload Bays</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentFacilityAppointments.map((apt) => {
                  const isDemurrage = apt.status === 'DEMURRAGE_TRIGGERED';
                  const isUnloading = apt.status === 'UNLOADING';
                  const isAtDoor = apt.status === 'AT_DOCK_DOOR';

                  return (
                    <div 
                      key={apt.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        isDemurrage 
                          ? 'bg-rose-950/20 border-rose-500/30' 
                          : isUnloading 
                          ? 'bg-cyan-950/20 border-cyan-500/30' 
                          : 'bg-[#0B0F17]/80 border-white/[0.08]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">
                          {apt.dockDoor.split(' ')[0]}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          isDemurrage 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                            : isUnloading 
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {apt.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs font-semibold text-slate-200 truncate">{apt.carrier}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Trailer: {apt.trailerNumber}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Driver:</span>
                          <span className="text-slate-200 font-medium">{apt.driverName}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Dwell Time:</span>
                          <span className="text-cyan-400 font-mono">{apt.dwellTimeMinutes} mins</span>
                        </div>
                        {apt.accruedDetentionCost > 0 && (
                          <div className="flex justify-between text-rose-400 font-mono font-semibold">
                            <span>Accrued Penalty:</span>
                            <span>${apt.accruedDetentionCost}</span>
                          </div>
                        )}
                      </div>

                      {/* Advance Gate Button */}
                      <div className="mt-3">
                        {apt.status === 'SCHEDULED' && (
                          <button
                            onClick={() => checkInYardGate(apt.id, 'GATE_CHECKED_IN')}
                            className="w-full py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium cursor-pointer transition-colors"
                          >
                            Check In at Gate
                          </button>
                        )}
                        {apt.status === 'GATE_CHECKED_IN' && (
                          <button
                            onClick={() => checkInYardGate(apt.id, 'AT_DOCK_DOOR')}
                            className="w-full py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-medium cursor-pointer transition-colors"
                          >
                            Spot Trailer at Bay
                          </button>
                        )}
                        {apt.status === 'AT_DOCK_DOOR' && (
                          <button
                            onClick={() => checkInYardGate(apt.id, 'UNLOADING')}
                            className="w-full py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-medium cursor-pointer transition-colors"
                          >
                            Begin Unloading
                          </button>
                        )}
                        {apt.status === 'UNLOADING' && (
                          <button
                            onClick={() => checkInYardGate(apt.id, 'COMPLETED')}
                            className="w-full py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium cursor-pointer transition-colors"
                          >
                            Complete & Release Dock
                          </button>
                        )}
                        {apt.status === 'DEMURRAGE_TRIGGERED' && (
                          <button
                            onClick={() => checkInYardGate(apt.id, 'COMPLETED')}
                            className="w-full py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-medium cursor-pointer transition-colors"
                          >
                            Clear Penalty & Release
                          </button>
                        )}
                        {apt.status === 'COMPLETED' && (
                          <div className="text-center text-[10px] text-emerald-400 font-mono py-1">
                            ✓ Bay Stripped & Inspected
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AI FREIGHT CONSOLIDATION & RATE OPTIMIZER                         */}
        {/* ========================================================================= */}
        {activeTab === 'consolidation' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-[#00F2FE]" />
                  AI Autonomous Freight Consolidation & Green Mode Shifting
                </h3>
                <p className="text-xs text-slate-400">Algorithmic LTL-to-FTL route bundling, multimodal rail modal shift & scope 3 carbon abatement</p>
              </div>

              <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                Total Projected Savings: $12,150 / 4,460 kg CO₂
              </span>
            </div>

            {/* Consolidation Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {consolidationPlans.map((plan) => {
                const isRoutedToApproval = plan.status === 'ROUTED_TO_APPROVAL';
                const isApproved = plan.status === 'APPROVED';

                return (
                  <div 
                    key={plan.id}
                    className="p-5 rounded-xl bg-[#0B0F17]/80 border border-white/[0.08] flex flex-col justify-between space-y-4 hover:border-cyan-500/30 transition-all shadow-xl"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {plan.id}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          isApproved 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : isRoutedToApproval 
                            ? 'bg-amber-500/20 text-amber-400' 
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {plan.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-3 leading-snug">
                        {plan.title}
                      </h4>

                      <div className="mt-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-1.5 text-xs">
                        <div className="text-slate-400 flex items-center justify-between">
                          <span>Origin Cluster:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[140px]">{plan.originCluster}</span>
                        </div>
                        <div className="text-slate-400 flex items-center justify-between">
                          <span>Destination Cluster:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[140px]">{plan.destinationCluster}</span>
                        </div>
                        <div className="text-slate-400 flex items-center justify-between">
                          <span>Proposed Mode:</span>
                          <span className="text-cyan-400 font-mono font-bold">{plan.proposedMode}</span>
                        </div>
                      </div>

                      {/* Savings Matrix */}
                      <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <div className="text-[10px] text-slate-400 uppercase">Net Cost Savings</div>
                          <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                            +${formatNumber(plan.netCostSavings)}
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <div className="text-[10px] text-slate-400 uppercase">Carbon Avoided</div>
                          <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
                            {formatNumber(plan.carbonSavingsKg)} kg
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                        {plan.rationale}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-white/[0.06] space-y-2">
                      <div className="text-[10px] text-slate-500 font-mono truncate" title={plan.sha256Seal}>
                        SHA-256: {plan.sha256Seal.slice(0, 16)}...
                      </div>

                      {plan.status === 'PROPOSED' && (
                        <button
                          onClick={async () => {
                            await dispatchConsolidationPlan(plan.id);
                            showToast(`Plan ${plan.id} dispatched to Approval Center under POL-LOG-001.`, 'warning');
                          }}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                        >
                          Dispatch to Approval Center
                        </button>
                      )}

                      {plan.status === 'ROUTED_TO_APPROVAL' && (
                        <button
                          onClick={async () => {
                            await approveConsolidationPlan(plan.id);
                            showToast(`Plan ${plan.id} approved. Multimodal bookings merged.`, 'success');
                          }}
                          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                        >
                          Executive Sign-off & Execute
                        </button>
                      )}

                      {plan.status === 'APPROVED' && (
                        <div className="text-center py-1.5 text-xs text-emerald-400 font-mono font-medium flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={13} />
                          <span>Consolidation Active & Dispatched</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SLIDE-OUT CONSIGNMENT INSPECTOR DRAWER                                     */}
      {/* ========================================================================= */}
      {isInspectorOpen && inspectorConsignment && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-[#0B0F17] border-l border-white/[0.1] h-full overflow-y-auto p-6 space-y-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex justify-between items-start border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {inspectorConsignment.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      B/L: {inspectorConsignment.consignmentNumber}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1.5">
                    {inspectorConsignment.title}
                  </h2>
                </div>
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Waypoint Details */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3 text-xs">
                <div className="font-semibold text-slate-200">Origin to Destination Routing</div>
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Origin:</span>
                    <span>{inspectorConsignment.origin.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Destination:</span>
                    <span>{inspectorConsignment.destination.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Carrier SCAC:</span>
                    <span className="text-cyan-400">{inspectorConsignment.carrierScac} ({inspectorConsignment.carrierName})</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Vessel / Flight:</span>
                    <span>{inspectorConsignment.vesselOrFlight}</span>
                  </div>
                </div>
              </div>

              {/* Cargo Specs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-slate-400 text-[10px] uppercase font-mono">Gross Weight</div>
                  <div className="text-base font-bold text-white font-mono mt-0.5">
                    {formatNumber(inspectorConsignment.totalWeightKg)} kg
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-slate-400 text-[10px] uppercase font-mono">Freight Linehaul</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    ${formatNumber(inspectorConsignment.freightCost)}
                  </div>
                </div>
              </div>

              {/* Demurrage Clock Breakdown */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
                <div className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Demurrage & Free Time Status</span>
                  <span className={inspectorConsignment.demurrageRisk.isAtRisk ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {inspectorConsignment.demurrageRisk.isAtRisk ? 'EXPOSURE WARNING' : 'CLEAR'}
                  </span>
                </div>
                <div className="text-slate-400 leading-relaxed text-xs">
                  {inspectorConsignment.demurrageRisk.chokePoint}
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-300 pt-1">
                  <span>Free Days Remaining:</span>
                  <span className="font-bold">{inspectorConsignment.demurrageRisk.freeTimeDaysRemaining} days</span>
                </div>
              </div>

              {/* Cryptographic Compliance */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5 text-xs font-mono">
                <div className="text-slate-400 text-[10px] uppercase">SHA-256 Tamper Seal</div>
                <div className="text-slate-300 break-all text-[11px] select-all">
                  {inspectorConsignment.policyCompliance.sha256Seal}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center gap-3">
              <button
                onClick={() => {
                  setRerouteConsignmentId(inspectorConsignment.id);
                  setShowRerouteModal(true);
                  setIsInspectorOpen(false);
                }}
                className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Trigger Emergency Reroute
              </button>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="py-2.5 px-5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BOOK / DISPATCH MULTIMODAL FREIGHT                                 */}
      {/* ========================================================================= */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#0B0F17] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Book Multimodal Freight Consignment</h3>
                <p className="text-xs text-slate-400">Direct booking with kernel state transition & POL-LOG-001 threshold check</p>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Consignment Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Silicon Wafer Expedite Batch #44"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/[0.1] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Freight Mode</label>
                  <select
                    value={bookMode}
                    onChange={(e) => setBookMode(e.target.value as FreightMode)}
                    className="w-full bg-black/50 border border-white/[0.1] text-white px-3 py-2 rounded-lg focus:outline-none"
                  >
                    <option value="AIR">Air Expedited</option>
                    <option value="OCEAN">Ocean Maritime</option>
                    <option value="ROAD_FTL">Dedicated Road FTL</option>
                    <option value="RAIL">Intermodal Rail</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Freight Expense ($ USD)</label>
                  <input
                    type="number"
                    value={bookCost}
                    onChange={(e) => setBookCost(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/[0.1] text-white px-3 py-2 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              {bookCost > 20000 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-start gap-2 text-xs">
                  <ShieldAlert size={16} className="flex-none mt-0.5" />
                  <div>
                    <span className="font-bold">POL-LOG-001 Policy Trigger:</span> Freight cost exceeds $20,000 threshold. Will be routed to the Unified Approval Center for Transportation Director sign-off.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Origin Hub</label>
                  <input
                    type="text"
                    value={bookOrigin}
                    onChange={(e) => setBookOrigin(e.target.value)}
                    className="w-full bg-black/50 border border-white/[0.1] text-white px-3 py-2 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Destination DC</label>
                  <input
                    type="text"
                    value={bookDest}
                    onChange={(e) => setBookDest(e.target.value)}
                    className="w-full bg-black/50 border border-white/[0.1] text-white px-3 py-2 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Cold Chain Toggle */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Require Cold-Chain IoT Monitoring</span>
                  <input
                    type="checkbox"
                    checked={bookColdChain}
                    onChange={(e) => setBookColdChain(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-black border-white/20"
                  />
                </div>

                {bookColdChain && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400">Min Temp (°C)</span>
                      <input
                        type="number"
                        value={bookMinTemp}
                        onChange={(e) => setBookMinTemp(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/[0.08] text-white px-2.5 py-1 rounded text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Max Temp (°C)</span>
                      <input
                        type="number"
                        value={bookMaxTemp}
                        onChange={(e) => setBookMaxTemp(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/[0.08] text-white px-2.5 py-1 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EMERGENCY REROUTE                                                  */}
      {/* ========================================================================= */}
      {showRerouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0B0F17] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shuffle size={16} className="text-amber-400" />
                  Execute Emergency Reroute Bypass
                </h3>
                <p className="text-xs text-slate-400">Bypass maritime congestion, port anchor queues, or customs holds</p>
              </div>
              <button onClick={() => setShowRerouteModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Consignment</label>
                <input
                  type="text"
                  disabled
                  value={rerouteConsignmentId}
                  className="w-full bg-black/40 border border-white/[0.08] text-slate-400 px-3 py-2 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Alternate Port / Route Name</label>
                <input
                  type="text"
                  value={rerouteNewPort}
                  onChange={(e) => setRerouteNewPort(e.target.value)}
                  className="w-full bg-black/50 border border-white/[0.1] text-white px-3 py-2 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Additional Expedite Cost ($)</label>
                  <input
                    type="number"
                    value={rerouteCost}
                    onChange={(e) => setRerouteCost(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/[0.1] text-white px-3 py-2 rounded-lg font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Estimated Delay Avoided</label>
                  <input
                    type="text"
                    disabled
                    value="4.2 Days Saved"
                    className="w-full bg-black/40 border border-white/[0.08] text-emerald-400 px-3 py-2 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reroute Justification</label>
                <input
                  type="text"
                  value={rerouteReason}
                  onChange={(e) => setRerouteReason(e.target.value)}
                  className="w-full bg-black/50 border border-white/[0.1] text-white px-3 py-2 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowRerouteModal(false)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReroute}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                Confirm Reroute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

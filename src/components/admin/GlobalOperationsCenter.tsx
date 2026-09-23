import React, { useState } from 'react';
import { 
  Building2, Globe, MapPin, Layers, Server, 
  ChevronRight, ChevronDown, Shield, CheckCircle2, 
  AlertTriangle, Filter, Search, Plus
} from 'lucide-react';
import { 
  enterpriseHierarchyService, 
  HierarchyNode, 
  HierarchyLevel 
} from '../../enterprise/hierarchy/EnterpriseHierarchyService';
import { useAuth } from '../../store/AuthContext';

export const GlobalOperationsCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['ent-global', 'org-na', 'org-emea', 'reg-na-east', 'reg-eu-central']));
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(() => {
    return enterpriseHierarchyService.getNode(tenantId, 'ent-global') || null;
  });

  const nodes = enterpriseHierarchyService.listNodes(tenantId);
  const summary = enterpriseHierarchyService.getHierarchySummary(tenantId);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredNodes = nodes.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'ALL' || n.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelBadgeColor = (level: HierarchyLevel) => {
    switch (level) {
      case 'ENTERPRISE': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'ORGANIZATION': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'REGION': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'COUNTRY': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'BUSINESS_UNIT': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'SITE': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'FACILITY': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  };

  // Render tree recursively
  const renderTree = (parentId?: string, depth = 0) => {
    const children = nodes.filter(n => n.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div className="space-y-1">
        {children.map(child => {
          const hasChildren = nodes.some(n => n.parentId === child.id);
          const isExpanded = expandedNodes.has(child.id);
          const isSelected = selectedNode?.id === child.id;

          return (
            <div key={child.id} className="text-xs">
              <div 
                onClick={() => setSelectedNode(child)}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                className={`flex items-center justify-between py-1.5 pr-2 rounded cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-[#00F2FE]/15 border border-[#00F2FE]/40 text-white' 
                    : 'hover:bg-white/5 text-os-text-secondary'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleExpand(child.id); }}
                      className="text-os-text-muted hover:text-white p-0.5"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  ) : (
                    <span className="w-3.5" />
                  )}
                  <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded border uppercase font-bold ${getLevelBadgeColor(child.level)}`}>
                    {child.level.substring(0, 3)}
                  </span>
                  <span className="truncate font-medium">{child.name}</span>
                  <span className="text-[10px] font-mono text-os-text-muted">({child.code})</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded ${
                    child.metadata.activeStatus === 'ACTIVE' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {child.metadata.activeStatus}
                  </span>
                </div>
              </div>

              {hasChildren && isExpanded && renderTree(child.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12" data-testid="global-operations-center">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">Global Operations Center</h1>
              <p className="text-xs text-os-text-muted font-mono">
                Canonical 7-Level Enterprise Hierarchy & Sovereign Multi-Site Governance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-[11px] font-mono bg-white/5 border border-os-border rounded text-os-text-secondary">
            Tenant: <strong className="text-[#00F2FE]">{tenantId}</strong>
          </span>
          <span className="px-2.5 py-1 text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded flex items-center gap-1.5">
            <CheckCircle2 size={12} /> STRICT ISOLATION VERIFIED
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'ENTERPRISES', count: summary.enterprisesCount, color: 'text-purple-400' },
          { label: 'ORGANIZATIONS', count: summary.organizationsCount, color: 'text-blue-400' },
          { label: 'REGIONS', count: summary.regionsCount, color: 'text-cyan-400' },
          { label: 'COUNTRIES', count: summary.countriesCount, color: 'text-emerald-400' },
          { label: 'BUSINESS UNITS', count: summary.businessUnitsCount, color: 'text-amber-400' },
          { label: 'SITES', count: summary.sitesCount, color: 'text-orange-400' },
          { label: 'FACILITIES', count: summary.facilitiesCount, color: 'text-rose-400' },
        ].map((card, i) => (
          <div key={i} className="p-3 bg-[#0d1117] border border-os-border rounded">
            <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">{card.label}</div>
            <div className={`text-xl font-bold font-mono mt-1 ${card.color}`}>{card.count}</div>
          </div>
        ))}
      </div>

      {/* Main Hierarchy Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tree View */}
        <div className="lg:col-span-2 bg-[#0d1117] border border-os-border rounded p-4 flex flex-col h-[640px]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-os-border shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-2.5 top-2.5 text-os-text-muted" />
                <input
                  type="text"
                  placeholder="Search hierarchy nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/40 border border-os-border rounded text-white focus:border-[#00F2FE] outline-none"
                />
              </div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-black/40 border border-os-border rounded text-os-text-secondary focus:border-[#00F2FE] outline-none"
              >
                <option value="ALL">All Levels</option>
                <option value="ENTERPRISE">Enterprise</option>
                <option value="ORGANIZATION">Organization</option>
                <option value="REGION">Region</option>
                <option value="COUNTRY">Country</option>
                <option value="BUSINESS_UNIT">Business Unit</option>
                <option value="SITE">Site</option>
                <option value="FACILITY">Facility</option>
              </select>
            </div>
            <span className="text-[11px] font-mono text-os-text-muted">
              {nodes.length} Total Nodes
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 pr-2">
            {searchQuery || selectedLevel !== 'ALL' ? (
              <div className="space-y-1">
                {filteredNodes.map(node => (
                  <div 
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer border ${
                      selectedNode?.id === node.id 
                        ? 'bg-[#00F2FE]/15 border-[#00F2FE]/40 text-white' 
                        : 'bg-black/20 border-os-border hover:bg-white/5 text-os-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded border uppercase font-bold ${getLevelBadgeColor(node.level)}`}>
                        {node.level}
                      </span>
                      <span className="font-medium text-xs">{node.name}</span>
                      <span className="text-[10px] font-mono text-os-text-muted">({node.code})</span>
                    </div>
                    <span className="text-[10px] font-mono text-os-text-muted">{node.path}</span>
                  </div>
                ))}
              </div>
            ) : (
              renderTree(undefined)
            )}
          </div>
        </div>

        {/* Right Col: Node Inspector */}
        <div className="bg-[#0d1117] border border-os-border rounded p-4 flex flex-col h-[640px] overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="border-b border-os-border pb-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded border font-bold uppercase ${getLevelBadgeColor(selectedNode.level)}`}>
                    {selectedNode.level}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {selectedNode.metadata.activeStatus}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-2">{selectedNode.name}</h2>
                <p className="text-xs font-mono text-os-text-muted">{selectedNode.code}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-black/40 border border-os-border rounded space-y-1">
                  <div className="text-[10px] font-mono text-os-text-muted uppercase">Canonical Path</div>
                  <div className="font-mono text-[#00F2FE] break-all text-[11px]">{selectedNode.path}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-black/40 border border-os-border rounded">
                    <div className="text-[10px] font-mono text-os-text-muted uppercase">Node ID</div>
                    <div className="font-mono text-white mt-0.5">{selectedNode.id}</div>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-os-border rounded">
                    <div className="text-[10px] font-mono text-os-text-muted uppercase">Parent ID</div>
                    <div className="font-mono text-white mt-0.5">{selectedNode.parentId || 'ROOT (None)'}</div>
                  </div>
                </div>

                {selectedNode.metadata.sovereignJurisdiction && (
                  <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded">
                    <div className="text-[10px] font-mono text-emerald-400 uppercase">Sovereign Jurisdiction</div>
                    <div className="font-mono text-white font-bold mt-0.5">{selectedNode.metadata.sovereignJurisdiction}</div>
                  </div>
                )}

                <div className="p-2.5 bg-black/40 border border-os-border rounded space-y-2">
                  <div className="text-[10px] font-mono text-os-text-muted uppercase">Node Metadata</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    {selectedNode.metadata.countryCode && (
                      <div><span className="text-os-text-muted">Country:</span> {selectedNode.metadata.countryCode}</div>
                    )}
                    {selectedNode.metadata.timezone && (
                      <div><span className="text-os-text-muted">TZ:</span> {selectedNode.metadata.timezone}</div>
                    )}
                    {selectedNode.metadata.currency && (
                      <div><span className="text-os-text-muted">Currency:</span> {selectedNode.metadata.currency}</div>
                    )}
                    {selectedNode.metadata.latitude !== undefined && (
                      <div><span className="text-os-text-muted">Coords:</span> {selectedNode.metadata.latitude}, {selectedNode.metadata.longitude}</div>
                    )}
                  </div>
                  {selectedNode.metadata.tags && selectedNode.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedNode.metadata.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="px-1.5 py-0.5 text-[9px] font-mono bg-white/5 border border-os-border rounded text-os-text-secondary">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subordinate Children */}
                <div className="p-2.5 bg-black/40 border border-os-border rounded">
                  <div className="text-[10px] font-mono text-os-text-muted uppercase mb-2">Direct Children ({enterpriseHierarchyService.getChildren(tenantId, selectedNode.id).length})</div>
                  <div className="space-y-1">
                    {enterpriseHierarchyService.getChildren(tenantId, selectedNode.id).map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => setSelectedNode(c)}
                        className="p-1.5 bg-black/20 hover:bg-white/5 rounded border border-os-border/50 flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-medium text-white">{c.name}</span>
                        <span className={`px-1 py-0.2 text-[8px] font-mono rounded ${getLevelBadgeColor(c.level)}`}>
                          {c.level}
                        </span>
                      </div>
                    ))}
                    {enterpriseHierarchyService.getChildren(tenantId, selectedNode.id).length === 0 && (
                      <div className="text-os-text-muted italic text-[11px]">No subordinate child nodes.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-os-text-muted text-xs">
              <Building2 size={32} className="mb-2 opacity-40" />
              Select a node from the hierarchy tree to inspect details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

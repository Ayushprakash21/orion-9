import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Filter, Plus, Building2, X, Trash2, Edit2, 
  Power, Globe, DollarSign, Clock, Users as UsersIcon, 
  Upload, Image as ImageIcon, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';
import { Organization } from '../../types/auth';

export const AdminOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { showToast } = useToast();
  const { refreshSession } = useAuth();

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);

  // Create Form State
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('Supply Chain / Logistics');
  const [newCountry, setNewCountry] = useState('India');
  const [newCurrency, setNewCurrency] = useState('INR');
  const [newTimezone, setNewTimezone] = useState('Asia/Kolkata');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [newLogoUrl, setNewLogoUrl] = useState<string>('');
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const createLogoInputRef = useRef<HTMLInputElement>(null);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [editTimezone, setEditTimezone] = useState('UTC');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editLogoUrl, setEditLogoUrl] = useState<string>('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const editLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = () => {
    setOrganizations(organizationService.getOrganizations());
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo file size must be less than 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isEdit) {
          setEditLogoUrl(result);
        } else {
          setNewLogoUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateCreate = () => {
    const errors: Record<string, string> = {};
    if (!newName.trim()) {
      errors.name = 'Organization Name is required';
    } else {
      const existing = organizationService.getOrganizationByName(newName.trim());
      if (existing) {
        errors.name = 'An organization with this name already exists';
      }
    }

    if (!newIndustry.trim()) errors.industry = 'Industry is required';
    if (!newCountry.trim()) errors.country = 'Country is required';

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreate()) return;

    try {
      organizationService.createOrganization({
        name: newName.trim(),
        industry: newIndustry.trim(),
        country: newCountry.trim(),
        currency: newCurrency,
        timezone: newTimezone,
        logoUrl: newLogoUrl.trim() || null,
        status: newStatus
      });

      showToast(`Organization '${newName.trim()}' created successfully.`, 'success');
      setIsCreateOpen(false);

      // Reset
      setNewName('');
      setNewIndustry('Supply Chain / Logistics');
      setNewCountry('India');
      setNewCurrency('INR');
      setNewTimezone('Asia/Kolkata');
      setNewStatus('active');
      setNewLogoUrl('');
      setCreateErrors({});

      loadOrganizations();
      await refreshSession();
    } catch (err: any) {
      showToast(err.message || 'Failed to create organization.', 'error');
    }
  };

  const openEditModal = (org: Organization) => {
    setEditingOrg(org);
    setEditName(org.name || '');
    setEditIndustry(org.industry || '');
    setEditCountry(org.country || '');
    setEditCurrency(org.currency || 'USD');
    setEditTimezone(org.timezone || 'UTC');
    setEditStatus((org.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive');
    setEditLogoUrl(org.logoUrl || org.logo || '');
    setEditErrors({});
  };

  const validateEdit = () => {
    const errors: Record<string, string> = {};
    if (!editName.trim()) {
      errors.name = 'Organization Name is required';
    } else if (editingOrg && editName.trim().toLowerCase() !== editingOrg.name.toLowerCase()) {
      const existing = organizationService.getOrganizationByName(editName.trim());
      if (existing && existing.id !== editingOrg.id) {
        errors.name = 'An organization with this name already exists';
      }
    }
    if (!editIndustry.trim()) errors.industry = 'Industry is required';
    if (!editCountry.trim()) errors.country = 'Country is required';

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    if (!validateEdit()) return;

    try {
      organizationService.updateOrganization(editingOrg.id, {
        name: editName.trim(),
        industry: editIndustry.trim(),
        country: editCountry.trim(),
        currency: editCurrency,
        timezone: editTimezone,
        logoUrl: editLogoUrl.trim() || null,
        logo: editLogoUrl.trim() || null,
        status: editStatus
      });

      showToast(`Organization '${editName.trim()}' updated successfully.`, 'success');
      setEditingOrg(null);
      loadOrganizations();
      await refreshSession();
    } catch (err: any) {
      showToast(err.message || 'Failed to update organization.', 'error');
    }
  };

  const toggleOrgStatus = async (org: Organization) => {
    const nextStatus = org.status === 'active' ? 'inactive' : 'active';
    try {
      organizationService.setOrganizationStatus(org.id, nextStatus);
      showToast(`Organization status changed to ${nextStatus}.`, 'success');
      loadOrganizations();
      await refreshSession();
    } catch (err: any) {
      showToast(err.message || 'Failed to update organization status.', 'error');
    }
  };

  const handleDeleteClick = (org: Organization) => {
    if (organizations.length <= 1) {
      showToast('Cannot delete the only remaining organization in the system.', 'error');
      return;
    }
    const users = userService.getUsers();
    const activeAssignedUsers = users.filter(u => u.organizationId === org.id && u.status === 'active');
    if (activeAssignedUsers.length > 0) {
      showToast('Cannot delete organization with active users. Reassign or remove users first.', 'error');
      return;
    }
    setDeletingOrg(org);
  };

  const confirmDelete = async () => {
    if (!deletingOrg) return;
    try {
      const success = organizationService.deleteOrganization(deletingOrg.id);
      if (success) {
        showToast('Organization deleted successfully.', 'success');
        setDeletingOrg(null);
        loadOrganizations();
        await refreshSession();
      } else {
        showToast('Failed to delete organization.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Cannot delete organization with active users. Reassign or remove users first.', 'error');
    }
  };

  // Filtered list
  const filteredOrganizations = organizations.filter(o => {
    const matchesSearch = 
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.industry && o.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.country && o.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.timezone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col relative">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight mb-2 text-[#F5F5F5]">Organizations</h1>
          <p className="text-sm text-[#A0A0A0]">Manage enterprise tenants, regional workspaces, and organization-level branding.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F6F6F]" />
            <input 
              type="text" 
              placeholder="Search organizations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 bg-[#0A0A0A] border border-[#2A2A2A] rounded-md py-2 pl-9 pr-4 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-md py-2 px-3 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button 
            id="btn-create-org-open"
            onClick={() => {
              setCreateErrors({});
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] text-[#0A0A0A] rounded-md text-sm font-medium hover:bg-white transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={16} /> <span>Create Organization</span>
          </button>
        </div>
      </div>
      
      {/* Organizations Table */}
      <div className="flex-1 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] overflow-hidden flex flex-col shadow-xl">
        {filteredOrganizations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-t border-[#2A2A2A]">
            <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#2A2A2A] flex items-center justify-center mb-4">
              <Building2 size={24} className="text-[#6F6F6F]" />
            </div>
            <h3 className="text-lg font-medium text-[#F5F5F5] mb-2">No organizations found</h3>
            <p className="text-[#A0A0A0] text-sm max-w-sm mb-6">
              There are no organizations matching your search criteria.
            </p>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-[#F5F5F5] text-[#0A0A0A] rounded text-sm font-medium hover:bg-white transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Create Organization
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#2A2A2A]">
              <thead className="bg-[#111111]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">Organization</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">Industry</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">Country</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">Users</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-[#0A0A0A] divide-y divide-[#2A2A2A]">
                {filteredOrganizations.map((org) => {
                  const userCount = organizationService.getOrganizationUserCount(org.id);

                  return (
                    <tr key={org.id} className="hover:bg-[#111111] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {/* Organization Custom Logo or Fallback Emblem */}
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[#1C1C1C] flex items-center justify-center border border-[#2A2A2A] overflow-hidden">
                            {org.logoUrl || org.logo ? (
                              <img 
                                src={org.logoUrl || org.logo || ''} 
                                alt={org.name} 
                                className="w-full h-full object-contain p-1" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center">
                                <Building2 size={16} className="text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-[#F5F5F5]">{org.name}</div>
                            <div className="text-xs text-[#6F6F6F] font-mono">
                              {org.currency} · {org.timezone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A0A0A0]">
                        {org.industry || 'Supply Chain / Logistics'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A0A0A0]">
                        <span className="flex items-center gap-1.5">
                          <Globe size={13} className="text-[#6F6F6F]" />
                          {org.country || 'Global'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-full bg-[#161616] text-[#A0A0A0] border border-[#2A2A2A]">
                          <UsersIcon size={12} className="text-[#6F6F6F]" />
                          {userCount} {userCount === 1 ? 'user' : 'users'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-1 inline-flex text-[11px] font-mono font-medium rounded-full",
                          org.status === 'active' 
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50" 
                            : "bg-neutral-900 text-neutral-400 border border-neutral-700/50"
                        )}>
                          {org.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <button 
                          onClick={() => openEditModal(org)} 
                          title="Edit Organization"
                          className="text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors p-1.5 rounded-md hover:bg-[#222222] inline-flex cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => toggleOrgStatus(org)}
                          title={org.status === 'active' ? 'Deactivate Organization' : 'Activate Organization'}
                          className={cn(
                            "transition-colors p-1.5 rounded-md inline-flex cursor-pointer",
                            org.status === 'active' 
                              ? "text-emerald-400 hover:bg-emerald-400/10" 
                              : "text-gray-400 hover:bg-gray-400/10"
                          )}
                        >
                          <Power size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(org)}
                          title="Delete Organization"
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors p-1.5 rounded-md inline-flex cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ORGANIZATION MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] shrink-0">
              <div>
                <h2 className="text-lg font-medium text-[#F5F5F5]">Create Organization</h2>
                <p className="text-xs text-[#A0A0A0]">Configure a new enterprise workspace, regional parameters, and logo.</p>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="text-[#6F6F6F] hover:text-[#F5F5F5] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrganization} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Organization Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Organization Name *</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => {
                    setNewName(e.target.value);
                    if (createErrors.name) setCreateErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Apex Global Logistics"
                  className={cn(
                    "w-full bg-[#111111] border rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none",
                    createErrors.name ? "border-red-500" : "border-[#2A2A2A] focus:border-[#555555]"
                  )}
                />
                {createErrors.name && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {createErrors.name}
                  </p>
                )}
              </div>

              {/* Industry & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Industry *</label>
                  <input 
                    type="text" 
                    value={newIndustry}
                    onChange={e => {
                      setNewIndustry(e.target.value);
                      if (createErrors.industry) setCreateErrors(prev => ({ ...prev, industry: '' }));
                    }}
                    placeholder="e.g. Supply Chain / Logistics"
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                  />
                  {createErrors.industry && (
                    <p className="text-xs text-red-400 mt-1">{createErrors.industry}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Country *</label>
                  <input 
                    type="text" 
                    value={newCountry}
                    onChange={e => {
                      setNewCountry(e.target.value);
                      if (createErrors.country) setCreateErrors(prev => ({ ...prev, country: '' }));
                    }}
                    placeholder="e.g. India, United States, Germany"
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                  />
                  {createErrors.country && (
                    <p className="text-xs text-red-400 mt-1">{createErrors.country}</p>
                  )}
                </div>
              </div>

              {/* Currency & Timezone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Currency *</label>
                  <select 
                    value={newCurrency}
                    onChange={e => setNewCurrency(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Timezone *</label>
                  <select 
                    value={newTimezone}
                    onChange={e => setNewTimezone(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Status *</label>
                <select 
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Organization Logo Section */}
              <div className="space-y-2 pt-3 border-t border-[#1C1C1C]">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0] flex items-center justify-between">
                  <span>Organization Logo</span>
                  <span className="text-[10px] text-[#6F6F6F]">distinct from application logo</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[#111111] border border-[#2A2A2A] flex items-center justify-center overflow-hidden shrink-0">
                    {newLogoUrl ? (
                      <img src={newLogoUrl} alt="Preview" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 size={20} className="text-[#555555]" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text" 
                      value={newLogoUrl}
                      onChange={e => setNewLogoUrl(e.target.value)}
                      placeholder="Paste Image URL or upload below..."
                      className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                    />
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => createLogoInputRef.current?.click()}
                        className="px-3 py-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-xs text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#222222] transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={12} /> Upload Image
                      </button>
                      {newLogoUrl && (
                        <button 
                          type="button"
                          onClick={() => setNewLogoUrl('')}
                          className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={createLogoInputRef}
                      onChange={e => handleLogoUpload(e, false)}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Submit / Cancel */}
              <div className="pt-4 border-t border-[#2A2A2A] flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-[#A0A0A0] hover:text-[#F5F5F5] text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  id="btn-create-org-submit"
                  type="submit"
                  className="px-5 py-2 bg-[#F5F5F5] text-[#0A0A0A] rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ORGANIZATION MODAL */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] shrink-0">
              <div>
                <h2 className="text-lg font-medium text-[#F5F5F5]">Edit Organization</h2>
                <p className="text-xs text-[#A0A0A0]">Update tenant parameters and organization branding.</p>
              </div>
              <button 
                onClick={() => setEditingOrg(null)} 
                className="text-[#6F6F6F] hover:text-[#F5F5F5] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateOrganization} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Organization Name *</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => {
                    setEditName(e.target.value);
                    if (editErrors.name) setEditErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={cn(
                    "w-full bg-[#111111] border rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none",
                    editErrors.name ? "border-red-500" : "border-[#2A2A2A] focus:border-[#555555]"
                  )}
                />
                {editErrors.name && (
                  <p className="text-xs text-red-400 mt-1">{editErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Industry *</label>
                  <input 
                    type="text" 
                    value={editIndustry}
                    onChange={e => setEditIndustry(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Country *</label>
                  <input 
                    type="text" 
                    value={editCountry}
                    onChange={e => setEditCountry(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Currency *</label>
                  <select 
                    value={editCurrency}
                    onChange={e => setEditCurrency(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Timezone *</label>
                  <select 
                    value={editTimezone}
                    onChange={e => setEditTimezone(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Status *</label>
                <select 
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Organization Logo Section */}
              <div className="space-y-2 pt-3 border-t border-[#1C1C1C]">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0] flex items-center justify-between">
                  <span>Organization Logo</span>
                  <span className="text-[10px] text-[#6F6F6F]">shown in organization profile</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[#111111] border border-[#2A2A2A] flex items-center justify-center overflow-hidden shrink-0">
                    {editLogoUrl ? (
                      <img src={editLogoUrl} alt="Preview" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 size={20} className="text-[#555555]" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text" 
                      value={editLogoUrl}
                      onChange={e => setEditLogoUrl(e.target.value)}
                      placeholder="Paste Image URL or upload below..."
                      className="w-full bg-[#111111] border border-[#2A2A2A] rounded p-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                    />
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => editLogoInputRef.current?.click()}
                        className="px-3 py-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-xs text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#222222] transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={12} /> Upload Image
                      </button>
                      {editLogoUrl && (
                        <button 
                          type="button"
                          onClick={() => setEditLogoUrl('')}
                          className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={editLogoInputRef}
                      onChange={e => handleLogoUpload(e, true)}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2A2A2A] flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setEditingOrg(null)}
                  className="px-4 py-2 text-[#A0A0A0] hover:text-[#F5F5F5] text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  id="btn-edit-org-submit"
                  type="submit"
                  className="px-5 py-2 bg-[#F5F5F5] text-[#0A0A0A] rounded text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/30 border border-red-900/50 flex items-center justify-center text-red-400 mb-2">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-medium text-[#F5F5F5]">Delete Organization</h3>
            <p className="text-sm text-[#A0A0A0]">
              Are you sure you want to delete <strong className="text-[#F5F5F5]">{deletingOrg.name}</strong>? 
              Any users assigned to this organization will be unassigned.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#2A2A2A]">
              <button 
                type="button"
                onClick={() => setDeletingOrg(null)}
                className="px-4 py-2 text-[#A0A0A0] hover:text-[#F5F5F5] text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-500 transition-colors cursor-pointer"
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

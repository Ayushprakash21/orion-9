import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Users as UsersIcon, X, Trash2, Edit2, 
  Key, Eye, EyeOff, Shield, Building2, CheckCircle, AlertCircle, Power 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { userService } from '../../services/userService';
import { organizationService } from '../../services/organizationService';
import { UserProfile, RoleCode, Organization } from '../../types/auth';

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  
  const { showToast } = useToast();
  const { refreshSession, user: currentAuthUser } = useAuth();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  // Create form state
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('Supply Chain Specialist');
  const [newDepartment, setNewDepartment] = useState('Operations');
  const [newRole, setNewRole] = useState<RoleCode>('user');
  const [newOrganizationId, setNewOrganizationId] = useState('');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Inline validation errors for Create Form
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRole, setEditRole] = useState<RoleCode>('user');
  const [editOrganizationId, setEditOrganizationId] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Reset password state
  const [resetPass, setResetPass] = useState('');
  const [resetPassConfirm, setResetPassConfirm] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    loadData().catch(() => {});
  }, []);

  const loadData = async () => {
    try {
      const loadedUsers = await userService.fetchUsersAsync();
      const loadedOrgs = await organizationService.fetchOrganizationsAsync();
      setUsers(loadedUsers);
      setOrganizations(loadedOrgs);
      
      // Set default organization for create form if empty
      if (!newOrganizationId && loadedOrgs.length > 0) {
        setNewOrganizationId(loadedOrgs[0].id);
      }
    } catch (err) {
      console.warn('AdminUsers loadData failed:', err);
    }
  };

  const validateCreateForm = () => {
    const errors: Record<string, string> = {};

    if (!newFullName.trim()) {
      errors.fullName = 'Full Name is required';
    }

    if (!newUsername.trim()) {
      errors.username = 'Username is required';
    } else if (newUsername.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else {
      const existing = userService.getUserByUsername(newUsername.trim());
      if (existing) {
        errors.username = 'Username already exists. Please choose another';
      }
    }

    if (!newPassword) {
      errors.password = 'Password is required';
    } else if (newPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!newConfirmPassword) {
      errors.confirmPassword = 'Confirm Password is required';
    } else if (newPassword !== newConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!newRole) {
      errors.role = 'Role is required';
    }

    if (!newEmail.trim()) {
      errors.email = 'Email is required';
    } else if (!newEmail.includes('@')) {
      errors.email = 'Enter a valid email address';
    }

    if (!newOrganizationId) {
      errors.organization = 'Organization is required';
    }

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    try {
      const selectedOrg = organizations.find(o => o.id === newOrganizationId);
      
      await userService.createUser({
        fullName: newFullName.trim(),
        displayName: newFullName.trim().split(' ')[0] || newUsername.trim(),
        username: newUsername.trim(),
        password: newPassword,
        email: newEmail.trim(),
        jobTitle: newJobTitle.trim() || 'Supply Chain Specialist',
        department: newDepartment.trim() || 'Operations',
        role: newRole,
        organizationId: newOrganizationId || (organizations[0]?.id || 'ORION_PLATFORM'),
        organizationName: selectedOrg ? selectedOrg.name : (organizations[0]?.name || 'ORION_PLATFORM'),
        status: newStatus
      });

      showToast('User created successfully.', 'success');
      setIsCreateOpen(false);
      
      // Reset form
      setNewFullName('');
      setNewUsername('');
      setNewPassword('');
      setNewConfirmPassword('');
      setNewEmail('');
      setNewJobTitle('Supply Chain Specialist');
      setNewDepartment('Operations');
      setNewRole('user');
      setNewStatus('active');
      setCreateErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);

      await loadData();
      await refreshSession();
    } catch (err: any) {
      showToast(err.message || 'Failed to create user.', 'error');
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditFullName(user.fullName || '');
    setEditDisplayName(user.displayName || '');
    setEditUsername(user.username || '');
    setEditEmail(user.email || '');
    setEditJobTitle(user.jobTitle || '');
    setEditDepartment(user.department || '');
    setEditRole(user.role || 'user');
    setEditOrganizationId(user.organizationId || (organizations[0]?.id || ''));
    setEditStatus((user.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive');
    setEditErrors({});
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};

    if (!editFullName.trim()) {
      errors.fullName = 'Full Name is required';
    }

    if (!editUsername.trim()) {
      errors.username = 'Username is required';
    } else if (editingUser && editUsername.trim().toLowerCase() !== editingUser.username.toLowerCase()) {
      const existing = userService.getUserByUsername(editUsername.trim());
      if (existing) {
        errors.username = 'Username already in use';
      }
    }

    if (!editOrganizationId) {
      errors.organization = 'Organization is required';
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!validateEditForm()) return;

    try {
      const selectedOrg = organizations.find(o => o.id === editOrganizationId);

      await userService.updateUser(editingUser.id, {
        fullName: editFullName.trim(),
        displayName: editDisplayName.trim() || editFullName.trim(),
        username: editUsername.trim(),
        email: editEmail.trim(),
        jobTitle: editJobTitle.trim(),
        department: editDepartment.trim(),
        role: editRole,
        organizationId: editOrganizationId,
        organizationName: selectedOrg ? selectedOrg.name : editingUser.organizationName,
        status: editStatus
      });

      showToast('User updated successfully.', 'success');
      setEditingUser(null);
      await loadData();
      await refreshSession();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user.', 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;

    if (!resetPass || resetPass.length < 8) {
      setResetError('Password must be at least 8 characters long.');
      return;
    }
    if (resetPass !== resetPassConfirm) {
      setResetError('Passwords do not match.');
      return;
    }

    try {
      await userService.resetPassword(resetPasswordUser.id, resetPass);
      showToast('Password updated successfully.', 'success');
      setResetPasswordUser(null);
      setResetPass('');
      setResetPassConfirm('');
      setResetError('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password.', 'error');
    }
  };

  const toggleUserStatus = async (user: UserProfile) => {
    if (user.username?.toLowerCase() === 'admin') {
      showToast('The primary administrator account cannot be deactivated.', 'error');
      return;
    }

    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await userService.setUserStatus(user.id, nextStatus);
      showToast(`User status changed to ${nextStatus}.`, 'success');
      await loadData();
      await refreshSession();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status.', 'error');
    }
  };

  const handleDeleteClick = (user: UserProfile) => {
    if (user.username?.toLowerCase() === 'admin') {
      showToast('The primary administrator cannot be deleted.', 'error');
      return;
    }
    setDeletingUser(user);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await userService.deleteUser(deletingUser.id);
      showToast('User deleted successfully.', 'success');
      setDeletingUser(null);
      await loadData();
      await refreshSession();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user.', 'error');
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesOrg = orgFilter === 'all' || u.organizationId === orgFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesOrg;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col relative">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight mb-2 text-os-text-primary">Users</h1>
          <p className="text-sm text-os-text-secondary">Manage enterprise user credentials, role access, and organization assignments.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-text-muted" />
            <input 
              type="text" 
              placeholder="Search user, org, role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 bg-os-bg border border-os-border rounded-md py-2 pl-9 pr-4 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-os-bg border border-os-border rounded-md py-2 px-3 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="organization_admin">Org Admin</option>
            <option value="platform_admin">Platform Admin</option>
          </select>

          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="bg-os-bg border border-os-border rounded-md py-2 px-3 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
          >
            <option value="all">All Organizations</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-os-bg border border-os-border rounded-md py-2 px-3 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button 
            id="btn-create-user-open"
            onClick={() => {
              setCreateErrors({});
              if (organizations.length > 0 && !newOrganizationId) {
                setNewOrganizationId(organizations[0].id);
              }
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-os-border-inverse text-os-text-primary-inverse rounded-md text-sm font-medium hover:opacity-90 transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={16} /> <span>Create User</span>
          </button>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="flex-1 rounded-lg border border-os-border bg-os-bg overflow-hidden flex flex-col shadow-xl">
        {filteredUsers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-os-surface border border-os-border flex items-center justify-center mb-4">
              <UsersIcon size={24} className="text-os-text-muted" />
            </div>
            <h3 className="text-lg font-medium text-os-text-primary mb-2">No users found</h3>
            <p className="text-os-text-secondary text-sm max-w-sm mb-6">
              There are no users matching your criteria. Try adjusting your search query or filters.
            </p>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-os-border-inverse text-os-text-primary-inverse rounded text-sm font-medium hover:opacity-90 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Create User
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#2A2A2A]">
              <thead className="bg-os-surface">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-os-text-secondary uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-os-text-secondary uppercase tracking-wider">Username</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-os-text-secondary uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-os-text-secondary uppercase tracking-wider">Organization</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-os-text-secondary uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-os-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-os-bg divide-y divide-[#2A2A2A]">
                {filteredUsers.map((user) => {
                  const assignedOrg = organizations.find(o => o.id === user.organizationId);
                  const displayOrgName = assignedOrg?.name || user.organizationName || 'Unassigned';

                  return (
                    <tr key={user.id} className="hover:bg-os-surface-hover transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-os-surface-elevated flex items-center justify-center border border-os-border text-xs font-medium text-os-text-primary">
                            {user.displayName?.substring(0,2).toUpperCase() || user.fullName?.substring(0,2).toUpperCase() || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-os-text-primary">{user.fullName || user.displayName}</div>
                            <div className="text-xs text-os-text-muted">{user.jobTitle || 'Staff'} • {user.department || 'Operations'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-os-text-secondary font-mono">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'platform_admin' ? (
                          <span className="px-2.5 py-1 inline-flex text-[11px] font-mono font-medium rounded-full bg-purple-950/40 text-purple-300 border border-purple-800/50">
                            Platform Admin
                          </span>
                        ) : user.role === 'manager' ? (
                          <span className="px-2.5 py-1 inline-flex text-[11px] font-mono font-medium rounded-full bg-blue-950/40 text-blue-300 border border-blue-800/50">
                            Manager
                          </span>
                        ) : user.role === 'organization_admin' ? (
                          <span className="px-2.5 py-1 inline-flex text-[11px] font-mono font-medium rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-800/50">
                            Org Admin
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 inline-flex text-[11px] font-mono font-medium rounded-full bg-neutral-900 text-neutral-300 border border-neutral-700/50">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-os-text-muted" />
                          <span className="text-sm font-medium text-os-text-primary">{displayOrgName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-1 inline-flex text-[11px] font-mono font-medium rounded-full",
                          user.status === 'active' 
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50" 
                            : "bg-neutral-900 text-neutral-400 border border-neutral-700/50"
                        )}>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <button 
                          onClick={() => openEditModal(user)}
                          title="Edit User"
                          className="text-os-text-secondary hover:text-os-text-primary transition-colors p-1.5 rounded-md hover:bg-os-surface-hover inline-flex cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setResetPasswordUser(user);
                            setResetPass('');
                            setResetPassConfirm('');
                            setResetError('');
                          }}
                          title="Reset Password"
                          className="text-amber-400 hover:text-amber-300 transition-colors p-1.5 rounded-md hover:bg-amber-400/10 inline-flex cursor-pointer"
                        >
                          <Key size={16} />
                        </button>
                        <button 
                          onClick={() => toggleUserStatus(user)}
                          title={user.username === 'admin' ? 'Primary administrator cannot be deactivated' : (user.status === 'active' ? 'Deactivate User' : 'Activate User')}
                          className={cn(
                            "transition-colors p-1.5 rounded-md inline-flex cursor-pointer",
                            user.username === 'admin' 
                              ? "text-emerald-500/50 cursor-not-allowed" 
                              : user.status === 'active' 
                                ? "text-emerald-400 hover:bg-emerald-400/10" 
                                : "text-gray-400 hover:bg-gray-400/10"
                          )}
                        >
                          <Power size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(user)}
                          title={user.username === 'admin' ? 'The primary administrator cannot be deleted' : 'Delete User'}
                          className={cn(
                            "transition-colors p-1.5 rounded-md inline-flex cursor-pointer",
                            user.username === 'admin' 
                              ? "text-neutral-600 hover:text-red-400" 
                              : "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          )}
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

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-os-bg border border-os-border rounded-xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-os-border shrink-0">
              <div>
                <h2 className="text-lg font-medium text-os-text-primary">Create User</h2>
                <p className="text-xs text-os-text-secondary">Provision new credentials and assign an enterprise organization.</p>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="text-os-text-muted hover:text-os-text-primary cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Full Name *</label>
                  <input 
                    type="text" 
                    value={newFullName}
                    onChange={(e) => {
                      setNewFullName(e.target.value);
                      if (createErrors.fullName) setCreateErrors(prev => ({ ...prev, fullName: '' }));
                    }}
                    placeholder="e.g. Kabir Sharma"
                    className={cn(
                      "w-full bg-os-surface border rounded p-2.5 text-sm text-os-text-primary focus:outline-none",
                      createErrors.fullName ? "border-red-500" : "border-os-border focus:border-os-border"
                    )}
                  />
                  {createErrors.fullName && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {createErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Username *</label>
                  <input 
                    type="text" 
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      if (createErrors.username) setCreateErrors(prev => ({ ...prev, username: '' }));
                    }}
                    placeholder="e.g. kabir"
                    className={cn(
                      "w-full bg-os-surface border rounded p-2.5 text-sm text-os-text-primary font-mono focus:outline-none",
                      createErrors.username ? "border-red-500" : "border-os-border focus:border-os-border"
                    )}
                  />
                  {createErrors.username && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {createErrors.username}
                    </p>
                  )}
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Password *</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (createErrors.password) setCreateErrors(prev => ({ ...prev, password: '' }));
                      }}
                      placeholder="Minimum 8 characters"
                      className={cn(
                        "w-full bg-os-surface border rounded p-2.5 pr-10 text-sm text-os-text-primary focus:outline-none",
                        createErrors.password ? "border-red-500" : "border-os-border focus:border-os-border"
                      )}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-os-text-muted hover:text-os-text-secondary"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {createErrors.password && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {createErrors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Confirm Password *</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={newConfirmPassword}
                      onChange={(e) => {
                        setNewConfirmPassword(e.target.value);
                        if (createErrors.confirmPassword) setCreateErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="Re-enter password"
                      className={cn(
                        "w-full bg-os-surface border rounded p-2.5 pr-10 text-sm text-os-text-primary focus:outline-none",
                        createErrors.confirmPassword ? "border-red-500" : "border-os-border focus:border-os-border"
                      )}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-os-text-muted hover:text-os-text-secondary"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {createErrors.confirmPassword && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {createErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Email</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. kabir@example.com"
                  className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                />
                {createErrors.email && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {createErrors.email}
                  </p>
                )}
              </div>

              {/* Job Title & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Job Title</label>
                  <input 
                    type="text" 
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="e.g. Supply Chain Specialist"
                    className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Department</label>
                  <input 
                    type="text" 
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="e.g. Operations"
                    className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                  />
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Role *</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as RoleCode)}
                    className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                  >
                    <option value="user">User (Standard Access)</option>
                    <option value="supply_chain_manager">Supply Chain Manager</option>
                    <option value="planner">Planner</option>
                    <option value="procurement_user">Procurement User</option>
                    <option value="inventory_user">Inventory User</option>
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="manager">Manager</option>
                    <option value="organization_admin">Organization Admin</option>
                    <option value="platform_admin">Platform Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Status *</label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Organization (MANDATORY SELECT) */}
              <div className="space-y-1 pt-2 border-t border-os-border">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary flex items-center justify-between">
                  <span>Organization *</span>
                  <span className="text-[10px] text-blue-400 lowercase font-mono">required for normal users</span>
                </label>
                {organizations.length === 0 ? (
                  <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded text-xs text-amber-300 flex items-center justify-between">
                    <span>No organizations available. Create an organization first.</span>
                    <a href="/admin/organizations" className="text-blue-400 underline font-medium ml-2">Organizations</a>
                  </div>
                ) : (
                  <div className="relative">
                    <select 
                      id="select-organization"
                      value={newOrganizationId}
                      onChange={(e) => {
                        setNewOrganizationId(e.target.value);
                        if (createErrors.organization) setCreateErrors(prev => ({ ...prev, organization: '' }));
                      }}
                      className={cn(
                        "w-full bg-os-surface border rounded p-2.5 text-sm text-os-text-primary focus:outline-none",
                        createErrors.organization ? "border-red-500" : "border-os-border focus:border-os-border"
                      )}
                    >
                      <option value="" disabled>Select an Organization...</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.country || 'Global'} · {org.industry || 'Logistics'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {createErrors.organization && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {createErrors.organization}
                  </p>
                )}
                <p className="text-[11px] text-os-text-muted mt-1">
                  Example organizations: Ayush Organization, Orion Logistics, Global Manufacturing, Demo Supply Chain.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-os-border flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-os-text-secondary hover:text-os-text-primary text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  id="btn-create-user-submit"
                  type="submit"
                  disabled={organizations.length === 0}
                  className="px-5 py-2 bg-os-border-inverse text-os-text-primary-inverse rounded text-sm font-medium hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-os-bg border border-os-border rounded-xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-os-border shrink-0">
              <div>
                <h2 className="text-lg font-medium text-os-text-primary">Edit User: {editingUser.fullName}</h2>
                <p className="text-xs text-os-text-secondary">Update profile, change role, or reassign organization.</p>
              </div>
              <button 
                onClick={() => setEditingUser(null)} 
                className="text-os-text-muted hover:text-os-text-primary cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Full Name *</label>
                  <input 
                    type="text" 
                    value={editFullName}
                    onChange={(e) => {
                      setEditFullName(e.target.value);
                      if (editErrors.fullName) setEditErrors(prev => ({ ...prev, fullName: '' }));
                    }}
                    className={cn(
                      "w-full bg-os-surface border rounded p-2.5 text-sm text-os-text-primary focus:outline-none",
                      editErrors.fullName ? "border-red-500" : "border-os-border focus:border-os-border"
                    )}
                  />
                  {editErrors.fullName && (
                    <p className="text-xs text-red-400 mt-1">{editErrors.fullName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Username *</label>
                  <input 
                    type="text" 
                    value={editUsername}
                    onChange={(e) => {
                      setEditUsername(e.target.value);
                      if (editErrors.username) setEditErrors(prev => ({ ...prev, username: '' }));
                    }}
                    className={cn(
                      "w-full bg-os-surface border rounded p-2.5 text-sm text-os-text-primary font-mono focus:outline-none",
                      editErrors.username ? "border-red-500" : "border-os-border focus:border-os-border"
                    )}
                  />
                  {editErrors.username && (
                    <p className="text-xs text-red-400 mt-1">{editErrors.username}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Job Title</label>
                  <input 
                    type="text" 
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Department</label>
                  <input 
                    type="text" 
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Email Address</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Role</label>
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as RoleCode)}
                    disabled={editingUser.username === 'admin'}
                    className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border disabled:opacity-50"
                  >
                    <option value="user">User</option>
                    <option value="supply_chain_manager">Supply Chain Manager</option>
                    <option value="planner">Planner</option>
                    <option value="procurement_user">Procurement User</option>
                    <option value="inventory_user">Inventory User</option>
                    <option value="viewer">Viewer</option>
                    <option value="manager">Manager</option>
                    <option value="organization_admin">Organization Admin</option>
                    <option value="platform_admin">Platform Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Status</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                    disabled={editingUser.username === 'admin'}
                    className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border disabled:opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Organization Assignment Field */}
              <div className="space-y-1 pt-2 border-t border-os-border">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary flex items-center justify-between">
                  <span>Assigned Organization *</span>
                  <span className="text-[10px] text-blue-400">immediately reflects in user profile</span>
                </label>
                <select 
                  id="edit-select-organization"
                  value={editOrganizationId}
                  onChange={(e) => {
                    setEditOrganizationId(e.target.value);
                    if (editErrors.organization) setEditErrors(prev => ({ ...prev, organization: '' }));
                  }}
                  className={cn(
                    "w-full bg-os-surface border rounded p-2.5 text-sm text-os-text-primary focus:outline-none",
                    editErrors.organization ? "border-red-500" : "border-os-border focus:border-os-border"
                  )}
                >
                  <option value="" disabled>Select Organization...</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.country || 'Global'})
                    </option>
                  ))}
                </select>
                {editErrors.organization && (
                  <p className="text-xs text-red-400 mt-1">{editErrors.organization}</p>
                )}
              </div>

              <div className="pt-4 border-t border-os-border flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-os-text-secondary hover:text-os-text-primary text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  id="btn-edit-user-submit"
                  type="submit"
                  className="px-5 py-2 bg-os-border-inverse text-os-text-primary-inverse rounded text-sm font-medium hover:opacity-90 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-os-bg border border-os-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-os-border">
              <div className="flex items-center gap-2">
                <Key className="text-amber-400" size={18} />
                <h2 className="text-lg font-medium text-os-text-primary">Reset Password</h2>
              </div>
              <button 
                onClick={() => setResetPasswordUser(null)} 
                className="text-os-text-muted hover:text-os-text-primary cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm text-os-text-secondary">
                Set a new password for <strong className="text-os-text-primary">{resetPasswordUser.fullName}</strong> (@{resetPasswordUser.username}).
              </p>

              {resetError && (
                <div className="p-3 bg-red-950/20 border border-red-900/40 rounded text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">New Password *</label>
                <div className="relative">
                  <input 
                    type={showResetPass ? 'text' : 'password'}
                    required
                    value={resetPass}
                    onChange={(e) => setResetPass(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-os-surface border border-os-border rounded p-2.5 pr-10 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowResetPass(!showResetPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-os-text-muted hover:text-os-text-secondary"
                  >
                    {showResetPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-os-text-secondary">Confirm New Password *</label>
                <input 
                  type={showResetPass ? 'text' : 'password'}
                  required
                  value={resetPassConfirm}
                  onChange={(e) => setResetPassConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                />
              </div>

              <div className="pt-4 border-t border-os-border flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 text-os-text-secondary hover:text-os-text-primary text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-black rounded text-sm font-medium hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-os-bg border border-os-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/30 border border-red-900/50 flex items-center justify-center text-red-400 mb-2">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-medium text-os-text-primary">Delete User</h3>
            <p className="text-sm text-os-text-secondary">
              Are you sure you want to delete user <strong className="text-os-text-primary">{deletingUser.fullName}</strong> (@{deletingUser.username})? This action will remove their credentials and active sessions.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-os-border">
              <button 
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-os-text-secondary hover:text-os-text-primary text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-500 transition-colors cursor-pointer"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
